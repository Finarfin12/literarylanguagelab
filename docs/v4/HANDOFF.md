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
4. docs/v4/FEATURE_INVENTORY.md (daftar periksa wajib)
5. docs/v4/IMPLEMENTATION_PLAN.md bagian fase yang saya sebut
6. docs/SESSION_HANDOFF.md (status & migrasi)

ATURAN UTAMA: redesign hanya mengubah tampilan. Jangan menghapus, menggabung, atau mengurangi fitur apa pun.
Kerjakan HANYA fase yang saya sebut.
```

---

## Prompt per fase

**Fase 12** — `Kerjakan Fase 12 (Fondasi desain v4). Sebelum mengubah token, tampilkan tabel warna usulan (terang & gelap) dengan rasio kontrasnya dan tunggu persetujuan saya.`

**Fase 13** — `Kerjakan Fase 13 (Navigasi & tiga Ruang). Mulai dari tests/menu-coverage.test.mts. Tanyakan Q1 (bottom nav) sebelum mengubah MobileBottomNav.`

**Fase 14a / 14b / 14c / 14d / 14e** — `Kerjakan Fase 14<x> saja. Sebelum mengubah file, tulis daftar baris FEATURE_INVENTORY yang disentuh sub-fase ini. Di akhir, centang setiap baris beserta cara mengujinya.`
(14b juga: `Mulai dari lib/reader/drag-fab.ts dan uji unitnya, baru komponen MagicWandButton.`)

**Fase 15** — `Kerjakan Fase 15 (Mesin latihan + review grammar). Mulai dari lib/exercises/* dan uji unitnya. Latihan kalimat bebas yang lama di halaman topik grammar TETAP ada.`

**Fase 16** — `Kerjakan Fase 16 (Kursus Dasar). Mulai dari lib/course.ts dan uji unitnya. Unit tidak dikunci.`

**Fase 17** — `Kerjakan Fase 17 (Modul penutur Indonesia). Tulis penjelasan sendiri dalam bahasa Indonesia; jangan menyalin buku teks.`

---

## Aturan v4 (tambahan atas aturan v3)

1. **Tidak ada penghapusan fitur.** Yang dilarang selama redesign:
   - menghapus tombol, tab, mode, pilihan, panel, shortcut, atau halaman yang memicu fitur;
   - menggabung dua fitur menjadi satu tanpa persetujuan pemilik;
   - mengubah handler, state, panggilan API, nama route, atau teks yang bermakna fitur (mis. nama mode) di sub-fase redesign;
   - menyembunyikan fitur sampai tidak bisa dijangkau (≤ 2 ketukan dari navigasi).
   Jika menurutmu sebuah fitur sebaiknya digabung/dihapus: **berhenti dan tanya pemilik**.
2. **Perubahan perilaku yang diizinkan hanya**: Tongkat Ajaib bisa digeser (PRD §5.4), pintu masuk LingoWise desktop (§5.2), halaman ruang & menu baru (§5.2), dan fitur Kursus Dasar (§6).
3. **Daftar periksa per fase**: salin baris [FEATURE_INVENTORY.md](FEATURE_INVENTORY.md) yang relevan ke laporan, centang setelah diuji, sebut cara mengujinya. Fitur baru yang kamu buat → tambahkan barisnya ke inventaris di commit yang sama.
4. **Ubah kelas, bukan struktur.** Redesign utamanya mengganti kelas Tailwind & markup pembungkus. Jika struktur komponen harus berubah, pindahkan handler & state apa adanya.
5. **Semua tema**: setiap halaman diuji terang & gelap; reader juga sepia & kontras tinggi.
6. **Mockup** ada di kanvas pribadi pemilik (link di PRD). Jika tool Artifact tersedia di sesimu dan akunmu sama, kamu boleh membacanya (`read`); jika tidak, ikuti deskripsi di PRD §5. Mockup adalah arah, bukan spesifikasi piksel.

---

## Uji visual tanpa login (wajib untuk Fase 12–14)

Halaman asli butuh login dan database, yang tidak tersedia di sesi (dan dilarang memakai akun produksi). Untuk melihat hasil redesign:

1. Salin repo ke path pendek (`robocopy … /XD .git .next`), lalu di **salinan saja** buat halaman uji sementara mis. `app/v4-preview/page.tsx` yang merender komponen yang diubah dengan data contoh (props statis). Komponen yang mengambil data sendiri: render bagian presentasinya, atau beri data contoh lewat props.
2. Buat `.env.local` palsu di salinan: `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:9`, `NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy`.
3. `npm run build` lalu `npx next start -p <port>`; buka di browser pane, cek **375px dan 1280px**, tema terang & gelap (`document.documentElement.classList.toggle('dark')`).
4. Matikan server (cek port, hentikan hanya proses milikmu), hapus salinan. **Jangan commit halaman uji.**

Contoh yang sudah berhasil dipakai di v2: halaman uji reader dengan buku sintetis 4.840 blok untuk mengukur performa (render awal 13,7 s → 0,18 s).

---

## Fakta kode baru untuk v4 (sudah dicek, commit `5ff2160`)

- Font sekarang: `Inter` (`--font-sans`) dan `Merriweather` (`--font-serif`) di `app/layout.tsx` via `next/font/google`.
- `app/globals.css`: token di `:root` dan `.dark`; `body` punya `background-image` radial gradient (glow) — target pembersihan Fase 12.
- Menu: `lib/menu-config.ts` dengan `MenuItem.advanced`, `PINNED_PATHS`, grup "Lainnya" diisi otomatis dari item `advanced`. Tone Detector sudah digabung ke `/tools/tone-analyzer` (mode Deteksi Nada) dengan redirect di `next.config.ts`.
- **LingoWise AI (`/lingowise`) tidak terjangkau dari desktop** — hanya di grup Utama Menu HP. Perbaiki di Fase 13.
- Toolkits Hub (`/tools`) menampilkan ke-28 alat `lib/tools-config.ts` (termasuk `essay-auditor`, `case-study-generator`).
- Tongkat Ajaib saat ini: tombol `fixed bottom-24 right-4 md:bottom-8 md:left-8` di `components/reader/TextDisplay.tsx` (cari "Floating Action Button for Inspect Mode"), state `isInspectMode`.
- SRS: `calculateSM2` di `lib/spaced-repetition.ts`. Skenario dialog: `lib/dialogue-scenarios.ts`. TTS: `/api/tts`. STT: `hooks/useSpeechToText.ts`.
- `grammar_topics.slug` adalah primary key (migrasi `0007`); status selesai topik saat ini di `localStorage` (`lib/grammar-progress.ts`).
- Migrasi terakhir: `0010_translation_academic.sql`. Berikutnya `0011`.
- Endpoint tanpa pemanggil UI (jangan dihapus): `/api/analyze-tone`, `/api/detect-idioms`, `/api/gutenberg/search`, `/api/wotd`, `/api/auth/delete-account`.

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
| Fase 13 | Telusuri tiga ruang; pastikan alat favoritmu masih ada; putuskan Q1 |
| Fase 14x | Telusuri halaman sub-fase itu di HP & desktop dengan FEATURE_INVENTORY di tangan |
| Fase 15 | Jalankan `0011`; buat 5 soal AI → tinjau → terbitkan; kerjakan di HP |
| Fase 16 | Jalankan `0012`; isi satu unit lengkap; kerjakan dari awal sampai akhir |
| Fase 17 | Jalankan `0013`; coba Kesalahan Umum & Pasangan Bunyi |
