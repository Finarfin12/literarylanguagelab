# Peta Cakupan Kompetensi (internal, draf)

Alat periksa untuk Fase 24: memastikan urutan belajar peta belajar mencakup kompetensi yang relevan untuk pendidikan Sastra Inggris & Penerjemahan. **Tidak ditampilkan ke pengguna.**

- **Status dokumen: draf.** Disusun dari ringkasan di dokumen masukan pemilik, belum dari `Buku-Pembelajaran-Sastra-Inggris-Per-Semester.docx` dan `DAFTAR-PER-SEMESTER.txt`. Sebelum Fase 24 dimulai, cocokkan dengan kedua file itu (36 mata kuliah inti).
- **Sengaja tanpa kode mata kuliah dan nama lembaga.** Daftar asli tetap di tangan pemilik dan tidak di-commit.
- **Alat** merujuk path yang ada di `lib/rooms.ts` (dicek pada `0b39ba8`).

**Status:** ✅ alat sudah ada · 📝 cukup penjelasan & latihan topik · 🔧 alat khusus belum ada (usulan Fase 25, tidak wajib untuk Fase 24).

## Tahap 1 — Fondasi

| Kompetensi | Topik yang diusulkan | Alat | Status |
|---|---|---|---|
| Skimming, scanning, ide pokok | Membaca Cepat & Ide Pokok | `/library` | 📝 🔧 latihan skimming |
| Makna tersirat, kosakata dari konteks | Memahami Makna dari Konteks | `/library`, `/tools/nuance-detector` | ✅ |
| Paragraf deskriptif & naratif, surat | Menulis Paragraf & Surat | `/tools/writing-assistant` | ✅ |
| Kelas kata, kala, modal, perbandingan | Struktur Kalimat Dasar | `/english-lab/grammar`, `/kursus` | ✅ |
| Keluarga kata & kolokasi | Keluarga Kata & Kolokasi | `/vocabulary/core` | ✅ |

## Tahap 2 — Transisi

| Kompetensi | Topik yang diusulkan | Alat | Status |
|---|---|---|---|
| Pola esai & argumen | Menulis Esai | `/tools/academic-outline`, `/tools/essay-auditor` | ✅ |
| Kalimat majemuk & kompleks | Kalimat Panjang | `/tools/sentence-architect` | ✅ |
| Pemahaman lintas budaya | Memahami Lintas Budaya | `/tools/cultural-context` | ✅ |
| Membaca kritis & anotasi | Membaca Kritis | `/tools/annotations`, `/tools/rhetorical-spotter` | ✅ |
| Analisis sastra berbasis bukti | Menulis Analisis Sastra | `/tools/critical-lens`, `/tools/essay-auditor` | ✅ |
| Dialek, sosiolek, register, slang | Variasi Bahasa | `/tools/dialect-diver`, `/english-lab/slang-decoder` | ✅ |
| Padanan, register, terjemahan balik | Dasar Penerjemahan | `/translation-workshop` | ✅ |
| Terjemahan struktural kontrastif | Struktur Inggris vs Indonesia | `/translation-workshop` | ✅ |

## Tahap 3 — Pendalaman

| Kompetensi | Topik yang diusulkan | Alat | Status |
|---|---|---|---|
| Kalimat efektif, afiksasi, ejaan Indonesia | Bahasa Indonesia untuk Penerjemah | — | 📝 🔧 penyuntingan bahasa Indonesia |
| Merangkum | Merangkum | `/tools/paraphrase` | 📝 |
| Fonetik & fonologi | Bunyi Bahasa | `/tools/pronunciation-clinic` | ✅ |
| Linguistik umum | Pengantar Cara Kerja Bahasa | `/tools/sentence-architect`, `/tools/semantic-map` | 📝 |
| Terjemahan informatif, idiom, kolokasi | Menerjemahkan Teks Informatif | `/tools/idiom-detector`, `/glossary`, `/translation-memory` | ✅ |
| Teori penerjemahan, domestikasi & forenisasi, pergeseran | Teori Penerjemahan | `/translation-workspace` | ✅ |
| Analisis teks sebelum menerjemahkan | Analisis Teks Sumber | `/tools/tone-analyzer`, `/tools/idiom-detector` | ✅ |
| Penyuntingan substansi, bahasa, ketikan | Penyuntingan Terjemahan | `/tools/comparator`, `/tools/translation-timelapse` | 📝 🔧 penyuntingan bahasa Indonesia |

## Tahap 4 — Lanjut & proyek

| Kompetensi | Topik yang diusulkan | Alat | Status |
|---|---|---|---|
| Terjemahan hukum, kesehatan, sains | Terjemahan Domain Khusus | `/translation-workspace`, `/glossary` | ✅ |
| Terjemahan fiksi & puisi | Menerjemahkan Karya Fiksi | `/translation-workspace`, `/tools/imagery-grader` | ✅ |
| Metode penelitian penerjemahan, penilaian kualitas | Meneliti Terjemahan | `/translation-workspace` | ✅ 🔧 ringkasan statistik |
| Morfologi & sintaksis | Struktur Kata & Kalimat | `/tools/sentence-architect` | 📝 🔧 morfologi |
| Semantik & relasi makna | Makna & Nuansa | `/tools/semantic-map`, `/tools/literary-synonyms`, `/tools/nuance-detector` | ✅ |
| Sejarah pemikiran & teori kritis | Pemikiran & Teori Kritis | `/tools/critical-lens`, `/tools/time-traveler` | 📝 |
| Proyek akhir & portofolio | Proyek Akhir | `/translation-workspace`, `/tools/case-study-generator` | ✅ |

## Di luar cakupan

Mata kuliah umum di luar bidang bahasa, sastra, dan penerjemahan; SKS, nilai, dan ijazah.

## Cara memakai

1. Sesi Fase 24 mencocokkan tabel ini dengan daftar pemilik dan menandai kompetensi yang belum tercakup.
2. Setiap kompetensi harus berakhir pada satu dari: topik, bagian dari topik lain, atau baris "di luar cakupan" dengan alasan.
3. Daftar topik final disetujui pemilik (PRD Q6).
