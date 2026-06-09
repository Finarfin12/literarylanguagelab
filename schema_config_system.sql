-- =====================================================
-- CONFIG SYSTEM: AI Model/Provider Management
-- =====================================================
-- Version: 1.0
-- Created: 2026-06-09
-- Purpose: Runtime config untuk AI model/provider tanpa redeploy
-- =====================================================

-- =====================================================
-- SYSTEM CONFIG TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Everyone can read config (needed for API routes)
CREATE POLICY "Everyone can read system config"
  ON system_config FOR SELECT
  USING (true);

-- Only admins can update config
-- Note: Untuk MVP, bisa update via SQL editor
-- Nanti bisa ditambah admin role check
CREATE POLICY "Admins can update system config"
  ON system_config FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      -- Add admin role check di sini nanti
      -- AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- SEED INITIAL CONFIG
-- =====================================================

-- AI Model Configuration
INSERT INTO system_config (key, value, description) VALUES
(
  'ai_model',
  '{
    "provider": "groq",
    "model": "llama-3.3-70b-versatile",
    "temperature": 0.7,
    "max_tokens": 1500
  }'::jsonb,
  'Default AI model configuration for all API routes'
),
(
  'ai_model_lookup',
  '{
    "provider": "groq",
    "model": "llama-3.3-70b-versatile",
    "temperature": 0.3,
    "max_tokens": 1000
  }'::jsonb,
  'AI model for word lookup (lower temperature for consistency)'
),
(
  'ai_model_translation',
  '{
    "provider": "groq",
    "model": "llama-3.3-70b-versatile",
    "temperature": 0.5,
    "max_tokens": 1500
  }'::jsonb,
  'AI model for translation feedback'
),
(
  'ai_model_generation',
  '{
    "provider": "groq",
    "model": "llama-3.3-70b-versatile",
    "temperature": 0.8,
    "max_tokens": 2000
  }'::jsonb,
  'AI model for text generation (higher temperature for creativity)'
),
(
  'ai_model_tools',
  '{
    "provider": "groq",
    "model": "llama-3.3-70b-versatile",
    "temperature": 0.3,
    "max_tokens": 1500
  }'::jsonb,
  'AI model for dynamic tools'
)
ON CONFLICT (key) DO NOTHING;

-- Provider API Keys (stored as env var references, not actual keys)
INSERT INTO system_config (key, value, description) VALUES
(
  'ai_providers',
  '{
    "groq": {
      "enabled": true,
      "env_var": "GROQ_API_KEY",
      "models": [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "gemma2-9b-it"
      ]
    },
    "openai": {
      "enabled": false,
      "env_var": "OPENAI_API_KEY",
      "models": [
        "gpt-4o",
        "gpt-4o-mini"
      ]
    },
    "anthropic": {
      "enabled": false,
      "env_var": "ANTHROPIC_API_KEY",
      "models": [
        "claude-3-5-sonnet-20241022",
        "claude-3-5-haiku-20241022"
      ]
    }
  }'::jsonb,
  'Available AI providers and their models'
)
ON CONFLICT (key) DO NOTHING;

-- Feature Flags
INSERT INTO system_config (key, value, description) VALUES
(
  'features',
  '{
    "text_generation": true,
    "community_annotations": true,
    "glossary": true,
    "translation_memory": true,
    "gutenberg_explorer": true,
    "dynamic_tools": true,
    "gamification": true
  }'::jsonb,
  'Feature flags untuk enable/disable fitur'
)
ON CONFLICT (key) DO NOTHING;

-- Rate Limiting Config
INSERT INTO system_config (key, value, description) VALUES
(
  'rate_limits',
  '{
    "lookup": {
      "requests_per_minute": 30,
      "requests_per_hour": 500
    },
    "translation": {
      "requests_per_minute": 10,
      "requests_per_hour": 100
    },
    "generation": {
      "requests_per_minute": 5,
      "requests_per_hour": 50
    },
    "tools": {
      "requests_per_minute": 20,
      "requests_per_hour": 300
    }
  }'::jsonb,
  'Rate limits per feature per user'
)
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_config(key);

-- =====================================================
-- UPDATE TRIGGER
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_system_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER system_config_updated
  BEFORE UPDATE ON system_config
  FOR EACH ROW
  EXECUTE FUNCTION update_system_config_timestamp();

-- =====================================================
-- HELPER VIEWS
-- =====================================================

-- View untuk current AI model config
CREATE OR REPLACE VIEW current_ai_config AS
SELECT 
  key,
  value->>'provider' as provider,
  value->>'model' as model,
  (value->>'temperature')::numeric as temperature,
  (value->>'max_tokens')::integer as max_tokens
FROM system_config
WHERE key LIKE 'ai_model%';

-- =====================================================
-- USAGE EXAMPLES
-- =====================================================

-- Get default AI model config:
-- SELECT value FROM system_config WHERE key = 'ai_model';

-- Update AI model:
-- UPDATE system_config
-- SET value = '{"provider": "groq", "model": "gemma2-9b-it", "temperature": 0.7, "max_tokens": 1500}'::jsonb
-- WHERE key = 'ai_model';

-- Get specific model config (e.g., lookup):
-- SELECT value FROM system_config WHERE key = 'ai_model_lookup';

-- Check if feature enabled:
-- SELECT value->>'text_generation' FROM system_config WHERE key = 'features';

-- Get rate limit for lookup:
-- SELECT value->'lookup' FROM system_config WHERE key = 'rate_limits';

-- =====================================================
-- END OF CONFIG SYSTEM
-- =====================================================
