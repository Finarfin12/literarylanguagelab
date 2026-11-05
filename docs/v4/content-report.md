# Laporan paket konten Kursus Dasar (Fase 18, jalur 1)

Dibuat 5 November 2026 oleh sesi Claude. Migrasi: `supabase/migrations/0016_course_content.sql` (belum dijalankan).

## Yang ada di `0016`

- **20 bacaan asli** (10 A1, 10 A2) ditulis sendiri, tidak disalin dari buku atau teks berhak cipta. Semua masuk `texts` sebagai **draft** (`is_public = false`).
- **Langkah 11 unit** (kata + arti Indonesia, topik grammar, bacaan, teks dengar, latihan, kalimat bicara). Unit `salam-perkenalan` sudah lengkap dari `0013` dan tidak diubah. Langkah latihan bertag dari `0014` dipertahankan. Hanya unit yang kosakatanya masih kosong yang diisi, jadi suntingan admin tidak tertimpa bila migrasi dijalankan ulang.
- **55 soal latihan draft** (5 per unit: pilihan ganda, isian, susun kalimat, pasangkan, dikte), bertag `seed-0016`.

## Pemeriksaan terhadap NGSL 1.2

Dihitung dengan `lib/graded-check.ts` (kode yang sama dengan yang tampil di Admin → Konten) terhadap file NGSL pemilik (`NGSL_1.2_stats.csv` untuk peringkat, `NGSL_1.2_lemmatized_for_teaching.csv` untuk bentuk kata). Batas: A1 = peringkat ≤ 500, A2 = ≤ 1000. Nama diri dan angka tidak dihitung. Target: A1 ≥ 90%, A2 ≥ 92%; rentang kata A1 80–120, A2 120–180.

Catatan: daftar NGSL tidak memuat angka dalam huruf (five, twelve), jadi bacaan memakai digit. Kata tema seperti *breakfast*, *kitchen*, *rice*, *brother* berada di luar 500 teratas, sehingga bacaan A1 sengaja memakai kata inti (food, eat, family, house, work) dan hanya sedikit kata tema.

| Unit | Level | Judul | Kata | Cakupan NGSL | Kata di luar daftar (contoh) |
|---|---|---|---|---|---|
| bunyi-huruf | A1 | My First English Words | 84 | 100% (target 90%) | — |
| angka-waktu-tanggal | A1 | Early in the Morning | 90 | 97.5% (target 90%) | wash, sleep |
| angka-waktu-tanggal | A1 | My Birthday Is in May | 85 | 94.9% (target 90%) | birthday |
| keluarga-orang | A1 | My Family | 89 | 94.1% (target 90%) | brother, sister, joko, football, sari |
| keluarga-orang | A1 | My Friend Dewi | 81 | 97.4% (target 90%) | smile, happy |
| rumah-benda | A1 | My Small House | 96 | 90.4% (target 90%) | chairs, flowers, sleep, bed, desk, window, street |
| rutinitas-harian | A1 | A Day with Budi | 88 | 93.8% (target 90%) | washes, lunch, evening, television, bed |
| rutinitas-harian | A1 | Saturday Morning | 87 | 94% (target 90%) | bed, box, lunch, park, listen |
| makanan-restoran | A1 | Lunch with a Friend | 83 | 91.3% (target 90%) | lunch, restaurant, expensive, rice, chicken, fast, hot |
| makanan-restoran | A1 | Food in My Family | 96 | 95.6% (target 90%) | drinks, tea, drink, meal |
| belanja | A2 | A New Phone | 133 | 100% (target 92%) | — |
| belanja | A2 | At the Market | 128 | 98.4% (target 92%) | dinner |
| arah-tempat | A2 | Where Is the Bank? | 120 | 100% (target 92%) | — |
| arah-tempat | A2 | A Walk in the City | 133 | 99.2% (target 92%) | tired |
| cerita-masa-lalu | A2 | Last Weekend | 126 | 99.2% (target 92%) | tired |
| cerita-masa-lalu | A2 | A Trip to the Village | 125 | 94.3% (target 92%) | two, hills, left, ill, quiet, rain |
| rencana-masa-depan | A2 | Plans for Next Year | 122 | 100% (target 92%) | — |
| rencana-masa-depan | A2 | Food for My Mother | 129 | 96% (target 92%) | birthday, afraid, soup, rice, cake |
| pekerjaan-kampus | A2 | My First Job | 127 | 99.2% (target 92%) | count |
| pekerjaan-kampus | A2 | A Busy Day at the University | 130 | 97.6% (target 92%) | library, tired, proud |

Semua 20 bacaan berada dalam rentang kata dan memenuhi target cakupan. Ini pemeriksaan otomatis, bukan penilaian mutu: **pemilik tetap perlu membaca dan menyunting** sebelum menerbitkan.

## Yang perlu dicek pemilik

- Bacaan memakai nama tokoh Indonesia (Rina, Budi, Sari, Dewi, Joko, Andi); ganti bila perlu.
