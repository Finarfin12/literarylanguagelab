# Panduan Penulisan Modul Belajar (Fase 24–28)

Untuk siapa pun yang menulis pelajaran: sesi Claude, pemilik (manual di Admin), atau AI ("Buat draf dengan AI"). Semua jalur berakhir **draf → ditinjau → terbit**. Daftar mata pelajaran dan urutannya: [COMPETENCY_MAP.md](COMPETENCY_MAP.md).

## 1. Prinsip

1. **Setara kedalaman modul, bukan salinan modul.** Penjelasan, contoh, dan latihan **ditulis sendiri**. Jangan menyalin definisi, urutan paragraf, contoh, atau latihan khas buku atau modul mana pun, termasuk yang gratis dibaca. Gratis dibaca tidak berarti boleh disalin.
2. **Sumber harus nyata.** Setiap rujukan dicek dulu (alamat terbuka, judul sesuai). Yang tidak bisa dipastikan ditandai `perlu-cek` dan **tidak dikarang**. Jangan menulis angka hasil penelitian ("sebanyak 40% pembaca...") tanpa rujukan yang sudah dicek; lebih baik tulis tanpa angka.
3. **Bisa dipelajari tanpa alat dan tanpa AI.** Pelajaran, contoh, latihan, rangkuman, dan tugas lengkap sendiri. Alat hanya tombol "Praktikkan" opsional.
4. **Bahasa:** Indonesia yang jelas dan hangat. Istilah Inggris dijelaskan saat pertama muncul. Setiap contoh Inggris **selalu dibahas**: apa yang diperhatikan dan mengapa.
5. **Bukan kuliah resmi.** Tanpa kode mata kuliah, "Semester", SKS, nilai, atau klaim menggantikan perkuliahan. Hindari "akurat", "siap skripsi/TAP", "aman secara hukum".
6. **Teks contoh:** tulisan sendiri, domain publik, atau berlisensi yang mengizinkan (catat di `sumber`). Kutipan panjang dari karya berhak cipta tidak dipakai.

## 2. Pola satu pelajaran

Panjang isi **600–1.500 kata** (dihitung dari penjelasan dan contoh; rangkuman, tugas, dan soal tidak dihitung). Satu gagasan per bagian.

```text
Tujuan (frontmatter)  →  Penjelasan  →  Contoh & pembahasan  →  Latihan (min. 3 soal)
   →  Rangkuman  →  Tugas (bila relevan)  →  Sumber & bacaan lanjutan  →  (opsional) Praktikkan
```

- **Tujuan:** 2–4 kalimat kemampuan yang bisa diperiksa ("Menentukan kalimat topik sebuah paragraf"), bukan topik ("Tentang ide pokok").
- **Penjelasan:** konsep dibangun bertahap, dari yang paling dikenal pembaca. Hindari dinding teks: subjudul `###`, daftar, dan tabel kecil boleh.
- **Contoh & pembahasan:** minimal dua contoh bekerja (teks Inggris singkat dalam `>` atau blok `en`), lengkap dengan penalarannya.
- **Latihan:** campuran tipe (pilihan ganda, isian, susun kalimat, pasangkan, dikte, penyusun kalimat bila cocok). Setiap soal punya `explanation_id` yang menjelaskan *mengapa*, bukan sekadar kunci.
- **Rangkuman:** 4–7 butir yang bisa dibaca ulang sebagai ringkasan.
- **Tugas:** satu pekerjaan kecil yang dilakukan sendiri (tulis, tandai, ringkas). Tidak dinilai AI; pembaca membandingkan dengan contoh di pelajaran.

## 3. Format berkas

```text
content/modules/<mata-pelajaran>/
  _subject.md        metadata mata pelajaran
  01-<pelajaran>.md  satu berkas per pelajaran (urutan dari `order`)
  _kuis.md           kuis akhir (soal tanpa penjelasan panjang di berkas)
```

### `_subject.md`

```text
---
slug: membaca-cepat-ide-pokok
stage: fondasi
order: 1
title: Membaca Cepat & Ide Pokok
room: belajar-dasar
description: Satu kalimat ringkas tentang mata pelajaran ini.
outcomes:
- Kemampuan 1
- Kemampuan 2
sources:
- Judul sumber | https://alamat-terbuka | ok
---
```

`stage` = `fondasi | transisi | pendalaman | lanjut`. `order` = urutan belajar lintas tahap (angka unik, sesuai COMPETENCY_MAP). Tulis `ok` di sumber hanya bila sudah dicek; selain itu `perlu-cek` (bawaan).

### Pelajaran

````text
---
slug: membaca-cepat-1-skimming
subject: membaca-cepat-ide-pokok
order: 2
level: B1
title: Skimming: menangkap gambaran umum
tools: /library, /tools/nuance-detector
objectives:
- Menjelaskan apa itu skimming dan kapan memakainya
sources:
- Judul sumber | https://alamat-terbuka | ok
---

Teks pengantar (opsional)...

## Penjelasan
...

## Contoh dan pembahasan
> English example passage here.

## Latihan

```exercise
{ "type": "mcq", "prompt": { "question": "...", "options": ["a", "b"] }, "answer": { "correct": "a" }, "explanation_id": "..." }
```

## Rangkuman
- ...

## Tugas
Tulis ...
````

- `level` = level CEFR bacaan Inggris dalam soal (bawaan B1). `tools` = path yang ada di `lib/rooms.ts` (dicek `checkLesson`).
- Bagian bernama **Rangkuman**, **Tugas**, dan **Latihan** diambil terpisah; semua bagian lain menjadi isi pelajaran. Judul tingkat 2 (`##`) untuk bagian, `###` untuk subbagian.
- **Teks Inggris:** letakkan paragraf/kalimat contoh Inggris dalam kutipan blok (`>`) atau blok kode berbahasa `en` supaya diberi `lang="en"`. Istilah Inggris di tengah kalimat Indonesia ditulis miring (`*skimming*`).
- HTML mentah tidak dirender.

### Soal (blok ```exercise)

Satu blok = satu soal JSON. Bentuk sama dengan Admin → Konten → Latihan (`lib/exercises/types.ts`). Tipe: `mcq`, `cloze`, `order`, `match`, `dictation`, `pattern`.

```json
{ "type": "mcq", "prompt": { "question": "Apa fungsi kalimat topik?", "options": ["A", "B", "C"] }, "answer": { "correct": "A" }, "explanation_id": "Mengapa A benar dan lainnya tidak." }
{ "type": "cloze", "prompt": { "text": "Skimming means reading for the ___ idea.", "hint": "ide umum" }, "answer": { "blanks": [["general", "main"]] }, "explanation_id": "..." }
{ "type": "order", "prompt": { "tokens": ["Read", "the", "title", "first", "."], "hint": "Baca judulnya dulu." }, "answer": { "sentences": ["Read the title first."] }, "explanation_id": "..." }
{ "type": "match", "prompt": { "lefts": ["skimming", "scanning"], "rights": ["mencari data tertentu", "melihat gambaran umum"] }, "answer": { "pairs": [{ "left": "skimming", "right": "melihat gambaran umum" }, { "left": "scanning", "right": "mencari data tertentu" }] }, "explanation_id": "..." }
```

Pilihan ganda: jawaban benar harus **sama persis** dengan salah satu opsi; opsi berbeda panjangnya wajar, jangan membuat jawaban benar selalu paling panjang. Soal cloze: tiap `___` punya daftar jawaban yang diterima.

## 4. Alur kerja

1. Tulis berkas di `content/modules/` (draf sesi Claude) atau tulis manual di Admin → Konten → Modul.
2. `node scripts/import-modules.mjs --dry-run`: memeriksa format, soal, dan melaporkan `checkLesson` (tujuan, panjang, soal, rangkuman, sumber, alat, penanda perlu-cek).
3. Jalankan tanpa `--dry-run` (butuh migrasi `0023` dan kunci service): semua masuk **draft**. Pelajaran yang sudah ditinjau atau disunting di Admin **dilewati** kecuali `--force`.
4. Tinjau di Admin (peninjau bidang untuk linguistik dan teori penerjemahan), perbaiki, lalu **Terbitkan** per pelajaran dan mata pelajaran.
5. Nyalakan flag `modul_belajar` setelah tahap Fondasi lengkap dan ditinjau.

## 5. Daftar periksa sebelum menyerahkan draf

- [ ] Semua teks ditulis sendiri; tidak ada kalimat yang diambil dari buku atau modul.
- [ ] Setiap rujukan sudah dibuka dan sesuai; yang belum pasti bertanda `perlu-cek`.
- [ ] Setiap contoh Inggris dibahas; istilah Inggris dijelaskan saat pertama muncul.
- [ ] Minimal tiga soal bermakna dengan penjelasan alasan; ada rangkuman; ada tugas bila relevan.
- [ ] Panjang isi 600–1.500 kata; satu gagasan per bagian.
- [ ] Tidak ada klaim hasil penelitian tanpa rujukan; tidak ada "akurat", "siap skripsi/TAP", "aman secara hukum".
- [ ] `import-modules.mjs --dry-run` bersih (atau temuannya dijelaskan).
