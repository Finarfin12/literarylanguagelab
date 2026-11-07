# Inventaris Fitur — Literary Language Lab (setelah Fase 11)

| | |
|---|---|
| **Dibuat** | 31 Oktober 2026, dari kode di commit `5ff2160` (Fase 11). Diperbarui 1 November 2026: `dc29ee3` (LingoWise di Sidebar desktop) |
| **Tujuan** | Daftar periksa wajib untuk redesign v4. **Setiap baris di dokumen ini harus tetap ada dan berfungsi sama setelah redesign.** |
| **Aturan pemilik** | Redesign hanya mengubah tampilan. **Tidak ada fitur yang dihapus, digabung diam-diam, atau dikurangi perilakunya.** Satu-satunya perubahan perilaku yang diminta: tombol Tongkat Ajaib di reader bisa digeser (lihat PRD v4). |

Cara memakai: sebelum menyatakan satu fase redesign selesai, centang setiap baris yang disentuh fase itu dan uji bahwa fiturnya masih bisa dijangkau dan dipakai, di desktop **dan** di HP (375px).

Angka ringkas: 72 halaman, 59 route API, 16 file server action, 38 komponen, 28 alat dinamis di `lib/tools-config.ts`, 16 mode Word Lookup.

---

## A. Kerangka global (muncul di banyak halaman)

| Fitur | Lokasi | Catatan untuk redesign |
|---|---|---|
| Sidebar desktop: logo, tombol buka/tutup (collapse), tema terang/gelap, Word of the Day, tombol utama (`PINNED_PATHS`: Library, Buku Klasik, A-Z), grup menu dari `lib/menu-config.ts` dengan deskripsi, grup "Lainnya" terlipat, link Admin (khusus admin), kartu pengguna + Settings + Sign Out | `components/Sidebar.tsx` | Word of the Day memakai daftar lokal di Sidebar, bukan API |
| **(Fase 13)** Susunan v4: Sidebar = Beranda → Ruang I–III (daftar alat bisa dibuka) → Koleksi saya → Komunitas → pintasan LingoWise AI & Semua alat → Admin. Pintasan utama **Buku Klasik, Kamus A-Z, Text Library** tepat di bawah Beranda (permintaan pemilik, 1 Nov 2026); juga di grup Utama Menu HP | `components/Sidebar.tsx`, `lib/rooms.ts` |
| Bottom nav HP: Beranda · Baca · Kosakata · Alat · Menu (status aktif per grup path) | `components/MobileBottomNav.tsx` | Mockup v4 mengusulkan Baca · Belajar · Terjemah — **jangan hilangkan tujuan "Kosakata" dan "Alat"**; tetap bisa dijangkau |
| **(Fase 13)** Bottom nav HP sekarang (keputusan pemilik, menggantikan Q1): Beranda · **Kamus** (`/tools/a-z-dictionary`) · **Baca Buku** (`/gutenberg`; aktif juga untuk `/library`, `/read`, `/preview`) · **Grammar** (`/english-lab/grammar`) · Menu (aktif untuk semua halaman lain). Kosakata, Ruang, Library, alat lain: Beranda/Menu | `components/MobileBottomNav.tsx` |
| **(Fase 13)** Halaman ruang: `/ruang` (tiga ruang + Koleksi + Komunitas, tanda "Tujuanmu") dan `/ruang/[slug]` (alat berurutan, bernomor, per bagian). Uji: `tests/menu-coverage.test.mts` | `app/(dashboard)/ruang/` |
| Halaman Menu HP: profil + inbox pesan (badge belum dibaca), pencarian fitur, grup Utama, semua grup menu, grup Admin (khusus admin), Settings, Bantuan, toggle tema, Logout | `app/(dashboard)/menu/page.tsx` | |
| TopActions: Inbox Pesan, Pusat Bantuan | `components/TopActions.tsx`, `components/HelpButton.tsx` | |
| Tema terang/gelap | `components/ThemeProvider.tsx` (next-themes) | Mockup v4 baru menggambar tema terang; **tema gelap wajib dirancang juga** |
| PWA: install, service worker, cache buku offline (IndexedDB) — **service worker `public/sw.js` dibuat di 14e (K9)**: pra-cache `/offline`, ikon, manifest, aset `/_next/static/*`; navigasi selalu jaringan, offline → `/offline`; tidak pernah menyimpan halaman login, `/api/*`, atau respons Supabase. Diuji unit di sandbox (`tests/sw.test.mts`, 8); **belum diuji di browser nyata** (panel browser di sesi ini memblokir service worker). Buku offline tetap lewat IndexedDB | `components/PwaRegister.tsx`, `utils/indexeddb.ts`, `app/manifest*`, `public/sw.js` (14e) | |
| Animasi halaman (hormati `prefers-reduced-motion` dan preferensi `enable_animations`) | `components/AnimatedPage.tsx` | |
| Proxy auth & rate limit, feature flag | `proxy.ts`, `lib/rate-limit.ts`, `lib/ai/flags.ts` | Bukan UI, jangan disentuh redesign |

## B. Akun & awal

| Fitur | Lokasi |
|---|---|
| Landing page (3 langkah, 3 tujuan) | `app/page.tsx` |
| Login & daftar (email + OAuth) | `app/(auth)/login`, `app/(auth)/register`, `app/(auth)/actions.ts`, `components/ui/OAuthButtons.tsx` |
| Onboarding 3 langkah (level / tujuan / waktu), bisa dilewati | `app/(dashboard)/onboarding/` |
| Beranda: Langkah berikutnya (`lib/next-step.ts`), alat sesuai tujuan, Lanjutkan Membaca (+progres, termasuk Gutenberg), Kosa Kata Hari Ini (kini "Review Hari Ini", Fase 15), Progres Pribadi + grafik, pintasan, loading skeleton | `app/(dashboard)/dashboard/` |
| **(14a, ✅ diuji 375px/1280px, terang/gelap, keadaan kosong)** Beranda v4: sapaan serif, Langkah berikutnya + Kosa Kata Hari Ini, rak Lanjutkan Membaca (sampul, progres), blok baru "Tiga ruang belajar" (tanda Tujuanmu), Progres Pribadi + grafik (warna ikut tema), Alat untuk kamu, pintasan, skeleton | `app/(dashboard)/dashboard/`, `components/dashboard/VocabChart.tsx` |

## C. Membaca (Library, Buku Klasik, Reader)

| Fitur | Lokasi |
|---|---|
| Text Library: daftar teks, filter level CEFR, label level, hapus teks | `app/(dashboard)/library/page.tsx`, `components/library/DeleteTextButton.tsx` |
| Tambah teks: manual (judul, penulis, era, genre) atau **generate teks dengan AI** (prompt, tingkat kesulitan) | `app/(dashboard)/library/add/page.tsx` |
| Preview teks: Vocabulary Preview, Pre-Learn Flashcard, "Langsung Membaca Saja" | `app/(dashboard)/preview/[id]/page.tsx` |
| OCR Lens: kamera, galeri, kompresi, scan multi-halaman, edit hasil, simpan ke Library | `app/(dashboard)/library/add/ocr/page.tsx` |
| Buku Klasik: pencarian OpenLibrary & Gutendex (pilihan provider, tersimpan di `localStorage`), "Muat lagi", tautan "Coba lewat …" saat gagal. **Keduanya tidak boleh diubah**; v4 menambah opsi ketiga "Gutenberg (server)" (Fase 14f) | `app/(dashboard)/gutenberg/page.tsx` |
| Reader Gutenberg: cache offline (tanda ✓), tombol kosakata bab (VocabFlashcardModal), panel Bookmark, toolbar seleksi (**Sorot**, **Tandai**, **Analisis**), panel Analisis Kalimat | `app/(dashboard)/gutenberg/[id]/page.tsx`, `components/reader/BookmarkSidebar.tsx`, `SentenceAnalysisSidebar.tsx`, `VocabFlashcardModal.tsx` |
| Reader Library | `app/(dashboard)/read/[textId]/page.tsx` |

### C.1 Reader (`components/reader/TextDisplay.tsx`) — dipakai Library dan Gutenberg

| Fitur | Detail yang wajib tetap ada |
|---|---|
| Pagination | Hal x/y, pilihan bab, progress bar, tombol Sebelumnya/Berikutnya, lompat `#block-N`, posisi tersimpan (localStorage + `reading_sessions`) |
| **(14b)** Reader v4: kertas hangat (terang `paper`/`ink`, sepia `#43352a`, gelap `#17150f`, kontras tinggi tetap), header tipis, progress 3 px, teks bacaan 19/20 px × 1,75 mewarisi warna tema, modal tanpa blur, target sentuh ≥44 px (tombol per paragraf, select, Beginner Mode) | `TextDisplay.tsx`, `ReaderBlock.tsx`, `app/globals.css` |
| Header baca | Estimasi waktu baca, petunjuk shortcut keyboard, tombol **Ask AI Companion** |
| Beginner Mode | Level A2/B1, tata letak **Ganti Teks (Inline) / Berdampingan (Bawah) / Layar Belah (Split)** |
| Per paragraf | TTS **Read Aloud** (browser atau Groq), **Bedah Sintaksis** (Subjek/Verba/Objek + legenda) |
| **Tongkat Ajaib (Inspect Mode)** | Tombol melayang; saat aktif, kalimat bisa diketuk → modal berisi kalimat, Read Aloud, Bedah Sintaksis. **v4: tombol bisa digeser** |
| **(14b, ✅)** Tongkat Ajaib bisa digeser: ketuk (≤6 px) = nyala/mati, geser = pindah lalu menempel ke tepi kiri/kanan, posisi di `localStorage` `reader-wand-pos`, Alt+panah, `aria-pressed`, disembunyikan saat Word Lookup terbuka. Uji: `tests/drag-fab.test.mts` (12) + drag/ketuk/keyboard/muat ulang di halaman uji 375px | `lib/reader/drag-fab.ts`, `components/reader/MagicWandButton.tsx` |
| Word Lookup (pilih kata) | Lihat C.2 |
| Referensi budaya | Frasa bertanda + tooltip (penjelasan, padanan Indonesia, asal) |
| Kuis pemahaman (Comprehension Checkpoint) | Muncul di judul bab; jawaban tersimpan sebagai bukti membaca |
| Listening Challenge | Soal dari bacaan, jawab dengan suara, skor |
| Latihan Menulis setelah membaca | Prompt dengan kosakata yang disimpan, evaluasi AI (grammar, vocab, kohesi) |
| AI Companion | Panel chat tentang teks; shortcut Ctrl+1, Esc menutup |
| Preferensi baca yang dipakai | `font_family` (serif/sans/dyslexic), `font_size`, `line_height`, `text_width`, `theme` (terang/gelap/**sepia**), `highlight_color`, `line_numbers`, `high_contrast`, `screen_reader`, `show_reading_time`, `keyboard_shortcuts`, `tts_enabled`, `tts_provider`, `enable_quizzes`, `enable_writing_prompts`, `enable_listening_challenge` |
| Heartbeat waktu baca | Tiap 10 detik saat tab terlihat |

### C.2 Word Lookup (`components/reader/WordLookupSidebar.tsx`)

- Header: kata, **Pictionary** (abc), **dengar** (TTS), tutup.
- **16 mode**: Literary Focus, Dictionary, Translate, Nuance, Synonyms, Culture, Etymology, Lyricism, Metaphors, Quote, Time Travel, Grammar, Phonetics, Rhyme, Semantic Map (graf, `SemanticMapViewer`), Collocations (daftar + simpan massal).
- Konteks Kalimat, hasil analisis (markdown + tabel), cache per mode.
- **Simpan Kata** (dengan konteks, sumber, posisi) / simpan kolokasi.
- Preferensi kamus: `auto_lookup`, `show_register`, `show_etymology`, `def_language`.

> **(14f, ✅ sebagian)** Lima route API kini dipanggil dari UI (baris baru):
> - **Buku Klasik**: opsi ketiga "Gutenberg (server)" di pemilih provider (cari + "Muat lagi"); OpenLibrary & Gutendex **tidak berubah**; tautan "Coba lewat …" menawarkan dua provider lain; `/api/gutenberg/search` memakai cache 5 menit dan pesan error ramah (bug: kata kunci berspasi menggantung karena `+`; kini `%20`). Judul halaman = "Baca Buku".
> - **Word of the Day**: tombol "Pelajari" di kartu (Sidebar & Beranda) → panel mini-lesson, kolokasi, kuis 1 soal, "Simpan kata"; `/api/wotd` hanya dipanggil saat ditekan, kata deterministik per pengguna per hari, hasil di-cache `localStorage` `wotd:<tanggal>`. Logika: `lib/wotd.ts`.
> - **Analisis tone**: tombol di modal Tongkat Ajaib (di bawah Bedah Sintaksis) dan "Analisis tone segmen" di Ruang Kerja Segmen; "Pakai usulan" hanya mengisi terjemahan saat ditekan. `/api/analyze-tone` tahan pagar kode, teks ≤ 1.000 & konteks ≤ 2.000 karakter. Logika: `lib/tone.ts`, `lib/ai/json.ts`.
> - **Penanda idiom di reader**: ±180 idiom tanpa AI (`lib/idioms`, 13 uji, termasuk posesif — pola lama tidak cocok untuk "pull my/his/John's leg"); satu panggilan per halaman, garis bawah putus-putus hijau, tooltip arti + padanan Indonesia + "Simpan ke Idiom Library"; preferensi `reading.highlight_idioms` (Pengaturan → Reading Experience, default aktif). Tidak menulis `ai_usage_logs`.
> - **Hapus akun**: Pengaturan memanggil `POST /api/auth/delete-account` (menggantikan `rpc('delete_user')` yang tidak ada). Butuh `SUPABASE_SERVICE_ROLE_KEY` dan migrasi `0011_profile_cascade.sql` (**belum dijalankan**). Tombol "hapus data Vocabulary & Riwayat" tidak berubah.
> - **Ekspor CSV terjemahan** membaca tabel `translations` (cadangan `translation_submissions` bila tabel tidak ada).
> Belum teruji dengan login/AI sungguhan: panggilan AI (WOTD, tone), hapus akun, simpan idiom, dan pencarian server dari dalam aplikasi; yang teruji: logika murni (uji unit), tampilan dengan API ditiru, dan `/api/gutenberg/search` langsung.

## D. Kosakata

| Fitur | Lokasi |
|---|---|
| Vocabulary Bank: daftar, cari, filter level, catatan personal, Flashcard Mode | `app/(dashboard)/vocabulary/page.tsx`, `components/vocabulary/VocabularyBankClient.tsx`, `FlashcardMode.tsx` |
| Kosakata Inti (NGSL): per level, status, "Tambah 10 kata ke Review" | `app/(dashboard)/vocabulary/core/` |
| Kosakata Inti: **definisi bahasa Inggris** di bawah kata (14g; tanpa definisi → tampilan lama), definisi ikut tersimpan saat kata ditambahkan ke Review | `app/(dashboard)/vocabulary/core/page.tsx`, `actions.ts`, migrasi `0015` |
| Kosakata Inti: **pengenalan bentuk kata** (`searched` dihitung sebagai `search` pada status & "Tambah 10 kata") (14g) | `lib/core-words.ts`, `vocabulary/core/` |
| Skrip `scripts/enrich-ngsl.mjs` (UPDATE `definition_en`/`forms`, `--dry-run`, `--core-from`) dan petunjuk di Admin → Konten (14g) | `scripts/enrich-ngsl.mjs`, `scripts/lib/ngsl-enrich.mjs`, `app/(dashboard)/admin/content/` |

> **(Fase 15, ✅ diuji 375px/1280px, terang/gelap)** Mesin latihan terstruktur + review grammar (baris baru; latihan kalimat bebas, Penjelasan lebih detail, dan Grammar Clinic di halaman topik **tetap ada**):
>
> | Fitur | Lokasi / cara uji |
> |---|---|
> | Lima tipe soal (pilihan ganda, isian, susun kalimat, pasangkan, dikte) dinilai tanpa AI, umpan balik + penjelasan Indonesia | `components/exercises/`, `lib/exercises/`; uji unit `tests/exercises.test.mts`; buka `/english-lab/grammar/<topik>` → kartu "Latihan terstruktur" (muncul bila ada soal terbit) |
> | Sesi latihan: soal yang pernah salah diprioritaskan; hasil → `exercise_attempts` + bukti kemampuan (grammar/vocabulary/listening) | `app/api/exercises/{session,attempt,finish}`; dinilai ulang di server |
> | Status selesai topik grammar pindah ke database (`grammar_progress`), `localStorage` dimigrasikan sekali dan tetap jadi cadangan sebelum `0012` | `lib/grammar-progress.ts`, `app/api/grammar/progress`; ubah centang topik → muncul di perangkat lain |
> | Review grammar terjadwal (SM-2, `calculateSM2`): lencana "Waktunya diulang" di daftar topik, banner + "Masih ingat / Perlu diulang" bila topik tanpa soal | `TopicList.tsx`, `[slug]/TopicPractice.tsx` |
> | Beranda: kartu "Review Hari Ini" (dulu "Kosa Kata Hari Ini") memuat topik grammar jatuh tempo; `getNextStep` menyarankan review grammar setelah review kata | `dashboard/page.tsx`, `lib/next-step.ts` (uji `next-step`) |
> | Admin → Konten → **Latihan**: daftar, filter, pratinjau, edit, terbitkan massal; "Buat soal dengan AI" (`exercise-generate`, draft → ditinjau → terbit); "Buat soal dari Kosakata Inti" tanpa AI | `app/(dashboard)/admin/content/exercises/`, `admin/exercise-actions.ts`, `lib/exercises/from-core-words.ts` |

> **(Fase 16, ✅ pemutar & admin diuji 375px/1280px, terang/gelap)** Kursus Dasar (baris baru; tersembunyi dari pengguna biasa sampai flag `kursus_dasar` dinyalakan):
>
> | Fitur | Lokasi / cara uji |
> |---|---|
> | 12 unit A0–A2 (tabel `course_units`, seed di `0013`); daftar per level, unit yang disarankan, progres per unit, tidak ada yang dikunci | `app/(dashboard)/kursus/page.tsx`, `lib/course.ts` (uji `course`); admin buka `/kursus` |
> | Pemutar unit: enam jenis langkah (kosakata, grammar, baca, dengar, latihan, bicara), bebas berpindah langkah, langkah kosong ditandai "belum tersedia" dan bisa dilewati, kemajuan tersimpan di `unit_progress` | `app/(dashboard)/kursus/[slug]`, `components/course/`, `app/api/course/progress` |
> | Unit contoh lengkap "Salam & perkenalan" (kata, grammar to-be, bacaan, dengar, 6 soal terbit, bicara) | seed `0013`; uji `course` memvalidasi seed |
> | Flag `kursus_dasar` (default mati; pengguna biasa hanya melihat "Segera hadir"; admin melihat label "Pratinjau admin"); item tersembunyi di Ruang I, Sidebar, Menu HP + pencarian; Kursus Dasar tetap terdaftar di Ruang I (urutan ke-2) | `lib/course-access.ts`, `components/CourseVisibility.tsx`, `lib/rooms.ts` (`isPathVisible`), uji `menu-coverage` |
> | Beranda: "Langkah berikutnya" menyarankan unit Kursus Dasar berikutnya (hanya bila kursus boleh tampil) | `lib/next-step.ts` (`courseUnit`), uji `next-step` |
> | Admin → Konten → **Kursus**: tambah/edit/terbitkan/hapus unit, editor langkah (pilih topik, teks Library, skenario Dialogue Simulator, urutkan langkah); Admin → Konten → Latihan: soal bisa dikaitkan ke unit + filter `?unit=` | `app/(dashboard)/admin/content/course/`, `admin/course-actions.ts` |

> **(Fase 17, ✅ diuji 375px/1280px, terang/gelap)** Modul khas penutur Indonesia (baris baru; tampil di Ruang I, bagian "Khas penutur Indonesia", tidak di balik flag):
>
> | Fitur | Lokasi / cara uji |
> |---|---|
> | **Kesalahan Umum**: 16 kartu salah → benar + penjelasan Indonesia (ditulis sendiri), latihan campuran dan latihan per kartu (pilihan ganda, dinilai otomatis tanpa AI) | `app/(dashboard)/kesalahan-umum/`, `components/l1/ErrorCards.tsx`, tabel `l1_errors` (`0014`); uji `l1` |
> | **Pasangan Bunyi**: 15 pasangan + IPA + catatan, latihan dengar (TTS, pilih kata yang didengar, 10 ronde), dikte bertag `minimal-pair`, dan Pronunciation Clinic tertanam | `app/(dashboard)/pasangan-bunyi/`, `components/l1/PairsDrill.tsx`, tabel `minimal_pairs`; uji `l1` |
> | Sesi latihan bisa disaring per tag (`l1-error`, `l1:<slug>`, `minimal-pair`) dan langkah `exercise` Kursus Dasar punya bidang `tag` opsional | `app/api/exercises/session`, `lib/course.ts`, editor langkah di Admin → Konten → Kursus |

>
> **(Fase 22, v5)** Latihan pemula (fitur baru; tidak ada fitur lama yang berubah kecuali yang tercatat):
>
> | Fitur | Lokasi |
> |---|---|
> | Tipe soal **Penyusun kalimat** (`pattern`): pilih subjek, kata kerja, dan objek; bentuk kata kerja mengikuti subjek dengan catatan Indonesia; warna selalu disertai label | `lib/exercises/patterns.ts`, `components/exercises/PatternBuilder.tsx`; uji `patterns` |
> | Toleransi salah ketik (satu huruf, kata ≥ 6 huruf) pada isian dan dikte; soal ejaan tetap ketat | `lib/exercises/grade.ts` (`typoMatch`), `components/exercises/shared.tsx`; uji `patterns` |
> | Sakelar **Bantuan pemula** di Dialogue Simulator (bawaan nyala untuk A1): arti frasa bantuan, awalan kalimat, tombol "Lihat terjemahan"; frasa bantuan dan input lama tidak berubah | `lib/dialogue-help.ts`, `app/(dashboard)/english-lab/dialogue-simulator/page.tsx`, `app/api/dialogue-simulator/translate`; uji `phrases-help` |
> | **Frasa harian** `/frasa-harian` (Ruang I): audio, arti natural, arti kata per kata, simpan ke Review; Admin → Konten → Frasa untuk meninjau dan menerbitkan | `app/(dashboard)/frasa-harian/`, `app/(dashboard)/admin/content/phrases/`, `lib/phrases.ts`, migrasi `0021` |
> | Kosakata Inti: tab **Per tema** (tampil bila ada data) dan tombol tambah kata tema ke Review; skrip `scripts/enrich-a0.mjs` | `app/(dashboard)/vocabulary/core/`, `lib/core-themes.ts`, migrasi `0022` |

>
> **(Fase 23, v5)** Susunan & label (tidak ada fitur yang dihapus; yang berubah hanya urutan, kelompok, dan label):
>
> | Perubahan | Lokasi |
> |---|---|
> | Label ruang: Belajar Bahasa Inggris, Membaca & Sastra, Menerjemahkan (slug `belajar-dasar`, `baca-sastra`, `terjemah` tetap) | `lib/rooms.ts` |
> | Membaca & Sastra: lima seksi berurutan; Penulisan & portofolio memuat academic-outline, writing-assistant, essay-auditor, paraphrase, case-study-generator | `lib/rooms.ts`; uji `tool-categories`, `menu-coverage` |
> | Menerjemahkan: seksi Pra-terjemah (idiom-detector, cultural-context, dialect-diver, untranslatables) dan Imagery Grader di evaluasi | `lib/rooms.ts` |
> | `/tools/paraphrase` pindah dari Ruang I ke Ruang II (masih terjangkau; Latihan Interaktif di `/tools`) | `lib/rooms.ts` |
> | Beranda: tiga pintasan Mulai dari Nol / Lanjutkan Membaca / Mulai Menerjemahkan | `app/(dashboard)/dashboard/page.tsx`, `lib/rooms.ts` (`homeShortcuts`) |
> | `/tools`: kategori Pemahaman & Kosakata, Kajian Sastra & Teori, Penulisan, Bantuan Penerjemahan, Latihan Interaktif + Semua Alat; pencarian dan seluruh alat tetap | `lib/tool-categories.ts`, `app/(dashboard)/tools/page.tsx` |
> | Grammar: progres total dan filter Semua / Belum / Selesai | `app/(dashboard)/english-lab/grammar/TopicList.tsx`, `lib/topic-filter.ts` |

>
> **(Fase 24, v5)** Modul Belajar (fitur baru; tersembunyi dari pengguna biasa sampai flag `modul_belajar` dinyalakan; tidak ada fitur lama yang berubah):
>
> | Fitur | Lokasi |
> |---|---|
> | `/modul` (tahap → mata pelajaran, progres, pelajaran yang disarankan), `/modul/[subject]` (daftar pelajaran, tujuan, kuis akhir), `/modul/[subject]/[lesson]` (tujuan, isi, latihan, rangkuman, tugas, sumber, praktikkan opsional) | `app/(dashboard)/modul/`, `components/study/`, `lib/study.ts`, `lib/study-server.ts`; uji `study` |
> | Tombol selesai, tugas pribadi tersimpan (tanpa penilaian AI), pelajaran berikutnya hanya disarankan | `app/(dashboard)/modul/actions.ts`, `components/study/LessonActions.tsx` |
> | Pendamping AI opsional: "Jelaskan lebih sederhana" (dibuat sekali, disimpan) dan tanya jawab, lewat pelindung Fase 19 | `app/api/modul/simplify`, `app/api/modul/chat` |
> | Latihan pelajaran dan kuis akhir memakai mesin latihan yang sama (`lesson_slug`, `subject_slug`) | `app/api/exercises/session`, `components/exercises/ExerciseSession.tsx` |
> | Admin → Konten → **Modul**: tulis manual, sunting, tandai ditinjau, terbitkan, draf AI, hasil `checkLesson` | `app/(dashboard)/admin/content/modules/`, `admin/study-actions.ts`, `lib/lesson-check.ts` |
> | Impor konten dari berkas ke draft (tidak menimpa yang ditinjau/disunting, tidak menerbitkan) | `scripts/import-modules.mjs`, `scripts/lib/parse-lesson.mjs`, `content/modules/` |
> | Item `/modul` di Ruang I, II, III, disembunyikan menurut flag | `lib/rooms.ts`, `components/CourseVisibility.tsx` (`useStudyVisible`), `lib/study-access.ts` |
> | Kursus Dasar: langkah latihan bertag ("Kesalahan umum penutur Indonesia", "Pasangan bunyi") ditambahkan ke unit terkait oleh `0014` bila `0013` sudah dijalankan | `supabase/migrations/0014_l1_modules.sql` |

> **(Fase 29 item 1, v5)** Latihan skimming dan scanning (fitur baru; tidak ada fitur lama yang berubah; tidak di balik flag):
>
> | Fitur | Lokasi |
> |---|---|
> | `/latihan-membaca`: empat teks latihan B1–C1 (ditulis sendiri); skimming (baca sekilas, jawab soal gambaran umum) dan scanning (pilih paragraf yang memuat jawaban); timer **opsional** yang hanya menampilkan waktu, teks tidak pernah disembunyikan dan latihan tidak dihentikan; tanpa AI, tanpa database, tanpa migrasi | `app/(dashboard)/latihan-membaca/page.tsx`, `components/reading/ReadingDrill.tsx`, `lib/reading-drill.ts`; uji `tests/reading-drill.test.mts` |
> | Terdaftar di Ruang I, bagian "Bacaan berjenjang" | `lib/rooms.ts` |

> **(Fase 29 item 2, v5)** Ringkasan statistik proyek terjemahan (fitur baru di Ruang Kerja Segmen; tidak ada fitur lama yang berubah):
>
> | Fitur | Lokasi |
> |---|---|
> | Kartu **"Ringkasan untuk ditinjau"** di halaman proyek: kemajuan, kata sumber dan terjemahan, rasio panjang, panjang rata-rata segmen, peringatan pemeriksaan otomatis, segmen beranotasi, dan rata-rata rubrik; **setiap angka menampilkan rumus dan data yang dikecualikan** (mis. segmen dengan terjemahan kosong, nomor segmen); tombol salin sebagai teks; dihitung di browser, tanpa AI, tanpa database baru, tanpa migrasi | `app/(dashboard)/translation-workspace/[id]/ProjectSummaryCard.tsx`, `lib/translation/summary.ts`; uji `tests/translation-summary.test.mts` |

> **(Fase 29 item 3, v5)** Penyuntingan bahasa Indonesia hasil terjemahan (fitur AI baru di Ruang Kerja Segmen; tidak ada fitur lama yang berubah):
>
> | Fitur | Lokasi |
> |---|---|
> | Panel segmen: **"Minta saran penyuntingan"** menampilkan saran AI (ejaan, tata bahasa, tanda baca, kalimat efektif, pilihan kata, register, konsistensi) berupa kutipan harfiah, usulan, dan alasan; **tidak ada yang berubah sebelum pengguna menekan Terapkan** per saran; Abaikan, dan Urungkan perubahan terakhir; "catatan makna" hanya peringatan untuk diperiksa dengan sumber | `app/(dashboard)/translation-workspace/[id]/EditSuggestSection.tsx`, `SegmentPanel.tsx`, `WorkspaceEditor.tsx` |
> | Route `POST /api/translation/edit-suggest`: lewat `guardAIRoute` (login, batas pemakaian kategori terjemahan, ukuran badan), `runAI` dengan feature key baru `translation-id-edit`, tanpa pesan sistem dari klien; saran disaring di server (kutipan harus harfiah ada di terjemahan, angka tidak boleh berubah, maksimum 8, duplikat dibuang) | `app/api/translation/edit-suggest/route.ts`, `lib/translation/edit-suggest.ts`, `lib/ai/features.ts` |
> | Seed rute model fitur baru (opsional bagi kode: tanpa seed, `runAI` memakai konfigurasi lama) | `supabase/migrations/0024_translation_id_edit.sql` (**belum dijalankan; tindakan pemilik**); uji `tests/translation-edit-suggest.test.mts` |

> **(Fase 18, ✅ admin diuji 375px/1280px, terang/gelap)** Paket konten Kursus Dasar dan tiga jalur bacaan (baris baru; Kursus Dasar tetap tersembunyi sampai flag `kursus_dasar` dinyalakan):
>
> | Fitur | Lokasi / cara uji |
> |---|---|
> | Jalur 1: 20 bacaan asli A1–A2 + langkah 11 unit + 55 soal, semuanya **draft** | `supabase/migrations/0016_course_content.sql`; laporan kata & cakupan NGSL: `docs/v4/content-report.md`; uji `course-content` |
> | Jalur 2: tombol "Bacaan AI" per unit dan "Buat draf untuk semua unit yang belum punya bacaan" (satu per satu, progres, bisa dihentikan, lewati yang gagal); `generateGradedText` mendapat dua bidang opsional (`targetWords`, `approxWords`) — pemanggil lama tidak berubah | Admin → Konten → Kursus; `admin/course-actions.ts` (`generateUnitReading`), `admin/content-actions.ts` |
> | Jalur 3: formulir "Tulis teks sendiri" (judul, level, isi, unit tujuan opsional) → draf | Admin → Konten (tab Teks & Grammar); `createOwnText`, `OwnTextForm.tsx` |
> | Pemeriksaan otomatis tiap draf: "89 kata ✓ · 94% Kosakata Inti A1 ✓" atau peringatan + contoh kata di luar daftar; hanya informasi, tidak memblokir Terbitkan | `lib/graded-check.ts` (uji `graded-check`), kartu draf di Admin → Konten |
> | Tombol lama "Buat teks berjenjang dengan AI" dan tombol Edit draf tetap ada dan berfungsi | Admin → Konten |
| Review SRS (SM-2): kartu, konteks, **Lihat di teks**, skor 0–3 | `app/(dashboard)/review/`, `app/(dashboard)/vocabulary/review/`, `components/vocabulary/ReviewClient.tsx` |
| Flashcard SRS (English Lab): mode **guess-word, guess-meaning, dictation, collocation** | `app/(dashboard)/english-lab/flashcard/page.tsx` |
| Idiom Library | `app/(dashboard)/idioms/page.tsx` |
| Glossary Builder | `app/(dashboard)/glossary/` |
| Lexicon Search | `app/(dashboard)/tools/lexicon-search/` |
| A-Z Dictionary (Word Lookup A-Z) | `app/(dashboard)/tools/a-z-dictionary/` |

> **(14c, ✅)** Seluruh bagian D dan E bergaya v4 lewat perapian kelas (kartu `rounded-card`, tombol/teks hijau memakai `brand-solid`/`brand-ink`, judul serif, tanpa bayangan/blur/hover melompat) — tanpa mengubah handler, state, atau teks fitur. Diuji di 375px (terang/gelap): 16 halaman English Lab & alat, tanpa luapan, target sentuh ≥44 px, kontras ≥4.5:1 (kecuali tombol nonaktif). Halaman yang butuh data (Vocabulary Bank, Kosakata Inti, Review, Flashcard 4 mode, hasil tes) hanya lewat tsc/build.

## E. Latih Bahasa Inggris (English Lab)

| Fitur | Lokasi |
|---|---|
| Placement Test adaptif (reading, grammar, vocabulary, listening) + set level manual | `english-lab/placement-test`, `lib/placement.ts` |
| Tes Naik Level (cooldown 14 hari) | `english-lab/level-test` |
| Grammar Dasar: 20 topik A1–B1, halaman topik, mini-lesson AI, latihan kalimat, status selesai | `english-lab/grammar`, `english-lab/grammar/[slug]` |
| Grammar Clinic + statistik | `english-lab/grammar-clinic` |
| Dialogue Simulator: skenario, bicara (STT), balasan suara (TTS), Akhiri & Feedback | `english-lab/dialogue-simulator`, `lib/dialogue-scenarios.ts`, `hooks/useSpeechToText.ts` |
| Listening Test: mode **Quiz Pilihan Ganda** & **Dikte**, tingkat CEFR, transkrip, unggah audio sendiri | `english-lab/listening-test` |
| Pronunciation Clinic (rekam, skor kecocokan; STT browser/Groq) | `/tools/pronunciation-clinic` (`tools/[id]`), `components/PronunciationLab.tsx` |
| Slang Decoder (+ slang tren) | `english-lab/slang-decoder`, `lib/trending-slang.ts` |
| Paraphrase Challenge (generate + evaluasi) | `tools/paraphrase` |
| AI Writing Assistant (feedback tulisan) | `tools/writing-assistant` |
| Sentence Architect (parse kalimat) | `tools/sentence-architect` |
| Story Quiz (cerita dari kosakata pengguna + 5 soal) | `tools/story-quiz` |

## F. Analisis Sastra & alat AI

| Fitur | Lokasi |
|---|---|
| Toolkits Hub: semua alat, pencarian, filter kategori | `app/(dashboard)/tools/page.tsx` |
| 28 alat dinamis (satu halaman `tools/[id]`, tombol "Coba dengan contoh"): mood-transformer, era-translator, critical-lens, pronunciation-clinic, dialect-diver, rhetorical-spotter, vibe-translator, diction-lab, sentence-architect, sentiment-spectrum, imagery-sketcher, metaphor-generator, academic-outline, **essay-auditor**, plot-twist, conflict-mapper, semantic-visual, character-monologue, literary-synonyms, nuance-detector, time-traveler, poem-to-palette, semantic-map, **case-study-generator**, imagery-grader, difficulty-analyzer, idiom-detector, tone-detector* | `lib/tools-config.ts`, `app/(dashboard)/tools/[id]/page.tsx`, `lib/tool-examples.ts` |
| Tone & Gaya: mode **Deteksi Nada** dan **Analisis & Ubah Nada** (gabungan Tone Analyzer + Tone Detector Fase 8; `/tools/tone-detector` di-redirect) | `tools/tone-analyzer` |
| LingoWise AI: 8 mode (Dialect Diver, Tone & Grammar, Vibe Translator, Mood Transformer, Diction Lab, Era Translator, Sentence Architect, Rhetorical Spotter) | `app/(dashboard)/lingowise`, `components/lingowise/LingoWiseClient.tsx` |
| Alter Ego Chat (persona penulis; v5 Fase 20: 15 penulis, kelompok Klasik & Modern + Fantasi, `lib/alter-ego.ts`) | `tools/alter-ego` |
| Cultural Context Library (CRUD referensi budaya yang dipakai reader) | `tools/cultural-context` |
| My Annotations | `tools/annotations` |
| Archive & Insights (waktu baca, kata dikuasai, area lemah, analisis) | `app/(dashboard)/history` |

\* `tone-detector` tetap ada di `tools-config` tetapi path-nya di-redirect ke Tone & Gaya.

## G. Menerjemahkan

| Fitur | Lokasi |
|---|---|
| Translation Workshop: teks asli vs terjemahan, mode evaluasi General / Equivalence / Register / Back-Translation / **Rubrik Nababan**, deteksi teknik, link ke Ruang Kerja Segmen | `app/(dashboard)/translation-workshop` |
| Ruang Kerja Segmen: daftar proyek (buat/hapus), editor per segmen (simpan otomatis), saran TM ≥ 70%, glosarium, QA, komentar, anotasi teknik (manual + saran AI), distribusi teknik, nilai rubrik, ekspor CSV | `app/(dashboard)/translation-workspace/`, `lib/translation/*` |
| Translation Memory | `app/(dashboard)/translation-memory` |
| Side-by-Side Comparator | `tools/comparator` |
| Untranslatables | `tools/untranslatables` |
| Parallel Text Mode | `tools/parallel-text` |
| Translation Timelapse | `tools/translation-timelapse` |
| Tahap penerjemah di profil | `components/profile/TranslatorStageCard.tsx` |

> **(14d, ✅ sebagian)** Bagian F dan G bergaya v4 lewat perapian kelas (kartu `rounded-card`, hijau `brand-solid`/`brand-ink`, judul serif, tanpa bayangan/blur/hover melompat); tombol utama Comparator tidak lagi merah muda. Diuji di 375px (terang) lewat pemeriksaan otomatis: Toolkits Hub, Tone & Gaya, Alter Ego, Annotations, Comparator, Cultural Context, Parallel Text, Timelapse, Untranslatables, LingoWise, Archive & Insights, Translation Workshop, Ruang Kerja Segmen (daftar), Translation Memory — tanpa luapan, target sentuh ≥44 px, kontras ≥4.5:1 (kecuali tombol nonaktif). **Belum teruji tanpa login:** `tools/[id]` (28 alat), editor segmen dan hasil analisis (hanya tsc/build). Warna anotasi, tanda diff, grafik tetap (pengecualian DESIGN §3.4).

## H. Komunitas

| Fitur | Lokasi |
|---|---|
| Forum: kategori, buat thread, thread + komentar (markdown, badge role & CEFR) | `app/(dashboard)/forum/*` |
| Jejaring Pembaca: cari profil publik, follow, kirim pesan | `app/(dashboard)/community`, `components/community/ProfileActions.tsx` |
| Pesan langsung (realtime, online, cari) | `app/(dashboard)/messages`, `hooks/useUnreadMessages.ts` |
| Reading Clubs: buat klub (publik/privat, pilih buku), halaman klub & diskusi | `app/(dashboard)/clubs/*`, `components/clubs/CreateClubModal.tsx` |
| Shared Annotations (upvote/downvote) | `app/(dashboard)/community-annotations` |
| Profil publik / portofolio | `app/p/[username]` |

> **(14e, ✅ sebagian)** Seluruh bagian B, H, I, J bergaya v4 lewat perapian kelas; landing (judul "Karya Abadi" yang sebelumnya tak terlihat diperbaiki), login/register tanpa gradasi, Pengaturan (zona bahaya memakai token), kartu Word of the Day di Sidebar. Halaman admin (9 tab) hanya lewat tsc/build karena butuh login admin.

> **(Pesan, perbaikan 2 Nov 2026)** Halaman Pesan: tombol **Hapus pesan** pada pesan sendiri (konfirmasi dulu; butuh migrasi `0017_direct_messages_delete.sql`, **belum dijalankan**); status **Online/Offline sungguhan** lewat Realtime Presence (`lib/presence.ts`, `components/PresenceTracker.tsx`), bisa disembunyikan di Pengaturan → Privasi → "Tampilkan Status Online"; jam & centang di gelembung sendiri kembali terbaca.

## I. Profil, Pengaturan, Bantuan

| Fitur | Lokasi |
|---|---|
| Profil: avatar, bergabung sejak, followers/following, Level CEFR + Placement, **level per keterampilan & Progres menuju level berikutnya**, tahap penerjemah, Tentang Saya, Pencapaian (Early Adopter, Vocab Explorer, Kolektor Kata, Kutu Buku, badge), Statistik, Aktivitas Terakhir | `app/(dashboard)/profile`, `components/profile/LevelProgressCard.tsx` |
| Pengaturan — bagian: Tampilan Teks, Reading Experience, Dictionary Lookup, Tampilan & Aksesibilitas, Vocabulary Bank, Spaced Repetition, Level CEFR, Tujuan belajar, Suara & Audio (STT/TTS), Manajemen Data (ekspor CSV, hapus data/akun), Privasi, Performa (`offline_mode`, `preload_next_text`), Developer Tools (admin) | `app/(dashboard)/settings/page.tsx`, `components/settings/LearningGoalSection.tsx` |
| Pusat Bantuan: FAQ + chat Liter-AI | `app/(dashboard)/help` |

## J. Admin (9 tab)

Ringkasan, Pengguna (cari, filter, role, ban/unban/hapus, link pemakaian), Provider AI (CRUD, tes koneksi), Model (CRUD, impor, harga), Routing Fitur, Pemakaian & Kuota, **Konten** (level teks, estimasi AI, teks berjenjang draft→terbit, topik grammar, jumlah kata inti), Fitur (flag), Audit Log — `app/(dashboard)/admin/*`.

---

## K. Temuan dari analisis ini (bukan penghapusan — untuk ditangani redesign)

| # | Temuan | Tindakan di v4 |
|---|---|---|
| K1 | ~~LingoWise AI tidak punya pintu masuk di desktop~~ — **selesai** di `dc29ee3` (tombol di Sidebar). | Fase 13: bawa tombol ke susunan Sidebar baru (Ruang II). |
| K2 | Route API tanpa pemanggil di UI: `/api/analyze-tone`, `/api/detect-idioms`, `/api/gutenberg/search` (halaman memanggil Gutendex langsung), `/api/wotd` (Sidebar memakai daftar lokal), `/api/auth/delete-account` (Pengaturan memakai RPC `delete_user`). | **Jangan dihapus — perbaiki dan pakai** (keputusan pemilik). Langkahnya: Fase **14f** di IMPLEMENTATION_PLAN. |
| K3 | Bottom nav HP di mockup v4 berbeda dari yang sekarang. | Semua tujuan lama (Beranda, Baca, Kosakata, Alat, Menu) harus tetap bisa dijangkau ≤ 2 ketukan. |
| K4 | Mockup v4 baru menggambar tema terang; reader punya tema **sepia**, **gelap**, dan **kontras tinggi**. | Rancang ketiganya; jangan hilangkan pilihan tema. |
| K6 | Hapus akun di Pengaturan memanggil RPC `delete_user` yang tidak ada di migrasi mana pun; FK `profiles.id → auth.users` di baseline tanpa `ON DELETE CASCADE`. | Diperbaiki di 14f (pakai `/api/auth/delete-account` + migrasi `0011`). |
| K7 | Ekspor CSV "translations" di Pengaturan membaca tabel `translation_submissions` yang tidak ada di migrasi. | Diperbaiki di 14f. |
| K8 | `/api/detect-idioms` tidak memakai AI tetapi mencatat ke `ai_usage_logs` lewat `checkRateLimit` (memakan kuota AI & mengacaukan statistik Ringkasan). | Diperbaiki di 14f. |
| K9 | `PwaRegister.tsx` mendaftarkan `/sw.js` yang tidak ada (build Turbopack tidak membuatnya); pendaftaran gagal diam-diam. | Cara A (keputusan pemilik): tulis `public/sw.js` manual + halaman `/offline` di 14e. |
| K5 | Preferensi `offline_mode`, `preload_next_text`, `auto_save`, `auto_add_vocab`, `default_mastery`, `cards_per_session` ada di Pengaturan. | Tetap tampil di Pengaturan setelah redesign. |
