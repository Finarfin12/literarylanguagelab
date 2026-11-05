# PRD — Literary Language Lab v5: "Aman, Jelas, Bisa Mulai dari Nol"

| | |
|---|---|
| **Versi** | 5.0 (draf untuk disetujui pemilik) |
| **Tanggal** | 5 November 2026 |
| **Prasyarat** | v4 Fase 12–18 selesai di kode (commit `1794bc3`) |
| **Sumber** | Enam dokumen masukan pemilik (audit v4, rangkuman produksi, validasi repo, empat pilar, rancangan A0, kurikulum), semuanya dicocokkan dengan kode. Jika dokumen berbeda dengan kode, **kode yang berlaku**. |
| **Rencana kerja** | [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) · [HANDOFF.md](HANDOFF.md) |

---

## 1. Latar belakang

v4 membuat aplikasi tampil rapi dan menambah mesin latihan serta Kursus Dasar. Pemeriksaan terbaru menunjukkan empat masalah:

1. **Biaya AI belum terlindungi merata.** 13 dari 37 route yang memanggil `runAI` tidak memanggil `checkRateLimit`, termasuk `tools/dynamic`, `lookup`, dan `liter-ai`. Sebagian batas hanya tersimpan di memori server.
2. **Keamanan database belum bisa direproduksi dari repo.** Di produksi, semua tabel sudah ber-RLS dan punya policy (dicek pemilik, 5 Nov 2026), tetapi 10 tabel inti tidak punya RLS maupun policy di migrasi, dan `direct_messages` tidak dibuat oleh migrasi. Isi policy produksi belum ditinjau.
3. **Pemula mutlak tidak punya pintu masuk.** Onboarding hanya menawarkan A1–C2 atau "Belum tahu, tes dulu", jadi orang yang benar-benar nol bisa terdorong ke tes berbahasa Inggris. Kata dari unit kursus juga belum masuk review.
4. **Fitur banyak, arahnya kurang jelas.** Label ruang belum memakai bahasa kebutuhan pengguna, kategori `/tools` masih berbahasa Inggris dan timpang, dan alat penerjemahan tersebar di luar Ruang Terjemah.

## 2. Prinsip

| # | Prinsip |
|---|---|
| P1 | **Tidak ada fitur yang dihapus.** Route lama, alat, dan mode tetap ada. `tests/menu-coverage.test.mts` harus tetap lulus. |
| P2 | **Keamanan dan biaya didahulukan** sebelum fitur baru dibuka untuk umum. |
| P3 | **Satu struktur navigasi.** Tiga tujuan utama. Tidak ada "empat pilar", "sembilan menu", atau "jalur semester" sebagai navigasi paralel. |
| P4 | **Penilaian dasar tanpa AI.** Unit A0–A1 dan latihannya bisa diselesaikan tanpa panggilan AI. |
| P5 | **Jujur soal kemampuan.** Tidak mengklaim "akurat", "siap skripsi/TAP", "offline penuh", atau "aman secara hukum" tanpa bukti. |
| P6 | **Materi orisinal.** Tidak menyalin atau meng-host modul berhak cipta, tidak memakai kode mata kuliah, dan tidak menyiratkan afiliasi dengan lembaga pendidikan. Lisensi setiap sumber diperiksa satu per satu. |
| P7 | **Kode tetap jalan sebelum migrasi dijalankan** (fallback, pesan jelas), seperti v2–v4. |

## 3. Tujuan dan ukuran keberhasilan

| Tujuan | Ukuran |
|---|---|
| Biaya AI terkendali | Semua route AI lewat satu pelindung: login, batas pemakaian lintas instance, dan batas ukuran input |
| Skema bisa direproduksi | Database kosong + migrasi repo menghasilkan tabel dan policy yang setara dengan produksi |
| Pemula bisa mulai sendiri | Pengguna baru memilih "Baru mulai dari nol", menyelesaikan unit pertama, dan kata-katanya muncul di review, tanpa tes dan tanpa AI |
| Lebih mudah dipahami | Pengguna dapat menebak ruang yang tepat dari labelnya; setiap alat tetap terjangkau ≤ 2 ketukan |
| Belajar topik mendalam | Topik sastra dan penerjemahan dapat dipelajari lewat penjelasan AI atau manual, dengan latihan dan sumber |

## 4. Bukan tujuan

- **Redesign visual baru.** Warna, huruf, dan komponen tetap mengikuti [../v4/DESIGN.md](../v4/DESIGN.md).
- Menghapus atau mengganti nama route.
- Mengubah perilaku bawaan **Word Lookup**: ke-16 mode tetap tampil seperti sekarang (lihat §7.6).
- Kurikulum resmi, kode mata kuliah, atau istilah "Semester 1–8" di tampilan.
- Gamifikasi (XP, streak, peringkat).
- Layanan terjemahan pihak ketiga seperti MyMemory untuk masukan pengguna.
- Target 100–150 frasa dan 1.000 kata sebelum alur kecil terbukti berjalan.

---

## 5. Keamanan & biaya (Fase 19)

1. **Tinjau isi policy produksi** dan catat seluruh skema, policy, serta tabel buatan manual ke dalam migrasi idempoten.
2. **Satu pelindung route AI**: login, batas pemakaian, validasi ukuran dan jumlah pesan. Dipasang di 13 route yang belum punya, lalu diseragamkan di route lain.
3. **Batas pemakaian lintas instance** berbasis database, dengan batas harian per akun. Route berbiaya menolak permintaan saat penghitung gagal (setelah migrasinya dijalankan).
4. **Flag fitur**: fitur eksperimen bawaannya mati bila konfigurasi tidak terbaca.
5. **Aksesibilitas dasar**: zoom tidak dibatasi; `lang="id"` untuk UI, dengan `lang="en"` di teks Inggris.
6. **Operasi**: script `test`, tampilan SHA deployment dan status skema di Admin, dan dokumen status migrasi.
7. **Tugas pemilik**: menonaktifkan kunci legacy Supabase, dan menjalankan migrasi yang tertinggal.

## 6. Alter Ego: penulis fantasi (Fase 20)

Permintaan pemilik: menambahkan penulis fantasi seperti J.R.R. Tolkien.

**Daftar tambahan (8 penulis, semuanya sudah meninggal):** J.R.R. Tolkien, C.S. Lewis, Ursula K. Le Guin, Terry Pratchett, Diana Wynne Jones, George MacDonald, Lord Dunsany, Mervyn Peake.

- Ketujuh penulis lama tetap ada. Pemilih penulis dikelompokkan menjadi **Klasik & Modern** dan **Fantasi**.
- **Penulis yang masih hidup (mis. J.K. Rowling, George R.R. Martin, Brandon Sanderson) tidak dimasukkan**, karena meniru orang yang masih hidup berisiko menaruh kata-kata di mulut mereka.
- Tampilkan keterangan: "Ini simulasi AI, bukan kata-kata asli penulisnya."
- Banyak karya penulis ini masih berhak cipta. Persona boleh meniru gaya dan membahas karyanya, tetapi **tidak boleh menyalin kutipan panjang**. Aturan lama "gunakan kutipan terkenal" dan "peniruan sempurna" diganti.
- **Daftar diperiksa di server.** Saat ini route menerima nama apa pun dari browser dan memasukkannya langsung ke prompt.

## 7. Alur pemula (Fase 21–22)

### 7.1 Alur yang dituju

```text
Daftar → pilih "Baru mulai dari nol" (tanpa tes)
  → Beranda: satu ajakan jelas "Mulai: Bunyi & huruf"
  → Bunyi & huruf → Salam & perkenalan → Angka, waktu, tanggal
      (dengar → ulangi → arti → latihan → ucapkan, ±10 menit per sesi)
  → Susun kalimat dari blok, sebelum mengetik sendiri
  → Kata dari unit masuk review; Beranda mengingatkan
  → Bacaan pendek A1, Kesalahan Umum, Pasangan Bunyi
  → Dialogue Simulator dengan bantuan pemula
  → Tes Naik Level → unit A2 → ruang lain
```

### 7.2 Pintu masuk (Fase 21)
Pilihan baru **"Baru mulai dari nol"** di onboarding, tanpa tes. Pilihan A1–C2 dan "Belum tahu, tes dulu" tetap ada.

### 7.3 Beranda pemula (Fase 21)
Selama pemula belum menyelesaikan dua unit pertama, Beranda menonjolkan satu langkah berikutnya. Bagian lain turun ke bawah, tidak dihapus.

### 7.4 Unit pertama yang tuntas (Fase 21)
- `bunyi-huruf` dan `salam-perkenalan` lengkap dan ditinjau manusia.
- Audio normal dan lambat dengan pesan yang jelas bila suara tidak tersedia.
- Cara baca versi Indonesia (*Wednesday* → "wenz-dei") ditandai sebagai **bantuan perkiraan**. Audio tetap acuan utama.
- Tombol **"Simpan kata ke Review"**. Saat ini kata dari unit belum masuk review.

### 7.5 Latihan pemula (Fase 22)
- **Penyusun kalimat**: ketuk blok Subjek, Kata kerja, Objek. Warna selalu disertai label teks. Mengganti *I* → *She* mengubah *eat* → *eats* dengan catatan singkat. Tanpa AI.
- **Toleransi salah ketik** pada dikte dan isian untuk kata ≥ 6 huruf: "Benar, periksa ejaannya". Tidak berlaku pada soal ejaan.
- **Bantuan di Dialogue Simulator**: frasa bantuan yang sudah ada diberi arti, ditambah awalan kalimat kurasi dan terjemahan balasan yang dibuka saat diminta.
- **Frasa harian**: mulai ±30 frasa untuk 6 situasi, ditulis dan ditinjau manusia. Target diperluas setelah terbukti dipakai.
- **Kosakata per tema**: tab pelengkap ±300 kata A1 dengan arti Indonesia yang ditinjau. Urutan NGSL tetap ada.

Sorot kata saat audio berjalan **ditunda**, karena dukungan `onboundary` berbeda antar-browser.

### 7.6 Word Lookup untuk pemula
Tampilan bawaan **tidak berubah** (keputusan pemilik di v4). Opsi "Tampilan ringkas" di Pengaturan, bawaannya mati, boleh dibuat di Fase 22. Mode lanjutan tetap satu ketukan.

## 8. Alur & layout agar lebih mudah dipahami (Fase 23)

**Yang berubah adalah susunan dan label, bukan tampilan visual.**

| Bagian | Sekarang | Menjadi |
|---|---|---|
| Ruang I | Belajar Dasar | **Belajar Bahasa Inggris** |
| Ruang II | Baca & Kajian Sastra | **Membaca & Sastra** |
| Ruang III | Ruang Terjemah | **Menerjemahkan** |
| Isi Membaca & Sastra | Bacaan, memahami, LingoWise, analisis, kreatif | Urutan kerja: sumber bacaan → memahami konteks → bedah sastra → penulisan & portofolio → eksperimen kreatif |
| Isi Menerjemahkan | Dimulai dari Workshop | Dibuka dengan **pra-terjemah** (idiom, budaya, dialek, untranslatables), lalu menerjemahkan → memori & glosarium → evaluasi & perbandingan (termasuk Imagery Grader) |
| Kategori `/tools` | 4 kategori Inggris, satu sangat menumpuk | **Semua Alat · Pemahaman & Kosakata · Kajian Sastra & Teori · Penulisan · Bantuan Penerjemahan · Latihan Interaktif** |
| Beranda | Rak, tiga ruang, alat | Tiga pintasan: **Mulai dari Nol · Lanjutkan Membaca · Mulai Menerjemahkan**, membuka bagian yang sama, bukan katalog baru |
| Grammar | Daftar per level | Tambah progres total dan filter Semua / Belum / Selesai |

**Tetap:** route dan slug ruang, nama alat, DESIGN.md, Koleksi & Komunitas, dan bottom nav yang sekarang (Beranda · Kamus · Baca Buku · Grammar · Menu, lihat Q2).

## 9. Peta belajar + "Pelajari dengan AI" (Fase 24)

Keputusan pemilik: **tidak memakai nama Semester 1–8**, materi bisa dipelajari lewat AI, dan pemilik bisa menambahkan materi manual.

- **Topik bernama umum**, mis. "Membaca Cepat & Ide Pokok", "Menulis Paragraf", "Membaca Kritis", "Variasi Bahasa", "Dasar Penerjemahan", "Penyuntingan Terjemahan", "Struktur Kata & Kalimat", "Makna & Nuansa". Ditempatkan di dalam **Membaca & Sastra** dan **Menerjemahkan**, dikelompokkan Fondasi → Menengah → Lanjut.
- **Setiap topik berisi**: capaian belajar → penjelasan → latihan/proyek → alat terkait → sumber terbuka.
- **Penjelasan punya tiga sumber**, dengan urutan tampil: **manual → AI yang sudah ditinjau → AI baru**.
- **Tombol "Pelajari dengan AI"**: penjelasan pertama disimpan untuk semua pengguna, supaya biayanya tidak berulang. Ada label "Dibuat AI, periksa kembali" dan tautan sumber. Pertanyaan lanjutan melewati pelindung biaya Fase 19.
- **Admin** bisa menulis, mengedit, menyetujui, dan membuat ulang penjelasan.
- Di balik flag `peta_belajar` sampai minimal enam topik siap.

## 10. Tambahan sesuai kebutuhan nyata (Fase 25)

Dikerjakan hanya bila ada permintaan atau data pemakaian:
1. Penyuntingan bahasa Indonesia hasil terjemahan (saran untuk diperiksa manusia).
2. Ringkasan statistik proyek terjemahan: label "ringkasan untuk ditinjau", dengan rumus dan data yang dikecualikan.
3. Latihan skimming/scanning: timer opsional, teks tidak disembunyikan paksa.
4. Morfologi dan relasi makna: cakupan terbatas.
5. Topik grammar B2–C1 bertema sastra (inversi, subjunctive, klausa partisipel).

## 11. Kebutuhan non-fungsional

| Area | Kebutuhan |
|---|---|
| Keamanan | Policy diuji untuk anon, pemilik data, dan pengguna lain sebelum dianggap selesai |
| Biaya | Mengerjakan unit A0–A1 tidak memanggil AI; batas harian per akun |
| Aksesibilitas | Keyboard, pembaca layar dasar, zoom, reduced motion, 375px; warna tidak menjadi satu-satunya penanda |
| Rilis | Flag fitur tidak dinyalakan sebelum konten, migrasi, dan uji asap lulus |
| Status kerja | Bedakan: usulan, dibuat, lulus uji, aktif di produksi |

## 12. Keputusan pemilik

| # | Pertanyaan | Asumsi default |
|---|---|---|
| Q1 | Label tiga ruang di §8 sudah pas? | Ya, dipakai |
| Q2 | Bottom nav tetap Beranda · Kamus · Baca Buku · Grammar · Menu? | Ya, tetap (`d0295a4`). Catatan: Review belum satu ketukan; pemula dituntun lewat Beranda |
| Q3 | Staging (proyek Supabase kedua)? | Diputuskan setelah tinjauan policy. Disarankan bila policy perlu diubah |
| Q4 | Siapa peninjau materi Inggris–Indonesia dan cara baca? | Pemilik |
| Q5 | Daftar 8 penulis fantasi di §6 sudah pas? | Ya |
| Q6 | Daftar topik peta belajar? | Diusulkan sesi Fase 24, disetujui pemilik sebelum diisi |
