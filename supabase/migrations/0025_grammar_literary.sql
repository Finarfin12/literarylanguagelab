-- Migration 0025: Topik grammar B2-C1 bertema sastra (Fase 29, item 4): inversi, subjunctive, dan klausa partisipel.
-- Aman dijalankan ulang. Bergantung pada 0007 (grammar_topics) dan 0012 (exercises).
-- Kode tetap jalan sebelum migrasi ini: tiga topik hanya belum muncul di Grammar Dasar.
-- Teks dan contoh ditulis sendiri (bukan salinan buku). Soal masuk sebagai DRAFT; terbitkan lewat Admin -> Konten -> Latihan.
--
-- ROLLBACK:
--   DELETE FROM exercises WHERE 'grammar-sastra' = ANY(tags) AND topic_slug IN ('inversion-for-emphasis', 'subjunctive-mood', 'participle-clauses');
--   DELETE FROM grammar_topics WHERE slug IN ('inversion-for-emphasis', 'subjunctive-mood', 'participle-clauses');

-- 1. Tiga topik lanjutan (urutan setelah 20 topik A1-B1).
INSERT INTO grammar_topics (slug, title, cefr_level, sort_order, summary_id, examples) VALUES
  ('inversion-for-emphasis', 'Inversion for emphasis (Never have I ...)', 'C1', 21,
   'Inversi menaruh kata bantu sebelum subjek setelah kata keterangan negatif atau pembatas di awal kalimat, untuk memberi penekanan. Sering muncul dalam sastra, pidato, dan tulisan formal. Polanya: kata keterangan + kata bantu + subjek + kata kerja utama. Bila kalimat biasa tidak punya kata bantu, tambahkan do, does, atau did. Kata pemicu yang umum: never, rarely, seldom, hardly ... when, no sooner ... than, not only ... but also, only after, little. Dalam percakapan sehari-hari bentuk ini terdengar sangat formal atau puitis.',
   '[{"en": "Never have I seen such a quiet harbour.", "id": "Belum pernah aku melihat pelabuhan setenang ini."}, {"en": "Rarely does the narrator reveal what he feels.", "id": "Jarang sekali sang pencerita mengungkapkan perasaannya."}, {"en": "No sooner had she opened the letter than the lamp went out.", "id": "Begitu dia membuka surat itu, lampu padam."}, {"en": "Not only did he lie, but he also denied it.", "id": "Dia tidak hanya berbohong, tetapi juga menyangkalnya."}]'::jsonb),
  ('subjunctive-mood', 'Subjunctive: were, wish, and that-clauses', 'C1', 22,
   'Subjunctive menyatakan hal yang diandaikan, diinginkan, atau diwajibkan, bukan fakta. Ada tiga pola utama. Pertama, were untuk semua subjek setelah if, wish, dan as if (If I were you; I wish he were here). Kedua, subjunctive mandatif: that + bentuk dasar kata kerja setelah suggest, insist, demand, recommend, atau ungkapan seperti it is essential (It is vital that she be present). Kata kerjanya tidak memakai -s untuk orang ketiga tunggal dan tidak berubah kala. Ketiga, ungkapan tetap seperti be that as it may dan so be it. Bentuk ini terasa formal dan sering dipakai dalam sastra dan dokumen resmi.',
   '[{"en": "If I were the narrator, I would trust no one.", "id": "Seandainya aku menjadi sang pencerita, aku tidak akan memercayai siapa pun."}, {"en": "She wished that the night were longer.", "id": "Dia berharap malam itu lebih panjang."}, {"en": "The editor insisted that the poem be rewritten.", "id": "Penyunting itu berkeras agar puisi itu ditulis ulang."}, {"en": "It is essential that he arrive before dawn.", "id": "Sangat penting dia tiba sebelum fajar."}]'::jsonb),
  ('participle-clauses', 'Participle clauses (-ing, -ed, having + -ed)', 'C1', 23,
   'Klausa partisipel memadatkan klausa bawahan sehingga kalimat lebih ringkas, dan banyak dipakai dalam prosa sastra dan tulisan akademik. Subjeknya harus sama dengan subjek klausa utama. Bentuk -ing menyatakan tindakan aktif yang bersamaan atau menjadi sebab (Walking home, she met a friend). Bentuk -ed bermakna pasif (Written in 1813, the novel still feels fresh). Having + -ed menyatakan tindakan yang selesai lebih dulu (Having finished the manuscript, she sent it). Bentuk negatif: Not wanting to ... Hati-hati dengan dangling participle, yaitu klausa partisipel yang subjeknya tidak cocok dengan subjek klausa utama.',
   '[{"en": "Walking along the shore, the old man recited the poem.", "id": "Sambil berjalan di tepi pantai, lelaki tua itu melafalkan puisi itu."}, {"en": "Written in 1813, the novel still feels fresh.", "id": "Ditulis pada 1813, novel itu masih terasa segar."}, {"en": "Having finished the manuscript, she sent it to the publisher.", "id": "Setelah menyelesaikan naskah itu, dia mengirimkannya ke penerbit."}, {"en": "Not wanting to wake the child, he closed the door softly.", "id": "Karena tidak ingin membangunkan anak itu, dia menutup pintu pelan-pelan."}]'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- 2. Lima soal per topik sebagai DRAFT. Idempoten: dilewati bila topik itu sudah punya soal bertag 'grammar-sastra'.
-- Bentuk prompt/answer: lib/exercises/types.ts.
INSERT INTO exercises (type, cefr_level, topic_slug, unit_slug, tags, prompt, answer, explanation_id, status, source)
SELECT e.type, e.level, e.topic, NULL, ARRAY['grammar-sastra'], e.prompt::jsonb, e.answer::jsonb, e.explanation_id, 'draft', 'admin'
FROM (VALUES
  -- Inversion for emphasis
  ('mcq', 'C1', 'inversion-for-emphasis',
   '{"question":"Choose the correct sentence.","options":["Never I have seen such a sight.","Never have I seen such a sight.","Never I saw have such a sight.","Never seen have I such a sight."]}',
   '{"correct":"Never have I seen such a sight."}',
   'Setelah never di awal kalimat, kata bantu (have) mendahului subjek (I): Never have I seen ...'),
  ('mcq', 'C1', 'inversion-for-emphasis',
   '{"question":"No sooner ___ she left than the rain began.","options":["had","did","has","was"]}',
   '{"correct":"had"}',
   'No sooner ... than memakai past perfect dengan inversi: No sooner had she left than ... Kata bantunya had.'),
  ('cloze', 'C1', 'inversion-for-emphasis',
   '{"text":"Rarely ___ she speak of her childhood.","hint":"Jarang sekali dia bercerita tentang masa kecilnya."}',
   '{"blanks":[["does"]]}',
   'Kalimat biasa She speaks tidak punya kata bantu, jadi setelah rarely di awal ditambah does: Rarely does she speak ... Kata kerja utama kembali ke bentuk dasar.'),
  ('order', 'C1', 'inversion-for-emphasis',
   '{"tokens":["did","he","Not","only","lie",",","but","he","also","denied","it","."],"hint":"Dia tidak hanya berbohong, tetapi juga menyangkalnya."}',
   '{"sentences":["Not only did he lie, but he also denied it."]}',
   'Not only di awal memicu inversi pada klausa pertama (did he lie). Klausa kedua tetap urutan biasa (he also denied it).'),
  ('mcq', 'C1', 'inversion-for-emphasis',
   '{"question":"Inversion for emphasis is most typical of which style?","options":["Formal or literary writing and speeches","Casual chat between friends","Text messages","Shopping lists"]}',
   '{"correct":"Formal or literary writing and speeches"}',
   'Inversi untuk penekanan terdengar formal atau puitis, jadi lazim dalam sastra, pidato, dan tulisan resmi, bukan percakapan santai.'),
  -- Subjunctive
  ('mcq', 'C1', 'subjunctive-mood',
   '{"question":"If I ___ you, I would revise the ending.","options":["was","were","am","be"]}',
   '{"correct":"were"}',
   'Pengandaian yang berlawanan dengan kenyataan memakai were untuk semua subjek dalam bahasa baku: If I were you ...'),
  ('mcq', 'C1', 'subjunctive-mood',
   '{"question":"The committee recommended that she ___ the chapter.","options":["rewrites","rewrite","rewrote","rewriting"]}',
   '{"correct":"rewrite"}',
   'Setelah recommend + that, subjunctive mandatif memakai bentuk dasar kata kerja tanpa -s dan tanpa perubahan kala.'),
  ('cloze', 'C1', 'subjunctive-mood',
   '{"text":"It is vital that every candidate ___ present.","hint":"Sangat penting setiap calon hadir."}',
   '{"blanks":[["be"]]}',
   'Setelah it is vital that, subjunctive mandatif memakai bentuk dasar be untuk semua subjek (bukan is atau are).'),
  ('mcq', 'C1', 'subjunctive-mood',
   '{"question":"Which sentence uses the subjunctive correctly?","options":["He demands that she pays the fine.","He demands that she pay the fine.","He demands that she paying the fine.","He demands that she paid the fine."]}',
   '{"correct":"He demands that she pay the fine."}',
   'Setelah demand + that, kata kerja memakai bentuk dasar: she pay (bukan pays atau paid).'),
  ('order', 'C1', 'subjunctive-mood',
   '{"tokens":["were","I","a","wish","bird","I","."],"hint":"Aku berharap aku seekor burung."}',
   '{"sentences":["I wish I were a bird."]}',
   'Setelah wish yang menyatakan harapan berlawanan dengan kenyataan, dipakai were: I wish I were ...'),
  -- Participle clauses
  ('mcq', 'C1', 'participle-clauses',
   '{"question":"___ the letter twice, she finally understood.","options":["Having read","Read","Reads","To have read"]}',
   '{"correct":"Having read"}',
   'Having + -ed menyatakan tindakan yang selesai lebih dulu dan subjeknya sama dengan klausa utama (she): Having read the letter twice, she finally understood.'),
  ('mcq', 'C1', 'participle-clauses',
   '{"question":"Which sentence is correct?","options":["Walking home, the rain started.","Walking home, I was caught in the rain.","Walking home, the rain caught me.","Walked home, I was caught in the rain."]}',
   '{"correct":"Walking home, I was caught in the rain."}',
   'Subjek klausa partisipel harus sama dengan subjek klausa utama. Yang berjalan pulang adalah I, bukan the rain, jadi hanya kalimat kedua yang benar.'),
  ('cloze', 'C1', 'participle-clauses',
   '{"text":"___ by an unknown author, the poem was never published.","hint":"Ditulis oleh pengarang yang tidak dikenal."}',
   '{"blanks":[["Written","written"]]}',
   'Puisi itu ditulis (pasif), jadi dipakai partisipel -ed: Written by an unknown author, ...'),
  ('mcq', 'C1', 'participle-clauses',
   '{"question":"Which part is the participle clause in: Not wanting to disturb them, he left quietly.","options":["Not wanting to disturb them","he left quietly","left quietly","Not wanting"]}',
   '{"correct":"Not wanting to disturb them"}',
   'Klausa partisipel negatif: Not wanting to disturb them. Klausa utamanya adalah he left quietly.'),
  ('order', 'C1', 'participle-clauses',
   '{"tokens":["finished","she","Having","the","book",",","slept","."],"hint":"Setelah menyelesaikan buku itu, dia tidur."}',
   '{"sentences":["Having finished the book, she slept."]}',
   'Having + -ed untuk tindakan yang selesai lebih dulu, diikuti koma dan klausa utama dengan subjek yang sama.')
) AS e(type, level, topic, prompt, answer, explanation_id)
WHERE EXISTS (SELECT 1 FROM grammar_topics g WHERE g.slug = e.topic)
  AND NOT EXISTS (SELECT 1 FROM exercises x WHERE x.topic_slug = e.topic AND 'grammar-sastra' = ANY (x.tags));
