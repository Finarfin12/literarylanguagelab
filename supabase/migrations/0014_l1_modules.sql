-- Fase 17 (v4): modul khas penutur Indonesia — Kesalahan Umum dan Pasangan Bunyi.
-- Bergantung pada 0002 (is_admin()) dan 0012 (exercises). Langkah unit Kursus Dasar hanya diperbarui bila 0013
-- sudah dijalankan. Idempoten: aman dijalankan ulang. Kode tetap jalan sebelum migrasi ini dijalankan:
-- kedua halaman menampilkan pemberitahuan migrasi.
-- Semua penjelasan ditulis sendiri dalam bahasa Indonesia (bukan salinan buku teks).

-- 1. Kesalahan umum penutur Indonesia
CREATE TABLE IF NOT EXISTS l1_errors (
  slug TEXT PRIMARY KEY CHECK (slug ~ '^[a-z0-9-]{2,64}$'),
  title TEXT NOT NULL,
  wrong TEXT NOT NULL,                    -- contoh kalimat yang salah
  "right" TEXT NOT NULL,                  -- perbaikannya
  explanation_id TEXT NOT NULL,           -- penjelasan bahasa Indonesia
  cefr_level TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

-- 2. Pasangan bunyi (minimal pairs)
CREATE TABLE IF NOT EXISTS minimal_pairs (
  slug TEXT PRIMARY KEY CHECK (slug ~ '^[a-z0-9-]{2,64}$'),
  word_a TEXT NOT NULL,
  word_b TEXT NOT NULL,
  ipa_a TEXT NOT NULL,
  ipa_b TEXT NOT NULL,
  note_id TEXT NOT NULL,                  -- catatan bahasa Indonesia
  sort_order INT NOT NULL DEFAULT 0
);

-- 3. RLS: dibaca semua pengguna login, ditulis admin
ALTER TABLE l1_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE minimal_pairs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read l1_errors" ON l1_errors;
CREATE POLICY "Authenticated read l1_errors" ON l1_errors FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Admins manage l1_errors" ON l1_errors;
CREATE POLICY "Admins manage l1_errors" ON l1_errors FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated read minimal_pairs" ON minimal_pairs;
CREATE POLICY "Authenticated read minimal_pairs" ON minimal_pairs FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Admins manage minimal_pairs" ON minimal_pairs;
CREATE POLICY "Admins manage minimal_pairs" ON minimal_pairs FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 4. Seed 16 kesalahan umum
INSERT INTO l1_errors (slug, title, wrong, "right", explanation_id, cefr_level, sort_order) VALUES
  ('agree', 'I am agree', 'I am agree with you.', 'I agree with you.', 'Agree adalah kata kerja, bukan kata sifat. Dalam bahasa Indonesia kita bilang "saya setuju" tanpa kata kerja bantu, dan begitu juga di bahasa Inggris: I agree. Am/is/are tidak dipakai di sini. Untuk menolak: I don''t agree.', 'A1', 1),
  ('third-person-s', 'Lupa -s untuk he/she/it', 'She work in a bank.', 'She works in a bank.', 'Di present simple, subjek he/she/it (orang ketiga tunggal) membuat kata kerja ditambah -s atau -es. Bahasa Indonesia tidak mengubah kata kerja menurut pelaku, jadi bentuk ini mudah terlupa. Setelah does/doesn''t kata kerja kembali ke bentuk dasar: Does she work here?', 'A1', 2),
  ('he-she', 'He dan she tertukar', 'My mother is a teacher. He works at a school.', 'My mother is a teacher. She works at a school.', 'Kata "dia" dalam bahasa Indonesia berlaku untuk laki-laki dan perempuan. Dalam bahasa Inggris pilih he untuk laki-laki, she untuk perempuan, dan it untuk benda atau hewan. Biasakan mengecek jenis orang yang dibicarakan sebelum memilih.', 'A1', 3),
  ('people-is', 'People is', 'People is very kind in my town.', 'People are very kind in my town.', 'People berarti banyak orang, jadi bentuknya jamak dan memakai are/were, bukan is/was. Hal yang sama berlaku untuk police, children, dan men. Kata person (satu orang) memakai is.', 'A2', 4),
  ('since-for', 'since dan for tertukar', 'I have lived here since three years.', 'I have lived here for three years.', 'Pakai for untuk lamanya waktu (for three years, for two hours) dan since untuk titik awal waktu (since 2020, since Monday). Keduanya sering dipakai dengan present perfect. Tanyakan pada diri sendiri: yang disebut lamanya, atau awalnya?', 'B1', 5),
  ('adjective-plural', 'Kata sifat diberi -s', 'She has two beautifuls dogs.', 'She has two beautiful dogs.', 'Kata sifat dalam bahasa Inggris tidak pernah berubah bentuk mengikuti kata bendanya. Yang diberi -s hanya kata benda: two beautiful dogs. Jangan menambah -s pada kata sifat.', 'A1', 6),
  ('adjective-order', 'Urutan kata sifat', 'She wears a red big hat.', 'She wears a big red hat.', 'Bila ada beberapa kata sifat, urutan umumnya: pendapat, ukuran, umur, bentuk, warna, asal, bahan, lalu kata benda. Jadi big (ukuran) sebelum red (warna): a big red hat. Ingat juga: semua kata sifat berada sebelum kata benda.', 'A2', 7),
  ('noun-adjective-order', 'Kata sifat setelah kata benda', 'I have a car red.', 'I have a red car.', 'Dalam bahasa Indonesia kata sifat ada sesudah kata benda (mobil merah). Dalam bahasa Inggris kata sifat berada sebelum kata benda: a red car. Susunannya dibalik.', 'A1', 8),
  ('missing-be', 'Lupa am/is/are', 'She very beautiful.', 'She is very beautiful.', 'Bahasa Indonesia boleh berkata "Dia sangat cantik" tanpa kata kerja. Bahasa Inggris wajib memakai to be (am/is/are) sebelum kata sifat atau kata benda: She is very beautiful.', 'A1', 9),
  ('plural-s', 'Lupa -s pada jamak', 'I have three book.', 'I have three books.', 'Bahasa Indonesia tidak menandai jamak pada kata benda (tiga buku). Bahasa Inggris menambah -s atau -es setelah angka lebih dari satu: three books, two boxes. Ada yang tidak beraturan, seperti child menjadi children.', 'A1', 10),
  ('there-is', '"Ada" menjadi have', 'In my house have three rooms.', 'There are three rooms in my house.', 'Kata "ada" yang menyatakan keberadaan tidak diterjemahkan dengan have. Pakai there is (satu atau tak terhitung) atau there are (jamak). Have dipakai untuk kepemilikan: I have three rooms.', 'A2', 11),
  ('informations', 'informations', 'I need some informations about the course.', 'I need some information about the course.', 'Information tidak bisa dihitung, jadi tidak dijamakkan dan tidak memakai a/an. Pakai some information, a piece of information, atau much information. Hal yang sama berlaku untuk advice, furniture, dan news.', 'A2', 12),
  ('very-like', 'very like', 'I very like this song.', 'I like this song very much.', 'Very menerangkan kata sifat atau kata keterangan (very good, very fast), bukan kata kerja. Untuk menguatkan kata kerja, letakkan very much di akhir: I like it very much, atau pakai really: I really like it.', 'A2', 13),
  ('discuss-about', 'discuss about', 'Let''s discuss about the plan.', 'Let''s discuss the plan.', 'Discuss sudah berarti "membicarakan", jadi langsung diikuti objek tanpa about. Bandingkan dengan talk about the plan. Kata kerja lain yang tidak memakai kata depan: mention, enter, reach, answer.', 'B1', 14),
  ('can-to', 'can to', 'She can to swim very well.', 'She can swim very well.', 'Setelah can/could/must/should kata kerja berbentuk dasar tanpa to dan tanpa -s, walaupun subjeknya she/he/it: She can swim. Bentuk to hanya muncul pada able to atau want to.', 'A2', 15),
  ('past-time-marker', 'Kata kerja tidak berubah di masa lalu', 'Yesterday I go to school by bus.', 'Yesterday I went to school by bus.', 'Bahasa Indonesia cukup memakai kata keterangan seperti "kemarin", sedangkan bahasa Inggris juga mengubah kata kerjanya: go menjadi went. Bila ceritanya sudah selesai di masa lalu, pakai past simple pada kata kerjanya.', 'A2', 16)
ON CONFLICT (slug) DO NOTHING;

-- 5. Seed 15 pasangan bunyi
INSERT INTO minimal_pairs (slug, word_a, word_b, ipa_a, ipa_b, note_id, sort_order) VALUES
  ('ship-sheep', 'ship', 'sheep', '/ʃɪp/', '/ʃiːp/', 'Bunyi i pendek (ship) dan i panjang (sheep). Orang Indonesia cenderung mengucapkan keduanya sama; tahan bunyi i lebih lama pada sheep.', 1),
  ('live-leave', 'live', 'leave', '/lɪv/', '/liːv/', 'i pendek dan longgar pada live, i panjang dan tegang pada leave. Jangan mengucapkan keduanya seperti "lif".', 2),
  ('full-fool', 'full', 'fool', '/fʊl/', '/fuːl/', 'u pendek dan longgar (full) berbeda dari u panjang (fool). Bibir lebih bulat dan bunyi lebih lama pada fool.', 3),
  ('bad-bed', 'bad', 'bed', '/bæd/', '/bed/', 'Bunyi a pada bad dibuat dengan mulut terbuka lebih lebar daripada e pada bed. Banyak penutur mengucapkan keduanya seperti "bed".', 4),
  ('cat-cut', 'cat', 'cut', '/kæt/', '/kʌt/', 'Bunyi a lebar (cat) berbeda dari bunyi a pendek yang santai di tengah mulut (cut), seperti a pada "apa" yang diucapkan cepat.', 5),
  ('think-sink', 'think', 'sink', '/θɪŋk/', '/sɪŋk/', 'Bunyi th (θ) dibuat dengan ujung lidah di antara gigi, bukan s. Latih: letakkan lidah di antara gigi lalu hembuskan udara.', 6),
  ('thing-sing', 'thing', 'sing', '/θɪŋ/', '/sɪŋ/', 'Sama seperti think dan sink: th (θ) memakai lidah di antara gigi, sedangkan s hanya desis di balik gigi.', 7),
  ('then-den', 'then', 'den', '/ðen/', '/den/', 'Bunyi th bersuara (ð) dibuat dengan lidah di antara gigi sambil bergetar; d memakai ujung lidah menempel di langit-langit.', 8),
  ('very-ferry', 'very', 'ferry', '/ˈveri/', '/ˈferi/', 'v memakai gigi atas menyentuh bibir bawah dengan suara bergetar; f sama tetapi tanpa getaran. Jangan mengganti v dengan f atau p.', 9),
  ('vine-wine', 'vine', 'wine', '/vaɪn/', '/waɪn/', 'v: gigi atas menyentuh bibir bawah. w: bibir dibulatkan tanpa menyentuh gigi.', 10),
  ('light-right', 'light', 'right', '/laɪt/', '/raɪt/', 'l: ujung lidah menempel di balik gigi atas. r bahasa Inggris: lidah melengkung ke belakang tanpa menyentuh langit-langit dan tidak digetarkan.', 11),
  ('cat-cap', 'cat', 'cap', '/kæt/', '/kæp/', 'Konsonan akhir t dan p harus terdengar jelas (tanpa letupan berlebihan). Dalam bahasa Indonesia konsonan akhir sering lemah, sehingga keduanya terdengar mirip.', 12),
  ('back-bag', 'back', 'bag', '/bæk/', '/bæɡ/', 'Bedakan k (tak bergetar) dan g (bergetar) di akhir kata. Letakkan jari di leher: pada bag terasa getaran.', 13),
  ('pen-pan', 'pen', 'pan', '/pen/', '/pæn/', 'Sama seperti bad dan bed: a lebar pada pan, e pada pen. Perhatikan bukaan mulut.', 14),
  ('sit-seat', 'sit', 'seat', '/sɪt/', '/siːt/', 'i pendek (sit) dan i panjang (seat). Tahan bunyi lebih lama pada seat; hati-hati karena sit dapat terdengar kasar bila salah.', 15)
ON CONFLICT (slug) DO NOTHING;

-- 6. Soal latihan (terbit; dinilai otomatis). Tag: 'l1-error' + 'l1:<slug>' + 'for:<unit>' untuk kesalahan umum,
-- 'minimal-pair' + 'mp:<slug>' + 'for:bunyi-huruf' untuk dikte pasangan bunyi. Hanya dibuat bila belum ada soal bertag itu.
INSERT INTO exercises (type, cefr_level, topic_slug, unit_slug, tags, prompt, answer, explanation_id, status, source)
SELECT 'mcq', v.cefr, NULL, NULL, string_to_array(v.tags, ','), v.prompt::jsonb, v.answer::jsonb, v.explanation_id, 'published', 'admin'
FROM (VALUES
  ('A1', 'l1-error,l1:agree,for:keluarga-orang', '{"question":"Pilih kalimat yang benar.","options":["I am agree with you.","I agree with you.","I am agree to you."]}', '{"correct":"I agree with you."}', 'Agree adalah kata kerja, bukan kata sifat. Dalam bahasa Indonesia kita bilang "saya setuju" tanpa kata kerja bantu, dan begitu juga di bahasa Inggris: I agree. Am/is/are tidak dipakai di sini. Untuk menolak: I don''t agree.'),
  ('A1', 'l1-error,l1:third-person-s,for:rutinitas-harian', '{"question":"Pilih kalimat yang benar.","options":["She work in a bank.","She works in a bank.","She is work in a bank."]}', '{"correct":"She works in a bank."}', 'Di present simple, subjek he/she/it (orang ketiga tunggal) membuat kata kerja ditambah -s atau -es. Bahasa Indonesia tidak mengubah kata kerja menurut pelaku, jadi bentuk ini mudah terlupa. Setelah does/doesn''t kata kerja kembali ke bentuk dasar: Does she work here?'),
  ('A1', 'l1-error,l1:he-she,for:keluarga-orang', '{"question":"Pilih kalimat yang benar.","options":["My mother is a teacher. He works at a school.","My mother is a teacher. She works at a school.","My mother is a teacher. It works at a school."]}', '{"correct":"My mother is a teacher. She works at a school."}', 'Kata "dia" dalam bahasa Indonesia berlaku untuk laki-laki dan perempuan. Dalam bahasa Inggris pilih he untuk laki-laki, she untuk perempuan, dan it untuk benda atau hewan. Biasakan mengecek jenis orang yang dibicarakan sebelum memilih.'),
  ('A2', 'l1-error,l1:people-is,for:keluarga-orang', '{"question":"Pilih kalimat yang benar.","options":["People is very kind in my town.","People are very kind in my town.","People was very kind in my town."]}', '{"correct":"People are very kind in my town."}', 'People berarti banyak orang, jadi bentuknya jamak dan memakai are/were, bukan is/was. Hal yang sama berlaku untuk police, children, dan men. Kata person (satu orang) memakai is.'),
  ('B1', 'l1-error,l1:since-for,for:cerita-masa-lalu', '{"question":"Pilih kalimat yang benar.","options":["I have lived here since three years.","I have lived here for three years.","I have lived here from three years."]}', '{"correct":"I have lived here for three years."}', 'Pakai for untuk lamanya waktu (for three years, for two hours) dan since untuk titik awal waktu (since 2020, since Monday). Keduanya sering dipakai dengan present perfect. Tanyakan pada diri sendiri: yang disebut lamanya, atau awalnya?'),
  ('A1', 'l1-error,l1:adjective-plural,for:rumah-benda', '{"question":"Pilih kalimat yang benar.","options":["She has two beautifuls dogs.","She has two beautiful dogs.","She has two beautifuls dog."]}', '{"correct":"She has two beautiful dogs."}', 'Kata sifat dalam bahasa Inggris tidak pernah berubah bentuk mengikuti kata bendanya. Yang diberi -s hanya kata benda: two beautiful dogs. Jangan menambah -s pada kata sifat.'),
  ('A2', 'l1-error,l1:adjective-order,for:rumah-benda', '{"question":"Pilih kalimat yang benar.","options":["She wears a red big hat.","She wears a big red hat.","She wears a hat big red."]}', '{"correct":"She wears a big red hat."}', 'Bila ada beberapa kata sifat, urutan umumnya: pendapat, ukuran, umur, bentuk, warna, asal, bahan, lalu kata benda. Jadi big (ukuran) sebelum red (warna): a big red hat. Ingat juga: semua kata sifat berada sebelum kata benda.'),
  ('A1', 'l1-error,l1:noun-adjective-order,for:rumah-benda', '{"question":"Pilih kalimat yang benar.","options":["I have a car red.","I have a red car.","I have red a car."]}', '{"correct":"I have a red car."}', 'Dalam bahasa Indonesia kata sifat ada sesudah kata benda (mobil merah). Dalam bahasa Inggris kata sifat berada sebelum kata benda: a red car. Susunannya dibalik.'),
  ('A1', 'l1-error,l1:missing-be,for:keluarga-orang', '{"question":"Pilih kalimat yang benar.","options":["She very beautiful.","She is very beautiful.","She are very beautiful."]}', '{"correct":"She is very beautiful."}', 'Bahasa Indonesia boleh berkata "Dia sangat cantik" tanpa kata kerja. Bahasa Inggris wajib memakai to be (am/is/are) sebelum kata sifat atau kata benda: She is very beautiful.'),
  ('A1', 'l1-error,l1:plural-s,for:rumah-benda', '{"question":"Pilih kalimat yang benar.","options":["I have three book.","I have three books.","I have three bookes."]}', '{"correct":"I have three books."}', 'Bahasa Indonesia tidak menandai jamak pada kata benda (tiga buku). Bahasa Inggris menambah -s atau -es setelah angka lebih dari satu: three books, two boxes. Ada yang tidak beraturan, seperti child menjadi children.'),
  ('A2', 'l1-error,l1:there-is,for:rumah-benda', '{"question":"Pilih kalimat yang benar.","options":["In my house have three rooms.","There are three rooms in my house.","In my house there is three rooms."]}', '{"correct":"There are three rooms in my house."}', 'Kata "ada" yang menyatakan keberadaan tidak diterjemahkan dengan have. Pakai there is (satu atau tak terhitung) atau there are (jamak). Have dipakai untuk kepemilikan: I have three rooms.'),
  ('A2', 'l1-error,l1:informations,for:belanja', '{"question":"Pilih kalimat yang benar.","options":["I need some informations about the course.","I need some information about the course.","I need many informations about the course."]}', '{"correct":"I need some information about the course."}', 'Information tidak bisa dihitung, jadi tidak dijamakkan dan tidak memakai a/an. Pakai some information, a piece of information, atau much information. Hal yang sama berlaku untuk advice, furniture, dan news.'),
  ('A2', 'l1-error,l1:very-like,for:makanan-restoran', '{"question":"Pilih kalimat yang benar.","options":["I very like this song.","I like this song very much.","I am very like this song."]}', '{"correct":"I like this song very much."}', 'Very menerangkan kata sifat atau kata keterangan (very good, very fast), bukan kata kerja. Untuk menguatkan kata kerja, letakkan very much di akhir: I like it very much, atau pakai really: I really like it.'),
  ('B1', 'l1-error,l1:discuss-about,for:pekerjaan-kampus', '{"question":"Pilih kalimat yang benar.","options":["Let''s discuss about the plan.","Let''s discuss the plan.","Let''s discuss on the plan."]}', '{"correct":"Let''s discuss the plan."}', 'Discuss sudah berarti "membicarakan", jadi langsung diikuti objek tanpa about. Bandingkan dengan talk about the plan. Kata kerja lain yang tidak memakai kata depan: mention, enter, reach, answer.'),
  ('A2', 'l1-error,l1:can-to,for:pekerjaan-kampus', '{"question":"Pilih kalimat yang benar.","options":["She can to swim very well.","She can swim very well.","She cans swim very well."]}', '{"correct":"She can swim very well."}', 'Setelah can/could/must/should kata kerja berbentuk dasar tanpa to dan tanpa -s, walaupun subjeknya she/he/it: She can swim. Bentuk to hanya muncul pada able to atau want to.'),
  ('A2', 'l1-error,l1:past-time-marker,for:cerita-masa-lalu', '{"question":"Pilih kalimat yang benar.","options":["Yesterday I go to school by bus.","Yesterday I went to school by bus.","Yesterday I going to school by bus."]}', '{"correct":"Yesterday I went to school by bus."}', 'Bahasa Indonesia cukup memakai kata keterangan seperti "kemarin", sedangkan bahasa Inggris juga mengubah kata kerjanya: go menjadi went. Bila ceritanya sudah selesai di masa lalu, pakai past simple pada kata kerjanya.')
) AS v(cefr, tags, prompt, answer, explanation_id)
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE 'l1-error' = ANY(tags));

INSERT INTO exercises (type, cefr_level, topic_slug, unit_slug, tags, prompt, answer, explanation_id, status, source)
SELECT 'dictation', 'A1', NULL, NULL, string_to_array(v.tags, ','), v.prompt::jsonb, v.answer::jsonb, v.explanation_id, 'published', 'admin'
FROM (VALUES
  ('minimal-pair,mp:ship-sheep,for:bunyi-huruf', '{"text":"sheep"}', '{"accept":["sheep"]}', 'Kata yang dibacakan: "sheep" /ʃiːp/. Pasangan bunyinya: ship /ʃɪp/ dan sheep /ʃiːp/. Bunyi i pendek (ship) dan i panjang (sheep). Orang Indonesia cenderung mengucapkan keduanya sama; tahan bunyi i lebih lama pada sheep.'),
  ('minimal-pair,mp:live-leave,for:bunyi-huruf', '{"text":"leave"}', '{"accept":["leave"]}', 'Kata yang dibacakan: "leave" /liːv/. Pasangan bunyinya: live /lɪv/ dan leave /liːv/. i pendek dan longgar pada live, i panjang dan tegang pada leave. Jangan mengucapkan keduanya seperti "lif".'),
  ('minimal-pair,mp:bad-bed,for:bunyi-huruf', '{"text":"bed"}', '{"accept":["bed"]}', 'Kata yang dibacakan: "bed" /bed/. Pasangan bunyinya: bad /bæd/ dan bed /bed/. Bunyi a pada bad dibuat dengan mulut terbuka lebih lebar daripada e pada bed. Banyak penutur mengucapkan keduanya seperti "bed".'),
  ('minimal-pair,mp:think-sink,for:bunyi-huruf', '{"text":"sink"}', '{"accept":["sink"]}', 'Kata yang dibacakan: "sink" /sɪŋk/. Pasangan bunyinya: think /θɪŋk/ dan sink /sɪŋk/. Bunyi th (θ) dibuat dengan ujung lidah di antara gigi, bukan s. Latih: letakkan lidah di antara gigi lalu hembuskan udara.'),
  ('minimal-pair,mp:very-ferry,for:bunyi-huruf', '{"text":"ferry"}', '{"accept":["ferry"]}', 'Kata yang dibacakan: "ferry" /ˈferi/. Pasangan bunyinya: very /ˈveri/ dan ferry /ˈferi/. v memakai gigi atas menyentuh bibir bawah dengan suara bergetar; f sama tetapi tanpa getaran. Jangan mengganti v dengan f atau p.'),
  ('minimal-pair,mp:light-right,for:bunyi-huruf', '{"text":"right"}', '{"accept":["right"]}', 'Kata yang dibacakan: "right" /raɪt/. Pasangan bunyinya: light /laɪt/ dan right /raɪt/. l: ujung lidah menempel di balik gigi atas. r bahasa Inggris: lidah melengkung ke belakang tanpa menyentuh langit-langit dan tidak digetarkan.')
) AS v(tags, prompt, answer, explanation_id)
WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE 'minimal-pair' = ANY(tags));

-- 7. Hubungkan ke unit Kursus Dasar: tambahkan langkah latihan bertag (hanya jika 0013 sudah dijalankan dan langkahnya belum ada)
DO $do$
DECLARE
  r RECORD;
BEGIN
  IF to_regclass('public.course_units') IS NOT NULL THEN
    FOR r IN SELECT * FROM (VALUES
      ('keluarga-orang', 'Kesalahan umum penutur Indonesia'),
      ('rutinitas-harian', 'Kesalahan umum penutur Indonesia'),
      ('cerita-masa-lalu', 'Kesalahan umum penutur Indonesia'),
      ('rumah-benda', 'Kesalahan umum penutur Indonesia'),
      ('belanja', 'Kesalahan umum penutur Indonesia'),
      ('makanan-restoran', 'Kesalahan umum penutur Indonesia'),
      ('pekerjaan-kampus', 'Kesalahan umum penutur Indonesia'),
      ('bunyi-huruf', 'Pasangan bunyi: dengar dan ketik')
    ) AS t(unit, title)
    LOOP
      UPDATE course_units
      SET steps = steps || jsonb_build_array(jsonb_build_object('type', 'exercise', 'title', r.title, 'count', 4, 'tag', 'for:' || r.unit)),
          updated_at = NOW()
      WHERE slug = r.unit
        AND NOT (steps @> jsonb_build_array(jsonb_build_object('type', 'exercise', 'tag', 'for:' || r.unit)));
    END LOOP;
  END IF;
END
$do$;
