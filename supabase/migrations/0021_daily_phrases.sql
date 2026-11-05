-- Migration 0021: Frasa harian (Fase 22.4) + tipe soal "pattern" (Fase 22.1).
-- Aman dijalankan ulang. Bergantung pada 0002 (is_admin()) dan 0012 (exercises). Kode tetap jalan sebelum migrasi ini:
-- halaman /frasa-harian menampilkan "belum tersedia" dan soal tipe pattern belum bisa disimpan.
-- Semua frasa ditulis sendiri, berstatus DRAFT sampai ditinjau dan diterbitkan di Admin -> Konten -> Frasa.
-- Arti kata per kata (literal_id) hanya alat bantu memahami susunan kalimat, bukan terjemahan yang dianjurkan.
--
-- ROLLBACK:
--   DROP TABLE IF EXISTS daily_phrases;
--   -- tipe pattern: ALTER TABLE exercises DROP CONSTRAINT exercises_type_check; lalu pasang lagi tanpa 'pattern'
--   -- (hapus dulu baris exercises bertipe pattern).

-- 1. Tabel frasa harian
CREATE TABLE IF NOT EXISTS daily_phrases (
  slug TEXT PRIMARY KEY,
  situation TEXT NOT NULL,                 -- salam | angka-waktu | sopan-bantuan | belanja-makan | arah | darurat
  text_en TEXT NOT NULL,
  text_id TEXT NOT NULL,                   -- arti natural
  literal_id TEXT,                         -- arti kata per kata
  sort_order INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS daily_phrases_situation_idx ON daily_phrases (situation, sort_order);

ALTER TABLE daily_phrases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read published daily_phrases" ON daily_phrases;
CREATE POLICY "Authenticated read published daily_phrases" ON daily_phrases
  FOR SELECT TO authenticated USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage daily_phrases" ON daily_phrases;
CREATE POLICY "Admins manage daily_phrases" ON daily_phrases
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 2. Tipe soal baru: pattern (penyusun kalimat). Constraint lama (daftar lima tipe) diganti.
DO $do$
DECLARE
  c RECORD;
BEGIN
  IF to_regclass('public.exercises') IS NULL THEN
    RAISE NOTICE 'exercises belum ada (jalankan 0012 dulu): tipe pattern dilewati.';
    RETURN;
  END IF;
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.exercises'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%dictation%'
  LOOP
    EXECUTE format('ALTER TABLE public.exercises DROP CONSTRAINT %I', c.conname);
  END LOOP;
  ALTER TABLE public.exercises
    ADD CONSTRAINT exercises_type_check CHECK (type IN ('mcq', 'cloze', 'order', 'match', 'dictation', 'pattern'));
END
$do$;

-- 3. Frasa awal: 30 frasa untuk 6 situasi, semuanya draft (hanya bila tabel masih kosong)
INSERT INTO daily_phrases (slug, situation, text_en, text_id, literal_id, sort_order, status)
SELECT v.slug, v.situation, v.text_en, v.text_id, v.literal_id, v.sort_order, 'draft'
FROM (VALUES
  ('good-morning', 'salam', 'Good morning.', 'Selamat pagi.', 'Baik · pagi.', 1),
  ('how-are-you', 'salam', 'How are you?', 'Apa kabar?', 'Bagaimana · adalah · kamu?', 2),
  ('nice-to-meet-you', 'salam', 'Nice to meet you.', 'Senang bertemu denganmu.', 'Bagus · untuk · bertemu · kamu.', 3),
  ('see-you-later', 'salam', 'See you later.', 'Sampai jumpa nanti.', 'Lihat · kamu · nanti.', 4),
  ('have-a-nice-day', 'salam', 'Have a nice day.', 'Semoga harimu menyenangkan.', 'Punya · sebuah · bagus · hari.', 5),
  ('what-time-is-it', 'angka-waktu', 'What time is it?', 'Jam berapa sekarang?', 'Apa · waktu · adalah · itu?', 1),
  ('half-past-three', 'angka-waktu', 'It''s half past three.', 'Sekarang setengah empat (pukul 3.30).', 'Itu-adalah · setengah · lewat · tiga.', 2),
  ('my-phone-number-is', 'angka-waktu', 'My phone number is ...', 'Nomor teleponku adalah ...', 'Milik-saya · telepon · nomor · adalah ...', 3),
  ('today-is-monday', 'angka-waktu', 'Today is Monday.', 'Hari ini hari Senin.', 'Hari-ini · adalah · Senin.', 4),
  ('meeting-at-nine', 'angka-waktu', 'The meeting is at nine.', 'Rapatnya pukul sembilan.', 'Itu · rapat · adalah · pada · sembilan.', 5),
  ('excuse-me', 'sopan-bantuan', 'Excuse me.', 'Permisi. / Maaf mengganggu.', 'Maafkan · saya.', 1),
  ('could-you-help-me', 'sopan-bantuan', 'Could you help me, please?', 'Bisakah kamu membantuku?', 'Bisa · kamu · membantu · saya, · tolong?', 2),
  ('say-that-again', 'sopan-bantuan', 'Can you say that again?', 'Bisa diulangi lagi?', 'Bisa · kamu · mengatakan · itu · lagi?', 3),
  ('i-dont-understand', 'sopan-bantuan', 'I don''t understand.', 'Saya tidak mengerti.', 'Saya · tidak · mengerti.', 4),
  ('thank-you-very-much', 'sopan-bantuan', 'Thank you very much.', 'Terima kasih banyak.', 'Terima-kasih · kamu · sangat · banyak.', 5),
  ('how-much-is-this', 'belanja-makan', 'How much is this?', 'Berapa harganya?', 'Berapa · banyak · adalah · ini?', 1),
  ('id-like-some-water', 'belanja-makan', 'I''d like some water, please.', 'Saya mau air minum, tolong.', 'Saya-ingin · sedikit · air, · tolong.', 2),
  ('pay-by-card', 'belanja-makan', 'Can I pay by card?', 'Bisa bayar pakai kartu?', 'Bisa · saya · membayar · dengan · kartu?', 3),
  ('see-the-menu', 'belanja-makan', 'Could I see the menu?', 'Boleh saya lihat menunya?', 'Bisa · saya · melihat · itu · menu?', 4),
  ('the-bill-please', 'belanja-makan', 'The bill, please.', 'Minta tagihannya.', 'Itu · tagihan, · tolong.', 5),
  ('where-is-the-station', 'arah', 'Where is the station?', 'Stasiunnya di mana?', 'Di-mana · adalah · itu · stasiun?', 1),
  ('turn-left', 'arah', 'Turn left.', 'Belok kiri.', 'Belok · kiri.', 2),
  ('go-straight', 'arah', 'Go straight.', 'Jalan lurus.', 'Pergi · lurus.', 3),
  ('its-near-here', 'arah', 'It''s near here.', 'Dekat dari sini.', 'Itu-adalah · dekat · di-sini.', 4),
  ('how-far-is-it', 'arah', 'How far is it?', 'Seberapa jauh?', 'Bagaimana · jauh · adalah · itu?', 5),
  ('help', 'darurat', 'Help!', 'Tolong!', 'Tolong!', 1),
  ('i-need-a-doctor', 'darurat', 'I need a doctor.', 'Saya butuh dokter.', 'Saya · butuh · seorang · dokter.', 2),
  ('call-the-police', 'darurat', 'Call the police, please.', 'Tolong hubungi polisi.', 'Panggil · itu · polisi, · tolong.', 3),
  ('im-lost', 'darurat', 'I''m lost.', 'Saya tersesat.', 'Saya-adalah · tersesat.', 4),
  ('i-dont-feel-well', 'darurat', 'I don''t feel well.', 'Badan saya tidak enak.', 'Saya · tidak · merasa · sehat.', 5)
) AS v(slug, situation, text_en, text_id, literal_id, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM daily_phrases);

-- 4. Soal penyusun kalimat awal (draft; terbitkan setelah ditinjau di Admin -> Konten -> Latihan). Hanya sekali.
-- Data kurasi per soal: bentuk kata kerja ditulis tangan (bukan mesin konjugasi umum).
DO $do$
BEGIN
  IF to_regclass('public.exercises') IS NULL THEN
    RETURN;
  END IF;
  IF EXISTS (SELECT 1 FROM exercises WHERE tags @> ARRAY['seed-0021']) THEN
    RETURN;
  END IF;

  INSERT INTO exercises (type, cefr_level, topic_slug, unit_slug, tags, prompt, answer, explanation_id, status, source)
  SELECT 'pattern', 'A1', NULL, v.unit, ARRAY['seed-0021', 'pattern'], v.prompt::jsonb, v.answer::jsonb, v.expl, 'draft', 'admin'
  FROM (VALUES
    ('rutinitas-harian',
     '{"subjects":[{"text":"I","person":"i"},{"text":"You","person":"other"},{"text":"She","person":"sg3"},{"text":"They","person":"other"}],"verbs":[{"base":"eat","third":"eats","meaning_id":"makan"},{"base":"drink","third":"drinks","meaning_id":"minum"},{"base":"like","third":"likes","meaning_id":"suka"}],"objects":["rice","tea","milk"],"hint":"Dia (perempuan) makan nasi."}',
     '{"sentences":["She eats rice."]}',
     'Setelah she, he, atau it, kata kerja memakai -s: eat menjadi eats. Setelah I, you, we, dan they, kata kerja tetap bentuk dasar: I eat, they eat.'),
    ('rutinitas-harian',
     '{"subjects":[{"text":"I","person":"i"},{"text":"You","person":"other"},{"text":"He","person":"sg3"},{"text":"They","person":"other"}],"verbs":[{"base":"eat","third":"eats","meaning_id":"makan"},{"base":"drink","third":"drinks","meaning_id":"minum"},{"base":"like","third":"likes","meaning_id":"suka"}],"objects":["rice","tea","milk"],"hint":"Mereka minum teh."}',
     '{"sentences":["They drink tea."]}',
     'They memakai kata kerja bentuk dasar, tanpa -s: They drink tea. Bandingkan dengan He drinks tea.'),
    ('salam-perkenalan',
     '{"subjects":[{"text":"I","person":"i"},{"text":"You","person":"other"},{"text":"He","person":"sg3"},{"text":"She","person":"sg3"},{"text":"They","person":"other"}],"verbs":[{"base":"are","third":"is","first":"am","meaning_id":"adalah"}],"objects":["a student","from Bandung","happy"],"hint":"Saya seorang pelajar."}',
     '{"sentences":["I am a student."]}',
     'Verb to be berubah mengikuti subjek: I am, he/she/it is, you/we/they are.'),
    ('salam-perkenalan',
     '{"subjects":[{"text":"I","person":"i"},{"text":"You","person":"other"},{"text":"He","person":"sg3"},{"text":"She","person":"sg3"},{"text":"They","person":"other"}],"verbs":[{"base":"are","third":"is","first":"am","meaning_id":"adalah"}],"objects":["a student","from Bandung","happy"],"hint":"Dia (perempuan) berasal dari Bandung."}',
     '{"sentences":["She is from Bandung."]}',
     'Setelah she, verb to be-nya is: She is from Bandung.')
  ) AS v(unit, prompt, answer, expl);
END
$do$;
