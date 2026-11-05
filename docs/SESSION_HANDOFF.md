# Session Handoff — Literary Language Lab v2

## Status terbaru (31 Oktober 2026, sore)

| Fase | Status | Commit |
|---|---|---|
| 0 Keamanan | Selesai, di-merge ke `main` (PR #2). Migrasi 0000–0002 **sudah dijalankan** di Supabase | `1ea3ceb`, `993914e` |
| 1 Hapus gamifikasi | Selesai di `main` (lokal) | lihat `git log` |
| 3 Registry provider AI + tab admin AI | Selesai di `main` (lokal). Migrasi 0003 **sudah dijalankan** | lihat `git log` |
| 4 OCR Qwen | Selesai di kode. Uji 10 foto belum (butuh GROQ_API_KEY) | lihat `git log` |
| 2 Tampilan & mobile | Selesai di kode. Audit visual di HP belum, lihat `docs/mobile-audit.md` | lihat `git log` |
| 5 MCP | **Dibatalkan** oleh pemilik (31 Okt 2026). Kolom `mcp_server_ids` di `ai_feature_routes` dibiarkan, tidak dipakai | — |
| 6 Tab admin lainnya | Selesai di kode. Migrasi 0004 **sudah dijalankan** | lihat `git log` |
| 7 Fitur belajar + reader ringan | Selesai di kode. Migrasi 0005 dan 0009 **sudah dijalankan** | lihat `git log` |
| 8 (v3) Penataan untuk orang awam | Selesai di kode (onboarding, menu baru, Tone & Gaya gabungan, contoh, beranda, landing). Migrasi `0006_onboarding.sql` **belum dijalankan** | lihat `git log` |
| 9 (v3) Fondasi belajar dasar | Selesai di kode (Library berjenjang, tab admin Konten, Kosakata Inti, Grammar Dasar, adaptasi level). Migrasi `0007_graded_content.sql` **belum dijalankan**; `core_words` kosong sampai `scripts/import-ngsl.mjs` dijalankan | lihat `git log` |
| 10 (v3) Level per keterampilan & Tes Naik Level | Selesai di kode (bukti keterampilan, `lib/levels.ts`, kartu level di profil, Tes Naik Level dinilai di server). Migrasi `0008_skill_levels.sql` **belum dijalankan**; Tes Naik Level butuh `SUPABASE_SERVICE_ROLE_KEY` | lihat `git log` |
| 11 (v3) Jalur penerjemahan akademik | Selesai di kode (Ruang Kerja Segmen, anotasi teknik, rubrik Nababan, tahap penerjemah, ekspor CSV). Migrasi `0010_translation_academic.sql` **belum dijalankan** | lihat `git log` |
| 14g (v4) Pengayaan Kosakata Inti (definisi & bentuk kata NGSL) | Selesai di kode. Migrasi `0015_core_words_enrichment.sql` **belum dijalankan**; setelah itu jalankan `scripts/enrich-ngsl.mjs` (`--dry-run` dulu) dengan CSV definisi & bentuk kata | lihat `git log` |
| 12 (v4) Fondasi desain | Selesai di kode (token warna v4, Source Sans 3 + Alegreya + Michelangelus via `local()`, komponen dasar + `Eyebrow`/`SectionHeading`/`BookSpine`/`ProgressBar`, `tests/contrast.test.mts`, `scripts/v4-restyle.mjs` sudah dijalankan; laporan `docs/v4/restyle-report.md`). Tanpa migrasi. Tinjauan manual tersisa di laporan (gradasi/blur/animate-pulse, berkas pengecualian) untuk Fase 14 | lihat `git log` |
| 13 (v4) Navigasi & tiga Ruang | Selesai di kode (`lib/rooms.ts`, `/ruang`, `/ruang/[slug]`, Sidebar & Menu HP per ruang, bottom nav Q1, cookie `lll_onboarded` terikat id pengguna, `tests/menu-coverage.test.mts`). 13.5 "5 alat ke Lainnya" **dilewati** atas keputusan pemilik (menu lama 62 item, 56 non-advanced; kriteria ≤30 tidak relevan lagi karena navigasi per ruang). Tanpa migrasi | lihat `git log` |
| 14a (v4) Beranda & ruang | Selesai di kode (Beranda, onboarding, LevelProgressCard, TranslatorStageCard, grafik; halaman ruang sudah v4 sejak Fase 13). Tanpa migrasi | lihat `git log` |
| 14b (v4) Reader & Word Lookup + Tongkat Ajaib bisa digeser | Selesai di kode (`lib/reader/drag-fab.ts` + uji, `MagicWandButton`, reader/Word Lookup/panel/modal bergaya v4). Tanpa migrasi. Word Lookup 16 mode, Sentence Analysis, Bookmark, Companion, VocabFlashcardModal baru diuji lewat tsc/build (butuh login) | lihat `git log` |
| 14c (v4) Kosakata & English Lab | Selesai di kode (perapian kelas di 26 file, 13 gradasi/garis dekoratif dihapus, pop-up SweetAlert2 mengikuti token, target sentuh). Tanpa migrasi | lihat `git log` |
| 14d (v4) Sastra & Terjemah | Selesai di kode (18 file dirapikan, target sentuh, tombol Comparator). Tanpa migrasi. `tools/[id]` dan editor segmen belum teruji tanpa login | lihat `git log` |
| 14e (v4) Komunitas, profil, pengaturan, bantuan, admin, auth, landing + PWA | Selesai di kode (41+ file dirapikan, `public/sw.js` + `/offline`, `PwaRegister` diperbaiki: pendaftaran terlewat bila `load` sudah lewat). Tanpa migrasi. SW belum diuji di browser nyata | lihat `git log` |
| 14f (v4) Lima route API: perbaiki & pakai | Selesai di kode. Migrasi `0011_profile_cascade.sql` **belum dijalankan** (wajib sebelum hapus akun). Belum teruji dengan login/AI sungguhan | lihat `git log` |
| Pesan: hapus pesan + status Online sungguhan (2 Nov 2026) | Selesai di kode. Migrasi `0017_direct_messages_delete.sql` **belum dijalankan** (tanpa itu hapus pesan ditolak RLS dengan pesan ramah) | lihat `git log` |
| 15 (v4) Mesin latihan + review grammar (2 Nov 2026) | Selesai di kode (`lib/exercises/*` + `tests/exercises.test.mts`, 5 tipe soal, sesi latihan, review grammar SM-2, Admin → Konten → Latihan dengan soal AI → draft → terbit dan soal dari Kosakata Inti tanpa AI). Migrasi `0012_exercises.sql` **belum dijalankan** (tanpa itu: kartu latihan tersembunyi, status grammar tetap di localStorage). Belum teruji dengan login/AI/TTS sungguhan | lihat `git log` |
| 16 (v4) Kursus Dasar (2 Nov 2026) | Selesai di kode (`lib/course.ts` + uji, 12 unit seed + 1 unit contoh lengkap, `/kursus` + pemutar langkah, progres di DB, flag `kursus_dasar` default mati, saran di Beranda, Admin → Konten → Kursus). Migrasi `0013_course_units.sql` **belum dijalankan** (butuh `0012` lebih dulu); tanpa itu kursus tersembunyi/"Segera hadir". Bacaan di pemutar memakai tampilan ringan + tautan ke Reader penuh (bukan `TextDisplay` tertanam). Belum teruji dengan login/DB/TTS sungguhan | lihat `git log` |
| 17 (v4) Modul khas penutur Indonesia (2 Nov 2026) | Selesai di kode (`lib/l1.ts` + `tests/l1.test.mts`, halaman Kesalahan Umum dan Pasangan Bunyi di Ruang I, filter tag pada sesi latihan, langkah latihan bertag di Kursus Dasar). Migrasi `0014_l1_modules.sql` **belum dijalankan** (butuh `0012`; langkah unit hanya diperbarui bila `0013` sudah ada); tanpa itu kedua halaman menampilkan pemberitahuan migrasi. Data (16 kesalahan, 15 pasangan, 22 soal) ditulis sendiri; belum ada UI admin untuk mengubahnya (lewat SQL). Belum teruji dengan login/DB/TTS sungguhan | lihat `git log` |
| 18 (v4) Paket konten Kursus Dasar (5 Nov 2026) | Selesai di kode + seed (`0016_course_content.sql`: 20 bacaan A1–A2, langkah 11 unit, 55 soal, semuanya draft; `lib/graded-check.ts` + uji; bacaan AI per unit & massal; "Tulis teks sendiri"; pemeriksaan otomatis di kartu draf). Migrasi `0016` **belum dijalankan** (butuh `0007`, `0012`, `0013`). Alur AI belum teruji (butuh provider/login). Laporan: `docs/v4/content-report.md`. Flag `kursus_dasar` tetap mati sampai pemilik meninjau & menyalakan | lihat `git log` |
| 19 (v5) Keamanan & biaya AI (5 Nov 2026) | **Sebagian.** Selesai di kode: 19.2 `guardAIRoute` (`lib/ai/guard.ts` + `guard-rules.ts`) di 13 route + `tests/ai-route-guard.test.mts`; 19.3 `consume_rate_limit` (`lib/rate-limit.ts`, migrasi `0019_rate_limit_counters.sql`); 19.4 flag fail-closed (`lib/ai/flags.ts`, `flag-rules.ts`) + peringatan Admin → Fitur; 19.5 zoom aktif, `lang="id"`, `lang="en"` di teks Inggris; 19.6 `npm test`, SHA deployment + kartu Status skema di Admin → Ringkasan, `params` Promise, README tanpa gamifikasi. **19.1 (`0018` RLS) BELUM dikerjakan**: menunggu hasil query `pg_policies` dari pemilik dan persetujuan. **19.7** (nonaktifkan key legacy Supabase) adalah tugas pemilik. Migrasi `0019` **belum dijalankan** (tanpa itu: perilaku batas lama). Utang: `/api/stt` dan `/api/tts` memanggil Groq langsung, di luar `ai_usage_logs` | lihat `git log` |

**Status migrasi `supabase/migrations`** (diperbarui 5 Nov 2026; kartu **Status skema** di Admin → Ringkasan memeriksa keberadaan tabel/kolomnya secara langsung, jadi anggap kartu itu lebih mutakhir daripada tabel ini):

| Migrasi | Isi | Status |
|---|---|---|
| 0000–0005 | Baseline, log AI, keamanan profil, registry AI, alat admin, posisi baca | Sudah dijalankan pemilik |
| 0006 | Onboarding | Belum (per catatan lama; cek kartu) |
| 0007 | Konten berjenjang, Kosakata Inti, Grammar Dasar | Belum (per catatan lama; cek kartu) |
| 0008 | Level per keterampilan | Belum (per catatan lama; cek kartu) |
| 0009 | Hapus gamifikasi | Sudah dijalankan pemilik |
| 0010 | Penerjemahan akademik | Belum (per catatan lama; cek kartu) |
| 0011 | Hapus akun beruntun (cascade profil) | Belum; wajib sebelum hapus akun |
| 0012 | Mesin latihan, progres grammar | Belum |
| 0013 | Unit Kursus Dasar (butuh 0012) | Belum |
| 0014 | Kesalahan umum & pasangan bunyi (butuh 0012) | Belum |
| 0015 | Pengayaan Kosakata Inti | Belum |
| 0016 | Paket konten Kursus Dasar (butuh 0007, 0012, 0013) | Belum |
| 0017 | Hapus pesan langsung | Belum |
| 0018 | Baseline RLS | **Belum ditulis**: menunggu hasil `pg_policies` dari pemilik (Fase 19.1) |
| 0019 | Penghitung batas pemakaian lintas instance | Ditulis, **belum dijalankan** |

**Handoff sesi terbaru (1 Nov 2026): [`HANDOFF_NEXT_SESSION.md`](HANDOFF_NEXT_SESSION.md)** — keadaan repo, status migrasi, tindakan menunggu pemilik, jebakan, resep verifikasi, dan prompt pembuka.

**Berikutnya: v5** — keamanan & biaya AI, penulis fantasi di Alter Ego, alur pemula dari nol, susunan & label, Modul Belajar lengkap (Fase 19–29). Dokumen di [`docs/v5/`](v5/). Mulai sesi baru dengan "Prompt pembuka" di [`docs/v5/HANDOFF.md`](v5/HANDOFF.md).

**v4 (selesai di kode sampai Fase 18)** — redesign "perpustakaan yang ramah" (hanya tampilan, **tanpa menghapus fitur**), susunan fitur per tiga Ruang, Tongkat Ajaib bisa digeser, dan Kursus Dasar (Fase 12–17). Dokumen di [`docs/v4/`](v4/): PRD, IMPLEMENTATION_PLAN, HANDOFF, dan [FEATURE_INVENTORY](v4/FEATURE_INVENTORY.md) (daftar periksa wajib). Urutan: **14g → 12 → 13 → (titik henti) → 14a–14f → 15 → 16 → 17 → 18 (konten Kursus Dasar, terakhir)**. Mulai sesi baru dengan "Prompt pembuka" di [`docs/v4/HANDOFF.md`](v4/HANDOFF.md). Prasyarat: migrasi `0006`–`0010` sudah dijalankan.

_v3 (Fase 8–11) selesai; dokumennya tetap di [`docs/v3/`](v3/)._

**Keputusan pemilik:** Q1 = forum, clubs, messages, jejaring pembaca **tetap ada** (tanpa poin). Q2 = Latihan Harian dan Weekly (Writing) Challenge **dihapus** (berbeda dari asumsi default PRD). Q3–Q5 memakai default.

**Yang harus dilakukan pemilik sebelum deploy:**
1. ~~Jalankan migrasi `0000` … `0005`~~ — **sudah dijalankan** (dikonfirmasi pemilik 31 Okt 2026). `0009_drop_gamification.sql` **juga sudah dijalankan** (dikonfirmasi pemilik 31 Okt 2026): kolom `profiles.xp/streak/journey_level`, tabel `journey_progress`, `duels*`, `daily_activities`, tabel challenge, dan fungsi `update_login_streak` sudah tidak ada. Kode v2 tidak memakainya lagi. **Cek:** fungsi/trigger database (mis. `handle_new_user`) tidak boleh masih menulis ke kolom yang dihapus — lihat query di bawah, dan uji daftar akun baru.

   ```sql
   -- Fungsi di schema public yang masih menyebut objek gamifikasi (harus kosong)
   select p.proname
   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and (p.prosrc ~* '\m(xp|streak|longest_streak|last_login_date|journey_level)\M'
       or p.prosrc ~* '(journey_progress|daily_activities|duel_|challenge_submissions)');
   ```
2. Isi env `AI_SECRETS_KEY` (32 byte base64, mis. `openssl rand -base64 32`) dan pastikan `SUPABASE_SERVICE_ROLE_KEY` ada. Tanpa keduanya semua fitur AI tetap jalan lewat `GROQ_API_KEY`, tapi registry dari admin tidak dipakai.
3. Uji Fase 3: tambah provider di `/admin/providers` → "Ambil dari provider" di `/admin/models` → pilih model untuk `translation` di `/admin/routing` → coba Translation Workshop.

**Catatan teknis Fase 6:**
- Tab admin: Ringkasan (`/admin`), Pengguna, Provider AI, Model, Routing Fitur, Pemakaian & Kuota, Fitur, Audit Log.
- Feature flag (`system_config.features`) sekarang benar-benar berlaku: dicek di `checkRateLimit` (503) dan `runAI` (`lib/ai/flags.ts`).
- Semua aksi admin dicatat lewat `logAdminAction()` (`lib/admin-audit.ts`) ke `admin_audit_log`.

**Catatan teknis Fase 7:**
- Reader (`components/reader/TextDisplay.tsx`) kini dibagi per halaman ~900 kata (`lib/reader-pages.ts`), dengan pilihan bab, progress bar, dan tombol Sebelumnya/Berikutnya. Paragraf dirender lewat `ReaderBlock` (memo).
- Penyebab berat yang diperbaiki: seluruh buku dirender sekaligus; satu IntersectionObserver per paragraf (sekarang hanya saat Beginner Mode); regex referensi budaya dibuat ulang per paragraf (sekarang satu regex ter-cache); semua paragraf ikut re-render saat sidebar/seleksi berubah; blur header dan drop-shadow per paragraf.
- Bug lama yang ikut diperbaiki: posisi baca & bookmark Gutenberg selalu 0 (membaca scrollTop elemen yang tidak di-scroll). Posisi sekarang berupa indeks blok, disimpan di localStorage dan `reading_sessions.last_paragraph_index`.
- F-01 (Unify Reader) ternyata sudah ada: Gutenberg memakai `TextDisplay`. F-06 (pagination pencarian) juga sudah ada; proxy `/api/gutenberg/search` kini meneruskan `page`.
- F-03: konteks kosa kata = kalimat yang memuat kata; kartu review punya tautan "Lihat di teks" (`#block-N`).

**Catatan teknis Fase 3:**
- Semua route AI memanggil `runAI('<feature-key>', …)` dari `lib/ai/run.ts`. Daftar feature key ada di `lib/ai/features.ts` (harus sama dengan seed di migrasi 0003).
- Route `ocr` memakai routing `ocr` → `qwen/qwen3.8-27b` (vision), prompt dengan `/no_think`. Halaman OCR mengecilkan gambar di browser, punya tombol Kamera/Galeri, dan bisa scan beberapa halaman berturut-turut.
- Fase 2: komponen dasar di `components/ui/` (primitives, Tabs, ResponsivePanel). Sidebar reader memakai `ResponsivePanel` (bottom sheet di < 1024px). Tabel admin → kartu di mobile masih tugas Fase 6.
- `app/api/stt` dan `app/api/tts` masih memanggil Groq langsung (belum lewat registry).
- `groq-sdk` sudah tidak dipakai oleh kode, tapi belum dihapus dari `package.json`.
- Build gagal di folder dengan path sangat panjang di Windows (batas 260 karakter); taruh repo di path pendek.

---

## Arsip: analisis & perencanaan (30–31 Oktober 2026)

Ringkasan sesi 30–31 Oktober 2026 untuk dilanjutkan di sesi lain (Claude, Gemini, atau agent lain).
Belum ada kode aplikasi yang diubah di sesi ini. Yang dihasilkan hanya dokumen.

## Status singkat

| Item | Status |
|---|---|
| Analisis bug | Selesai, 13 bug tercatat (B-01 sampai B-13 di [PRD.md](PRD.md) §7) |
| PRD | Selesai: [PRD.md](PRD.md) |
| Implementation plan | Selesai, 8 fase: [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) |
| Instruksi untuk Gemini Flash 3.8 | Selesai: [HANDOFF_GEMINI.md](HANDOFF_GEMINI.md) |
| Dokumen di git | Di branch `docs/v2-plan` (belum di-merge ke `main`). `.gitignore` mengabaikan `*.md`, jadi dokumen di-commit dengan `git add -f` |
| Implementasi | **Belum dimulai.** Rencananya dikerjakan oleh Gemini Flash 3.8, fase demi fase |

## Apa yang diminta pemilik

1. Menganalisis bug dan mengusulkan fitur tambahan. Roadmap pemilik ada di `fitur_tambahan_road map.xlsx` (F-01 sampai F-07).
2. Mengubah aplikasi menjadi **ruang belajar fokus**: menghapus gamifikasi (XP, tier, leaderboard, duels, streak, journey quests).
3. Memperbaiki tampilan mobile agar **semua fitur bisa diakses** dari HP.
4. OCR memakai **Qwen di Groq**.
5. Admin mendapat **tab-tab pengelolaan**, termasuk pengelolaan AI: menambah provider lewat API key + endpoint, dan menambah AI lewat **MCP**.
6. Memperbaiki semua bug.
7. Membuat PRD dan implementation plan, lalu menyerahkannya ke Gemini Flash 3.8 untuk dikerjakan.

## Temuan penting (sudah diverifikasi di kode)

- **27 route `/api/*` tanpa pengecekan login.** Siapa pun bisa memakai kuota `GROQ_API_KEY`. Daftar lengkapnya ada di HANDOFF_GEMINI.md.
- **Rate limit tidak berjalan.** `getRateLimit()` di `lib/ai-config.ts` tidak pernah dipanggil.
- **OCR rusak.** `app/api/ocr/route.ts` memakai konfigurasi `tools` (`openai/gpt-oss-120b`, model teks) untuk membaca gambar.
- **Waktu baca bisa dipalsukan.** Heartbeat percaya `time_spent_seconds` dari klien; quest langsung selesai setelah 15 detik.
- **Duels palsu.** Feedback AI ditulis permanen di kode, dan XP bisa di-farm dengan submit berulang.
- **`isFeatureEnabled` keliru.** Key yang tidak terdaftar dianggap mati.
- **`middleware.ts` sudah deprecated** di Next.js 16 dan harus menjadi `proxy.ts`.
- **RPC di setiap render.** `update_login_streak` dipanggil di `(dashboard)/layout.tsx` pada setiap navigasi.
- **Admin bisa mem-ban atau menghapus dirinya sendiri.**
- **Repo kotor.** File log/pid dan script sementara ter-commit; skema DB tidak ada di repo.
- **Perlu dicek di Supabase:** RLS `profiles` mungkin membolehkan user mengubah `role` miliknya sendiri.

## Fakta eksternal (dicek di dokumentasi Groq, 31 Okt 2026)

- Model vision: `qwen/qwen3.8-27b` (maks 3 gambar/request, request dengan URL gambar maks 20 MB).
- Remote MCP: lewat Responses API (`/openai/v1/responses`, tool `type: "mcp"`). Status beta; hanya model yang mendukung tool use.
- Catatan: WebSearch gagal di sesi ini karena error konfigurasi model, jadi pengecekan dilakukan lewat browser bawaan ke `console.groq.com/docs`.

## Keputusan desain yang sudah diambil

- **Provider AI:** tipe `openai_compatible` (base URL + API key, lewat `fetch`), tanpa SDK baru. API key dienkripsi AES-256-GCM dengan env `AI_SECRETS_KEY`.
- **Routing per fitur:** tabel `ai_feature_routes` (model utama, cadangan, parameter, MCP yang diizinkan). OCR dibatasi ke model berkemampuan `vision`.
- **MCP:** hanya server remote HTTPS, di belakang feature flag `mcp_enabled`.
- **Data gamifikasi:** tidak di-DROP sampai Fase 7; berhenti dipakai dulu supaya bisa rollback.
- **Urutan:** Fase 0 (keamanan) dulu. Setelah itu Fase 1–2 (UI) dan Fase 3 (AI) bisa paralel.

## Pertanyaan yang masih terbuka

- **Q1 (penghalang Fase 1):** apakah forum, reading clubs, messages, dan jejaring pembaca tetap ada (tanpa XP) atau ikut dihapus? Default di dokumen: **tetap ada**. Pemilik belum menjawab.
- Q2–Q5 memakai asumsi default (lihat PRD §8).
- Di device asal, `gamification-system.md` terhapus dari working tree (tidak oleh sesi ini) dan perubahan itu tidak ikut di-commit. Versi di git masih utuh.

## Langkah berikutnya

1. Di device baru: `git fetch && git switch docs/v2-plan`. Merge ke `main` jika sudah disetujui.
2. Pemilik menjawab Q1.
3. Mulai Fase 0 dengan prompt di HANDOFF_GEMINI.md (bagian "Prompt pembuka" + "Fase 0").
4. Setelah tiap fase, pemilik melakukan review sesuai tabel "Titik review" di HANDOFF_GEMINI.md.

## Prompt untuk sesi baru

```
Lanjutkan pekerjaan di repo "Literary Language Lab" (branch docs/v2-plan). Baca berurutan:
AGENTS.md, docs/SESSION_HANDOFF.md, docs/PRD.md, docs/IMPLEMENTATION_PLAN.md,
docs/HANDOFF_GEMINI.md. Jangan ulang analisis yang sudah tercatat.
Tanyakan dulu ke saya jawaban Q1 jika pekerjaan menyentuh Fase 1,
lalu kerjakan fase yang saya sebut.
```
