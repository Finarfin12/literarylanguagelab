<div align="center">
  <img src="public/icon-512x512.png" alt="Literary Language Lab Logo" width="120" height="120" />

  # 📚 Literary Language Lab

  **Platform E-Learning Bahasa Inggris Komprehensif Melalui Mahakarya Sastra Klasik**
  
  [![Next.js](https://img.shields.io/badge/Next.js-15.0+-black?logo=next.js&logoColor=white)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-Database_&_Auth-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
  [![Groq AI](https://img.shields.io/badge/Groq_AI-Llama_3-F55036?logo=groq&logoColor=white)](https://groq.com/)
  
  [**Kunjungi Website (Live Demo)**](https://www.literarylanguagelab.my.id) • [**Dokumentasi API**](#5-arsitektur-api)
</div>

---

## 📖 Tentang Proyek Ini

**Literary Language Lab** adalah aplikasi *e-learning full-stack* inovatif yang dirancang khusus untuk membantu penutur bahasa Indonesia mempelajari, memahami, dan menguasai bahasa Inggris dengan membedah literatur sastra klasik. 

Alih-alih menggunakan kurikulum buku teks biasa, platform ini menggunakan pendekatan **Immersive Reading** & **AI-Powered Analysis**. Pengguna dapat membaca 70.000+ buku gratis, membedah setiap kata menggunakan kecerdasan buatan, mengumpulkan kosa kata dalam *Vocabulary Bank*, dan menghafalnya secara permanen dengan sistem *Spaced Repetition (SM-2)*.

---

## ✨ Fitur Utama

### 1. 🏛️ Public Domain Books & Text Library
- Terintegrasi langsung dengan **Project Gutenberg** via **OpenLibrary** (Provider Utama) dan **Gutendex** (Sistem Cadangan/Fallback).
- Menyediakan akses instan ke **70.000+ buku sastra klasik** gratis.
- Fitur membaca *offline* untuk teks yang sudah pernah diunduh.
- Mendukung pemindaian buku fisik dengan **OCR Lens** (mengubah foto halaman buku fisik menjadi teks digital).

### 2. 🧠 LingoWise AI (8 Mode Bedah Sastra)
Asisten AI cerdas yang dapat membedah teks bahasa Inggris apa pun menggunakan 8 lensa analisis:
- **Dialect Diver**: Menganalisis dialek, aksen, atau slang kuno.
- **Tone & Grammar**: Membedah struktur tata bahasa & level CEFR.
- **Vibe Translator**: Menerjemahkan nuansa emosional tanpa menghilangkan makna aslinya.
- **Mood Transformer**: Menggubah suasana hati teks.
- **Diction Lab**: Membedah alasan di balik pemilihan kosa kata oleh penulis.
- **Era Translator**: Menerjemahkan bahasa kuno (seperti Shakespeare) menjadi bahasa Gen-Z atau sebaliknya.
- **Sentence Architect**: Analisis struktur sintaksis kalimat yang rumit.
- **Rhetorical Spotter**: Mendeteksi gaya bahasa (majas, metafora, ironi).

### 3. 🛠️ 25+ Interactive Tools & Games
- **Alter Ego Chat**: Berbincang langsung dengan AI yang memerankan penulis legendaris (Shakespeare, Jane Austen, Edgar Allan Poe).
- **Story Quiz**: Game kuis di mana AI membuat cerita pendek fiksi dari daftar kosa kata yang sedang Anda pelajari.
- **Translation Workshop**: Layar *split-screen* untuk menerjemahkan teks (Inggris → Indonesia) dengan *feedback* otomatis dari AI (Equivalence, Register, Back-Translation).
- **A-Z Browser & Lexicon Search**: Kamus lengkap dengan sinonim, rima kata, dan konteks budaya.
- **Paraphrase Challenge**: Uji kemampuan memparafrase kalimat sastra tingkat tinggi.

### 4. 🗂️ Vocabulary Bank & Spaced Repetition (SM-2)
- Simpan kosa kata apa pun yang Anda temui saat membaca buku.
- **Spaced Repetition Algorithm (SM-2)**: Sistem pengulangan flashcard cerdas. Algoritma akan mengingatkan Anda untuk me-*review* suatu kata tepat sebelum Anda hampir melupakannya.
- Statistik grafik pertumbuhan kosa kata Anda dalam 7 hari terakhir.

### 5. 🌍 Komunitas, Forum & Gamifikasi
- **Reading Clubs**: Bentuk atau gabung klub baca untuk berdiskusi per bab.
- **Translation Duels**: Kompetisi menerjemahkan kutipan sastra tersulit, di mana komunitas akan memberikan *voting* untuk terjemahan terbaik.
- **Global Leaderboard & Streak**: Dapatkan *XP* dari setiap aktivitas belajar Anda dan tingkatkan *Login Streak* harian Anda untuk bersaing di papan peringkat global.
- **Community Annotations**: Berbagi catatan/anotasi kutipan sulit dan kumpulkan poin dari *upvotes*.

---

## 🛠️ Tech Stack & Arsitektur

Platform ini dibangun di atas infrastruktur modern dengan prinsip *Server-Side Rendering (SSR)* dan *Edge Computing*.

### Frontend & UI
- **Framework**: Next.js 16 (App Router, React Server Components)
- **Library**: React 19
- **Bahasa**: TypeScript 5
- **Styling**: Tailwind CSS v4, Next-themes (Dark/Light mode)
- **Komponen**: Lucide-react (Icons), SweetAlert2 (Popups), React-Markdown
- **Visualisasi**: Recharts (Grafik), React-force-graph-2d (Semantic Map)
- **PWA**: Dukungan penuh Progressive Web App (Instalable, Offline mode)

### Backend & Database
- **Database & Auth**: Supabase (PostgreSQL)
  - Autentikasi: Email/Password & Google OAuth.
  - Keamanan: Row Level Security (RLS) diimplementasikan secara ketat.
- **AI Engine**: Groq SDK (`llama-3.3-70b-versatile` untuk teks, `llama-3.2-11b-vision-preview` untuk OCR)
- **External APIs**: OpenLibrary, Gutendex, DictionaryAPI, Datamuse, LibreTranslate.
- **Deployment**: Vercel

---

## 🚀 Instalasi & Menjalankan Lokal

Pastikan Anda memiliki **Node.js (v18+)** terinstal di sistem Anda.

1. **Clone repository ini**
   ```bash
   git clone https://github.com/username/literary-language-lab.git
   cd literary-language-lab
   ```

2. **Install dependensi**
   ```bash
   npm install
   ```

3. **Atur Environment Variables**
   Buat file `.env.local` di *root directory* dan isi dengan kredensial berikut:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   GROQ_API_KEY=your_groq_api_key
   ```

4. **Siapkan Database Supabase**
   - Buat proyek baru di [Supabase](https://supabase.com).
   - Eksekusi skrip SQL dari file `schema_canonical.sql` di SQL Editor Supabase untuk membangun tabel, relasi, fungsi *Streak*, dan kebijakan keamanan (RLS).
   - Eksekusi `schema_config_system.sql` untuk modul konfigurasi.

5. **Jalankan Server Development**
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:3000`.

---

## 🗃️ Struktur Direktori

Struktur proyek ini mengikuti pola konvensi **Next.js App Router**:

```text
literarylanguagelab/
├── app/
│   ├── (auth)/                 # Grup halaman autentikasi (Login/Register)
│   ├── (dashboard)/            # Grup halaman utama (Butuh Login)
│   │   ├── dashboard/          # Dasbor Statistik & Streak
│   │   ├── gutenberg/          # Penjelajah Buku Publik (Project Gutenberg)
│   │   ├── library/            # Perpustakaan Teks & OCR
│   │   ├── lingowise/          # AI Lab 8 Lensa
│   │   ├── tools/              # 25+ Alat Interaktif
│   │   ├── vocabulary/         # Bank Kosa Kata & Spaced Repetition
│   │   ├── forum/              # Forum Komunitas
│   │   ├── duels/              # Duel Terjemahan
│   │   ├── clubs/              # Klub Baca
│   │   └── ...                 # Leaderboard, History, Settings, dll.
│   ├── api/                    # 19 Endpoint API Backend (Groq, Gutendex, dll)
│   └── globals.css             # Konfigurasi Tailwind & Variabel Tema
├── components/                 # Komponen React (Sidebar, Reader, Charts)
├── lib/                        # Konfigurasi Tools & Algoritma (SM-2)
├── public/                     # Aset statis & Service Worker (PWA)
└── utils/supabase/             # Utilitas Supabase Client & Server
```

---

## 🔒 Keamanan & Performa

- **Row Level Security (RLS)**: Setiap data pribadi (*vocabulary, notes, activity logs*) dilindungi di level *database*. Pengguna A tidak mungkin bisa membaca/memodifikasi data Pengguna B.
- **Server Actions & SSR**: Validasi dan mutasi data dilakukan di server untuk mencegah tereksposnya logika sensitif.
- **Optimized Caching**: 
  - Buku dari Gutenberg (*raw text files*) yang besarnya mencapai 1-2MB diproses di Edge Vercel dan di-*cache* selama 24 jam untuk mencegah *lag* pada browser pengguna.
  - Pencarian katalog menggunakan dual-provider (OpenLibrary di-fetch di sisi klien untuk kecepatan maksimal).
- **Idempotent Database Design**: Skema SQL dikembangkan agar aman untuk dijalankan berulang kali (menggunakan `IF NOT EXISTS` dan `DROP TRIGGER/POLICY`).

---

## 💡 Motivasi

Banyak pelajar bahasa Inggris di Indonesia merasa stagnan di tingkat menengah (*intermediate plateau*). Metode menghafal buku grammar atau kosa kata acak sering kali membosankan dan kurang memberikan pemahaman kultural/kontekstual.

Sastra klasik menawarkan **kosa kata tingkat lanjut**, **gaya bahasa (majas)**, dan **kedalaman emosi** yang luar biasa. Melalui bantuan *Artificial Intelligence* (LingoWise), **Literary Language Lab** menghilangkan dinding pembatas berupa "teks kuno yang sulit dimengerti" dengan memberikan penjelasan, parafrase, dan konteks yang ramah di otak kapan pun pengguna membutuhkannya.

---

<div align="center">
  <b>Dibangun dengan ❤️ untuk Komunitas Sastra dan Pelajar Bahasa Inggris.</b>
  <br />
  <br />
  <a href="https://www.literarylanguagelab.my.id">Coba Aplikasi Sekarang</a>
</div>
