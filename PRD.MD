# PRD — Literary Language Lab

**Versi:** 1.0  
**Dibuat:** 2026-06-08  
**Author:** Ii Hidayat  
**Status:** Draft — siap eksekusi

---

## 1. Overview

### Problem Statement
Mahasiswa sastra Inggris dan learner bahasa Inggris tidak punya tools yang menggabungkan pembelajaran bahasa dengan konteks sastra secara mendalam. Kamus biasa memberikan definisi tapi tidak menjelaskan nuansa, register, dan mengapa penulis memilih kata tertentu. Platform analisis sastra terlalu akademik dan tidak fokus pada peningkatan kemampuan bahasa.

### Vision
Webapp yang menggunakan teks sastra sebagai medium belajar bahasa — bukan belajar *tentang* bahasa, tapi belajar bahasa *melalui* teks yang punya jiwa.

### Target User
- **Primary:** Mahasiswa sastra Inggris bidang penerjemahan (semester 1-8)
- **Secondary:** Learner bahasa Inggris level intermediate yang ingin belajar melalui konteks sastra

### Success Metrics
- User bisa menambah minimal 10 kata/sesi ke vocabulary bank
- Retention rate: user kembali minimal 3x/minggu
- Translation feedback dianggap helpful oleh >70% user

---

## 2. Tech Stack

```
Frontend  : Next.js 16 (App Router) + Tailwind CSS
Backend   : Supabase (PostgreSQL + Auth + Storage)
AI        : Groq API (model: llama-3.1-8b-instant atau gemma2-9b-it llama 3 70b)
Deploy    : Vercel (frontend) + Supabase cloud (backend)
Language  : TypeScript
```

---

## 3. Arsitektur Sistem

```
┌─────────────────────┐   ┌─────────────────────┐
│   Next.js Frontend    │   │    Supabase Cloud     │
│   (Vercel)            │   │                     │
│                       │   │  ┌───────────────┐  │
│  ┌───────────┐      │   │  │  PostgreSQL  │  │
│  │ React UI  │      │   │  └───────────────┘  │
│  └───────────┘      │   │  ┌───────────────┐  │
│  ┌───────────┐      │   │  │  Auth         │  │
│  │API Routes │──────│──│  └───────────────┘  │
│  └───────────┘      │   │  ┌───────────────┐  │
│       │             │   │  │  Storage      │  │
│       │             │   │  └───────────────┘  │
└─────────────────────┘   └─────────────────────┘
         │
         │ (server-side only)
         ▼
┌───────────────┐
│   Groq API      │
│   (AI Engine)   │
└───────────────┘
```

**Penting:** Groq API hanya dipanggil dari Next.js API Routes (server-side), tidak pernah dari client. API key tidak pernah exposed ke browser.

---

## 4. Database Schema

```sql
-- Users (dihandle Supabase Auth, tabel tambahan untuk profile)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  level TEXT DEFAULT 'intermediate', -- beginner/intermediate/advanced
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teks sastra yang tersedia di app
CREATE TABLE texts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  era TEXT, -- Victorian, Modern, Contemporary, etc.
  genre TEXT, -- Novel, Poetry, Drama, Essay
  difficulty TEXT DEFAULT 'intermediate',
  content TEXT NOT NULL,
  word_count INTEGER,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vocabulary bank per user
CREATE TABLE vocabulary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  definition TEXT,
  context_sentence TEXT, -- kalimat asli dari teks
  context_source TEXT,   -- judul teks sumbernya
  register TEXT,         -- formal/literary/colloquial/archaic
  notes TEXT,            -- catatan personal user
  mastery_level INTEGER DEFAULT 0, -- 0-5 untuk spaced repetition
  next_review_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, word)
);

-- Sesi baca per user
CREATE TABLE reading_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  text_id UUID REFERENCES texts(id),
  last_position INTEGER DEFAULT 0, -- untuk resume reading
  words_looked_up INTEGER DEFAULT 0,
  words_saved INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- Translation submissions
CREATE TABLE translations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  text_id UUID REFERENCES texts(id),
  original_passage TEXT NOT NULL,
  user_translation TEXT NOT NULL,
  ai_feedback TEXT,           -- feedback dari Groq
  feedback_score INTEGER,     -- 1-5, dinilai AI
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. Fitur — MVP (Phase 1)

### 5.1 Auth
- Register dengan email + password
- Login / logout
- Password reset via email
- Protected routes — semua fitur utama butuh login

### 5.2 Text Reader
**Flow:**
1. User pilih teks dari library
2. Teks ditampilkan dengan typography yang nyaman dibaca
3. User highlight/klik kata atau frasi
4. Sidebar muncul dengan:
   - Definisi kata
   - Register bahasa (formal/literary/colloquial/archaic)
   - Contoh penggunaan lain
   - Penjelasan mengapa penulis memilih kata ini (konteks)
   - Tombol "Simpan ke Vocabulary Bank"
5. Progress baca tersimpan otomatis

**AI Prompt untuk Word Lookup:**
```
Analyze the word/phrase "[WORD]" as used in this literary context:
"[CONTEXT_SENTENCE]"

From: [TITLE] by [AUTHOR]

Provide:
1. Definition in this specific context
2. Register (formal/literary/colloquial/archaic)
3. Why the author likely chose this word over simpler alternatives
4. One example of similar usage

Keep response concise and helpful for an intermediate English learner.
Respond in Indonesian.
```

### 5.3 Vocabulary Bank
- Tampilkan semua kata yang sudah disimpan
- Filter by register, mastery level, atau sumber teks
- Edit notes personal per kata
- Hapus kata

### 5.4 Spaced Repetition Review
**Algoritma:** SM-2 (sederhana, proven)
- Setiap sesi review, tampilkan kata
- User jawab apakah ia ingat atau tidak (+ tingkat keyakinan)
- Jadwal review berikutnya dihitung otomatis
- Target: 10-20 kata per sesi

**Flow:**
1. Tampilkan kata
2. User coba ingat definisi + konteks
3. Reveal: tampilkan kalimat asli + definisi
4. User nilai diri: Lupa / Hampir / Ingat / Hafal
5. Next review dijadwal otomatis

---

## 6. Fitur — Phase 2

### 6.1 Translation Workshop
**Flow:**
1. Pilih paragraf dari teks yang sedang dibaca
2. Tulis terjemahan Indonesia
3. Submit — Groq analisis dan beri feedback
4. Feedback mencakup:
   - Akurasi makna
   - Nuansa yang hilang atau berhasil dipertahankan
   - Register bahasa dalam terjemahan
   - Saran alternatif untuk frasi tertentu
5. Simpan submission untuk review di kemudian hari

**AI Prompt untuk Translation Feedback:**
```
You are a literary translation expert helping an Indonesian student of English Literature.

Original English text (from [TITLE] by [AUTHOR]):
"[ORIGINAL]"

Student's Indonesian translation:
"[TRANSLATION]"

Provide feedback on:
1. Accuracy of meaning
2. Nuances preserved or lost
3. Register consistency (the original is [REGISTER])
4. Specific phrases that could be improved, with suggested alternatives
5. Overall score (1-5)

Be encouraging but honest. Respond in Indonesian.
```

### 6.2 Progress Dashboard
- Total kata di vocabulary bank
- Kata yang sudah di-review minggu ini
- Reading streak
- Teks yang sudah selesai dibaca
- Grafik pertumbuhan vocabulary per bulan

### 6.3 Text Library Expansion
- Upload teks sendiri (plain text atau paste)
- Kategorisasi by era, genre, difficulty
- Search teks

---

## 7. Fitur — Phase 3 (Multi-user)

- User levels yang bisa diset manual
- Shared vocabulary lists antar user
- Instructor mode (dosen bisa assign teks ke mahasiswa)
- Export vocabulary bank ke CSV/Anki deck

---

## 8. Sistem Keamanan

### 8.1 API Key Protection
```
- GROQ_API_KEY → hanya di server-side (Next.js API Routes)
- Tidak pernah di client-side code
- Tidak pernah di .env.local yang di-commit ke git
- Gunakan Vercel Environment Variables untuk production
```

### 8.2 Authentication & Authorization
```
- Supabase Auth menangani session management
- JWT tokens diverifikasi di setiap API call
- Row Level Security (RLS) di Supabase:
  - User hanya bisa read/write data miliknya sendiri
  - Teks publik bisa dibaca semua user
```

**RLS Policies yang perlu dibuat:**
```sql
-- Vocabulary: user hanya akses miliknya
ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own vocabulary"
  ON vocabulary FOR ALL
  USING (auth.uid() = user_id);

-- Profiles: user hanya edit profilnya sendiri
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Reading sessions: private per user
ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own sessions"
  ON reading_sessions FOR ALL
  USING (auth.uid() = user_id);

-- Translations: private per user
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own translations"
  ON translations FOR ALL
  USING (auth.uid() = user_id);
```

### 8.3 Rate Limiting
```
- AI endpoint (/api/lookup, /api/translate-feedback):
  max 20 request/menit per user
- Implementasi: Upstash Redis (free tier) atau simple
  in-memory counter di Vercel Edge
- Response: 429 Too Many Requests jika limit terlampaui
```

### 8.4 Input Validation
```
- Semua input divalidasi dengan Zod sebelum diproses
- Max length untuk text yang dikirim ke Groq:
  - Word lookup: max 500 karakter konteks
  - Translation feedback: max 2000 karakter
- Sanitize HTML input untuk mencegah XSS
```

### 8.5 Environment Variables
```bash
# .env.local (JANGAN commit ke git)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key  # aman untuk public
SUPABASE_SERVICE_ROLE_KEY=your_service_key   # server-side only
GROQ_API_KEY=your_groq_key                   # server-side only
```

### 8.6 .gitignore
```
.env.local
.env*.local
```

---

## 9. Struktur Folder Project

```
literary-language-lab/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx          # protected layout
│   │   ├── page.tsx             # dashboard home
│   │   ├── library/page.tsx     # text library
│   │   ├── read/[textId]/page.tsx  # text reader
│   │   ├── vocabulary/page.tsx  # vocabulary bank
│   │   ├── review/page.tsx      # spaced repetition
│   │   └── translate/page.tsx   # translation workshop
│   ├── api/
│   │   ├── lookup/route.ts      # word lookup via Groq
│   │   └── translate-feedback/route.ts
│   └── layout.tsx
├── components/
│   ├── reader/
│   │   ├── TextDisplay.tsx
│   │   └── WordLookupSidebar.tsx
│   ├── vocabulary/
│   │   ├── VocabularyCard.tsx
│   │   └── ReviewCard.tsx
│   └── ui/                  # shared UI components
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # browser client
│   │   └── server.ts            # server client
│   ├── groq.ts              # Groq client + prompts
│   └── spaced-repetition.ts # SM-2 algorithm
├── types/
│   └── database.ts          # Supabase type definitions
├── .env.local
├── .gitignore
└── package.json
```

---

## 10. Urutan Eksekusi MVP

```
Step 1: Setup project
  - create-next-app dengan TypeScript + Tailwind
  - Install: @supabase/supabase-js, groq-sdk, zod
  - Setup Supabase project (free tier)
  - Setup environment variables

Step 2: Database
  - Buat semua tabel di Supabase SQL editor
  - Enable RLS dan buat semua policies
  - Generate TypeScript types dari schema

Step 3: Auth
  - Setup Supabase Auth
  - Login, register, logout pages
  - Protected route middleware

Step 4: Text Reader
  - Seed beberapa teks ke database
  - Halaman library + halaman baca
  - Highlight dan klik kata
  - Integrasi Groq untuk word lookup

Step 5: Vocabulary Bank
  - Simpan kata dari reader
  - Halaman vocabulary dengan filter

Step 6: Spaced Repetition
  - Implementasi SM-2
  - Halaman review

Step 7: Deploy
  - Push ke GitHub
  - Connect ke Vercel
  - Set environment variables di Vercel
  - Test production
```

---

## 11. Estimasi Waktu (solo developer, part-time)

| Step | Estimasi |
|------|----------|
| Setup + Database | 2-3 jam |
| Auth | 2-3 jam |
| Text Reader + AI | 4-6 jam |
| Vocabulary Bank | 2-3 jam |
| Spaced Repetition | 3-4 jam |
| Polish + Deploy | 2-3 jam |
| **Total MVP** | **~15-20 jam** |

---

## 12. Referensi & Dependencies

```json
{
  "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "typescript": "5.x",
    "tailwindcss": "3.x",
    "@supabase/supabase-js": "2.x",
    "@supabase/ssr": "latest",
    "groq-sdk": "latest",
    "zod": "3.x"
  }
}
```

---

*Dibuat: 2026-06-08. Project: Literary Language Lab.*  
*Stack: Next.js + Supabase + Groq + Vercel.*
