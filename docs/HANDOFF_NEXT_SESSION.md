# Handoff sesi — Literary Language Lab (1 November 2026)

> Untuk sesi/model berikutnya (model apa pun, bukan hanya Claude). Dokumen ini berdiri sendiri: baca ini dulu,
> lalu dokumen yang ditunjuk. Semua fakta di bawah sudah dicek di kode/di sesi ini.
> Ditulis oleh sesi yang mengerjakan v3 Fase 8–11 dan v4 Fase 14g.

---

## 1. Keadaan repo saat ini

| | |
|---|---|
| Lokasi (Windows) | `C:\dev\literarylanguagelab` (path pendek, wajib; path panjang membuat build gagal) |
| Remote | `https://github.com/Finarfin12/literarylanguagelab.git`, branch `main` |
| HEAD | `804553b` (semua sudah di-push, working tree bersih) |
| Identitas git (WAJIB) | `finarfin112 <finarfinar112@gmail.com>`. Vercel (Hobby) memblokir deploy dari penulis lain. Cek: `git config user.email` |
| Produksi | `https://literarylanguagelab.my.id` (Vercel, deploy otomatis dari `main`) |
| Stack | Next.js 16.2 (App Router, Turbopack), React 19, Supabase, Tailwind v4, TypeScript |
| Node | v24 |
| Bahasa | Teks UI dan komentar kode **bahasa Indonesia** |

Riwayat penting (terbaru dulu): `804553b` kamus tahan gangguan · `3e8ffbf` flashcard + markdown · `d81d363` Fase 14g ·
`dc29ee3` LingoWise di Sidebar · `5ff2160` Fase 11 · `b056c14` Fase 10 · `4750b55` Fase 9 · `a85dd7d` Fase 8.
Sisanya commit dokumen v4 (`docs/v4/*`).

## 2. Aturan kerja (ringkas; rinci di dokumen yang ditunjuk)

Sumber: `CLAUDE.md` (root), `docs/v3/HANDOFF.md` (aturan, pola wajib, jebakan, resep verifikasi), `docs/v4/HANDOFF.md`.

1. **Satu fase per sesi, satu commit per fase, di `main`.** Commit lokal boleh tanpa tanya; **push selalu tanya pemilik dulu**.
2. **Tidak ada akses database dan tidak ada `.env`.** Migrasi hanya ditulis ke `supabase/migrations/NNNN_*.sql`, **tidak dijalankan**. Jangan login ke Supabase/produksi. Jangan menyentuh `.env*`.
3. **Kode harus jalan sebelum migrasi dijalankan**: tangkap error kolom/tabel hilang (`42703`, `PGRST204`, `42P01`, `PGRST205`) dan turun ke perilaku lama.
4. **Tidak ada dependency baru** tanpa izin pemilik.
5. **AI selalu lewat `runAI()`** (`lib/ai/run.ts`); feature key baru → `lib/ai/features.ts` **dan** seed `ai_feature_routes` di migrasi.
6. **Auth**: route API `requireUser()`/`requireAdmin()` (`lib/auth.ts`); halaman admin `requireAdminPage()`; server action `assertAdmin()` + `logAdminAction()`. Server Action bisa dipanggil langsung lewat POST, jadi **selalu cek auth di dalamnya**.
7. **Tidak ada gamifikasi** (XP, streak, peringkat) — keputusan produk v2. Mode kelas dibatalkan.
8. **v4: redesign hanya mengubah tampilan. Jangan menghapus, menggabung, atau mengurangi fitur.** Daftar periksa: `docs/v4/FEATURE_INVENTORY.md`. Ragu → tanya pemilik.
9. **Michelangelus hanya lewat `local()`** (lisensi Microsoft 365). Jangan pernah meng-commit atau meng-host file fontnya.
10. Berhenti dan tanya jika: plan bertentangan dengan kode, perlu menghapus fitur yang dipakai pengguna, perlu akses produksi, atau perubahan menyentuh > 40 file di luar fase.

## 3. Yang sudah selesai

| Fase | Isi | Migrasi |
|---|---|---|
| v2 Fase 0–7 | Keamanan, registry AI, OCR, admin, reader ringan, hapus gamifikasi | 0000–0005, 0009 |
| v3 Fase 8 | Onboarding, menu per tujuan belajar, Tone & Gaya (Tone Detector digabung), "Coba dengan contoh", beranda "Langkah berikutnya", landing | 0006 |
| v3 Fase 9 | Library berjenjang CEFR, tab admin **Konten**, Kosakata Inti (NGSL), Grammar Dasar (20 topik), adaptasi level | 0007 |
| v3 Fase 10 | Level per keterampilan, bukti kemampuan, **Tes Naik Level** (dinilai di server), kartu level di profil | 0008 |
| v3 Fase 11 | Ruang Kerja Segmen, anotasi teknik (Molina & Hurtado Albir), rubrik Nababan, tahap penerjemah, ekspor CSV | 0010 |
| v4 Fase 14g | Definisi & bentuk kata NGSL di Kosakata Inti (`scripts/enrich-ngsl.mjs`) | 0015 |
| Perbaikan | LingoWise di Sidebar desktop; Mode Flashcard kosong; komponen `Markdown`; Lexicon Search & A-Z tahan gangguan | — |

Uji unit (jalankan satu per satu, lihat §6): `cefr` 8, `levels` 17, `next-step` 8, `translation` 21, `ngsl-enrich` 13, `core-words` 10.

## 4. Status migrasi

| Migrasi | Status | Catatan |
|---|---|---|
| 0000–0005, 0009 | **Sudah dijalankan** | dikonfirmasi pemilik |
| 0006 onboarding | Sudah dijalankan (halaman `/onboarding` aktif di produksi) | |
| 0007 graded content | Sudah dijalankan (`core_words` terisi 2.800 kata dari NGSL) | |
| 0008 skill levels | **Belum dikonfirmasi** | butuh juga `SUPABASE_SERVICE_ROLE_KEY` di Vercel untuk Tes Naik Level |
| 0010 translation academic | **Belum dikonfirmasi** | |
| 0015 core_words enrichment | **Belum dijalankan** | lalu jalankan `scripts/enrich-ngsl.mjs` (lihat §5) |
| 0011–0014, 0016 | Belum ditulis | direncanakan di v4 (14f, Fase 15–18) |

## 5. Tindakan yang menunggu PEMILIK (bukan pekerjaan kode)

1. **URGEN — ganti service role key Supabase.** Nilainya sempat terlihat penuh di tangkapan layar PowerShell di sesi ini. Buat/ganti kunci di Supabase (Project Settings → API/JWT keys), lalu perbarui `SUPABASE_SERVICE_ROLE_KEY` di Vercel dan deploy ulang. Jangan pernah menulis kunci di baris perintah yang akan di-screenshot atau dibagikan.
2. Jalankan `0008` dan `0010` di Supabase SQL Editor jika belum.
3. Jalankan `0015`, lalu pengayaan Kosakata Inti. File definisi aslinya xlsx; skrip hanya membaca CSV UTF-8 (Excel → Save As → CSV UTF-8). Jalankan **dari folder proyek**:
   ```powershell
   cd C:\dev\literarylanguagelab
   $env:NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
   $env:SUPABASE_SERVICE_ROLE_KEY="<kunci-baru>"
   node scripts/enrich-ngsl.mjs --definitions "<path-csv-definisi>" --forms "C:\Users\iihid\Downloads\NGSL_1.2_lemmatized_for_teaching.csv" --dry-run
   ```
   Hasil dry-run yang benar: ±2.800 kata diperbarui dan ±2.800 berdefinisi. Ulangi tanpa `--dry-run`. (Kesalahan umum: memakai path contoh `C:\path\defs.csv` apa adanya.)
4. Cek di Vercel: **Function Region** sebaiknya sama dengan region Supabase (jarak jauh membuat tiap halaman lambat; onboarding terasa lama).
5. Setelah deploy terbaru: cek A-Z Browser dan Lexicon Search. Jika masih gagal, minta status permintaan `browse?letter=…` dari tab Network DevTools.
6. Titik review yang tertunda: Fase 9 (tandai level beberapa teks, buat 1 teks AI, terbitkan), Fase 10 (coba Tes Naik Level — angka syarat bisa diperkecil lewat `system_config.level_rules`, mis. `minTexts` jadi 1), Fase 11 (buat proyek terjemahan, anotasi, rubrik, ekspor CSV).

## 6. Resep verifikasi (sebelum menyatakan fase selesai)

```bash
# 1. Tipe
npx tsc --noEmit -p .

# 2. Lint: tidak boleh ada temuan BARU (repo punya ±370 temuan lama; kriteria bukan nol)
#    Buat baseline di HEAD yang bersih SEBELUM mengubah apa pun:
npx eslint . -f json > before.json
#    ... kerjakan fase ...
npx eslint . -f json > after.json
node scripts/lint-diff.mjs before.json after.json     # exit 0 = tidak ada temuan baru

# 3. Build (env palsu cukup; path repo harus pendek)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:9 NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy npm run build

# 4. Uji unit logika murni (jalankan masing-masing; argumen = path repo)
node --experimental-transform-types --no-warnings tests/levels.test.mts "$(pwd -W)"
#    ganti nama file: cefr, levels, next-step, translation, ngsl-enrich, core-words
```

Uji visual tanpa login (login/DB tidak tersedia): jalankan `next dev -p <port>` dengan env palsu di atas, buat **halaman uji sementara** di `app/zz-xxx/page.tsx` yang merender komponen dengan data contoh, buka di browser (cek 375px dan 1280px, terang dan gelap lewat `document.documentElement.classList.toggle('dark')`), lalu **hapus halaman uji dan matikan server** sebelum commit. Detail dan pemeriksaan otomatis (luapan horizontal, kontras, target sentuh): `docs/v4/HANDOFF.md` bagian "Uji visual tanpa login".

## 7. Rencana berikutnya (v4) dan urutan yang disepakati

Dokumen: `docs/v4/PRD.md`, `DESIGN.md` (acuan visual tunggal), `IMPLEMENTATION_PLAN.md`, `FEATURE_INVENTORY.md`, `HANDOFF.md`.

**Urutan:** ~~14g~~ (selesai) → **12** → **13** → *(titik henti: pemilik mencoba navigasi baru)* → 14a–14f → 15 → 16 → 17 → 18.

- **Fase 12** (fondasi desain): token warna/huruf, komponen dasar, skrip `scripts/v4-restyle.mjs` (jalankan `--dry-run` dulu, tunjukkan laporan, baru sungguhan). Alegreya adalah huruf yang dilihat hampir semua pengguna; setel tata letak dengan Alegreya.
- **Fase 13** (navigasi & tiga Ruang): mulai dari `tests/menu-coverage.test.mts`. Bottom nav sudah diputuskan: **Beranda · Baca · Kosakata · Ruang · Menu**. Tombol LingoWise AI di Sidebar (`dc29ee3`) harus dibawa ke susunan baru. Tanyakan pemilik daftar **5 alat** yang dipindah ke "Lainnya" sebelum commit. Cookie penanda onboarding (13.5).
- **Fase 14e** memuat pembuatan `public/sw.js` manual (cara A).

### Tiga celah di dokumen v4 yang ditemukan sesi ini (perbaiki di dokumen sambil jalan)

1. **`v4-restyle` hanya memproses `className`/`cn(...)`**, padahal ±46 baris warna kategori ada di luar itu (objek data seperti `color: "text-blue-400"` di `admin/page.tsx`, `dashboard/page.tsx`, `listening-test`, `placement-test`, `flashcard` `borderClass`, kemungkinan `lib/menu-config.ts`). Skrip harus memproses **setiap string literal** `.ts`/`.tsx` yang cocok pola kelas warna (termasuk varian `dark:`, `hover:`, sufiks `/10`), dengan daftar pengecualian, dan dry-run melaporkan temuan di luar `className`.
2. **Cookie `lll_onboarded=1` tidak terikat pengguna** (Fase 13.5): pengguna B di browser yang sama dengan A melewati onboarding. Isi cookie dengan id pengguna (atau hash) dan cocokkan.
3. **`public/sw.js`: aturan saling bertentangan** (Fase 14e): "navigasi network-first jatuh ke cache" vs "jangan cache halaman yang butuh login". Pra-cache hanya `/offline`, ikon, dan `/_next/static/*`; saat offline arahkan ke `/offline`, jangan sajikan halaman dari cache.

## 8. Fakta teknis & jebakan yang sudah terbukti

**Next.js 16 / Tailwind v4**
- `middleware.ts` → `proxy.ts`. `params`/`searchParams` adalah **Promise**. File `"use server"` hanya boleh mengekspor fungsi async (tipe boleh).
- `proxy.ts` menyalin path ke header request `x-pathname` (dibaca `app/(dashboard)/layout.tsx` untuk redirect onboarding).
- Build memakai **Turbopack**: plugin `@ducanh2912/next-pwa` (webpack) **tidak membuat `sw.js`**, jadi `PwaRegister.tsx` mendaftarkan `/sw.js` yang 404. Mencoba `next build --webpack` membuat `sw.js` tetapi **gagal tipe** di tiga halaman yang masih menulis `params` bukan Promise (`clubs/[id]`, `read/[textId]`, `p/[username]`) dan meninggalkan `.next/types` basi yang membuat `tsc` error — **hapus folder `.next`** setelah percobaan.
- Tailwind v4: kelas v3 `perspective-1000`, `transform-style-3d` **tidak ada** (pakai `[perspective:1000px]`, `transform-3d`; `backface-hidden`, `rotate-y-180` ada). Typography lewat `@plugin "@tailwindcss/typography"` di `globals.css`.
- React Compiler lint: jangan `Date.now()`/`Math.random()` di badan komponen; `setState` sinkron di `useEffect` ditandai (beri `eslint-disable-next-line react-hooks/set-state-in-effect -- alasan` jika memang perlu).

**Windows / alat**
- Path repo harus pendek. CRLF: peringatan "LF will be replaced by CRLF" normal.
- **`.gitignore` mengabaikan `*.md`** → file markdown **baru** harus `git add -f`. File `.md` yang sudah ter-track aman.
- Heredoc di shell sering menelan backslash; untuk skrip/patch panjang **tulis ke file lalu jalankan** atau pakai alat edit. Skrip Python yang mengedit file TS dengan string berisi `\n` pernah merusak regex/literal; gunakan raw string atau alat edit dan verifikasi dengan `tsc`.
- Server dev di latar belakang kadang tetap hidup: cek port (`Get-NetTCPConnection -LocalPort <port> -State Listen`) dan matikan hanya prosesmu.

**Data & skema**
- Baris `translation_memory` dipakai kode dengan kolom `source_phrase`/`translated_phrase`, sedangkan `0000_baseline.sql` menulis `source_text`/`target_text`. Kode baru membaca keduanya; periksa skema asli di Supabase.
- `texts`: draft memakai `is_public=false` + `status='draft'` (Library memfilter `is_public=true`). RLS `texts` tidak terlihat dari repo.
- `core_words` sudah terisi dari NGSL 1.2 (peringkat ≤ 2800; `TRUE`/`FALSE` Excel disimpan huruf kecil). Kolom `definition_en`/`forms` dari 0015.
- Pemetaan band→CEFR (disetujui pemilik): 1–500 A1, 501–1000 A2, 1001–2000 B1, 2001–2800 B2 (`lib/cefr.ts`).
- Feature flag (`system_config.features`): key yang **belum terdaftar dianggap aktif** (`lib/ai/flags.ts`).
- Key AI yang ditambahkan: `graded-text-generate`, `level-test`, `translation-rubric`, `translation-technique-suggest` (sudah di `lib/ai/features.ts` dan seed migrasi).
- Tes Naik Level: soal+kunci di `level_test_sessions` (hanya service role), penilaian di server, cooldown dari sesi tes, bukti keterampilan bisa dipalsukan pengguna sendiri (hanya memengaruhi kelayakan membuka tes).
- Layanan pihak ketiga tanpa kunci (kadang lambat/mati): `dictionaryapi.dev`, Datamuse, LibreTranslate publik, OpenLibrary, Gutendex. Jangan menganggap kegagalan = "tidak ditemukan".

**Komponen/lib bersama yang sebaiknya dipakai ulang**
`components/ui/` (`primitives.tsx`: Button, Card, CardTitle, Input, Badge, EmptyState, Skeleton; `Tabs`, `ResponsivePanel`, `TryExampleButton`, **`Markdown`** untuk teks hasil AI), `lib/menu-config.ts` (`getGroupedMenu`, `PINNED_PATHS`, `advanced`), `lib/next-step.ts`, `lib/levels.ts`, `lib/skill-evidence.ts`, `lib/core-words.ts`, `lib/translation/*`, `utils/supabase/get-user.ts` (`getRequestUser`, satu `getUser` per request).

## 9. Pekerjaan kecil yang belum dikerjakan (tidak termasuk fase mana pun)

- Peringatan Recharts "width(-1) and height(-1)" di grafik Beranda (`components/dashboard/VocabChart.tsx`): tambah `minWidth={0} minHeight={0}` pada `ResponsiveContainer`. Tidak merusak fungsi.
- Alat tambahan ke "Lainnya" agar menu utama ≤ 30 item (saat ini ±40): ditangani di Fase 13.5 setelah persetujuan pemilik.
- Ekspor DOCX untuk Ruang Kerja Segmen; pengelolaan teknik penerjemahan dari Admin (sekarang hanya lewat SQL).
- Cookie onboarding (lihat celah #2) untuk mengurangi satu query per perpindahan halaman.

## 10. Panduan khusus untuk model non-Claude

- Dokumen proyek mengacu pada nama alat Claude (mis. "Artifact", "ToolSearch") hanya di bagian sistem sesi; **tidak ada yang dibutuhkan repo ini**. Yang dibutuhkan: shell, baca/tulis file, `git`, `node`/`npm`, dan idealnya browser untuk uji visual.
- Jangan mengubah `.env*`, jangan login ke produksi, jangan memaksa push (`--force`); jika push ditolak karena ada commit baru dari sesi lain, lakukan `git pull --rebase origin main` lalu push ulang.
- Tulis **laporan akhir fase** dengan format di `docs/v4/HANDOFF.md` ("Format laporan akhir sesi") dan perbarui tabel status di `docs/SESSION_HANDOFF.md`.
- Jika satu perintah menghasilkan output aneh (path Windows, backslash), ulangi dengan perintah yang lebih sederhana dan periksa hasilnya dengan `git diff --stat`.

## 10b. Khusus sesi Claude Code

- `CLAUDE.md` di root dimuat otomatis dan sudah menunjuk ke dokumen ini. Memori proyek Claude untuk folder ini ada di `C:\Users\iihid\.claude\projects\C--dev-literarylanguagelab\memory\` (status ringkas dan preferensi).
- Mulai sesi di folder `C:\dev\literarylanguagelab` (bukan di scratch workspace), supaya `CLAUDE.md` dan memori terbaca.
- Preferensi pemilik: pekerjaan coding cukup dengan **Sonnet**; model yang lebih kuat untuk perencanaan, PRD, dan dokumen handoff.
- Pakai alat bawaan untuk file (Read/Edit/Write/Grep/Glob), bukan `cat`/`sed`/heredoc, terutama untuk file berisi backslash atau templat string. Gunakan daftar tugas (task list) untuk fase yang punya banyak langkah.
- Uji visual: jalankan `next dev -p <port>` dengan env palsu, lalu pakai browser pane bawaan (navigate, find, screenshot, `javascript_tool`) pada halaman uji sementara di `app/zz-xxx/`; hapus sebelum commit.
- Tidak perlu membuat Artifact untuk pekerjaan repo ini. Jangan membuka layanan yang butuh otorisasi.
- Setelah selesai satu fase: commit lokal, tulis laporan akhir (format di `docs/v4/HANDOFF.md`), lalu **tanya pemilik sebelum push** (pemilik biasanya menjawab "Push").

## 11. Prompt pembuka sesi berikutnya (tempel apa adanya, lalu tambahkan nama fase)

```
Kamu adalah engineer di repo "Literary Language Lab" (Next.js 16.2, React 19, Supabase, Tailwind v4, TypeScript)
di C:\dev\literarylanguagelab. Identitas git: finarfin112 <finarfinar112@gmail.com>.

Baca dulu, berurutan:
1. docs/HANDOFF_NEXT_SESSION.md (dokumen ini: keadaan, aturan, jebakan, resep verifikasi)
2. CLAUDE.md
3. docs/v4/HANDOFF.md (aturan v4 dan prompt per fase)
4. docs/v3/HANDOFF.md bagian "Pola yang WAJIB dipakai" dan "Jebakan"
5. docs/v4/PRD.md, docs/v4/DESIGN.md, docs/v4/FEATURE_INVENTORY.md
6. docs/v4/IMPLEMENTATION_PLAN.md bagian fase yang saya sebut
7. docs/SESSION_HANDOFF.md (status & migrasi)

ATURAN UTAMA: redesign v4 hanya mengubah tampilan. Jangan menghapus, menggabung, atau mengurangi fitur apa pun.
Mulai dengan membuat baseline lint (npx eslint . -f json > before.json) di HEAD yang bersih.
Satu fase per sesi, satu commit, push hanya setelah saya setuju. Kerjakan HANYA fase yang saya sebut.

Fase: <isi, mis. "Fase 12 (Fondasi desain v4)">
```
