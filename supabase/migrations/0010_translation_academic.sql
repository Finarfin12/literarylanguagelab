-- Fase 11 (v3): jalur penerjemahan akademik.
-- Bergantung pada 0002 (is_admin()) dan 0003 (ai_feature_routes).
-- Kode tetap jalan sebelum migrasi ini dijalankan: halaman baru menampilkan pemberitahuan migrasi.

-- 1. Taksonomi teknik penerjemahan (disimpan sebagai data agar taksonomi lain bisa ditambah)
CREATE TABLE IF NOT EXISTS translation_techniques (
  taxonomy TEXT NOT NULL,          -- 'molina_hurtado_albir_2002'
  key TEXT NOT NULL,               -- 'modulation'
  name_en TEXT NOT NULL,
  name_id TEXT NOT NULL,
  definition_id TEXT NOT NULL,
  example TEXT,
  PRIMARY KEY (taxonomy, key)
);

-- 2. Proyek terjemahan dan segmennya
CREATE TABLE IF NOT EXISTS translation_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  source_text TEXT NOT NULL,
  brief TEXT,                      -- tujuan dan pembaca sasaran (skopos)
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_translation_projects_user ON translation_projects (user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS translation_segments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES translation_projects ON DELETE CASCADE,
  idx INT NOT NULL,
  source TEXT NOT NULL,
  target TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','done')),
  comment TEXT,                    -- komentar penerjemah
  UNIQUE (project_id, idx)
);

-- 3. Anotasi teknik pada pasangan frasa sumber-sasaran
CREATE TABLE IF NOT EXISTS technique_annotations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  segment_id UUID NOT NULL REFERENCES translation_segments ON DELETE CASCADE,
  source_span TEXT NOT NULL,
  target_span TEXT NOT NULL,
  technique_key TEXT NOT NULL,
  taxonomy TEXT NOT NULL DEFAULT 'molina_hurtado_albir_2002',
  suggested_by_ai BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_technique_annotations_segment ON technique_annotations (segment_id);

-- 4. Penilaian berbasis rubrik (proyek boleh kosong untuk penilaian dari Translation Workshop)
CREATE TABLE IF NOT EXISTS translation_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  project_id UUID REFERENCES translation_projects ON DELETE CASCADE,
  rubric TEXT NOT NULL DEFAULT 'nababan_2012',
  per_segment JSONB NOT NULL,      -- [{ idx, accuracy, acceptability, readability, notes }]
  weighted_score REAL NOT NULL,    -- 1..3
  assessed_by TEXT NOT NULL DEFAULT 'ai',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_translation_assessments_user ON translation_assessments (user_id, created_at DESC);

-- 5. RLS: pemilik saja; teknik dibaca semua pengguna login dan ditulis admin
ALTER TABLE translation_techniques ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE technique_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read translation_techniques" ON translation_techniques;
CREATE POLICY "Authenticated read translation_techniques" ON translation_techniques
  FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Admins manage translation_techniques" ON translation_techniques;
CREATE POLICY "Admins manage translation_techniques" ON translation_techniques
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Own translation_projects" ON translation_projects;
CREATE POLICY "Own translation_projects" ON translation_projects
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Own translation_segments" ON translation_segments;
CREATE POLICY "Own translation_segments" ON translation_segments
  FOR ALL
  USING (EXISTS (SELECT 1 FROM translation_projects p WHERE p.id = project_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM translation_projects p WHERE p.id = project_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS "Own technique_annotations" ON technique_annotations;
CREATE POLICY "Own technique_annotations" ON technique_annotations
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM translation_segments s JOIN translation_projects p ON p.id = s.project_id
    WHERE s.id = segment_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (
    SELECT 1 FROM translation_segments s JOIN translation_projects p ON p.id = s.project_id
    WHERE s.id = segment_id AND p.user_id = auth.uid()));

DROP POLICY IF EXISTS "Own translation_assessments" ON translation_assessments;
CREATE POLICY "Own translation_assessments" ON translation_assessments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. Feature key AI baru (harus sama dengan lib/ai/features.ts); memakai model 'translation' bila ada.
INSERT INTO ai_feature_routes (feature_key, model_id)
SELECT k, r.model_id
FROM (VALUES ('translation-rubric'), ('translation-technique-suggest')) AS v(k)
JOIN ai_feature_routes r ON r.feature_key = 'translation'
ON CONFLICT (feature_key) DO NOTHING;

-- 7. Seed 18 teknik penerjemahan menurut Molina & Hurtado Albir (2002).
-- Nama teknik mengikuti taksonomi tersebut; definisi dan contoh ditulis ulang secara ringkas
-- dalam bahasa Indonesia (bukan salinan dari buku).
INSERT INTO translation_techniques (taxonomy, key, name_en, name_id, definition_id, example) VALUES
  ('molina_hurtado_albir_2002', 'adaptation', 'Adaptation', 'Adaptasi',
   'Mengganti unsur budaya di teks sumber dengan unsur budaya sasaran yang fungsinya setara.',
   'baseball -> sepak bola'),
  ('molina_hurtado_albir_2002', 'amplification', 'Amplification', 'Amplifikasi',
   'Menambahkan keterangan atau detail yang tidak ada di teks sumber supaya maknanya jelas bagi pembaca sasaran.',
   'Ramadan -> bulan puasa Ramadan'),
  ('molina_hurtado_albir_2002', 'borrowing', 'Borrowing', 'Peminjaman',
   'Memakai kata dari bahasa sumber apa adanya, atau hanya disesuaikan ejaan dan lafalnya.',
   'lobby -> lobi'),
  ('molina_hurtado_albir_2002', 'calque', 'Calque', 'Kalke',
   'Menerjemahkan frasa asing bagian demi bagian sehingga terbentuk ungkapan baru di bahasa sasaran.',
   'skyscraper -> pencakar langit'),
  ('molina_hurtado_albir_2002', 'compensation', 'Compensation', 'Kompensasi',
   'Memindahkan efek gaya atau informasi yang tidak bisa dipertahankan di satu tempat ke bagian lain dalam teks.',
   'permainan kata yang hilang di kalimat pertama dimunculkan di kalimat berikutnya'),
  ('molina_hurtado_albir_2002', 'description', 'Description', 'Deskripsi',
   'Mengganti sebuah istilah dengan uraian tentang bentuk atau fungsinya.',
   'panettone -> kue tradisional Italia yang disantap saat Natal'),
  ('molina_hurtado_albir_2002', 'discursive_creation', 'Discursive creation', 'Kreasi diskursif',
   'Membuat padanan sementara yang tidak terduga dan hanya berlaku dalam konteks teks itu, sering dipakai pada judul.',
   'judul film diberi judul Indonesia yang sama sekali baru'),
  ('molina_hurtado_albir_2002', 'established_equivalent', 'Established equivalent', 'Padanan lazim',
   'Memakai istilah atau ungkapan yang sudah dikenal dan lazim sebagai padanan di bahasa sasaran.',
   'Thank you -> terima kasih'),
  ('molina_hurtado_albir_2002', 'generalization', 'Generalization', 'Generalisasi',
   'Memakai istilah yang lebih umum daripada istilah di teks sumber.',
   'penthouse -> apartemen'),
  ('molina_hurtado_albir_2002', 'linguistic_amplification', 'Linguistic amplification', 'Amplifikasi linguistik',
   'Menambah unsur kebahasaan supaya terjemahan terdengar wajar, misalnya pada penerjemahan lisan atau teks sulih suara.',
   'No way -> Tidak mungkin, itu mustahil'),
  ('molina_hurtado_albir_2002', 'linguistic_compression', 'Linguistic compression', 'Kompresi linguistik',
   'Menyatukan unsur kebahasaan agar terjemahan lebih ringkas, misalnya pada takarir atau teks sulih suara.',
   'Yes, so what? -> Lalu?'),
  ('molina_hurtado_albir_2002', 'literal_translation', 'Literal translation', 'Terjemahan harfiah',
   'Menerjemahkan kata demi kata tanpa mengubah susunan makna, selama hasilnya tetap wajar di bahasa sasaran.',
   'She is reading a book -> Dia sedang membaca buku'),
  ('molina_hurtado_albir_2002', 'modulation', 'Modulation', 'Modulasi',
   'Mengubah sudut pandang atau cara menyampaikan gagasan tanpa mengubah pesannya.',
   'It is not difficult to show -> Hal itu mudah ditunjukkan'),
  ('molina_hurtado_albir_2002', 'particularization', 'Particularization', 'Partikularisasi',
   'Memakai istilah yang lebih khusus daripada istilah di teks sumber.',
   'vehicle -> sepeda motor'),
  ('molina_hurtado_albir_2002', 'reduction', 'Reduction', 'Reduksi',
   'Menghilangkan informasi dari teks sumber yang dianggap tidak perlu bagi pembaca sasaran.',
   'the month of Ramadan -> Ramadan'),
  ('molina_hurtado_albir_2002', 'substitution', 'Substitution', 'Substitusi',
   'Mengganti unsur kebahasaan dengan unsur paralinguistik seperti gerak tubuh atau intonasi, atau sebaliknya.',
   'gerakan tangan di dada -> terima kasih'),
  ('molina_hurtado_albir_2002', 'transposition', 'Transposition', 'Transposisi',
   'Mengubah kelas kata atau struktur tata bahasa tanpa mengubah makna.',
   'She swam across the river -> Dia menyeberangi sungai dengan berenang'),
  ('molina_hurtado_albir_2002', 'variation', 'Variation', 'Variasi',
   'Mengubah unsur kebahasaan yang memengaruhi ragam bahasa, seperti nada, dialek, atau register.',
   'dialek tokoh -> bahasa sehari-hari yang kasual')
ON CONFLICT (taxonomy, key) DO NOTHING;
