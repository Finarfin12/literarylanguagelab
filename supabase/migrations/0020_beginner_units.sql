-- Migration 0020: unit pemula tuntas (Fase 21): bunyi-huruf lengkap dan salam-perkenalan dengan "cara baca perkiraan".
-- Aman dijalankan ulang. Butuh 0013 (course_units) dan 0012 (exercises). Tanpa 0013/0012 migrasi ini hanya memberi pemberitahuan.
-- Semua materi ditulis sendiri. Status tetap DRAFT sampai pemilik meninjau di Admin -> Konten -> Kursus lalu Terbitkan;
-- nyalakan flag `kursus_dasar` di Admin -> Fitur setelah minimal dua unit lengkap dan migrasi 0012-0016 sudah jalan.
-- Suntingan admin tidak ditimpa: langkah hanya diganti bila belum memuat "reading_aid" (tanda migrasi ini belum dijalankan).
--
-- Cara baca (reading_aid) hanyalah perkiraan memakai huruf Indonesia; audio tetap acuan utama.
-- ROLLBACK: isi lama ada di 0013 (salam-perkenalan) dan 0016 (bunyi-huruf); jalankan UPDATE course_units SET steps = <isi lama>.

DO $do$
BEGIN
  IF to_regclass('public.course_units') IS NULL THEN
    RAISE NOTICE 'course_units belum ada (jalankan 0013 dulu): langkah unit dilewati.';
    RETURN;
  END IF;

  -- bunyi-huruf: bunyi asing bagi penutur Indonesia, huruf bisu, mengeja nama, bacaan, latihan, ucapan
  UPDATE course_units
  SET steps = $j$[{"type":"vocab","title":"Bunyi th","items":[{"word":"think","meaning_id":"berpikir; mengira","reading_aid":"(th)ingk"},{"word":"thank","meaning_id":"berterima kasih","reading_aid":"(th)engk"},{"word":"three","meaning_id":"tiga","reading_aid":"(th)ri"},{"word":"this","meaning_id":"ini","reading_aid":"(dh)is"},{"word":"that","meaning_id":"itu","reading_aid":"(dh)et"},{"word":"with","meaning_id":"dengan; bersama","reading_aid":"wi(dh)"}]},{"type":"listen","title":"Dengar bunyi th","text":"I think this is good. Thank you very much. That is three books.","note_id":"Bunyi th tidak ada dalam bahasa Indonesia. Letakkan ujung lidah di antara gigi atas dan bawah, lalu hembuskan udara. Pada think, thank, three tidak ada getaran suara; pada this, that, with ada getaran. Kesalahan yang umum: mengucapkannya seperti t, d, atau s."},{"type":"vocab","title":"Bunyi v dan f","items":[{"word":"very","meaning_id":"sangat","reading_aid":"veri"},{"word":"ferry","meaning_id":"kapal feri","reading_aid":"feri"},{"word":"five","meaning_id":"lima","reading_aid":"faiv"},{"word":"fine","meaning_id":"baik; sehat","reading_aid":"fain"},{"word":"love","meaning_id":"cinta; menyukai","reading_aid":"lav"},{"word":"leave","meaning_id":"pergi; meninggalkan","reading_aid":"liiv"},{"word":"live","meaning_id":"tinggal; hidup","reading_aid":"liv"}]},{"type":"listen","title":"Dengar bunyi v dan f","text":"I am very fine. I live in a small house. I have five friends. I love my family.","note_id":"Untuk v, gigi atas menyentuh bibir bawah dan suara bergetar. Untuk f, posisinya sama tetapi tanpa getaran suara. Jangan mengganti v dengan p: very bukan peri, dan five bukan paip. Bandingkan juga leave (liiv, panjang) dengan live (liv, pendek)."},{"type":"vocab","title":"Bunyi sh dan s","items":[{"word":"ship","meaning_id":"kapal","reading_aid":"syip"},{"word":"sheep","meaning_id":"domba","reading_aid":"syiip"},{"word":"she","meaning_id":"dia (perempuan)","reading_aid":"syi"},{"word":"shop","meaning_id":"toko","reading_aid":"syop"},{"word":"sea","meaning_id":"laut","reading_aid":"si"},{"word":"sit","meaning_id":"duduk","reading_aid":"sit"}]},{"type":"listen","title":"Dengar bunyi sh dan s","text":"She has a ship. She sits by the sea. The sheep are in the shop.","note_id":"Bunyi sh mirip sy pada kata Indonesia syarat. Bibir sedikit membulat dan lidah ditarik ke belakang. Bunyi s biasa seperti pada kata Indonesia sapi. Bedakan ship (syip) dengan sip, dan she (syi) dengan see (si)."},{"type":"vocab","title":"Huruf yang tidak dibunyikan","items":[{"word":"knee","meaning_id":"lutut","reading_aid":"ni"},{"word":"know","meaning_id":"tahu; kenal","reading_aid":"nou"},{"word":"write","meaning_id":"menulis","reading_aid":"rait"},{"word":"answer","meaning_id":"jawaban; menjawab","reading_aid":"anser"},{"word":"listen","meaning_id":"mendengarkan","reading_aid":"lisen"},{"word":"hour","meaning_id":"jam (lamanya waktu)","reading_aid":"aur"},{"word":"island","meaning_id":"pulau","reading_aid":"ailen"}]},{"type":"read","title":"Mengeja nama","content":"The letters of English\n\nA (ei)  B (bi)  C (si)  D (di)  E (i)  F (ef)  G (ji)  H (eic)  I (ai)  J (jei)  K (kei)  L (el)  M (em)\n\nN (en)  O (ou)  P (pi)  Q (kyu)  R (ar)  S (es)  T (ti)  U (yu)  V (vi)  W (dabel-yu)  X (eks)  Y (wai)  Z (zed)\n\nHow do you spell your name?\n\nMy name is Rina. R - I - N - A.","note_id":"Tulisan dalam kurung adalah cara baca perkiraan nama huruf. Dengarkan audio di langkah lain sebagai acuan. Z dibaca zed (Inggris Britania) atau zi (Amerika). Latihan: eja namamu dengan keras, huruf demi huruf."},{"type":"read","title":"Bacaan pendek: My Name","content":"Hi! My name is Rina. I think English is fun.\n\nI have three books and one good friend. My friend is very kind. She knows many words, and she writes them in her book.\n\nThis is my school. It is not far from my house.","note_id":"Cari kata dengan bunyi th, v, dan sh. Apakah ada huruf yang tidak dibunyikan?"},{"type":"exercise","title":"Latihan unit","count":8},{"type":"exercise","title":"Latihan pasangan bunyi","tag":"for:bunyi-huruf","count":6},{"type":"speak","title":"Ucapkan","sentences":["I think this is very good.","Thank you very much.","She has a ship and three sheep.","I know how to write my name.","My name is Rina. R - I - N - A."]}]$j$::jsonb,
      intro_id = 'Mulai dari nol: kenali bunyi bahasa Inggris yang tidak ada dalam bahasa Indonesia (th, v/f, sh/s), huruf yang tidak dibunyikan, dan cara mengeja namamu. Penjelasan unit ini berbahasa Indonesia. Cara baca dengan huruf Indonesia hanya perkiraan; dengarkan audionya sebagai acuan utama.',
      updated_at = NOW()
  WHERE slug = 'bunyi-huruf'
    AND position('reading_aid' IN steps::text) = 0;

  -- salam-perkenalan: tambah cara baca perkiraan, percakapan dengar, dan kalimat ucap. Kembali ke draft untuk ditinjau.
  UPDATE course_units
  SET steps = $j$[{"type":"vocab","title":"Kata untuk berkenalan","items":[{"word":"hello","meaning_id":"halo","definition_en":"a word you say when you meet someone","reading_aid":"helou"},{"word":"goodbye","meaning_id":"selamat tinggal","definition_en":"a word you say when you leave","reading_aid":"gudbai"},{"word":"name","meaning_id":"nama","reading_aid":"neim"},{"word":"nice","meaning_id":"menyenangkan","reading_aid":"nais"},{"word":"meet","meaning_id":"bertemu","reading_aid":"miit"},{"word":"from","meaning_id":"dari","reading_aid":"fram"},{"word":"student","meaning_id":"pelajar / mahasiswa","reading_aid":"styudent"},{"word":"thank you","meaning_id":"terima kasih","reading_aid":"(th)engk yu"}]},{"type":"grammar","title":"Pola: verb to be","topic_slug":"to-be"},{"type":"read","title":"Bacaan: Hi, I am Ana","content":"Hi! My name is Ana.\n\nI am from Bandung. I am a student.\n\nThis is my friend Dani. He is from Medan. He is a student too.\n\nNice to meet you!","note_id":"Perhatikan: I am, My name is, He is. Semuanya memakai bentuk to be."},{"type":"listen","title":"Dengarkan perkenalan","text":"Hello! My name is Dani. I am from Medan. Nice to meet you.","note_id":"Dengarkan dua kali, lalu coba ulangi dengan suaramu."},{"type":"listen","title":"Dengarkan percakapan singkat","text":"Hello, how are you? I am fine, thank you. And you? I am fine too. Goodbye!","note_id":"How are you? adalah sapaan, bukan pertanyaan yang perlu dijawab panjang. Jawaban singkat: I am fine, thank you."},{"type":"exercise","title":"Latihan unit","count":6},{"type":"speak","title":"Perkenalkan dirimu","sentences":["Hello, my name is Ana.","I am from Bandung.","Nice to meet you.","How are you?","I am fine, thank you."],"scenario_id":"small-talk-neighbor"}]$j$::jsonb,
      status = 'draft',
      updated_at = NOW()
  WHERE slug = 'salam-perkenalan'
    AND position('reading_aid' IN steps::text) = 0;
END
$do$;

-- Soal latihan baru untuk bunyi-huruf (draft; terbitkan setelah ditinjau di Admin -> Konten -> Latihan). Hanya sekali.
DO $do$
BEGIN
  IF to_regclass('public.exercises') IS NULL THEN
    RAISE NOTICE 'exercises belum ada (jalankan 0012 dulu): soal dilewati.';
    RETURN;
  END IF;
  IF EXISTS (SELECT 1 FROM exercises WHERE unit_slug = 'bunyi-huruf' AND tags @> ARRAY['seed-0020']) THEN
    RETURN;
  END IF;

  INSERT INTO exercises (type, cefr_level, topic_slug, unit_slug, tags, prompt, answer, explanation_id, status, source)
  SELECT v.type, 'A1', NULL, 'bunyi-huruf', ARRAY['seed-0020'], v.prompt::jsonb, v.answer::jsonb, v.expl, 'draft', 'admin'
  FROM (VALUES
    ('mcq', '{"question":"Di mana ujung lidah berada saat mengucapkan th pada kata think?","options":["Di antara gigi atas dan bawah","Menempel di langit-langit","Di belakang gigi bawah"]}', '{"correct":"Di antara gigi atas dan bawah"}', 'Bunyi th dibuat dengan ujung lidah di antara gigi atas dan bawah, lalu udara dihembuskan.'),
    ('mcq', '{"question":"Huruf mana yang tidak dibunyikan pada kata know?","options":["k","n","w"]}', '{"correct":"k"}', 'Pada know, huruf k tidak dibunyikan: dibaca nou.'),
    ('mcq', '{"question":"Kata mana yang diawali bunyi v?","options":["very","ferry","fine"]}', '{"correct":"very"}', 'Very diawali v (gigi atas menyentuh bibir bawah, dengan getaran suara). Ferry dan fine diawali f.'),
    ('cloze', '{"text":"I ___ English is fun.","hint":"Saya pikir bahasa Inggris itu menyenangkan."}', '{"blanks":[["think"]]}', 'Think berarti berpikir atau mengira: I think English is fun.'),
    ('order', '{"tokens":["Thank","you","very","much","."],"hint":"Terima kasih banyak."}', '{"sentences":["Thank you very much."]}', 'Urutannya: Thank + you + very + much.'),
    ('dictation', '{"text":"She has three sheep."}', '{"accept":["She has three sheep."]}', 'Kalimat yang dibacakan: "She has three sheep."'),
    ('match', '{"lefts":["think","three","write","know"],"rights":["tiga","tahu; kenal","berpikir; mengira","menulis"],"instruction":"Pasangkan kata dengan artinya."}', '{"pairs":[{"left":"think","right":"berpikir; mengira"},{"left":"three","right":"tiga"},{"left":"write","right":"menulis"},{"left":"know","right":"tahu; kenal"}]}', 'think = berpikir; three = tiga; write = menulis; know = tahu.')
  ) AS v(type, prompt, answer, expl);
END
$do$;
