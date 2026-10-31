# PRD — Literary Language Lab v2: "Ruang Belajar Fokus"

| | |
|---|---|
| **Status** | Draft untuk ditinjau |
| **Tanggal** | 31 Oktober 2026 |
| **Pemilik** | finarfin112 |
| **Dokumen terkait** | [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md), `fitur_tambahan_road map.xlsx` |

---

## 1. Latar belakang

Literary Language Lab (Next.js 16 + Supabase + Groq) sudah punya banyak fitur belajar: reader, Gutenberg, vocabulary bank + SRS, English Lab, puluhan tool AI. Tapi ada tiga masalah:

1. **Fokusnya terpecah oleh gamifikasi.** XP, tier, leaderboard, duels, streak, dan quest "Journey" tersebar di ~34 file. Pengguna diarahkan mengejar poin, bukan belajar. Sebagian juga tidak jujur: feedback Duels ditulis permanen di kode, XP bisa di-farm, dan waktu baca bisa dipalsukan dari klien.
2. **Pengelolaan AI terkunci di kode.** Hanya Groq yang didukung (`lib/ai-config.ts`). Mengganti model berarti mengedit tabel `system_config` secara manual. Tidak ada UI admin untuk itu.
3. **Ada bug keamanan dan fungsional** (lihat §7), antara lain 27 route AI yang bisa dipanggil tanpa login, rate limit yang tidak pernah dijalankan, dan OCR yang rusak karena memakai model teks (`openai/gpt-oss-120b`) untuk membaca gambar.

## 2. Tujuan

| # | Tujuan | Ukuran keberhasilan |
|---|---|---|
| G1 | Mengubah aplikasi menjadi ruang belajar yang fokus, tanpa mekanik kompetitif | 0 referensi XP/leaderboard/duel/streak/tier di UI |
| G2 | Semua fitur bisa dipakai nyaman di HP | Semua halaman lolos audit di lebar 375px: tanpa scroll horizontal, target sentuh ≥ 44px |
| G3 | OCR berfungsi memakai Qwen vision di Groq | OCR berhasil pada ≥ 95% foto halaman buku yang jelas |
| G4 | Admin bisa mengelola provider AI, model, dan MCP tanpa deploy ulang | Menambah provider baru dan memakainya di sebuah fitur < 5 menit lewat UI |
| G5 | Semua bug di §7 tertutup | Setiap bug punya pengujian verifikasi yang lulus |

## 3. Bukan tujuan (v2)

- Membuat model AI sendiri atau fine-tuning.
- Sistem pembayaran atau langganan.
- Aplikasi native iOS/Android. PWA tetap menjadi jalur mobile.
- Menjalankan MCP server lokal (stdio). Hanya MCP server **remote** (HTTPS) yang didukung.

## 4. Pengguna

| Persona | Kebutuhan |
|---|---|
| **Pelajar** (role `user`) | Membaca teks sastra, memahami kosakata dalam konteks, latihan menulis dan mendengar, mengulang kosakata. Banyak yang memakai HP. |
| **Admin** (role `admin`) | Mengelola pengguna, memilih provider/model AI per fitur, memantau pemakaian dan biaya, menambah integrasi MCP. |
| Moderator / Curator | Tetap ada sebagai role, tapi tidak ada perubahan fungsi di v2. |

---

## 5. Kebutuhan fungsional

### 5.1 Menghapus gamifikasi → ruang belajar fokus

**Yang dihapus dari UI dan logika:**

| Elemen | Lokasi saat ini | Tindakan |
|---|---|---|
| XP & tier ("Novice Reader", "Bibliophile", dst.) | `profile`, `admin/users`, `forum/thread`, `p/[username]`, `help` | Hapus tampilan dan perhitungan |
| Global Leaderboard | `/leaderboard`, `menu-config` | Hapus halaman dan menu |
| Translation Duels | `/duels`, `duels/actions.ts` | Hapus halaman dan menu |
| Login streak | `update_login_streak` di `(dashboard)/layout.tsx`, ikon `Flame` di dashboard | Hapus pemanggilan RPC dan widget |
| Journey quests | `JourneyWidget`, `/api/journey`, `lib/journey-quests.ts`, auto-complete di heartbeat | Hapus |
| Pemberian XP | `community-annotations/actions.ts`, `writing-challenge`, `review`, `vocabulary`, dll. | Hapus semua penambahan XP |

**Yang diganti dengan versi "belajar":**

- **Dashboard** menjadi *Ruang Belajar*: (1) Lanjutkan Membaca (F-02), (2) Kosakata jatuh tempo hari ini (SRS), (3) Latihan harian (dipertahankan, tanpa poin), (4) Grafik progres pribadi (kata dikuasai, waktu baca minggu ini). Semuanya bersifat pribadi dan tanpa peringkat.
- **Profil**: level CEFR dari Placement Test dan statistik belajar pribadi, tanpa gelar atau XP.
- **Komunitas**: forum, reading clubs, dan shared annotations **tetap ada** sebagai pembelajaran sosial, tapi tanpa poin dan tanpa leaderboard. *(Lihat pertanyaan terbuka Q1.)*

**Data:** kolom `xp`, `streak`, `journey_level`, serta tabel `journey_progress` dan `duel_*` **tidak dihapus di v2**. Kolom/tabel itu hanya berhenti dipakai, lalu dibuang lewat migrasi terpisah setelah v2 stabil, agar rollback tetap mungkin.

### 5.2 Tampilan & mobile

- Satu sistem desain: token warna dan spasi di `globals.css`, komponen dasar (Button, Card, Sheet, Tabs, Input) dipakai ulang di semua halaman.
- **Navigasi mobile:** bottom nav menjadi *Beranda · Baca · Kosakata · Alat · Menu*. Halaman Menu menampilkan **semua** fitur (sumber: `lib/menu-config.ts`), lengkap dengan kolom pencarian.
- **Sidebar reader** (Word Lookup, Reading Companion, Sentence Analysis, Bookmark) tampil sebagai *bottom sheet* di layar < 1024px, bukan panel samping.
- Halaman admin juga harus bisa dipakai di HP (tabel → kartu di layar kecil).
- Aksesibilitas: kontras minimal WCAG AA, fokus keyboard terlihat, `prefers-reduced-motion` dihormati (framer-motion).

### 5.3 OCR dengan Qwen (Groq)

- Model default: **`qwen/qwen3.8-27b`** di Groq (multimodal; maks 3 gambar per request; request dengan URL gambar maks 20 MB).
- OCR memakai *feature route* `ocr` (lihat §5.4) dengan syarat model berkemampuan `vision`. Admin bisa menggantinya ke model vision lain.
- Klien mengecilkan gambar sebelum upload (sisi terpanjang ≤ 2000px, JPEG ≈ 0.85). Server menolak payload > 4 MB base64 dan MIME selain `image/jpeg|png|webp`.
- Hasil: teks mentah dan pratinjau yang bisa diedit sebelum disimpan ke Library (alur `/library/add/ocr` sudah ada).

### 5.4 Admin: tab pengelolaan

Halaman `/admin` dengan tab:

| Tab | Isi |
|---|---|
| **Ringkasan** | Jumlah pengguna aktif, request AI 24 jam/7 hari, error rate, estimasi biaya per provider |
| **Pengguna** | (sudah ada) daftar, ubah role, ban/unban, hapus. Tambahan: pencarian, filter role, dan perlindungan agar admin tidak bisa mem-ban atau menghapus dirinya sendiri |
| **Provider AI** | CRUD provider: nama, tipe, base URL endpoint, API key, status aktif, tombol **Tes koneksi** |
| **Model** | Daftar model per provider: ID model, label, kemampuan (`text`, `vision`, `tools`, `stt`, `tts`), parameter default. Tombol "Ambil dari provider" mengisi daftar dari `GET {base_url}/models` |
| **Routing Fitur** | Untuk setiap fitur (lookup, translation, ocr, reading-companion, grammar-clinic, …): model utama, model cadangan, temperature, max tokens, MCP server yang diizinkan |
| **MCP Server** | CRUD MCP server remote (lihat §5.5) |
| **Pemakaian & Kuota** | Log request AI per pengguna/fitur/model, token masuk/keluar, latensi; batas kuota per pengguna per menit/jam/hari |
| **Fitur** | Feature flag on/off per fitur |
| **Audit Log** | Siapa mengubah apa dan kapan (semua aksi di tab admin) |

**Tipe provider yang didukung:**

1. `openai_compatible`: base URL + API key. Mencakup Groq, OpenRouter, Together, DeepSeek, Mistral, Ollama/LM Studio (self-hosted), OpenAI. Diimplementasikan dengan `fetch` biasa agar tidak menambah SDK.
2. `anthropic`: Messages API native. *(Fase lanjutan, opsional.)*

**Keamanan provider:**
- API key dienkripsi (AES-256-GCM, kunci di env `AI_SECRETS_KEY`) sebelum disimpan, tidak pernah dikirim ke browser (UI hanya menampilkan `sk-…abcd`), dan hanya didekripsi di server.
- Base URL wajib `https://`, kecuali admin menyalakan opsi "izinkan endpoint lokal" untuk Ollama. Host IP privat/metadata (`169.254.*`, `10.*`, `127.*`) diblokir secara default untuk mencegah SSRF.
- `GROQ_API_KEY` di env tetap menjadi provider bawaan (*seed*), sehingga aplikasi tetap jalan saat tabel provider masih kosong.

### 5.5 AI via MCP

- Admin mendaftarkan **MCP server remote**: label, URL server (HTTPS), header autentikasi (disimpan terenkripsi), daftar tool yang diizinkan (opsional), dan status aktif.
- Admin menautkan MCP server ke fitur tertentu di tab *Routing Fitur*. Contoh: Reading Companion boleh memakai MCP "Kamus Etimologi".
- Eksekusi memakai **Groq Responses API** dengan tool `type: "mcp"`. Groq yang menemukan dan memanggil tool (*server-side orchestration*). Fitur ini hanya berlaku untuk model yang mendukung tool use (mis. `openai/gpt-oss-120b`, `qwen/qwen3.8-27b`). Catatan: Remote MCP di Groq masih **beta**.
- Untuk provider `openai_compatible` lain yang tidak mendukung remote MCP: fase lanjutan memakai klien MCP di server (tools/list → tool calling lokal → tools/call).
- Tombol **Tes MCP** menampilkan daftar tool yang ditemukan.
- Setiap pemanggilan tool dicatat di log pemakaian (nama tool, durasi, status).

### 5.6 Roadmap fitur belajar (dari `fitur_tambahan_road map.xlsx`)

F-01 sampai F-07 tetap berlaku dan menjadi inti "ruang belajar". Prioritas di v2: **F-02** (Lanjutkan Membaca), **F-01** (Unify Reader), **F-03** (SRS kontekstual), **F-06** (pagination Gutenberg). F-04, F-05, dan F-07 masuk fase setelah v2.

---

## 6. Kebutuhan non-fungsional

| Area | Kebutuhan |
|---|---|
| Keamanan | Semua `/api/*` kecuali yang publik secara eksplisit mewajibkan login. Endpoint admin memverifikasi `role = 'admin'` di server. RLS aktif di semua tabel baru. |
| Biaya | Rate limit per pengguna wajib berjalan di semua route AI. Kuota bisa diatur dari admin. |
| Keandalan | Model cadangan dipakai otomatis jika model utama error 5xx atau timeout. Timeout default 30 detik. |
| Performa | Dashboard tidak lagi menjalankan RPC di setiap navigasi. LCP mobile < 2,5 detik di 4G. |
| Observabilitas | Setiap request AI dicatat di `ai_usage_logs`. |
| Kompatibilitas | Mengikuti konvensi Next.js 16: `middleware.ts` → `proxy.ts`. |

## 7. Daftar bug yang harus ditutup

| ID | Bug | Lokasi |
|---|---|---|
| B-01 | 27 route API bisa dipanggil tanpa login, sehingga kuota Groq bisa disalahgunakan | `app/api/**` (translation, generate-text, ocr, stt, tts, lingowise, tools/*, dll.) |
| B-02 | `getRateLimit()` tidak pernah dipanggil | `lib/ai-config.ts` |
| B-03 | OCR memakai model teks, sehingga gambar tidak terbaca | `app/api/ocr/route.ts` |
| B-04 | Upload OCR/STT tanpa batas ukuran atau validasi tipe | `app/api/ocr`, `app/api/stt` |
| B-05 | `time_spent_seconds` dipercaya dari klien; `.single()` gagal jika ada sesi ganda | `app/api/reading/heartbeat/route.ts` |
| B-06 | Feedback Duels palsu (teks permanen di kode); XP bisa di-farm; race condition baca-lalu-tulis pada XP | `duels/actions.ts`, `community-annotations/actions.ts` *(selesai dengan sendirinya lewat penghapusan gamifikasi)* |
| B-07 | `isFeatureEnabled` bernilai `false` untuk key yang tidak terdaftar, sehingga fitur baru mati diam-diam | `lib/ai-config.ts` |
| B-08 | `middleware.ts` sudah deprecated di Next.js 16 | `middleware.ts` |
| B-09 | `update_login_streak` dijalankan di setiap render layout | `app/(dashboard)/layout.tsx` |
| B-10 | Admin bisa mem-ban atau menghapus dirinya sendiri | `app/api/admin/users/action/route.ts` |
| B-11 | File log/pid dan script sementara ter-commit | `.next-start.*`, `scratch-fix.js`, `fixpad.js`, `test_*.js`, `update_prompts.js` |
| B-12 | Skema database tidak ada di repo (tidak ada `supabase/migrations`) | — |
| B-13 | *(perlu verifikasi)* RLS `profiles` mungkin mengizinkan user mengubah `role` miliknya sendiri | Supabase |

## 8. Pertanyaan terbuka

| # | Pertanyaan | Asumsi default di dokumen ini |
|---|---|---|
| Q1 | Apakah forum, clubs, messages, dan "Jejaring Pembaca" juga dihapus, atau hanya mekanik kompetitifnya? | **Hanya mekanik kompetitif yang dihapus**; fitur sosial tetap ada |
| Q2 | Apakah "Latihan Harian" dan "Weekly Challenge" dipertahankan? | Dipertahankan, tanpa poin |
| Q3 | Apakah provider `anthropic` native dibutuhkan di v2? | Tidak; cukup `openai_compatible` |
| Q4 | Apakah pengguna biasa boleh memilih model sendiri? | Tidak; hanya admin |
| Q5 | Berapa kuota default per pengguna? | 30 request/menit, 500/hari |
