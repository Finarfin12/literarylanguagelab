# Layanan Public Domain Books — Status & Analisis

> Dibuat: 2026-06-09 | Project: Literary Language Lab

---

## Ringkasan Masalah

Fitur **Public Domain Books** (`/gutenberg`) di Literary Language Lab mengalami error karena ketergantungan pada **Gutendex.com yang sering DOWN**. Setelah investigasi, ditemukan bahwa tidak semua layanan bisa diakses langsung dari browser karena batasan **CORS (Cross-Origin Resource Sharing)**.

---

## Apa Itu CORS?

**CORS** adalah mekanisme keamanan browser. Browser memblokir request dari domain A (misal `literarylanguagelab.my.id`) ke domain B (misal `gutenberg.org`) kecuali domain B secara eksplisit mengizinkan lewat header `Access-Control-Allow-Origin`.

```
Browser (literarylanguagelab.my.id)
    │
    ├──→ openlibrary.org           ✅ CORS: "silahkan, boleh"
    │
    ├──→ gutendex.com              ❌ DOWN total
    │
    └──→ gutenberg.org             ❌ CORS: "dilarang!"
         │
         └──→ Solusi: Vercel proxy (/api/gutenberg/text)
              Server tidak kena aturan CORS browser
```

---

## Tabel Status Layanan

| Layanan | Status | CORS | Penjelasan |
|---------|--------|------|------------|
| **gutendex.com** | ❌ DOWN | — | Server Gutendex tidak merespons (timeout). Semua request — dari browser maupun Vercel — gagal. **Tidak bisa dipakai sama sekali.** |
| **gutenberg.org** | ✅ UP | ❌ (butuh proxy Vercel) | Server Project Gutenberg aktif dan menyediakan teks buku lengkap (contoh: `gutenberg.org/cache/epub/1342/pg1342.txt` — 772KB untuk Pride and Prejudice). Tapi browser memblokir akses langsung karena tidak ada header CORS. **Solusi:** teks diambil lewat Vercel server (`/api/gutenberg/text`), yang tidak terikat aturan CORS. **Ini sudah berjalan di kode saat ini.** |
| **OpenLibrary** | ✅ UP | ✅ support CORS | Bagian dari Internet Archive. API gratis, no API key, CORS penuh. Mendukung search buku (`search.json?q=...`) dan metadata detail (`works/:id.json`). Yang paling penting: response-nya mengandung field **`id_project_gutenberg`** yang bisa langsung dipakai untuk ambil teks dari Gutenberg via proxy Vercel. **Ini pengganti ideal untuk Gutendex.** |
| **Internet Archive** | ✅ UP | ❌ (kompleks) | Juga bagian dari Internet Archive. Menyediakan teks buku juga, tapi mekanisme aksesnya lebih rumit (perlu parse metadata collection, multi-step download). **Overkill untuk kebutuhan kita** — lebih baik tetap pakai Gutenberg untuk teks. |

---

## Arsitektur Saat Ini (Setelah Migrasi)

```
┌──────────────────────────────────────────────────────────────────────┐
│                           BROWSER                                    │
│                                                                      │
│  1. SEARCH                                                           │
│     fetch("openlibrary.org/search.json?q=frankenstein&limit=20")     │
│     → CORS OK, langsung dari browser, GRATIS                         │
│                                                                      │
│  2. METADATA BUKU                                                    │
│     fetch("openlibrary.org/works/OL...W.json")                       │
│     → CORS OK, langsung dari browser, GRATIS                         │
│                                                                      │
│  3. TEKS PENUH                                                       │
│     fetch("/api/gutenberg/text?url=gutenberg.org/ebooks/1342.txt")   │
│     → Lewat Vercel (server tidak kena CORS)                          │
└──────────────────────────────────────────────────────────────────────┘
          │                                    │
          │  (1) & (2): direct CORS            │  (3): Vercel proxy
          ▼                                    ▼
┌──────────────────┐              ┌───────────────────────────────────┐
│  openlibrary.org │              │          VERCEL SERVER            │
│  (Internet Arch.)│              │                                   │
│  - Search API    │              │  /api/gutenberg/text              │
│  - Work metadata │              │  ├─ fetch(gutenberg.org/...txt)   │
│  - Cover images  │              │  ├─ Parse + strip wrapper         │
│                  │              │  ├─ Build readable blocks         │
│  GRATIS selamanya│              │  └─ Return JSON { blocks }        │
└──────────────────┘              │                                   │
                                  │  Cache: 24 jam di Vercel edge     │
                                  │  GRATIS (Vercel Hobby tier)       │
                                  └───────────────────────────────────┘
```

---

## Kenapa Tidak Semua Lewat Vercel?

Pertanyaan bagus. Kenapa search & metadata tidak difetch lewat Vercel proxy seperti teks?

**Jawaban:** Vercel Hobby plan punya batas **10 detik per function**. Saat Gutendex lemot (response 2-8 detik), function Vercel timeout dan return 502. Fetch dari browser tidak punya batasan ini — user bisa menunggu lebih lama dan request tidak di-kill.

**Plus:** OpenLibrary support CORS penuh, jadi tidak ada alasan untuk proxy.

---

## Alur Data dari Search Sampai Membaca

```
User ketik "frankenstein" di search bar
        │
        ▼
Browser fetch: openlibrary.org/search.json?q=frankenstein&limit=20
        │
        ▼
Response: 5000+ hasil, masing-masing punya:
  - title, author_name, cover_i (gambar sampul)
  - id_project_gutenberg: ["84", "41445"]  ← ini kuncinya!
        │
        ▼
User klik "Baca Buku Full"
        │
        ▼
Browser fetch:
  ┌─ openlibrary.org/works/OL...W.json  → metadata detail (judul, deskripsi)
  └─ /api/gutenberg/text?url=gutenberg.org/ebooks/84.txt.utf8  → teks penuh
        │
        ▼
Vercel server:
  ├─ Download 1-2 MB teks dari gutenberg.org (koneksi server-to-server cepat)
  ├─ Parse: strip PG wrapper, deteksi chapter, deteksi heading/verse/paragraph
  └─ Return JSON { blocks: [{ type: "paragraph", text: "..." }, ...] }
        │
        ▼
Browser render teks dengan styling Tailwind Typography
```

---

## Perbandingan Kecepatan: OpenLibrary vs Gutendex

### Kenapa OpenLibrary Jauh Lebih Cepat

**1. Tanpa proxy Vercel = minus 1 hop**

```
Gutendex:  Browser → Vercel → Gutendex → Vercel → Browser  (4 hop, ~200-500ms overhead)
OpenLib:   Browser → OpenLibrary → Browser                    (2 hop, langsung)
```

Tanpa proxy Vercel di tengah, latency langsung berkurang 200-500ms per request.

**2. Infrastruktur beda kelas**

| | Gutendex | OpenLibrary |
|---|---|---|
| **Pengelola** | 1 orang (Gareth Johnson) | Internet Archive (organisasi non-profit besar) |
| **Server** | Server pribadi | Data center sendiri + CDN global |
| **Anggaran** | Pribadi / donasi | Jutaan dolar/tahun |
| **Stabilitas** | Sering DOWN (termasuk sekarang) | Hampir tidak pernah down |
| **Response time** | 500ms - 2 detik (saat hidup) | 100 - 300ms |
| **Rate limit** | Tidak jelas | Ramah, longgar |

**3. CORS = fetch paralel**

OpenLibrary support CORS penuh. Browser bisa langsung fetch search + metadata tanpa nunggu Vercel cold start. Lebih responsif dari ketukan pertama.

**4. CDN Global**

OpenLibrary menggunakan CDN global. User dari Indonesia, US, atau Eropa — semua dapat response cepat dari edge server terdekat. Gutendex cuma satu origin server.

**5. Tidak ada Vercel function overhead**

Setiap request ke Vercel API route ada overhead cold start (500ms - 1.5s untuk first request). OpenLibrary fetch langsung dari browser menghilangkan overhead ini sepenuhnya.

### Estimasi Perbandingan Waktu

| Skenario | Gutendex (via Vercel) | OpenLibrary (direct) |
|----------|----------------------|---------------------|
| **Search "austen"** | 2 - 10 detik (sering 502) | 0.2 - 0.5 detik |
| **Buka metadata buku** | 1 - 8 detik (sering timeout) | 0.1 - 0.3 detik |
| **Teks penuh (via Vercel)** | 1 - 5 detik | 1 - 5 detik (sama, tetap lewat Vercel) |
| **Total buka buku** | 3 - 15 detik | 1.5 - 6 detik |

> ⚠️ Teks penuh tetap lewat Vercel proxy (gutenberg.org tidak support CORS), jadi bagian ini kecepatannya sama. Tapi parsing sekarang dilakukan di server Vercel (bukan di browser user), jadi rendering halaman tetap lebih cepat.

### Kesimpulan

OpenLibrary **bukan cuma alternatif sementara** karena Gutendex down — ini **upgrade permanen**. Lebih cepat, lebih stabil, lebih banyak data, dan tetap gratis.

---

## Biaya

| Komponen | Biaya |
|----------|-------|
| **OpenLibrary API** | Rp 0 — gratis, no API key |
| **Gutenberg teks** | Rp 0 — public domain, no API key |
| **Vercel hosting** | Rp 0 — Hobby tier (cukup untuk traffic rendah-sedang) |
| **Vercel function execution** | Rp 0 — dalam batas gratis 100GB-hours/bulan |

**Total biaya tambahan: Rp 0.**

---

## Yang Sudah Diperbaiki Sejauh Ini

| Fix | File | Status |
|-----|------|--------|
| `Cache-Control` headers | `api/gutenberg/*/route.ts` | ✅ Deployed |
| Timeout 5-8 detik (sesuai Vercel limit) | `api/gutenberg/*/route.ts` | ✅ Deployed |
| Parsing teks di server (bukan browser) | `api/gutenberg/text/route.ts` | ✅ Deployed |
| JSON response `{ blocks }` bukan raw text | `api/gutenberg/text/route.ts` | ✅ Deployed |
| Cache hasil parsing 24 jam | `api/gutenberg/text/route.ts` | ✅ Deployed |
| Hydration error #418 fix | `Sidebar.tsx`, `layout.tsx`, dll | ✅ Deployed |
| Chart dimension fix | `VocabChart.tsx` | ✅ Deployed |
| AbortController search | `gutenberg/page.tsx` | ✅ Deployed |
| Next.js 16 params/serarchParams Promise fix | `clubs/[id]`, `login`, `register` | ✅ Deployed |

## Yang Perlu Dilakukan (Migrasi OpenLibrary)

| Task | File |
|------|------|
| Ganti search endpoint ke OpenLibrary | `app/(dashboard)/gutenberg/page.tsx` |
| Ganti metadata endpoint ke OpenLibrary | `app/(dashboard)/gutenberg/[id]/page.tsx` |
| Update TypeScript types | Kedua file di atas |
| Mapping `id_project_gutenberg` ke URL teks | `app/(dashboard)/gutenberg/[id]/page.tsx` |
| Update cover image dari `cover_i` | `app/(dashboard)/gutenberg/page.tsx` |
