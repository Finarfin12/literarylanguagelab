# Migrasi Gutendex → OpenLibrary API

## Latar Belakang

**Gutendex.com sering DOWN** — semua request timeout, menyebabkan error 502 (Vercel) atau CORS block (browser). Ini membuat fitur _Public Domain Books_ (`/gutenberg`) tidak bisa dipakai.

Setelah investigasi, **OpenLibrary** (`openlibrary.org`) adalah pengganti ideal:

| | Gutendex | OpenLibrary |
|---|---|---|
| **Status saat ini** | ❌ DOWN | ✅ UP |
| **Gratis** | ✅ | ✅ |
| **API Key** | Tidak perlu | Tidak perlu |
| **CORS Support** | Tidak konsisten | ✅ Penuh |
| **Search** | `gutendex.com/books/?search=` | `openlibrary.org/search.json?q=` |
| **Metadata buku** | `gutendex.com/books/:id` | `openlibrary.org/works/:key.json` |
| **Jumlah buku** | 70.000+ | Jutaan |
| **ID Gutenberg** | ✅ `id: number` | ✅ `id_project_gutenberg` field |
| **Cover image** | `formats["image/jpeg"]` | `cover_i` → URL template |
| **Rate limit** | Tidak jelas | Ramah, no strict limit |

---

## Arsitektur Baru

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER                                  │
│                                                                 │
│  Search:  fetch("openlibrary.org/search.json?q=austen")   ← CORS OK │
│  Detail:  fetch("openlibrary.org/works/OL66554W.json")     ← CORS OK │
│  Teks:    fetch("/api/gutenberg/text?url=...")  → Vercel proxy    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     VERCEL SERVER                                │
│                                                                 │
│  /api/gutenberg/text  →  fetch(gutenberg.org/cache/epub/...txt) │
│  (tetap seperti sekarang, parsing + cache 24h)                   │
└─────────────────────────────────────────────────────────────────┘
```

**Kunci:** Search & metadata fetch langsung dari browser (OpenLibrary support CORS penuh). Hanya teks yang tetap lewat Vercel proxy (gutenberg.org tidak support CORS).

---

## Response OpenLibrary vs Gutendex

### Search (`openlibrary.org/search.json?q=SHERLOCK&limit=20`)

```json
{
  "numFound": 5000,
  "docs": [
    {
      "title": "Pride and Prejudice",
      "author_name": ["Jane Austen"],
      "cover_i": 14348537,
      "first_publish_year": 1813,
      "language": ["eng", "spa", "fre", ...],
      "subject": ["fiction", "romance", ...],
      "key": "/works/OL66554W",
      "id_project_gutenberg": ["1342", "42671", "45186"],
      "has_fulltext": true,
      "public_scan_b": true
    }
  ]
}
```

> `id_project_gutenberg` → bisa langsung dipakai untuk ambil teks via `/api/gutenberg/text`
> `cover_i` → URL cover: `https://covers.openlibrary.org/b/id/{cover_i}-M.jpg`

### Detail Buku (`openlibrary.org/works/OL66554W.json`)

```json
{
  "title": "Pride and Prejudice",
  "description": "Pride and Prejudice is an 1813 novel...",
  "subjects": ["Courtship", "Sisters", ...],
  "covers": [14348537, 9278312, ...],
  "authors": [{"author": {"key": "/authors/OL23919A"}}]
}
```

---

## Alur Pemasangan

### File yang Dimodifikasi

| File | Perubahan |
|------|-----------|
| `app/(dashboard)/gutenberg/page.tsx` | Ganti endpoint search dari Gutendex ke OpenLibrary |
| `app/(dashboard)/gutenberg/[id]/page.tsx` | Ganti endpoint metadata dari Gutendex ke OpenLibrary + derive Gutenberg text URL dari `id_project_gutenberg` |

### File yang TIDAK Berubah

| File | Keterangan |
|------|------------|
| `app/api/gutenberg/text/route.ts` | **Tidak diubah** — parsing teks + cache 24h tetap jalan |
| `app/api/gutenberg/search/route.ts` | Tidak dipakai lagi (bisa dihapus nanti) |
| `app/api/gutenberg/[id]/route.ts` | Tidak dipakai lagi (bisa dihapus nanti) |

> ⚠️ **Jangan hapus API routes dulu** — biarkan sebagai fallback kalau Gutendex balik online.

---

### Step 1: Update Search Page — `app/(dashboard)/gutenberg/page.tsx`

**Endpoint lama:**
```
/api/gutenberg/search?q=${query}   (proxy Vercel → Gutendex)
```

**Endpoint baru:**
```
https://openlibrary.org/search.json?q=${query}&limit=20&fields=key,title,author_name,cover_i,first_publish_year,subject,id_project_gutenberg,has_fulltext,language
```

### Step 2: Update Reader Page — `app/(dashboard)/gutenberg/[id]/page.tsx`

**Endpoint lama:**
```
/api/gutenberg/${id}                                (metadata)
/api/gutenberg/text?url=...                         (teks)
```

**Endpoint baru:**
```
https://openlibrary.org/works/${workId}.json         (metadata)
/api/gutenberg/text?url=https://www.gutenberg.org/ebooks/${gutenbergId}.txt.utf8  (teks)
```

### Step 3: Update Types

```typescript
type OpenLibrarySearchDoc = {
  key: string;                    // "/works/OL66554W"
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  subject?: string[];
  id_project_gutenberg?: string[];
  has_fulltext?: boolean;
  language?: string[];
};

type OpenLibrarySearchResponse = {
  numFound: number;
  docs: OpenLibrarySearchDoc[];
};

type OpenLibraryWork = {
  title: string;
  description?: string | { value: string };
  authors?: { author: { key: string } }[];
};
```

### Step 4: URL Mapping

```
OpenLibrary work key:  /works/OL66554W
                         ↓
Gutenberg ID:           id_project_gutenberg[0] → "1342"
                         ↓
Teks url:               https://www.gutenberg.org/ebooks/1342.txt.utf8
                         ↓
API call:               /api/gutenberg/text?url=...
```

### Step 5: Cover Image

```
cover_i: 14348537
  ↓
URL: https://covers.openlibrary.org/b/id/14348537-M.jpg
```

Ukuran: `-S` (small), `-M` (medium), `-L` (large)

---

## Kelebihan OpenLibrary

1. **Gratis selamanya** — non-profit Internet Archive
2. **CORS support penuh** — fetch langsung dari browser, tanpa proxy Vercel
3. **Always online** — uptime jauh lebih stabil dari Gutendex
4. **Jutaan buku** — mencakup semua Gutenberg + Internet Archive + library global
5. **Field `id_project_gutenberg`** — jembatan langsung ke teks yang sudah ada di sistem kita
6. **Cover image** — tidak perlu download dari Gutenberg
7. **Filter `has_fulltext:true`** — hanya tampilkan buku yang punya teks lengkap
8. **Language filter** — bisa filter berdasarkan bahasa

---

## Catatan Penting

1. **Work key bukan integer** — OpenLibrary pakai `/works/OL...W` bukan ID numerik. URL routing `/gutenberg/[id]` perlu diubah atau tetap pakai `id_project_gutenberg` sebagai identifier
2. **Author name perlu fetch terpisah** — OpenLibrary search cuma return `author_name: string[]`, untuk detail author perlu fetch `/authors/:key.json`
3. **Gutenberg text URL** — selalu `https://www.gutenberg.org/ebooks/{id}.txt.utf8` karena kita sudah dapat `id_project_gutenberg`
4. **API routes lama jangan dihapus** — biarkan sebagai fallback sampai OpenLibrary terbukti stabil untuk use case kita
