# PRD — Literary Language Lab v3: "Jelas untuk Semua, Terarah untuk Setiap Level"

| | |
|---|---|
| **Status** | Draft untuk ditinjau |
| **Tanggal** | 31 Oktober 2026 |
| **Pemilik** | finarfin112 |
| **Dokumen terkait** | [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md), [HANDOFF.md](HANDOFF.md), PRD v2: [../PRD.md](../PRD.md) |
| **Prasyarat** | v2 selesai di kode (Fase 0–4, 6, 7). Migrasi `0000`–`0005` sudah dijalankan di Supabase. |

---

## 1. Latar belakang

v2 membuat aplikasi menjadi ruang belajar fokus (tanpa XP/leaderboard), ringan di HP, dan bisa dikelola admin. Tapi ada tiga masalah yang tersisa:

1. **Sulit dipahami orang awam.** Menu berisi 56 item, banyak bernama teknis berbahasa Inggris ("Dialect Diver", "Diction Lab", "Rhetorical Spotter") tanpa keterangan, ada fitur tumpang tindih (`/tools/tone-analyzer` dan `/tools/tone-detector`), dan bahasa UI campur. Pengguna baru tidak tahu harus mulai dari mana.
2. **Pemula tidak punya bahan.** Bacaan utama adalah sastra klasik Gutenberg (umumnya C1+). Placement Test menentukan level, tapi setelah itu tidak ada bacaan, kosakata, atau grammar yang sesuai level A1–B1.
3. **Level tidak pernah naik.** `profiles.cefr_level` hanya berubah lewat Placement Test sekali atau diubah manual di Pengaturan. Setelah gamifikasi dihapus, tidak ada lagi tanda kemajuan.

Selain itu, pengguna penting aplikasi ini adalah **mahasiswa Sastra Inggris peminatan penerjemahan**. Aplikasi sudah punya Translation Workshop, Translation Memory, Comparator, Untranslatables, Parallel Text, dan Timelapse, tapi belum mendukung kebutuhan akademik mereka (analisis teknik penerjemahan, penilaian berbasis rubrik).

## 2. Tujuan

| # | Tujuan | Ukuran keberhasilan |
|---|---|---|
| G1 | Pengguna baru paham aplikasi dan tahu langkah pertamanya | Onboarding selesai < 2 menit; beranda hanya menampilkan 4–6 alat yang relevan; menu ≤ 30 item utama |
| G2 | Pemula (A1–B1) punya jalur belajar | Library bisa difilter per CEFR; minimal 10 teks per level A1–B2; daftar kosakata inti dan 20 topik grammar dasar tersedia |
| G3 | Level naik berdasarkan bukti kemampuan, bukan poin | Profil menampilkan level per keterampilan; syarat naik level terlihat; Tes Naik Level tersedia |
| G4 | Mahasiswa penerjemahan bisa menganalisis dan dinilai secara akademik | Anotasi teknik penerjemahan, penilaian rubrik, dan ruang kerja per segmen berfungsi |
| G5 | (Opsional) Dosen bisa memakai aplikasi di kelas | Dosen membuat tugas, mahasiswa mengumpulkan, dosen memberi nilai rubrik |

## 3. Bukan tujuan (v3)

- Mengembalikan gamifikasi dalam bentuk apa pun: XP, streak, peringkat, lencana kompetitif.
- Kursus video atau konten berbayar.
- Sertifikat CEFR resmi. Level di aplikasi adalah **estimasi untuk belajar**, bukan sertifikasi.
- Memakai daftar kata atau materi berlisensi tertutup (mis. Oxford 3000/5000, English Vocabulary Profile) tanpa izin.
- Aplikasi native. PWA tetap jalur mobile.

## 4. Pengguna

| Persona | Kebutuhan utama di v3 |
|---|---|
| **Pemula umum** (A1–A2, mis. pelajar/pekerja) | Tahu harus mulai dari mana; bacaan pendek sesuai level; kosakata inti; grammar dasar; penjelasan dalam bahasa Indonesia |
| **Pelajar menengah** (B1–B2) | Melihat kemajuan per keterampilan; tantangan naik level yang jelas |
| **Mahasiswa Sastra Inggris** | Alat analisis sastra yang ada, dengan nama dan pengelompokan yang lebih jelas |
| **Mahasiswa peminatan penerjemahan** | Menganalisis teknik penerjemahan, mendapat penilaian rubrik, bekerja per segmen dengan TM & glosarium |
| **Dosen** (opsional) | Memberi tugas penerjemahan dan menilai dengan rubrik |
| **Admin** | Menandai level teks, mengelola kosakata inti & topik grammar, meninjau teks berjenjang buatan AI |

---

## 5. Kebutuhan fungsional

### 5.1 Penataan untuk orang awam (G1)

**Onboarding (3 pertanyaan, setelah daftar / login pertama):**
1. *Level bahasa Inggris kamu?* → "Belum tahu, tes dulu" (ke Placement Test) atau pilih A1–C2.
2. *Tujuan utama?* → `umum` (bahasa Inggris sehari-hari) · `sastra` (memahami karya sastra) · `penerjemahan` (latihan menerjemahkan).
3. *Waktu belajar per hari?* → 10 / 20 / 30+ menit.

Jawaban disimpan di `profiles` dan bisa diubah di Pengaturan. Onboarding bisa dilewati (default: tujuan `umum`, level dari Placement Test nanti).

**Beranda dipersonalisasi** berdasarkan tujuan dan level: blok "Langkah berikutnya" (satu saran konkret, mis. "Baca teks A2: *The Lost Key* (5 menit)") + 4–6 alat yang relevan. Blok v2 (Lanjutkan Membaca, Kosa Kata Hari Ini, Progres Pribadi) tetap ada.

**Menu disusun ulang berdasarkan tujuan, dalam bahasa Indonesia**, setiap item punya keterangan satu baris:

| Grup | Isi (contoh) |
|---|---|
| Baca & Pahami | Library, Buku Klasik, OCR Lens, Word Lookup (A-Z), Cultural Context |
| Kuasai Kosakata | Vocabulary Bank, Review (SRS), Kosakata Inti (baru), Idiom Library, Glossary |
| Latih Bahasa Inggris | Placement / Tes Naik Level, Grammar Dasar (baru), Grammar Clinic, Dialogue Simulator, Listening Test, Pronunciation Clinic |
| Analisis Sastra | Tone & Gaya (gabungan), Imagery, Rhetorical Spotter, Critical Lens, Conflict Mapper, Alter Ego, … |
| Latih Menerjemahkan | Translation Workshop, Ruang Kerja Segmen (baru), Translation Memory, Comparator, Untranslatables, Parallel Text, Timelapse |
| Komunitas | Forum, Reading Clubs, Jejaring Pembaca, Shared Annotations |
| Lainnya (dilipat) | Alat eksperimental/kreatif yang jarang dipakai |

**Konsolidasi:** gabungkan fitur yang tumpang tindih. Minimal: `tone-analyzer` + `tone-detector` → "Tone & Gaya". Daftar lengkap kandidat ditetapkan di Fase 8 (lihat plan) dan dikonfirmasi pemilik (Q5). Path lama di-redirect.

**"Coba dengan contoh"** di setiap alat AI: tombol yang mengisi input dengan contoh singkat sesuai alat, agar orang langsung melihat hasilnya.

**Konsistensi bahasa:** semua label UI, tombol, pesan error dalam bahasa Indonesia. Nama fitur boleh tetap bahasa Inggris (merek), tapi selalu disertai keterangan Indonesia.

**Landing page** (`/`, pengguna belum login): jelaskan aplikasi dalam 3 langkah *Baca → Simpan kata → Ulangi*, plus 3 jalur tujuan (umum, sastra, penerjemahan).

### 5.2 Fondasi belajar dasar (G2)

**Bacaan berjenjang CEFR:**
- Kolom `texts.cefr_level` (A1–C2, nullable). Kolom lama `texts.difficulty` dibiarkan.
- Admin: tab "Konten" untuk menandai level teks; tombol "Estimasi level dengan AI" memakai fitur `analyze-difficulty` yang sudah ada (mengembalikan `cefr`); admin tetap yang memutuskan.
- Library: filter level (default = level pengguna dan satu di bawahnya) dan label level di setiap kartu.
- Sumber teks berjenjang: (a) teks buatan admin, (b) **teks orisinal buatan AI** yang ditinjau admin sebelum terbit (status `draft` → `published`), (c) teks domain publik yang sudah sederhana. **Tidak** menyalin graded reader komersial.

**Kosakata inti:**
- Tabel `core_words (word, band, cefr_estimate, pos, example)`. Sumber yang direkomendasikan: **NGSL (New General Service List)**, berlisensi terbuka (CC BY-SA), dipetakan kasar ke CEFR per frekuensi (band 1 ≈ A1 … dst.). Lisensi dan atribusi dicantumkan di halaman Bantuan.
- Halaman "Kosakata Inti": daftar per level dengan status pengguna (belum/sedang/sudah dikuasai); tombol "Tambah 10 kata ke Review" (memakai tabel `vocabulary` + SRS yang sudah ada).

**Grammar dasar berurutan:**
- Tabel `grammar_topics (slug, title, cefr_level, order, summary_id, examples)` dengan ±20 topik A1–B1 (to be, present simple, articles, plural, past simple, can/could, comparatives, present perfect, future, conditionals tipe 1, dll.).
- Halaman topik: ringkasan (bahasa Indonesia), contoh, latihan singkat. Penjelasan detail memakai fitur `grammar-mini-lesson` yang sudah ada; latihan memakai Grammar Clinic.
- Setiap topik menautkan 1–2 bacaan berjenjang yang memakai pola tersebut (manual oleh admin).

**Adaptasi berdasarkan level:**
- Beginner Mode default menyederhanakan ke **satu level di bawah** level pengguna.
- Penjelasan AI (Word Lookup, Grammar Clinic, mini lesson): A1–A2 dalam bahasa Indonesia sederhana; B1 campur; B2+ dalam bahasa Inggris. Diteruskan lewat instruksi sistem di route terkait.

### 5.3 Level per keterampilan & naik level (G3)

**Prinsip:** level = CEFR; naik karena **bukti**; bersifat pribadi; **tidak pernah turun otomatis**; gagal tes tanpa penalti.

**Lima keterampilan dan sumber bukti:**

| Keterampilan | Bukti | Sumber (fitur yang ada / baru) |
|---|---|---|
| Membaca (`reading`) | Nilai kuis pemahaman pada teks dengan `cefr_level` diketahui | Kuis bab di reader (`generate-quiz`): **jawaban mulai disimpan** (baru) |
| Kosakata (`vocabulary`) | Persentase `core_words` per level yang sudah dikuasai (`vocabulary.mastery_level ≥ 3`) | Dihitung dari data yang ada |
| Grammar (`grammar`) | Skor Grammar Clinic & `grammar_score` Latihan Menulis | `grammar-clinic`, `writing-challenge/evaluate` |
| Menyimak (`listening`) | Skor Listening Test & dikte | `listening-test`, `evaluate-listening` |
| Menulis & berbicara (`production`) | Estimasi CEFR dari AI pada tulisan dan percakapan | `writing-challenge/evaluate`, `dialogue-simulator/feedback`: **tambahkan field `cefr_estimate`** di output |

Setiap bukti dicatat ke tabel `skill_evidence`. Level per keterampilan disimpan di `profiles.skill_levels` (jsonb). Level keseluruhan (`profiles.cefr_level`) = **median** dari kelima level keterampilan (pembulatan ke bawah).

**Syarat siap naik level** (contoh untuk level L → L+1, angka final bisa diatur admin di `system_config.level_rules`):
- Membaca: ≥ 5 teks level L+1 dengan rata-rata kuis ≥ 70%.
- Kosakata: ≥ 80% kosakata inti level L dikuasai.
- Menulis/berbicara: 3 hasil terakhir diestimasi AI ≥ L+1.
- Grammar & menyimak: rata-rata 5 hasil terakhir ≥ 70%.

**Alur:**
1. Profil → "Progres menuju B2": daftar syarat dengan centang (bukan bar XP).
2. Semua syarat terpenuhi → tawaran **Tes Naik Level** (10–15 menit), memakai ulang mesin Placement Test, hanya menguji level target.
3. Lulus → level naik, `level_history` tercatat, rekomendasi berganti.
4. Belum lulus → tampilkan keterampilan yang perlu dilatih; tes ulang setelah **14 hari**.
5. Pengguna tetap bisa mengubah level manual di Pengaturan (dicatat di `level_history` dengan sumber `manual`).

### 5.4 Jalur penerjemahan akademik (G4)

**Anotasi teknik penerjemahan:**
- Taksonomi default: **Molina & Hurtado Albir (2002)**, 18 teknik (adaptation, amplification, borrowing, calque, compensation, description, discursive creation, established equivalent, generalization, linguistic amplification, linguistic compression, literal translation, modulation, particularization, reduction, substitution, transposition, variation). Disimpan sebagai data (bukan hard-code di UI) agar bisa ditambah taksonomi lain.
- Di Translation Workshop dan Ruang Kerja Segmen: pengguna menyorot pasangan frasa sumber–sasaran lalu memilih teknik. AI dapat **menyarankan** teknik; pengguna yang memutuskan.
- Ringkasan per terjemahan: distribusi teknik (berguna untuk tugas/skripsi), bisa diekspor CSV.

**Penilaian berbasis rubrik:**
- Rubrik default: **Nababan, Nuraeni & Sumardiono (2012)**: akurasi, keberterimaan, keterbacaan, masing-masing skala 1–3, dengan bobot 3:2:1.
- Mode evaluasi baru "Rubrik" di Translation Workshop: AI menilai per segmen/kalimat dengan alasan; skor akhir tertimbang.
- Hasil disimpan (bukan hanya ditampilkan).

**Ruang Kerja Segmen (CAT ringan):**
- Teks sumber dipecah per kalimat (segmen). Setiap segmen: kolom terjemahan, status (draft/selesai), saran dari Translation Memory (kecocokan ≥ 70%) dan istilah Glossary.
- Pemeriksaan kualitas otomatis (tanpa AI): segmen kosong, angka berbeda, istilah glosarium tidak dipakai, terjemahan tidak konsisten untuk segmen sumber yang sama.
- Komentar penerjemah per segmen (alasan pilihan).
- Ekspor: teks bilingual (DOCX/CSV) dan glosarium (CSV).

**Tahap kompetensi penerjemah** (terpisah dari CEFR): *Pemula → Berkembang → Mahir*, dari rata-rata skor rubrik 5 terjemahan terakhir (mis. < 2,0 / 2,0–2,5 / > 2,5). Ditampilkan di profil jika tujuan pengguna = `penerjemahan`.

### 5.5 Mode kelas (G5, opsional, terakhir)

- Role baru `lecturer` (dosen). Dosen membuat kelas (kode undangan), tugas (teks sumber, tenggat, rubrik), melihat pengumpulan, memberi nilai/komentar rubrik.
- Mahasiswa bergabung lewat kode, mengerjakan tugas di Ruang Kerja Segmen, mengumpulkan.
- Tanpa peringkat antar-mahasiswa.

---

## 6. Kebutuhan non-fungsional

| Area | Kebutuhan |
|---|---|
| Privasi | Level, bukti keterampilan, dan nilai bersifat pribadi. RLS: hanya pemilik (dan dosen kelasnya, di Fase 12) yang bisa membaca. |
| Kejujuran | Level adalah estimasi; UI menyebutnya "estimasi level" dan tidak menjanjikan sertifikasi. |
| Lisensi | Hanya konten dengan lisensi jelas (NGSL CC BY-SA, domain publik, buatan sendiri/AI). Atribusi di halaman Bantuan. |
| Biaya AI | Semua panggilan AI baru lewat `runAI()` dengan feature key baru di `lib/ai/features.ts`, tercatat di `ai_usage_logs`, dan kena rate limit. |
| Mobile | Semua halaman baru lolos audit 375px (lihat `docs/mobile-audit.md`), target sentuh ≥ 44px. |
| Performa | Halaman daftar (kosakata inti, segmen) memakai pagination/virtualisasi; tidak merender ribuan baris sekaligus. |
| Aksesibilitas | Kontras WCAG AA, fokus keyboard terlihat, `prefers-reduced-motion` dihormati (fondasi sudah ada dari v2). |

## 7. Pertanyaan terbuka

| # | Pertanyaan | Asumsi default |
|---|---|---|
| Q1 | Sumber daftar kosakata inti? | **NGSL** (lisensi terbuka), dipetakan ke CEFR per band frekuensi |
| Q2 | Sumber teks berjenjang? | Teks orisinal buatan AI, ditinjau admin sebelum terbit, ditambah teks admin |
| Q3 | Perlu role `lecturer` baru, atau pakai role `curator` yang sudah ada? | Role baru `lecturer` (Fase 12, opsional) |
| Q4 | Rubrik penilaian terjemahan default? | Nababan et al. (2012); bisa ditambah rubrik lain sebagai data |
| Q5 | Alat mana yang digabung/disembunyikan di "Lainnya"? | Usulan di plan Fase 8.3; **pemilik konfirmasi sebelum dihapus/di-redirect** |
| Q6 | Apakah level bisa turun? | Tidak pernah otomatis; hanya manual oleh pengguna |
| Q7 | Angka syarat naik level? | Seperti §5.3, bisa diubah admin lewat `system_config.level_rules` |
