-- =====================================================
-- Migration 0003: AI Provider Registry (Fase 3)
-- Provider, model, dan routing per fitur yang dikelola admin tanpa deploy ulang.
-- Seluruh tabel hanya bisa diakses admin. Kode server membaca registry dengan
-- service role, dan kolom api_key_encrypted tidak pernah dikirim ke browser.
-- Bergantung pada 0001 (ai_usage_logs) dan 0002 (is_admin()).
-- =====================================================

CREATE TABLE IF NOT EXISTS ai_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('openai_compatible', 'anthropic')),
  base_url TEXT NOT NULL,
  api_key_encrypted TEXT,          -- AES-256-GCM, iv:tag:cipher (base64). NULL = pakai env bawaan
  api_key_hint TEXT,               -- tampilan aman untuk UI, mis. 'sk-…abcd'
  env_key_name TEXT,               -- mis. 'GROQ_API_KEY' untuk provider bawaan
  allow_private_network BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES ai_providers(id) ON DELETE CASCADE,
  model_id TEXT NOT NULL,          -- mis. 'qwen/qwen3.8-27b'
  label TEXT,
  capabilities TEXT[] NOT NULL DEFAULT '{text}',  -- text | vision | tools | stt | tts
  default_temperature REAL DEFAULT 0.7,
  default_max_tokens INT DEFAULT 1500,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (provider_id, model_id)
);

CREATE TABLE IF NOT EXISTS ai_feature_routes (
  feature_key TEXT PRIMARY KEY,    -- 'lookup', 'translation', 'ocr', 'reading-companion', ...
  model_id UUID REFERENCES ai_models(id) ON DELETE SET NULL,
  fallback_model_id UUID REFERENCES ai_models(id) ON DELETE SET NULL,
  temperature REAL,                -- NULL = pakai nilai dari route / default model
  max_tokens INT,
  mcp_server_ids UUID[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kolom tambahan untuk log pemakaian per request AI
ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS used_fallback BOOLEAN DEFAULT FALSE;

-- Rate limit hanya menghitung baris 'requested' (dicatat oleh checkRateLimit),
-- bukan baris detail hasil yang ditulis oleh runAI.
CREATE OR REPLACE FUNCTION count_recent_usage(
  target_user_id UUID,
  interval_text TEXT
)
RETURNS INTEGER AS $$
DECLARE
  usage_count INTEGER;
BEGIN
  IF target_user_id IS DISTINCT FROM auth.uid()
     AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Akses ditolak: tidak dapat membaca pemakaian pengguna lain.';
  END IF;

  SELECT COUNT(*)::INTEGER INTO usage_count
  FROM ai_usage_logs
  WHERE user_id = target_user_id
    AND status = 'requested'
    AND created_at >= (NOW() - interval_text::INTERVAL);
  RETURN usage_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RLS: admin-only
ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feature_routes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage ai_providers" ON ai_providers;
CREATE POLICY "Admins manage ai_providers" ON ai_providers
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins manage ai_models" ON ai_models;
CREATE POLICY "Admins manage ai_models" ON ai_models
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins manage ai_feature_routes" ON ai_feature_routes;
CREATE POLICY "Admins manage ai_feature_routes" ON ai_feature_routes
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =====================================================
-- Seed: provider bawaan Groq (memakai env GROQ_API_KEY) beserta modelnya.
-- Default temperature/max_tokens model teks diambil dari system_config.ai_model_tools
-- jika ada, agar perilaku route tetap sama seperti sebelum migrasi.
-- =====================================================
DO $$
DECLARE
  groq_id UUID;
  text_model UUID;
  vision_model UUID;
  tools_cfg JSONB;
  feature TEXT;
BEGIN
  SELECT id INTO groq_id FROM ai_providers WHERE env_key_name = 'GROQ_API_KEY' LIMIT 1;
  IF groq_id IS NULL THEN
    INSERT INTO ai_providers (name, type, base_url, env_key_name)
    VALUES ('Groq (env)', 'openai_compatible', 'https://api.groq.com/openai/v1', 'GROQ_API_KEY')
    RETURNING id INTO groq_id;
  END IF;

  IF to_regclass('public.system_config') IS NOT NULL THEN
    EXECUTE 'SELECT value FROM public.system_config WHERE key = $1' INTO tools_cfg USING 'ai_model_tools';
  END IF;

  INSERT INTO ai_models (provider_id, model_id, label, capabilities, default_temperature, default_max_tokens)
  VALUES (
    groq_id, 'openai/gpt-oss-120b', 'GPT OSS 120B', '{text,tools}',
    COALESCE((tools_cfg->>'temperature')::REAL, 0.3),
    COALESCE((tools_cfg->>'max_tokens')::INT, 1500)
  )
  ON CONFLICT (provider_id, model_id) DO NOTHING;

  INSERT INTO ai_models (provider_id, model_id, label, capabilities, default_temperature, default_max_tokens)
  VALUES (groq_id, 'qwen/qwen3.8-27b', 'Qwen 3.8 27B (vision)', '{text,vision,tools}', 0.2, 2000)
  ON CONFLICT (provider_id, model_id) DO NOTHING;

  INSERT INTO ai_models (provider_id, model_id, label, capabilities, default_temperature, default_max_tokens)
  VALUES (groq_id, 'whisper-large-v3-turbo', 'Whisper Large v3 Turbo', '{stt}', 0, 0)
  ON CONFLICT (provider_id, model_id) DO NOTHING;

  SELECT id INTO text_model FROM ai_models WHERE provider_id = groq_id AND model_id = 'openai/gpt-oss-120b';
  SELECT id INTO vision_model FROM ai_models WHERE provider_id = groq_id AND model_id = 'qwen/qwen3.8-27b';

  -- Harus sama dengan daftar di lib/ai/features.ts
  FOREACH feature IN ARRAY ARRAY[
    'alter-ego', 'analyze-difficulty', 'analyze-tone', 'comparator', 'dialogue-feedback',
    'dialogue-simulator', 'dynamic-tools', 'evaluate-listening', 'generate-quiz', 'generate-text',
    'grammar-clinic', 'grammar-mini-lesson', 'highlight-syntax', 'lexicon-translation', 'lingowise',
    'listening-quiz', 'listening-test', 'liter-ai', 'lookup', 'paraphrase-evaluate',
    'paraphrase-generate', 'parse-sentence', 'placement-test', 'reading-companion', 'simplify-text',
    'slang-decoder', 'story-quiz', 'tone-analyzer', 'translation', 'untranslatables',
    'vocab-analysis', 'wotd', 'writing-evaluate', 'writing-feedback'
  ] LOOP
    INSERT INTO ai_feature_routes (feature_key, model_id)
    VALUES (feature, text_model)
    ON CONFLICT (feature_key) DO NOTHING;
  END LOOP;

  INSERT INTO ai_feature_routes (feature_key, model_id)
  VALUES ('ocr', vision_model)
  ON CONFLICT (feature_key) DO NOTHING;
END $$;
