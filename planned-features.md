# Fitur Baru — Literary Language Lab

> Rencana pengembangan fitur setelah fase bugfixing (hydtration, chart, Gutenberg API).
> Dicatat: 2026-06-09

---

## Daftar Fitur

| # | Fitur | Dampak | Kompleksitas |
|---|-------|--------|-------------|
| 1 | [Unify Reader Experience](#1-unify-reader-experience) | 🔴 Tinggi | 🟡 Sedang |
| 2 | [Reading Progress](#2-reading-progress) | 🔴 Tinggi | 🟢 Rendah |
| 3 | [Offline Mode](#3-offline-mode) | 🔴 Tinggi | 🟡 Sedang |
| 4 | [Pagination / Infinite Scroll](#4-pagination--infinite-scroll) | 🟡 Sedang | 🟢 Rendah |
| 5 | [Dark Mode Reader](#5-dark-mode-reader) | 🟡 Sedang | 🟢 Rendah |
| 6 | [Bookmark & Highlight](#6-bookmark--highlight) | 🟡 Sedang | 🟡 Sedang |
| 7 | [Export Vocabulary](#7-export-vocabulary) | 🟢 Rendah | 🟢 Rendah |

---

## 1. Unify Reader Experience

### Masalah Sekarang

Ada dua reader terpisah dengan fitur yang tidak setara:

| Reader | Word Lookup | AI Companion | Simpan Kosa Kata |
|--------|:-----------:|:------------:|:-----------------:|
| Library Reader (`/read/[textId]`) | ✅ | ✅ | ✅ |
| Gutenberg Reader (`/gutenberg/[id]`) | ❌ | ❌ | ❌ |

User membaca *Pride and Prejudice* dari Gutenberg tidak bisa:
- Klik kata untuk lihat definisi (WordLookupSidebar)
- Chat AI untuk diskusi teks (ReadingCompanionSidebar)
- Simpan kosa kata ke Vocabulary Bank

Padahal ini **fitur inti** aplikasi.

### Solusi

Pakai komponen reader yang sama (`TextDisplay` + `WordLookupSidebar` + `ReadingCompanionSidebar`) untuk **kedua sumber**:

```
Sumber teks: Library (Supabase) atau Gutenberg (API proxy)
     │
     ▼
TextDisplay component (unified reader)
     │
     ├── WordLookupSidebar (13 mode analisis kata)
     ├── ReadingCompanionSidebar (AI chat diskusi)
     └── Save to Vocabulary Bank
```

### File yang Terpengaruh

| File | Perubahan |
|------|-----------|
| `app/(dashboard)/gutenberg/[id]/page.tsx` | Ganti render manual dengan `TextDisplay` component |
| `components/reader/TextDisplay.tsx` | Tambah support untuk Gutenberg text blocks format |
| `components/reader/WordLookupSidebar.tsx` | Tidak perlu diubah (sudah terima props generik) |
| `components/reader/ReadingCompanionSidebar.tsx` | Tidak perlu diubah |

### Estimasi Waktu

Sedang — refactor reader page + test kedua sumber.

---

## 2. Reading Progress

### Masalah Sekarang

User membaca *Moby Dick* (200.000 kata), tutup browser, buka lagi — **mulai dari atas**. Sangat frustasi untuk buku panjang.

### Solusi

Simpan posisi scroll terakhir. Tabel `reading_sessions` sudah ada di database dengan field `last_position` — tinggal dipakai:

**Flow:**

```
User scroll membaca
     │
     ▼ (setiap 10 detik atau saat pause scroll)
Auto-save posisi ke Supabase
  - text_id / gutenberg_id
  - last_position (persentase atau offset)
  - last_active_at
     │
     ▼
Saat buka buku lagi:
  - Cek reading_sessions
  - Auto-scroll ke posisi terakhir
  - Tampilkan snackbar "Melanjutkan dari 32%..."
```

**Fitur tambahan:**
- Progress bar di card buku di dashboard ("32% selesai")
- "Lanjutkan Membaca" section di dashboard (buku yang sedang dibaca)

### File yang Terpengaruh

| File | Perubahan |
|------|-----------|
| `app/(dashboard)/read/[textId]/page.tsx` | Auto-save scroll position |
| `app/(dashboard)/gutenberg/[id]/page.tsx` | Auto-save scroll position |
| `app/(dashboard)/dashboard/page.tsx` | Tampilkan "Lanjutkan Membaca" |
| `app/(dashboard)/library/page.tsx` | Progress bar di card buku |

### Database

Tabel `reading_sessions` sudah ada, tinggal update field `last_position` dan `last_active_at`.

### Estimasi Waktu

Rendah — tabel sudah ada, logic auto-save sederhana.

---

## 3. Offline Mode

### Masalah Sekarang

Setiap buka buku harus fetch ulang dari server. Internet lambat atau mati = tidak bisa baca. PWA sudah terpasang (`sw.js`, `manifest.ts`) tapi cuma cache shell — bukan konten.

### Solusi

Simpan teks buku yang sudah dibaca ke **IndexedDB** (browser database, kapasitas besar):

**Flow:**

```
Pertama kali buka buku:
  fetch teks dari server
     │
     ▼
  Tampilkan di reader
     │
     ▼
  Simpan ke IndexedDB (teks + metadata + cover)
     │
     ▼
Kedua kali (atau offline):
  Cek IndexedDB dulu
     │
     ├── Ada → tampilkan langsung (instan!)
     └── Tidak ada → fetch jaringan seperti biasa
```

**Fitur tambahan:**
- Badge "Tersedia Offline" di card buku
- Halaman "Buku Offline" — daftar buku yang sudah di-cache
- Tombol "Simpan untuk Offline" manual
- Hapus cache per-buku untuk hemat storage

### File yang Terpengaruh

| File | Perubahan |
|------|-----------|
| `utils/indexeddb.ts` (baru) | Helper: saveBook, getBook, listBooks, deleteBook |
| `app/(dashboard)/gutenberg/[id]/page.tsx` | Cek IndexedDB sebelum fetch |
| `app/(dashboard)/read/[textId]/page.tsx` | Sama |
| `app/(dashboard)/gutenberg/page.tsx` | Badge offline di card |
| `app/(dashboard)/library/page.tsx` | Badge offline di card |
| `app/(dashboard)/offline/page.tsx` (baru) | Halaman daftar buku offline |

### Estimasi Waktu

Sedang — IndexedDB API agak verbose, tapi logic sederhana.

---

## 4. Pagination / Infinite Scroll

### Masalah Sekarang

Search Gutenberg cuma menampilkan 20 hasil pertama. Kalau hasil query 5000+ buku, user hanya lihat 20 — sisanya tidak bisa diakses.

### Solusi

**OpenLibrary** (`openlibrary.org/search.json`):
- Parameter: `&page=1`, `&page=2`, `&page=3`, dst.
- Setiap page return 20 hasil (dengan `limit=20`)

**Gutendex** (`gutendex.com/books/`):
- Parameter: `?page=1`, `?page=2`, dst.
- Setiap page return 32 hasil default

**UI Options:**

1. **Tombol "Load More"** — klik untuk tambah 20 hasil di bawah (lebih sederhana, UX jelas)
2. **Infinite scroll** — auto-load saat user scroll ke bawah (lebih modern, discovery-friendly)

Rekomendasi: **Tombol "Load More"** — lebih mudah diimplementasi dan user tetap punya kontrol.

### File yang Terpengaruh

| File | Perubahan |
|------|-----------|
| `app/(dashboard)/gutenberg/page.tsx` | Tambah state `page`, tombol "Load More" |

### Estimasi Waktu

Rendah — cuma tambah state + 1 tombol + increment page.

---

## 5. Dark Mode Reader (Reading Mode)

### Masalah Sekarang

Dark mode sudah ada via `next-themes`, tapi reader tetap pakai `prose` styling standar. Untuk membaca teks panjang, user butuh kontrol lebih.

### Solusi

Tambahkan **Reading Mode** terpisah dari theme — panel kontrol kecil di reader:

| Opsi | Pilihan |
|------|---------|
| **Background** | Cream (default) / White / Sepia / Dark |
| **Font size** | Kecil (14px) / Normal (18px) / Besar (22px) / XL (26px) |
| **Font family** | Serif (Merriweather) / Sans-serif (Inter) / Dyslexia-friendly (Atkinson Hyperlegible) |
| **Line spacing** | 1.5× / 1.8× / 2.2× |
| **Column width** | Narrow (600px) / Normal (768px) / Wide (full) |

**UI:** Ikon `Type` atau `Settings2` di sticky header reader → klik → dropdown panel.

**Storage:** `localStorage` per-user, jadi preferensi tetap ada setelah refresh.

### File yang Terpengaruh

| File | Perubahan |
|------|-----------|
| `components/reader/ReaderSettings.tsx` (baru) | Panel kontrol reading mode |
| `app/(dashboard)/read/[textId]/page.tsx` | Tambahkan ReaderSettings |
| `app/(dashboard)/gutenberg/[id]/page.tsx` | Sama |
| `app/globals.css` | CSS variables untuk reading mode |

### Estimasi Waktu

Rendah — cuma CSS variables + localStorage + UI panel kecil.

---

## 6. Bookmark & Highlight

### Masalah Sekarang

User tidak bisa menandai quote favorit, bagian penting, atau insight saat membaca.

### Solusi

**Cara pakai:** User select teks → muncul toolbar mini → pilih "Highlight" atau "Bookmark":

**Highlight:**
- Teks dengan background kuning (seperti highlighter)
- Bisa tambah note (klik highlight → edit note)
- Disimpan: user_id, text_id, position (offset), highlighted_text, color, note
- Filter berdasarkan warna

**Bookmark:**
- Tandai posisi di buku (bukan teks spesifik)
- Disimpan: user_id, text_id, position, label (chapter, page)
- Panel sidebar "Bookmarks" untuk navigasi cepat
- Klik bookmark → auto-scroll ke posisi itu

**Database (tabel baru):**

```sql
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  text_id UUID REFERENCES texts,
  gutenberg_id TEXT,
  position INTEGER NOT NULL,
  quote_text TEXT,
  note TEXT,
  color TEXT DEFAULT '#FFEB3B',
  type TEXT CHECK (type IN ('highlight', 'bookmark')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### File yang Terpengaruh

| File | Perubahan |
|------|-----------|
| `components/reader/TextDisplay.tsx` | Toolbar mini saat select teks |
| `components/reader/BookmarkSidebar.tsx` (baru) | Panel daftar bookmark/highlight |
| `lib/bookmarks.ts` (baru) | Helper functions |
| Database | Tabel `bookmarks` + RLS |

### Estimasi Waktu

Sedang — perlu tabel baru, UI toolbar mini, sidebar panel.

---

## 7. Export Vocabulary

### Masalah Sekarang

Vocabulary bank hanya bisa diakses di dalam app. Tidak bisa dipakai di tools belajar lain.

### Solusi

**Export CSV:**
- Satu klik download semua vocab
- Kolom: word, definition, context_sentence, context_source, register, mastery_level
- Bisa import ke Quizlet, Anki, Google Sheets, Notion

**Export Anki Deck (.apkg):**
- Format standar Anki flashcard
- Front: word + context sentence
- Back: definition + register + mastery level
- User bisa lanjut review di Anki app (iOS/Android/Desktop — lebih mature spaced repetition)

**Export JSON:**
- Format mentah untuk developer / power user
- Bisa di-import ke tools custom

### UI

Tombol "Export" di halaman `/vocabulary` → dropdown pilih format → download.

### File yang Terpengaruh

| File | Perubahan |
|------|-----------|
| `app/(dashboard)/vocabulary/page.tsx` | Tombol export + dropdown |
| `lib/export-vocab.ts` (baru) | Generate CSV, JSON |
| `lib/anki-export.ts` (baru) | Generate .apkg (pakai library `anki-apkg-generator`) |

### Dependency Baru

`anki-apkg-generator` (~30KB, client-side, no server needed)

### Estimasi Waktu

Rendah — CSV dan JSON sederhana. Anki .apkg butuh library kecil tapi formatnya standar.

---

## Prioritas Implementasi

Berdasarkan dampak ke user vs kompleksitas:

| Urutan | Fitur | Alasan |
|--------|-------|--------|
| 1 | Reading Progress | Paling cepat + dampak besar |
| 2 | Dark Mode Reader | Paling cepat + kenyamanan signifikan |
| 3 | Pagination Search | Super cepat + penting untuk discovery |
| 4 | Unify Reader | Dampak besar tapi butuh refactor |
| 5 | Offline Mode | Dampak besar tapi butuh IndexedDB setup |
| 6 | Export Vocabulary | Niche, tapi cepat |
| 7 | Bookmark/Highlight | Paling kompleks (tabel baru + UI baru) |

---

## Catatan

- Semua fitur ini tetap **gratis** dijalankan (tidak ada biaya API tambahan)
- Offline mode dan reading progress akan membuat PWA yang sudah terpasang jauh lebih berguna
- After security audit fixes selesai, fitur-fitur ini bisa dimulai bertahap
