# Implementation Plan — Literary Language Lab v5

Turunan dari [PRD.md](PRD.md). Penomoran melanjutkan v4 (terakhir Fase 18, migrasi `0017`).

**Aturan umum** (lengkapnya di [HANDOFF.md](HANDOFF.md))
- **Tidak ada fitur atau route yang dihapus.** `tests/menu-coverage.test.mts` harus tetap lulus.
- Pola v2–v4 tetap wajib: `runAI`, guard admin, `logAdminAction`, `components/ui/*`, fallback sebelum migrasi, DESIGN.md v4.
- Migrasi baru mulai `0018`. Ditulis, tidak dijalankan sesi coding.
- Verifikasi tiap fase: `npx tsc --noEmit`, lint tanpa temuan baru vs HEAD, build di path pendek, uji unit logika murni, uji visual 375px & 1280px untuk UI yang berubah.

## Ringkasan fase

| Fase | Isi | Migrasi | Estimasi | Bergantung pada |
|---|---|---|---|---|
| 19 | Keamanan & biaya AI | `0018`, `0019` | 4–6 hari | — |
| 20 | Alter Ego: penulis fantasi | — | ½–1 hari | — |
| 21 | Alur pemula: pintu masuk, Beranda, dua unit tuntas | — | 3–4 hari | 19 (bagian biaya) |
| 22 | Latihan pemula: penyusun kalimat, bantuan dialog, frasa, tema | `0020`, `0021` | 4–6 hari | 21 |
| 23 | Susunan & label: ruang, Beranda, `/tools`, Grammar | — | 2–3 hari | 21 |
| 24 | Modul Belajar: mesin + satu mata pelajaran percobaan | `0022` | 6–8 hari | 15, 19, 23 |
| 25–28 | Konten Modul Belajar per tahap (±110–170 pelajaran) | — (berkas + impor) | satu sesi per mata pelajaran, ditambah peninjauan pemilik | 24 disetujui |
| 29 | Tambahan sesuai kebutuhan | per item | per item | data pemakaian |

**Urutan kerja:** **19 → 20 → 21 → (titik henti: pemilik mencoba alur pemula di HP) → 22 → 23 → 24 → (titik henti: pemilik menilai mata pelajaran percobaan) → 25 → 26 → 27 → 28 → 29.** Fase 20 kecil dan boleh dikerjakan paralel dengan 19, selama file-nya tidak bersinggungan (route `alter-ego` hanya disentuh Fase 20; ia sudah memakai `checkRateLimit`, pelindung baru menyusul di 19.2).

**Prasyarat dari pemilik sebelum Fase 19 selesai:** hasil query policy (19.1).

---

## Fase 19 — Keamanan & biaya AI

**19.1 Tinjau dan catat skema produksi** (`0018_rls_baseline.sql`)
- Pemilik menjalankan query baca-saja dan mengirim hasilnya:
  ```sql
  select tablename, policyname, cmd, roles, qual, with_check
  from pg_policies where schemaname = 'public' order by tablename, cmd;
  ```
- Laporkan policy yang terlalu longgar: `qual = true` pada data pribadi, UPDATE/DELETE tanpa pemeriksaan pemilik, atau `with_check` kosong pada INSERT. **Tunjukkan temuan ke pemilik dulu**, sebelum menulis perubahan.
- Tulis `0018`: tabel yang dibuat manual (`direct_messages`, dan lainnya yang ditemukan) sebagai `CREATE TABLE IF NOT EXISTS`; `ENABLE ROW LEVEL SECURITY` untuk semua tabel; policy sesuai produksi plus perbaikan yang disetujui. Idempoten (`DROP POLICY IF EXISTS` lalu `CREATE POLICY`).
- Jalankan dulu di staging bila Q3 disetujui. Tanpa staging: bagian perbaikan policy dipisah agar bisa dijalankan satu per satu, disertai SQL rollback di komentar, dan diuji dengan akun uji.
- Uji: anon, pemilik data, dan pengguna lain. Catat hasil per tabel di `docs/v5/rls-check.md`.

**19.2 Pelindung route AI** (`lib/ai/guard.ts`, logika validasi murni **diuji unit**)
- `guardAIRoute(req, { limitKey, maxChars, maxMessages })` → `{ user, body }` atau `NextResponse` galat. Menggabungkan `requireUser`, `checkRateLimit`, dan pembatasan ukuran (total karakter, jumlah pesan, peran pesan hanya `user`/`assistant`).
- Pasang di 13 route yang belum punya batas: `analyze-text/vocab`, `analyze-text/vocab-raw`, `dialogue-simulator`, `dialogue-simulator/feedback`, `evaluate-listening`, `generate-listening-quiz`, `grammar-clinic`, `liter-ai`, `lookup`, `parse-sentence`, `tools/dynamic`, `writing-challenge/evaluate`, `writing-feedback`.
- Tetapkan batas sesuai kegunaan: `lookup` boleh lebih longgar agar membaca tidak terganggu. Pesan galat ramah dalam bahasa Indonesia; UI yang memanggil menampilkan pesannya.
- Tambah uji `tests/ai-route-guard.test.mts`: memindai `app/api/**/route.ts`, gagal jika ada route yang memanggil `runAI` tanpa `guardAIRoute`/`checkRateLimit`.
- Cek `/api/stt` dan `/api/tts`: sudah punya batas, tetapi memanggil Groq langsung, di luar `ai_usage_logs`. Catat pemakaiannya atau catat sebagai utang di laporan.

**19.3 Batas lintas instance** (`0019_rate_limit_counters.sql`, `lib/rate-limit.ts`)
- Tabel `rate_limit_counters (user_id, key, window_start, count)` + fungsi `consume_rate_limit(p_key, p_window_seconds, p_limit)` `SECURITY DEFINER` memakai `auth.uid()`, atomik (`INSERT … ON CONFLICT DO UPDATE`). Jendela menit, jam, dan hari. RLS aktif tanpa policy untuk klien; hanya lewat fungsi. Hapus baris lama secara oportunistik.
- `checkRateLimit` memanggil fungsi ini. **Sebelum migrasi** (galat `42883`/`PGRST202`): perilaku lama. **Setelah migrasi**, galat lain pada route berbiaya → 503 dengan pesan jelas.
- Satu permintaan dihitung satu kali. Hindari pencatatan ganda dengan baris `requested` di `ai_usage_logs`, tanpa merusak statistik Admin.

**19.4 Flag fitur** (`lib/ai/flags.ts`)
- `FEATURE_DEFAULTS` untuk fitur yang bawaannya mati (`kursus_dasar`, `modul_belajar`). Key lain tetap aktif bila tidak terdaftar.
- Bila konfigurasi gagal dibaca: pakai nilai terakhir yang berhasil dibaca, lalu `FEATURE_DEFAULTS`. Admin → Fitur menampilkan peringatan bila konfigurasi tidak terbaca.

**19.5 Aksesibilitas dasar** (`app/layout.tsx`)
- Hapus `maximumScale: 1`. Ubah `<html lang="en">` menjadi `lang="id"`.
- Tandai konten Inggris dengan `lang="en"`: area baca reader, teks bacaan kursus, teks latihan. Pastikan tata letak tetap baik saat diperbesar.

**19.6 Operasi**
- `package.json`: script `test` yang menjalankan semua `tests/*.test.mts` dengan perintah di `docs/v3/HANDOFF.md` (`node --experimental-transform-types --no-warnings`). Jangan tambah dependensi.
- Admin → Ringkasan: SHA deployment (`VERCEL_GIT_COMMIT_SHA`) dan kartu **Status skema** yang memeriksa keberadaan tabel/kolom kunci tiap migrasi, tanpa membaca data pengguna.
- Perapian kecil: tipe `params: Promise<…>` di `clubs/[id]`, `read/[textId]`, `p/[username]`. Perbarui `README.md` agar tidak lagi mempromosikan fitur gamifikasi yang sudah dihapus.
- `docs/SESSION_HANDOFF.md`: tabel status migrasi `0000`–`0019`.

**19.7 Tugas pemilik**
- Supabase: nonaktifkan key legacy, cabut JWT secret lama. **Paling akhir**, setelah aplikasi dipastikan memakai key baru. Hapus variabel Vercel yang tidak terpakai (detail di `docs/HANDOFF_NEXT_SESSION.md`).
- Jalankan migrasi yang belum: lihat kartu Status skema (termasuk `0014`, `0016`).

**Selesai jika:** uji `ai-route-guard` lulus; tidak ada route AI tanpa batas; `0018` menghasilkan policy setara produksi; `rls-check.md` terisi atau ditandai "perlu diuji pemilik"; flag eksperimen mati saat konfigurasi gagal; zoom berfungsi; `npm test` lulus; build lulus.

---

## Fase 20 — Alter Ego: penulis fantasi

**20.1 Data** (`lib/alter-ego.ts`, **diuji unit**)
- `AUTHOR_GROUPS`: **Klasik & Modern** = 7 penulis yang ada sekarang (urutan sama). **Fantasi** = J.R.R. Tolkien, C.S. Lewis, Ursula K. Le Guin, Terry Pratchett, Diana Wynne Jones, George MacDonald, Lord Dunsany, Mervyn Peake.
- `isKnownAuthor(name)`. Riwayat obrolan lama dengan penulis yang ada tetap terbuka.

**20.2 Route** (`app/api/tools/alter-ego/route.ts`)
- Tolak penulis di luar daftar (400). Batasi jumlah dan panjang pesan.
- Ganti prompt: tiru gaya, era, dan pandangan penulis; **jangan** menyalin kutipan atau bagian panjang dari karya; bila diminta isi karya, ringkas dengan kata sendiri; jangan mengaku bahwa ini kata-kata asli penulis. Hapus "Use your famous quotes" dan "perfect, immersive imitation". Tetap menjawab dalam bahasa Inggris dan singkat.

**20.3 UI** (`app/(dashboard)/tools/alter-ego/page.tsx`)
- `<optgroup>` per kelompok. Keterangan tetap: "Ini simulasi AI, bukan kata-kata asli penulisnya." Tidak mengubah riwayat, hapus sesi, atau alur obrolan.

**Selesai jika:** semua penulis dapat dipilih di 375px & 1280px; nama di luar daftar ditolak server; riwayat lama tetap terbuka; uji unit lulus; FEATURE_INVENTORY diperbarui; build lulus.

---

## Fase 21 — Alur pemula: pintu masuk, Beranda, dua unit tuntas

**21.1 Onboarding** (`lib/learning-goals.ts`, `onboarding/page.tsx`, `onboarding/actions.ts`)
- Tambah `LEVEL_ZERO = "zero"` dan pilihan pertama **"Baru mulai dari nol"** ("Belum pernah belajar atau lupa semua. Tidak perlu tes."). Pilihan lain tetap.
- Menyimpan `cefr_level = 'A1'` tanpa perubahan skema. Tujuan berikutnya: unit `bunyi-huruf` bila kursus boleh tampil, jika tidak `/dashboard`. **Flag `kursus_dasar` harus sudah nyala sebelum alur ini dibuka untuk umum** (lihat 21.6).

**21.2 Langkah berikutnya** (`lib/next-step.ts`, **diuji unit**)
- Fungsi murni `isNewBeginner({ cefr, completedUnits })`: A1 dan belum menyelesaikan dua unit pertama.
- Untuk pemula baru, unit kursus didahulukan di atas bacaan, Grammar Clinic, dan pilihan bawaan lain. Review jatuh tempo tetap paling atas.

**21.3 Beranda pemula** (`dashboard/page.tsx`)
- Bila `isNewBeginner`: satu kartu besar berisi langkah berikutnya dan perkiraan waktu; bagian lain turun ke bawah. **Tidak ada bagian yang dihapus.** Pengguna lain melihat Beranda seperti sekarang.

**21.4 Kata unit masuk review** (`app/(dashboard)/kursus/` server action, `components/course/StepViews.tsx`)
- Tombol **"Simpan kata ke Review"** di langkah `vocab`, memakai pola `vocabulary/core/actions.ts`: lewati kata yang sudah dimiliki, jangan menimpa, tampilkan status dan coba lagi bila gagal. Hanya setelah tindakan yang jelas.

**21.5 Audio** (`components/course/speak.ts`, `StepViews.tsx`)
- Tombol **Normal** dan **Lambat** di langkah kata, dengar, dan bicara. Bila browser tidak punya suara: pesan yang jelas dan teks tetap terbaca.

**21.6 Konten dua unit** (`bunyi-huruf`, `salam-perkenalan`)
- Lengkapi `bunyi-huruf`: bunyi yang asing bagi penutur Indonesia (`th`, `v/f`, `sh/s`), huruf bisu, mengeja nama, bacaan sangat pendek, latihan, dan ucapan. Tulis sendiri.
- Tambah field opsional `reading_aid` pada item kata (tanpa perubahan skema, di dalam `steps`), ditampilkan dengan label "cara baca perkiraan".
- Pakai migrasi `0020` hanya bila perlu mengisi lewat seed; jika cukup, lewat Admin → Konten. Status tetap draft sampai ditinjau pemilik.
- Rilis: pemilik meninjau → Terbitkan → nyalakan `kursus_dasar` setelah minimal dua unit lengkap dan migrasi `0012`–`0016` sudah jalan.

**Selesai jika:** dari akun uji baru: daftar → "Baru mulai dari nol" → unit pertama → latihan → simpan kata → kata muncul di `/review` → Beranda menyarankan unit kedua; **tidak ada panggilan AI** di alur itu; keadaan gagal/coba lagi terlihat; uji keyboard, zoom, 375px; uji unit lulus; build lulus.

**Titik henti:** pemilik mencoba alur ini di HP sebelum Fase 22.

---

## Fase 22 — Latihan pemula

**22.1 Penyusun kalimat** (`lib/exercises/patterns.ts` diuji unit, `components/exercises/PatternBuilder.tsx`)
- Langkah baru `pattern` di kursus. Data kurasi per unit (subjek, kata kerja dengan bentuk *I/You/We/They* dan *He/She/It*, objek, catatan Indonesia). **Bukan** mesin konjugasi umum.
- Ketuk blok, tanpa wajib drag. Warna mengikuti pengecualian informasi di DESIGN.md §3.4, **selalu dengan label teks**. Kontras diuji. Tanpa AI. Hasil ke `exercise_attempts` seperti latihan lain.

**22.2 Toleransi salah ketik** (`lib/exercises/grade.ts`)
- Jarak Levenshtein 1 untuk kata ≥ 6 huruf pada `cloze` dan `dictation`: "Benar, periksa ejaannya" dengan sorotan bagian yang berbeda. Opsi `strictSpelling` untuk soal ejaan. Uji unit lama tetap lulus.

**22.3 Bantuan di Dialogue Simulator** (`lib/dialogue-scenarios.ts`, halaman simulator)
- Sakelar **Bantuan pemula**; bawaan menyala untuk A1, mati untuk lainnya; pilihan diingat. Fitur lama tidak berubah saat sakelar mati.
- Data lokal per skenario: arti untuk `hintPhrases` yang sudah ada, dan 2–3 awalan kalimat. Klik mengisi kolom ketik.
- Tombol "Lihat terjemahan" pada balasan AI: dimuat saat diklik, lewat pelindung Fase 19, disimpan selama sesi agar tidak berulang.

**22.4 Frasa harian** (`0020_daily_phrases.sql`, halaman `/frasa-harian`)
- Tabel `daily_phrases (slug, situation, text_en, text_id, literal_id, sort_order, status)`, baca untuk pengguna login, tulis admin. ±30 frasa awal berstatus draft: salam, angka & waktu, sopan & minta bantuan, belanja & makan, arah, darurat.
- Tampilkan: Inggris + audio → arti natural → arti kata per kata. Tombol simpan ke Review. Daftarkan di Ruang I dan `menu-coverage`. Admin → Konten: tinjau & terbitkan. Tanpa tabel: pesan "belum tersedia".

**22.5 Kosakata per tema** (`0021_core_words_a0.sql`, `scripts/enrich-a0.mjs`, `vocabulary/core`)
- `ALTER TABLE core_words ADD COLUMN IF NOT EXISTS translation_id TEXT, theme TEXT` + indeks. Skrip hanya UPDATE (pola `enrich-ngsl.mjs`) dari CSV ±300 kata yang ditinjau pemilik.
- Tab **"Per tema"**, tampil hanya bila data ada. Urutan frekuensi tetap bawaan.
- Tatoeba, Free Dictionary, dan ikon pihak ketiga **tidak** termasuk fase ini. Bila dipakai kelak: catat sumber, lisensi, versi, dan atribusi lebih dulu.

**22.6 Opsional: "Tampilan ringkas" Word Lookup**
- Preferensi di Pengaturan, **bawaannya mati**: 3 mode dasar di atas, mode lain di balik satu tombol. Tampilan bawaan dan ke-16 mode tidak berubah.

**Selesai jika:** semua latihan pemula dinilai tanpa AI; uji unit lulus (termasuk typo); simulator berperilaku sama saat bantuan mati; halaman baru punya pesan untuk keadaan belum ada migrasi; `menu-coverage` lulus; build lulus.

---

## Fase 23 — Susunan & label

Mengubah data dan urutan, **bukan** route atau alat. Gaya tetap DESIGN.md.

**23.1 Label** (`lib/rooms.ts`)
- `title`: Belajar Bahasa Inggris · Membaca & Sastra · Menerjemahkan. **Slug tetap** (`belajar-dasar`, `baca-sastra`, `terjemah`) agar tautan lama hidup. Periksa Sidebar, Menu, `/ruang`, Beranda, dan teks bantuan.

**23.2 Isi ruang** (`lib/rooms.ts`)
- **Membaca & Sastra**, urutan seksi: Sumber bacaan → Memahami konteks → Bedah sastra & teori → Penulisan & portofolio (`academic-outline`, `writing-assistant`, `essay-auditor`, `paraphrase`, `case-study-generator`) → Eksperimen kreatif.
- **Menerjemahkan**: seksi pembuka **Pra-terjemah** (`idiom-detector`, `cultural-context`, `dialect-diver`, `untranslatables`); evaluasi mendapat `imagery-grader`. Item boleh muncul di dua ruang.
- **Belajar Bahasa Inggris**: fokus A0–B1; `/tools/paraphrase` pindah ke Membaca & Sastra.

**23.3 Beranda** (`dashboard/page.tsx`)
- Tiga pintasan: **Mulai dari Nol** (unit berikutnya atau Ruang I), **Lanjutkan Membaca** (buku terakhir atau Ruang II), **Mulai Menerjemahkan** (Ruang III). Bukan katalog baru.

**23.4 Kategori `/tools`** (`lib/tool-categories.ts` **diuji unit**, `tools/page.tsx`)
- Kategori: Pemahaman & Kosakata, Kajian Sastra & Teori, Penulisan, Bantuan Penerjemahan, Latihan Interaktif, plus "Semua Alat". Uji: setiap alat punya kategori. Pencarian dan semua alat tetap. Nama alat tidak diubah; deskripsi Indonesia ditampilkan.

**23.5 Grammar** (`english-lab/grammar/TopicList.tsx`)
- Progres total ("8 dari 20 topik") dan filter Semua / Belum / Selesai. Perbaiki spasi teks badge agar terbaca pembaca layar.

**Selesai jika:** `menu-coverage` lulus; tautan lama hidup; setiap alat ≤ 2 ketukan; label sama di semua tempat; uji visual 375px & 1280px; FEATURE_INVENTORY diperbarui; build lulus.

---

## Fase 24 — Modul Belajar: mesin + satu mata pelajaran percobaan

**Sebelum mulai:**
- Cocokkan [COMPETENCY_MAP.md](COMPETENCY_MAP.md) dengan dokumen acuan pemilik (Q7). Setiap kompetensi harus berakhir pada satu mata pelajaran, bagian dari mata pelajaran lain, atau "di luar cakupan" dengan alasan. Dokumen acuan hanya untuk cakupan: jangan menyalin isinya dan jangan meng-commit filenya.
- Usulkan daftar mata pelajaran beserta urutannya (draf: 28) kepada pemilik (Q6). Tanpa kode mata kuliah dan tanpa "Semester".

**24.1 Skema** (`0022_study_modules.sql`)
- `study_subjects (slug pk, stage, title, description_id, outcomes jsonb, room_slug, sources jsonb, sort_order, status)`. `stage` = `fondasi | transisi | pendalaman | lanjut`. `sort_order` unik dan menjadi urutan belajar lintas tahap.
- `study_lessons (slug pk, subject_slug, sort_order, title, objectives jsonb, body_md, summary_md, task jsonb, tool_paths text[], sources jsonb, status, origin 'claude'|'manual'|'ai', edited_at, reviewed_by, reviewed_at)`.
- `ALTER TABLE exercises ADD COLUMN IF NOT EXISTS lesson_slug TEXT, subject_slug TEXT`. Soal dengan `subject_slug` dan tanpa `lesson_slug` = kuis akhir.
- `lesson_progress (user_id, lesson_slug, completed_at, pk(user_id, lesson_slug))` dan `lesson_tasks (user_id, lesson_slug, content, updated_at, pk(...))` untuk jawaban tugas pribadi.
- `lesson_simple_versions (lesson_slug pk, content, model, created_at)` untuk "Jelaskan lebih sederhana".
- RLS: subject & lesson terbit dibaca pengguna login, tulis admin; progres & tugas milik sendiri; versi sederhana dibaca pengguna login, tulis lewat server. Feature key `lesson-simplify`, `lesson-chat`, `lesson-draft`. Flag `modul_belajar` mati (`FEATURE_DEFAULTS`).

**24.2 Logika murni** (**diuji unit**)
- `lib/study.ts`: `nextLesson`, persen per mata pelajaran & tahap, pelajaran yang disarankan.
- `lib/lesson-check.ts`: `checkLesson(lesson, exercises)` → ada tujuan, jumlah kata isi dalam rentang (±600–1.500), minimal 3 latihan, ada rangkuman, ada sumber, alat yang dirujuk ada di `lib/rooms.ts`. Ditampilkan di Admin; hanya informasi, seperti `graded-check`.
- `scripts/lib/parse-lesson.mjs`: membaca berkas pelajaran (lihat 24.5).

**24.3 Halaman belajar**
- `/modul` (tahap & mata pelajaran), `/modul/[subject]` (daftar pelajaran, tujuan, progres, kuis), `/modul/[subject]/[lesson]`.
- Halaman pelajaran bergaya bacaan DESIGN.md (serif untuk isi, lebar nyaman, tema gelap): tujuan → isi → contoh → latihan (`ExerciseSession`) → rangkuman → tugas (disimpan, tanpa penilaian AI) → sumber → tombol "Praktikkan" opsional → **"Pelajaran berikutnya"**. Tidak ada yang dikunci.
- Markdown dirender aman (tanpa HTML mentah). Teks Inggris diberi `lang="en"`. Tandai selesai hanya lewat tindakan jelas.
- Tautan dari halaman ruang; daftarkan di `lib/rooms.ts` dan `menu-coverage`. Keterangan tetap: "Pendamping belajar mandiri; bukan program resmi lembaga mana pun."

**24.4 AI pendamping**
- **"Jelaskan lebih sederhana"**: dibuat sekali lalu disimpan; permintaan bersamaan tidak memanggil AI dua kali; label "Dibuat AI, periksa kembali".
- **Tanya jawab** seputar pelajaran lewat pelindung Fase 19, tidak disimpan untuk umum. Halaman tetap utuh tanpa AI.

**24.5 Konten sebagai berkas & Admin**
- Sumber draf sesi Claude: `content/modules/<subject>/<nn>-<lesson>.md` (frontmatter + isi + soal). Bisa ditinjau lewat diff.
- `scripts/import-modules.mjs [--dry-run]`: upsert sebagai `draft`; **melewati pelajaran yang sudah ditinjau atau disunting di Admin** kecuali `--force`.
- Admin → Konten → tab **Modul**: daftar & hasil `checkLesson`; **tulis pelajaran manual**; edit; "Buat draf dengan AI" (`lesson-draft`, jadi draft); tinjau & terbitkan. `logAdminAction` untuk semua aksi. Soal dikelola lewat tab Latihan yang sudah ada.

**24.6 Panduan penulisan** (`docs/v5/CONTENT_GUIDE.md`, ditulis di fase ini)
- Bahasa Indonesia yang jelas; istilah Inggris dijelaskan saat pertama muncul; contoh Inggris selalu dibahas.
- Pola tiap pelajaran mengikuti 9.1 PRD; satu gagasan per bagian.
- **Ditulis sendiri.** Jangan menyalin definisi, urutan paragraf, contoh, atau latihan khas buku/modul. Teks contoh: domain publik, tulisan sendiri, atau berlisensi; catat di `sources`.
- **Sumber harus nyata.** Bila tidak bisa dipastikan, tandai `[perlu cek]`, jangan dikarang. Jangan mengklaim hasil penelitian tanpa rujukan.

**24.7 Percobaan: satu mata pelajaran lengkap**
- Tulis **"Membaca Cepat & Ide Pokok"** (4–6 pelajaran + kuis akhir) sesuai panduan.

**Selesai jika:** mata pelajaran percobaan bisa dituntaskan di HP dari pelajaran pertama sampai kuis **tanpa AI dan tanpa membuka alat**; progres tersimpan; suntingan Admin tidak tertimpa impor; flag mati menyembunyikan modul; uji unit lulus; `menu-coverage` lulus; FEATURE_INVENTORY diperbarui; build lulus.

**Titik henti:** pemilik menilai kedalaman dan gaya penjelasan. Fase 25 baru dimulai setelah disetujui, dan panduan penulisan diperbarui bila perlu.

---

## Fase 25–28 — Konten Modul Belajar per tahap

| Fase | Tahap | Mata pelajaran (draf) | Perkiraan pelajaran | Peninjauan |
|---|---|---|---|---|
| 25 | Fondasi | 4 (satu sudah jadi percobaan) | 16–24 | Pemilik |
| 26 | Transisi | 8 | 32–48 | Pemilik |
| 27 | Pendalaman | 8 | 32–48 | Pemilik + disarankan peninjau bidang |
| 28 | Lanjut & proyek | 7 | 28–42 | Pemilik + disarankan peninjau bidang |

**Cara kerja:**
- **Satu sesi = satu mata pelajaran** (commit per mata pelajaran). Berkas di `content/modules/`, status draft.
- Setiap mata pelajaran menyertakan latihan per pelajaran dan kuis akhir. Tahap Lanjut mengutamakan **proyek** (mis. menerjemahkan 500–1.000 kata, menganotasi teknik, menilai hasil, mengekspor data), memakai Ruang Kerja Segmen secara opsional.
- `checkLesson` lulus untuk semua pelajaran; daftar sumber & `[perlu cek]` masuk laporan.
- Pemilik menjalankan `import-modules.mjs`, meninjau, lalu menerbitkan. Flag `modul_belajar` boleh dinyalakan setelah minimal satu tahap (Fondasi) terbit lengkap; tahap lain tampil "segera hadir".

**Selesai jika (per mata pelajaran):** berkas lengkap sesuai panduan; `--dry-run` tanpa galat; tidak ada teks salinan; COMPETENCY_MAP ditandai tercakup.

---

## Fase 29 — Tambahan sesuai kebutuhan

Tiap item menjadi fase kecil tersendiri **setelah** ada permintaan atau data pemakaian. Rincian menyusul; batasannya di PRD §10.

---

## Checklist verifikasi akhir v5

- [ ] Tidak ada route AI tanpa batas; uji `ai-route-guard` lulus.
- [ ] Database kosong + migrasi repo = skema & policy setara produksi; `rls-check.md` terisi.
- [ ] Kunci legacy dinonaktifkan (pemilik).
- [ ] Penulis fantasi tersedia; nama di luar daftar ditolak server.
- [ ] Alur "Baru mulai dari nol" tuntas sampai review, tanpa AI, di HP.
- [ ] Penyusun kalimat, bantuan dialog, frasa, dan tema berfungsi atau jelas menyatakan belum tersedia.
- [ ] Tiga label ruang konsisten; kategori `/tools` berbahasa Indonesia; `menu-coverage` lulus.
- [ ] Modul Belajar: mata pelajaran bisa dituntaskan tanpa AI dan tanpa alat; empat tahap berurutan tanpa kunci; tanpa "Semester" dan kode mata kuliah; materi orisinal; sumber nyata & tercatat; setiap kompetensi di COMPETENCY_MAP punya mata pelajaran atau alasan di luar cakupan.
- [ ] Migrasi `0018`–`0022` tercantum di `docs/SESSION_HANDOFF.md`.
