# Implementation Plan — Literary Language Lab v4

Turunan dari [PRD.md](PRD.md). Penomoran melanjutkan v3. (Fase 12 di v3 — mode kelas — dibatalkan dan tidak pernah dibuat; nomor 12 dipakai ulang di sini.)

**Aturan umum** (lengkapnya di [HANDOFF.md](HANDOFF.md))
- **P1: hanya tampilan yang berubah.** Sebelum dan sesudah setiap fase redesign, buka [FEATURE_INVENTORY.md](FEATURE_INVENTORY.md) dan centang baris yang disentuh. Menghapus elemen UI yang memicu fitur = bug, walaupun fiturnya masih ada di kode.
- Pola dari v2/v3 tetap wajib (`runAI`, guard admin, `logAdminAction`, `components/ui/*`, `ResponsivePanel`, fallback sebelum migrasi).
- Migrasi baru mulai `0011`. Ditulis, tidak dijalankan.
- Verifikasi tiap fase: `npx tsc --noEmit`, lint tanpa temuan baru vs HEAD, build di path pendek, uji unit untuk logika murni, **halaman uji visual sementara** (di salinan build, bukan di repo) untuk komponen yang diubah, di 375px dan 1280px, tema terang dan gelap.

## Ringkasan fase

| Fase | Isi | Estimasi | Bergantung pada |
|---|---|---|---|
| 12 | Fondasi desain v4: token, huruf, tema, komponen dasar | 2–3 hari | v3 |
| 13 | Navigasi & tiga Ruang (susunan fitur) | 2–3 hari | 12 |
| 14 | Redesign halaman (bertahap, 14a–14e) + Tongkat Ajaib bisa digeser | 6–8 hari | 13 |
| 15 | Mesin latihan terstruktur + review grammar | 4–5 hari | 12 |
| 16 | Kursus Dasar: unit A0–A2 | 4–5 hari | 15, 14a |
| 17 | Modul khas penutur Indonesia | 2–3 hari | 15 |

Fase 15 menyentuh file yang berbeda dari 13–14 dan bisa dikerjakan paralel setelah Fase 12.

---

## Fase 12 — Fondasi desain v4

**12.1 Token** (`app/globals.css`)
- Ubah **nilai** token yang ada (`--background`, `--foreground`, `--card`, `--border`, `--muted`, `--muted-foreground`, `--brand`, `--brand-hover`, `--danger`) untuk `:root` dan `.dark` sesuai PRD §5.1. **Jangan menghapus atau mengganti nama token** — ratusan kelas Tailwind memakainya.
- Tambah token baru seperlunya: `--paper` (latar baca), `--ink` (teks baca), `--brand-ink` (hijau gelap untuk teks/tombol di tema terang), `--rule` (garis tipis).
- Hapus dari `body` di `globals.css`: `background-image` radial gradient (glow). Hapus `selection:text-white` bila kontrasnya buruk di latar terang.
- Hitung kontras setiap pasangan teks/latar utama di kedua tema dengan skrip kecil (`tests/contrast.test.mts`, rumus WCAG relative luminance) — semua ≥ 4.5:1 untuk teks normal.

**12.2 Huruf** (`app/layout.tsx`)
- Ganti `Inter` → `Public_Sans` dan `Merriweather` → `Newsreader` dari `next/font/google`, **dengan nama variabel yang sama** (`--font-sans`, `--font-serif`). Cek `prose-literature` dan pilihan font reader (`serif`/`sans-serif`/`dyslexic`) tetap bekerja.

**12.3 Komponen dasar** (`components/ui/primitives.tsx`, `Tabs.tsx`, `ResponsivePanel.tsx`)
- Restyle `Button`, `Card`, `CardTitle`, `Input`, `Badge`, `EmptyState`, `Skeleton`, `Tabs` ke gaya v4 (kartu bergaris tipis, label kapital kecil, tombol utama `--brand-ink`). API/props **tidak berubah**.
- Tambah komponen gaya katalog bila perlu: `SectionHeading` (judul bagian seperti bab), `Eyebrow` (label kapital kecil), `BookSpine` (sampul sederhana untuk bacaan).

**12.4 Pembersihan gaya dekoratif global**
- Cari & ganti pola dekoratif umum di seluruh `app/` dan `components/`: `shadow-[0_0_*rgba(...)]` (glow), `bg-gradient-to-*` dekoratif, `backdrop-blur-*` pada kartu, `hover:-translate-y-1`, `animate-pulse` dekoratif. **Hanya kelas gaya**; jangan menghapus elemen, handler, atau teks. Daftar file yang diubah masuk laporan.

**Selesai jika:** kedua tema memakai palet baru dengan kontras teruji; huruf baru aktif di seluruh aplikasi; komponen dasar restyled tanpa perubahan props; tidak ada glow/gradasi dekoratif tersisa (grep di laporan); semua baris inventaris bagian A tetap berfungsi; build lulus.

---

## Fase 13 — Navigasi & tiga Ruang

**13.1 Data menu** (`lib/menu-config.ts`)
- Tambah struktur ruang: `ROOMS` = `belajar-dasar`, `baca-sastra`, `terjemah`, plus `koleksi`, `komunitas`. Setiap item menu lama dipetakan ke ≥ 1 ruang dengan **urutan** (`order`) sesuai PRD §5.2. Item boleh muncul di beberapa ruang.
- Uji unit `tests/menu-coverage.test.mts`: **setiap path di inventaris (bagian C–I) dan setiap path di menu lama muncul di minimal satu ruang** — uji ini gagal jika ada fitur yang hilang dari navigasi.

**13.2 Halaman ruang** (baru): `app/(dashboard)/ruang/[slug]/page.tsx`
- Pembuka ruang: judul, deskripsi, lalu alat berurutan dalam kelompok bernomor (gaya daftar isi), tiap item ber-deskripsi. Ruang sesuai `learning_goal` diberi tanda "Tujuanmu".

**13.3 Sidebar desktop & Menu HP**
- `components/Sidebar.tsx`: Beranda → Ruang I–III → Koleksi saya → Komunitas → Semua alat (`/tools`) → Admin (khusus admin). Pertahankan: collapse, tema, Word of the Day, kartu pengguna, Settings, Sign Out, badge.
- **Tambah LingoWise AI** di Ruang II (temuan K1).
- `app/(dashboard)/menu/page.tsx`: susunan sama dengan Sidebar; pencarian tetap mencari **semua** item.

**13.4 Bottom nav HP** (`components/MobileBottomNav.tsx`)
- Sesuai keputusan Q1 (default: Beranda · Baca · Belajar · Terjemah · Menu). Status aktif per path tetap. Pastikan Kosakata & Alat ≤ 2 ketukan.

**Selesai jika:** uji `menu-coverage` lulus; ketiga halaman ruang tampil berurutan; LingoWise terjangkau dari desktop; setiap item inventaris terjangkau ≤ 2 ketukan dari navigasi (catat jalurnya di laporan); build lulus.

---

## Fase 14 — Redesign halaman

Kerjakan per sub-fase; **satu commit per sub-fase**. Di setiap sub-fase: ubah markup/kelas gaya, **jangan** mengubah handler, state, pemanggilan API, atau teks yang bermakna fitur. Sebelum mulai, salin daftar baris inventaris yang relevan ke laporan; setelah selesai, centang dan sebut cara mengujinya.

**14a — Beranda & ruang**: `dashboard`, `ruang/[slug]`, `onboarding`, `LevelProgressCard`, `TranslatorStageCard` mengikuti mockup Beranda desktop/HP.

**14b — Reader & Word Lookup** (inventaris C, C.1, C.2)
- `TextDisplay`, `ReaderBlock`, `InteractiveParagraph`, `WordLookupSidebar`, `SentenceAnalysisSidebar`, `BookmarkSidebar`, `ReadingCompanionSidebar`, `VocabFlashcardModal`, `CulturalTextRenderer`, halaman `gutenberg/[id]` & `read/[textId]`.
- Mengikuti mockup "Membaca — HP": header ringkas, progress tipis, halaman kertas. Word Lookup: **ke-16 mode** dalam grid 4 kolom di HP, Pictionary, dengar, Konteks Kalimat, hasil, Simpan Kata/kolokasi — sama persis.
- Tema reader terang/sepia/gelap/kontras tinggi, font disleksia, line numbers, highlight color — semua tetap.
- **Tongkat Ajaib bisa digeser** (PRD §5.4): logika di `lib/reader/drag-fab.ts` (fungsi murni: ambang ketuk vs geser, clamp, snap ke tepi; **diuji unit**), komponen `components/reader/MagicWandButton.tsx` (pointer events + `setPointerCapture`, `touch-action: none`, posisi di `localStorage` `reader-wand-pos`). Ganti tombol FAB di `TextDisplay` dengan komponen ini; perilaku ketuk = `setIsInspectMode` seperti sekarang.
- Jangan menambah blur/bayangan di area baca (performa Fase 7).

**14c — Kosakata & English Lab** (inventaris D, E): vocabulary, core, review, flashcard (4 mode), idioms, glossary, lexicon, a-z, placement, level-test, grammar, grammar-clinic, dialogue-simulator, listening-test, slang, paraphrase, writing-assistant, sentence-architect, story-quiz, pronunciation.

**14d — Sastra & Terjemah** (inventaris F, G): tools hub, `tools/[id]` (28 alat + "Coba dengan contoh"), tone-analyzer (2 mode), lingowise (8 mode), alter-ego, cultural-context, annotations, history, translation-workshop (5 mode + teknik), translation-workspace, translation-memory, comparator, untranslatables, parallel-text, timelapse.

**14e — Komunitas, profil, pengaturan, bantuan, admin, auth** (inventaris B, H, I, J): forum, clubs, community, messages, community-annotations, `p/[username]`, profile, settings (**semua** bagian & preferensi, termasuk ekspor CSV, hapus akun, Developer Tools), help + Liter-AI, 9 tab admin, login/register/OAuth, landing.

**Selesai jika (per sub-fase):** semua baris inventaris sub-fase itu tercentang dengan cara uji; halaman uji visual 375px & 1280px, terang & gelap; uji `drag-fab` lulus (14b); `docs/mobile-audit.md` diperbarui; build lulus.

---

## Fase 15 — Mesin latihan terstruktur + review grammar

**15.1 Skema** (`0011_exercises.sql`)
```sql
create table if not exists exercises (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('mcq','cloze','order','match','dictation')),
  cefr_level text not null,
  topic_slug text references grammar_topics(slug) on delete set null,
  unit_slug text,                       -- diisi Fase 16
  tags text[] default '{}',             -- mis. 'l1-error', 'minimal-pair' (Fase 17)
  prompt jsonb not null,                -- bentuk per tipe, lihat lib/exercises/types.ts
  answer jsonb not null,                -- jawaban benar + alternatif yang diterima
  explanation_id text not null,         -- penjelasan bahasa Indonesia
  status text not null default 'draft' check (status in ('draft','published')),
  source text not null default 'admin', -- 'admin' | 'ai'
  created_at timestamptz default now()
);
create table if not exists exercise_attempts (
  id bigserial primary key,
  user_id uuid not null references auth.users on delete cascade,
  exercise_id uuid not null references exercises on delete cascade,
  correct boolean not null,
  response jsonb,
  created_at timestamptz default now()
);
create table if not exists grammar_progress (
  user_id uuid not null references auth.users on delete cascade,
  topic_slug text not null references grammar_topics(slug) on delete cascade,
  completed_at timestamptz,
  next_review_at timestamptz, interval int default 1, efactor real default 2.5, repetitions int default 0,
  primary key (user_id, topic_slug)
);
-- RLS: exercises published dibaca semua pengguna login, tulis admin (is_admin()); attempts & grammar_progress milik sendiri.
```
- Seed feature key `exercise-generate` (requires `text`) di `ai_feature_routes`.

**15.2 Logika murni** (`lib/exercises/`, **diuji unit**)
- `types.ts`: bentuk `prompt`/`answer` per tipe.
- `grade.ts`: `gradeAnswer(exercise, response)` → `{ correct, expected }` dengan normalisasi (huruf besar, tanda baca, spasi, apostrof lurus/miring) dan jawaban alternatif.
- `session.ts`: pilih N soal untuk topik/unit (acak terkontrol, prioritaskan yang pernah salah).

**15.3 UI latihan** (`components/exercises/`): satu komponen per tipe (`McqExercise`, `ClozeExercise`, `OrderExercise` — ketuk kata, bukan drag wajib; `MatchExercise`; `DictationExercise` memakai `/api/tts`), plus `ExerciseSession` (umpan balik langsung + penjelasan Indonesia). Gaya v4, target sentuh ≥ 44px.

**15.4 Integrasi**
- Halaman topik Grammar Dasar: tambah "Latihan terstruktur" (soal published untuk topik itu). **Latihan kalimat bebas + Grammar Clinic yang lama tetap ada** (P1).
- Hasil → `exercise_attempts` + `skill_evidence` (grammar/vocabulary/listening, Fase 10).
- Review grammar: menyelesaikan topik membuat baris `grammar_progress`; jadwal memakai `calculateSM2` dari `lib/spaced-repetition.ts`. Status selesai di `localStorage` (`lib/grammar-progress.ts`) dimigrasikan sekali ke database saat halaman dibuka (lalu tetap dibaca sebagai cadangan sebelum migrasi dijalankan).
- Beranda: "Review hari ini" = kosakata jatuh tempo + topik grammar jatuh tempo (`lib/next-step.ts`).
- Admin → Konten: tab "Latihan" — daftar, filter, edit, terbitkan; "Buat soal dengan AI" (`runAI('exercise-generate', …)`, JSON tervalidasi terhadap `types.ts`) → draft. `logAdminAction` untuk semua aksi.

**Selesai jika:** kelima tipe latihan bisa dikerjakan & dinilai tanpa AI; uji unit `grade.ts`/`session.ts` lulus; review grammar terjadwal; admin bisa membuat soal AI → draft → terbit; build lulus.

---

## Fase 16 — Kursus Dasar (unit A0–A2)

**16.1 Skema** (`0012_course_units.sql`): `course_units (slug pk, title, cefr_level, sort_order, theme_id, intro_id, steps jsonb, status)` dan `unit_progress (user_id, unit_slug, step_index, completed_at, pk(user_id, unit_slug))`. `steps` = array langkah bertipe: `vocab` (daftar kata / kata inti), `grammar` (topic_slug), `read` (text_id), `listen` (teks untuk TTS), `exercise` (filter soal unit), `speak` (kalimat untuk Pronunciation Clinic atau skenario Dialogue Simulator). Seed 12 unit (judul, level, urutan, intro Indonesia; langkah yang merujuk konten yang belum ada dibiarkan kosong dan ditandai).
- Logika murni `lib/course.ts` (diuji unit): langkah berikutnya, persen selesai, unit yang disarankan.

**16.2 UI**: `app/(dashboard)/kursus/page.tsx` (daftar unit per level, disarankan, tidak dikunci) dan `kursus/[slug]` (pemutar langkah; setiap langkah memakai komponen yang ada: kartu kosakata, ringkasan topik grammar, `TextDisplay` untuk bacaan pendek, TTS, `ExerciseSession`, Pronunciation Clinic). Masuk Ruang I di urutan ke-2 (Fase 13).

**16.3 Admin**: kelola unit & langkah di Admin → Konten (pilih kata, topik, teks, soal).

**Selesai jika:** 12 unit tampil; satu unit contoh lengkap end-to-end (pemilik mengisi kontennya); progres tersimpan di database; `next-step` menyarankan unit berikutnya; uji unit `course.ts` lulus; build lulus.

---

## Fase 17 — Modul khas penutur Indonesia

- Seed data (`0013_l1_modules.sql`): `l1_errors (slug, title, wrong, right, explanation_id, cefr_level)` ±15 kesalahan umum (PRD §6.4) dan `minimal_pairs (slug, word_a, word_b, ipa_a, ipa_b, note_id)` ±15 pasangan. Soal terkait = `exercises` dengan tag `l1-error` / `minimal-pair`.
- UI di Ruang I: "Kesalahan Umum" (kartu salah → benar + penjelasan + latihan) dan "Pasangan Bunyi" (dengar TTS A/B → pilih; lalu ucapkan dengan Pronunciation Clinic).
- Hubungkan ke unit Kursus Dasar yang relevan (langkah `exercise` dengan tag).

**Selesai jika:** kedua modul berfungsi dengan latihan dinilai otomatis; terhubung dari Ruang I dan unit terkait; build lulus.

---

## Checklist verifikasi akhir v4

- [ ] Semua baris [FEATURE_INVENTORY.md](FEATURE_INVENTORY.md) tercentang (desktop & HP, terang & gelap).
- [ ] Uji `menu-coverage` lulus: tidak ada fitur yang hilang dari navigasi.
- [ ] Kontras WCAG AA lulus di kedua tema (uji `contrast`).
- [ ] Tongkat Ajaib bisa digeser, menempel ke tepi, ketuk tetap menyalakan/mematikan, posisi tersimpan.
- [ ] LingoWise terjangkau dari desktop.
- [ ] Kelima tipe latihan dinilai tanpa AI; review grammar terjadwal.
- [ ] 12 unit Kursus Dasar tampil; ≥ 10 bacaan published per A1 & A2 (konten pemilik).
- [ ] Modul kesalahan umum & pasangan bunyi berfungsi.
- [ ] Migrasi `0011`–`0013` tercantum di `docs/SESSION_HANDOFF.md` untuk dijalankan pemilik.
