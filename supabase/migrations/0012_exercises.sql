-- Fase 15 (v4): mesin latihan terstruktur + review grammar.
-- Bergantung pada 0002 (is_admin()), 0003 (ai_feature_routes), dan 0007 (grammar_topics).
-- Idempoten: aman dijalankan ulang. Kode tetap jalan sebelum migrasi ini dijalankan:
-- latihan terstruktur disembunyikan, status selesai topik grammar tetap di localStorage.

-- 1. Soal latihan (lima tipe: mcq, cloze, order, match, dictation). Bentuk prompt/answer: lib/exercises/types.ts.
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('mcq', 'cloze', 'order', 'match', 'dictation')),
  cefr_level TEXT NOT NULL,
  topic_slug TEXT REFERENCES grammar_topics(slug) ON DELETE SET NULL,
  unit_slug TEXT,                          -- diisi Fase 16 (Kursus Dasar)
  tags TEXT[] DEFAULT '{}',                -- mis. 'core-word', 'core:book', 'l1-error', 'minimal-pair' (Fase 17)
  prompt JSONB NOT NULL,
  answer JSONB NOT NULL,                   -- jawaban benar + alternatif yang diterima
  explanation_id TEXT NOT NULL,            -- penjelasan bahasa Indonesia
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  source TEXT NOT NULL DEFAULT 'admin',    -- 'admin' | 'ai'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS exercises_topic_status_idx ON exercises (topic_slug, status);
CREATE INDEX IF NOT EXISTS exercises_unit_status_idx ON exercises (unit_slug, status);
CREATE INDEX IF NOT EXISTS exercises_status_created_idx ON exercises (status, created_at DESC);

-- 2. Percobaan pengguna (dipakai memilih soal berikutnya: yang pernah salah diprioritaskan)
CREATE TABLE IF NOT EXISTS exercise_attempts (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises ON DELETE CASCADE,
  correct BOOLEAN NOT NULL,
  response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS exercise_attempts_user_exercise_idx ON exercise_attempts (user_id, exercise_id, created_at DESC);

-- 3. Kemajuan & jadwal review topik grammar (SM-2, sama dengan kosakata). Pengganti localStorage 'grammar_done_*'.
CREATE TABLE IF NOT EXISTS grammar_progress (
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  topic_slug TEXT NOT NULL REFERENCES grammar_topics(slug) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  interval INT DEFAULT 1,
  efactor REAL DEFAULT 2.5,
  repetitions INT DEFAULT 0,
  PRIMARY KEY (user_id, topic_slug)
);
CREATE INDEX IF NOT EXISTS grammar_progress_due_idx ON grammar_progress (user_id, next_review_at);

-- 4. RLS
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE grammar_progress ENABLE ROW LEVEL SECURITY;

-- Soal terbit dibaca semua pengguna login; draft dan semua penulisan hanya admin.
DROP POLICY IF EXISTS "Authenticated read published exercises" ON exercises;
CREATE POLICY "Authenticated read published exercises" ON exercises
  FOR SELECT USING (auth.uid() IS NOT NULL AND status = 'published');
DROP POLICY IF EXISTS "Admins manage exercises" ON exercises;
CREATE POLICY "Admins manage exercises" ON exercises
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Percobaan & kemajuan: milik sendiri.
DROP POLICY IF EXISTS "Users read own exercise attempts" ON exercise_attempts;
CREATE POLICY "Users read own exercise attempts" ON exercise_attempts
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users insert own exercise attempts" ON exercise_attempts;
CREATE POLICY "Users insert own exercise attempts" ON exercise_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own grammar progress" ON grammar_progress;
CREATE POLICY "Users manage own grammar progress" ON grammar_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. Feature key AI baru (harus sama dengan lib/ai/features.ts). Dipakai HANYA oleh admin untuk membuat draf soal;
-- latihan yang dikerjakan pengguna tidak memanggil AI. Memakai model 'generate-text' bila ada.
INSERT INTO ai_feature_routes (feature_key, model_id)
SELECT 'exercise-generate', model_id FROM ai_feature_routes WHERE feature_key = 'generate-text'
ON CONFLICT (feature_key) DO NOTHING;
