---
slug: meneliti-terjemahan-4-ringkasan-statistik-dan-reliabilitas
subject: meneliti-terjemahan
order: 4
level: C1
title: Ringkasan statistik dasar dan reliabilitas penilai
tools: /translation-workspace
objectives:
- Menghitung frekuensi, persentase, rata-rata, median, dan simpangan baku dari data kecil
- Menghitung kesepakatan antarpenilai dalam persen dan koefisien kappa dari tabel sederhana
- Memilih tabel dan grafik yang jujur untuk data kategori dan skor
- Menjelaskan batas klaim berdasarkan ukuran sampel, korelasi, dan variasi
sources:
- Descriptive statistics (Wikipedia) | https://en.wikipedia.org/wiki/Descriptive_statistics | ok
- Inter-rater reliability (Wikipedia) | https://en.wikipedia.org/wiki/Inter-rater_reliability | ok
- Cohen's kappa (Wikipedia) | https://en.wikipedia.org/wiki/Cohen's_kappa | ok
- Sampling (statistics) (Wikipedia) | https://en.wikipedia.org/wiki/Sampling_(statistics) | ok
- Thematic analysis (Wikipedia) | https://en.wikipedia.org/wiki/Thematic_analysis | ok
---

## Angka sebagai ringkasan, bukan hiasan

Pelajaran ini memberi keterampilan statistik deskriptif yang cukup untuk penelitian terjemahan skala kecil: menghitung dan menyajikan ringkasan data, serta memeriksa seberapa konsisten penilai. Semua data di bawah adalah data fiktif untuk latihan. Statistik inferensial (uji hipotesis seperti uji-t atau chi-kuadrat) berada di luar cakupan; untuk penelitian yang membutuhkannya, pelajari mata kuliah statistik atau konsultasikan dengan ahli.

## Frekuensi dan persentase

Untuk data kategori (misalnya strategi terjemahan), ringkasan paling dasar adalah **frekuensi** (jumlah kasus per kategori) dan **persentase** (frekuensi dibagi total, dikali 100).

Contoh fiktif: 40 kasus permainan kata dikode dalam empat strategi.

| Strategi | Frekuensi | Persentase |
|---|---|---|
| Padanan permainan | 12 | 30% |
| Kompensasi | 6 | 15% |
| Penjelasan | 14 | 35% |
| Penghapusan | 8 | 20% |
| **Total** | **40** | **100%** |

Perhitungan: 12/40 = 0,30; 6/40 = 0,15; 14/40 = 0,35; 8/40 = 0,20. Periksa selalu bahwa total frekuensi sama dengan jumlah kasus dan total persentase sekitar 100 persen (selisih karena pembulatan boleh, selisih besar tanda kesalahan). Selalu laporkan **jumlah kasus (n)** di samping persentase: 30% dari 40 kasus berbeda makna dari 30% dari 10 kasus.

## Rata-rata, median, dan simpangan baku

Untuk data numerik (misalnya skor penilaian 1–5), tiga ringkasan umum.

**Rata-rata (*mean*):** jumlah semua nilai dibagi banyaknya nilai.

**Median:** nilai tengah setelah data diurutkan. Berguna bila ada nilai ekstrem karena tidak terpengaruh nilai ekstrem seperti rata-rata.

**Simpangan baku (*standard deviation*):** ukuran seberapa tersebar data di sekitar rata-rata. Semakin besar, semakin beragam.

Contoh fiktif: lima penilai memberi skor ketepatan satu terjemahan: 3, 4, 4, 2, 5.

- Rata-rata = (3 + 4 + 4 + 2 + 5) / 5 = 18 / 5 = 3,6.
- Median: urutkan menjadi 2, 3, 4, 4, 5; nilai tengah = 4.
- Simpangan baku sampel: hitung selisih tiap nilai dari rata-rata (−0,6; 0,4; 0,4; −1,6; 1,4), kuadratkan (0,36; 0,16; 0,16; 2,56; 1,96), jumlahkan (5,2), bagi dengan n − 1 = 4 (1,3), lalu akar kuadrat ≈ 1,14.

Pelaporan: *rata-rata 3,6 (median 4; simpangan baku 1,14; n = 5)*. Perhatikan bahwa dengan hanya lima penilai, angka ini adalah gambaran kasar, bukan ukuran pasti.

## Kesepakatan antarpenilai

Bila dua penilai mengodekan atau menilai item yang sama, kita ingin tahu seberapa sering mereka sepakat. Dua ukuran sederhana.

**Persentase kesepakatan.** Jumlah item yang sama dibagi total item. Contoh: dua penilai mengodekan 10 kalimat sebagai *acceptable* atau *error*; mereka sama pada 8; kesepakatan = 8/10 = 80%. Mudah dipahami tetapi menyesatkan, karena sebagian kesepakatan terjadi **secara kebetulan**.

**Kappa Cohen (κ).** Mengoreksi kesepakatan kebetulan. Rumus:

> κ = (Po − Pe) / (1 − Pe)

dengan **Po** kesepakatan teramati dan **Pe** kesepakatan yang diharapkan karena kebetulan (dihitung dari proporsi masing-masing penilai pada tiap kategori).

Contoh fiktif: dua penilai menilai 20 kalimat sebagai *acceptable* (A) atau *error* (E).

| | Penilai B: A | Penilai B: E | Jumlah |
|---|---|---|---|
| **Penilai A: A** | 13 | 1 | 14 |
| **Penilai A: E** | 2 | 4 | 6 |
| **Jumlah** | 15 | 5 | 20 |

Langkah. Po = (13 + 4) / 20 = 17/20 = 0,85. Pe = (14/20 × 15/20) + (6/20 × 5/20) = (0,7 × 0,75) + (0,3 × 0,25) = 0,525 + 0,075 = 0,60. κ = (0,85 − 0,60) / (1 − 0,60) = 0,25 / 0,40 = 0,625.

Penafsiran lazim (pedoman kasar, bukan hukum): κ sekitar 0,61 sampai 0,80 sering disebut kesepakatan "cukup tinggi" (*substantial*), di atas 0,80 sangat tinggi, di bawah 0,40 rendah. Ambang berbeda antar bidang; laporkan angka dan sebutkan bahwa penafsiran bersifat konvensi. Untuk lebih dari dua penilai atau data berskala, ada ukuran lain; ini cukup untuk dasar.

Bila kesepakatan rendah, jangan langsung menyalahkan penilai. Periksa definisi kategori (apakah kabur?), lakukan diskusi, perbaiki buku kode, dan kode ulang sampel.

## Tabel dan grafik yang jujur

Prinsip penyajian.

- **Tabel** cocok untuk angka tepat; beri judul, satuan, dan n.
- **Diagram batang** cocok untuk membandingkan kategori. Mulailah sumbu dari nol agar tinggi batang tidak menyesatkan.
- **Hindari diagram lingkaran** untuk banyak kategori; mata sulit membandingkan sudut.
- **Beri label jelas** pada sumbu, kategori, dan keterangan sumber data.
- **Jangan menghias** dengan efek tiga dimensi atau warna berlebihan.

Selalu pastikan teks menjelaskan apa yang ditunjukkan tabel atau grafik, bukan sekadar menempelkannya.

## Batas klaim

Angka mudah memberi kesan ketepatan palsu. Tiga kehati-hatian.

1. **Ukuran sampel.** Penelitian dengan 40 kasus dari tiga buku menggambarkan tiga buku itu, bukan semua terjemahan. Tulis kalimat batas: *Temuan ini berlaku untuk sampel yang diteliti dan tidak dapat digeneralisasi.*
2. **Korelasi bukan sebab.** Bila panjang kalimat sumber berkorelasi dengan jumlah pemecahan kalimat, itu belum berarti panjang menyebabkan pemecahan; faktor lain (gaya penerjemah, jenis teks) mungkin berperan.
3. **Variasi.** Rata-rata tanpa simpangan baku menyembunyikan sebaran. Dua kelompok dengan rata-rata sama dapat sangat berbeda sebarannya.

## Analisis tematik kualitatif singkat

Untuk data kualitatif (transkrip wawancara, jawaban terbuka), analisis tematik umum dilakukan dengan langkah: (1) membaca berulang; (2) memberi kode pada bagian bermakna; (3) mengelompokkan kode menjadi tema; (4) meninjau tema terhadap data; (5) menamai dan mendefinisikan tema; (6) menulis dengan kutipan pendukung. Keterbukaan tentang proses dan pemeriksaan oleh pengode kedua menambah kepercayaan pada hasil.

## Contoh dan pembahasan

Dari tabel strategi: penjelasan menempati 35% (14 dari 40) dan penghapusan 20% (8 dari 40). Laporan jujur: *Dari 40 kasus permainan kata dalam tiga buku, penerjemah paling sering memilih penjelasan (35%, n = 14), disusul padanan permainan (30%, n = 12); penghapusan terjadi pada 20% kasus (n = 8) dan kompensasi pada 15% (n = 6).* Kalimat batas: *Data berasal dari tiga buku dan tidak mewakili seluruh terjemahan sastra anak.* Kesepakatan pengodean: dua pengode memeriksa 20 kasus acak dengan κ = 0,625 setelah revisi buku kode. Jangan menulis *Penerjemah Indonesia lebih suka menjelaskan* karena itu generalisasi yang tidak ditopang data.

## Latihan

```exercise
{ "type": "mcq", "prompt": { "question": "Dari 40 kasus, 14 memakai strategi penjelasan. Berapa persentasenya?", "options": ["35%", "14%", "28%", "40%"] }, "answer": { "correct": "35%" }, "explanation_id": "14/40 = 0,35 = 35%." }
```

```exercise
{ "type": "mcq", "prompt": { "question": "Berapa median dari skor 3, 4, 4, 2, 5?", "options": ["4", "3,6", "3", "5"] }, "answer": { "correct": "4" }, "explanation_id": "Urutkan 2, 3, 4, 4, 5; nilai tengah = 4. Rata-ratanya 3,6." }
```

```exercise
{ "type": "mcq", "prompt": { "question": "Dua penilai sepakat pada 17 dari 20 item (Po = 0,85) dan kesepakatan kebetulan Pe = 0,60. Berapa kappa?", "options": ["0,625", "0,85", "0,25", "0,40"] }, "answer": { "correct": "0,625" }, "explanation_id": "κ = (0,85 − 0,60) / (1 − 0,60) = 0,25 / 0,40 = 0,625." }
```

```exercise
{ "type": "mcq", "prompt": { "question": "Mengapa persentase kesepakatan saja bisa menyesatkan?", "options": ["Sebagian kesepakatan terjadi secara kebetulan", "Persentase tidak bisa dihitung", "Penilai selalu sepakat", "Persentase tidak berguna sama sekali"] }, "answer": { "correct": "Sebagian kesepakatan terjadi secara kebetulan" }, "explanation_id": "Kappa mengoreksi kesepakatan kebetulan." }
```

```exercise
{ "type": "mcq", "prompt": { "question": "Kalimat batas klaim yang jujur untuk penelitian 40 kasus dari tiga buku adalah?", "options": ["Temuan berlaku untuk sampel yang diteliti dan tidak dapat digeneralisasi", "Penerjemah Indonesia selalu memilih penjelasan", "Hasil ini berlaku untuk semua terjemahan", "Tidak perlu kalimat batas"] }, "answer": { "correct": "Temuan berlaku untuk sampel yang diteliti dan tidak dapat digeneralisasi" }, "explanation_id": "Ukuran dan sifat sampel membatasi klaim." }
```

## Rangkuman

- Frekuensi dan persentase untuk data kategori; selalu laporkan n dan periksa total.
- Rata-rata, median, dan simpangan baku untuk skor; contoh 3, 4, 4, 2, 5 memberi rata-rata 3,6, median 4, simpangan baku sampel sekitar 1,14.
- Persentase kesepakatan mudah tetapi menyesatkan; kappa Cohen mengoreksi kebetulan: κ = (Po − Pe) / (1 − Pe), contoh 0,625.
- Tabel untuk angka tepat, diagram batang dengan sumbu mulai nol untuk perbandingan; jangan menghias.
- Batas klaim: ukuran sampel, korelasi bukan sebab, dan variasi; analisis tematik kualitatif mengikuti enam langkah.

## Tugas

Kumpulkan 30 kasus dari teks pilihanmu dan kodekan dalam empat kategori. Hitung frekuensi dan persentase, buat diagram batang, minta orang kedua mengode 15 kasus acak, hitung persentase kesepakatan dan kappa, dan tulis tiga kalimat batas klaim.
