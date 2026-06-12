# 📖 Dokumentasi Lengkap Fitur — Literary Language Lab

**Versi:** 2.0  
**Terakhir Diperbarui:** 11 Juni 2026  
**URL Produksi:** [literarylanguagelab.my.id](https://www.literarylanguagelab.my.id)

> Dokumen ini mencatat **seluruh** fitur yang terintegrasi dan tersedia di platform Literary Language Lab, beserta tata cara penggunaan, komponen teknis, dan endpoint API terkait.

---

## Daftar Isi

1. [Perpustakaan & Sumber Bacaan](#1-perpustakaan--sumber-bacaan)
2. [Pengalaman Membaca (Reading Experience)](#2-pengalaman-membaca-reading-experience)
3. [Fitur Ramah Pemula (Beginner Features)](#3-fitur-ramah-pemula-beginner-features)
4. [LingoWise AI — 8+ Mode Bedah Sastra](#4-lingowise-ai--8-mode-bedah-sastra)
5. [LinguaVisual — Alat Visual & Seni](#5-linguavisual--alat-visual--seni)
6. [Lexicon — Kamus & Kosa Kata](#6-lexicon--kamus--kosa-kata)
7. [Study — Alat Belajar & Analisis Akademik](#7-study--alat-belajar--analisis-akademik)
8. [Translation Tools — Alat Penerjemahan](#8-translation-tools--alat-penerjemahan)
9. [Komunitas, Forum & Gamifikasi](#9-komunitas-forum--gamifikasi)
10. [Analitik & Riwayat Pembelajaran](#10-analitik--riwayat-pembelajaran)
11. [Pengaturan & Personalisasi](#11-pengaturan--personalisasi)
12. [Infrastruktur & Arsitektur Teknis](#12-infrastruktur--arsitektur-teknis)
13. [English Lab (Pembelajaran Bahasa Inggris Umum)](#13-english-lab-pembelajaran-bahasa-inggris-umum)

---

## 1. Perpustakaan & Sumber Bacaan

### 1.1 Public Domain Books
- **Halaman:** `/gutenberg`
- **Deskripsi:** Akses instan ke **70.000+ buku sastra klasik** gratis dari Project Gutenberg. Mendukung dua penyedia layanan:
  - **OpenLibrary** (Utama): Lebih cepat, menampilkan kover buku berkualitas tinggi, mengambil data langsung dari browser.
  - **Gutendex** (Cadangan): Fokus eksklusif pada koleksi Gutenberg klasik, berfungsi sebagai sistem fallback.
- **Fitur:**
  - Pencarian berdasarkan judul atau nama penulis.
  - Sistem fallback pencarian otomatis antar penyedia.
  - Baca buku secara penuh (*full-text reading*) langsung di aplikasi.
  - Posisi baca terakhir disimpan otomatis (*auto-save progress*).
  - Buku yang pernah dibuka tersimpan untuk akses luring (*offline*).

### 1.2 Text Library (Koleksi Pribadi)
- **Halaman:** `/library`
- **Deskripsi:** Koleksi teks sastra milik pengguna yang dapat ditambah secara manual atau melalui AI.
- **Fitur:**
  - Tambah teks baru dengan menulis sendiri atau meminta bantuan AI untuk menghasilkan teks sastra.
  - Impor teks dari hasil OCR (foto buku fisik).
  - Organisasi dan pengelolaan koleksi bacaan pribadi.

### 1.3 OCR Lens (Pemindai Buku Fisik)
- **Halaman:** `/library/add/ocr`
- **API:** `/api/ocr`
- **Deskripsi:** Mengubah foto halaman buku fisik menjadi teks digital menggunakan teknologi Computer Vision AI (`llama-3.2-11b-vision-preview`).
- **Cara Penggunaan:**
  1. Unggah foto halaman buku dari kamera atau galeri.
  2. AI akan mengekstrak teks dari gambar secara otomatis.
  3. Hasil teks dapat langsung diimpor ke Text Library untuk dibaca dan dianalisis lebih lanjut.

### 1.4 A-Z Browser & Lexicon Search
- **Halaman:** `/tools/a-z-dictionary`, `/tools/lexicon-search`
- **API:** `/api/lexicon-search`
- **Deskripsi:** Kamus bahasa Inggris lengkap dengan fitur pencarian mendalam.
- **Fitur:**
  - Pencarian kata berdasarkan abjad (A–Z).
  - Definisi, sinonim, rima kata, dan konteks budaya.
  - Informasi etimologi (asal-usul kata).
  - Contoh penggunaan dalam konteks sastra.

### 1.5 Pre-Reading Vocabulary Preview
- **Halaman:** `/preview/[id]`
- **Deskripsi:** Fitur yang secara otomatis mengekstraksi 8-12 kata kunci (kosa kata) tingkat lanjut dari teks menggunakan AI sebelum pengguna membacanya. Bertujuan untuk mengurangi beban kognitif (*schema activation*).
- **Fitur:**
  - **Toggle Setting**: Bisa dinonaktifkan di menu Pengaturan.
  - **Pre-Learn Flashcard**: Pengguna bisa memilih "Pelajari Dulu" untuk berlatih kosa kata secara instan dalam bentuk *flashcard* temporer. Dilengkapi dengan opsi penyisipan ke *Vocabulary Bank* secara manual.

---

## 2. Pengalaman Membaca (Reading Experience)

### 2.1 Immersive Reader
- **Halaman:** `/gutenberg/[id]` atau `/read/[id]`
- **Komponen:** `TextDisplay.tsx`
- **Deskripsi:** Antarmuka pembaca imersif yang dirancang khusus untuk membaca teks sastra klasik dengan nyaman.
- **Fitur:**
  - Tampilan teks bersih dengan tipografi sastra (*serif font*).
  - Indentasi paragraf otomatis dan format *verse* untuk puisi.
  - Estimasi waktu baca ditampilkan di header.
  - Pintasan keyboard (`Ctrl+1`: AI Companion, `Esc`: Tutup sidebar).
  - Pemilihan teks (*text selection*) untuk analisis kata/kalimat instan.

### 2.2 Word Lookup Sidebar (Bedah Kata)
- **Komponen:** `WordLookupSidebar.tsx`
- **API:** `/api/lookup`
- **Deskripsi:** Panel analisis kata yang muncul saat pengguna menyeleksi kata di teks bacaan.
- **Cara Penggunaan:**
  1. Klik atau seleksi kata/frasa pendek (maks. 5 kata) di teks bacaan.
  2. Panel samping (*sidebar*) akan terbuka secara otomatis.
  3. Panel menyediakan hingga **13 mode analisis** (definisi, terjemahan, sinonim sastra, konteks budaya, nuansa, dll.).
  4. Tombol "Simpan Kata" untuk menyimpan ke Vocabulary Bank.

### 2.3 In-Reader Sentence Analysis (Bedah Kalimat)
- **Komponen:** `SentenceAnalysisSidebar.tsx`
- **API:** `/api/parse-sentence`, `/api/detect-idioms`
- **Deskripsi:** Analisis kalimat mendalam yang muncul saat pengguna memblok kalimat panjang.
- **Cara Penggunaan:**
  1. Blok (*select*) kalimat yang ingin dipelajari saat membaca buku.
  2. Pada *tooltip* yang muncul, klik ikon **✨ Analisis**.
  3. Sidebar akan menampilkan:
     - Terjemahan kalimat penuh.
     - Visualisasi pohon tata bahasa (*Dependency Tree*).
     - Penjelasan idiom dan kiasan yang terdeteksi.
     - Mode Simplify (B1) untuk menyederhanakan kalimat kuno.

### 2.4 Reading Companion (AI Chat Pop-up)
- **Komponen:** `ReadingCompanionSidebar.tsx`
- **API:** `/api/tools/reading-companion`
- **Deskripsi:** Asisten kecerdasan buatan yang melayang di layar saat membaca, memungkinkan diskusi bebas tentang teks yang sedang dibaca.
- **Cara Penggunaan:**
  1. Klik tombol **"Ask AI Companion"** (ungu) di header atas layar pembaca.
  2. Ketik pertanyaan apa pun tentang isi buku yang sedang dibaca.
  3. AI akan merespons dalam konteks buku tersebut (judul, penulis, dan kutipan relevan otomatis disertakan).

### 2.5 Bookmark & Highlight
- **Komponen:** `BookmarkSidebar.tsx`
- **Deskripsi:** Sistem penanda (*bookmark*) dan penyorotan (*highlight*) teks.
- **Fitur:**
  - Tandai halaman atau paragraf penting.
  - Warna *highlight* dapat dikustomisasi melalui Pengaturan.

### 2.6 Cultural Text Renderer
- **Komponen:** `CulturalTextRenderer.tsx`
- **Deskripsi:** Sistem yang secara otomatis mendeteksi dan menyorot referensi budaya (mitologi, sejarah, tradisi) di dalam teks bacaan. Referensi yang dikenali akan ditampilkan dengan *tooltip* penjelasan konteks budaya.

### 2.7 Text-to-Speech (TTS / Read Aloud)
- **Deskripsi:** Fitur pembacaan otomatis paragraf menggunakan Web Speech API bawaan browser.
- **Cara Penggunaan:**
  1. Arahkan kursor ke paragraf mana pun (ikon muncul saat *hover*).
  2. Klik ikon **Speaker (🔊)** di sebelah kanan paragraf.
  3. Suara narasi akan memutar paragraf dengan pelafalan *native* dalam tempo 0.85x (lebih lambat agar ramah pemula).
  4. Klik lagi untuk menghentikan pemutaran.
- **Catatan:** Fitur ini dapat dinonaktifkan sepenuhnya melalui Pengaturan → Reading Experience → Text-to-Speech. Jika dimatikan, ikon speaker tidak akan muncul.

### 2.8 Listening Challenge from Literature
- **Halaman:** `/read/[id]`
- **Deskripsi:** Evaluasi komprehensif pendengaran (*listening*) dan berbicara (*speaking*) yang muncul otomatis setelah menyelesaikan setiap bab bacaan.
- **Fitur:**
  - AI membacakan 3 pertanyaan pemahaman seputar plot cerita di bab yang baru saja dibaca.
  - Pengguna menjawab menggunakan mikrofon (*Voice STT*).
  - AI memberikan penilaian (0-100) dan *feedback* dalam Bahasa Indonesia untuk akurasi jawaban dan kejelasan bahasa Inggris lisan pengguna.
  - Dapat diakses dengan mengeklik tombol "Listening Challenge" di modal kuis antar-bab, dan dapat dinonaktifkan di Pengaturan.

---

## 3. Fitur Ramah Pemula (Beginner Features)

### 3.1 Graded Reader Mode (Beginner Mode / B1 Simplifier)
- **Komponen:** `InteractiveParagraph.tsx`
- **API:** `/api/simplify-text`
- **Deskripsi:** Menulis ulang teks sastra kuno/kompleks (C1/C2) menjadi bahasa Inggris modern tingkat menengah (B1/B2) tanpa mengubah alur cerita.
- **Cara Penggunaan:**
  1. Di header atas layar pembaca, centang kotak **"Beginner Mode"**.
  2. Pilih level kesulitan target: **B1 (Menengah)** atau **B2 (Menengah-Atas)**.
  3. Pilih tata letak (*layout*):
     - **Berdampingan (Bawah)**: Teks asli tetap, teks B1 muncul di bawahnya dalam kotak hijau.
     - **Ganti Langsung (Inline)**: Teks asli disembunyikan, digantikan sepenuhnya oleh teks B1.
  4. Sistem menggunakan *Lazy Loading* (hanya paragraf yang terlihat di layar yang diproses) untuk efisiensi.

### 3.2 Syntax Highlighting (Training Wheels / Bedah Sintaksis)
- **Komponen:** `InteractiveParagraph.tsx`
- **API:** `/api/highlight-syntax`
- **Deskripsi:** Mewarnai setiap kata dalam paragraf berdasarkan peran tata bahasanya untuk membantu pemula mengenali struktur kalimat.
- **Legenda Warna:**
  - 🔵 **Biru** = Subjek (*Subject*)
  - 🔴 **Merah** = Verba / Predikat (*Verb*)
  - 🟡 **Kuning** = Objek (*Object*)
  - ⚪ Tanpa warna = Kata lain (*Other*: preposisi, artikel, konjungsi)
- **Cara Penggunaan:**
  1. Arahkan kursor ke paragraf yang ingin dibedah.
  2. Klik ikon **Kaca Pembesar (🔍)** di sebelah kanan paragraf.
  3. Paragraf akan otomatis diwarnai, dan **legenda panduan warna** akan muncul di bagian atas layar.
  4. Klik ikon 🔍 di paragraf lain untuk berpindah, atau klik lagi untuk menutup.
- **Catatan:** Fitur ini bekerja per-paragraf (bukan seluruh halaman sekaligus) untuk mencegah kelebihan beban API.

### 3.3 Comprehension Checkpoint (Kuis Bab Otomatis)
- **API:** `/api/generate-quiz`
- **Deskripsi:** Kuis pemahaman dinamis yang muncul otomatis setiap kali pengguna selesai membaca satu bab.
- **Cara Penggunaan:**
  1. Pastikan fitur ini aktif di Pengaturan → Reading Experience → Kuis Pemahaman Otomatis.
  2. Baca buku seperti biasa.
  3. Saat Anda menggulir (*scroll*) melewati judul bab baru (misal: dari *Chapter I* ke *Chapter II*), pop-up **"Comprehension Checkpoint"** akan otomatis muncul.
  4. Jawab pertanyaan pilihan ganda (A/B/C/D) berdasarkan isi bab sebelumnya.
  5. Setelah menjawab, AI memberikan penjelasan (*explanation*) mengapa jawaban benar/salah.
  6. Klik **"Lanjutkan Membaca"** untuk menutup pop-up dan melanjutkan.

---

## 4. All Toolkits Hub & LingoWise AI

### 4.1 All Toolkits Hub (App Drawer)
- **Halaman:** `/tools`
- **Deskripsi:** Etalase visual (*App Drawer*) interaktif yang menampung 30+ alat analisis AI mini (seperti *Tone Analyzer, Mood Transformer, Paraphrase Challenge*) di satu layar.
- **Fitur:** 
  - **Smart Search Bar**: Mencari alat berdasarkan kata kunci secara *real-time*.
  - **Category Dropdown Filter**: Menyaring alat berdasarkan kategori spesifik (Targeted Transformers, Analysis Extractors, Interactive & Gamification, Lexicon & Databases).

### 4.2 LingoWise AI — Mode Bedah Sastra

**Halaman Utama:** `/lingowise`
**API:** `/api/lingowise`, `/api/tools/dynamic`

LingoWise adalah asisten kecerdasan buatan utama yang dapat membedah teks bahasa Inggris menggunakan berbagai lensa analisis. Pengguna memasukkan teks ke dalam kotak input, memilih mode, dan menerima analisis mendalam.

### 4.1 Dialect Diver
- **Halaman:** `/tools/dialect-diver`
- **Deskripsi:** Menganalisis dialek, aksen, atau slang kuno dalam teks.
- **Output:** Terjemahan ke *Standard English* + asal dialek + dampak sosial/kelas karakter.

### 4.2 Tone & Grammar Analyzer
- **Halaman:** `/tools/tone-analyzer`
- **API:** `/api/analyze-tone`, `/api/tools/tone-analyzer`
- **Deskripsi:** Membedah struktur tata bahasa, mendeteksi nada bicara (*tone of voice*), dan menentukan level CEFR kalimat.
- **Output:** Analisis *before/after*, penjelasan grammar, tone + level CEFR.

### 4.3 Vibe Translator
- **Halaman:** `/tools/vibe-translator`
- **Deskripsi:** Menerjemahkan nuansa emosional teks tanpa menghilangkan makna aslinya.
- **Output:** 3 poin ringkas — Emotional Tone, Key Word, Simple Paraphrase.

### 4.4 Mood Transformer
- **Halaman:** `/tools/mood-transformer`
- **Deskripsi:** Menggubah suasana hati (*mood*) teks ke variasi lain (Poetic, Melancholic, Suspenseful, Romantic, Gothic).
- **Output:** 2 variasi kalimat dalam mood berbeda + alasan pemilihan diksi.

### 4.5 Diction Lab
- **Halaman:** `/tools/diction-lab`
- **Deskripsi:** Menunjukkan eskalasi gaya bahasa dari kalimat sederhana ke tiga level sastra.
- **Output:** Tiga versi kalimat — Basic, Poetic, Shakespearean.

### 4.6 Era Translator
- **Halaman:** `/tools/era-translator`
- **Deskripsi:** Menerjemahkan kalimat modern ke gaya bahasa era sastra tertentu, atau sebaliknya.
- **Era yang tersedia:** Elizabethan, Victorian, Modernist, Romanticism, Post-Colonial, Contemporary.

### 4.7 Sentence Architect
- **Halaman:** `/tools/sentence-architect`
- **Deskripsi:** Membedah struktur sintaksis kalimat yang rumit dengan pewarnaan visual.
- **Output:** Visualisasi *color-coded* (Subject=biru, Verb=merah, Adjective=kuning) + toggle *show/hide labels*.

### 4.8 Rhetorical Devices Spotter
- **Halaman:** `/tools/rhetorical-spotter`
- **Deskripsi:** Mendeteksi gaya bahasa (majas, metafora, ironi) dalam teks dan menjelaskan efek psikologis/estetis/ritmisnya.

### 4.9 Alter Ego Chat
- **Halaman:** `/tools/alter-ego`
- **API:** `/api/tools/alter-ego`
- **Deskripsi:** Ruang interaktif untuk berdialog langsung dengan persona penulis legendaris.
- **Penulis tersedia:** Shakespeare, Jane Austen, Edgar Allan Poe, Hemingway, Virginia Woolf, Chinua Achebe, Pramoedya Ananta Toer, dan lainnya.
- **Cara Penggunaan:** Pilih penulis dari dropdown, lalu ketik pertanyaan. AI akan merespons menggunakan gaya bahasa dan sudut pandang khas penulis tersebut.

### 4.10 Tone Detector
- **Halaman:** `/tools/tone-detector`
- **Deskripsi:** Mendeteksi nada emosional (sarkasme, ironi, humor, melankoli, dll.) dari kalimat tunggal.

---

## 5. LinguaVisual — Alat Visual & Seni

### 5.1 Imagery Sketcher
- **Halaman:** `/tools/imagery-sketcher`
- **Deskripsi:** Menghasilkan *moodboard* deskriptif dari teks — suasana, pencahayaan, warna, dan tekstur seperti lukisan/scene film.

### 5.2 Semantic Visual
- **Halaman:** `/tools/semantic-visual`
- **Deskripsi:** Visualisasi abstrak dari makna dan hubungan semantik dalam teks.

### 5.3 Poem to Palette
- **Halaman:** `/tools/poem-to-palette`
- **Deskripsi:** Mengubah puisi menjadi palet warna yang merepresentasikan suasana hati dan emosi yang terkandung.

### 5.4 Sentiment Spectrum Analyzer
- **Halaman:** `/tools/sentiment-spectrum`
- **Deskripsi:** Mengategorikan "suhu" emosi setiap kalimat dengan metafora warna (Crimson Red, Indigo Blue, dll.) untuk visualisasi timeline emosi.

### 5.5 Semantic Map (Network Graph)
- **Halaman:** `/tools/semantic-map`
- **Komponen:** `SemanticMapViewer.tsx`
- **Deskripsi:** Menghasilkan grafik jaringan (*network graph*) interaktif yang memperlihatkan hubungan antar konsep, karakter, atau tema dalam teks.

---

## 6. Lexicon — Kamus & Kosa Kata

### 6.1 Literary Synonyms
- **Halaman:** `/tools/literary-synonyms`
- **Deskripsi:** Bukan sekadar sinonim — menampilkan 10 sinonim sastra beserta konteks situasi dan emosi yang tepat untuk menggunakannya.

### 6.2 Cultural Context Decoder
- **Halaman:** `/tools/cultural-context`
- **Deskripsi:** Mengungkap makna budaya, sejarah, atau mitologi di balik kata/frasa yang tidak tersedia di kamus biasa.

### 6.3 Nuance Detector
- **Halaman:** `/tools/nuance-detector`
- **Deskripsi:** Membedakan "rasa" konotasi kata-kata yang mirip — mana yang lebih hangat, dingin, formal, atau kasual.

### 6.4 Metaphor Generator
- **Halaman:** `/tools/metaphor-generator`
- **Deskripsi:** Menghasilkan 3 metafora berbeda untuk suatu konsep beserta makna, emosi, dan penjelasannya.

### 6.5 Idiom & Metaphor Detector
- **Halaman:** `/tools/idiom-detector`
- **API:** `/api/detect-idioms`
- **Deskripsi:** Mendeteksi idiom dan metafora dalam teks beserta penjelasan makna dan padanannya dalam bahasa Indonesia.

### 6.6 Literary Time Traveler
- **Halaman:** `/tools/time-traveler`
- **Deskripsi:** Menunjukkan evolusi makna kata di berbagai era (Renaissance, Victorian, Modern, Post-Colonial, Contemporary).

### 6.7 Vocabulary Bank
- **Halaman:** `/vocabulary`
- **API:** `/api/vocabulary`
- **Deskripsi:** Bank kosa kata pribadi tempat menyimpan semua kata yang ditemui saat membaca.
- **Fitur:**
  - Simpan kata beserta konteks kalimat aslinya.
  - Lihat statistik dan grafik pertumbuhan penguasaan kosa kata.
  - Ekspor ke format CSV (kompatibel dengan Anki).

### 6.8 Interactive Flashcards (Kartu Interaktif 3D)
- **Deskripsi:** Sistem kartu *flashcard* 3D interaktif (bolak-balik) untuk menguji ingatan atas kosa kata yang dikumpulkan.
- **Cara Penggunaan:**
  1. Buka Vocabulary Bank → klik **"Mulai Belajar (Flashcard)"**.
  2. Kartu akan menampilkan kata di sisi depan.
  3. Klik kartu untuk membaliknya dan melihat definisi/konteks.
  4. Pilih tingkat ingatan: Lupa Total / Hampir Lupa / Ingat Ragu / Sangat Mudah.

### 6.9 Spaced Repetition (SM-2 Algorithm)
- **Halaman:** `/review`
- **API:** `/api/review`
- **Deskripsi:** Sistem pengulangan cerdas yang mengingatkan pengguna untuk me-*review* kata tepat sebelum hampir dilupakan.
- **Algoritma:** SM-2 (SuperMemo 2) — kata yang sering dilupakan muncul lebih sering, kata yang sudah dikuasai ditunda lebih lama.

### 6.10 Glossary Builder
- **Halaman:** `/glossary`
- **Deskripsi:** Pembangun glosarium personal untuk mengorganisasi istilah-istilah khusus berdasarkan kategori atau buku yang sedang dibaca. Fitur ini dapat diakses dengan cepat melalui *All Toolkits Hub* di kategori Lexicon & Databases.

### 6.11 Idiom Library
- **Halaman:** `/idioms`
- **Deskripsi:** Perpustakaan/direktori idiom bahasa Inggris yang dikumpulkan dari berbagai sesi membaca, lengkap dengan penjelasan dan konteks penggunaannya. Terintegrasi di *All Toolkits Hub*.

### 6.12 Untranslatables
- **Halaman:** `/tools/untranslatables`
- **API:** `/api/untranslatables`
- **Deskripsi:** Mengeksplorasi kata-kata yang tidak memiliki padanan langsung antar bahasa, beserta konteks budaya dan alternatif terjemahannya.

### 6.13 Lexicon Search (Pencarian Mendalam)
- **Halaman:** `/tools/lexicon-search`
- **API:** `/api/lexicon-search`
- **Deskripsi:** Pencarian kata mendalam dengan mode: Dictionary, Translate, Rhyme, Quote, Lyricism, Metaphors, Etymology, Time Traveler, Semantic Map.

### 6.14 Cultural Context Library
- **Halaman:** `/tools/cultural-context`
- **Deskripsi:** Editor khusus dan ensiklopedia budaya tempat pengguna dapat mendaftarkan frasa/referensi mitologi, sejarah, atau literatur kuno. Referensi yang ada di direktori ini akan dilacak dan disorot (*highlight*) secara otomatis oleh *Cultural Text Renderer* saat pengguna membaca buku. Dapat diakses lewat *All Toolkits Hub*.

---

## 7. Study — Alat Belajar & Analisis Akademik

### 7.1 Side-by-Side Comparator
- **Halaman:** `/tools/comparator`
- **API:** `/api/comparator`
- **Deskripsi:** Membandingkan dua teks atau dua versi terjemahan secara berdampingan untuk menganalisis perbedaan gaya, diksi, dan struktur.

### 7.2 Difficulty Predictor
- **Halaman:** `/tools/difficulty-analyzer`
- **API:** `/api/analyze-difficulty`
- **Deskripsi:** Memprediksi tingkat kesulitan teks berdasarkan kosa kata, struktur kalimat, dan kompleksitas tata bahasa. Memberikan perkiraan level CEFR.

### 7.3 Paraphrase Challenge
- **Halaman:** `/tools/paraphrase`
- **API:** `/api/tools/paraphrase/generate`, `/api/tools/paraphrase/evaluate`
- **Deskripsi:** Latihan memparafrase kalimat sastra tingkat tinggi.
- **Cara Penggunaan:**
  1. Sistem menghasilkan 1 kalimat sastra klasik (maks. 20 kata).
  2. Pengguna menulis ulang (*paraphrase*) kalimat tersebut.
  3. AI mengevaluasi: makna terjaga, nuansa, dan memberikan skor 1-10.

### 7.4 Imagery Grader
- **Halaman:** `/tools/imagery-grader`
- **Deskripsi:** Mengoreksi grammar + memberikan skor *literary devices* + contoh perbaikan untuk tulisan pengguna.

### 7.5 Character Monologue
- **Halaman:** `/tools/character-monologue`
- **Deskripsi:** Menghasilkan monolog internal dari sudut pandang karakter fiksi tertentu berdasarkan konteks novel.

### 7.6 Academic Outline Generator
- **Halaman:** `/tools/academic-outline`
- **Deskripsi:** Menghasilkan kerangka esai akademik: *thesis statement* + 3 argumen + kesimpulan.

### 7.7 AI Writing Assistant
- **Halaman:** `/tools/writing-assistant`
- **API:** `/api/writing-feedback`
- **Deskripsi:** Asisten menulis yang memberikan umpan balik terhadap tulisan pengguna: koherensi, kekuatan *thesis*, penggunaan bukti, dan saran perbaikan.

### 7.8 Story Mode Quiz
- **Halaman:** `/tools/story-quiz`
- **API:** `/api/tools/story-quiz`
- **Deskripsi:** Permainan kuis di mana AI menyusun cerita pendek menggunakan kosa kata dari Vocabulary Bank pengguna.
- **Cara Penggunaan:**
  1. Sistem mengambil 5 kata dari Vocabulary Bank pengguna.
  2. AI membangkitkan cerita pendek menggunakan kata-kata tersebut (pilihan genre: misteri, fiksi ilmiah, roman, dll.).
  3. Di akhir cerita, pengguna menjawab 5 pertanyaan untuk menguji pemahaman.

### 7.9 Pronunciation Clinic & Voice Ecosystem
- **Halaman:** Akses melalui `/tools` (Toolkit: Pronunciation Clinic)
- **API:** `/api/stt`
- **Deskripsi:** Klinik latihan pelafalan vokal dengan evaluasi cerdas *Speech-to-Text* (STT) *Dual-Engine*.
- **Fitur:**
  - Evaluasi akurasi pelafalan dengan skor persentase matematis (*Levenshtein distance*).
  - Opsi *Dual-Engine*: Pilih kecepatan instan (Browser Native API) atau akurasi tingkat dewa (Groq Whisper-large-v3) melalui menu `/settings`.
  - Terintegrasi dengan kustom *React Hook* (`useSpeechToText`) yang dapat diperluas ke berbagai fitur lain di masa mendatang.

### 7.10 Plot Twist Generator
- **Halaman:** `/tools/plot-twist`
- **Deskripsi:** Menghasilkan skenario *what-if* — jalan cerita alternatif dari novel yang sedang dibaca beserta analisis dampak pada tema.

### 7.10 Literary Conflict Mapper
### 7.11 Literary Conflict Mapper
- **Halaman:** `/tools/conflict-mapper`
- **Deskripsi:** Mengategorikan tipe konflik dalam teks (Man vs. Man, Man vs. Self, dll.) + akar masalah + dampak psikologis tokoh.

### 7.12 Critical Lens Applier
- **Halaman:** `/tools/critical-lens`
- **Deskripsi:** Menganalisis teks menggunakan teori kritis sastra: Feminism, Marxist, Psychoanalytic, Post-Colonial, Ecocriticism.

---

## 8. Translation Tools — Alat Penerjemahan

### 8.1 Translation Workshop
- **Halaman:** `/translation-workshop`
- **API:** `/api/translation`
- **Deskripsi:** Layar terbelah (*split-screen*) untuk berlatih menerjemahkan teks English→Indonesia dengan umpan balik AI.
- **Mode Evaluasi:**
  - **General Feedback**: Umpan balik umum terhadap kualitas terjemahan.
  - **Equivalence Checker**: Memeriksa kesetaraan makna.
  - **Register Matcher**: Memeriksa kesesuaian register bahasa (formal/informal).
  - **Back-Translation**: Menerjemahkan balik hasil terjemahan untuk mengecek akurasi.

### 8.2 Translation Memory
- **Halaman:** `/translation-memory`
- **Deskripsi:** Menyimpan pasangan teks asli-terjemahan dari sesi Translation Workshop sebelumnya untuk referensi di masa mendatang.

### 8.3 Parallel Text Mode
- **Halaman:** `/tools/parallel-text`
- **Deskripsi:** Menampilkan teks asli dan terjemahan secara berdampingan (*side-by-side*) untuk studi komparatif.

### 8.4 Weekly Challenge
- **Halaman:** `/tools/weekly-challenge`
- **Deskripsi:** Tantangan terjemahan mingguan dengan kutipan sastra baru setiap minggu.

### 8.5 Translation Timelapse
- **Halaman:** `/tools/translation-timelapse`
- **Deskripsi:** Melihat evolusi terjemahan pengguna dari waktu ke waktu — bagaimana kualitas terjemahan meningkat seiring latihan.

---

## 9. Komunitas, Forum & Gamifikasi

### 9.1 Discussion Board (Forum)
- **Halaman:** `/forum`
- **Deskripsi:** Forum diskusi komunitas dengan 5 kategori:
  - **Literary Interpretation**: Diskusi makna sastra.
  - **Creative Writing & Translation**: Kepenulisan dan terjemahan.
  - **AI & Tech in Literature**: Teknologi dalam sastra.
  - **Games & Challenges**: Tantangan komunitas.
  - **General Discussion**: Obrolan santai.
- **Fitur tambahan:** Sistem pengumuman Admin yang dipasangi pin di atas layar.

### 9.2 Jejaring Pembaca (Community)
- **Halaman:** `/community`
- **Deskripsi:** Temukan, ikuti (*follow*), dan lihat profil pembaca lain beserta level dan XP mereka.

### 9.3 Global Leaderboard & Gamification Tiers
- **Halaman:** `/leaderboard`
- **Deskripsi:** Papan peringkat global berdasarkan XP dan konsistensi harian (*streak*).
- **Gamification Tiers:** Pangkat yang didapat dari akumulasi XP, ditampilkan beserta Level CEFR (misal: *Novice Reader (A1)* hingga *Master of Linguistics (C2)*).
- **Sumber XP:**
  - Mereview kosa kata (Spaced Repetition)
  - Menyelesaikan bacaan
  - Partisipasi Translation Duels (+15 XP)
  - Menyumbang Anotasi Komunitas (+5 XP)

### 9.4 Community Annotations
- **Halaman:** `/community-annotations`, `/tools/annotations`
- **Deskripsi:** Berbagi catatan dan anotasi untuk kutipan sastra sulit. Komunitas dapat memberikan suara (*upvote*) untuk anotasi terbaik.

### 9.5 Translation Duels
- **Halaman:** `/duels`
- **Deskripsi:** Kompetisi menerjemahkan kutipan sastra tersulit. Komunitas memberikan suara (*voting*) untuk terjemahan terbaik.
- **Hadiah:** +15 XP per partisipasi, bonus XP untuk pemenang.

### 9.6 Reading Clubs
- **Halaman:** `/clubs`
- **Deskripsi:** Bentuk atau gabung klub baca untuk berdiskusi per bab.
- **Cara Penggunaan:**
  1. Buka menu Reading Clubs → klik **"Buat Klub Baru"**.
  2. Masukkan nama dan deskripsi klub untuk menjadi pendiri (*owner*).
  3. Undang pengguna lain untuk bergabung.
  4. Mulai diskusi buku per bab melalui kolom obrolan (*chat*) terintegrasi.

### 9.7 Direct Messaging (Pesan Langsung)
- **Halaman:** `/messages`
- **Deskripsi:** Fitur pesan antar pengguna secara *real-time*. Pengguna dapat mengirim pesan ke pengguna yang diikuti atau yang mengikuti mereka.

### 9.8 Role System & User Management (Admin)
- **Halaman:** `/admin/users`
- **Deskripsi:** Sistem hak akses berjenjang dan panel kontrol khusus Admin.
- **Tingkatan Peran (Roles):**
  1. **User (Scholar):** Peran dasar untuk membaca dan berpartisipasi.
  2. **Curator:** Berhak memverifikasi kualitas teks dan menyetujui terjemahan.
  3. **Moderator (Archivist):** Menjaga ketertiban forum dan diskusi.
  4. **Admin (Librarian):** Kendali penuh (*Superuser*) dengan akses ke halaman User Management untuk mempromosikan/menurunkan jabatan pengguna lain secara *real-time*.

---

## 10. Analitik & Riwayat Pembelajaran

### 10.1 Progress Dashboard
- **Halaman:** `/dashboard`
- **Deskripsi:** Dasbor utama yang menampilkan ringkasan aktivitas belajar.
- **Metrik yang ditampilkan:**
  - Kata yang dipelajari hari ini.
  - Jumlah kata yang perlu di-review.
  - Login streak harian.
  - Kata Hari Ini (*Word of the Day*) — ditampilkan di sidebar.

### 10.2 Archive & Insights (History)
- **Halaman:** `/history`
- **Deskripsi:** Riwayat bacaan dan *insight* pembelajaran.
- **Fitur:**
  - Lacak total waktu membaca secara otomatis (*Time Spent*).
  - Deteksi area lemah (*Weak Area*) berdasarkan kosa kata yang belum dikuasai.
  - Grafik progres pertumbuhan kosa kata (menggunakan Recharts).

### 10.3 Ekspor Data
- **Halaman:** `/settings` (tab Privacy & Data)
- **Deskripsi:** Unduh seluruh data pembelajaran ke format CSV:
  - Daftar Vocabulary Bank
  - Riwayat Bacaan (*Reading History*)
  - Hasil Terjemahan (*Translation Submissions*)
- **Kompatibilitas:** File CSV siap dibuka di Excel atau diimpor ke aplikasi flashcard seperti Anki.

### 10.4 Pelacakan Waktu Membaca (Heartbeat)
- **API:** `/api/reading/heartbeat`
- **Deskripsi:** Sistem yang secara otomatis melacak durasi membaca aktif. Setiap 10 detik, jika dokumen terlihat di layar (*document.visibilityState === 'visible'*), sistem mengirimkan sinyal ke server.

---

## 11. Pengaturan & Personalisasi

### 11.1 Halaman Pengaturan
- **Halaman:** `/settings`
- **Tab yang tersedia:**

#### Tab Profil
- Nama lengkap, email, foto profil (*avatar*), dan deskripsi diri (*About Me*).
- Unggah foto profil baru.
- Pilihan bahasa antarmuka.
- Pengaturan notifikasi.

#### Tab Reading (Bacaan)
| Pengaturan | Opsi |
|---|---|
| Font Family | Serif (Literary), Sans-Serif, OpenDyslexic |
| Font Size | Slider 12–32px |
| Line Height | Compact (1.5) / Standard (1.75) / Relaxed (2.0) |
| Text Width | Narrow / Medium / Wide |
| Auto-save Progress | On/Off |
| Tampilkan Nomor Baris | On/Off |
| Text-to-Speech | On/Off |
| Kuis Pemahaman Otomatis | On/Off |
| Warna Highlight Teks | Color Picker |

#### Tab Learning (Pembelajaran)
| Pengaturan | Opsi |
|---|---|
| Auto-lookup on Click | On/Off |
| Tampilkan Register Bahasa | On/Off |
| Tampilkan Etimologi | On/Off |
| Bahasa Definisi Kamus | Indonesia / English |
| Kartu per Sesi Flashcard | 10 / 20 / 50 |
| Tampilkan Konteks Kalimat | On/Off |

#### Tab Privacy & Data
| Pengaturan | Opsi |
|---|---|
| Izinkan Analitik | On/Off |
| Bagikan Data Anonim | On/Off |
| Profil Publik | On/Off |
| Tampil di Leaderboard | On/Off |
| Ekspor Data (CSV) | Vocabulary / Reading History / Translations |
| Hapus Akun Permanen | Tombol destruktif |

#### Tab Display & Aksesibilitas
| Pengaturan | Opsi |
|---|---|
| Tampilkan Estimasi Waktu Baca | On/Off |
| High Contrast Mode | On/Off |
| Screen Reader Support | On/Off |
| Keyboard Shortcuts | On/Off |
| Offline Mode (PWA) | On/Off |

#### Developer Mode
- Fitur tersembunyi khusus Administrator untuk mengakses alat bantu *debugging*.

### 11.2 Tema Gelap/Terang
- **Lokasi:** Ikon matahari/bulan di sidebar (dekat logo Literary Lab).
- **Deskripsi:** Toggle antara tema gelap (*Dark Mode*) dan terang (*Light Mode*). Pengaturan disimpan otomatis.

---

## 12. Infrastruktur & Arsitektur Teknis

### 12.1 Tech Stack
| Lapisan | Teknologi |
|---|---|
| Framework | Next.js 15+ (App Router, React Server Components) |
| Library | React 19 |
| Bahasa | TypeScript 5 |
| Styling | Tailwind CSS v4, next-themes |
| Database | PostgreSQL (Supabase) |
| Autentikasi | Email/Password & OAuth (Supabase Auth) |
| AI Engine | Groq API — Llama-3.3-70B-Versatile (teks), Llama-3.2-11B-Vision (OCR) |
| Visualisasi | Recharts |
| PWA | Progressive Web App (Installable, Offline mode) |
| Hosting | Vercel (Edge Computing) |

### 12.2 Keamanan
- **Row Level Security (RLS):** Setiap data pribadi dilindungi ketat di tingkat basis data. Pengguna tidak bisa membaca/memodifikasi data milik pengguna lain.
- **Validasi Sisi Server:** Semua mutasi data dilakukan melalui API Routes di server.
- **Groq API Key:** Hanya tersimpan di server-side (`process.env`), tidak pernah terekspos ke client.

### 12.3 Performa
- **Lazy Loading:** Fitur Beginner Mode dan Syntax Highlighting hanya memproses paragraf yang terlihat di layar (*IntersectionObserver*).
- **Caching:** Dokumen teks besar diproses dan di-cache secara efisien.
- **Desain Idempoten:** Skema database dirancang agar aman dijalankan berulang kali.

### 12.4 Daftar Endpoint API

| Endpoint | Fungsi |
|---|---|
| `/api/lookup` | Word Lookup (13 mode analisis kata) |
| `/api/parse-sentence` | Analisis kalimat (dependency tree) |
| `/api/detect-idioms` | Deteksi idiom & metafora |
| `/api/simplify-text` | Graded Reader (B1 Simplifier) |
| `/api/highlight-syntax` | Syntax Highlighting (Training Wheels) |
| `/api/generate-quiz` | Comprehension Checkpoint Quiz |
| `/api/lingowise` | LingoWise AI (8 mode) |
| `/api/tools/dynamic` | Dynamic Tool Router |
| `/api/tools/alter-ego` | Alter Ego Chat |
| `/api/tools/story-quiz` | Story Mode Quiz |
| `/api/tools/reading-companion` | Reading Companion Chat |
| `/api/tools/tone-analyzer` | Tone & Grammar Analyzer |
| `/api/tools/paraphrase/generate` | Paraphrase Challenge (soal) |
| `/api/tools/paraphrase/evaluate` | Paraphrase Challenge (evaluasi) |
| `/api/translation` | Translation Workshop |
| `/api/analyze-tone` | Tone Detection |
| `/api/analyze-difficulty` | Difficulty Predictor |
| `/api/comparator` | Side-by-Side Comparator |
| `/api/lexicon-search` | Lexicon Search |
| `/api/untranslatables` | Untranslatables Explorer |
| `/api/vocabulary` | Vocabulary Bank CRUD |
| `/api/review` | Spaced Repetition Engine |
| `/api/ocr` | OCR Lens (Vision AI) |
| `/api/generate-text` | AI Text Generator |
| `/api/writing-feedback` | Writing Assistant Feedback |
| `/api/reading/heartbeat` | Reading Time Tracker |
| `/api/liter-ai` | Liter AI (Help Chatbot) |
| `/api/gutenberg` | Gutenberg Book Fetcher |
| `/api/auth` | Authentication Routes |

### 12.5 Pusat Bantuan
- **Halaman:** `/help`
- **Deskripsi:** Halaman FAQ lengkap dengan 25+ pertanyaan umum yang dilengkapi tautan langsung ke fitur terkait.
- **Liter AI Chatbot:** Tombol melayang di pojok kanan bawah halaman Help untuk bertanya secara interaktif tentang cara penggunaan platform.

---

## 13. English Lab (Pembelajaran Bahasa Inggris Umum)

Kumpulan fitur yang khusus didesain bagi mereka yang ingin berlatih bahasa Inggris dalam konteks kehidupan nyata, percakapan sehari-hari, dan kemampuan dasar di luar sastra klasik. Terletak di menu sidebar **"English Lab"**.

### 13.1 Everyday Grammar Clinic
- **Halaman:** `/english-lab/grammar-clinic`
- **API:** `/api/grammar-clinic`
- **Deskripsi:** AI yang akan membedah kesalahan tata bahasa pada tulisan pengguna (seperti draft email, chat, atau esai pendek).
- **Fitur:**
  - Input teks bebas atau Input Suara (Voice Dictation).
  - Skor Grammar dari 0-100 dengan visualisasi cincin (progress ring).
  - Penjelasan tiap kesalahan dalam Bahasa Indonesia yang ramah pemula.
  - Tiga fokus utama: Grammar, Ejaan, dan Pilihan Kata.

### 13.2 Weekly Writing Streak Challenges
- **Halaman:** `/english-lab/writing-challenge`
- **API:** `/api/writing-challenge`
- **Deskripsi:** Tantangan menulis mingguan untuk membentuk kebiasaan berlatih *output* dalam bahasa Inggris. Pengguna diminta menulis respons ~100 kata terhadap *prompt* yang berganti setiap minggu.
- **Fitur:**
  - Skor AI 0-100 dengan metrik khusus untuk Pilihan Kosakata dan Grammar.
  - **Streak Tracker** yang memonitor konsistensi dan menghitung XP mingguan.
  - Opsi *Toggle* integrasi (Reading prompts) dari halaman Pengaturan (Settings).

### 13.3 Interactive Flashcard & SRS (Spaced Repetition System)
- **Halaman:** `/english-lab/flashcard`
- **Deskripsi:** Alat hafalan kosa kata interaktif yang menarik kata-kata simpanan pengguna dari *Vocabulary Bank*.
- **Fitur:**
  - **Tebak Arti**: Menampilkan kata bahasa Inggris, pengguna membalik kartu untuk melihat maknanya.
  - **Tebak Kata**: Menampilkan definisi, pengguna mengetikkan kata yang dimaksud.
  - **Dikte (Listening)**: Mengujikan pendengaran dan penulisan (*spelling*) menggunakan TTS dan Input Suara.
  - **Algoritma Leitner Box (SM-2):** Mengatur interval kemunculan kartu menjadi 1, 2, 4, 7, atau 14 hari berdasarkan ketepatan jawaban.
  - **Personalized Error-Based Priority**: Algoritma SM-2 secara otomatis memprioritaskan kata yang baru saja salah digunakan dalam tugas grammar atau writing dengan mengurangi interval interval ulasan sebesar 30% (`error_modifier = 0.7`) hingga pengguna menjawab benar berturut-turut.

### 13.3 Everyday Dialogue Simulator
- **Halaman:** `/english-lab/dialogue-simulator`
- **API:** `/api/dialogue-simulator`, `/api/dialogue-simulator/feedback`
- **Deskripsi:** Modul roleplay (bermain peran) interaktif bersama agen AI untuk melatih percakapan bahasa Inggris lisan (Speaking).
- **Fitur:**
  - 8 Skenario Dunia Nyata: Memesan Kopi, Wawancara Kerja, Check-in Bandara, dll.
  - Obrolan waktu-nyata bergaya perpesanan (*WhatsApp bubble style*).
  - Dukungan penuh Text-to-Speech (TTS) dan Speech-to-Text (STT/Mic).
  - Skor Kelancaran (Fluency), Koreksi Grammar, Saran Kosa Kata (Vocabulary Suggestions), dan Tips Budaya (Cultural Tips) di akhir sesi percakapan.
  - Histori otomatis tersimpan ke tabel `dialogue_sessions`.

### 13.4 Listening Comprehension Test
- **Halaman:** `/english-lab/listening-test`
- **API:** `/api/listening-test/generate`
- **Deskripsi:** Menguji kemampuan pemahaman audio bahasa Inggris sesuai standar CEFR.
- **Fitur:**
  - **Mode Kuis**: Mendengarkan audio lalu menjawab soal pilihan ganda.
  - **Mode Dikte**: Mendengarkan kalimat lalu mengetik ulang persis seperti yang diucapkan.
  - Pemilihan tingkat kesulitan (A1, A2, B1, B2).
  - **Audio Player Interaktif**: Pengaturan kecepatan pemutaran (0.75x, 1x, 1.25x).
  - **Unggah Audio Manual**: Mengizinkan pengguna mengunggah file `mp3/wav` sendiri untuk bahan latihan dikte (tanpa batasan sistem).
  - Terhubung dengan pengaturan mesin TTS pengguna (Groq AI atau Browser Native).

### 13.5 Modern Slang & Idiom Decoder
- **Halaman:** `/english-lab/slang-decoder`
- **API:** `/api/slang-decoder`
- **Deskripsi:** Membantu pengguna menerjemahkan teks gaul (slang), singkatan internet, atau istilah Gen Z ke dalam bahasa Indonesia sehari-hari.
- **Fitur:**
  - Terjemahan frasa spesifik beserta asal-usul konteksnya (Misal: "No Cap", "Rizz", "Lowkey").
  - Skor Tingkat Formalitas (1-5, Sangat Kasual hingga Formal).
  - Padanan kata bahasa Inggris formal (*Formal Equivalent*).
  - Simpan frasa unik langsung ke perpustakaan Idiom pribadi.
  - Etalase "Trending Slang".

---

## 14. Reading Journey & Placement Test (Learning Path)

### 14.1 Placement Test
- **Halaman:** `/english-lab/placement-test`
- **API:** `/api/placement-test`
- **Deskripsi:** Tes adaptif singkat untuk mengukur kemampuan bahasa Inggris dan mendapatkan rekomendasi level CEFR.
- **Fitur:**
  - Mengujikan 4 keterampilan: Reading, Grammar, Vocabulary, Listening.
  - Soal digenerate secara dinamis (adaptif) oleh AI menyesuaikan dengan akurasi jawaban sebelumnya.
  - Menyediakan hasil persentase skor dan rekomendasi CEFR (A1-C2).
  - Opsi untuk melompati tes dan memilih level secara manual.

### 14.2 Reading Journey
- **API:** `/api/journey`
- **Deskripsi:** Jalur pembelajaran (*guided path*) berbasis gamifikasi yang mengintegrasikan seluruh fitur di dalam ekosistem Literary Lab.
- **Fitur:**
  - Terdiri dari 6 Level Perjalanan sesuai standar CEFR (A1 hingga C2).
  - Setiap level memiliki 8 Quest unik yang memanfaatkan *tools* berbeda (dari Flashcard dasar hingga Analisis Dialek kompleks).
  - Sistem *auto-tracking* yang otomatis menyelesaikan quest saat pengguna beraktivitas di dalam platform tanpa perlu klik tombol "Selesai" secara manual.
  - Widget interaktif di *Dashboard* yang menampilkan bilah progres (*progress bar*) dan daftar tugas (Quests).
  - Penghargaan (*Badges*) dan bonus XP setiap kali menyelesaikan satu level perjalanan.
  - Sifatnya non-blocking: Pengguna bebas mengubah level perjalanan kapan saja.

> **Literary Language Lab** — *Dibangun untuk Komunitas Sastra dan Pelajar Bahasa Inggris.*  
> [Coba Aplikasi Sekarang →](https://www.literarylanguagelab.my.id)
