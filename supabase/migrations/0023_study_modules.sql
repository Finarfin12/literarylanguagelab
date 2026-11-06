-- Migration 0023: Modul Belajar (Fase 24).
-- Aman dijalankan ulang. Bergantung pada 0002 (is_admin()), 0003 (ai_feature_routes), dan 0012 (exercises).
-- Kode tetap jalan sebelum migrasi ini: halaman /modul menampilkan "belum tersedia"; flag `modul_belajar` default mati.
-- Semua isi pelajaran masuk sebagai DRAFT (scripts/import-modules.mjs atau Admin -> Konten -> Modul) dan baru
-- terlihat pengguna setelah ditinjau dan diterbitkan.
--
-- ROLLBACK:
--   DROP TABLE IF EXISTS lesson_simple_versions, lesson_tasks, lesson_progress, study_lessons, study_subjects CASCADE;
--   ALTER TABLE exercises DROP COLUMN IF EXISTS lesson_slug, DROP COLUMN IF EXISTS subject_slug;
--   DELETE FROM ai_feature_routes WHERE feature_key IN ('lesson-simplify', 'lesson-chat', 'lesson-draft');

-- 1. Mata pelajaran. `sort_order` unik: urutan belajar lintas tahap.
CREATE TABLE IF NOT EXISTS study_subjects (
  slug TEXT PRIMARY KEY,
  stage TEXT NOT NULL CHECK (stage IN ('fondasi', 'transisi', 'pendalaman', 'lanjut')),
  title TEXT NOT NULL,
  description_id TEXT NOT NULL DEFAULT '',
  outcomes JSONB NOT NULL DEFAULT '[]',     -- daftar kemampuan yang dicapai (teks)
  room_slug TEXT,                           -- ruang tempat mata pelajaran ini ditautkan
  sources JSONB NOT NULL DEFAULT '[]',      -- [{ title, url?, note?, status? }]
  sort_order INT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Pelajaran
CREATE TABLE IF NOT EXISTS study_lessons (
  slug TEXT PRIMARY KEY,
  subject_slug TEXT NOT NULL REFERENCES study_subjects(slug) ON DELETE CASCADE,
  sort_order INT NOT NULL,
  title TEXT NOT NULL,
  objectives JSONB NOT NULL DEFAULT '[]',
  body_md TEXT NOT NULL DEFAULT '',
  summary_md TEXT NOT NULL DEFAULT '',
  task JSONB,                               -- { prompt: string } atau null
  tool_paths TEXT[] NOT NULL DEFAULT '{}',  -- tombol "Praktikkan" (opsional)
  sources JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  origin TEXT NOT NULL DEFAULT 'claude' CHECK (origin IN ('claude', 'manual', 'ai')),
  edited_at TIMESTAMPTZ,                    -- diisi saat admin menyunting; impor tidak menimpa pelajaran yang sudah disunting
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS study_lessons_subject_idx ON study_lessons (subject_slug, sort_order);

-- 3. Soal latihan terkait pelajaran. Soal dengan subject_slug dan TANPA lesson_slug = kuis akhir mata pelajaran.
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS lesson_slug TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS subject_slug TEXT;
CREATE INDEX IF NOT EXISTS exercises_lesson_idx ON exercises (lesson_slug) WHERE lesson_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS exercises_subject_idx ON exercises (subject_slug) WHERE subject_slug IS NOT NULL;

-- 4. Progres dan jawaban tugas pribadi (milik sendiri; tugas tidak dinilai AI)
CREATE TABLE IF NOT EXISTS lesson_progress (
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  lesson_slug TEXT NOT NULL REFERENCES study_lessons(slug) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, lesson_slug)
);

CREATE TABLE IF NOT EXISTS lesson_tasks (
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  lesson_slug TEXT NOT NULL REFERENCES study_lessons(slug) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, lesson_slug)
);

-- 5. Versi "Jelaskan lebih sederhana": dibuat sekali (AI), dibaca semua pengguna login, ditulis lewat server
CREATE TABLE IF NOT EXISTS lesson_simple_versions (
  lesson_slug TEXT PRIMARY KEY REFERENCES study_lessons(slug) ON DELETE CASCADE,
  content TEXT NOT NULL,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. RLS
ALTER TABLE study_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_simple_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read published study_subjects" ON study_subjects;
CREATE POLICY "Authenticated read published study_subjects" ON study_subjects
  FOR SELECT TO authenticated USING (status = 'published' OR public.is_admin());
DROP POLICY IF EXISTS "Admins manage study_subjects" ON study_subjects;
CREATE POLICY "Admins manage study_subjects" ON study_subjects
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated read published study_lessons" ON study_lessons;
CREATE POLICY "Authenticated read published study_lessons" ON study_lessons
  FOR SELECT TO authenticated USING (status = 'published' OR public.is_admin());
DROP POLICY IF EXISTS "Admins manage study_lessons" ON study_lessons;
CREATE POLICY "Admins manage study_lessons" ON study_lessons
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users manage own lesson_progress" ON lesson_progress;
CREATE POLICY "Users manage own lesson_progress" ON lesson_progress
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own lesson_tasks" ON lesson_tasks;
CREATE POLICY "Users manage own lesson_tasks" ON lesson_tasks
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Versi sederhana: hanya baca untuk pengguna login; penulisan lewat service role di server (tanpa policy tulis)
DROP POLICY IF EXISTS "Authenticated read lesson_simple_versions" ON lesson_simple_versions;
CREATE POLICY "Authenticated read lesson_simple_versions" ON lesson_simple_versions
  FOR SELECT TO authenticated USING (true);

-- 7. Feature key AI (harus sama dengan lib/ai/features.ts). Dipakai untuk pendamping belajar dan draf admin;
-- pelajaran dan latihan itu sendiri tidak memanggil AI. Memakai model 'generate-text' bila ada.
INSERT INTO ai_feature_routes (feature_key, model_id)
SELECT k.feature_key, r.model_id
FROM (VALUES ('lesson-simplify'), ('lesson-chat'), ('lesson-draft')) AS k(feature_key)
JOIN ai_feature_routes r ON r.feature_key = 'generate-text'
ON CONFLICT (feature_key) DO NOTHING;
