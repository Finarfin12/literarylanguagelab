-- Fase 9 (v3): konten berjenjang CEFR, kosakata inti, dan grammar dasar.
-- Bergantung pada 0002 (is_admin()) dan 0003 (ai_feature_routes).
-- Kode tetap jalan sebelum migrasi ini dijalankan (fallback di halaman terkait).
--
-- Visibilitas teks: teks draft memakai is_public = false, jadi tidak muncul di Library
-- (query Library sudah memfilter is_public = true). Menerbitkan = status 'published' + is_public = true.

-- 1. Teks berjenjang
ALTER TABLE texts ADD COLUMN IF NOT EXISTS cefr_level TEXT
  CHECK (cefr_level IN ('A1','A2','B1','B2','C1','C2'));
ALTER TABLE texts ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published'
  CHECK (status IN ('draft','published'));
ALTER TABLE texts ADD COLUMN IF NOT EXISTS source TEXT;  -- 'admin' | 'ai' | 'public_domain' | 'user'
CREATE INDEX IF NOT EXISTS idx_texts_cefr ON texts (cefr_level) WHERE status = 'published';

-- 2. Kosakata inti (diisi lewat scripts/import-ngsl.mjs, bukan di migrasi)
CREATE TABLE IF NOT EXISTS core_words (
  word TEXT PRIMARY KEY,
  band INT NOT NULL,              -- peringkat frekuensi NGSL (1 = paling sering)
  cefr_estimate TEXT NOT NULL,    -- A1..B2, dipetakan dari band (lib/cefr.ts)
  pos TEXT,
  example TEXT
);
CREATE INDEX IF NOT EXISTS idx_core_words_band ON core_words (band);

-- 3. Topik grammar dasar
CREATE TABLE IF NOT EXISTS grammar_topics (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  cefr_level TEXT NOT NULL,
  sort_order INT NOT NULL,
  summary_id TEXT NOT NULL,       -- ringkasan bahasa Indonesia
  examples JSONB NOT NULL DEFAULT '[]',   -- [{ "en": "...", "id": "..." }]
  related_text_ids UUID[] DEFAULT '{}'
);

-- 4. RLS: dibaca semua pengguna login, ditulis hanya admin
ALTER TABLE core_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE grammar_topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read core_words" ON core_words;
CREATE POLICY "Authenticated read core_words" ON core_words
  FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Admins manage core_words" ON core_words;
CREATE POLICY "Admins manage core_words" ON core_words
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated read grammar_topics" ON grammar_topics;
CREATE POLICY "Authenticated read grammar_topics" ON grammar_topics
  FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Admins manage grammar_topics" ON grammar_topics;
CREATE POLICY "Admins manage grammar_topics" ON grammar_topics
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 5. Feature key AI baru (harus sama dengan lib/ai/features.ts).
-- Memakai model yang sama dengan 'generate-text' bila ada.
INSERT INTO ai_feature_routes (feature_key, model_id)
SELECT 'graded-text-generate', model_id FROM ai_feature_routes WHERE feature_key = 'generate-text'
ON CONFLICT (feature_key) DO NOTHING;

-- 6. Seed 20 topik grammar A1-B1
INSERT INTO grammar_topics (slug, title, cefr_level, sort_order, summary_id, examples) VALUES
  ('to-be', 'Verb to be (am, is, are)', 'A1', 1, 'Dipakai untuk menyatakan identitas, keadaan, dan asal. I memakai am, he/she/it memakai is, you/we/they memakai are. Bentuk negatifnya menambah not setelah to be.', '[{"en": "I am a student.", "id": "Saya seorang pelajar."}, {"en": "She is from Bandung.", "id": "Dia berasal dari Bandung."}, {"en": "They are not at home.", "id": "Mereka tidak ada di rumah."}]'::jsonb),
  ('articles', 'Articles: a, an, the', 'A1', 2, 'A dipakai sebelum bunyi konsonan, an sebelum bunyi vokal, untuk benda yang disebut pertama kali atau tidak spesifik. The dipakai untuk benda yang sudah jelas bagi pembicara dan pendengar.', '[{"en": "I have a cat.", "id": "Saya punya seekor kucing."}, {"en": "She eats an apple.", "id": "Dia makan sebuah apel."}, {"en": "The cat is on the table.", "id": "Kucing itu ada di atas meja."}]'::jsonb),
  ('plural-nouns', 'Plural nouns', 'A1', 3, 'Kebanyakan kata benda jamak ditambah -s atau -es. Ada bentuk tak beraturan yang harus dihafal, misalnya child menjadi children dan man menjadi men.', '[{"en": "two books", "id": "dua buku"}, {"en": "three boxes", "id": "tiga kotak"}, {"en": "many children", "id": "banyak anak"}]'::jsonb),
  ('pronouns-possessives', 'Pronouns and possessives', 'A1', 4, 'Pronoun pengganti subjek (I, you, he, she, it, we, they). Kata kepunyaan (my, your, his, her, its, our, their) dipasang sebelum kata benda untuk menyatakan kepemilikan.', '[{"en": "He likes her.", "id": "Dia (laki-laki) menyukainya (perempuan)."}, {"en": "This is my book.", "id": "Ini buku saya."}, {"en": "Their house is big.", "id": "Rumah mereka besar."}]'::jsonb),
  ('present-simple', 'Present simple', 'A1', 5, 'Dipakai untuk kebiasaan dan fakta umum. Untuk he/she/it, kata kerja ditambah -s. Negatif dan pertanyaan memakai do/does, dan kata kerjanya kembali ke bentuk dasar.', '[{"en": "I walk to school every day.", "id": "Saya berjalan ke sekolah setiap hari."}, {"en": "She works in a bank.", "id": "Dia bekerja di bank."}, {"en": "Does he play football?", "id": "Apakah dia bermain sepak bola?"}]'::jsonb),
  ('there-is-are', 'There is / there are', 'A1', 6, 'Dipakai untuk menyatakan sesuatu ada. There is untuk satu benda atau benda tak terhitung, there are untuk benda jamak.', '[{"en": "There is a pen on the desk.", "id": "Ada sebuah pulpen di atas meja."}, {"en": "There are two chairs.", "id": "Ada dua kursi."}, {"en": "Is there any milk?", "id": "Apakah ada susu?"}]'::jsonb),
  ('can-could', 'Can and could', 'A1', 7, 'Can menyatakan kemampuan atau izin saat ini. Could adalah bentuk lampaunya, juga dipakai untuk permintaan sopan. Setelah can/could kata kerja memakai bentuk dasar tanpa to.', '[{"en": "I can swim.", "id": "Saya bisa berenang."}, {"en": "She could read when she was four.", "id": "Dia sudah bisa membaca saat berumur empat tahun."}, {"en": "Could you help me?", "id": "Bisakah Anda membantu saya?"}]'::jsonb),
  ('prepositions-place-time', 'Prepositions of place and time', 'A1', 8, 'In untuk ruang tertutup, bulan, dan tahun; on untuk permukaan dan hari; at untuk titik tempat dan jam. Menguasai tiga kata ini sudah menyelesaikan sebagian besar kasus dasar.', '[{"en": "The keys are on the table.", "id": "Kunci ada di atas meja."}, {"en": "We meet at 5 o''clock.", "id": "Kami bertemu pukul lima."}, {"en": "My birthday is in May.", "id": "Ulang tahun saya bulan Mei."}]'::jsonb),
  ('present-continuous', 'Present continuous', 'A2', 9, 'Dipakai untuk kejadian yang sedang berlangsung sekarang atau rencana dekat. Bentuknya am/is/are ditambah kata kerja berakhiran -ing.', '[{"en": "I am reading a book now.", "id": "Saya sedang membaca buku sekarang."}, {"en": "They are watching TV.", "id": "Mereka sedang menonton TV."}, {"en": "We are leaving tomorrow.", "id": "Kami berangkat besok."}]'::jsonb),
  ('past-simple', 'Past simple', 'A2', 10, 'Dipakai untuk kejadian yang selesai di masa lalu. Kata kerja beraturan ditambah -ed, sedangkan kata kerja tak beraturan berubah bentuk (go menjadi went). Negatif dan pertanyaan memakai did.', '[{"en": "I visited my aunt yesterday.", "id": "Kemarin saya mengunjungi bibi saya."}, {"en": "She went to Jakarta.", "id": "Dia pergi ke Jakarta."}, {"en": "Did you see him?", "id": "Apakah kamu melihatnya?"}]'::jsonb),
  ('countable-uncountable', 'Countable and uncountable nouns', 'A2', 11, 'Benda terhitung bisa dihitung dan punya bentuk jamak (apple, apples). Benda tak terhitung tidak (water, rice). Some dipakai di kalimat positif, any di negatif dan pertanyaan; many untuk terhitung, much untuk tak terhitung.', '[{"en": "I need some water.", "id": "Saya butuh sedikit air."}, {"en": "There aren''t any apples.", "id": "Tidak ada apel."}, {"en": "How much rice do we have?", "id": "Berapa banyak beras yang kita punya?"}]'::jsonb),
  ('comparatives-superlatives', 'Comparatives and superlatives', 'A2', 12, 'Perbandingan dua hal memakai -er atau more ditambah than. Paling tinggi tingkatnya memakai the -est atau the most. Kata sifat pendek biasanya memakai -er/-est, yang panjang memakai more/most.', '[{"en": "This bag is cheaper than that one.", "id": "Tas ini lebih murah daripada yang itu."}, {"en": "She is the tallest in the class.", "id": "Dia yang paling tinggi di kelas."}, {"en": "It is more difficult than I thought.", "id": "Ini lebih sulit daripada yang saya kira."}]'::jsonb),
  ('future-going-to-will', 'Future: going to and will', 'A2', 13, 'Going to untuk rencana atau prediksi yang punya tanda saat ini. Will untuk keputusan spontan, janji, dan prediksi umum.', '[{"en": "I am going to study tonight.", "id": "Saya akan belajar malam ini."}, {"en": "I''ll help you with that.", "id": "Saya akan membantumu soal itu."}, {"en": "Look at the clouds. It is going to rain.", "id": "Lihat awannya. Sepertinya akan hujan."}]'::jsonb),
  ('modals-obligation', 'Must, have to, should', 'A2', 14, 'Must dan have to menyatakan kewajiban, mustn''t melarang, sedangkan don''t have to berarti tidak wajib. Should untuk saran. Setelah must dan should kata kerja tanpa to.', '[{"en": "You must wear a helmet.", "id": "Kamu harus memakai helm."}, {"en": "I have to get up early.", "id": "Saya harus bangun pagi."}, {"en": "You should see a doctor.", "id": "Sebaiknya kamu menemui dokter."}]'::jsonb),
  ('adverbs-frequency', 'Adverbs of frequency', 'A2', 15, 'Always, usually, often, sometimes, rarely, dan never menyatakan seberapa sering sesuatu terjadi. Letaknya sebelum kata kerja utama tetapi setelah to be.', '[{"en": "She always drinks tea.", "id": "Dia selalu minum teh."}, {"en": "He is never late.", "id": "Dia tidak pernah terlambat."}, {"en": "We sometimes eat out.", "id": "Kadang-kadang kami makan di luar."}]'::jsonb),
  ('present-perfect', 'Present perfect', 'B1', 16, 'Bentuknya have/has ditambah past participle. Dipakai untuk pengalaman, kejadian lampau yang masih berkaitan dengan sekarang, dan hal yang baru saja terjadi. Jangan dipakai dengan keterangan waktu lampau yang pasti seperti yesterday.', '[{"en": "I have visited Bali twice.", "id": "Saya sudah dua kali mengunjungi Bali."}, {"en": "She has just left.", "id": "Dia baru saja pergi."}, {"en": "Have you ever eaten durian?", "id": "Pernahkah kamu makan durian?"}]'::jsonb),
  ('past-continuous', 'Past continuous', 'B1', 17, 'Bentuknya was/were ditambah -ing. Dipakai untuk kejadian yang sedang berlangsung pada suatu saat di masa lalu, sering digabung dengan past simple untuk kejadian yang memotongnya.', '[{"en": "I was cooking when you called.", "id": "Saya sedang memasak ketika kamu menelepon."}, {"en": "They were sleeping at ten.", "id": "Mereka sedang tidur pukul sepuluh."}, {"en": "What were you doing?", "id": "Apa yang sedang kamu lakukan?"}]'::jsonb),
  ('first-conditional', 'First conditional', 'B1', 18, 'If ditambah present simple di anak kalimat, will ditambah kata kerja dasar di induk kalimat. Dipakai untuk kemungkinan nyata di masa depan.', '[{"en": "If it rains, we will stay home.", "id": "Jika hujan, kami akan tinggal di rumah."}, {"en": "She will pass if she studies.", "id": "Dia akan lulus jika belajar."}, {"en": "If you don''t hurry, you will miss the bus.", "id": "Jika kamu tidak bergegas, kamu akan ketinggalan bus."}]'::jsonb),
  ('passive-voice-simple', 'Passive voice (simple)', 'B1', 19, 'Bentuknya to be ditambah past participle. Dipakai ketika pelaku tidak penting atau tidak diketahui, dan penerima aksi menjadi fokus kalimat.', '[{"en": "The window was broken.", "id": "Jendelanya dipecahkan."}, {"en": "English is spoken here.", "id": "Bahasa Inggris dipakai di sini."}, {"en": "The book was written by Orwell.", "id": "Buku itu ditulis oleh Orwell."}]'::jsonb),
  ('relative-clauses', 'Relative clauses (who, which, that)', 'B1', 20, 'Who untuk orang, which untuk benda, that untuk keduanya. Anak kalimat ini menjelaskan kata benda di depannya tanpa membuat kalimat baru.', '[{"en": "The man who lives next door is a doctor.", "id": "Pria yang tinggal di sebelah adalah dokter."}, {"en": "This is the book that I told you about.", "id": "Ini buku yang saya ceritakan kepadamu."}, {"en": "She has a dog which barks all night.", "id": "Dia punya anjing yang menggonggong sepanjang malam."}]'::jsonb)
ON CONFLICT (slug) DO NOTHING;
