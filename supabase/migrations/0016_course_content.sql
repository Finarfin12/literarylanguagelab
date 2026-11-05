-- Fase 18 (v4): paket konten awal Kursus Dasar (jalur 1: seed dari Claude).
-- Bergantung pada 0007 (texts.cefr_level/status/source), 0012 (exercises), dan 0013 (course_units).
-- Idempoten: aman dijalankan ulang. SEMUA berstatus draft: tinjau di Admin -> Konten, edit bila perlu, lalu Terbitkan.
-- Kursus Dasar tetap tersembunyi dari pengguna biasa sampai flag kursus_dasar dinyalakan (Admin -> Fitur).
--
-- Isi:
--  1. 20 bacaan ASLI (10 A1, 10 A2), tema mengikuti unit; ditulis sendiri, bukan salinan teks berhak cipta.
--     Setiap bacaan sudah diperiksa terhadap NGSL 1.2: jumlah kata dalam rentang level dan >= 90% (A1) / >= 92% (A2)
--     kata (di luar nama diri & angka) berada di daftar Kosakata Inti pada level itu.
--  2. Langkah 11 unit (kata + arti, topik grammar, bacaan, teks dengar, latihan, kalimat bicara). Unit "salam-perkenalan"
--     sudah lengkap dari 0013 dan tidak diubah. Langkah latihan bertag dari 0014 dipertahankan.
--  3. 55 soal latihan draft (pilihan ganda, isian, susun kalimat, pasangkan, dikte; 5 per unit).

-- 1. Bacaan (draft, tidak tampil di Library sampai diterbitkan)
-- Kolom difficulty sengaja tidak diisi: tabel texts punya aturan texts_difficulty_enum (tidak tercatat di repo) yang
-- menolak nilai CEFR; level disimpan di cefr_level.
INSERT INTO texts (title, author, content, word_count, cefr_level, status, source, is_public)
SELECT v.title, 'Literary Language Lab', v.content,
       array_length(regexp_split_to_array(btrim(v.content), '\s+'), 1),
       v.level, 'draft', 'admin', false
FROM (VALUES
  ('My First English Words', 'A1', $r$My name is Rina. I learn English at school. I know some words now. I know the word "book". I know the word "water". I know the word "friend".

I say each word. Then I say it again. My teacher says, "Good!" I feel good too.

English is not easy, but I like it. I study for 1 hour every day. My mother helps me. She says, "Do not stop. Take your time." I love to learn new words. Every day I know more.$r$),
  ('Early in the Morning', 'A1', $r$I get up at 6 every morning. I wash and I eat some food. At 7 my father takes me to school in his car. The school is not far from our house. It takes 20 minutes.

School starts at 8. We have 5 classes in a day. At 12 we eat with our friends. The last class ends at 2. Then I walk home.

On Friday school ends at 1. I like Friday because the next day is Saturday. I do not have class, and I can sleep late.$r$),
  ('My Birthday Is in May', 'A1', $r$My birthday is on the 10th of May. I am 12 years old now. My friend Sari has her birthday in October.

On my birthday we have a small party at home. My mother makes a lot of food. 10 friends come to my house. We play games and we talk. It is a long day, but it is a good day.

My father gives me a new book. My mother gives me some money. I say, "Thank you very much!" I love my birthday.$r$),
  ('My Family', 'A1', $r$I have a small family. There are 5 people in my family. My father is a teacher. He is a big man and he has a kind face. My mother works in a shop. She is a good mother and she works hard.

I have 2 children in my house who are my brother and my sister. Joko is 15. He plays football every day. Sari is 6. She likes to draw.

We live in one house. We eat food together every night. I love my family very much.$r$),
  ('My Friend Dewi', 'A1', $r$My best friend is Dewi. She is 13 years old. She is a small girl, and she has a big smile. She is a good student. She works hard at school.

Dewi is a kind friend. She tells good stories, and the class likes her. She helps me with my work, and I help her with English.

We sit together in class. After school we walk home. Dewi lives near my house. I am happy to have a friend like her.$r$),
  ('My Small House', 'A1', $r$I live in a small house with my family. There is a big room in front. There is a table and 4 chairs in this room. We eat food at the table. My mother puts some flowers on it.

There are 3 rooms for sleep. My room is small, but I like it. There is a bed and a desk in my room. My books are on the desk. There is a window near the bed, and I can see the street.

Our house is old, but it is a good house. It is our home.$r$),
  ('A Day with Budi', 'A1', $r$Budi gets up at 5:30. He washes and he eats some food. Then he goes to work by car.

He works in an office. He starts work at 8 and he ends at 5. At 12 he eats lunch with his friends. He talks to many people in a day. He works hard, and the people in the office like him.

In the evening Budi goes home. He eats with his family. After that he reads a book or he watches television. He goes to bed at 10.$r$),
  ('Saturday Morning', 'A1', $r$On Saturday I do not get up early. I stay in bed until 8. Then I go to my mother and I help her. We make food together.

After that I put my room in order. I put my books on the table and my things in a box. It takes 1 hour.

After lunch I play with my friends in the park. We play for 2 hours. At night I stay at home. I listen to music, and I talk to my friend on the phone.$r$),
  ('Lunch with a Friend', 'A1', $r$Today I eat lunch with my friend in a small restaurant. It is near our school, and it is not expensive.

A woman comes to our table. She says, "What do you want to eat?" I want some rice. My friend wants some chicken. We want water too.

The food comes fast. It is hot and it is good. We eat and we talk. Then I ask, "How much is it?" The woman says, "20,000." I pay, and we go back to school.$r$),
  ('Food in My Family', 'A1', $r$I love food. I eat food 3 times a day. My mother makes good food for the family. She works hard, but she likes it.

In the morning we eat at 7. My father eats a lot, and he drinks tea. I eat a little and I drink water. At 12 I eat at school with my friends. At night we all sit at the table and we eat together.

On Sunday we make a special meal. The whole family helps. It takes 2 hours, but it is a good time for us. I love Sunday.$r$),
  ('A New Phone', 'A2', $r$Last week I needed a new phone. My old phone was too old, and it was broken. On Saturday I went to a big shop with my friend.

There were many phones in the shop, and every phone had a different price. A red phone was very nice, but the price was too high. A black phone cost less, but the quality was not good, and the man in the shop did not help us much.

In another shop we saw a white phone. It was bigger than my old phone, and it was better than the black one. The price was good, so I bought it. The woman there gave me a lower price because I paid with money. I was very happy with my choice, and I use it every day.$r$),
  ('At the Market', 'A2', $r$Every Sunday my mother goes to the market, and sometimes I go with her. The market is full of people in the morning. People sell food, clothes, and many other things.

My mother always asks about the price first. She says that the best things are not always the highest in price. She walks around the market before she buys anything.

Today the food was good, and the price was low, so she bought a lot. Some things cost more than last week because many people wanted them. She talked to the man in the shop, and he lowered the price a little. We took the food home and made a big dinner for the whole family. Everyone said that it was the best dinner of the week.$r$),
  ('Where Is the Bank?', 'A2', $r$Yesterday a woman stopped me in front of my school. She was looking for the bank, and she was lost. She asked me, "Excuse me, how can I get to the bank?"

I told her, "Go along this street for 5 minutes. Turn right at the second street, next to the post office. Then walk past the park. The bank is across from the hotel."

She wrote the directions on a piece of paper. It was not far, only 10 minutes on foot. She smiled and said, "Now I understand." She thanked me and said that people in this city are very kind. I was happy that I could help her. Then I walked to the station and went home.$r$),
  ('A Walk in the City', 'A2', $r$I am standing at the station, and I am waiting for my friend. He is coming from another city. We plan to walk around the town today.

First we are going to the old church. There is a big clock there, and many people sit near it. After that we are going to visit the park. It is behind the church, between a school and a small hotel.

My friend is tired after the long trip, so we will stop and eat something near the park. In the afternoon we will walk along the street to the market. It is a good place, and the day is long. We want to see as much as we can today. Later we will take a picture of the clock and send it to our families.$r$),
  ('Last Weekend', 'A2', $r$Last weekend was great. On Saturday morning I got up late because I did not have school. I ate some food, and then I called my friends. We decided to go to the park.

We took a bus and arrived there at 10. The day was hot, so we sat under a big tree. We played games, we talked, and we ate some food from home. My friend Andi forgot his water, so we gave him some of ours.

In the evening we went back home. I was happy and a little tired. On Sunday I stayed at home, put my room in order, and studied for the English test on Monday. I want to go to the park again next month with the same friends.$r$),
  ('A Trip to the Village', 'A2', $r$Two years ago my family visited a village in the hills. We left home very early, at 4 in the morning. My father drove the car, and my mother gave us some food for the trip.

The road was long and it had many turns. My little brother felt ill, so we stopped 2 times. When we arrived, the air was cold and clean. The village was quiet, and the hills stood behind it.

We stayed with my father's family in a small house. I took many pictures of the fields and the old church. In the afternoon it started to rain, and we ran back to the house. It was my first long trip, and it was a good time. I still remember it.$r$),
  ('Plans for Next Year', 'A2', $r$Next year I am going to finish high school. After that I want to study at a university in a big city. I am going to study English because I want to be a teacher one day.

I know that it will not be easy. I will need to save money, and I will have to work hard. My parents say that they will help me, but I also want to find a small job.

This year I am going to prepare. I am going to join an English course, and I will read one book every month. I will also write a little every day. I think that my dream will come true if I keep trying. I will never stop.$r$),
  ('Food for My Mother', 'A2', $r$Tomorrow is my mother's birthday, and I am going to make some special food for her. I have never done this for so many people, so I am a little afraid.

I am going to make soup, rice, and some fish. My friend will help me with the work. My father is going to buy a cake on his way home from work.

I think the food will take about 2 hours. I will start at 4, so everything will be ready at 6. Maybe the food will not be very good, but my mother will be happy. I hope she will like it. I will give her a book too. My friend says that I do not need to worry. Tomorrow I will tell you how it goes.$r$),
  ('My First Job', 'A2', $r$Last summer I got my first job. I worked in a small shop near my house. The man in the shop was kind, and he taught me many things.

My work was not difficult. I had to put new books on the table and help people find the books they wanted. Sometimes I had to count the money at the end of the day.

I must say that I learned a lot. I learned how to talk to people well, and I learned that I should always be on time. The job was hard, but I earned some money, and I could buy a new phone. Next summer I would like to work there again. I think that every young person should try a job like this.$r$),
  ('A Busy Day at the University', 'A2', $r$My sister studies at a university, and her days are very full. She has to get up at 5 because her first class starts at 7. She cannot be late, because the teacher is hard on students who are late.

After class she goes to the library. She must read a lot and write a report every week. At 12 she meets her friends. They should rest, but they usually talk about their work.

In the afternoon she has a group meeting. Then she has to go to a part-time job. She comes home at 9, and she is very tired. She says that life at the university is hard, but she likes it very much. I am proud of her, and I want to be like her one day.$r$)
) AS v(title, level, content)
WHERE NOT EXISTS (SELECT 1 FROM texts t WHERE t.title = v.title AND t.author = 'Literary Language Lab');

-- 2. Langkah unit. text_ref (judul bacaan) diganti dengan id teks. Hanya unit yang langkah pertamanya masih
-- placeholder (kosakata kosong) yang diisi, supaya suntingan admin tidak tertimpa saat migrasi dijalankan ulang.
DO $do$
DECLARE
  r RECORD;
BEGIN
  IF to_regclass('public.course_units') IS NULL THEN
    RAISE NOTICE 'course_units belum ada (jalankan 0013 dulu): langkah unit dilewati.';
    RETURN;
  END IF;
  FOR r IN SELECT * FROM (VALUES
      ('bunyi-huruf', '[{"type":"vocab","title":"Kata-kata unit","items":[{"word":"book","meaning_id":"buku"},{"word":"water","meaning_id":"air"},{"word":"friend","meaning_id":"teman"},{"word":"school","meaning_id":"sekolah"},{"word":"name","meaning_id":"nama"},{"word":"teacher","meaning_id":"guru"},{"word":"good","meaning_id":"baik; bagus"},{"word":"word","meaning_id":"kata"}]},{"type":"read","title":"Bacaan: My First English Words","text_ref":"My First English Words"},{"type":"listen","title":"Dengarkan","text":"My name is Rina. I like my school. My teacher is good. I have a book and a friend.","note_id":"Dengarkan dua kali, lalu ulangi dengan suaramu sendiri."},{"type":"exercise","title":"Latihan unit","count":5},{"type":"speak","title":"Ucapkan","sentences":["My name is Rina.","I like my school.","This is my book."]}]'),
      ('angka-waktu-tanggal', '[{"type":"vocab","title":"Kata-kata unit","items":[{"word":"morning","meaning_id":"pagi"},{"word":"night","meaning_id":"malam"},{"word":"hour","meaning_id":"jam (lamanya waktu)"},{"word":"minute","meaning_id":"menit"},{"word":"week","meaning_id":"minggu"},{"word":"year","meaning_id":"tahun"},{"word":"day","meaning_id":"hari"},{"word":"time","meaning_id":"waktu"}]},{"type":"grammar","topic_slug":"prepositions-place-time"},{"type":"read","title":"Bacaan 1: Early in the Morning","text_ref":"Early in the Morning"},{"type":"read","title":"Bacaan 2: My Birthday Is in May","text_ref":"My Birthday Is in May"},{"type":"listen","title":"Dengarkan","text":"I get up at 6. School starts at 8. We eat at 12. I go home at 2.","note_id":"Dengarkan dua kali, lalu ulangi dengan suaramu sendiri."},{"type":"exercise","title":"Latihan unit","count":5},{"type":"speak","title":"Ucapkan","sentences":["I get up at 6.","School starts at 8.","My birthday is in May."]}]'),
      ('keluarga-orang', '[{"type":"vocab","title":"Kata-kata unit","items":[{"word":"family","meaning_id":"keluarga"},{"word":"mother","meaning_id":"ibu"},{"word":"father","meaning_id":"ayah"},{"word":"child","meaning_id":"anak"},{"word":"friend","meaning_id":"teman"},{"word":"teacher","meaning_id":"guru"},{"word":"man","meaning_id":"laki-laki; pria"},{"word":"woman","meaning_id":"perempuan; wanita"}]},{"type":"grammar","topic_slug":"pronouns-possessives"},{"type":"read","title":"Bacaan 1: My Family","text_ref":"My Family"},{"type":"read","title":"Bacaan 2: My Friend Dewi","text_ref":"My Friend Dewi"},{"type":"listen","title":"Dengarkan","text":"I have a small family. My father is a teacher. My mother works in a shop. We live in one house.","note_id":"Dengarkan dua kali, lalu ulangi dengan suaramu sendiri."},{"type":"exercise","title":"Latihan unit","count":5},{"type":"speak","title":"Ucapkan","sentences":["This is my family.","My father is a teacher.","She is my best friend."]}]'),
      ('rumah-benda', '[{"type":"vocab","title":"Kata-kata unit","items":[{"word":"house","meaning_id":"rumah"},{"word":"room","meaning_id":"ruangan; kamar"},{"word":"table","meaning_id":"meja"},{"word":"chair","meaning_id":"kursi"},{"word":"door","meaning_id":"pintu"},{"word":"window","meaning_id":"jendela"},{"word":"bed","meaning_id":"tempat tidur"},{"word":"home","meaning_id":"rumah (tempat tinggal)"}]},{"type":"grammar","topic_slug":"there-is-are"},{"type":"read","title":"Bacaan: My Small House","text_ref":"My Small House"},{"type":"listen","title":"Dengarkan","text":"There is a table in the room. There are four chairs. There is a window near the door.","note_id":"Dengarkan dua kali, lalu ulangi dengan suaramu sendiri."},{"type":"exercise","title":"Latihan unit","count":5},{"type":"speak","title":"Ucapkan","sentences":["There is a table in my room.","There are four chairs.","I like my home."]}]'),
      ('rutinitas-harian', '[{"type":"vocab","title":"Kata-kata unit","items":[{"word":"wash","meaning_id":"mencuci; membasuh"},{"word":"eat","meaning_id":"makan"},{"word":"work","meaning_id":"bekerja; pekerjaan"},{"word":"start","meaning_id":"mulai"},{"word":"finish","meaning_id":"selesai; menyelesaikan"},{"word":"early","meaning_id":"awal; pagi-pagi"},{"word":"late","meaning_id":"terlambat; larut"},{"word":"play","meaning_id":"bermain"}]},{"type":"grammar","topic_slug":"present-simple"},{"type":"read","title":"Bacaan 1: A Day with Budi","text_ref":"A Day with Budi"},{"type":"read","title":"Bacaan 2: Saturday Morning","text_ref":"Saturday Morning"},{"type":"listen","title":"Dengarkan","text":"Budi gets up at 5. He goes to work by car. He works in an office. He goes home at 5 and eats with his family.","note_id":"Dengarkan dua kali, lalu ulangi dengan suaramu sendiri."},{"type":"exercise","title":"Latihan unit","count":5},{"type":"speak","title":"Ucapkan","sentences":["I get up at 6.","He works in an office.","She goes to school every day."]}]'),
      ('makanan-restoran', '[{"type":"vocab","title":"Kata-kata unit","items":[{"word":"food","meaning_id":"makanan"},{"word":"eat","meaning_id":"makan"},{"word":"water","meaning_id":"air"},{"word":"want","meaning_id":"ingin; mau"},{"word":"pay","meaning_id":"membayar"},{"word":"expensive","meaning_id":"mahal"},{"word":"table","meaning_id":"meja"},{"word":"hot","meaning_id":"panas"}]},{"type":"grammar","topic_slug":"countable-uncountable"},{"type":"read","title":"Bacaan 1: Lunch with a Friend","text_ref":"Lunch with a Friend"},{"type":"read","title":"Bacaan 2: Food in My Family","text_ref":"Food in My Family"},{"type":"listen","title":"Dengarkan","text":"I want some water, please. How much is the food? It is not expensive. I pay and we go.","note_id":"Dengarkan dua kali, lalu ulangi dengan suaramu sendiri."},{"type":"exercise","title":"Latihan unit","count":5},{"type":"speak","title":"Ucapkan","sentences":["I want some water, please.","How much is it?","The food is very good."],"scenario_id":"restaurant-order"}]'),
      ('belanja', '[{"type":"vocab","title":"Kata-kata unit","items":[{"word":"buy","meaning_id":"membeli"},{"word":"sell","meaning_id":"menjual"},{"word":"shop","meaning_id":"toko"},{"word":"market","meaning_id":"pasar"},{"word":"price","meaning_id":"harga"},{"word":"money","meaning_id":"uang"},{"word":"cost","meaning_id":"berharga; biaya"},{"word":"pay","meaning_id":"membayar"}]},{"type":"grammar","topic_slug":"comparatives-superlatives"},{"type":"read","title":"Bacaan 1: A New Phone","text_ref":"A New Phone"},{"type":"read","title":"Bacaan 2: At the Market","text_ref":"At the Market"},{"type":"listen","title":"Dengarkan","text":"This phone is bigger than that phone. The price is good. I buy it and I pay with money.","note_id":"Dengarkan dua kali, lalu ulangi dengan suaramu sendiri."},{"type":"exercise","title":"Latihan unit","count":5},{"type":"speak","title":"Ucapkan","sentences":["How much is this phone?","This one is bigger than that one.","I want to buy it."]}]'),
      ('arah-tempat', '[{"type":"vocab","title":"Kata-kata unit","items":[{"word":"street","meaning_id":"jalan"},{"word":"city","meaning_id":"kota"},{"word":"station","meaning_id":"stasiun"},{"word":"bank","meaning_id":"bank"},{"word":"park","meaning_id":"taman"},{"word":"hotel","meaning_id":"hotel"},{"word":"turn","meaning_id":"belok; memutar"},{"word":"right","meaning_id":"kanan; benar"}]},{"type":"grammar","topic_slug":"present-continuous"},{"type":"read","title":"Bacaan 1: Where Is the Bank?","text_ref":"Where Is the Bank?"},{"type":"read","title":"Bacaan 2: A Walk in the City","text_ref":"A Walk in the City"},{"type":"listen","title":"Dengarkan","text":"I am standing at the station. My friend is coming. We are walking to the park. It is near the hotel.","note_id":"Dengarkan dua kali, lalu ulangi dengan suaramu sendiri."},{"type":"exercise","title":"Latihan unit","count":5},{"type":"speak","title":"Ucapkan","sentences":["Where is the bank?","Turn right at the street.","I am walking to the park."]}]'),
      ('cerita-masa-lalu', '[{"type":"vocab","title":"Kata-kata unit","items":[{"word":"yesterday","meaning_id":"kemarin"},{"word":"last","meaning_id":"lalu; terakhir"},{"word":"took","meaning_id":"mengambil (lampau take)"},{"word":"went","meaning_id":"pergi (lampau go)"},{"word":"ate","meaning_id":"makan (lampau eat)"},{"word":"got","meaning_id":"mendapat (lampau get)"},{"word":"saw","meaning_id":"melihat (lampau see)"},{"word":"stayed","meaning_id":"tinggal; menginap"}]},{"type":"grammar","topic_slug":"past-simple"},{"type":"read","title":"Bacaan 1: Last Weekend","text_ref":"Last Weekend"},{"type":"read","title":"Bacaan 2: A Trip to the Village","text_ref":"A Trip to the Village"},{"type":"listen","title":"Dengarkan","text":"Last weekend I went to the park. We played games and we ate some food. I was tired but happy.","note_id":"Dengarkan dua kali, lalu ulangi dengan suaramu sendiri."},{"type":"exercise","title":"Latihan unit","count":5},{"type":"speak","title":"Ucapkan","sentences":["I went to the park yesterday.","We played games.","It was a good day."]}]'),
      ('rencana-masa-depan', '[{"type":"vocab","title":"Kata-kata unit","items":[{"word":"plan","meaning_id":"rencana; merencanakan"},{"word":"future","meaning_id":"masa depan"},{"word":"next","meaning_id":"berikutnya"},{"word":"tomorrow","meaning_id":"besok"},{"word":"want","meaning_id":"ingin"},{"word":"hope","meaning_id":"berharap"},{"word":"need","meaning_id":"perlu; butuh"},{"word":"study","meaning_id":"belajar"}]},{"type":"grammar","topic_slug":"future-going-to-will"},{"type":"read","title":"Bacaan 1: Plans for Next Year","text_ref":"Plans for Next Year"},{"type":"read","title":"Bacaan 2: Food for My Mother","text_ref":"Food for My Mother"},{"type":"listen","title":"Dengarkan","text":"Tomorrow I am going to study English. I will start at 4. I hope it will be a good day.","note_id":"Dengarkan dua kali, lalu ulangi dengan suaramu sendiri."},{"type":"exercise","title":"Latihan unit","count":5},{"type":"speak","title":"Ucapkan","sentences":["I am going to study English.","I will call you tomorrow.","I hope you will like it."]}]'),
      ('pekerjaan-kampus', '[{"type":"vocab","title":"Kata-kata unit","items":[{"word":"job","meaning_id":"pekerjaan; jabatan"},{"word":"work","meaning_id":"bekerja"},{"word":"office","meaning_id":"kantor"},{"word":"university","meaning_id":"universitas"},{"word":"class","meaning_id":"kelas"},{"word":"report","meaning_id":"laporan"},{"word":"must","meaning_id":"harus (kewajiban kuat)"},{"word":"should","meaning_id":"sebaiknya"}]},{"type":"grammar","topic_slug":"modals-obligation"},{"type":"read","title":"Bacaan 1: My First Job","text_ref":"My First Job"},{"type":"read","title":"Bacaan 2: A Busy Day at the University","text_ref":"A Busy Day at the University"},{"type":"listen","title":"Dengarkan","text":"I have to get up early. I must go to work at 8. I should finish my report today.","note_id":"Dengarkan dua kali, lalu ulangi dengan suaramu sendiri."},{"type":"exercise","title":"Latihan unit","count":5},{"type":"speak","title":"Ucapkan","sentences":["I work in an office.","I have to write a report.","You should rest."],"scenario_id":"job-interview"}]')
  ) AS t(slug, base)
  LOOP
    UPDATE course_units cu
    SET steps = (
          SELECT coalesce(jsonb_agg(
                   CASE WHEN e.value ? 'text_ref'
                        THEN (e.value - 'text_ref') || jsonb_build_object('text_id',
                               (SELECT x.id::text FROM texts x WHERE x.title = e.value->>'text_ref' AND x.author = 'Literary Language Lab' ORDER BY x.created_at LIMIT 1))
                        ELSE e.value END
                   ORDER BY e.ord), '[]'::jsonb)
          FROM jsonb_array_elements(r.base::jsonb) WITH ORDINALITY AS e(value, ord)
        )
        || coalesce((SELECT jsonb_agg(o) FROM jsonb_array_elements(cu.steps) o WHERE o ? 'tag'), '[]'::jsonb),
        updated_at = NOW()
    WHERE cu.slug = r.slug
      AND (cu.steps->0->>'type') = 'vocab'
      AND jsonb_array_length(coalesce(cu.steps->0->'items', '[]'::jsonb)) = 0;
  END LOOP;
END
$do$;

-- 3. Soal latihan draft per unit (tag 'seed-0016'; terbitkan setelah ditinjau di Admin -> Konten -> Latihan)
INSERT INTO exercises (type, cefr_level, topic_slug, unit_slug, tags, prompt, answer, explanation_id, status, source)
SELECT v.type, v.cefr, NULL, v.unit, ARRAY['seed-0016'], v.prompt::jsonb, v.answer::jsonb, v.expl, 'draft', 'admin'
FROM (VALUES
  ('bunyi-huruf', 'A1', 'mcq', '{"question":"Kata mana yang diawali bunyi /b/, seperti \"buku\"?","options":["book","water","friend"]}', '{"correct":"book"}', 'Book dimulai dengan bunyi b, seperti pada kata "buku".'),
  ('bunyi-huruf', 'A1', 'cloze', '{"text":"My ___ is Rina.","hint":"Saya bernama Rina."}', '{"blanks":[["name"]]}', 'Name berarti nama: My name is Rina.'),
  ('bunyi-huruf', 'A1', 'order', '{"tokens":["name","is","Rina",".","My"],"hint":"Nama saya Rina."}', '{"sentences":["My name is Rina."]}', 'Urutannya: My (milik saya) + name (nama) + is + isi.'),
  ('bunyi-huruf', 'A1', 'match', '{"lefts":["book","water","friend","school"],"rights":["air","teman","sekolah","buku"],"instruction":"Pasangkan kata dengan artinya."}', '{"pairs":[{"left":"book","right":"buku"},{"left":"water","right":"air"},{"left":"friend","right":"teman"},{"left":"school","right":"sekolah"}]}', 'book = buku; water = air; friend = teman; school = sekolah'),
  ('bunyi-huruf', 'A1', 'dictation', '{"text":"My name is Rina."}', '{"accept":["My name is Rina."]}', 'Kalimat yang dibacakan: "My name is Rina."'),
  ('angka-waktu-tanggal', 'A1', 'mcq', '{"question":"Pilih kata depan yang benar: School starts ___ 8.","options":["at","on","in"]}', '{"correct":"at"}', 'Untuk jam, pakai at: at 8. On untuk hari, in untuk bulan dan tahun.'),
  ('angka-waktu-tanggal', 'A1', 'cloze', '{"text":"My birthday is ___ May.","hint":"Ulang tahun saya bulan Mei."}', '{"blanks":[["in"]]}', 'Untuk bulan pakai in: in May.'),
  ('angka-waktu-tanggal', 'A1', 'order', '{"tokens":["get","up","at","6",".","I"],"hint":"Saya bangun pukul 6."}', '{"sentences":["I get up at 6."]}', 'Subjek + kata kerja + at + jam.'),
  ('angka-waktu-tanggal', 'A1', 'match', '{"lefts":["morning","night","hour","minute"],"rights":["malam","jam (lamanya waktu)","menit","pagi"],"instruction":"Pasangkan kata dengan artinya."}', '{"pairs":[{"left":"morning","right":"pagi"},{"left":"night","right":"malam"},{"left":"hour","right":"jam (lamanya waktu)"},{"left":"minute","right":"menit"}]}', 'morning = pagi; night = malam; hour = jam (lamanya waktu); minute = menit'),
  ('angka-waktu-tanggal', 'A1', 'dictation', '{"text":"I get up at 6."}', '{"accept":["I get up at 6."]}', 'Kalimat yang dibacakan: "I get up at 6."'),
  ('keluarga-orang', 'A1', 'mcq', '{"question":"Pilih kata yang benar: This is ___ mother.","options":["my","me","I"]}', '{"correct":"my"}', 'My (milik saya) dipasang sebelum kata benda: my mother.'),
  ('keluarga-orang', 'A1', 'cloze', '{"text":"Dewi is my friend. ___ is kind.","hint":"Dewi temanku. Dia baik hati."}', '{"blanks":[["She"]]}', 'Untuk perempuan pakai she.'),
  ('keluarga-orang', 'A1', 'order', '{"tokens":["father","is","a","teacher",".","My"],"hint":"Ayah saya seorang guru."}', '{"sentences":["My father is a teacher."]}', 'My + father + is + a teacher.'),
  ('keluarga-orang', 'A1', 'match', '{"lefts":["family","mother","father","child"],"rights":["ibu","ayah","anak","keluarga"],"instruction":"Pasangkan kata dengan artinya."}', '{"pairs":[{"left":"family","right":"keluarga"},{"left":"mother","right":"ibu"},{"left":"father","right":"ayah"},{"left":"child","right":"anak"}]}', 'family = keluarga; mother = ibu; father = ayah; child = anak'),
  ('keluarga-orang', 'A1', 'dictation', '{"text":"I have a small family."}', '{"accept":["I have a small family."]}', 'Kalimat yang dibacakan: "I have a small family."'),
  ('rumah-benda', 'A1', 'mcq', '{"question":"There ___ two chairs in the room.","options":["is","are","am"]}', '{"correct":"are"}', 'Benda jamak (two chairs) memakai there are. Satu benda memakai there is.'),
  ('rumah-benda', 'A1', 'cloze', '{"text":"There ___ a bed in my room.","hint":"Ada sebuah tempat tidur di kamar saya."}', '{"blanks":[["is"]]}', 'Satu benda: there is.'),
  ('rumah-benda', 'A1', 'order', '{"tokens":["is","a","table",".","There"],"hint":"Ada sebuah meja."}', '{"sentences":["There is a table."]}', 'There is + a + benda.'),
  ('rumah-benda', 'A1', 'match', '{"lefts":["house","room","table","chair"],"rights":["ruangan; kamar","meja","kursi","rumah"],"instruction":"Pasangkan kata dengan artinya."}', '{"pairs":[{"left":"house","right":"rumah"},{"left":"room","right":"ruangan; kamar"},{"left":"table","right":"meja"},{"left":"chair","right":"kursi"}]}', 'house = rumah; room = ruangan; kamar; table = meja; chair = kursi'),
  ('rumah-benda', 'A1', 'dictation', '{"text":"There is a table in the room."}', '{"accept":["There is a table in the room."]}', 'Kalimat yang dibacakan: "There is a table in the room."'),
  ('rutinitas-harian', 'A1', 'mcq', '{"question":"She ___ to school every day.","options":["go","goes","going"]}', '{"correct":"goes"}', 'Untuk he/she/it di present simple, kata kerja ditambah -s: she goes.'),
  ('rutinitas-harian', 'A1', 'cloze', '{"text":"My father ___ in an office.","hint":"Ayah saya bekerja di kantor."}', '{"blanks":[["works"]]}', 'Subjek orang ketiga tunggal: work menjadi works.'),
  ('rutinitas-harian', 'A1', 'order', '{"tokens":["gets","up","early",".","Budi"],"hint":"Budi bangun pagi-pagi."}', '{"sentences":["Budi gets up early."]}', 'Budi + gets up + early.'),
  ('rutinitas-harian', 'A1', 'match', '{"lefts":["wash","eat","work","start"],"rights":["makan","bekerja; pekerjaan","mulai","mencuci; membasuh"],"instruction":"Pasangkan kata dengan artinya."}', '{"pairs":[{"left":"wash","right":"mencuci; membasuh"},{"left":"eat","right":"makan"},{"left":"work","right":"bekerja; pekerjaan"},{"left":"start","right":"mulai"}]}', 'wash = mencuci; membasuh; eat = makan; work = bekerja; pekerjaan; start = mulai'),
  ('rutinitas-harian', 'A1', 'dictation', '{"text":"Budi gets up at 5."}', '{"accept":["Budi gets up at 5."]}', 'Kalimat yang dibacakan: "Budi gets up at 5."'),
  ('makanan-restoran', 'A1', 'mcq', '{"question":"Pilih yang benar: I want ___ water.","options":["some","a","many"]}', '{"correct":"some"}', 'Water tidak bisa dihitung, jadi memakai some, bukan a atau many.'),
  ('makanan-restoran', 'A1', 'cloze', '{"text":"How ___ is the food?","hint":"Berapa harga makanannya?"}', '{"blanks":[["much"]]}', 'Untuk menanyakan harga atau jumlah benda tak terhitung: how much.'),
  ('makanan-restoran', 'A1', 'order', '{"tokens":["want","some","water",".","I"],"hint":"Saya mau air."}', '{"sentences":["I want some water."]}', 'I + want + some + water.'),
  ('makanan-restoran', 'A1', 'match', '{"lefts":["food","eat","water","want"],"rights":["makan","air","ingin; mau","makanan"],"instruction":"Pasangkan kata dengan artinya."}', '{"pairs":[{"left":"food","right":"makanan"},{"left":"eat","right":"makan"},{"left":"water","right":"air"},{"left":"want","right":"ingin; mau"}]}', 'food = makanan; eat = makan; water = air; want = ingin; mau'),
  ('makanan-restoran', 'A1', 'dictation', '{"text":"I want some water, please."}', '{"accept":["I want some water, please."]}', 'Kalimat yang dibacakan: "I want some water, please."'),
  ('belanja', 'A2', 'mcq', '{"question":"This phone is ___ than that phone.","options":["big","bigger","biggest"]}', '{"correct":"bigger"}', 'Membandingkan dua benda: kata sifat + -er + than.'),
  ('belanja', 'A2', 'cloze', '{"text":"Good, better, ___.","hint":"Bagus, lebih bagus, paling bagus."}', '{"blanks":[["best"]]}', 'Bentuk tak beraturan: good, better, best.'),
  ('belanja', 'A2', 'order', '{"tokens":["phone","is","bigger","than","that","one",".","This"],"hint":"Ponsel ini lebih besar daripada yang itu."}', '{"sentences":["This phone is bigger than that one."]}', 'Benda 1 + is + kata sifat-er + than + benda 2.'),
  ('belanja', 'A2', 'match', '{"lefts":["buy","sell","shop","market"],"rights":["menjual","toko","pasar","membeli"],"instruction":"Pasangkan kata dengan artinya."}', '{"pairs":[{"left":"buy","right":"membeli"},{"left":"sell","right":"menjual"},{"left":"shop","right":"toko"},{"left":"market","right":"pasar"}]}', 'buy = membeli; sell = menjual; shop = toko; market = pasar'),
  ('belanja', 'A2', 'dictation', '{"text":"This phone is bigger than that phone."}', '{"accept":["This phone is bigger than that phone."]}', 'Kalimat yang dibacakan: "This phone is bigger than that phone."'),
  ('arah-tempat', 'A2', 'mcq', '{"question":"I ___ at the station now.","options":["wait","am waiting","waiting"]}', '{"correct":"am waiting"}', 'Kejadian yang sedang berlangsung: am/is/are + kata kerja-ing.'),
  ('arah-tempat', 'A2', 'cloze', '{"text":"They ___ walking to the park.","hint":"Mereka sedang berjalan ke taman."}', '{"blanks":[["are"]]}', 'They memakai are: they are walking.'),
  ('arah-tempat', 'A2', 'order', '{"tokens":["are","walking","to","the","park",".","We"],"hint":"Kami sedang berjalan ke taman."}', '{"sentences":["We are walking to the park."]}', 'We + are + walking + to + the park.'),
  ('arah-tempat', 'A2', 'match', '{"lefts":["street","city","station","bank"],"rights":["kota","stasiun","bank","jalan"],"instruction":"Pasangkan kata dengan artinya."}', '{"pairs":[{"left":"street","right":"jalan"},{"left":"city","right":"kota"},{"left":"station","right":"stasiun"},{"left":"bank","right":"bank"}]}', 'street = jalan; city = kota; station = stasiun; bank = bank'),
  ('arah-tempat', 'A2', 'dictation', '{"text":"I am standing at the station."}', '{"accept":["I am standing at the station."]}', 'Kalimat yang dibacakan: "I am standing at the station."'),
  ('cerita-masa-lalu', 'A2', 'mcq', '{"question":"Yesterday I ___ to school by bus.","options":["go","went","going"]}', '{"correct":"went"}', 'Kejadian selesai di masa lalu: bentuk lampau go adalah went.'),
  ('cerita-masa-lalu', 'A2', 'cloze', '{"text":"We ___ some food at the park.","hint":"Kami makan makanan di taman."}', '{"blanks":[["ate"]]}', 'Bentuk lampau eat adalah ate.'),
  ('cerita-masa-lalu', 'A2', 'order', '{"tokens":["went","to","the","park","yesterday",".","I"],"hint":"Kemarin saya pergi ke taman."}', '{"sentences":["I went to the park yesterday."]}', 'I + went + to the park + yesterday.'),
  ('cerita-masa-lalu', 'A2', 'match', '{"lefts":["yesterday","last","took","went"],"rights":["lalu; terakhir","mengambil (lampau take)","pergi (lampau go)","kemarin"],"instruction":"Pasangkan kata dengan artinya."}', '{"pairs":[{"left":"yesterday","right":"kemarin"},{"left":"last","right":"lalu; terakhir"},{"left":"took","right":"mengambil (lampau take)"},{"left":"went","right":"pergi (lampau go)"}]}', 'yesterday = kemarin; last = lalu; terakhir; took = mengambil (lampau take); went = pergi (lampau go)'),
  ('cerita-masa-lalu', 'A2', 'dictation', '{"text":"Last weekend I went to the park."}', '{"accept":["Last weekend I went to the park."]}', 'Kalimat yang dibacakan: "Last weekend I went to the park."'),
  ('rencana-masa-depan', 'A2', 'mcq', '{"question":"Tomorrow I ___ visit my friend.","options":["am going to","going to","go to"]}', '{"correct":"am going to"}', 'Rencana: am/is/are going to + kata kerja bentuk dasar.'),
  ('rencana-masa-depan', 'A2', 'cloze', '{"text":"I think it ___ rain tomorrow.","hint":"Saya kira besok akan hujan."}', '{"blanks":[["will"]]}', 'Prediksi umum memakai will + kata kerja dasar.'),
  ('rencana-masa-depan', 'A2', 'order', '{"tokens":["am","going","to","cook",".","I"],"hint":"Saya akan memasak."}', '{"sentences":["I am going to cook."]}', 'I + am going to + kata kerja dasar.'),
  ('rencana-masa-depan', 'A2', 'match', '{"lefts":["plan","future","next","tomorrow"],"rights":["masa depan","berikutnya","besok","rencana; merencanakan"],"instruction":"Pasangkan kata dengan artinya."}', '{"pairs":[{"left":"plan","right":"rencana; merencanakan"},{"left":"future","right":"masa depan"},{"left":"next","right":"berikutnya"},{"left":"tomorrow","right":"besok"}]}', 'plan = rencana; merencanakan; future = masa depan; next = berikutnya; tomorrow = besok'),
  ('rencana-masa-depan', 'A2', 'dictation', '{"text":"Tomorrow I am going to study English."}', '{"accept":["Tomorrow I am going to study English."]}', 'Kalimat yang dibacakan: "Tomorrow I am going to study English."'),
  ('pekerjaan-kampus', 'A2', 'mcq', '{"question":"You ___ wear a helmet. It is the law.","options":["must","should","can"]}', '{"correct":"must"}', 'Must menyatakan kewajiban atau aturan. Should hanya saran.'),
  ('pekerjaan-kampus', 'A2', 'cloze', '{"text":"I ___ to get up early because my class starts at 7.","hint":"Saya harus bangun pagi karena kelas mulai pukul 7."}', '{"blanks":[["have"]]}', 'Have to berarti harus.'),
  ('pekerjaan-kampus', 'A2', 'order', '{"tokens":["should","rest","a","little",".","You"],"hint":"Sebaiknya kamu istirahat sebentar."}', '{"sentences":["You should rest a little."]}', 'You + should + kata kerja dasar.'),
  ('pekerjaan-kampus', 'A2', 'match', '{"lefts":["job","work","office","university"],"rights":["bekerja","kantor","universitas","pekerjaan; jabatan"],"instruction":"Pasangkan kata dengan artinya."}', '{"pairs":[{"left":"job","right":"pekerjaan; jabatan"},{"left":"work","right":"bekerja"},{"left":"office","right":"kantor"},{"left":"university","right":"universitas"}]}', 'job = pekerjaan; jabatan; work = bekerja; office = kantor; university = universitas'),
  ('pekerjaan-kampus', 'A2', 'dictation', '{"text":"I have to get up early."}', '{"accept":["I have to get up early."]}', 'Kalimat yang dibacakan: "I have to get up early."')
) AS v(unit, cefr, type, prompt, answer, expl)
WHERE NOT EXISTS (SELECT 1 FROM exercises e WHERE e.unit_slug = v.unit AND 'seed-0016' = ANY(e.tags));
