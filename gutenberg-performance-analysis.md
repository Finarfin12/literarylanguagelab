# Analisis Performa API Gutenberg/Gutendex — Literary Language Lab

## Arsitektur Data Flow

```
User → /gutenberg (Search Page)
         │
         ▼
  fetch(/api/gutenberg/search?q=...) ──→ Gutendex.com/books/?search=...
         │
         ▼ (klik "Baca Buku Full")
  fetch(/api/gutenberg/[id]) ──→ Gutendex.com/books/:id         ← 🔴 sequential
         │                                                       
         ▼ (tunggu metadata dulu, baru...)                      
  fetch(/api/gutenberg/text?url=...) ──→ gutenberg.org/cache/...txt
         │
         ▼
  buildReadableBlocks(rawText)  ← CPU-intensive, setiap render
```

---

## Status Cache Saat Ini

| Route | Cache Header | Masalah |
|-------|-------------|---------|
| `api/gutenberg/search` | ❌ Tidak ada | Setiap search keystroke hit Gutendex fresh |
| `api/gutenberg/[id]` | ❌ Tidak ada | Setiap buka buku fetch ulang metadata |
| `api/gutenberg/text` | ✅ `max-age=3600` | Satu-satunya yang benar |

---

## 10 Bottleneck & Rekomendasi

### 🔴 1. 2 dari 3 route API tidak punya `Cache-Control`

Search dan metadata route tidak mengembalikan header cache sama sekali. Setiap request — termasuk request berulang ke buku yang sama — selalu cold-fetch ke Gutendex.

**Rekomendasi:**
- Search: `Cache-Control: s-maxage=300, stale-while-revalidate=600` (5 menit)
- Metadata: `Cache-Control: s-maxage=3600, stale-while-revalidate=86400` (1 jam, stale 1 hari — buku Gutenberg tidak pernah berubah)

**Dampak:** Tanpa ini, Gutendex jadi single point of bottleneck. Jika Gutendex lambat (response time 500ms–2s), setiap user merasakan latency penuh.

---

### 🔴 2. Metadata + Text di-fetch secara sequential (waterfall)

```typescript
// gutenberg/[id]/page.tsx line ~92
const meta = await fetch(`/api/gutenberg/${id}`);  // Tunggu 500ms-2s
// ... proses metadata ...
const text = await fetch(`/api/gutenberg/text?url=...`); // Baru fetch text
```

Tidak ada alasan teknis fetch text harus menunggu metadata. `txtUrl` bersifat deterministik — selalu `https://www.gutenberg.org/ebooks/{id}.txt.utf8` atau dari `formats["text/plain"]`.

**Rekomendasi:** Parallel fetch dengan `Promise.all()` atau langsung derive URL text tanpa menunggu metadata.

**Dampak:** Memotong Time-to-Interactive hingga ~50%.

---

### 🔴 3. Tidak ada request deduplication antar user

Dua user yang membuka buku yang sama menghasilkan dua cold request ke Gutendex. Next.js built-in dedup hanya berlaku untuk fetch dalam satu render pass yang sama — bukan antar request API route yang berbeda.

**Rekomendasi:** Gunakan Next.js `unstable_cache` atau simpan hasil ke file-based cache / Redis untuk share antar request.

---

### 🔴 4. `buildReadableBlocks()` dijalankan ulang setiap re-render

```typescript
// Tidak ada useMemo — setiap render ulang komponen parsing ulang teks penuh
const blocks = buildReadableBlocks(text);
```

Untuk Moby Dick (~200K kata), ini operasi string yang mahal. Tidak ada `useMemo`.

**Rekomendasi:** Bungkus dengan `useMemo([text])`.

---

### 🟡 5. Tidak ada AbortController di search

User yang submit search 3x cepat akan menghasilkan 3 in-flight request. Hanya response terakhir yang dipakai, tapi 2 request sebelumnya tetap boros bandwidth.

**Rekomendasi:** Tambahkan `AbortController`, batalkan request sebelumnya saat search baru dimulai.

---

### 🟡 6. Tidak ada pagination

Search selalu ambil Gutendex page 1 dan truncate ke 20 hasil. Gutendex mendukung `?page=N`.

**Rekomendasi:** Tambahkan "Load More" / infinite scroll.

---

### 🟡 7. Tidak ada retry atau circuit breaker

Jika Gutendex return 429 (rate limit) atau timeout, user langsung lihat error tanpa retry otomatis.

**Rekomendasi:** Retry dengan exponential backoff (max 3x), fallback graceful.

---

### 🟡 8. Halaman Gutenberg fully client-side (no SSR)

Kedua halaman (`/gutenberg` dan `/gutenberg/[id]`) adalah `"use client"`. Tidak ada server rendering sama sekali, artinya:
- **SEO = nol** — Google tidak mengindeks konten
- **FCP lambat** — user lihat spinner dulu, baru konten

**Rekomendasi:** Konversi halaman detail buku ke Server Component dengan `fetch` caching. Search page bisa tetap client-side tapi dengan initial server-rendered results.

---

### 🟢 9. Security text proxy sudah baik

Validasi hostname `endsWith(".gutenberg.org")` mencegah akses ke URL arbitrer.

---

### 🟢 10. Filtering hanya buku dengan `text/plain` sudah baik

Mencegah user klik buku yang tidak bisa dibaca.

---

## Rekomendasi Prioritas

| # | Action | Dampak | Kompleksitas |
|---|--------|--------|-------------|
| 1 | Tambah `Cache-Control` header di search + metadata route | ⬇️ 60-80% latency untuk repeat request | **Rendah** (2 baris per route) |
| 2 | Parallel fetch metadata + text | ⬇️ ~50% TTI | **Rendah** (`Promise.all`) |
| 3 | `useMemo` untuk `buildReadableBlocks` | ⬇️ CPU spike re-render | **Rendah** (1 wrap) |
| 4 | `AbortController` di search | ⬇️ Bandwidth waste | **Rendah** |
| 5 | Retry logic + error boundary | ⬆️ Resilience | **Sedang** |
| 6 | Pagination search results | ⬆️ UX, ⬇️ payload size | **Sedang** |
| 7 | Konversi book detail ke Server Component | ⬆️ SEO + FCP | **Tinggi** (refactor arsitektur) |
| 8 | Unify reader experience (WordLookup + Companion) | ⬆️ Konsistensi fitur | **Tinggi** |
