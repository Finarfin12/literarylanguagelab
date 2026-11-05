# Handoff — Pengerjaan Literary Language Lab v5 (untuk Claude Sonnet 5)

Tempel **"Prompt pembuka"** di awal sesi, lalu satu **"Prompt per fase"**. Satu sesi = satu fase. Pola kode, jebakan Windows, dan resep verifikasi tetap dari [../v3/HANDOFF.md](../v3/HANDOFF.md) dan [../v4/HANDOFF.md](../v4/HANDOFF.md).

---

## Prompt pembuka

```
Kamu adalah engineer di repo "Literary Language Lab" (Next.js 16.2, React 19, Supabase, Tailwind v4, TypeScript).

Baca dulu, berurutan:
1. docs/v5/HANDOFF.md
2. docs/v3/HANDOFF.md bagian "Aturan kerja", "Pola yang WAJIB dipakai", "Jebakan", "Resep verifikasi"
3. docs/v5/PRD.md
4. docs/v5/IMPLEMENTATION_PLAN.md bagian fase yang saya sebut
5. docs/v4/DESIGN.md (acuan visual, tidak berubah)
6. docs/v4/FEATURE_INVENTORY.md (daftar periksa)
7. docs/SESSION_HANDOFF.md (status & migrasi)

ATURAN UTAMA: jangan menghapus fitur atau route. Kerjakan HANYA fase yang saya sebut.
```

## Prompt per fase

**Urutan:** 19 → 20 → 21 → *(titik henti: pemilik mencoba di HP)* → 22 → 23 → 24 → *(titik henti: pemilik menilai mata pelajaran percobaan)* → 25 → 26 → 27 → 28 → 29.

**Fase 19** — `Kerjakan Fase 19 (Keamanan & biaya AI). Mulai dari 19.1: minta saya menjalankan query policy dan menunjukkan hasilnya, laporkan temuan, tunggu persetujuan sebelum menulis perubahan policy. Tulis migrasi 0018 dan 0019 tapi jangan jalankan. Jangan memakai akun atau database produksi.`

**Fase 20** — `Kerjakan Fase 20 (Alter Ego: penulis fantasi). Mulai dari lib/alter-ego.ts dan uji unitnya. Jangan menambah penulis yang masih hidup. Prompt tidak boleh mendorong kutipan panjang.`

**Fase 21** — `Kerjakan Fase 21 (Alur pemula). Mulai dari fungsi murni di lib/next-step.ts dan uji unitnya. Alur harus tuntas tanpa panggilan AI. Pengguna lain melihat Beranda seperti sekarang. Tulis konten sendiri dan biarkan berstatus draft.`

**Fase 22** — `Kerjakan Fase 22 (Latihan pemula). Mulai dari lib/exercises/patterns.ts dan uji unitnya. Word Lookup bawaan tidak berubah. Jangan memakai dataset atau API pihak ketiga. Tulis migrasi 0021 dan 0022 tapi jangan jalankan.`

**Fase 23** — `Kerjakan Fase 23 (Susunan & label). Slug ruang, route, dan nama alat tidak berubah. Mulai dari lib/tool-categories.ts dan uji unitnya. menu-coverage harus lulus.`

**Fase 24** — `Kerjakan Fase 24 (Modul Belajar: mesin + satu mata pelajaran percobaan). Cocokkan docs/v5/COMPETENCY_MAP.md dengan dokumen acuan yang saya lampirkan (jangan disalin, jangan di-commit), lalu usulkan daftar mata pelajaran beserta urutannya dan tunggu persetujuan. Mulai dari lib/study.ts dan lib/lesson-check.ts dengan uji unitnya. Tulis migrasi 0023 tapi jangan jalankan. Mata pelajaran percobaan harus bisa dituntaskan tanpa AI dan tanpa alat.`

**Fase 25–28** — `Kerjakan satu mata pelajaran: <nama>, tahap <tahap>, sesuai docs/v5/CONTENT_GUIDE.md. Tulis di content/modules/ berstatus draft. Materi orisinal; jangan menyalin buku atau modul. Sumber harus nyata; yang tidak pasti tandai [perlu cek], jangan dikarang. Jalankan pemeriksaan dan laporkan hasilnya.`

---

## Aturan v5

1. **Tidak ada penghapusan fitur.** Yang boleh diubah: urutan, kelompok, label ruang, dan kategori `/tools`, sesuai plan. Slug, route, dan nama alat tetap.
2. **Perubahan policy RLS butuh persetujuan pemilik** dan harus punya jalan kembali. Salah policy bisa mengunci pengguna dari datanya sendiri.
3. **Tanpa AI** di alur unit pemula dan penilaian latihan.
4. **Materi**: tulis sendiri. Gratis dibaca bukan berarti boleh disalin. Catat sumber dan lisensi. Jangan mengarang rujukan.
5. **Bahasa klaim**: hindari "akurat", "siap skripsi/TAP", "offline penuh", "aman secara hukum".
6. **Identitas & batas**: commit sebagai `finarfin112 <finarfinar112@gmail.com>`, push setelah bertanya, jangan menyentuh `.env*`, dan jangan menulis kunci. Test hapus akun hanya dengan akun uji.

## Fakta kode (dicek di `1794bc3`)

- **Route AI tanpa `checkRateLimit`** (13): lihat daftar di plan 19.2. `/api/stt` dan `/api/tts` punya batas, tetapi memanggil Groq langsung.
- **RLS**: produksi aktif di semua tabel dengan policy (dicek pemilik 5 Nov 2026, isi belum ditinjau). Repo: `profiles`, `vocabulary`, `reading_sessions`, `translations`, `idioms`, `activity_logs`, `glossaries`, `translation_memory`, `community_annotations`, `annotation_votes` tanpa RLS di migrasi; `direct_messages` tidak dibuat migrasi.
- **Flag**: `lib/ai/flags.ts` menganggap key tak terdaftar aktif. `lib/course-access.ts` sudah fail-closed untuk `kursus_dasar`.
- **Onboarding**: `lib/learning-goals.ts` (`CEFR_LABELS`, `LEVEL_UNKNOWN`), `onboarding/actions.ts` mengarahkan `unknown` ke placement test.
- **Kursus**: 12 unit di `0013`, konten di `0016` (draft). `components/course/speak.ts` sudah punya mode lambat. Kata unit **belum** masuk `vocabulary`.
- **Alter Ego**: `AUTHORS` ada di halaman (7 nama). Route menerima `author` apa pun dan memasukkannya ke prompt.
- **Bottom nav**: Beranda · Kamus · Baca Buku · Grammar · Menu (`d0295a4`). Jangan diubah tanpa keputusan pemilik (PRD Q2).
- **`/tools`**: kategori di `tools/page.tsx` masih Inggris. Migrasi terakhir `0017`.

## Format laporan akhir sesi

```
Fase: N
Commit: <hash> (lokal / sudah di-push)
Yang selesai: (langkah plan)
Fitur yang hilang atau berubah perilaku: (harus "tidak ada", kecuali yang diizinkan plan)
Migrasi baru (belum dijalankan):
Hasil tsc / lint (temuan baru vs HEAD) / build / npm test:
Uji visual: (375px & 1280px, terang & gelap)
Yang belum teruji di produksi:
Hal yang perlu diputuskan pemilik:
```

Setelah fase selesai, perbarui tabel status di `docs/SESSION_HANDOFF.md`.

## Titik review pemilik

| Setelah | Cek |
|---|---|
| Fase 19 | Tinjau temuan policy; jalankan `0018`, `0019`; nonaktifkan kunci legacy; cek kartu Status skema |
| Fase 20 | Ngobrol dengan satu penulis fantasi; pastikan tidak ada kutipan panjang |
| Fase 21 | Buat akun uji; jalani alur "Baru mulai dari nol" di HP; tinjau & terbitkan dua unit; nyalakan `kursus_dasar` |
| Fase 21 | Jalankan `0020`; tinjau & terbitkan dua unit; nyalakan `kursus_dasar` |
| Fase 22 | Jalankan `0021`, `0022`; tinjau frasa; isi CSV kata per tema |
| Fase 23 | Telusuri tiga ruang dan `/tools`; pastikan alat favoritmu masih ada |
| Sebelum Fase 24 | Siapkan `Buku-Pembelajaran…docx` dan `DAFTAR-PER-SEMESTER.txt` untuk dicocokkan dengan peta cakupan |
| Fase 24 | Setujui daftar & urutan mata pelajaran; jalankan `0023`; impor mata pelajaran percobaan; pelajari sampai kuis di HP; **nilai kedalaman dan gaya penjelasan sebelum Fase 25** |
| Fase 25–28 | Impor tiap mata pelajaran; tinjau (dibantu peninjau bidang di tahap Pendalaman & Lanjut); terbitkan; nyalakan `modul_belajar` setelah Fondasi lengkap |
