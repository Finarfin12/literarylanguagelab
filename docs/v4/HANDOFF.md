# Handoff — Pengerjaan Literary Language Lab v4 (untuk Claude Sonnet 5)

> Instruksi kerja untuk sesi coding yang mengerjakan [PRD.md](PRD.md) dan [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).
> Tempel **"Prompt pembuka"** di awal sesi, lalu satu **"Prompt per fase"**. Satu sesi = satu fase (Fase 14: satu sub-fase per sesi).
> Pola kode, jebakan Windows, dan resep verifikasi **sama dengan v3** — lihat [../v3/HANDOFF.md](../v3/HANDOFF.md). Dokumen ini hanya menambah aturan v4.

---

## Prompt pembuka (tempel di awal setiap sesi)

```
Kamu adalah engineer di repo "Literary Language Lab" (Next.js 16.2, React 19, Supabase, Tailwind v4, TypeScript).

Baca dulu, berurutan:
1. docs/v4/HANDOFF.md (aturan v4)
2. docs/v3/HANDOFF.md bagian "Aturan kerja", "Pola yang WAJIB dipakai", "Jebakan", "Resep verifikasi"
3. docs/v4/PRD.md
4. docs/v4/DESIGN.md (sistem desain: acuan visual tunggal — warna, huruf, komponen, pola halaman)
5. docs/v4/FEATURE_INVENTORY.md (daftar periksa wajib)
6. docs/v4/IMPLEMENTATION_PLAN.md bagian fase yang saya sebut
7. docs/SESSION_HANDOFF.md (status & migrasi)

ATURAN UTAMA: redesign hanya mengubah tampilan. Jangan menghapus, menggabung, atau mengurangi fitur apa pun.
Kerjakan HANYA fase yang saya sebut.
```

---

## Prompt per fase

**Urutan:** 14g → 12 → 13 → *(titik henti: pemilik mencoba navigasi baru)* → 14a–14f → 15 → 16 → 17 → 18.

**Fase 12** — `Kerjakan Fase 12 (Fondasi desain v4) sesuai docs/v4/DESIGN.md. Warna & huruf sudah diputuskan di DESIGN.md; jika ingin menyimpang, tanya dulu. Michelangelus HANYA lewat local() — jangan menaruh file fontnya di repo.`

**Fase 12** juga: `Kerjakan 12.4 dengan scripts/v4-restyle.mjs --dry-run dulu, tunjukkan laporannya, baru jalankan sungguhan. Pemetaan warna di DESIGN.md §3.4.`

**Fase 13** — `Kerjakan Fase 13 (Navigasi & tiga Ruang). Mulai dari tests/menu-coverage.test.mts. Q1 sudah diputuskan (Beranda · Baca · Kosakata · Ruang · Menu). Tanyakan daftar 5 alat yang dipindah ke "Lainnya" sebelum commit.`

**Fase 14a / 14b / 14c / 14d / 14e** — `Kerjakan Fase 14<x> saja. Sebelum mengubah file, tulis daftar baris FEATURE_INVENTORY yang disentuh sub-fase ini. Di akhir, centang setiap baris beserta cara mengujinya.`
(14b juga: `Mulai dari lib/reader/drag-fab.ts dan uji unitnya, baru komponen MagicWandButton.`)

**Fase 14f** — `Kerjakan Fase 14f (lima route API: perbaiki & pakai). Mulai dari lib/idioms dan uji unitnya. Tulis migrasi 0011_profile_cascade.sql tapi jangan jalankan. Pencarian OpenLibrary dan Gutendex JANGAN diubah: /api/gutenberg/search hanya ditambahkan sebagai opsi ketiga. Hapus akun harus tetap berperilaku sama bagi pengguna.`

**Fase 14g** — `Kerjakan Fase 14g (Pengayaan Kosakata Inti NGSL). Mulai dari scripts/lib/ngsl-enrich.mjs dan uji unitnya. Tulis migrasi 0015_core_words_enrichment.sql tapi jangan jalankan. Skrip hanya UPDATE baris core_words yang ada — jangan INSERT dan jangan ubah band/cefr_estimate. File NGSL tidak di-commit.`

**Fase 15** — `Kerjakan Fase 15 (Mesin latihan + review grammar). Mulai dari lib/exercises/* dan uji unitnya. Latihan kalimat bebas yang lama di halaman topik grammar TETAP ada.`

**Fase 16** — `Kerjakan Fase 16 (Kursus Dasar). Mulai dari lib/course.ts dan uji unitnya. Unit tidak dikunci.`

**Fase 17** — `Kerjakan Fase 17 (Modul penutur Indonesia). Tulis penjelasan sendiri dalam bahasa Indonesia; jangan menyalin buku teks.`

**Fase 18** — `Kerjakan Fase 18 (Paket konten Kursus Dasar). Tulis 20 bacaan asli A1–A2 dan isi 12 unit di migrasi 0016_course_content.sql sebagai draft; jangan jalankan. Jangan menyalin teks berhak cipta. Laporkan jumlah kata dan cakupan NGSL per bacaan. Lalu buat jalur 2 (AI per unit & massal) dan jalur 3 (Tulis sendiri) serta lib/graded-check.ts dengan uji unitnya. Tombol AI lama di Admin → Konten jangan diubah.`

---

## Aturan v4 (tambahan atas aturan v3)

1. **Tidak ada penghapusan fitur.** Yang dilarang selama redesign:
   - menghapus tombol, tab, mode, pilihan, panel, shortcut, atau halaman yang memicu fitur;
   - menggabung dua fitur menjadi satu tanpa persetujuan pemilik;
   - mengubah handler, state, panggilan API, nama route, atau teks yang bermakna fitur (mis. nama mode) di sub-fase redesign;
   - menyembunyikan fitur sampai tidak bisa dijangkau (≤ 2 ketukan dari navigasi).
   Jika menurutmu sebuah fitur sebaiknya digabung/dihapus: **berhenti dan tanya pemilik**.
2. **Perubahan perilaku yang diizinkan hanya**: Tongkat Ajaib bisa digeser (PRD §5.4), pintu masuk LingoWise desktop (§5.2), halaman ruang & menu baru (§5.2), lima route API yang dihidupkan (Fase 14f), pengayaan Kosakata Inti (Fase 14g, PRD §6.5), service worker PWA (`public/sw.js`, 14e, K9), cookie onboarding & 5 alat ke "Lainnya" (13.5), flag `kursus_dasar` menyembunyikan Kursus Dasar sampai konten siap (16.4), dan fitur Kursus Dasar (§6).
3. **Daftar periksa per fase**: salin baris [FEATURE_INVENTORY.md](FEATURE_INVENTORY.md) yang relevan ke laporan, centang setelah diuji, sebut cara mengujinya. Fitur baru yang kamu buat → tambahkan barisnya ke inventaris di commit yang sama.
4. **Ubah kelas, bukan struktur.** Redesign utamanya mengganti kelas Tailwind & markup pembungkus. Jika struktur komponen harus berubah, pindahkan handler & state apa adanya.
5. **Semua tema**: setiap halaman diuji terang & gelap; reader juga sepia & kontras tinggi.
6. **DESIGN.md adalah acuan visual tunggal.** Mockup ada di kanvas pribadi pemilik (link di PRD). Jika tool Artifact tersedia di sesimu dan akunmu sama, kamu boleh membacanya (`read`); jika tidak, ikuti deskripsi di PRD §5. Mockup adalah arah, bukan spesifikasi piksel.

---

## Uji visual tanpa login (wajib untuk Fase 12–14)

Halaman asli butuh login dan database, yang tidak tersedia di sesi (dan dilarang memakai akun produksi). Untuk melihat hasil redesign:

1. Salin repo ke path pendek (`robocopy … /XD .git .next`), lalu di **salinan saja** buat halaman uji sementara mis. `app/v4-preview/page.tsx` yang merender komponen yang diubah dengan data contoh (props statis). Komponen yang mengambil data sendiri: render bagian presentasinya, atau beri data contoh lewat props.
2. Buat `.env.local` palsu di salinan: `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:9`, `NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy`.
3. `npm run build` lalu `npx next start -p <port>`; buka di browser pane, cek **375px dan 1280px**, tema terang & gelap (`document.documentElement.classList.toggle('dark')`).
4. **Pemeriksaan otomatis dulu, visual manual hanya halaman kunci.** ±100 halaman × 2 lebar × beberapa tema tidak realistis dicek dengan mata. Di halaman uji, jalankan skrip kecil lewat `javascript_tool` di setiap halaman/komponen:
   - luapan horizontal di 375px: `document.documentElement.scrollWidth > document.documentElement.clientWidth`, plus daftar elemen yang `getBoundingClientRect().right > innerWidth`;
   - kontras: untuk elemen teks yang terlihat, hitung rasio dari `getComputedStyle(el).color` dan latar efektifnya; laporkan yang < 4.5 (teks normal) / < 3 (teks ≥ 24px atau tebal ≥ 19px);
   - target sentuh: tombol/tautan dengan tinggi atau lebar < 44px di 375px.
   Cek visual manual (screenshot) cukup untuk halaman kunci: Beranda, halaman ruang, reader + Word Lookup + Tongkat Ajaib, Kosakata Inti, satu alat dinamis, Translation Workshop, Pengaturan, Admin Ringkasan.
5. Matikan server (cek port, hentikan hanya proses milikmu), hapus salinan. **Jangan commit halaman uji.**

Contoh yang sudah berhasil dipakai di v2: halaman uji reader dengan buku sintetis 4.840 blok untuk mengukur performa (render awal 13,7 s → 0,18 s).

---

## Fakta kode baru untuk v4 (dicek di `5ff2160`; diperbarui sampai `dc29ee3` dan dokumen sampai `bed0cb4`)

- Font sekarang: `Inter` (`--font-sans`) dan `Merriweather` (`--font-serif`) di `app/layout.tsx` via `next/font/google`. Target: Source Sans 3 + Michelangelus (`local()`) → Alegreya (DESIGN.md §2).
- **Michelangelus**: © Gusto IDS, lisensi Microsoft 365, tidak ada izin webfont (`fsType = 0`, "All rights reserved"). Jangan pernah meng-commit atau meng-host file fontnya.
- `app/globals.css`: token di `:root` dan `.dark`; `body` punya `background-image` radial gradient (glow) — target pembersihan Fase 12.
- Menu: `lib/menu-config.ts` dengan `MenuItem.advanced`, `PINNED_PATHS`, grup "Lainnya" diisi otomatis dari item `advanced`. Tone Detector sudah digabung ke `/tools/tone-analyzer` (mode Deteksi Nada) dengan redirect di `next.config.ts`.
- **LingoWise AI** sudah punya tombol di Sidebar desktop sejak `dc29ee3` (K1 selesai). Fase 13 harus membawanya ke susunan Sidebar baru.
- **PWA:** `components/PwaRegister.tsx` mendaftarkan `/sw.js`, tapi `public/sw.js` tidak ada dan build Turbopack tidak membuatnya → pendaftaran gagal diam-diam (K9). Diperbaiki di 14e dengan `public/sw.js` manual.
- **Feature flag:** `lib/ai/flags.ts` — key yang belum terdaftar dianggap **aktif**; untuk menyembunyikan fitur baru, seed key bernilai `false` di migrasi.
- Toolkits Hub (`/tools`) menampilkan ke-28 alat `lib/tools-config.ts` (termasuk `essay-auditor`, `case-study-generator`).
- Tongkat Ajaib saat ini: tombol `fixed bottom-24 right-4 md:bottom-8 md:left-8` di `components/reader/TextDisplay.tsx` (cari "Floating Action Button for Inspect Mode"), state `isInspectMode`.
- SRS: `calculateSM2` di `lib/spaced-repetition.ts`. Skenario dialog: `lib/dialogue-scenarios.ts`. TTS: `/api/tts`. STT: `hooks/useSpeechToText.ts`.
- `grammar_topics.slug` adalah primary key (migrasi `0007`); status selesai topik saat ini di `localStorage` (`lib/grammar-progress.ts`).
- Migrasi terakhir: `0010_translation_academic.sql`. Berikutnya `0011` (cascade profil, 14f), lalu `0012`–`0014` (Fase 15–17), dan `0015` (pengayaan `core_words`, 14g).
- `core_words` **sudah terisi** oleh pemilik dari "NGSL 1.2 with basic statistics" (2.809 kata; header `Lemma,SFI Rank,…`; `TRUE`/`FALSE` dari Excel tersimpan sebagai `true`/`false`). Kolomnya: `word, band, cefr_estimate, pos, example`. Pembaca: `vocabulary/core/page.tsx`, `vocabulary/core/actions.ts`, `admin/content/page.tsx`.
- Endpoint tanpa pemanggil UI: `/api/analyze-tone`, `/api/detect-idioms`, `/api/gutenberg/search`, `/api/wotd`, `/api/auth/delete-account` — **pemilik memutuskan: perbaiki & pakai** (Fase 14f).
- Hapus akun di `settings/page.tsx` memakai `supabase.rpc('delete_user')` (tidak ada di migrasi). FK `profiles.id → auth.users` di baseline tanpa `ON DELETE CASCADE`.
- Ekspor CSV "translations" di Pengaturan membaca `translation_submissions` (tidak ada di migrasi; baseline punya `translations`).

---

## Format laporan akhir sesi

```
Fase: N (sub-fase)
Commit: <hash> (lokal / sudah di-push)
Yang selesai: (langkah plan)
Baris FEATURE_INVENTORY yang disentuh: (daftar + cara uji + ✅/❌)
Fitur yang hilang atau berubah perilaku: (harus "tidak ada", kecuali perubahan yang diizinkan PRD)
Migrasi baru (belum dijalankan):
Hasil tsc / lint (temuan baru vs HEAD) / build / uji unit:
Uji visual: (375px & 1280px, terang & gelap — halaman uji apa)
Hal yang perlu diputuskan pemilik:
```

Setelah fase selesai, perbarui tabel status di `docs/SESSION_HANDOFF.md`.

---

## Titik review oleh pemilik

| Setelah | Cek |
|---|---|
| Fase 12 | Setujui tabel warna & huruf; buka beberapa halaman di HP: kesan sudah "perpustakaan"? |
| Fase 13 | Telusuri tiga ruang & `/ruang`; pastikan alat favoritmu masih ada; setujui daftar 5 alat ke "Lainnya" |
| Fase 14x | Telusuri halaman sub-fase itu di HP & desktop dengan FEATURE_INVENTORY di tangan |
| Fase 14f | Jalankan `0011`; coba Pelajari (Word of the Day), Analisis tone, penanda idiom, cari di Buku Klasik lewat ketiga opsi (OpenLibrary, Gutendex, Gutenberg server), dan hapus akun **dengan akun uji, bukan akun utama** |
| Fase 14g | Jalankan `0015`; simpan xlsx definisi sebagai CSV UTF-8; `node scripts/enrich-ngsl.mjs --definitions … --forms … --dry-run`, lalu tanpa `--dry-run`; buka Kosakata Inti dan cek definisi muncul |
| Fase 15 | Jalankan `0012`; buat 5 soal AI → tinjau → terbitkan; kerjakan di HP |
| Fase 16 | Jalankan `0013`; isi satu unit lengkap; kerjakan dari awal sampai akhir |
| Fase 17 | Jalankan `0014`; coba Kesalahan Umum & Pasangan Bunyi |
| Fase 18 | Jalankan `0016`; tinjau 20 bacaan & isi unit di Admin → Konten (lihat angka pemeriksaan otomatis) → Terbitkan; coba satu bacaan lewat "Buat bacaan dengan AI untuk unit ini" dan satu lewat "Tulis teks sendiri"; nyalakan `kursus_dasar` di Admin → Fitur setelah minimal unit 0–5 lengkap |
