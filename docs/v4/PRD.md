# PRD — Literary Language Lab v4: "Perpustakaan yang Ramah"

| | |
|---|---|
| **Status** | Draft untuk ditinjau |
| **Tanggal** | 31 Oktober 2026 |
| **Pemilik** | finarfin112 |
| **Dokumen terkait** | [DESIGN.md](DESIGN.md) (**sistem desain — acuan visual tunggal**), [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md), [HANDOFF.md](HANDOFF.md), [FEATURE_INVENTORY.md](FEATURE_INVENTORY.md) (daftar periksa wajib), PRD v3: [../v3/PRD.md](../v3/PRD.md) |
| **Mockup** | Kanvas desain pribadi pemilik: https://claude.ai/artifact/LSVnAAWiTKUCJKhjUnd6Zx (Beranda desktop, Beranda HP, Membaca + Word Lookup HP, Tongkat Ajaib HP) |
| **Prasyarat** | v3 Fase 8–11 selesai di kode (commit `5ff2160`, ditambah `dc29ee3`: LingoWise di Sidebar desktop). Migrasi `0006`–`0010` dijalankan pemilik. |

---

## 1. Latar belakang

v3 menambah onboarding, jalur pemula, level per keterampilan, dan jalur penerjemahan. Pemilik menilai tiga hal masih kurang:

1. **Tampilan tidak cocok dengan tema dan tujuan.** Masalahnya pada **kesan keseluruhan dan tata letak**. Warna sudah cocok; huruf boleh disesuaikan. Banyak glow, gradasi, dan kartu bergaya "dashboard teknologi" yang tidak terasa seperti ruang belajar sastra.
2. **Fitur terasa acak.** Sekitar 60 item menu tersusun per kategori alat, bukan per alur belajar. Pengguna tidak tahu urutan memakai fitur.
3. **Fitur dasar bahasa Inggris masih kurang** (dicek di kode setelah Fase 10):
   - Library berjenjang belum berisi teks pemula (migrasi tidak mengisi teks).
   - Tidak ada titik nol (pre-A1): salam, perkenalan, angka, bunyi dasar.
   - Belajar per alat, bukan per pelajaran bertema.
   - Latihan grammar berupa kalimat bebas yang dinilai AI — terlalu berat untuk A1, dan memanggil AI setiap kali.
   - Topik grammar yang sudah selesai tidak pernah diulang; status selesai hanya di browser.
   - Tidak ada materi khusus penutur Indonesia (kesalahan khas, pasangan bunyi).

## 2. Prinsip yang tidak boleh dilanggar

| # | Prinsip |
|---|---|
| P1 | **Redesign hanya mengubah tampilan.** Tidak ada fitur yang dihapus, digabung diam-diam, atau dikurangi perilakunya. [FEATURE_INVENTORY.md](FEATURE_INVENTORY.md) adalah daftar periksa wajib: setiap baris tetap ada dan bisa dijangkau setelah redesign, di desktop dan HP. |
| P2 | Perubahan perilaku hanya yang **disebut eksplisit** di PRD ini: Tongkat Ajaib bisa digeser (§5.4), pintu masuk LingoWise di desktop (§5.2), lima route API yang belum dipakai dihidupkan (§5.5), pengayaan Kosakata Inti (§6.5), service worker PWA yang hilang dibuat (K9), dan fitur baru Kursus Dasar (§6). |
| P3 | Tidak ada gamifikasi (XP, streak, peringkat) — keputusan v2. |
| P4 | Semua tema tetap: terang, gelap, sepia (reader), kontras tinggi, font disleksia, ukuran/jarak/lebar teks. |

## 3. Tujuan

| # | Tujuan | Ukuran keberhasilan |
|---|---|---|
| G1 | Kesan "perpustakaan akademis yang ramah, rapi" | Semua halaman memakai token & komponen v4; tidak ada glow/gradasi dekoratif; pemilik menyetujui tampilan di HP & desktop |
| G2 | Fitur tersusun per alur belajar, tidak acak | Navigasi utama = Beranda + 3 Ruang + Koleksi + Komunitas; setiap ruang punya halaman pembuka berurutan; setiap item di inventaris terjangkau ≤ 2 ketukan dari navigasi |
| G3 | Tidak ada fitur hilang | 100% baris FEATURE_INVENTORY tercentang di setiap fase redesign |
| G4 | Pemula A0–A2 punya kursus terstruktur | ≥ 12 unit bertema A0–A2 dengan latihan yang dinilai otomatis tanpa AI |
| G5 | Latihan murah & cepat | Mengerjakan latihan tidak memanggil AI; AI hanya membantu admin membuat soal (draft → ditinjau → terbit) |

## 4. Bukan tujuan (v4)

- Menghapus atau mengganti fitur yang ada (lihat P1).
- Mode kelas (dibatalkan di v3).
- Konten berlisensi tertutup; audio rekaman manusia (pelafalan memakai TTS yang sudah ada).
- Aplikasi native.

---

## 5. Redesign & susunan fitur

### 5.1 Arah visual

Ringkasan; spesifikasi lengkap (token, skala huruf, komponen, pola halaman) ada di **[DESIGN.md](DESIGN.md)**, yang berlaku bila ada perbedaan.

| Aspek | Keputusan |
|---|---|
| Kesan | Perpustakaan akademis yang ramah: tenang, lega, rapi; judul bagian seperti bab buku |
| Warna | **Tetap palet sekarang.** Hijau brand dipertahankan; untuk teks berwarna & tombol utama di tema terang dipakai turunan lebih gelap (mis. `#22804F` / `#1E6B45`) agar kontras ≥ 4.5:1. Latar terang menjadi krem kertas hangat (mis. `#F6F2E9`, kartu `#FFFFFF`, garis `#E2DBCB`). Tema gelap: tinta gelap hangat, bukan biru keabu-abuan. Nilai final ditetapkan di Fase 12 dan dicek kontrasnya. |
| Huruf | Serif: **Michelangelus** (pilihan pemilik) — dipakai **hanya lewat `local()`** karena lisensinya untuk Microsoft 365 dan belum ada izin webfont; cadangan **Alegreya** (OFL). Sans: **Source Sans 3** (OFL, humanis, serasi dengan Michelangelus). Detail & aturan lisensi: DESIGN.md §2. |
| Bentuk | Kartu putih bergaris tipis, bayangan minimal, radius konsisten; label kecil huruf kapital berjarak (gaya katalog); ikon garis tipis |
| Dihapus dari gaya | Glow, gradasi latar, `backdrop-blur` dekoratif, efek hover "melompat", warna neon per kategori |
| Gerak | Halus dan singkat; tetap menghormati `prefers-reduced-motion` & preferensi `enable_animations` |

Acuan: mockup (lihat tabel di atas). Mockup adalah **arah**, bukan spesifikasi piksel.

### 5.2 Susunan fitur (arsitektur informasi)

Navigasi utama menjadi **Beranda + tiga Ruang + Koleksi saya + Komunitas**. Setiap ruang punya **halaman pembuka** yang menyusun alat dalam urutan alur belajar (bukan daftar acak), dengan keterangan satu baris.

| Ruang | Urutan isi (semua item lama tetap ada) |
|---|---|
| **I. Belajar Dasar** (pemula umum) | 1. Placement Test / Tes Naik Level → 2. **Kursus Dasar** (baru, §6) → 3. Grammar Dasar → 4. Kosakata Inti → 5. Bacaan berjenjang (Library difilter level) → 6. Latihan keterampilan: Listening Test, Pronunciation Clinic, Dialogue Simulator, Grammar Clinic, Flashcard SRS → 7. Latihan lanjutan: Paraphrase Challenge, AI Writing Assistant, Sentence Architect, Story Quiz, Slang Decoder |
| **II. Baca & Kajian Sastra** (mahasiswa sastra) | 1. Text Library & Buku Klasik → 2. OCR Lens → 3. Alat memahami teks: Word Lookup A-Z, Cultural Context, Difficulty Predictor, Idiom & Metaphor Detector, Nuance Detector, Literary Synonyms → 4. **LingoWise AI** (8 mode) → 5. Analisis sastra: Tone & Gaya, Rhetorical Spotter, Critical Lens, Conflict Mapper, Dialect Diver, Diction Lab, Sentiment Spectrum, Imagery Grader, Semantic Map/Visual, Academic Outline, Essay Auditor → 6. Kreatif: Alter Ego, Vibe/Mood/Era Translator, Metaphor Generator, Imagery Sketcher, Poem to Palette, Time Traveler, Character Monologue, Plot Twist, Case Study Generator → 7. My Annotations |
| **III. Ruang Terjemah** (mahasiswa penerjemahan) | 1. Translation Workshop → 2. Ruang Kerja Segmen → 3. Translation Memory & Glossary Builder → 4. Comparator, Parallel Text, Untranslatables → 5. Translation Timelapse → 6. Tahap penerjemah (link ke profil) |
| **Koleksi saya** | Vocabulary Bank, Review (SRS), Idiom Library, Glossary, Rak bacaan (Lanjutkan Membaca), Archive & Insights |
| **Komunitas** | Forum, Reading Clubs, Jejaring Pembaca, Shared Annotations, Pesan |

Aturan:
- **Satu item boleh muncul di lebih dari satu ruang** (mis. Glossary di Ruang Terjemah dan Koleksi) — tidak ada yang dipindah sampai hilang.
- Ruang sesuai `learning_goal` pengguna tampil pertama dan ditandai "Tujuanmu"; ruang lain tetap terbuka.
- **Toolkits Hub** (`/tools`) tetap ada sebagai "Semua alat" dengan pencarian & filter.
- **LingoWise AI** sudah punya pintu masuk di Sidebar desktop (`dc29ee3`, K1 selesai); susunan baru harus mempertahankannya.
- Bottom nav HP (**Q1 diputuskan**): **Beranda · Baca · Kosakata · Ruang · Menu.** Kebiasaan harian di HP adalah Baca → Simpan kata → Ulangi, jadi Kosakata satu ketukan. "Ruang" membuka halaman tiga ruang, sehingga Belajar Dasar dan Terjemah terjangkau dua ketukan; Alat lewat Menu → Semua alat.

### 5.3 Halaman yang di-redesign

Semua halaman di FEATURE_INVENTORY, bertahap: kerangka & navigasi → Beranda & ruang → Reader & Word Lookup → Kosakata & English Lab → Terjemah → Komunitas, Profil, Pengaturan, Bantuan → Admin → Auth & landing.

Reader & Word Lookup mengikuti mockup: halaman kertas, header ringkas, progress tipis; panel Word Lookup sebagai bottom sheet di HP dengan **ke-16 mode, Pictionary, dengar, Konteks Kalimat, hasil, Simpan Kata/kolokasi** — sama persis fungsinya.

### 5.4 Tongkat Ajaib (Inspect Mode) bisa digeser — satu-satunya perubahan perilaku reader

- Tombol melayang Tongkat Ajaib bisa **diseret** (mouse & sentuh) ke mana saja di area baca, lalu **menempel ke tepi kiri/kanan terdekat** saat dilepas.
- **Ketuk tanpa menggeser** = menyalakan/mematikan Inspect Mode seperti sekarang (ambang gerak ±6 px membedakan ketuk vs geser).
- Posisi tersimpan per perangkat (`localStorage`), dipulihkan saat membuka reader lagi; selalu dijepit agar tetap terlihat saat ukuran layar berubah.
- Tidak menutupi tombol navigasi halaman/bottom sheet: saat panel Word Lookup terbuka, tombol menyingkir atau disembunyikan sementara.
- Aksesibilitas: tetap `<button>` dengan `aria-pressed` dan label; bisa dipindah juga lewat keyboard (mis. Alt+panah) atau cukup tetap bisa difokus & diaktifkan dengan keyboard.
- Contoh perilaku: artboard "Tongkat Ajaib — HP" di mockup (bisa dicoba).

### 5.5 Lima route API yang belum dipakai: perbaiki & pakai

Keputusan pemilik (31 Okt 2026): route yang sudah ada tetapi tidak dipanggil UI **tidak dihapus**, melainkan diperbaiki dan dipakai.

| Route | Dipakai di | Nilai bagi pengguna |
|---|---|---|
| `/api/gutenberg/search` | **Opsi ketiga** "Gutenberg (server)" di pencarian Buku Klasik — OpenLibrary & Gutendex tetap tidak berubah | Alternatif yang lebih stabil bila dua sumber lain gagal: rate limit & cache di server |
| `/api/wotd` | Tombol **Pelajari** di kartu Word of the Day (Sidebar & Beranda) | Mini-lesson, kolokasi, kuis 1 soal, simpan kata |
| `/api/analyze-tone` | Modal Tongkat Ajaib & Ruang Kerja Segmen | Tone kalimat + tips mempertahankan tone saat menerjemahkan |
| `/api/detect-idioms` | Reader (penanda idiom otomatis, bisa dimatikan di Pengaturan) | Idiom dikenali tanpa AI, bisa disimpan ke Idiom Library |
| `/api/auth/delete-account` | Pengaturan → Hapus akun | Hapus akun yang benar-benar berfungsi |

Detail perbaikan: IMPLEMENTATION_PLAN Fase 14f.

---

## 6. Kursus Dasar (fitur baru)

### 6.1 Mesin latihan terstruktur

- Tipe latihan: **pilihan ganda**, **isi titik-titik** (cloze), **susun kata** (word order), **mencocokkan** (matching), **dikte** (dengar TTS lalu ketik).
- Soal disimpan sebagai data (tabel `exercises`), dinilai di klien/server dengan **fungsi murni tanpa AI** (normalisasi huruf besar, tanda baca, spasi; jawaban alternatif yang diterima).
- Setiap soal punya **penjelasan singkat dalam bahasa Indonesia** yang muncul setelah menjawab.
- AI hanya untuk admin: "Buat soal dengan AI" untuk topik/unit tertentu → status `draft` → admin meninjau → `published` (pola sama dengan teks berjenjang di Fase 9).
- Hasil mengerjakan dicatat (`exercise_attempts`) dan menjadi **bukti keterampilan** (`skill_evidence`, Fase 10): grammar, kosakata, menyimak.

### 6.2 Unit bertema A0–A2

- ±12 unit, mis.: 0 Bunyi & huruf · 1 Salam & perkenalan · 2 Angka, waktu, tanggal · 3 Keluarga & orang · 4 Rumah & benda · 5 Rutinitas harian · 6 Makanan & restoran · 7 Belanja · 8 Arah & tempat · 9 Cerita masa lalu · 10 Rencana & masa depan · 11 Pekerjaan & kampus.
- Setiap unit = langkah berurutan yang **memakai ulang fitur yang ada**: kosakata (Kosakata Inti / daftar unit) → pola grammar (topik Grammar Dasar) → bacaan pendek (teks berjenjang) → dengar (TTS) → latihan (§6.1) → bicara (Pronunciation Clinic / Dialogue Simulator dengan skenario unit).
- Progres per unit tersimpan di database (bukan hanya browser); unit berikutnya **disarankan**, tidak dikunci.
- Unit 0 (pre-A1) memakai penjelasan berbahasa Indonesia penuh.

### 6.3 Review grammar

- Topik grammar yang selesai dijadwalkan ulang dengan SRS (SM-2, `lib/spaced-repetition.ts` yang sudah ada) memakai soal dari §6.1.
- Status selesai topik grammar dipindah dari `localStorage` ke database (dengan migrasi data lokal saat pertama dibuka).
- "Review hari ini" di Beranda menggabungkan kosakata jatuh tempo + topik grammar jatuh tempo.

### 6.4 Modul khas penutur Indonesia

- **Kesalahan umum**: mis. *I am agree*, lupa *-s* orang ketiga, *he/she* tertukar, *people is*, *since/for*, kata sifat jamak, urutan kata sifat — masing-masing kartu penjelasan + latihan (§6.1).
- **Pasangan bunyi (minimal pairs)**: *ship/sheep*, *think/sink*, *very/fery*, *bad/bed*, konsonan akhir (*cat/cap*) — dengar (TTS) lalu pilih, dan ucapkan (Pronunciation Clinic).

### 6.5 Kosakata Inti diperkaya (NGSL)

- Kosakata Inti sudah memakai NGSL 1.2 (peringkat → level A1–B2, diimpor pemilik). v4 menambah dua data NGSL yang belum dipakai:
  - **Definisi bahasa Inggris sederhana** (file *with English definitions*): tampil di kartu Kosakata Inti, ikut tersimpan saat kata ditambahkan ke Review, dan menjadi bahan soal mencocokkan / pilihan ganda tanpa AI (§6.1) serta langkah kosakata unit (§6.2).
  - **Bentuk kata** (file *lemmatized for teaching*): *searched* dikenali sebagai *search*, sehingga progres Kosakata Inti lebih akurat.
- Peringkat dan level yang sudah ada tidak berubah. Lisensi CC BY-SA 4.0; atribusi di /help diperluas.
- Detail: Fase 14g di IMPLEMENTATION_PLAN.

### 6.6 Paket konten awal (dikerjakan terakhir)

- **Keputusan pemilik:** konten dibuat **paling akhir**, setelah kode Fase 15–17 selesai (Fase 18).
- **20 bacaan asli** (10 A1, 10 A2) sesuai tema unit, plus isi langkah ke-12 unit, **ditulis oleh sesi Claude** sebagai migrasi seed berstatus draft. Pemilik hanya meninjau, mengedit bila perlu, lalu menerbitkan di Admin → Konten.
- Sampai konten siap, Kursus Dasar **disembunyikan** dari pengguna biasa dengan feature flag `kursus_dasar` (admin tetap bisa mencoba). Fitur lain — Kosakata Inti, Grammar Dasar, bacaan berjenjang — tidak terpengaruh.
- Pemilik menyalakan flag setelah minimal unit 0–5 lengkap.

---

## 7. Kebutuhan non-fungsional

| Area | Kebutuhan |
|---|---|
| Kelengkapan | Daftar periksa FEATURE_INVENTORY dicentang per fase; laporan fase menyebut baris mana yang disentuh dan diuji |
| Aksesibilitas | Kontras WCAG AA di semua tema (dicek dengan alat/perhitungan, bukan perkiraan); fokus terlihat; target sentuh ≥ 44px |
| Mobile | Semua halaman lolos 375px; `docs/mobile-audit.md` diperbarui |
| Performa | Redesign tidak boleh menambah beban reader yang sudah dioptimalkan di Fase 7 (pagination, `ReaderBlock` memo); tidak ada blur/bayangan berat di area baca |
| Biaya | Mengerjakan latihan tidak memanggil AI; pembuatan soal AI tercatat di `ai_usage_logs` |

## 8. Pertanyaan terbuka

| # | Pertanyaan | Asumsi default |
|---|---|---|
| Q1 | ~~Bottom nav HP?~~ | **Diputuskan:** Beranda · Baca · Kosakata · Ruang · Menu (§5.2) |
| Q2 | ~~Pasangan huruf final?~~ | **Diputuskan:** Michelangelus (`local()`) + cadangan Alegreya, dengan Source Sans 3 (DESIGN.md §2) |
| Q3 | Daftar & urutan 12 unit Kursus Dasar? | Seperti §6.2; pemilik boleh mengubah |
| Q4 | Unit dikunci berurutan atau bebas? | Bebas, hanya disarankan |
| Q5 | Tema gelap: hangat (cokelat tinta) atau tetap seperti sekarang? | Hangat, sejalan dengan kesan perpustakaan |
