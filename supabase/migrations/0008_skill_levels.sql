-- Fase 10 (v3): level per keterampilan dan Tes Naik Level.
-- Bergantung pada 0003 (ai_feature_routes), 0005, dan 0007 (core_words, texts.cefr_level).
-- Kode tetap jalan sebelum migrasi ini dijalankan: bukti tidak tercatat dan kartu level di profil disembunyikan.

-- 1. Bukti kemampuan per keterampilan
CREATE TABLE IF NOT EXISTS skill_evidence (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  skill TEXT NOT NULL CHECK (skill IN ('reading','vocabulary','grammar','listening','production')),
  source TEXT NOT NULL,        -- 'reader_quiz' | 'grammar_clinic' | 'writing_eval' | 'dialogue' | 'listening_test' | 'level_test' ...
  score REAL,                  -- 0..100 jika ada
  cefr_estimate TEXT,          -- jika sumber memberi estimasi level
  text_cefr TEXT,              -- level teks, untuk bukti membaca
  ref_id TEXT,                 -- id teks/sesi terkait
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_skill_evidence_user ON skill_evidence (user_id, skill, created_at DESC);

-- 2. Riwayat perubahan level
CREATE TABLE IF NOT EXISTS level_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  skill TEXT,                  -- NULL = level keseluruhan
  from_level TEXT,
  to_level TEXT NOT NULL,
  source TEXT NOT NULL,        -- 'placement' | 'level_test' | 'manual' | 'evidence'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_level_history_user ON level_history (user_id, created_at DESC);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skill_levels JSONB NOT NULL DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_level_test_at TIMESTAMPTZ;

-- 3. Sesi Tes Naik Level. Berisi kunci jawaban, jadi HANYA service role yang boleh mengaksesnya:
-- RLS aktif dan sengaja tanpa policy untuk pengguna biasa.
CREATE TABLE IF NOT EXISTS level_test_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  target_level TEXT NOT NULL,
  questions JSONB NOT NULL,    -- termasuk jawaban benar
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','passed','failed','expired')),
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_level_test_sessions_user ON level_test_sessions (user_id, created_at DESC);
ALTER TABLE level_test_sessions ENABLE ROW LEVEL SECURITY;

-- 4. RLS: pengguna hanya membaca dan menulis miliknya sendiri
ALTER TABLE skill_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Own skill_evidence select" ON skill_evidence;
CREATE POLICY "Own skill_evidence select" ON skill_evidence FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Own skill_evidence insert" ON skill_evidence;
CREATE POLICY "Own skill_evidence insert" ON skill_evidence FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Own level_history select" ON level_history;
CREATE POLICY "Own level_history select" ON level_history FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Own level_history insert" ON level_history;
CREATE POLICY "Own level_history insert" ON level_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Penguasaan kosakata inti per level untuk pengguna yang sedang login
-- (dikuasai = vocabulary.mastery_level >= 3). SECURITY INVOKER: RLS tabel vocabulary tetap berlaku.
CREATE OR REPLACE FUNCTION public.core_word_mastery()
RETURNS TABLE (cefr_estimate TEXT, total BIGINT, mastered BIGINT)
LANGUAGE sql STABLE SECURITY INVOKER AS $$
  SELECT c.cefr_estimate,
         COUNT(*) AS total,
         COUNT(v.id) FILTER (WHERE v.mastery_level >= 3) AS mastered
  FROM core_words c
  LEFT JOIN vocabulary v ON LOWER(v.word) = c.word AND v.user_id = auth.uid()
  GROUP BY c.cefr_estimate
$$;

-- 6. Aturan naik level (PRD 5.3). Bisa diubah admin lewat system_config.
INSERT INTO system_config (key, value)
VALUES (
  'level_rules',
  '{
    "reading":    { "minTexts": 5, "minAvgScore": 70 },
    "vocabulary": { "minMasteredPct": 80 },
    "production": { "minResults": 3 },
    "grammar":    { "minResults": 5, "minAvgScore": 70 },
    "listening":  { "minResults": 5, "minAvgScore": 70 },
    "test":       { "questionsPerSection": 3, "passTotalPct": 70, "minSectionPct": 50, "cooldownDays": 14, "expiresMinutes": 60 }
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- 7. Feature key AI baru (harus sama dengan lib/ai/features.ts); memakai model 'placement-test' bila ada.
INSERT INTO ai_feature_routes (feature_key, model_id)
SELECT 'level-test', model_id FROM ai_feature_routes WHERE feature_key = 'placement-test'
ON CONFLICT (feature_key) DO NOTHING;
