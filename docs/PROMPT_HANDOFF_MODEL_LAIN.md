# Prompt handoff untuk model selain Claude

> Tempel **Prompt utama** di awal sesi agen (Claude Code dengan endpoint kompatibel, OpenCode, Cline, dsb. — harus punya akses shell dan edit file), lalu tempel **satu** prompt tugas di bawahnya. Satu sesi = satu tugas.
> Pemilik menjalankan model lain di **branch**, bukan langsung di `main`, lalu meninjau diff sebelum menggabungkan.
> Jangan memberi model apa pun kunci/rahasia. Repo tidak berisi rahasia dan tidak butuh `.env`.

---

## Prompt utama (tempel apa adanya)

```
Kamu adalah engineer di repo "Literary Language Lab" (Next.js 16.2 App Router, React 19, Supabase, Tailwind v4,
TypeScript) di C:\dev\literarylanguagelab (Windows). Bahasa kerja: Indonesia (teks UI dan komentar kode).

LANGKAH 0 — sebelum menyentuh apa pun, jalankan dan laporkan hasilnya:
  git status --short        (harus kosong)
  git log --oneline -1
  git config user.email     (harus finarfinar112@gmail.com; jika bukan: git config user.name finarfin112 && git config user.email finarfinar112@gmail.com)
  git switch -c model/<namamu>-<tugas>     (kerja HANYA di branch ini, bukan main)
  npx eslint . -f json > before.json       (baseline lint; jangan di-commit)

BACA DULU, berurutan (jangan dilewati, jangan merangkum dari ingatan):
  1. docs/HANDOFF_NEXT_SESSION.md   (keadaan, aturan, jebakan, resep verifikasi)
  2. CLAUDE.md
  3. docs/v3/HANDOFF.md bagian "Pola yang WAJIB dipakai" dan "Jebakan"
  4. Dokumen lain yang disebut di tugasmu di bawah

ATURAN KERAS (melanggar salah satu = tugas gagal):
  - Kerjakan HANYA tugas yang diberikan. Jangan memulai fase/tugas lain, jangan merapikan kode di luar tugas.
  - JANGAN menghapus, menggabung, atau mengurangi fitur apa pun. Ragu -> berhenti dan tanya.
  - JANGAN menyentuh .env*, JANGAN login ke Supabase/produksi, JANGAN menjalankan migrasi (hanya menulis file .sql bila diminta).
  - JANGAN menambah dependency (package.json) tanpa izin.
  - JANGAN git push, JANGAN force, JANGAN merge ke main. Commit lokal di branch saja, identitas finarfin112 <finarfinar112@gmail.com>.
  - Akhiri pesan commit dengan baris: Co-Authored-By: <nama modelmu> <noreply@example.com>
  - AI hanya lewat runAI() (lib/ai/run.ts). Auth route: requireUser()/requireAdmin(). Server Action: cek auth DI DALAMNYA.
  - Kode harus tetap jalan sebelum migrasi dijalankan (tangkap error kolom/tabel hilang 42703, PGRST204, 42P01, PGRST205).
  - Next.js 16: params/searchParams adalah Promise; file "use server" hanya boleh mengekspor fungsi async; proxy.ts (bukan middleware.ts).
  - Tailwind v4: kelas v3 yang tidak ada (mis. perspective-1000, transform-style-3d) jangan dipakai.
  - Komponen UI di components/ui/; target sentuh >= 44px; cek lebar 375px.

JEBAKAN WINDOWS:
  - Heredoc shell menelan backslash. Untuk file berisi backslash/templat string, pakai alat tulis/edit file, BUKAN heredoc/sed/echo.
  - Skrip Python/regex yang mengedit file TS dengan string berisi \n pernah merusak kode. Pakai alat edit, lalu verifikasi dengan tsc.
  - Peringatan "LF will be replaced by CRLF" normal. File .md BARU harus git add -f (karena .gitignore mengabaikan *.md).
  - Jika build gagal soal panjang path: pastikan repo di path pendek (sudah: C:\dev\literarylanguagelab).

CARA KERJA:
  1. Tulis rencana singkat (daftar langkah) lalu kerjakan satu per satu.
  2. Setelah SETIAP perubahan berarti jalankan: npx tsc --noEmit -p .   (harus bersih)
  3. Di akhir jalankan SEMUA ini dan tempel OUTPUT ASLINYA di laporan (jangan meringkas dari ingatan):
       npx tsc --noEmit -p .
       npx eslint . -f json > after.json ; node scripts/lint-diff.mjs before.json after.json     (harus "baru=0")
       NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:9 NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy npm run build
       uji unit yang relevan: node --experimental-transform-types --no-warnings tests/<nama>.test.mts "<path-repo>"
     (PowerShell: ganti variabel env dengan $env:NAMA="nilai" sebelum npm run build; path-repo = hasil `pwd -W` di Git Bash)
  4. Jika ada yang gagal: katakan GAGAL beserta outputnya. Jangan menyatakan selesai, jangan mengarang hasil.
  5. Commit lokal (satu commit per tugas) lalu tulis LAPORAN AKHIR.

BERHENTI DAN TANYA bila: rencana bertentangan dengan kode; perlu menghapus/menggabung fitur; perlu akses produksi/rahasia;
perubahan menyentuh > 40 file di luar tugas; atau kamu tidak yakin sebuah perubahan mengubah perilaku fitur yang ada.

FORMAT LAPORAN AKHIR (wajib):
  Tugas:
  Branch & commit: <hash> (lokal, belum di-push)
  Yang selesai: (daftar)
  File yang diubah: (git diff --stat, tempel)
  Yang tidak dikerjakan + alasan:
  Fitur yang hilang atau berubah perilaku: (harus "tidak ada" kecuali diminta)
  Migrasi baru (belum dijalankan):
  Hasil tsc / lint-diff / build / uji unit: (tempel output asli)
  Hal yang perlu diputuskan pemilik:
```

---

## Prompt tugas A — pilot kecil (uji awal model)

```
TUGAS: Perbaiki peringatan konsol Recharts "width(-1) and height(-1) of chart should be greater than 0" pada grafik
"Kosa kata baru, 7 hari terakhir" di Beranda.
- File: components/dashboard/VocabChart.tsx. Tambahkan prop minWidth={0} dan minHeight={0} pada <ResponsiveContainer>
  (sesuai saran pesan peringatannya). Jangan mengubah data, warna, atau tampilan lain.
- Jangan menyentuh file lain.
- Verifikasi: tsc, lint-diff, build (uji unit tidak relevan).
Branch: model/<namamu>-recharts
```

## Prompt tugas B — pilot disiplin pengujian

```
TUGAS: Tambahkan uji unit untuk kasus tepi yang BELUM tercakup di tests/cefr.test.mts untuk lib/cefr.ts, TANPA mengubah
kode produksi (lib/cefr.ts tidak boleh berubah).
- Baca lib/cefr.ts dan tests/cefr.test.mts. Cari 4-6 kasus tepi nyata (mis. neighborLevels dengan below/above besar,
  beginnerModeLevel dengan floor berbeda, explanationInstruction untuk setiap level, bandToCefr pada nilai non-bulat).
- Jika sebuah uji baru menemukan perilaku yang kamu anggap salah: JANGAN memperbaiki kode; catat di laporan sebagai temuan.
- Jalankan: node --experimental-transform-types --no-warnings tests/cefr.test.mts "<path-repo>" (semua harus lulus), tsc, lint-diff.
Branch: model/<namamu>-cefr-tests
```

## Prompt tugas C — fase besar (hanya setelah model lolos pilot A dan B)

```
TUGAS: <tempel di sini nama fase, mis. "Fase 12 (Fondasi desain v4)">.
Baca juga: docs/v4/HANDOFF.md, docs/v4/PRD.md, docs/v4/DESIGN.md, docs/v4/FEATURE_INVENTORY.md,
docs/v4/IMPLEMENTATION_PLAN.md (HANYA bagian fase ini), docs/SESSION_HANDOFF.md.
Gunakan prompt per fase di docs/v4/HANDOFF.md. Sebelum mengubah file, tulis daftar baris FEATURE_INVENTORY yang akan
tersentuh; di akhir centang tiap baris beserta cara mengujinya. Perhatikan "tiga celah" di docs/HANDOFF_NEXT_SESSION.md bagian 7.
Branch: model/<namamu>-fase-<nomor>
```

---

## Pemeriksaan pemilik sebelum menggabungkan branch (checklist)

1. `git diff --stat main...model/<branch>`: hanya file yang wajar? Tidak ada file di luar tugas?
2. Jalankan sendiri: `npx tsc --noEmit -p .`, `node scripts/lint-diff.mjs before.json after.json`, `npm run build`, dan uji unit relevan. **Jangan percaya laporan model tanpa menjalankan ulang.**
3. Tidak ada `.env*`, `package.json` berubah, file font, atau file `.csv/.xlsx` di diff.
4. Untuk fase redesign: buka FEATURE_INVENTORY dan uji sampel fitur di HP dan desktop.
5. Setelah puas: `git switch main && git merge --no-ff model/<branch>` lalu push (setelah Anda memutuskan).
