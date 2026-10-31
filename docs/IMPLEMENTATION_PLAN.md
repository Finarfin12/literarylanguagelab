# Implementation Plan — Literary Language Lab v2

Turunan dari [PRD.md](PRD.md). Setiap fase berakhir dalam kondisi yang bisa di-deploy dan di-commit terpisah.

**Aturan umum**
- Baca panduan di `node_modules/next/dist/docs/` sebelum menulis kode Next.js (lihat `AGENTS.md`). Next.js 16 punya breaking changes.
- Setiap perubahan skema menjadi file di `supabase/migrations/` (folder baru). Tidak ada lagi perubahan langsung lewat dashboard Supabase.
- Kolom dan tabel lama tidak di-DROP sebelum Fase 7.
- Verifikasi tiap fase: `npm run lint`, `npm run build`, lalu cek manual di browser (desktop dan 375px).

## Ringkasan fase

| Fase | Isi | Estimasi | Bergantung pada |
|---|---|---|---|
| 0 | Fondasi & perbaikan bug keamanan | 2–3 hari | — |
| 1 | Penghapusan gamifikasi | 2 hari | 0 |
| 2 | Redesign tampilan & mobile | 4–6 hari | 1 |
| 3 | Registry provider AI + tab admin AI | 4–5 hari | 0 |
| 4 | OCR Qwen di atas registry | 0,5 hari | 3 |
| 5 | MCP | 3–4 hari | 3 |
| 6 | Tab admin lainnya (Ringkasan, Pemakaian, Fitur, Audit) | 3 hari | 3 |
| 7 | Fitur belajar roadmap (F-02, F-01, F-03, F-06) & pembersihan skema | 7–10 hari | 1, 2 |

Fase 1–2 (UI) dan Fase 3 (backend AI) menyentuh file yang berbeda, jadi bisa dikerjakan paralel setelah Fase 0.

---

## Fase 0 — Fondasi & bug keamanan

**0.1 Kebersihan repo (B-11, B-12)**
- `git rm --cached .next-start.*`; hapus `scratch-fix.js`, `fixpad.js`, `test_daily.js`, `test_rls.js`, `update_prompts.js` (cek isinya dulu); tambahkan `.next-start.*` ke `.gitignore`.
- Buat `supabase/migrations/0000_baseline.sql` dari `supabase db dump --schema public` agar skema saat ini tercatat.

**0.2 `middleware.ts` → `proxy.ts` (B-08)**
- Ganti nama file dan export function menjadi `proxy`, sesuai `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`.
- Di `proxy`: untuk `/api/*` tanpa sesi, balas `401` JSON, kecuali allowlist publik (`/api/gutenberg/*`, `/api/wotd`, `/auth/*`). Ini jaring pengaman, bukan satu-satunya pengecekan.

**0.3 Helper auth (B-01)**
- File baru `lib/auth.ts`:
  ```ts
  export async function requireUser(): Promise<{ supabase; user } | NextResponse>  // 401 jika belum login, 403 jika role 'banned'
  export async function requireAdmin(): Promise<{ supabase; user } | NextResponse> // 403 jika bukan admin
  ```
- Pasang di 27 route yang belum punya `getUser()`. Daftar lengkapnya didapat dari:
  `for f in $(git ls-files 'app/api/**/route.ts'); do grep -q getUser "$f" || echo $f; done`

**0.4 Rate limit (B-02)**
- Migrasi: tabel `ai_usage_logs` (lihat Fase 3, dibuat lebih awal di sini).
- `lib/rate-limit.ts`: `checkRateLimit(userId, featureKey)` menghitung baris `ai_usage_logs` dalam 1 menit dan 24 jam terakhir, lalu membandingkan dengan `getRateLimit()`. Jika lewat batas, balas `429`. Lewat fungsi SQL `count_recent_usage(user_id, interval)` agar cukup satu query.
- Dipanggil di semua route AI setelah `requireUser()`.

**0.5 Validasi input (B-04, B-05, B-10)**
- OCR: tolak base64 > 4 MB dan MIME di luar jpeg/png/webp. STT: tolak > 25 MB dan tipe selain `audio/*`.
- Heartbeat: batasi `time_spent_seconds` ke rentang 1–60 per panggilan. Ganti `.single()` dengan `.maybeSingle()` dan `order('last_active_at', desc).limit(1)`. Hapus auto-complete quest (dibahas lagi di Fase 1).
- Admin action: tolak jika `targetUserId === user.id`.

**0.6 `isFeatureEnabled` (B-07)**
- Ubah menjadi `data.value[featureName] !== false`, sehingga key yang tidak terdaftar dianggap aktif.

**0.7 Verifikasi RLS `profiles` (B-13)**
- Uji: login sebagai user biasa, jalankan `supabase.from('profiles').update({ role: 'admin' }).eq('id', myId)` dari konsol. Kalau berhasil, tambahkan migrasi: policy update hanya untuk kolom aman (kolom `role` dikunci lewat trigger `BEFORE UPDATE` yang menolak perubahan `role` kecuali dari service role).

**Selesai jika:** `curl -X POST /api/translation` tanpa cookie → 401; request ke-31 dalam semenit → 429; build lulus.

---

## Fase 1 — Penghapusan gamifikasi

**1.1 Hapus halaman & route**
- Hapus `app/(dashboard)/leaderboard/`, `app/(dashboard)/duels/`, `app/api/journey/`, `lib/journey-quests.ts`, `components/dashboard/JourneyWidget.tsx`.
- `lib/menu-config.ts`: buang "Global Leaderboard" dan "Translation Duels".
- Tambahkan redirect `/leaderboard` dan `/duels` → `/dashboard` di `next.config.ts` (untuk bookmark lama).

**1.2 Hapus pemberian XP dan streak**
- Hapus semua `update({ xp: … })` (cari dengan `grep -rn "xp" app components`). Lokasi utama: `community-annotations/actions.ts`, `writing-challenge` (route + evaluate), `review`, `vocabulary`, `evaluate-listening`, `daily-practice`, `placement-test`, `dialogue-simulator`.
- `(dashboard)/layout.tsx`: hapus `rpc("update_login_streak")` (B-09).
- `api/liter-ai/route.ts`: buang konteks XP/tier dari prompt.

**1.3 Bersihkan tampilan**
- `profile/page.tsx`, `p/[username]/page.tsx`, `forum/thread/[id]/page.tsx`, `admin/users/page.tsx` (`getGamificationTier`), `community/page.tsx`, `help/page.tsx`, `history/page.tsx`, `settings/page.tsx`: hapus XP, tier, dan streak. Ganti tier di forum dengan label level CEFR (jika ada).
- `gamification-system.md`: pindahkan ke `docs/archive/` dan beri catatan "tidak dipakai sejak v2".

**Selesai jika:** `grep -rniE "\bxp\b|leaderboard|duel|streak|journey_" app components lib` hanya menyisakan nama kolom di query yang memang akan dihapus di Fase 7, dan tidak ada yang tampil di UI.

---

## Fase 2 — Redesign tampilan & mobile

**2.1 Fondasi desain**
- Rapikan token di `app/globals.css` (warna, radius, spasi, tipografi) agar konsisten dengan tema terang/gelap via `next-themes`.
- `components/ui/`: Button, Card, Tabs, Sheet (bottom sheet), Input, Badge, EmptyState, Skeleton. Gunakan ulang SweetAlert2 hanya untuk konfirmasi destruktif.

**2.2 Dashboard "Ruang Belajar"**
- Tulis ulang `app/(dashboard)/dashboard/page.tsx` dengan blok: Lanjutkan Membaca, Kosakata Jatuh Tempo, Latihan Harian (`DailyPracticeWidget` tanpa poin), Progres Pribadi (`VocabChart`).

**2.3 Navigasi mobile**
- `components/MobileBottomNav.tsx`: Beranda · Baca (`/library`) · Kosakata (`/vocabulary`) · Alat (`/tools`) · Menu.
- `app/(dashboard)/menu/page.tsx`: tambah kolom pencarian di atas `MENU_GROUPS`. Grup bisa dilipat. Tautan admin tampil jika role = admin.

**2.4 Reader di mobile**
- `components/reader/*Sidebar.tsx`: bungkus dengan komponen `ResponsivePanel` (panel samping ≥ lg, `Sheet` dari bawah < lg).

**2.5 Audit per halaman**
- Telusuri setiap path di `menu-config.ts` dan `tools/[id]` pada lebar 375px. Catat dan perbaiki: overflow horizontal, tabel lebar → kartu, tombol < 44px, input yang tertutup keyboard.

**Selesai jika:** semua path di `menu-config.ts` dapat diakses dari HP dan lolos checklist 2.5.

---

## Fase 3 — Registry provider AI + tab admin AI

**3.1 Skema (`supabase/migrations/0002_ai_registry.sql`)**
```sql
create table ai_providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('openai_compatible','anthropic')),
  base_url text not null,
  api_key_encrypted text,          -- AES-256-GCM, iv:tag:cipher (base64)
  allow_private_network boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table ai_models (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references ai_providers on delete cascade,
  model_id text not null,          -- mis. 'qwen/qwen3.8-27b'
  label text,
  capabilities text[] not null default '{text}',  -- text | vision | tools | stt | tts
  default_temperature real default 0.7,
  default_max_tokens int default 1500,
  unique (provider_id, model_id)
);
create table ai_feature_routes (
  feature_key text primary key,    -- 'lookup','translation','ocr','reading-companion',...
  model_id uuid references ai_models,
  fallback_model_id uuid references ai_models,
  temperature real, max_tokens int,
  mcp_server_ids uuid[] default '{}',
  updated_at timestamptz default now()
);
create table ai_usage_logs (       -- dibuat di Fase 0.4
  id bigserial primary key,
  user_id uuid references auth.users, feature_key text, provider_id uuid, model_id text,
  tokens_in int, tokens_out int, latency_ms int, status text, error text,
  created_at timestamptz default now()
);
create index on ai_usage_logs (user_id, created_at desc);
```
- RLS: keempat tabel hanya bisa diakses admin (`exists (select 1 from profiles where id = auth.uid() and role = 'admin')`). Kolom `api_key_encrypted` tidak pernah di-select di kode klien; baca/tulis key hanya lewat route server dengan service role.
- Seed: provider "Groq (env)" dengan `base_url = https://api.groq.com/openai/v1` dan key kosong (berarti pakai `GROQ_API_KEY`), model `openai/gpt-oss-120b` [text, tools], `qwen/qwen3.8-27b` [text, vision, tools], `whisper-large-v3-turbo` [stt]. Isi `ai_feature_routes` dari nilai `system_config.ai_model_*` yang ada sekarang.

**3.2 Lapisan klien AI (`lib/ai/`)**
- `crypto.ts`: `encryptSecret` / `decryptSecret` (Node `crypto`, kunci dari `AI_SECRETS_KEY` 32-byte base64).
- `providers/openai-compatible.ts`: `chat({ baseUrl, apiKey, model, messages, temperature, maxTokens, tools?, signal })` lewat `fetch` ke `POST {baseUrl}/chat/completions`; `listModels()` → `GET {baseUrl}/models`.
- `resolve.ts`: `resolveFeature(featureKey)` → `{ provider, model, params, mcpServers }`, di-cache 60 detik per instance. Jika tabel kosong, fallback ke `getFallbackConfig` yang lama.
- `run.ts`: `runAI(featureKey, messages, opts)` = resolve → panggil → jika 5xx/timeout coba `fallback_model_id` → tulis `ai_usage_logs`. Kembalikan teks dan field `reasoning` (menangani respons GPT-OSS seperti di commit `82bbc51`).
- `url-guard.ts`: validasi `https:`, tolak IP privat/loopback/link-local setelah DNS lookup kecuali `allow_private_network`.

**3.3 Migrasi route**
- Ganti pola `getAIConfig()` + `getAIClient()` + `groq.chat.completions.create()` di 37 route menjadi `runAI('<feature-key>', messages)`. Kerjakan bertahap per kelompok (reader, english-lab, tools, translation) dan uji tiap kelompok.
- `lib/ai-config.ts` menjadi tipis: hanya re-export untuk kompatibilitas, lalu dihapus setelah semua route pindah.

**3.4 UI admin**
- `app/(dashboard)/admin/layout.tsx`: `requireAdmin()` + tab navigasi (horizontal scroll di mobile).
- Pindahkan halaman yang ada ke `admin/users`. Halaman baru: `admin/providers`, `admin/models`, `admin/routing`.
- Server actions di `admin/providers/actions.ts`: create/update/delete/test. "Tes koneksi" memanggil `listModels()` dan satu prompt pendek, lalu menampilkan latensi dan error.
- Routing: tabel fitur → dropdown model (difilter berdasarkan kemampuan yang dibutuhkan, mis. `ocr` hanya model `vision`).

**Selesai jika:** admin menambah provider OpenRouter lewat UI, memilih modelnya untuk fitur `translation`, dan halaman Translation memakai model itu tanpa deploy ulang.

---

## Fase 4 — OCR Qwen

- Daftarkan `ocr` di `ai_feature_routes` → `qwen/qwen3.8-27b` (kemampuan wajib: `vision`).
- `app/api/ocr/route.ts`: `requireUser` → `checkRateLimit` → validasi ukuran/MIME → `runAI('ocr', [{ role: 'user', content: [ {type:'text', text: PROMPT}, {type:'image_url', image_url:{url: dataUrl}} ] }])`. Matikan mode thinking/reasoning untuk OCR agar output berupa teks mentah.
- `app/(dashboard)/library/add/ocr/page.tsx`: kompres gambar di klien (canvas → JPEG, sisi ≤ 2000px), dukung kamera HP (`<input accept="image/*" capture="environment">`), tampilkan hasil di textarea yang bisa diedit.
- Uji dengan 10 foto halaman buku (cetak, layar, miring, redup).

---

## Fase 5 — MCP

**5.1 Skema (`0003_mcp.sql`)**
```sql
create table mcp_servers (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  server_url text not null,              -- https only
  headers_encrypted text,                -- JSON header auth terenkripsi
  allowed_tools text[],                  -- null = semua
  require_approval text not null default 'never',
  is_active boolean not null default true,
  created_at timestamptz default now()
);
```
RLS: admin-only (sama seperti Fase 3).

**5.2 Eksekusi**
- `lib/ai/providers/groq-responses.ts`: `POST https://api.groq.com/openai/v1/responses` dengan `tools: [{ type: 'mcp', server_label, server_url, headers, allowed_tools, require_approval: 'never' }]`.
- Di `runAI`: jika route fitur punya `mcp_server_ids` **dan** provider = Groq **dan** model punya kemampuan `tools`, pakai jalur Responses API. Jika tidak, abaikan MCP dan catat peringatan di log.
- Catat pemanggilan tool (dari output Responses API) ke `ai_usage_logs` (kolom tambahan `tool_calls jsonb`).
- Fase lanjutan (opsional): klien MCP sendiri (`@modelcontextprotocol/sdk`, transport Streamable HTTP) untuk provider non-Groq.

**5.3 UI admin**
- `admin/mcp`: CRUD, tombol **Tes** (panggil `tools/list` lewat SDK atau Responses API dengan prompt "list your tools"), dan tampilkan daftar tool.
- `admin/routing`: multi-select MCP server per fitur.

**Catatan risiko:** Remote MCP Groq masih beta. Isolasi jalur ini di belakang feature flag `mcp_enabled`.

---

## Fase 6 — Tab admin lainnya

- `admin/` (Ringkasan): kartu dari `ai_usage_logs` (request 24 jam/7 hari, error rate, top fitur, estimasi biaya = token × harga per model; tambahkan kolom `price_in`/`price_out` ke `ai_models`) dan grafik Recharts.
- `admin/usage`: tabel log dengan filter pengguna/fitur/model/status, plus form kuota (menulis `system_config.rate_limits`).
- `admin/features`: toggle feature flag (`system_config.features`), dibaca oleh `isFeatureEnabled`.
- `admin/audit`: tabel `admin_audit_log (actor_id, action, target, before jsonb, after jsonb, created_at)`, diisi oleh helper `logAdminAction()` di setiap server action admin.
- `admin/users`: tambah pencarian, filter role, dan kartu di mobile.

---

## Fase 7 — Fitur belajar & pembersihan

- **F-02 Lanjutkan Membaca**: tambah `last_paragraph_index` dan `progress_pct` ke `reading_sessions`; heartbeat mengirim posisi; dashboard menampilkan 3 bacaan terakhir.
- **F-01 Unify Reader**: Gutenberg dirender lewat `components/reader/TextDisplay.tsx` sehingga Word Lookup, Companion, dan Vocabulary Bank berfungsi.
- **F-03 SRS kontekstual**: simpan `context_sentence` dan `source_text_id` saat menambah kosakata; tampilkan di kartu review.
- **F-06 Pagination Gutenberg**: teruskan parameter `page` ke Gutendex dan tambah tombol "Muat lagi".
- **Pembersihan skema** (`0009_drop_gamification.sql`), dijalankan setelah v2 stabil ≥ 2 minggu: drop `profiles.xp`, `profiles.streak*`, `profiles.journey_level`, `journey_progress`, `duels`, `duel_submissions`, `update_login_streak()`. Backup dulu.

---

## Checklist verifikasi akhir

- [ ] Semua bug B-01 sampai B-13 punya langkah uji yang lulus (dicatat di PR).
- [ ] `npm run lint` dan `npm run build` bersih.
- [ ] Audit mobile 375px untuk semua path di `menu-config.ts`.
- [ ] OCR lulus uji 10 foto.
- [ ] Provider baru bisa ditambah dan dipakai lewat UI tanpa deploy.
- [ ] MCP server uji bisa didaftarkan, dites, dan dipakai oleh satu fitur.
- [ ] Tidak ada API key yang muncul di response jaringan browser (cek DevTools → Network).
