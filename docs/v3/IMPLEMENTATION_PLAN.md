# Implementation Plan — Literary Language Lab v3

Turunan dari [PRD.md](PRD.md). Penomoran fase melanjutkan v2 (Fase 0–7; Fase 5 dibatalkan). Setiap fase berakhir dalam kondisi yang bisa di-deploy dan di-commit terpisah.

**Aturan umum** (lengkapnya di [HANDOFF.md](HANDOFF.md))
- Ikuti pola yang sudah ada dari v2; jangan membuat pola paralel. Pola kunci: `runAI()`, `requireUser()`/`requireAdminPage()`/`assertAdmin()`, `checkRateLimit()`, `logAdminAction()`, `components/ui/*`, `ResponsivePanel`.
- Perubahan skema = file baru `supabase/migrations/NNNN_nama.sql` (lanjut dari `0006`; `0009` sudah dipakai). **Ditulis saja, tidak dijalankan ke database** — pemilik yang menjalankan.
- Kode harus tetap jalan sebelum migrasi baru dijalankan (pola fallback v2: tangkap error kolom/tabel hilang, tampilkan `MissingMigrationNotice` di admin).
- Feature key AI baru → tambahkan ke `lib/ai/features.ts` **dan** seed `ai_feature_routes` di migrasi fase tersebut.
- Teks UI dan komentar kode dalam bahasa Indonesia.
- Verifikasi tiap fase: `npx tsc --noEmit`, lint dibandingkan dengan HEAD (tidak boleh ada temuan baru), `npm run build` di path pendek, uji unit untuk logika murni.

## Ringkasan fase

| Fase | Isi | Estimasi | Bergantung pada |
|---|---|---|---|
| 8 | Penataan untuk orang awam (onboarding, menu baru, konsolidasi, contoh, landing) | 3–4 hari | v2 |
| 9 | Fondasi belajar dasar (teks berjenjang CEFR, kosakata inti, grammar dasar, adaptasi level) | 4–5 hari | 8 |
| 10 | Level per keterampilan & Tes Naik Level | 4–5 hari | 9 |
| 11 | Jalur penerjemahan akademik (teknik, rubrik, ruang kerja segmen, tahap penerjemah) | 5–7 hari | 8 |

Mode kelas (sebelumnya Fase 12) **dibatalkan** oleh pemilik pada 31 Oktober 2026.

Fase 10 dan 11 menyentuh file yang berbeda, jadi bisa dikerjakan paralel setelah Fase 9 dan Fase 8 selesai.

---

## Fase 8 — Penataan untuk orang awam

**8.1 Skema (`0006_onboarding.sql`)**
```sql
alter table profiles add column if not exists learning_goal text
  check (learning_goal in ('umum','sastra','penerjemahan'));
alter table profiles add column if not exists daily_minutes int;
alter table profiles add column if not exists onboarded_at timestamptz;
```

**8.2 Onboarding**
- Halaman `app/(dashboard)/onboarding/page.tsx` (client): 3 langkah (level → tujuan → waktu), tombol "Lewati". Level "Belum tahu" → simpan tujuan & waktu, lalu arahkan ke `/english-lab/placement-test`.
- Server action `app/(dashboard)/onboarding/actions.ts`: simpan ke `profiles` (pakai sesi pengguna, bukan service role), set `onboarded_at`.
- `app/(dashboard)/layout.tsx`: jika `onboarded_at` null **dan** kolom ada → redirect ke `/onboarding` (kecuali sudah di `/onboarding` atau `/english-lab/placement-test`). Jika kolom belum ada (migrasi belum dijalankan) → jangan redirect.
- Pengaturan (`settings/page.tsx`): bagian "Tujuan belajar" untuk mengubah jawaban.

**8.3 Menu baru & konsolidasi**
- Tulis ulang `lib/menu-config.ts` dengan grup dari PRD §5.1. Tambahkan field `description` (1 baris, Indonesia) dan `goals?: ('umum'|'sastra'|'penerjemahan')[]` per item, serta `advanced?: true` untuk item di grup "Lainnya".
- `app/(dashboard)/menu/page.tsx` dan `components/Sidebar.tsx`: tampilkan deskripsi; grup "Lainnya" terlipat secara default. (Menu HP sudah punya pencarian & grup lipat dari v2 — perluas, jangan tulis ulang.)
- **Kandidat konsolidasi (konfirmasi pemilik dulu — Q5):**
  - `tone-analyzer` + `tone-detector` → satu halaman "Tone & Gaya" (pakai `/tools/tone-analyzer`, redirect `/tools/tone-detector`).
  - `semantic-visual` + `semantic-map` → cek isinya; gabung jika fungsinya sama.
  - `imagery-sketcher` + `imagery-grader` → cek; gabung atau pindah ke "Lainnya".
  - Kreatif/jarang dipakai ke "Lainnya": `poem-to-palette`, `plot-twist`, `time-traveler`, `character-monologue`, `case-study-generator`, `essay-auditor` (yang terakhir dua ada di `lib/tools-config.ts` tapi tidak di menu).
  - Redirect path lama di `next.config.ts` (pola yang sama dengan redirect gamifikasi v2).
- Target: grup utama ≤ 30 item; sisanya di "Lainnya".

**8.4 "Coba dengan contoh"**
- Tambahkan `example?: string` (input contoh) ke setiap entri `lib/tools-config.ts` dan ke halaman tool khusus (`tools/*/page.tsx` yang punya input teks).
- Komponen `components/ui/TryExampleButton.tsx` (client): mengisi input lewat callback `onFill(example)`.

**8.5 Beranda dipersonalisasi**
- `app/(dashboard)/dashboard/page.tsx`: tambahkan blok "Langkah berikutnya" di paling atas. Logika di `lib/next-step.ts` (fungsi murni, diuji unit): input `{ goal, cefr, dueCount, hasReadingInProgress, ... }` → satu saran `{ title, href, reason }`. Prioritas: review jatuh tempo > lanjutkan bacaan > (Fase 9) bacaan sesuai level > alat sesuai tujuan.
- Blok "Alat untuk kamu": 4–6 item dari `menu-config` yang `goals` cocok.

**8.6 Bahasa & landing**
- Audit teks UI berbahasa Inggris di halaman utama (dashboard, menu, library, review, vocabulary, settings, profile) → Indonesia. Nama fitur tetap, tapi tambahkan keterangan.
- `app/page.tsx` (landing): bagian 3 langkah *Baca → Simpan kata → Ulangi* dan 3 kartu tujuan. Pertahankan gaya visual yang ada.

**Selesai jika:** pengguna baru diarahkan ke onboarding lalu ke beranda yang menampilkan "Langkah berikutnya" + 4–6 alat; grup menu utama ≤ 30 item dengan deskripsi; path alat yang digabung me-redirect; `lib/next-step.ts` punya uji unit yang lulus; build lulus.

---

## Fase 9 — Fondasi belajar dasar

**9.1 Skema (`0007_graded_content.sql`)**
```sql
alter table texts add column if not exists cefr_level text check (cefr_level in ('A1','A2','B1','B2','C1','C2'));
alter table texts add column if not exists status text not null default 'published' check (status in ('draft','published'));
alter table texts add column if not exists source text;           -- 'admin' | 'ai' | 'public_domain' | 'user'
create index if not exists idx_texts_cefr on texts (cefr_level) where status = 'published';

create table if not exists core_words (
  word text primary key,
  band int not null,                 -- urutan frekuensi NGSL (1 = paling sering)
  cefr_estimate text not null,       -- A1..B2 dipetakan dari band
  pos text,
  example text
);
create table if not exists grammar_topics (
  slug text primary key,
  title text not null,
  cefr_level text not null,
  sort_order int not null,
  summary_id text not null,          -- ringkasan bahasa Indonesia
  examples jsonb not null default '[]',
  related_text_ids uuid[] default '{}'
);
-- RLS: core_words & grammar_topics bisa dibaca semua pengguna login, ditulis hanya admin (is_admin()).
-- texts: pengguna biasa hanya melihat status='published' (cek policy texts yang ada sebelum menambah).
```
- Seed `grammar_topics` ±20 topik A1–B1 di migrasi yang sama (judul, level, urutan, ringkasan singkat, 2–3 contoh).
- `core_words` **tidak** di-seed di migrasi (ukuran besar). Buat skrip `scripts/import-ngsl.mjs` yang membaca CSV NGSL dari path lokal dan meng-upsert dengan service role. **Cek lisensi NGSL di situs resminya sebelum dipakai** dan tulis atribusi di `/help`. Pemetaan band → CEFR di `lib/cefr.ts` (fungsi murni, diuji unit), mis. band 1–500 → A1, 501–1000 → A2, 1001–2000 → B1, 2001–2800 → B2 (angka final dikonfirmasi pemilik).

**9.2 Library berjenjang**
- `app/(dashboard)/library/page.tsx`: filter level (chip A1…C2 + "Semua"), default = level pengguna dan satu di bawahnya; label level di kartu; hanya `status='published'` (kecuali admin).
- `lib/cefr.ts`: `CEFR_LEVELS`, `levelIndex()`, `neighborLevels()`, `bandToCefr()`.

**9.3 Admin → tab "Konten"** (`app/(dashboard)/admin/content/`)
- Daftar teks dengan filter level/status; set level manual; tombol "Estimasi level dengan AI" (memanggil logika `analyze-difficulty` lewat server action yang memakai `runAI('analyze-difficulty', …)`).
- "Buat teks berjenjang dengan AI": form (level, topik, panjang) → `runAI('graded-text-generate', …)` → simpan sebagai `status='draft'`, `source='ai'` → admin meninjau/mengedit → terbitkan.
- Kelola `grammar_topics` (CRUD sederhana) dan lihat jumlah `core_words`.
- Semua aksi dicatat dengan `logAdminAction()`. Tambahkan tab "Konten" di `AdminTabs.tsx` dan grup Admin di menu HP.
- Feature key baru: `graded-text-generate` (requires `text`).

**9.4 Kosakata Inti** (`app/(dashboard)/vocabulary/core/page.tsx`)
- Daftar per level (paginated, 50 per halaman), status pengguna per kata (dicocokkan ke `vocabulary` milik pengguna: belum ada / sedang dipelajari / dikuasai jika `mastery_level >= 3`).
- Tombol "Tambah 10 kata berikutnya ke Review" → upsert ke `vocabulary` (pakai pola `app/api/vocabulary/route.ts`, `context_source = 'Kosakata Inti'`).

**9.5 Grammar Dasar** (`app/(dashboard)/english-lab/grammar/` + `[slug]/`)
- Daftar topik berurutan per level; halaman topik: ringkasan, contoh, tombol "Jelaskan lebih detail" (pakai route `grammar-clinic/mini-lesson` yang ada), latihan singkat (kirim kalimat ke Grammar Clinic), bacaan terkait.
- Status selesai per topik disimpan di localStorage (cukup untuk v3; pindah ke DB di Fase 10 jika dipakai sebagai bukti).

**9.6 Adaptasi level**
- `components/reader/TextDisplay.tsx`: default `beginnerLevel` = satu di bawah `profiles.cefr_level` (min A2).
- Route `lookup`, `grammar-clinic`, `grammar-clinic/mini-lesson`: terima level pengguna (ambil di server dari `profiles`, bukan dari klien) dan tambahkan instruksi bahasa penjelasan sesuai PRD §5.2.
- `lib/next-step.ts`: tambahkan saran "Baca teks level X" dari Library berjenjang.

**Selesai jika:** admin bisa menandai level teks dan membuat teks berjenjang (draft → published); Library terfilter per level; Kosakata Inti menampilkan status & bisa menambah ke Review; 20 topik grammar tampil berurutan; uji unit `lib/cefr.ts` lulus; build lulus.

---

## Fase 10 — Level per keterampilan & Tes Naik Level

**10.1 Skema (`0008_skill_levels.sql`)**
```sql
create table if not exists skill_evidence (
  id bigserial primary key,
  user_id uuid not null references auth.users on delete cascade,
  skill text not null check (skill in ('reading','vocabulary','grammar','listening','production')),
  source text not null,              -- 'reader_quiz' | 'grammar_clinic' | 'writing_eval' | 'dialogue' | 'listening' | 'level_test' ...
  score real,                        -- 0..100 jika ada
  cefr_estimate text,                -- jika sumber memberi estimasi level
  text_cefr text,                    -- level teks untuk bukti membaca
  ref_id text,                       -- id teks/sesi terkait
  created_at timestamptz default now()
);
create index if not exists idx_skill_evidence_user on skill_evidence (user_id, skill, created_at desc);

create table if not exists level_history (
  id bigserial primary key,
  user_id uuid not null references auth.users on delete cascade,
  skill text,                         -- null = level keseluruhan
  from_level text, to_level text not null,
  source text not null,               -- 'placement' | 'level_test' | 'manual' | 'evidence'
  created_at timestamptz default now()
);
alter table profiles add column if not exists skill_levels jsonb not null default '{}';
alter table profiles add column if not exists last_level_test_at timestamptz;
-- RLS: pengguna hanya membaca/menulis miliknya sendiri (insert evidence lewat route server dengan sesi pengguna).
```
- Seed `system_config.level_rules` dengan angka PRD §5.3 (`insert … on conflict do nothing`).

**10.2 Logika murni `lib/levels.ts`** (inti fase ini — **wajib diuji unit**)
- `computeSkillLevel(evidence[], currentLevel)` → level per keterampilan.
- `overallLevel(skillLevels)` → median, pembulatan ke bawah.
- `levelUpReadiness(evidence[], skillLevels, rules)` → `{ target, criteria: [{ key, label, met, progressText }], ready }`.
- `canTakeLevelTest(lastTestAt, now)` → cooldown 14 hari.
- Aturan: level tidak pernah turun otomatis.

**10.3 Perekam bukti** (`lib/skill-evidence.ts`: `recordEvidence(supabase, userId, {...})`, best effort, tidak boleh menggagalkan route)
- Kuis bab di reader: route baru `app/api/reading/quiz-result/route.ts` (requireUser) dipanggil dari `TextDisplay` saat pengguna menjawab (`quizAnswered`). Sertakan `text_cefr` dari `texts.cefr_level` (ambil di server).
- `writing-challenge/evaluate` dan `dialogue-simulator/feedback`: tambahkan `cefr_estimate` ke prompt JSON dan simpan sebagai bukti `production`.
- `grammar-clinic`: skor → `grammar`. `listening-test`/`evaluate-listening`: skor → `listening`.
- Kosakata dihitung saat dibutuhkan dari `vocabulary` + `core_words` (tanpa tabel bukti).
- Setelah merekam bukti, hitung ulang `profiles.skill_levels` (atau hitung saat halaman profil dibuka — pilih yang lebih sederhana dan konsisten).

**10.4 Tes Naik Level**
- Refactor ringan `app/api/placement-test/route.ts`: ekstrak generator soal & penilaian ke `lib/placement.ts` agar bisa dipakai dua mode. Mode `level_test`: hanya level target, 3 soal per bagian (reading, grammar, vocabulary, listening).
- Halaman `app/(dashboard)/english-lab/level-test/page.tsx` (pola UI dari Placement Test). Lulus jika ≥ 70% total dan tidak ada bagian < 50% (angka di `level_rules`).
- Simpan hasil ke `skill_evidence` (`source='level_test'`), `level_history`, `profiles.cefr_level`, `last_level_test_at`.
- Feature key baru: `level-test` (requires `text`).

**10.5 UI**
- `profile/page.tsx`: kartu "Level per keterampilan" (5 baris, level + sumber bukti terakhir) dan "Progres menuju {L+1}" (daftar syarat bercentang) + tombol Tes Naik Level (aktif bila `ready && canTakeLevelTest`).
- Dashboard: jika siap naik level, `lib/next-step.ts` menyarankan Tes Naik Level.
- Settings: ubah level manual → catat `level_history` (`source='manual'`).

**Selesai jika:** jawaban kuis reader, evaluasi menulis, dialog, grammar, dan listening tercatat di `skill_evidence`; profil menampilkan level per keterampilan & syarat; Tes Naik Level menaikkan level saat lulus dan menerapkan cooldown 14 hari; uji unit `lib/levels.ts` lulus (termasuk: tidak pernah turun otomatis, median, cooldown); build lulus.

---

## Fase 11 — Jalur penerjemahan akademik

**11.1 Skema (`0010_translation_academic.sql`)**
```sql
create table if not exists translation_techniques (
  taxonomy text not null,            -- 'molina_hurtado_albir_2002'
  key text not null,                 -- 'modulation'
  name_en text not null, name_id text not null, definition_id text not null, example text,
  primary key (taxonomy, key)
);
create table if not exists translation_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  title text not null,
  source_text text not null,
  brief text,                        -- tujuan/pembaca sasaran (skopos)
  status text not null default 'draft',
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists translation_segments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references translation_projects on delete cascade,
  idx int not null,
  source text not null,
  target text,
  status text not null default 'draft',   -- 'draft' | 'done'
  comment text,                            -- komentar penerjemah
  unique (project_id, idx)
);
create table if not exists technique_annotations (
  id uuid primary key default gen_random_uuid(),
  segment_id uuid not null references translation_segments on delete cascade,
  source_span text not null, target_span text not null,
  technique_key text not null, taxonomy text not null default 'molina_hurtado_albir_2002',
  suggested_by_ai boolean default false,
  created_at timestamptz default now()
);
create table if not exists translation_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  project_id uuid references translation_projects on delete cascade,
  rubric text not null default 'nababan_2012',
  per_segment jsonb not null,        -- [{ idx, accuracy, acceptability, readability, notes }]
  weighted_score real not null,      -- 1..3
  assessed_by text not null default 'ai',
  created_at timestamptz default now()
);
-- RLS: pemilik saja. translation_techniques: baca semua, tulis admin.
```
- Seed 18 teknik Molina & Hurtado Albir dengan nama & definisi Indonesia singkat (tulis sendiri, jangan menyalin buku).
- Seed feature key: `translation-rubric`, `translation-technique-suggest`.

**11.2 Logika murni** (`lib/translation/`, diuji unit)
- `segment.ts`: `splitSentences(text)` (tangani singkatan umum: Mr., Mrs., Dr., e.g., i.e., angka desimal, kutipan).
- `qa.ts`: `runQaChecks(segments, glossary)` → peringatan: segmen kosong, angka sumber ≠ sasaran, istilah glosarium tidak dipakai, sumber identik tapi terjemahan berbeda.
- `rubric.ts`: `weightedScore({accuracy, acceptability, readability})` dengan bobot 3:2:1; `translatorStage(scores[])` → `Pemula | Berkembang | Mahir`.
- `tm-match.ts`: kemiripan segmen dengan Translation Memory (rasio berbasis token, ambang 70%).

**11.3 Ruang Kerja Segmen** (`app/(dashboard)/translation-workspace/` + `[id]/`)
- Daftar proyek; buat proyek (tempel teks sumber + brief) → segmentasi otomatis.
- Editor: daftar segmen (paginated/virtual untuk teks panjang), panel samping (`ResponsivePanel`) berisi saran TM, istilah glosarium, peringatan QA, komentar, anotasi teknik.
- Simpan otomatis per segmen (debounce), status draft/selesai.
- Ekspor CSV bilingual & ringkasan teknik (CSV). Ekspor DOCX boleh menyusul.

**11.4 Anotasi teknik**
- Sorot teks sumber + sasaran dalam segmen → pilih teknik dari daftar (dengan definisi singkat).
- Tombol "Sarankan teknik" → `runAI('translation-technique-suggest', …)` mengembalikan JSON `[{ source_span, target_span, technique_key, reason }]`; ditampilkan sebagai saran, pengguna menerima/menolak.
- Ringkasan distribusi teknik per proyek (grafik batang sederhana).
- Juga tersedia di Translation Workshop (mode baru di `translation-workshop/page.tsx`).

**11.5 Penilaian rubrik**
- Mode evaluasi "Rubrik (Nababan)" di Translation Workshop dan tombol "Nilai dengan rubrik" di Ruang Kerja → `runAI('translation-rubric', …)` mengembalikan skor per segmen + alasan → disimpan ke `translation_assessments`.
- Profil: "Tahap penerjemah" bila `learning_goal='penerjemahan'`.

**Selesai jika:** proyek bisa dibuat, disegmentasi, diterjemahkan per segmen dengan saran TM/glosarium & QA; anotasi teknik manual + saran AI tersimpan; penilaian rubrik tersimpan dan tahap penerjemah tampil; uji unit `lib/translation/*` lulus; build lulus.

---

## Checklist verifikasi akhir v3

- [ ] Pengguna baru: onboarding → beranda terarah → bacaan sesuai level dalam ≤ 3 ketukan.
- [ ] Menu utama ≤ 30 item, semua berketerangan Indonesia; path lama alat yang digabung me-redirect.
- [ ] Library terfilter CEFR; ≥ 10 teks published per level A1–B2 (diisi admin).
- [ ] Bukti keterampilan tercatat dari 5 sumber; Tes Naik Level berfungsi dengan cooldown.
- [ ] Ruang Kerja Segmen, anotasi teknik, dan rubrik berfungsi; ekspor CSV.
- [ ] Semua halaman baru lolos audit 375px; `docs/mobile-audit.md` diperbarui.
- [ ] Semua migrasi baru tertulis dan tercantum di `docs/SESSION_HANDOFF.md` untuk dijalankan pemilik.
- [ ] Atribusi lisensi (NGSL, taksonomi, rubrik) tercantum di `/help`.
