-- Fase 16 (v4): Kursus Dasar (unit bertema A0-A2).
-- Bergantung pada 0002 (is_admin()), 0004 (system_config), dan 0012 (exercises; soal contoh unit).
-- Idempoten: aman dijalankan ulang. Kode tetap jalan sebelum migrasi ini dijalankan:
-- Kursus Dasar tersembunyi (sama dengan flag mati) dan /kursus menampilkan "Segera hadir".

-- 1. Unit & langkahnya. `steps` = daftar langkah bertipe (bentuk: lib/course.ts):
--    vocab {items:[{word,meaning_id?,definition_en?}]} · grammar {topic_slug} · read {text_id | content}
--    listen {text} · exercise {count?} (soal dengan unit_slug = slug unit) · speak {sentences[], scenario_id?}
CREATE TABLE IF NOT EXISTS course_units (
  slug TEXT PRIMARY KEY CHECK (slug ~ '^[a-z0-9-]{2,64}$'),
  title TEXT NOT NULL,
  cefr_level TEXT NOT NULL,                 -- 'A0' (pra-A1), 'A1', 'A2'
  sort_order INT NOT NULL,
  theme_id TEXT,                            -- kunci tema (untuk bacaan/skenario Fase 18)
  intro_id TEXT NOT NULL DEFAULT '',        -- pengantar bahasa Indonesia
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS course_units_order_idx ON course_units (sort_order);

-- 2. Progres per pengguna: step_index = jumlah langkah yang sudah selesai (indeks langkah berikutnya)
CREATE TABLE IF NOT EXISTS unit_progress (
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  unit_slug TEXT NOT NULL REFERENCES course_units(slug) ON DELETE CASCADE,
  step_index INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, unit_slug)
);

-- 3. RLS: unit terbit dibaca semua pengguna login (draft hanya admin); progres milik sendiri
ALTER TABLE course_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read published course_units" ON course_units;
CREATE POLICY "Authenticated read published course_units" ON course_units
  FOR SELECT USING (auth.uid() IS NOT NULL AND status = 'published');
DROP POLICY IF EXISTS "Admins manage course_units" ON course_units;
CREATE POLICY "Admins manage course_units" ON course_units
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Users manage own unit_progress" ON unit_progress;
CREATE POLICY "Users manage own unit_progress" ON unit_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. Kursus Dasar disembunyikan dari pengguna biasa sampai konten siap (Fase 18).
-- Ditulis HANYA jika key belum ada, supaya menjalankan ulang tidak mematikan flag yang sudah dinyalakan admin.
-- Admin menyalakannya di Admin -> Fitur (grup "Lainnya (non-AI)").
INSERT INTO system_config (key, value)
VALUES ('features', '{"kursus_dasar": false}'::jsonb)
ON CONFLICT (key) DO UPDATE
  SET value = system_config.value || '{"kursus_dasar": false}'::jsonb,
      updated_at = NOW()
  WHERE NOT (system_config.value ? 'kursus_dasar');

-- 5. Seed 12 unit. Judul, level, urutan, dan pengantar Indonesia ditulis di sini; langkah yang merujuk konten yang
-- belum ada (kata, bacaan, teks dengar, kalimat bicara) dibiarkan KOSONG sebagai placeholder dan ditandai
-- "belum tersedia" di pemutar; kontennya dibuat di Fase 18. Hanya unit "salam-perkenalan" diisi lengkap sebagai
-- contoh end-to-end (status terbit). Unit lain berstatus draft.
INSERT INTO course_units (slug, title, cefr_level, sort_order, theme_id, intro_id, steps, status)
SELECT v.slug, v.title, v.cefr_level, v.sort_order, v.theme_id, v.intro_id, v.steps::jsonb, v.status
FROM (VALUES
  ('bunyi-huruf', 'Bunyi & huruf', 'A0', 0, 'bunyi',
   'Mulai dari nol: kenali huruf, bunyi dasar, dan cara membaca kata sederhana. Penjelasan unit ini seluruhnya berbahasa Indonesia.',
   '[{"type":"vocab","title":"Kata pertama","items":[]},{"type":"read","title":"Baca pelan-pelan"},{"type":"listen","title":"Dengar bunyinya","text":""},{"type":"exercise","title":"Latihan bunyi"},{"type":"speak","title":"Ucapkan","sentences":[]}]',
   'draft'),
  ('salam-perkenalan', 'Salam & perkenalan', 'A1', 1, 'sapaan',
   'Belajar menyapa, menyebut nama dan asal, serta berkenalan dengan sopan. Pola utamanya: verb to be (am, is, are).',
   $j$[
     {"type":"vocab","title":"Kata untuk berkenalan","items":[
       {"word":"hello","meaning_id":"halo","definition_en":"a word you say when you meet someone"},
       {"word":"goodbye","meaning_id":"selamat tinggal","definition_en":"a word you say when you leave"},
       {"word":"name","meaning_id":"nama"},
       {"word":"nice","meaning_id":"menyenangkan"},
       {"word":"meet","meaning_id":"bertemu"},
       {"word":"from","meaning_id":"dari"},
       {"word":"student","meaning_id":"pelajar / mahasiswa"},
       {"word":"thank you","meaning_id":"terima kasih"}
     ]},
     {"type":"grammar","title":"Pola: verb to be","topic_slug":"to-be"},
     {"type":"read","title":"Bacaan: Hi, I am Ana","content":"Hi! My name is Ana.\n\nI am from Bandung. I am a student.\n\nThis is my friend Dani. He is from Medan. He is a student too.\n\nNice to meet you!","note_id":"Perhatikan: I am, My name is, He is. Semuanya memakai bentuk to be."},
     {"type":"listen","title":"Dengarkan perkenalan","text":"Hello! My name is Dani. I am from Medan. Nice to meet you.","note_id":"Dengarkan dua kali, lalu coba ulangi dengan suaramu."},
     {"type":"exercise","title":"Latihan unit","count":6},
     {"type":"speak","title":"Perkenalkan dirimu","sentences":["Hello, my name is Ana.","I am from Bandung.","Nice to meet you."],"scenario_id":"small-talk-neighbor"}
   ]$j$,
   'published'),
  ('angka-waktu-tanggal', 'Angka, waktu, tanggal', 'A1', 2, 'angka',
   'Menyebut angka, jam, hari, dan tanggal dalam bahasa Inggris, lengkap dengan kata depan at, on, in.',
   '[{"type":"vocab","items":[]},{"type":"grammar","topic_slug":"prepositions-place-time"},{"type":"read"},{"type":"listen","text":""},{"type":"exercise"},{"type":"speak","sentences":[]}]',
   'draft'),
  ('keluarga-orang', 'Keluarga & orang', 'A1', 3, 'keluarga',
   'Membicarakan keluarga, teman, dan ciri orang. Pola utamanya: kata ganti kepemilikan (my, your, his, her) dan bentuk jamak.',
   '[{"type":"vocab","items":[]},{"type":"grammar","topic_slug":"pronouns-possessives"},{"type":"read"},{"type":"listen","text":""},{"type":"exercise"},{"type":"speak","sentences":[]}]',
   'draft'),
  ('rumah-benda', 'Rumah & benda', 'A1', 4, 'rumah',
   'Menyebut benda di rumah dan di mana letaknya. Pola utamanya: a/an/the dan there is / there are.',
   '[{"type":"vocab","items":[]},{"type":"grammar","topic_slug":"there-is-are"},{"type":"read"},{"type":"listen","text":""},{"type":"exercise"},{"type":"speak","sentences":[]}]',
   'draft'),
  ('rutinitas-harian', 'Rutinitas harian', 'A1', 5, 'rutinitas',
   'Menceritakan kegiatan sehari-hari. Pola utamanya: present simple dan kata keterangan frekuensi (always, usually, never).',
   '[{"type":"vocab","items":[]},{"type":"grammar","topic_slug":"present-simple"},{"type":"read"},{"type":"listen","text":""},{"type":"exercise"},{"type":"speak","sentences":[]}]',
   'draft'),
  ('makanan-restoran', 'Makanan & restoran', 'A1', 6, 'makanan',
   'Memesan makanan dan minuman serta menyatakan selera. Pola utamanya: benda terhitung/tak terhitung (some, any, much, many).',
   '[{"type":"vocab","items":[]},{"type":"grammar","topic_slug":"countable-uncountable"},{"type":"read"},{"type":"listen","text":""},{"type":"exercise"},{"type":"speak","sentences":[],"scenario_id":"restaurant-order"}]',
   'draft'),
  ('belanja', 'Belanja', 'A2', 7, 'belanja',
   'Menanyakan harga, membandingkan barang, dan menawar dengan sopan. Pola utamanya: comparative dan superlative.',
   '[{"type":"vocab","items":[]},{"type":"grammar","topic_slug":"comparatives-superlatives"},{"type":"read"},{"type":"listen","text":""},{"type":"exercise"},{"type":"speak","sentences":[]}]',
   'draft'),
  ('arah-tempat', 'Arah & tempat', 'A2', 8, 'arah',
   'Bertanya dan memberi arah, menyebut tempat di kota. Pola utamanya: kata depan tempat dan present continuous.',
   '[{"type":"vocab","items":[]},{"type":"grammar","topic_slug":"present-continuous"},{"type":"read"},{"type":"listen","text":""},{"type":"exercise"},{"type":"speak","sentences":[]}]',
   'draft'),
  ('cerita-masa-lalu', 'Cerita masa lalu', 'A2', 9, 'masa-lalu',
   'Menceritakan kejadian kemarin atau liburan lalu. Pola utamanya: past simple (beraturan dan tak beraturan).',
   '[{"type":"vocab","items":[]},{"type":"grammar","topic_slug":"past-simple"},{"type":"read"},{"type":"listen","text":""},{"type":"exercise"},{"type":"speak","sentences":[]}]',
   'draft'),
  ('rencana-masa-depan', 'Rencana & masa depan', 'A2', 10, 'rencana',
   'Membicarakan rencana, janji, dan prediksi. Pola utamanya: going to dan will.',
   '[{"type":"vocab","items":[]},{"type":"grammar","topic_slug":"future-going-to-will"},{"type":"read"},{"type":"listen","text":""},{"type":"exercise"},{"type":"speak","sentences":[]}]',
   'draft'),
  ('pekerjaan-kampus', 'Pekerjaan & kampus', 'A2', 11, 'pekerjaan',
   'Membicarakan pekerjaan, kuliah, kewajiban, dan saran. Pola utamanya: must, have to, should dan can/could.',
   '[{"type":"vocab","items":[]},{"type":"grammar","topic_slug":"modals-obligation"},{"type":"read"},{"type":"listen","text":""},{"type":"exercise"},{"type":"speak","sentences":[],"scenario_id":"job-interview"}]',
   'draft')
) AS v(slug, title, cefr_level, sort_order, theme_id, intro_id, steps, status)
ON CONFLICT (slug) DO NOTHING;

-- 6. Soal contoh untuk unit "salam-perkenalan" (terbit). Hanya jika unit itu belum punya soal (idempoten).
-- Bentuk prompt/answer: lib/exercises/types.ts. Ditulis sendiri; bukan salinan buku teks.
INSERT INTO exercises (type, cefr_level, topic_slug, unit_slug, tags, prompt, answer, explanation_id, status, source)
SELECT e.type, 'A1', 'to-be', 'salam-perkenalan', ARRAY['unit-contoh'], e.prompt::jsonb, e.answer::jsonb, e.explanation_id, 'published', 'admin'
FROM (VALUES
  ('mcq',
   '{"question":"My name ___ Ana.","options":["am","is","are"]}',
   '{"correct":"is"}',
   'My name = benda tunggal (seperti it), jadi memakai is. Am hanya untuk I, dan are untuk you/we/they.'),
  ('cloze',
   '{"text":"I ___ from Bandung.","hint":"Saya berasal dari Bandung."}',
   '{"blanks":[["am"]]}',
   'Subjek I selalu berpasangan dengan am: I am from Bandung.'),
  ('order',
   '{"tokens":["is","name","My","Ana","."],"hint":"Nama saya Ana."}',
   '{"sentences":["My name is Ana."]}',
   'Urutannya: kata kepemilikan (My) + benda (name) + to be (is) + isi (Ana).'),
  ('match',
   '{"lefts":["Hello","Goodbye","Thank you"],"rights":["Selamat tinggal","Terima kasih","Halo"],"instruction":"Pasangkan ungkapan dengan artinya."}',
   '{"pairs":[{"left":"Hello","right":"Halo"},{"left":"Goodbye","right":"Selamat tinggal"},{"left":"Thank you","right":"Terima kasih"}]}',
   'Hello dipakai saat bertemu, goodbye saat berpisah, thank you untuk berterima kasih.'),
  ('dictation',
   '{"text":"Nice to meet you."}',
   '{"accept":["Nice to meet you."]}',
   'Nice to meet you dipakai saat pertama kali bertemu seseorang.'),
  ('cloze',
   '{"text":"She ___ a student. They ___ from Medan.","hint":"to be: am / is / are"}',
   '{"blanks":[["is"],["are"]]}',
   'She memakai is; They memakai are.')
) AS e(type, prompt, answer, explanation_id)
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE unit_slug = 'salam-perkenalan');
