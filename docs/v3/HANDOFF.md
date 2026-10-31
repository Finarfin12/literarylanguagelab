# Handoff — Pengerjaan Literary Language Lab v3 (untuk Claude Sonnet 5)

> Instruksi kerja untuk sesi coding yang mengerjakan [PRD.md](PRD.md) dan [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).
> Tempel **"Prompt pembuka"** di awal sesi, lalu satu **"Prompt per fase"**. Satu sesi = satu fase.
> Ditulis 31 Oktober 2026 oleh sesi yang mengerjakan v2 (Fase 0–7). Semua fakta di bawah sudah dicek di kode.

---

## Prompt pembuka (tempel di awal setiap sesi)

```
Kamu adalah engineer di repo "Literary Language Lab"
(Next.js 16.2 App Router, React 19, Supabase, Tailwind v4, TypeScript; AI lewat registry provider di lib/ai).

Baca dulu, berurutan:
1. docs/v3/HANDOFF.md (seluruhnya: aturan kerja, pola wajib, jebakan yang sudah diketahui)
2. docs/v3/PRD.md
3. docs/v3/IMPLEMENTATION_PLAN.md (bagian fase yang saya sebut)
4. docs/SESSION_HANDOFF.md (status v2 dan migrasi yang sudah/belum dijalankan)

Next.js 16 punya breaking changes. Sebelum menulis kode Next.js yang belum ada contohnya di repo,
baca panduan terkait di node_modules/next/dist/docs/ (mis. 01-app/01-getting-started/07-mutating-data.md).

Kerjakan HANYA fase yang saya sebut. Jangan mulai fase lain. Jangan ulang analisis yang sudah tercatat.
```

---

## Prompt per fase

**Fase 8**
```
Kerjakan Fase 8 (Penataan untuk orang awam) dari docs/v3/IMPLEMENTATION_PLAN.md.
Untuk 8.3 (konsolidasi alat): SEBELUM menghapus/menggabung/me-redirect alat apa pun,
tampilkan tabel usulan (alat → tindakan → alasan) dan tunggu persetujuan saya (Q5).
```

**Fase 9**
```
Kerjakan Fase 9 (Fondasi belajar dasar). Untuk core_words: buat skrip impor saja,
jangan unduh atau sertakan file NGSL di repo. Cek dan laporkan lisensi NGSL dari situs resminya.
Pemetaan band → CEFR: pakai angka di plan, tandai sebagai "perlu konfirmasi pemilik" di laporan.
```

**Fase 10**
```
Kerjakan Fase 10 (Level per keterampilan & Tes Naik Level). Mulai dari lib/levels.ts beserta
uji unitnya, baru UI. Level tidak boleh turun otomatis.
```

**Fase 11**
```
Kerjakan Fase 11 (Jalur penerjemahan akademik). Mulai dari lib/translation/* beserta uji unitnya.
Definisi 18 teknik Molina & Hurtado Albir ditulis ulang singkat dalam bahasa Indonesia (jangan menyalin buku).
```

---

## Aturan kerja

1. **Satu fase per sesi, satu commit per fase.** Kerjakan di branch `main` (keputusan pemilik). Commit lokal boleh tanpa tanya; **push ke GitHub selalu tanya dulu**.
2. **Identitas git wajib `finarfin112 <finarfinar112@gmail.com>`.** Vercel (paket Hobby) memblokir deploy dari commit dengan penulis lain. Cek dengan `git config user.email` sebelum commit; jika beda, set di repo: `git config user.name finarfin112 && git config user.email finarfinar112@gmail.com`.
3. **Akhiri pesan commit** dengan baris atribusi model yang diberikan sistem sesi.
4. **Tidak ada akses database.** Folder kerja tidak punya `.env`. Migrasi ditulis sebagai file `supabase/migrations/NNNN_*.sql`, **tidak dijalankan**. Jangan pernah login ke Supabase/aplikasi produksi.
5. **Kode harus jalan sebelum migrasi dijalankan.** Tangkap error kolom/tabel hilang (kode `42703`, `PGRST204`, `42P01`, `PGRST205`) dan turun ke perilaku lama; di halaman admin tampilkan `MissingMigrationNotice` (`app/(dashboard)/admin/_lib/ui.tsx`). Contoh pola: `app/api/reading/heartbeat/route.ts`, `app/(dashboard)/admin/models/page.tsx`, `app/(dashboard)/dashboard/page.tsx`.
6. **Jangan** menyentuh `.env*`, menulis API key, atau menjalankan `supabase/migrations/0009_drop_gamification.sql`.
7. **Tidak ada dependency baru** tanpa izin pemilik. `groq-sdk` sudah tidak dipakai kode (boleh diusulkan untuk dihapus, jangan dihapus sendiri).
8. **Teks UI dan komentar kode dalam bahasa Indonesia**, mengikuti gaya file di sekitarnya.
9. **Berhenti dan tanya** jika: plan bertentangan dengan kode, perlu menghapus fitur yang dipakai pengguna, perlu akses produksi, atau perubahan menyentuh > 40 file di luar fase.
10. **Verifikasi sebelum menyatakan selesai** (resep di bawah) dan laporkan output aslinya. Kalau gagal, katakan gagal.

---

## Pola yang WAJIB dipakai (sudah ada dari v2)

| Kebutuhan | Pakai | Lokasi |
|---|---|---|
| Memanggil AI | `runAI("<feature-key>", { messages, temperature?, max_tokens?, response_format? }, { userId })` → `{ content, ... }` | `lib/ai/run.ts` |
| Feature key AI baru | Tambah ke `AI_FEATURES` **dan** seed `ai_feature_routes` di migrasi fase (contoh: `0003_ai_registry.sql`) | `lib/ai/features.ts` |
| Auth di route API | `requireUser()` / `requireAdmin()` (mengembalikan `NextResponse` jika gagal) | `lib/auth.ts` |
| Rate limit route AI | `checkRateLimit(user.id, "<key>")` setelah `requireUser` (juga mengecek feature flag) | `lib/rate-limit.ts` |
| Halaman admin | `requireAdminPage()`; server action: `assertAdmin()` + return `ActionResult` | `app/(dashboard)/admin/_lib/guard.ts` |
| Aksi admin | Selalu `logAdminAction({ actorId, action, target, before, after })` | `lib/admin-audit.ts` |
| Tulis `system_config` / baca registry | `getServiceClient()` (service role, hanya server) | `lib/ai/admin-client.ts` |
| Komponen UI | `Button`, `ButtonLink`, `Card`, `CardTitle`, `Input`, `Badge`, `EmptyState`, `Skeleton`, `Tabs`, `ResponsivePanel` | `components/ui/` |
| Panel samping / bottom sheet | `ResponsivePanel` (samping ≥ 1024px, bottom sheet di bawahnya) | `components/ui/ResponsivePanel.tsx` |
| Reader | `TextDisplay` (paginated, `onPositionChange`, `jumpTo`), blok via `ReaderBlock` (memo) | `components/reader/` |
| Navigasi | Menu: `lib/menu-config.ts`; tab admin: `app/(dashboard)/admin/AdminTabs.tsx`; bottom nav: `components/MobileBottomNav.tsx` | |

**Aturan Next.js 16 yang sering terlewat:**
- `params` dan `searchParams` di page adalah **Promise** → `const p = await searchParams`.
- File `"use server"` hanya boleh mengekspor **fungsi async**. Konstanta/tipe taruh di file lain (contoh: `app/(dashboard)/admin/_lib/constants.ts`).
- Server Action bisa dipanggil langsung lewat POST → **selalu** cek auth di dalam action.
- `middleware.ts` sudah menjadi `proxy.ts`.

**Aturan lint React Compiler yang sering muncul:**
- Jangan panggil `Date.now()` / `Math.random()` langsung di badan komponen → pindahkan ke fungsi di luar komponen.
- `setState` sinkron di dalam `useEffect` ditandai lint. Jika memang perlu (mis. membaca `localStorage`/hash URL setelah mount), beri `// eslint-disable-next-line react-hooks/set-state-in-effect -- <alasan>`.
- Menulis `ref.current` saat render ditandai → lakukan di `useEffect`.

---

## Jebakan yang sudah diketahui (lingkungan Windows pemilik)

1. **Path terlalu panjang.** Jika repo berada di folder dengan path panjang, `npm run build` gagal ("path length ... exceeds max length"). `subst` tidak membantu (Tailwind membaca path asli). Solusi: build di salinan berpath pendek:
   ```powershell
   robocopy <repo> $env:TEMP\llb /MIR /XD .git .next /NFL /NDL /NJH /NJS /NP /MT:16
   cd $env:TEMP\llb; npm run build
   ```
   Hapus salinan setelah selesai. `git` butuh `core.longpaths=true`.
2. **Heredoc di Bash tool** bisa menelan backslash (`\b`, `\d`, `\\`) dan merusak skrip panjang. Untuk skrip/patch panjang, **tulis ke file dengan tool Write lalu jalankan**; untuk edit kode pakai tool Edit.
3. **Spasi di akhir baris** ada di banyak file lama; pencocokan string persis bisa gagal. Gunakan potongan yang unik tanpa baris kosong berspasi.
4. **CRLF:** peringatan "LF will be replaced by CRLF" normal, abaikan.
5. **Lint:** repo punya ±980 temuan lama (`any`, tanda kutip, dsb.). `npm run lint` **memang gagal sejak sebelum v2**. Kriterianya: **tidak ada temuan baru** dibanding HEAD (resep di bawah), bukan nol.
6. **Proses server** yang dijalankan di background kadang tetap hidup setelah dihentikan. Sebelum menjalankan server lagi, cek port (`Get-NetTCPConnection -LocalPort <port> -State Listen`) dan matikan hanya proses milikmu sendiri.

---

## Resep verifikasi

```bash
# 1. Tipe
npx tsc --noEmit -p .

# 2. Lint: bandingkan dengan HEAD (tidak boleh ada baris baru di NEW)
npx eslint . -f json > /tmp/after.json
git stash -u && npx eslint . -f json > /tmp/before.json; git stash pop
#   ringkas tiap file JSON menjadi "file | rule | pesan" (abaikan nomor baris), lalu `comm -13 before after`

# 3. Build (di path pendek, lihat jebakan #1)
npm run build

# 4. Uji unit logika murni (lib/*.ts) tanpa dependency baru:
node --experimental-transform-types --no-warnings path/ke/test.mts <path-repo>
#   di test: const m = await import(`file:///${repo}/lib/levels.ts`)
```

**Uji di browser tanpa login/database:** halaman yang butuh login tidak bisa dibuka (tidak ada `.env`, dilarang memakai akun produksi). Untuk komponen client (mis. reader), buat halaman uji **sementara di salinan build saja** (bukan di repo) dengan env palsu `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:9` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy`, lalu `next start` dan buka di browser pane. Path selain `/api/*` tidak diblok `proxy.ts`. Hapus salinan setelahnya.

---

## Fakta kode yang relevan untuk v3 (sudah dicek)

- **Menu:** `lib/menu-config.ts` berisi 56 item, 9 grup. Duplikasi nyata: `/tools/tone-analyzer` ("Tone & Grammar") dan `/tools/tone-detector`. `lib/tools-config.ts` punya 28 tool dinamis (dirender `app/(dashboard)/tools/[id]/page.tsx`), termasuk `essay-auditor` dan `case-study-generator` yang tidak ada di menu.
- **Teks:** tabel `texts` punya `difficulty TEXT DEFAULT 'intermediate'` (bebas), belum ada kolom CEFR.
- **Profil:** `profiles.cefr_level` diisi Placement Test (`app/api/placement-test/route.ts`, aksi `finalize` & `set_level`) atau Pengaturan. Placement Test adaptif per bagian (reading, grammar, vocabulary, listening) dengan `SECTION_PROMPTS`.
- **Estimasi level teks:** `app/api/analyze-difficulty/route.ts` sudah mengembalikan JSON `{ cefr, score, ..., explanation }` (feature key `analyze-difficulty`).
- **Kuis bab di reader:** dibuat oleh `generate-quiz` dan dipicu `TextDisplay` saat judul bab terlihat; **jawaban tidak disimpan** (hanya state `quizAnswered`). Fase 10 harus menambah route penyimpanan.
- **Evaluasi menulis:** `app/api/writing-challenge/evaluate/route.ts` mengembalikan `grammar_score`, `vocabulary_score`, `coherence_score`, `feedback`, `corrected_text` (belum ada estimasi CEFR).
- **Kosakata:** tabel `vocabulary` punya `mastery_level`, `repetition_count`, `next_review_at`, `context_sentence`, `context_source`; migrasi `0005` menambah `text_id`, `position_offset`. Upsert lewat `app/api/vocabulary/route.ts` (`onConflict: "user_id,word"`).
- **Posisi baca:** `reading_sessions.last_paragraph_index`/`progress_pct`/`source_key` (migrasi `0005`); buku Gutenberg memakai `source_key = "gutenberg_<id>"`.
- **Terjemahan:** tabel `translations` (passage, user_translation, ai_feedback, feedback_score). Translation Workshop punya 4 mode evaluasi di `app/api/translation/route.ts` (`MODES`).
- **Feature flag:** `system_config.features[featureKey] === false` mematikan fitur (dicek di `checkRateLimit` dan `runAI`).
- **Migrasi yang ada:** `0000`–`0005` (v2) dan `0009` (drop gamifikasi, jangan dijalankan). Nomor berikutnya: `0006`, `0007`, `0008`, `0010`.
- **Mode kelas dibatalkan** oleh pemilik (31 Okt 2026). Jangan membuat role `lecturer`, kelas, atau tugas.
- **`AGENTS.md` tidak ada di repo** (diabaikan `.gitignore`). Panduan Next.js ada di `node_modules/next/dist/docs/`. Aturan sesi ringkas ada di `CLAUDE.md` (root).

---

## Format laporan akhir sesi

```
Fase: N
Commit: <hash> (lokal / sudah di-push)
Yang selesai: (daftar langkah plan, mis. 8.1, 8.2 …)
Yang belum / dilewati + alasan:
Migrasi baru (belum dijalankan): 00NN_nama.sql
Hasil tsc / lint (temuan baru vs HEAD) / build: (ringkasan output asli)
Hasil uji unit: (jumlah lulus/gagal)
Hal yang perlu diputuskan pemilik:
```

Setelah fase selesai, perbarui tabel status di `docs/SESSION_HANDOFF.md`.

---

## Titik review oleh pemilik

| Setelah | Cek |
|---|---|
| Fase 8 | Daftar akun baru → onboarding → beranda. Setujui daftar konsolidasi alat. Menu di HP. |
| Fase 9 | Jalankan migrasi `0006`, `0007`; jalankan skrip impor NGSL; tandai level beberapa teks; buat 1 teks AI dan terbitkan. |
| Fase 10 | Jalankan `0008`; kerjakan kuis bab & Grammar Clinic beberapa kali; cek profil "Progres menuju …"; coba Tes Naik Level. |
| Fase 11 | Jalankan `0010`; buat proyek terjemahan, anotasi teknik, nilai dengan rubrik, ekspor CSV. |
