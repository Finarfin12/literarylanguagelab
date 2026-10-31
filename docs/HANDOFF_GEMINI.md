# Handoff — Pengerjaan Literary Language Lab v2

> Dokumen ini adalah instruksi kerja untuk agent AI (Gemini Flash 3.8) yang akan mengerjakan
> [PRD.md](PRD.md) dan [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).
> Tempelkan bagian **"Prompt pembuka"** di awal sesi, lalu satu **"Prompt per fase"** untuk tiap sesi berikutnya.

---

## Prompt pembuka (tempel di awal setiap sesi)

```
Kamu adalah engineer yang mengerjakan repo "Literary Language Lab"
(Next.js 16.2 App Router, React 19, Supabase, Groq, Tailwind v4, TypeScript).

Baca dulu, berurutan:
1. AGENTS.md  — Next.js 16 punya breaking changes. Baca panduan yang relevan di
   node_modules/next/dist/docs/ SEBELUM menulis kode Next.js. Contoh: middleware.ts
   sudah diganti proxy.ts (lihat node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md).
2. docs/PRD.md
3. docs/IMPLEMENTATION_PLAN.md
4. docs/HANDOFF_GEMINI.md (bagian "Aturan kerja" dan "Fakta yang sudah diverifikasi")

Kerjakan HANYA fase yang saya sebut di pesan berikutnya. Jangan mulai fase lain.
```

---

## Aturan kerja

1. **Satu fase per sesi.** Satu fase = satu branch (`v2/fase-0-keamanan`, `v2/fase-1-hapus-gamifikasi`, …) = satu commit atau PR. Jangan menggabungkan fase.
2. **Ikuti kode di sekitarnya.** Gaya penamaan, kepadatan komentar, dan pola yang sama. Komentar dan teks UI dalam Bahasa Indonesia seperti kode yang ada.
3. **Tidak ada dependency baru** kecuali yang disebut di plan (`@modelcontextprotocol/sdk` di Fase 5, opsional). Klien AI memakai `fetch`.
4. **Perubahan skema** selalu menjadi file baru di `supabase/migrations/NNNN_nama.sql`. Jangan pernah `DROP` kolom/tabel gamifikasi sebelum Fase 7.
5. **Jangan menyentuh** `.env*`, jangan menulis API key ke file, log, atau response ke browser.
6. **Jangan menghapus file** yang tidak disebut di plan. Untuk file di daftar hapus, baca isinya dulu; kalau ternyata dipakai, berhenti dan laporkan.
7. **Verifikasi sebelum menyatakan selesai:** jalankan `npm run lint` dan `npm run build`, lalu jalankan langkah "Selesai jika" milik fase tersebut. Laporkan output aslinya. Kalau gagal, katakan gagal; jangan tulis "seharusnya berhasil".
8. **Berhenti dan tanya** jika: instruksi plan bertentangan dengan isi kode, sebuah langkah butuh akses Supabase dashboard/produksi, atau perubahan menyentuh > 40 file di luar daftar fase.
9. **Laporan akhir sesi** (format tetap):
   ```
   Fase: N
   Branch/commit: ...
   Yang selesai: (daftar langkah plan, mis. 0.1, 0.2 …)
   Yang belum / dilewati + alasan:
   Hasil lint/build: (tempel ringkasan output)
   Hasil uji "Selesai jika":
   Hal yang perlu diputuskan pemilik:
   ```

---

## Keputusan pemilik

| # | Keputusan | Status |
|---|---|---|
| Q1 | Forum, clubs, messages, jejaring pembaca: **tetap ada**, hanya mekanik kompetitif yang dihapus | ⚠️ Asumsi default — **konfirmasi ke pemilik sebelum Fase 1** |
| Q2 | Latihan Harian & Weekly Challenge dipertahankan tanpa poin | Asumsi default |
| Q3 | Provider `anthropic` native tidak dikerjakan di v2 | Asumsi default |
| Q4 | Hanya admin yang memilih model | Asumsi default |
| Q5 | Kuota default 30 request/menit, 500/hari | Asumsi default |

---

## Fakta yang sudah diverifikasi (jangan diulang dari nol)

**Groq (dicek di dokumentasi resmi, 31 Okt 2026)**
- Model vision untuk OCR: `qwen/qwen3.8-27b`. Maks 3 gambar per request. Request dengan URL gambar maks 20 MB. Dipanggil lewat `chat.completions` dengan konten `{ type: "image_url", image_url: { url } }` (base64 data URL boleh).
- Remote MCP: lewat **Responses API** (`POST https://api.groq.com/openai/v1/responses`) dengan tool `type: "mcp"`. Groq yang melakukan `tools/list` dan `tools/call`. Status **beta**; hanya untuk model yang mendukung tool use (termasuk `openai/gpt-oss-120b`).
- Base URL OpenAI-compatible: `https://api.groq.com/openai/v1`.

**Kode saat ini**
- `lib/ai-config.ts`: satu-satunya provider adalah Groq; `getRateLimit()` tidak dipanggil di mana pun; `isFeatureEnabled()` mengembalikan `false` untuk key yang tidak ada.
- 37 route memakai `getAIClient()`. `app/api/stt` dan `app/api/tts` memanggil Groq langsung dengan `fetch`.
- Respons GPT-OSS bisa berisi field reasoning; penanganannya ada di commit `82bbc51` (pertahankan perilaku itu di `runAI`).
- `app/(dashboard)/layout.tsx` memanggil `rpc("update_login_streak")` di setiap render.
- `app/api/ocr/route.ts` memakai konfigurasi `tools` (`openai/gpt-oss-120b`, model teks), jadi OCR saat ini tidak berfungsi.
- Tidak ada folder `supabase/migrations` di repo.

**27 route tanpa pengecekan login (target Fase 0.3)**
```
app/api/analyze-difficulty        app/api/lingowise
app/api/analyze-tone              app/api/listening-test/generate
app/api/comparator                app/api/ocr
app/api/detect-idioms             app/api/simplify-text
app/api/generate-quiz             app/api/slang-decoder
app/api/generate-text             app/api/stt
app/api/grammar-clinic/mini-lesson app/api/tools/alter-ego
app/api/gutenberg/[id]   (publik) app/api/tools/paraphrase/evaluate
app/api/gutenberg/search (publik) app/api/tools/paraphrase/generate
app/api/gutenberg/text   (publik) app/api/tools/reading-companion
app/api/highlight-syntax          app/api/tools/story-quiz
app/api/lexicon-search            app/api/tools/tone-analyzer
app/api/translation               app/api/tts
app/api/untranslatables
```
Route Gutenberg boleh tetap publik (allowlist di `proxy.ts`) tapi tetap kena rate limit per IP.

**File gamifikasi (target Fase 1), diurutkan dari referensi terbanyak**
`profile/page.tsx`, `forum/thread/[id]/page.tsx`, `duels/*`, `api/writing-challenge/*`, `help/page.tsx`, `api/liter-ai`, `api/journey`, `admin/users/page.tsx`, `lib/journey-quests.ts`, `dashboard/page.tsx`, `api/review`, `leaderboard/page.tsx`, `english-lab/writing-challenge/page.tsx`, `components/dashboard/JourneyWidget.tsx`, `settings/page.tsx`, `history/page.tsx`, `components/dashboard/WritingChallengeWidget.tsx`, `lib/menu-config.ts`, `p/[username]/page.tsx`, `api/vocabulary`, `api/reading/heartbeat`, `api/evaluate-listening`, `api/daily-practice`, `english-lab/dialogue-simulator/page.tsx`, `community/page.tsx`, `community-annotations/*`, `components/reader/SentenceAnalysisSidebar.tsx`, `components/dashboard/DailyPracticeWidget.tsx`, `api/placement-test`, `tools/sentence-architect/page.tsx`, `(dashboard)/layout.tsx`.

---

## Prompt per fase (tempel setelah prompt pembuka)

**Fase 0**
```
Kerjakan Fase 0 dari docs/IMPLEMENTATION_PLAN.md (langkah 0.1–0.7) di branch v2/fase-0-keamanan.
Langkah 0.1 (dump skema) dan 0.7 (uji RLS) butuh akses Supabase: siapkan perintah/SQL-nya,
tapi JANGAN jalankan ke database. Tulis di laporan agar pemilik yang menjalankan.
Selesai jika: semua route di daftar "27 route" mengembalikan 401 tanpa login (kecuali Gutenberg),
request ke-31 dalam 1 menit mengembalikan 429, lint & build lulus.
```

**Fase 1** *(baru setelah Q1 dikonfirmasi)*
```
Kerjakan Fase 1 di branch v2/fase-1-hapus-gamifikasi. Keputusan Q1: <isi jawaban pemilik>.
Gunakan daftar "File gamifikasi" di HANDOFF_GEMINI.md. Jangan DROP kolom atau tabel apa pun.
Selesai jika: grep di langkah "Selesai jika" Fase 1 tidak menyisakan referensi yang tampil di UI.
```

**Fase 2**
```
Kerjakan Fase 2 di branch v2/fase-2-tampilan. Mulai dari 2.1 (komponen ui/), lalu 2.2–2.4,
dan terakhir 2.5. Untuk 2.5, buat file docs/mobile-audit.md berisi tabel
path | masalah | status, dan perbarui tabel itu saat memperbaiki.
```

**Fase 3**
```
Kerjakan Fase 3 di branch v2/fase-3-ai-registry. Urutan: 3.1 migrasi → 3.2 lib/ai/ →
3.3 migrasi route per kelompok (commit per kelompok) → 3.4 UI admin.
Enkripsi wajib memakai env AI_SECRETS_KEY; jika env itu kosong, aplikasi harus tetap jalan
memakai GROQ_API_KEY dan UI admin menampilkan peringatan.
```

**Fase 4**
```
Kerjakan Fase 4 (OCR Qwen) di branch v2/fase-4-ocr. Model: qwen/qwen3.8-27b lewat runAI('ocr').
```

**Fase 5**
```
Kerjakan Fase 5 (MCP) di branch v2/fase-5-mcp. Jalur MCP harus berada di belakang feature flag
mcp_enabled (default mati). Hanya MCP server HTTPS; terapkan url-guard dari Fase 3.
```

**Fase 6 / Fase 7**
```
Kerjakan Fase <6|7> di branch v2/fase-<n>-.... Untuk Fase 7, migrasi 0009_drop_gamification.sql
hanya DITULIS, jangan dijalankan; pemilik yang menjalankan setelah backup.
```

---

## Titik review oleh pemilik

| Setelah | Cek |
|---|---|
| Fase 0 | Jalankan SQL dump/RLS dari laporan; coba panggil satu route AI tanpa login → 401 |
| Fase 1 | Konfirmasi tidak ada XP/leaderboard yang tampil; forum/clubs sesuai keputusan Q1 |
| Fase 2 | Buka di HP sungguhan; periksa `docs/mobile-audit.md` |
| Fase 3 | Isi `AI_SECRETS_KEY`; tambah satu provider lewat UI; cek DevTools → Network tidak memuat API key |
| Fase 5 | Daftarkan satu MCP server uji, nyalakan `mcp_enabled` |
