# Literary Language Lab — Dokumentasi Lengkap

> E-learning platform untuk belajar bahasa Inggris melalui sastra klasik.
> **Tech Stack:** Next.js 16 (App Router) · React 19 · TypeScript 5 · Tailwind CSS v4 · Supabase · Groq AI
> **Deployed at:** [literarylanguagelab.my.id](https://www.literarylanguagelab.my.id)

---

## Daftar Isi

1. [Ikhtisar Proyek](#1-ikhtisar-proyek)
2. [Arsitektur Aplikasi](#2-arsitektur-aplikasi)
3. [Halaman & Rute (40 Halaman)](#3-halaman--rute-40-halaman)
4. [Komponen (14 Komponen)](#4-komponen-14-komponen)
5. [API Route (19 Endpoint)](#5-api-route-19-endpoint)
6. [Database Schema (Supabase)](#6-database-schema-supabase)
7. [Sistem Autentikasi](#7-sistem-autentikasi)
8. [Spaced Repetition (SM-2)](#8-spaced-repetition-sm-2)
9. [Integrasi Pihak Ketiga](#9-integrasi-pihak-ketiga)
10. [Konfigurasi & Environment](#10-konfigurasi--environment)
11. [PWA (Progressive Web App)](#11-pwa-progressive-web-app)
12. [Styling & Tema](#12-styling--tema)
13. [Troubleshooting & Fix History](#13-troubleshooting--fix-history)
14. [Dependensi Tidak Terpakai](#14-dependensi-tidak-terpakai)

---

## 1. Ikhtisar Proyek

**Literary Language Lab** adalah aplikasi e-learning fullstack yang membantu penutur bahasa Indonesia mempelajari bahasa Inggris melalui sastra klasik. Fitur utama:

- **Text Library**: Koleksi teks sastra untuk dibaca
- **Public Domain Books**: 70.000+ buku gratis dari Project Gutenberg (via OpenLibrary + Gutendex)
- **Vocabulary Bank**: Manajemen kosa kata pribadi
- **Spaced Repetition**: Review kosa kata dengan algoritma SM-2
- **LingoWise AI**: Analisis teks sastra dengan AI (8 mode)
- **25+ Tools**: Penerjemahan, analisis stilistik, parafrase, kuis cerita, chat penulis
- **Translation Workshop**: Workspace penerjemahan split-screen
- **Forum & Community**: Diskusi, klub baca, leaderboard, translation duels

### Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Framework** | Next.js 16.2.7 (App Router, React Server Components) |
| **Runtime** | Node.js 26.1.0 |
| **Bahasa** | TypeScript 5 |
| **Frontend** | React 19.2.4, Tailwind CSS v4, `@tailwindcss/typography` |
| **Auth & DB** | Supabase (`@supabase/ssr` v0.10.3, `@supabase/supabase-js` v2.108) |
| **AI** | Groq SDK v1.2.1 (model: `llama-3.3-70b-versatile`, vision: `llama-3.2-11b-vision-preview`) |
| **Charts** | Recharts v3.8.1 |
| **Graph Viz** | React-force-graph-2d v1.29.1 |
| **Markdown** | React-markdown v10.1 |
| **Theme** | Next-themes v0.4.6 |
| **Icons** | Lucide-react v1.17 |
| **Alerts** | SweetAlert2 v11.26 |
| **PWA** | Service Worker + Web Manifest |
| **Deploy** | Vercel (Hobby tier) |

---

## 2. Arsitektur Aplikasi

### Struktur Direktori

```
literarylanguagelab/
├── app/
│   ├── layout.tsx              # Root layout (ThemeProvider, PWA)
│   ├── page.tsx                # Landing page (server component)
│   ├── globals.css             # Global styles + Tailwind config
│   ├── manifest.ts             # PWA manifest generator
│   ├── (auth)/                 # Route group: public auth
│   │   ├── login/page.tsx      # /login
│   │   ├── register/page.tsx   # /register
│   │   └── actions.ts          # Server actions: login, signup
│   ├── auth/callback/route.ts  # Google OAuth callback
│   ├── (dashboard)/            # Route group: authenticated
│   │   ├── layout.tsx          # Auth gate + Sidebar
│   │   ├── dashboard/page.tsx  # /dashboard
│   │   ├── library/            # Text Library
│   │   ├── gutenberg/          # Public Domain Books
│   │   ├── vocabulary/         # Vocabulary Bank + Review
│   │   ├── review/             # Spaced Repetition
│   │   ├── lingowise/          # LingoWise AI
│   │   ├── tools/              # 25+ Tools
│   │   ├── translation-*/      # Translation Workshop & Memory
│   │   ├── forum/              # Discussion Board
│   │   ├── clubs/              # Reading Clubs
│   │   ├── duels/              # Translation Duels
│   │   ├── community-*/        # Shared Annotations
│   │   ├── glossary/           # Glossary Builder
│   │   ├── idioms/             # Idiom Library
│   │   ├── leaderboard/        # Global Leaderboard
│   │   ├── history/            # Activity History
│   │   ├── profile/            # User Profile
│   │   ├── settings/           # Account Settings
│   │   └── read/[textId]/      # Text Reader
│   ├── p/[username]/           # Public Portfolio
│   └── api/                    # 19 API Routes
│       ├── gutenberg/          # 3 routes: search, [id], text
│       ├── tools/              # 10 routes: alter-ego, dynamic, etc.
│       └── ...                 # 6 other routes
├── components/
│   ├── Sidebar.tsx             # Main navigation
│   ├── ThemeProvider.tsx        # next-themes wrapper
│   ├── PwaRegister.tsx         # PWA service worker
│   ├── GraphViewer.tsx         # Force-directed graph
│   ├── ui/                     # 3 shared UI components
│   ├── dashboard/              # VocabChart
│   ├── lingowise/              # LingoWiseClient
│   ├── reader/                 # 3 reader components
│   └── vocabulary/             # 2 vocab components
├── lib/
│   ├── tools-config.ts         # 30+ tool definitions
│   └── spaced-repetition.ts    # SM-2 algorithm
├── utils/supabase/             # 3 Supabase clients
├── public/sw.js                # Service Worker
├── middleware.ts               # Auth session refresh
└── supabase_setup.sql          # Database schema
```

### Data Flow

```
Browser                    Vercel Server                    External APIs
   │                            │                               │
   │── Page Request ───→ Next.js SSR ──→ Supabase (auth, data) │
   │                            │                               │
   │── API Call ────────→ API Route ─────→ Groq AI              │
   │                            │           Gutendex             │
   │                            │           Gutenberg.org        │
   │                            │           OpenLibrary          │
   │                            │           DictionaryAPI        │
   │                            │           Datamuse             │
   │                            │           LibreTranslate       │
```

### Route Groups

| Group | Layout | Auth | Description |
|-------|--------|------|-------------|
| `(auth)` | Standalone | ❌ Public | Login & Register |
| `(dashboard)` | `layout.tsx` + Sidebar | ✅ Required | All authenticated pages |
| `p/[username]` | Standalone | ❌ Public | Public user portfolios |
| `/api/*` | N/A | Mixed | API endpoints (1 requires auth) |

---

## 3. Halaman & Rute (40 Halaman)

### A. Auth (2 halaman)

| Route | File | Deskripsi |
|-------|------|-----------|
| `/login` | `app/(auth)/login/page.tsx` | Login dengan email/password + Google OAuth |
| `/register` | `app/(auth)/register/page.tsx` | Registrasi dengan nama, email, password + OAuth |

### B. Root / Landing (1 halaman)

| Route | File | Deskripsi |
|-------|------|-----------|
| `/` | `app/page.tsx` | Landing page publik: hero section, bento grid fitur (Gutenberg, LingoWise AI, Lexicon, Translation Workshop), CTA register. Redirect ke `/dashboard` jika authenticated |

### C. Dashboard & User (5 halaman)

| Route | File | Deskripsi |
|-------|------|-----------|
| `/dashboard` | `app/(dashboard)/dashboard/page.tsx` | Dashboard utama: statistik (streak, teks selesai, review mingguan, total kosa kata), grafik pertumbuhan kosa kata, review queue |
| `/profile` | `app/(dashboard)/profile/page.tsx` | Profil user: avatar, join date, bio, statistik, achievements |
| `/settings` | `app/(dashboard)/settings/page.tsx` | Pengaturan akun: edit nama, email, bio, upload avatar |
| `/history` | `app/(dashboard)/history/page.tsx` | Riwayat aktivitas: kata yang dikuasai, analisis dijalankan, log aktivitas |
| `/leaderboard` | `app/(dashboard)/leaderboard/page.tsx` | Leaderboard global berdasarkan XP, streak, dan vocab count |

### D. Public Portfolio (1 halaman)

| Route | File | Deskripsi |
|-------|------|-----------|
| `/p/[username]` | `app/p/[username]/page.tsx` | Profil publik user: avatar, XP, streak, vocab count, showcase terjemahan |

### E. Text Library (4 halaman)

| Route | File | Deskripsi |
|-------|------|-----------|
| `/library` | `app/(dashboard)/library/page.tsx` | Text Library: browse/search teks publik, klik untuk baca |
| `/library/add` | `app/(dashboard)/library/add/page.tsx` | Tambah teks: AI generator (generate via prompt) atau manual entry |
| `/library/add/ocr` | `app/(dashboard)/library/add/ocr/page.tsx` | OCR Lens: upload foto halaman buku, scan teks, simpan ke library |
| `/read/[textId]` | `app/(dashboard)/read/[textId]/page.tsx` | Reader: tampilkan teks lengkap + WordLookupSidebar + ReadingCompanionSidebar |

### F. Gutenberg / Public Domain Books (2 halaman)

| Route | File | Deskripsi |
|-------|------|-----------|
| `/gutenberg` | `app/(dashboard)/gutenberg/page.tsx` | Search 70.000+ buku public domain via OpenLibrary (default) atau Gutendex. Dual-provider dengan pill selector |
| `/gutenberg/[id]` | `app/(dashboard)/gutenberg/[id]/page.tsx` | Reader buku Gutenberg: teks diambil via Vercel proxy, diparsing server-side |

### G. Vocabulary & Review (3 halaman)

| Route | File | Deskripsi |
|-------|------|-----------|
| `/vocabulary` | `app/(dashboard)/vocabulary/page.tsx` | Vocabulary Bank: lihat semua kosa kata tersimpan, search, filter, edit notes |
| `/vocabulary/review` | `app/(dashboard)/vocabulary/review/page.tsx` | Flashcard Review: kartu flip dengan "Remember" / "Forgot" |
| `/review` | `app/(dashboard)/review/page.tsx` | Spaced Repetition: antrian review cerdas (SM-2) kata yang jatuh tempo |

### H. LingoWise AI (1 halaman)

| Route | File | Deskripsi |
|-------|------|-----------|
| `/lingowise` | `app/(dashboard)/lingowise/page.tsx` | LingoWise AI lab: analisis teks sastra dengan 8 mode (Dialect Diver, Tone & Grammar, Vibe Translator, Mood Transformer, Diction Lab, Era Translator, Sentence Architect, Rhetorical Spotter) |

### I. Tools (10 halaman)

| Route | File | Deskripsi |
|-------|------|-----------|
| `/tools` | `app/(dashboard)/tools/page.tsx` | Tools Dashboard: daftar semua tools terorganisir |
| `/tools/[id]` | `app/(dashboard)/tools/[id]/page.tsx` | Dynamic Tool Executor: 25+ tools (mood-transformer, era-translator, critical-lens, dll.) |
| `/tools/lexicon-search` | Lexicon Search Engine: definisi, fonetik, audio, sinonim, rima, terjemahan |
| `/tools/comparator` | Side-by-Side Comparator: bandingkan teks asli vs terjemahan |
| `/tools/untranslatables` | Untranslatables Explorer: kata tanpa padanan langsung |
| `/tools/tone-analyzer` | Tone & Grammar Analyzer: analisis struktur + transformasi tone |
| `/tools/a-z-dictionary` | A-Z Dictionary Browser: browse kata alfabetis via Datamuse |
| `/tools/story-quiz` | Story Quiz: cerita AI + 5 soal kosa kata |
| `/tools/paraphrase` | Paraphrase Challenge: tulis parafrase, dapat evaluasi AI |
| `/tools/alter-ego` | Alter Ego Chat: chat dengan penulis legendaris |

**Total 25+ tools** termasuk: mood-transformer, era-translator, critical-lens, dialect-diver, rhetorical-spotter, vibe-translator, diction-lab, sentence-architect, sentiment-spectrum, imagery-sketcher, metaphor-generator, academic-outline, essay-auditor, plot-twist, conflict-mapper, semantic-visual, character-monologue, literary-synonyms, cultural-context, nuance-detector, time-traveler, poem-to-palette, semantic-map, case-study-generator, imagery-grader

### J. Translation (2 halaman)

| Route | File | Deskripsi |
|-------|------|-----------|
| `/translation-workshop` | `app/(dashboard)/translation-workshop/page.tsx` | Translation Workshop: split-screen English→Indonesian, 4 mode evaluasi (General Feedback, Equivalence Checker, Register Matcher, Back-Translation) |
| `/translation-memory` | `app/(dashboard)/translation-memory/page.tsx` | Translation Memory: simpan pasangan source→translated phrase |

### K. Forum (3 halaman)

| Route | File | Deskripsi |
|-------|------|-----------|
| `/forum` | `app/(dashboard)/forum/page.tsx` | Forum home: thread terbaru, kategori board |
| `/forum/create` | `app/(dashboard)/forum/create/page.tsx` | Buat thread baru: kategori, judul, konten markdown |
| `/forum/thread/[id]` | `app/(dashboard)/forum/thread/[id]/page.tsx` | Detail thread: lihat + komentar, edit/delete (owner/admin) |

**5 Forum Categories:**
- 📖 **Literary Interpretation** — Diskusi interpretasi karya sastra
- ✍️ **Creative Writing & Translation** — Tulis karya, terjemahan, umpan balik
- 🤖 **AI & Technology in Literature** — AI, digital humanities
- 🎮 **Games & Challenges** — Kuis, tantangan, permainan literasi
- 💬 **General Discussion** — Ngobrol bebas

### L. Community & Social (4 halaman)

| Route | File | Deskripsi |
|-------|------|-----------|
| `/community-annotations` | `app/(dashboard)/community-annotations/page.tsx` | Shared Annotations: catatan komunitas dengan upvote/downvote (+5 XP) |
| `/clubs` | `app/(dashboard)/clubs/page.tsx` | Reading Clubs: daftar klub, buat baru, join |
| `/clubs/[id]` | `app/(dashboard)/clubs/[id]/page.tsx` | Club Room: diskusi klub dengan tag chapter |
| `/duels` | `app/(dashboard)/duels/page.tsx` | Translation Duels: submit terjemahan, voting (+15 XP) |

### M. Glossary & Idioms (2 halaman)

| Route | File | Deskripsi |
|-------|------|-----------|
| `/glossary` | `app/(dashboard)/glossary/page.tsx` | Glossary Builder: glosarium per-buku/penulis |
| `/idioms` | `app/(dashboard)/idioms/page.tsx` | Idiom Library: browse/tambah/hapus idiom sastra |

---

## 4. Komponen (14 Komponen)

### Root-Level Components

| Komponen | File | Deskripsi | Props |
|----------|------|-----------|-------|
| **Sidebar** | `components/Sidebar.tsx` | Navigasi utama aplikasi. Collapsible, dark/light toggle, Word of the Day, menu groups (LingoWise, LinguaVisual, Lexicon, Study, History, Forum), user profile footer | `userEmail?`, `userName?`, `userAvatar?` |
| **ThemeProvider** | `components/ThemeProvider.tsx` | Wrapper `next-themes` dengan `attribute="class"`, `defaultTheme="light"` | Standard `NextThemesProvider` props |
| **PwaRegister** | `components/PwaRegister.tsx` | Register service worker untuk PWA offline support | None |
| **GraphViewer** | `components/GraphViewer.tsx` | Visualisasi force-directed graph (react-force-graph-2d, dynamic import, ssr:false) | `data: string` (JSON) |

### UI Components

| Komponen | File | Deskripsi | Props |
|----------|------|-----------|-------|
| **AuthAlert** | `components/ui/AuthAlert.tsx` | Popup error autentikasi via SweetAlert2 | `error?: string` |
| **OAuthButtons** | `components/ui/OAuthButtons.tsx` | Tombol "Login with Google" via Supabase OAuth | None |
| **SubmitButton** | `components/ui/SubmitButton.tsx` | Submit button dengan spinner saat loading (`useFormStatus`) | `children`, `className?` |

### Dashboard Components

| Komponen | File | Deskripsi | Props |
|----------|------|-----------|-------|
| **VocabChart** | `components/dashboard/VocabChart.tsx` | Grafik pertumbuhan kosa kata 7 hari (Recharts LineChart). Client-only dengan `mounted` guard | `data: { date: string; count: number }[]` |

### LingoWise Components

| Komponen | File | Deskripsi | Props |
|----------|------|-----------|-------|
| **LingoWiseClient** | `components/lingowise/LingoWiseClient.tsx` | Hub tool AI: text input + 8 mode analisis sastra. Render markdown hasil | None |

### Reader Components

| Komponen | File | Deskripsi | Props |
|----------|------|-----------|-------|
| **TextDisplay** | `components/reader/TextDisplay.tsx` | Reader teks: paragraph split, word selection→WordLookupSidebar, FAB→ReadingCompanionSidebar | `textId`, `title`, `author`, `content` |
| **WordLookupSidebar** | `components/reader/WordLookupSidebar.tsx` | 13 mode analisis kata: Literary Focus, Dictionary, Translate, Nuance, Synonyms, Culture, Etymology, Lyricism, Metaphors, Quote, Time Travel, Rhyme, Semantic Map. Cache per mode | `word`, `contextSentence`, `textId`, `title`, `author`, `onClose` |
| **ReadingCompanionSidebar** | `components/reader/ReadingCompanionSidebar.tsx` | AI chat sidebar untuk diskusi teks. Markdown rendering | `title`, `author`, `content`, `onClose` |

### Vocabulary Components

| Komponen | File | Deskripsi | Props |
|----------|------|-----------|-------|
| **VocabularyBankClient** | `components/vocabulary/VocabularyBankClient.tsx` | Manajemen vocabulary bank: search, filter mastery, edit notes, delete | `initialVocab` |
| **ReviewClient** | `components/vocabulary/ReviewClient.tsx` | Spaced-repetition flashcard UI: kartu flip, 4 tombol difficulty (SM-2), progress dots | `dueVocab` |

---

## 5. API Route (19 Endpoint)

### Gutenberg Domain (3 routes)

| # | Route | Method | External API | Parameters | Response | Cache |
|---|-------|--------|-------------|------------|----------|-------|
| 1 | `/api/gutenberg/search` | GET | Gutendex | `?q=string` (required) | Gutendex search results JSON | `s-maxage=300` |
| 2 | `/api/gutenberg/[id]` | GET | Gutendex | `[id]` — numeric book ID | Single book metadata JSON | `s-maxage=3600` |
| 3 | `/api/gutenberg/text` | GET | gutenberg.org | `?url=full_gutenberg_url` (validated) | `{ blocks: BookBlock[] }` — parsed text | `max-age=86400` |

**Text route features:** Strip PG wrapper, trim front matter, detect chapters (Roman numeral + pattern), classify blocks (heading/paragraph/verse), JSON output. Timeout: 8 detik.

### Groq AI Domain (8 routes)

| # | Route | Method | Model | Input | Output |
|---|-------|--------|-------|-------|--------|
| 4 | `/api/generate-text` | POST | `llama-3.3-70b-versatile` | `{ prompt }` | `{ title, author, content, difficulty }` |
| 5 | `/api/lexicon-search` | POST | Groq (fallback) + 3 APIs | `{ word }` | `{ dictionary, synonyms[], rhymes[], translation }` |
| 6 | `/api/lingowise` | POST | `llama-3.3-70b-versatile` | `{ text, mode }` | `{ result }` — Markdown dual-language |
| 7 | `/api/lookup` | POST | `llama-3.3-70b-versatile` | `{ word, contextSentence?, title?, author?, mode? }` | `{ result }` |
| 8 | `/api/comparator` | POST | `llama-3.3-70b-versatile` | `{ originalText, translatedText }` | `{ result }` — per-line analysis |
| 9 | `/api/translation` | POST | `llama-3.3-70b-versatile` | `{ originalText, translatedText, mode? }` | `{ result }` — scored evaluation |
| 10 | `/api/untranslatables` | POST | `llama-3.3-70b-versatile` | `{ word }` | `{ result }` — strategies |
| 11 | `/api/ocr` | POST | `llama-3.2-11b-vision-preview` | `{ imageBase64 }` | `{ result }` — extracted text |

**LingoWise modes (8):** `dialect-diver`, `tone-analyzer`, `vibe-translator`, `mood-transformer`, `diction-lab`, `era-translator`, `sentence-architect`, `rhetorical-spotter`

**Lookup modes (5):** `dictionary`, `cultural`, `nuance`, `synonyms`, `literary-focus`

**Translation modes (4):** `general`, `equivalence`, `register`, `back_translation`

### Tools Domain (7 routes)

| # | Route | Method | Description |
|---|-------|--------|-------------|
| 12 | `/api/tools/alter-ego` | POST | Chat persona penulis (`temperature: 0.8`) |
| 13 | `/api/tools/reading-companion` | POST | Chat analisis sastra (content truncated 3000 chars) |
| 14 | `/api/tools/tone-analyzer` | POST | Analisis tone + transformasi |
| 15 | `/api/tools/dynamic` | POST | Generic tool router (30+ tools from `lib/tools-config.ts`) |
| 16 | `/api/tools/story-quiz` | POST | Generate cerita + 5 MCQ dari vocabulary user |
| 17 | `/api/tools/paraphrase/generate` | GET | Generate random literary sentence (`?level=B2`) |
| 18 | `/api/tools/paraphrase/evaluate` | POST | Evaluasi paraphrase dengan skor `/10` |

### Database Domain (1 route)

| # | Route | Method | Auth | Description |
|---|-------|--------|------|-------------|
| 19 | `/api/review` | POST | **Required** | Submit review result, update SM-2 data in `vocabulary` table |

### External API Chains

| Route | API Chain |
|-------|-----------|
| `/api/lexicon-search` | DictionaryAPI → Datamuse → LibreTranslate → Groq (fallback) |
| `/api/tools/story-quiz` | Supabase (vocab fetch) → Groq (generate) |

---

## 6. Database Schema (Supabase)

### Tables Overview

#### Core Tables

| Table | Row-Level Security | Key Columns |
|-------|-------------------|-------------|
| **`profiles`** | SELECT: public; UPDATE: owner | `id` (PK→auth.users), `username`, `full_name`, `avatar_url`, `xp`, `streak`, `vocab_count`, `role` ('user'/'admin') |
| **`texts`** | Public read | `id` (PK), `title`, `author`, `era`, `genre`, `difficulty`, `content`, `word_count`, `is_public` |
| **`vocabulary`** | Owner-only (ALL) | `id` (PK), `user_id` (FK), `word`, `definition`, `context_sentence`, `mastery_level` (0-5), `next_review_at`, SM-2 fields |
| **`reading_sessions`** | Owner-only (ALL) | `id` (PK), `user_id` (FK), `text_id` (FK), `last_position`, `words_looked_up`, `words_saved` |
| **`translations`** | Owner-only (ALL) | `id` (PK), `user_id` (FK), `text_id` (FK), `original_passage`, `user_translation`, `ai_feedback`, `feedback_score` (1-5) |
| **`idioms`** | Owner-only (ALL) | `id` (PK), `user_id` (FK), `idiom`, `meaning`, `origin`, `example_sentence` |
| **`activity_logs`** | Owner-only (ALL) | `id` (PK), `user_id` (FK), `action_type`, `details` |

#### SM-2 Spaced Repetition Fields (in `vocabulary`)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `repetition_count` | int | 0 | Successful repetitions |
| `interval` | int | 0 | Days until next review |
| `efactor` | real | 2.5 | Ease factor (floor 1.3) |

#### Chat System

| Table | Key Columns |
|-------|------------|
| **`chat_sessions`** | `id` (PK), `user_id` (FK), `author_name`, `title` |
| **`chat_messages`** | `id` (PK), `session_id` (FK, CASCADE), `role` (user/assistant/system), `content` |

#### Forum System

| Table | Key Columns | RLS |
|-------|------------|-----|
| **`forum_categories`** | `id` (PK), `name`, `description`, `icon` | SELECT: public |
| **`forum_threads`** | `id` (PK), `category_id` (FK), `user_id` (FK), `title`, `content`, `view_count` | SELECT: public; INSERT: auth; UPDATE/DELETE: owner OR admin |
| **`forum_comments`** | `id` (PK), `thread_id` (FK), `user_id` (FK), `content` | SELECT: public; INSERT: auth; UPDATE/DELETE: owner OR admin |

#### Community & Social

| Table | Key Columns |
|-------|------------|
| **`community_annotations`** | `term`, `explanation`, `upvotes`, `downvotes` |
| **`annotation_votes`** | Composite PK (`annotation_id` + `user_id`), `vote_type` (upvote/downvote) |
| **`translation_duels`** | `title`, `original_text`, `difficulty`, `status` |
| **`duel_submissions`** | `duel_id` (FK), `user_id` (FK), `translated_text`, `votes` |
| **`clubs`** | `name`, `description`, `owner_id` (FK) |
| **`club_members`** | `club_id` (FK) + `user_id` (FK), `role` |
| **`club_discussions`** | `club_id` (FK), `user_id` (FK), `chapter`, `message` |

#### Translation Tools

| Table | Key Columns | RLS |
|-------|------------|-----|
| **`translation_memory`** | `user_id` (FK), `source_phrase`, `translated_phrase`, `context` | Owner-only |
| **`glossaries`** | `user_id` (FK), `book_title`, `author`, `term`, `preferred_translation`, `notes` | Owner-only |

#### Storage Buckets

| Bucket | Public | Policies |
|--------|--------|----------|
| **`forum_images`** | Yes | SELECT: public; INSERT: authenticated |
| **`Avatar`** | Yes | SELECT: public; INSERT: auth; UPDATE: owner |

### Database Trigger

```sql
CREATE FUNCTION public.handle_new_user() RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, username, xp, streak, vocab_count)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url',
          split_part(new.email, '@', 1), 0, 0, 0)
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, avatar_url = EXCLUDED.avatar_url;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Auto-creates `profiles` row when user signs up.

---

## 7. Sistem Autentikasi

### Supabase Auth

Tiga client Supabase:

| File | Client | Purpose |
|------|--------|---------|
| `utils/supabase/server.ts` | `createServerClient` | Server Components & Actions |
| `utils/supabase/client.ts` | `createBrowserClient` | Client Components |
| `utils/supabase/middleware.ts` | `createServerClient` | Middleware session refresh |

### Flow

1. **Login/Register** → `app/(auth)/actions.ts` → `supabase.auth.signInWithPassword()` / `signUp()`
2. **OAuth** → `OAuthButtons.tsx` → `supabase.auth.signInWithOAuth({ provider: "google" })` → callback `/auth/callback`
3. **Middleware** → `middleware.ts` → refresh session cookie setiap request
4. **Auth Gate** → `app/(dashboard)/layout.tsx` → `supabase.auth.getUser()` → redirect `/login` jika tidak authenticated
5. **Signout** → POST `/auth/signout` (form di Sidebar)

### User Metadata

```typescript
raw_user_meta_data: {
  full_name: string;
  avatar_url?: string;
  about_me?: string;
}
```

---

## 8. Spaced Repetition (SM-2 Algorithm)

### Algorithm (`lib/spaced-repetition.ts`)

Standard **SuperMemo 2** implementation:

```typescript
function calculateSM2(quality: number, lastInterval: number, lastRepetition: number, lastEaseFactor: number)
// Returns: { interval, repetition, efactor, nextReview }
```

### Review Flow

1. User melihat kartu flashcard (word + context)
2. Klik "Tampilkan Jawaban" untuk lihat definisi
3. Pilih difficulty: **Lupa Total** (q=0), **Hampir Lupa** (q=2), **Ingat Ragu** (q=4), **Sangat Mudah** (q=5)
4. POST `/api/review` → update `vocabulary.next_review_at`, `interval`, `repetition_count`, `efactor`

### Quality Mapping

| Button | Quality | Effect |
|--------|---------|--------|
| Lupa Total | 0 | Reset interval ke 0, pengulangan ke-0 |
| Hampir Lupa | 2 | Interval kecil, ulangi segera |
| Ingat Ragu | 4 | Interval lanjut, ease factor normal |
| Sangat Mudah | 5 | Interval panjang, ease factor naik |

### Review Queue

```sql
SELECT * FROM vocabulary 
WHERE user_id = $userId 
AND next_review_at <= NOW() 
ORDER BY next_review_at ASC;
```

---

## 9. Integrasi Pihak Ketiga

### AI: Groq SDK (16 files)

| Model | Use Case | Files |
|-------|----------|-------|
| `llama-3.3-70b-versatile` | Text generation, analysis, translation, chat, quiz | 14 API routes |
| `llama-3.2-11b-vision-preview` | OCR image-to-text | `app/api/ocr/route.ts` |

**Config:** `.env.local` → `GROQ_API_KEY`

### Database/Auth: Supabase (12+ files)

- `@supabase/ssr` v0.10.3 — Server-side rendering adapter
- `@supabase/supabase-js` v2.108 — Browser client

**Config:** `.env.local` → `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Charts: Recharts v3.8.1

- `components/dashboard/VocabChart.tsx` — Line chart 7-day vocabulary growth
- Components: `LineChart`, `Line`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `ResponsiveContainer`
- Client-only (SSR disabled via `mounted` state)

### Graph Viz: React-force-graph-2d v1.29.1

- `components/GraphViewer.tsx` — Force-directed graph untuk semantic map
- Dynamic import `{ ssr: false }` — tidak di-render di server

### Markdown: React-markdown v10.1

- `ReadingCompanionSidebar.tsx`, `WordLookupSidebar.tsx`, `LingoWiseClient.tsx`
- Rendering semua response AI dalam format Markdown + `prose` styling

### Theme: Next-themes v0.4.6

- Dark/Light mode via `attribute="class"`
- `defaultTheme="light"`, `enableSystem={false}`, `disableTransitionOnChange`

### Icons: Lucide-react v1.17

Digunakan di 11+ file. Total ~40 ikon berbeda termasuk:
- Navigation: `BrainCircuit`, `Library`, `BookOpen`, `GraduationCap`
- Actions: `Search`, `Send`, `Trash2`, `Edit3`, `Save`
- State: `Loader2`, `CheckCircle2`, `Sparkles`, `Moon`, `Sun`

### Alerts: SweetAlert2 v11.26

- `components/ui/AuthAlert.tsx` — Popup error auth dengan dark theme

### Public Domain APIs

| API | Type | CORS | Usage |
|-----|------|------|-------|
| **OpenLibrary** (`openlibrary.org`) | Book search + metadata | ✅ Yes | Default provider di `/gutenberg` |
| **Gutendex** (`gutendex.com`) | Book search + metadata | ⚠️ Inconsistent | Fallback provider di `/gutenberg` |
| **Gutenberg.org** (`gutenberg.org`) | Raw text files | ❌ No | Via Vercel proxy `/api/gutenberg/text` |
| **Dictionary API** (`api.dictionaryapi.dev`) | Word definitions | ✅ Yes | Lexicon search |
| **Datamuse** (`api.datamuse.com`) | Synonyms + rhymes | ✅ Yes | Lexicon search |
| **LibreTranslate** (`translate.argosopentech.com`) | Translation | ✅ Yes | Lexicon search (fallback to Groq) |

### Dual-Provider Architecture (Gutenberg Search)

```
┌─────────────────────────────────────────┐
│  Search Page (/gutenberg)                │
│                                          │
│  [OpenLibrary (Rekomendasi)] [Gutendex]  │  ← Pill selector
│                                          │
│  OpenLibrary: fetch browser langsung     │
│  Gutendex:    fetch browser langsung     │
│                                          │
│  Provider preference → localStorage      │
│  Error state → tombol switch provider    │
└─────────────────────────────────────────┘

Text retrieval: selalu via /api/gutenberg/text → gutenberg.org
Metadata: OpenLibrary works API atau Gutendex books API
Cover: OpenLibrary covers API atau Gutendex formats
```

---

## 10. Konfigurasi & Environment

### Environment Variables (`.env.local`)

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ntrhewuzyjnzjoareere.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (anon public key) |
| `SUPABASE_SERVICE_ROLE_KEY` | (service role key — seed scripts only) |
| `GROQ_API_KEY` | (Groq Cloud API key) |

### SQL Migration Files

| File | Tables |
|------|--------|
| `supabase_setup.sql` | `profiles`, `texts`, `vocabulary`, `reading_sessions`, `translations`, `idioms`, `activity_logs` |
| `setup_sm2.sql` | SM-2 fields on `vocabulary` |
| `setup_chats.sql` | `chat_sessions`, `chat_messages` |
| `setup_forum.sql` | `forum_categories`, `forum_threads`, `forum_comments` |
| `setup_forum_v2.sql` | Admin authority RLS policies |
| `setup_module2_db.sql` | `translation_memory`, `glossaries` |
| `setup_module4_db.sql` | `community_annotations`, `annotation_votes` |
| `setup_module4_mod2_db.sql` | `translation_duels`, `duel_submissions`, `clubs`, `club_members`, `club_discussions` |

---

## 11. PWA (Progressive Web App)

### Files

| File | Purpose |
|------|---------|
| `app/manifest.ts` | Generate `manifest.webmanifest` — name, icons, theme color `#2fa16b`, start URL `/dashboard`, display `standalone` |
| `public/sw.js` | Service worker — pass-through fetch handler, cache name `literary-lab-v1` |
| `components/PwaRegister.tsx` | Client component — register `/sw.js` on load via `useEffect` |
| `app/layout.tsx` | Includes `<PwaRegister />`, links manifest |

### Manifest

```typescript
{
  name: "Literary Language Lab",
  short_name: "Literary Lab",
  description: "Belajar bahasa Inggris melalui literatur sastra.",
  start_url: "/dashboard",
  display: "standalone",
  theme_color: "#2fa16b",
  background_color: "#ffffff",
  icons: [
    { src: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
    { src: "/icon-512x512.png", sizes: "512x512", type: "image/png" }
  ]
}
```

---

## 12. Styling & Tema

### Tailwind CSS v4

- Plugin: `@tailwindcss/typography` (untuk `prose` class)
- Configuration: `@theme` block di `globals.css`

### Custom CSS Variables

```css
--color-brand: #3ECF8E;
--color-brand-hover: #2fa16b;
--color-background: #fafafa;
--color-foreground: #1a1a1a;
--color-card: #ffffff;
--color-muted: #f5f5f5;
--color-border: #e5e7eb;
```

### Dark Mode

- Via `next-themes` dengan `attribute="class"`
- Toggle di Sidebar (Sun/Moon icon)
- `dark:` Tailwind variants untuk semua komponen

### Typography

- `font-sans`: Inter
- `font-serif`: Merriweather (weights: 300, 400, 700, 900)
- `prose` class untuk konten AI Markdown di seluruh app

---

## 13. Troubleshooting & Fix History

### Bug Fixes (2026-06-09)

| # | Issue | Root Cause | Fix | Commit |
|---|-------|-----------|-----|--------|
| 1 | React Error #418 (Hydration Mismatch) | `useState(() => setMounted(true))` invalid + theme icon not guarded | Ganti ke `useEffect`, bungkus WOTD + theme icon dengan `{mounted &&}` | `29ad1e8` |
| 2 | Chart `width(-1) and height(-1)` | `ResponsiveContainer` butuh container dengan tinggi valid sebelum mount | Tambah `mounted` guard di VocabChart | `29ad1e8` |
| 3 | next-themes hydration warning | `<html>` tidak punya `suppressHydrationWarning` | Tambah atribut di `layout.tsx` | `29ad1e8` |
| 4 | Gutendex 502 via Vercel proxy | Vercel tidak bisa reach gutendex.com | Fetch langsung dari browser | `62026b7` |
| 5 | Gutendex CORS redirect | URL tanpa trailing slash → 302 redirect hilangkan CORS headers | Tambah trailing slash `/` | `62026b7` |
| 6 | 404 Gutenberg text URL | `ebooks/:id.txt.utf8` invalid path | Ganti ke `cache/epub/:id/pg:id.txt` | `4022d8d` |
| 7 | Next.js 16 `params` Promise | `clubs/[id]` akses `params.id` tanpa await | `const { id } = await params` | `29ad1e8` |
| 8 | Next.js 16 `searchParams` type | Login/register type `{}` harus `Promise<{}>` | Update type declaration | `29ad1e8` |
| 9 | Slow text loading | Parsing 1-2MB text di browser | Pindah parsing ke Vercel server, return JSON | `f4215c0` |
| 10 | No cache headers | Every request cold-fetch | Add `Cache-Control` to all Gutenberg routes | `63354e4` |

### Current Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Gutenberg text via Vercel proxy | Browser CORS block, Vercel server-to-server OK |
| OpenLibrary as default search provider | CORS support, faster, more stable, more data |
| Gutendex as fallback | Redundansi, user punya pilihan |
| Text parsing server-side | Kurangi CPU browser, cache 24h di edge |
| Dual-provider with localStorage | Psikologi user — merasa punya kontrol |

---

## 14. Dependensi Tidak Terpakai

| Library | Version | Status |
|---------|---------|--------|
| **`html2pdf.js`** | ^0.14.0 | ❌ Installed but zero imports anywhere |
| **`zod`** | ^4.4.3 | ❌ Installed but zero imports anywhere |

Keduanya bisa dihapus dengan `npm uninstall html2pdf.js zod` tanpa efek samping.

---

## Appendices

### A. Server Actions Directory

| File | Functions |
|------|-----------|
| `app/(auth)/actions.ts` | `login`, `signup` |
| `app/(dashboard)/library/actions.ts` | Add text |
| `app/(dashboard)/vocabulary/actions.ts` | `deleteVocab`, `updateNotes` |
| `app/(dashboard)/forum/actions.ts` | Create thread |
| `app/(dashboard)/duels/actions.ts` | Submit duel entry |
| `app/(dashboard)/glossary/actions.ts` | Glossary CRUD |
| `app/(dashboard)/clubs/actions.ts` | Club CRUD |
| `app/(dashboard)/community-annotations/actions.ts` | Annotations + voting |
| `app/(dashboard)/translation-memory/actions.ts` | Translation memory CRUD |
| `app/(dashboard)/review/actions.ts` | Review queue fetch |

### B. Utility Scripts

| File | Purpose |
|------|---------|
| `sync_avatars.mjs` | Sync profile avatars |
| `test-profiles.mjs` | Test profile creation |
| `supabase_setup.sql` | Core schema + seed data (25 classic texts) |
