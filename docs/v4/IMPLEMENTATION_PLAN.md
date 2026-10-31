# Implementation Plan — Literary Language Lab v4

Turunan dari [PRD.md](PRD.md). Penomoran melanjutkan v3. (Fase 12 di v3 — mode kelas — dibatalkan dan tidak pernah dibuat; nomor 12 dipakai ulang di sini.)

**Aturan umum** (lengkapnya di [HANDOFF.md](HANDOFF.md); semua keputusan visual di [DESIGN.md](DESIGN.md))
- **P1: hanya tampilan yang berubah.** Sebelum dan sesudah setiap fase redesign, buka [FEATURE_INVENTORY.md](FEATURE_INVENTORY.md) dan centang baris yang disentuh. Menghapus elemen UI yang memicu fitur = bug, walaupun fiturnya masih ada di kode.
- Pola dari v2/v3 tetap wajib (`runAI`, guard admin, `logAdminAction`, `components/ui/*`, `ResponsivePanel`, fallback sebelum migrasi).
- Migrasi baru mulai `0011` (`0011` = perbaikan cascade profil di 14f; Fase 15–17 memakai `0012`–`0014`; `0015` = pengayaan Kosakata Inti di 14g). Ditulis, tidak dijalankan.
- Verifikasi tiap fase: `npx tsc --noEmit`, lint tanpa temuan baru vs HEAD, build di path pendek, uji unit untuk logika murni, **halaman uji visual sementara** (di salinan build, bukan di repo) untuk komponen yang diubah, di 375px dan 1280px, tema terang dan gelap.

## Ringkasan fase

| Fase | Isi | Estimasi | Bergantung pada |
|---|---|---|---|
| 12 | Fondasi desain v4: token, huruf, tema, komponen dasar | 2–3 hari | v3 |
| 13 | Navigasi & tiga Ruang (susunan fitur) | 2–3 hari | 12 |
| 14 | Redesign halaman (bertahap, 14a–14e) + Tongkat Ajaib bisa digeser + **14f: lima route API dihidupkan** | 7–9 hari | 13 |
| 14g | Pengayaan Kosakata Inti: definisi & bentuk kata NGSL | 1–2 hari | — (sebelum 15–16) |
| 15 | Mesin latihan terstruktur + review grammar | 4–5 hari | 12 (memakai 14g bila sudah ada) |
| 16 | Kursus Dasar: unit A0–A2 | 4–5 hari | 15, 14a |
| 17 | Modul khas penutur Indonesia | 2–3 hari | 15 |

Fase 15 menyentuh file yang berbeda dari 13–14 dan bisa dikerjakan paralel setelah Fase 12.

---

## Fase 12 — Fondasi desain v4

**12.1 Token** (`app/globals.css`)
- Ubah **nilai** token yang ada (`--background`, `--foreground`, `--card`, `--border`, `--muted`, `--muted-foreground`, `--brand`, `--brand-hover`, `--danger`) untuk `:root` dan `.dark` sesuai **DESIGN.md §3** (nilai & rasio kontras sudah dihitung di sana). **Jangan menghapus atau mengganti nama token** — ratusan kelas Tailwind memakainya.
- Tambah token baru seperlunya: `--paper` (latar baca), `--ink` (teks baca), `--brand-ink` (hijau gelap untuk teks/tombol di tema terang), `--rule` (garis tipis).
- Hapus dari `body` di `globals.css`: `background-image` radial gradient (glow). Hapus `selection:text-white` bila kontrasnya buruk di latar terang.
- Hitung kontras setiap pasangan teks/latar utama di kedua tema dengan skrip kecil (`tests/contrast.test.mts`, rumus WCAG relative luminance) — semua ≥ 4.5:1 untuk teks normal.

**12.2 Huruf** (`app/layout.tsx`, `app/globals.css`) — ikuti DESIGN.md §2
- `next/font/google`: ganti `Inter` → `Source_Sans_3` dengan variabel **`--font-sans`** (nama sama); ganti `Merriweather` → `Alegreya` dengan variabel **`--font-alegreya`**.
- **Michelangelus hanya lewat `local()`**: tambahkan 4 `@font-face` (`Michelangelus Local`, 400/700 × normal/italic, `src: local("Michelangelus"), local("Michelangelus Regular"), …`) di `globals.css`, lalu `--font-serif: "Michelangelus Local", var(--font-alegreya), Georgia, serif;`. **Jangan** menaruh file Michelangelus di repo/`public/`, jangan `next/font/local`, jangan konversi WOFF (lisensi; DESIGN.md §2.2).
- Cek `prose-literature`, judul serif, dan pilihan font reader (`serif`/`sans-serif`/`dyslexic`) tetap bekerja; uji visual dua kali: di perangkat **dengan** Michelangelus terpasang dan **tanpa** (hasilnya Alegreya).
- Tambahkan atribusi huruf di halaman Bantuan (DESIGN.md §2.2 butir 4).

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

**14f — Lima route API: perbaiki & pakai** (keputusan pemilik, temuan K2 di inventaris)

Kelima route sudah ada tetapi tidak dipanggil UI. **Jangan dihapus**: perbaiki lalu pakai. Setiap route mendapat tombol/tampilan baru; **tidak ada fitur lama yang diganti atau hilang** kecuali yang disebut eksplisit di bawah (hanya hapus akun yang berganti jalur pemanggilan; pencarian buku **tidak** berganti jalur, melainkan mendapat opsi ketiga).

1. **`/api/gutenberg/search`** — proxy Gutendex dengan rate limit per IP & cache di server.
   - **Keputusan pemilik: dua opsi yang ada (OpenLibrary dan Gutendex) TIDAK diubah sama sekali** — tetap memanggil `openlibrary.org` dan `gutendex.com` langsung seperti sekarang, termasuk "Muat lagi".
   - *Perbaiki:* pastikan `page` diteruskan (sudah ada sejak Fase 7) dan error upstream dikembalikan sebagai pesan ramah.
   - *Pakai:* tambahkan **opsi ketiga** di pemilih provider `app/(dashboard)/gutenberg/page.tsx`, mis. `SearchProvider = "openlibrary" | "gutendex" | "server"` dengan label **"Gutenberg (server)"** dan keterangan singkat ("lewat server aplikasi: lebih stabil, ada cache"). Opsi ini memanggil `/api/gutenberg/search?q=…&page=…` untuk pencarian pertama dan "Muat lagi"; respons berbentuk sama dengan Gutendex (`results`, `next`, `count`), jadi pemetaan hasil Gutendex yang ada dipakai ulang tanpa diubah.
   - Penyesuaian kecil yang perlu (tanpa mengubah perilaku dua opsi lama): `localStorage` `gutenberg-provider` menerima nilai `"server"`; placeholder/teks bantuan menyebut opsi ketiga; tautan "Coba lewat …" saat error menawarkan **dua provider lainnya** (bukan hanya bolak-balik dua) — perilaku untuk OpenLibrary ↔ Gutendex tetap tersedia.
2. **`/api/wotd`** — mini-lesson + kuis 1 soal untuk satu kata dari kosakata pengguna.
   - *Perbaiki:* kata **deterministik per pengguna per hari** (urutkan kosakata, pilih dengan hash `userId + tanggal`) menggantikan `Math.random`; jika kosakata kosong pakai `core_words` A1–A2 (jika tabel ada) lalu daftar cadangan; buang komentar `//` dari contoh JSON di prompt; validasi bentuk respons (`quiz.options` 2–4, `quiz.answer` dalam rentang) sebelum dikirim; tambah `checkRateLimit(user.id, "wotd")`.
   - *Pakai:* kartu **Word of the Day di Sidebar tetap menampilkan kata lokal seperti sekarang** (tanpa panggilan AI saat halaman dibuka) + tombol baru **"Pelajari"** → panel (`ResponsivePanel`) yang memuat `/api/wotd` saat diklik: pelajaran, kolokasi, kuis 1 soal dengan umpan balik, tombol **Simpan kata** (`/api/vocabulary`). Hasil disimpan di `localStorage` `wotd:<tanggal>` agar tidak memanggil AI dua kali sehari. Karena Sidebar tidak tampil di HP, tambahkan kartu kecil yang sama di **Beranda** (HP & desktop).
3. **`/api/analyze-tone`** — tone kalimat + penanda linguistik + tips mempertahankan tone saat menerjemahkan + usulan terjemahan.
   - *Perbaiki:* parse JSON yang tahan pagar kode (pola `formatAITextResponse`/strip ```` ``` ````) dengan `try/catch` → 502 berpesan jelas; batasi panjang `text` (≤ 1.000 karakter) dan `context` (≤ 2.000); validasi `confidence` 0–100.
   - *Pakai:* (a) **modal Tongkat Ajaib** (kalimat yang diinspeksi): tombol baru **"Analisis tone"** di bawah Bedah Sintaksis, konteks = teks paragraf; (b) **Ruang Kerja Segmen** (`SegmentPanel`): tombol **"Analisis tone segmen"**, menampilkan tips & usulan terjemahan (tidak menimpa terjemahan pengguna; ada tombol "Pakai usulan" yang hanya mengisi bila pengguna menekan).
4. **`/api/detect-idioms`** — deteksi ±180 idiom **tanpa AI** (pencocokan pola lokal).
   - *Perbaiki:* pindahkan data & logika ke `lib/idioms/` (`IDIOM_DB` + fungsi murni `detectIdioms(text)`), **diuji unit** — termasuk pola posesif (`pull someone's leg`) yang kemungkinan rusak karena di-escape sebelum diganti; ganti `checkRateLimit` (yang mencatat ke `ai_usage_logs` dan memakan kuota AI) dengan limiter ringan tanpa log, mis. `checkIpRateLimit("user:" + user.id, 120)`; batasi panjang `text` (≤ 20.000 karakter).
   - *Pakai:* **reader** — sekali per halaman (bukan per paragraf), kirim teks halaman aktif, simpan hasil per halaman; tandai idiom di teks dengan gaya berbeda dari referensi budaya (mis. garis bawah putus-putus hijau) + tooltip arti & padanan Indonesia + tombol **Simpan ke Idiom Library** (pakai cara simpan yang sudah ada di halaman `/idioms`). Preferensi baru `reading.highlight_idioms` (default aktif) di Pengaturan → Reading Experience. Jangan menambah beban render: kirim daftar idiom per blok sebagai prop ke `ReaderBlock` (memo) dan gabungkan di `CulturalTextRenderer` sebagai jenis penanda kedua.
5. **`/api/auth/delete-account`** — hapus akun lewat Admin API setelah konfirmasi email.
   - *Perbaiki:* pakai `requireUser()`; jika `SUPABASE_SERVICE_ROLE_KEY` tidak ada → 503 dengan pesan jelas; **migrasi `0011_profile_cascade.sql`**: pastikan FK `profiles.id → auth.users(id)` memakai `ON DELETE CASCADE` (di baseline tidak) — cari nama constraint lewat `pg_constraint` di blok `DO`, drop & buat ulang; tanpa ini `auth.admin.deleteUser` bisa gagal (juga memengaruhi hapus pengguna di admin).
   - *Pakai:* `settings/page.tsx` `handleDeleteAccount` memanggil `POST /api/auth/delete-account { email }` **menggantikan** `supabase.rpc('delete_user')` (RPC itu tidak ada di migrasi mana pun, jadi kemungkinan tidak berfungsi). Setelah sukses: `signOut()` lalu ke `/login`. Tombol terpisah **"hapus data Vocabulary & Riwayat"** tetap ada tanpa perubahan.
6. **Temuan terkait (perbaiki di 14f):** ekspor CSV "translations" di Pengaturan membaca tabel `translation_submissions`, padahal migrasi hanya punya `translations`. Cek tabel mana yang dipakai Translation Workshop menyimpan hasil, lalu arahkan ekspor ke tabel itu (fallback ke yang lain jika error `42P01`).

**Selesai jika (14f):** kelima route dipanggil dari UI dan berfungsi; pencarian OpenLibrary & Gutendex berperilaku persis seperti sebelumnya dan opsi ketiga "Gutenberg (server)" berfungsi (cari + Muat lagi); uji unit `lib/idioms` lulus (termasuk posesif); `detect-idioms` tidak lagi menulis `ai_usage_logs`; Word of the Day sama sepanjang hari & tidak memanggil AI saat halaman dibuka; hapus akun berhasil di lingkungan non-produksi setelah `0011` dijalankan (atau dicatat sebagai "perlu diuji pemilik"); ekspor terjemahan menghasilkan file; FEATURE_INVENTORY diperbarui (baris baru: tombol Pelajari WOTD, Analisis tone, penanda idiom, preferensi `highlight_idioms`); build lulus.

**Selesai jika (per sub-fase):** semua baris inventaris sub-fase itu tercentang dengan cara uji; halaman uji visual 375px & 1280px, terang & gelap; uji `drag-fab` lulus (14b); `docs/mobile-audit.md` diperbarui; build lulus.

---

## Fase 14g — Pengayaan Kosakata Inti (definisi & bentuk kata NGSL)

Tidak bergantung pada fase lain (hanya `0007`, sudah dijalankan). Sebaiknya selesai **sebelum Fase 15–16**, karena latihan dan unit memakai definisinya. Tidak mengubah peringkat/level yang sudah diimpor pemilik.

**Data (tidak ada di repo; pemilik yang menyimpannya).** Semua dari situs NGSL, lisensi CC BY-SA 4.0:
- `NGSL_1.2_with_English_definitions.xlsx`: kolom `Word | Definitons` (ejaan "Definitons" memang begitu), 2.809 baris, **urutan tidak menurut frekuensi**. Pemilik menyimpannya sebagai *CSV UTF-8* dari Excel. Skrip **tidak** membaca xlsx, supaya tidak perlu dependensi baru.
- `NGSL_1.2_lemmatized_for_teaching.csv`: baris diawali `##` adalah komentar; tiap baris = headword lalu bentuk-bentuknya (`search,searches,searched,searching`). Homograf bisa muncul lebih dari sekali. Ada **potongan kontraksi** yang bukan kata (`be,am,m,is,isn,s,are,re,aren,ain,…`).
- File *basic statistics* (peringkat) **sudah diimpor** pemilik lewat `scripts/import-ngsl.mjs`; tidak diimpor ulang.
- Jebakan Excel: `true`/`false` tertulis `TRUE`/`FALSE` di semua file. Semua kunci dinormalkan ke huruf kecil (sama seperti `import-ngsl.mjs`).

**14g.1 Migrasi** `0015_core_words_enrichment.sql` (nomor 0015 agar 0012–0014 tidak bergeser; tidak bergantung pada 0011–0014):
```sql
ALTER TABLE core_words ADD COLUMN IF NOT EXISTS definition_en TEXT;
ALTER TABLE core_words ADD COLUMN IF NOT EXISTS forms TEXT[] NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_core_words_forms ON core_words USING GIN (forms);
```
RLS tidak berubah (kebijakan `0007` berlaku untuk kolom baru).

**14g.2 Logika murni** `scripts/lib/ngsl-enrich.mjs` (**diuji unit** di `tests/ngsl-enrich.test.mts`):
- `parseDefinitions(csvText)` → `Map<word, definition>`: kolom dikenali dari header yang diawali `word` dan `defin`; kata di-trim & huruf kecil; spasi definisi dirapikan; kata ganda → definisi digabung dengan `; `.
- `parseForms(csvText)` → `Map<headword, string[]>`: abaikan baris `##` dan baris kosong; gabungkan homograf (union, tanpa duplikat); buang headword itu sendiri dan **potongan kontraksi** (daftar tetap di modul: `s, m, re, ve, ll, d, t, isn, aren, ain, wasn, weren, don, doesn, didn, hasn, haven, hadn, won, wouldn, couldn, shouldn, mustn, needn, bein`; diuji dengan baris `be`). Hanya bentuk huruf/tanda hubung yang disimpan.
- Uji minimal: `TRUE` → `true`; `search` → `[searches, searched, searching]`; baris `be` tidak menghasilkan `m`/`s`/`isn`; header `Definitons` dikenali.

**14g.3 Skrip** `scripts/enrich-ngsl.mjs` (pola sama dengan `import-ngsl.mjs`: env `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`, komentar cara pakai & lisensi di kepala file):
```
node scripts/enrich-ngsl.mjs --definitions defs.csv --forms teaching.csv [--dry-run]
```
- Membaca semua `core_words.word` dulu, lalu **hanya UPDATE baris yang sudah ada** (`definition_en`, `forms`), per batch ±200. **Tidak pernah INSERT**, tidak menyentuh `band`/`cefr_estimate`/`pos`/`example`.
- Salah satu argumen boleh dihilangkan (hanya definisi, atau hanya bentuk kata).
- Laporan akhir: jumlah kata diperbarui, kata di file yang tidak ada di `core_words`, dan kata `core_words` tanpa definisi. `--dry-run` hanya mencetak laporan.
- Tambahkan petunjuk di Admin → Konten (di sebelah petunjuk `import-ngsl.mjs` yang sudah ada).

**14g.4 Pemakaian di UI** (hanya menambah; semua yang ada tetap. Sebelum `0015` dijalankan, query yang memilih kolom baru jatuh ke query lama saat error `42703`/`PGRST204`):
- `vocabulary/core/page.tsx`: tampilkan `definition_en` di bawah kata (teks kecil, gaya DESIGN.md). Tanpa definisi → tampilan sekarang.
- `vocabulary/core/actions.ts` ("Tambah 10 kata ke Review"): saat membuat baris `vocabulary`, isi kolom arti/definisi yang **sudah ada** di skema `vocabulary` (cek skemanya, jangan menambah kolom) dengan `definition_en`. Kata yang sudah dimiliki pengguna tidak ditimpa.
- `lib/core-words.ts` (baru, diuji unit untuk bagian murninya): `lemmaOf(word, rows)` mencari kata di `word` atau `forms`. Dipakai untuk menghitung status Kosakata Inti, sehingga kata simpanan `searched` dihitung sebagai `search`. Query ke DB memakai `.or('word.eq.x,forms.cs.{x}')`.
- Fase 15 (ditambahkan ke 15.4): Admin → Konten → Latihan mendapat tombol **"Buat soal dari Kosakata Inti"** yang membuat soal `match` (kata ↔ definisi) dan `mcq` ("apa arti kata ini?") **tanpa AI**; pengecoh diambil dari kata `cefr_estimate` yang sama. Status `draft` seperti soal lain. `exercise-generate` boleh menyertakan definisi di prompt.
- Fase 16: langkah `vocab` menampilkan `definition_en`.
- `/help`: tambah satu kalimat bahwa definisi & bentuk kata juga berasal dari NGSL (CC BY-SA 4.0). Atribusi yang ada tetap.

**Bukan bagian 14g:** terjemahan Indonesia per kata (bisa menyusul sebagai draf AI yang ditinjau admin).

**Selesai jika (14g):** uji unit `ngsl-enrich` dan `core-words` lulus; `--dry-run` terhadap file pemilik melaporkan ±2.809 kata cocok (dicatat di laporan; jika file tidak tersedia di sesi, uji dengan potongan contoh dan tandai "perlu dijalankan pemilik"); halaman Kosakata Inti tetap berfungsi sebelum dan sesudah `0015`; FEATURE_INVENTORY ditambah baris: definisi di Kosakata Inti, pengenalan bentuk kata, skrip `enrich-ngsl`; build lulus.

---

## Fase 15 — Mesin latihan terstruktur + review grammar

**15.1 Skema** (`0012_exercises.sql`)
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
- Admin → Konten: tab "Latihan" — daftar, filter, edit, terbitkan; "Buat soal dari Kosakata Inti" (tanpa AI, Fase 14g); "Buat soal dengan AI" (`runAI('exercise-generate', …)`, JSON tervalidasi terhadap `types.ts`) → draft. `logAdminAction` untuk semua aksi.

**Selesai jika:** kelima tipe latihan bisa dikerjakan & dinilai tanpa AI; uji unit `grade.ts`/`session.ts` lulus; review grammar terjadwal; admin bisa membuat soal AI → draft → terbit; build lulus.

---

## Fase 16 — Kursus Dasar (unit A0–A2)

**16.1 Skema** (`0013_course_units.sql`): `course_units (slug pk, title, cefr_level, sort_order, theme_id, intro_id, steps jsonb, status)` dan `unit_progress (user_id, unit_slug, step_index, completed_at, pk(user_id, unit_slug))`. `steps` = array langkah bertipe: `vocab` (daftar kata / kata inti, dengan `definition_en` dari 14g), `grammar` (topic_slug), `read` (text_id), `listen` (teks untuk TTS), `exercise` (filter soal unit), `speak` (kalimat untuk Pronunciation Clinic atau skenario Dialogue Simulator). Seed 12 unit (judul, level, urutan, intro Indonesia; langkah yang merujuk konten yang belum ada dibiarkan kosong dan ditandai).
- Logika murni `lib/course.ts` (diuji unit): langkah berikutnya, persen selesai, unit yang disarankan.

**16.2 UI**: `app/(dashboard)/kursus/page.tsx` (daftar unit per level, disarankan, tidak dikunci) dan `kursus/[slug]` (pemutar langkah; setiap langkah memakai komponen yang ada: kartu kosakata, ringkasan topik grammar, `TextDisplay` untuk bacaan pendek, TTS, `ExerciseSession`, Pronunciation Clinic). Masuk Ruang I di urutan ke-2 (Fase 13).

**16.3 Admin**: kelola unit & langkah di Admin → Konten (pilih kata, topik, teks, soal).

**Selesai jika:** 12 unit tampil; satu unit contoh lengkap end-to-end (pemilik mengisi kontennya); progres tersimpan di database; `next-step` menyarankan unit berikutnya; uji unit `course.ts` lulus; build lulus.

---

## Fase 17 — Modul khas penutur Indonesia

- Seed data (`0014_l1_modules.sql`): `l1_errors (slug, title, wrong, right, explanation_id, cefr_level)` ±15 kesalahan umum (PRD §6.4) dan `minimal_pairs (slug, word_a, word_b, ipa_a, ipa_b, note_id)` ±15 pasangan. Soal terkait = `exercises` dengan tag `l1-error` / `minimal-pair`.
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
- [ ] Kosakata Inti menampilkan definisi; bentuk kata dikenali (14g).
- [ ] Migrasi `0011`–`0015` tercantum di `docs/SESSION_HANDOFF.md` untuk dijalankan pemilik.
- [ ] Kelima route API (14f) dipakai di UI dan diuji; ekspor CSV terjemahan membaca tabel yang benar.
