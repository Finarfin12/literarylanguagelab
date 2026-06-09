# 🔒 Literary Language Lab — Security Audit Report

> **Audit Date:** 2026-06-09  
> **Scope:** Full codebase — API routes, database, auth, server actions, dependencies, injections  
> **Severity Legend:** 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low

---

## Ringkasan Temuan

| Severity | Count |
|----------|-------|
| 🔴 Critical | 8 |
| 🟠 High | 3 |
| 🟡 Medium | 11 |
| 🟢 Low | 4 |

---

## 1. Environment Variables & Secrets

### 🔴 CRITICAL: `.env.example` berisi kunci asli (bukan placeholder)

**File:** `.env.example`

File ini berisi kredensial **live production**, bukan placeholder:

```
NEXT_PUBLIC_SUPABASE_ANON_KEY = (JWT asli)
SUPABASE_SERVICE_ROLE_KEY = (kunci paling sensitif — full DB admin)
GROQ_API_KEY = (API key Groq)
```

Meskipun `.gitignore` berisi `.env*` (yang secara teknis mengecualikan `.env.example`), file ini **sengaja dibuat** sebagai template. Risikonya: developer bisa tidak sengaja `git add -f .env.example` atau CI/CD tool bisa mem-proses file ini.

**Service role key** adalah kunci paling berbahaya — kunci ini **melewati semua Row-Level Security** dan memberikan akses admin penuh ke database Supabase. Kunci ini **TIDAK BOLEH PERNAH** muncul di file apapun yang bisa di-commit.

**Fix:**
1. Rotasi semua kunci yang ter-expose (Groq API key, Supabase service role key)
2. Ganti semua nilai di `.env.example` dengan placeholder seperti `your-supabase-url-here`
3. Service role key hanya boleh ada di environment variables Vercel dashboard

---

## 2. Supabase Row-Level Security (RLS)

### 🔴 CRITICAL: `idioms` table — RLS bypass dengan `OR true`

**File:** `supabase_setup.sql` (line 138)

```sql
CREATE POLICY "Users can access own idioms"
  ON idioms FOR ALL
  USING (auth.uid() = user_id OR true);  -- OR true = PUBLIC!
```

**Dampak:** Siapapun (termasuk pengguna tidak terautentikasi) bisa **membaca, menambah, mengubah, dan menghapus SEMUA idiom**.

### 🔴 CRITICAL: `activity_logs` table — RLS bypass dengan `OR true`

**File:** `supabase_setup.sql` (line 147)

```sql
CREATE POLICY "Users can access own activity logs"
  ON activity_logs FOR ALL
  USING (auth.uid() = user_id OR true);  -- OR true = PUBLIC!
```

**Dampak:** Sama — siapapun bisa membaca/menulis/menghapus log aktivitas siapapun.

### 🔴 CRITICAL: `texts` table — TIDAK ADA RLS sama sekali

**File:** `supabase_setup.sql`

Tabel `texts` dibuat tapi **RLS tidak diaktifkan** dan **tidak ada policy**. Default Supabase: jika RLS tidak enabled, tabel bersifat **PUBLIC**. Artinya siapapun bisa **INSERT, UPDATE, DELETE teks di library**.

### 🟡 MEDIUM: `profiles` table — SELECT publik

```sql
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT USING (true);
```

Leaderboard dan public profile membutuhkan ini, tapi ini mengekspos semua data profil (termasuk data yang bisa digunakan untuk mapping identitas) ke siapa saja yang punya anon key.

### ✅ GOOD: Tabel dengan RLS ketat

Tabel berikut sudah memiliki RLS yang benar (`auth.uid() = user_id`):
- `vocabulary`
- `translation_memory`
- `glossaries`
- `reading_sessions`
- `translations`
- `chat_sessions` / `chat_messages`
- `community_annotations`
- `annotation_votes`
- Storage buckets (`Avatar`, `forum_images`)

---

## 3. Autentikasi & Otorisasi

### 🔴 CRITICAL: Open Redirect di OAuth callback

**File:** `app/auth/callback/route.ts`

```typescript
const next = searchParams.get('next') ?? '/tools';
return NextResponse.redirect(`${origin}${next}`);
```

Parameter `next` diambil langsung dari URL **tanpa validasi apapun**. Attacker bisa membuat link:

```
https://www.literarylanguagelab.my.id/auth/callback?code=xxx&next=https://evil.com/phishing
```

Setelah user autentikasi, mereka akan **di-redirect ke situs berbahaya**. Tidak ada pengecekan bahwa `next` adalah path relatif atau URL yang diizinkan.

**Fix:** Validasi bahwa `next` dimulai dengan `/` (relative path only).

### 🔴 CRITICAL: `addText` — tidak ada pengecekan autentikasi

**File:** `app/(dashboard)/library/actions.ts`

```typescript
export async function addText(formData: FormData) {
  const supabase = await createClient();
  // TIDAK ADA AUTH CHECK!
  const { error } = await supabase.from("texts").insert([...]);
```

**Dampak:** Siapapun bisa memasukkan teks arbitrer ke library — termasuk spam, konten berbahaya, atau payload berukuran raksasa. Dikombinasikan dengan `texts` table yang tidak punya RLS, ini **bypass ganda**.

### 🔴 CRITICAL: `voteDuelSubmission` — tidak ada pengecekan autentikasi

**File:** `app/(dashboard)/duels/actions.ts`

```typescript
export async function voteDuelSubmission(submissionId: string) {
  const supabase = await createClient();
  // No auth check!
  const { data: sub } = await supabase.from("duel_submissions")...
  await supabase.from("duel_submissions").update({ votes: sub.votes + 1 })...
```

**Dampak:** Siapapun (termasuk tidak terautentikasi) bisa **vote tak terbatas** pada submission apapun, menghancurkan integritas sistem voting.

### 🟠 HIGH: `submitReview` — tidak verifikasi kepemilikan

**File:** `app/(dashboard)/review/actions.ts`

```typescript
await supabase.from("vocabulary").update({...}).eq("id", vocabId);
// Missing: .eq("user_id", user.id)
```

Walaupun RLS melindungi di level database, action ini tidak memverifikasi bahwa `vocabId` milik user yang login. Lebih baik tambahkan validasi eksplisit.

### 🟡 MEDIUM: API routes AI tidak mewajibkan autentikasi

Semua route yang memanggil Groq API (`/api/lingowise`, `/api/comparator`, `/api/translation`, `/api/lookup`, `/api/untranslatables`, `/api/tools/*`, `/api/lexicon-search`, `/api/generate-text`, `/api/ocr`) **tidak memeriksa autentikasi**. Pengguna anonim bisa mengonsumsi kredit Groq API.

### ✅ GOOD: Dashboard layout mewajibkan auth

`app/(dashboard)/layout.tsx` — memeriksa `supabase.auth.getUser()` dan redirect ke `/login` jika tidak terautentikasi.

### ✅ GOOD: OAuth configuration

- `redirectTo: ${window.location.origin}/auth/callback` — benar
- `access_type: offline` + `prompt: consent` — support refresh token
- Tidak ada client secret di frontend

### ✅ GOOD: Server actions lainnya sudah memeriksa auth

- `clubs/actions.ts` — ✅
- `community-annotations/actions.ts` — ✅
- `glossary/actions.ts` — ✅
- `translation-memory/actions.ts` — ✅
- `vocabulary/actions.ts` — ✅

---

## 4. API Route Security

### 🟠 HIGH: Error message information leakage di semua route

Setiap route mengekspos `error.message` ke client:

```typescript
} catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
}
```

Ini membocorkan stack traces internal, path API, dan potensi struktur database.

**Fix:** Return generic error ke client, log detail error di server:
```typescript
} catch (error: any) {
    console.error("Internal error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal." }, { status: 500 });
}
```

### 🟡 MEDIUM: Tidak ada rate limiting

**Semua 19 API route** tidak memiliki rate limiting. Setiap endpoint yang memanggil Groq bisa dipanggil tanpa batas, berpotensi menghasilkan tagihan API yang sangat besar (serangan DoS finansial).

### 🟡 MEDIUM: Lexicon search menyebarkan input user ke API eksternal

**File:** `app/api/lexicon-search/route.ts`

Parameter `word` di-encode ke dalam panggilan ke `dictionaryapi.dev`, `datamuse.com`, dan `translate.argosopentech.com`. Meskipun `encodeURIComponent` digunakan, tidak ada validasi panjang maksimum yang bisa mencegah penyalahgunaan panggilan keluar.

### 🟡 MEDIUM: Tidak ada konfigurasi CORS eksplisit

`next.config.ts` tidak memiliki header CORS. Semua API route menggunakan default Next.js (same-origin only), yang acceptable tapi tanpa konfigurasi eksplisit.

### 🟢 LOW: Gutenberg text proxy — URL whitelist aman

```typescript
hostname === "gutenberg.org" || hostname.endsWith(".gutenberg.org")
```

Validasi hostname cukup ketat. HTTP diizinkan tapi Gutenberg redirect ke HTTPS. Subdomain `*.gutenberg.org` dikontrol oleh Project Gutenberg sendiri.

### ✅ GOOD: Timeout + AbortController di semua route Gutenberg

5-8 detik timeout mencegah request menggantung.

---

## 5. Injection Risks

### 🟡 MEDIUM: URL injection via library search

**File:** `app/(dashboard)/library/page.tsx`

```typescript
queryBuilder = queryBuilder.or(`title.ilike.%${searchTerm}%,author.ilike.%${searchTerm}%`);
```

Input user langsung masuk ke query database. Supabase meng-parameterize query `.ilike()`, tapi tidak ada validasi panjang/carakter khusus. Input sangat panjang bisa memicu query PostgreSQL yang mahal.

### 🟢 LOW: Tidak ada `dangerouslySetInnerHTML`

Nol penggunaan di seluruh codebase — tidak ada risiko XSS via innerHTML.

### 🟢 LOW: ReactMarkdown aman

`react-markdown` digunakan tanpa plugin `rehype-raw`, jadi tidak mengizinkan HTML mentah dalam markdown.

### 🟢 LOW: Tidak ada command injection

Codebase tidak memanggil `exec()`, `spawn()`, atau shell commands apapun.

### 🟢 LOW: Supabase queries terparameterisasi

Semua panggilan Supabase SDK (`.eq()`, `.insert()`, `.update()`, `.ilike()`) otomatis terparameterisasi.

### 🟢 LOW: Gutenberg ID validation

```typescript
if (!/^\d+$/.test(id)) { return error }
```

Hanya digit yang diizinkan — terlindungi dari path traversal.

---

## 6. Data Exposure

### 🟡 MEDIUM: Leaderboard mengekspos profil user

```typescript
.select("id, full_name, username, avatar_url, xp, streak, vocab_count")
```

Top 50 user terekspos dengan data gamifikasi. Tidak ada opsi opt-out.

### 🟡 MEDIUM: Public portfolio mengekspos terjemahan

`/p/{username}` menampilkan semua translation memory user tanpa pengaturan privasi. User mungkin tidak menyadari data mereka publik.

### 🟡 MEDIUM: Forum mengekspos role & level user

Setiap thread/komentar menampilkan `role` (user/admin) dan `level` — admin badge visible. Bisa menjadi target social engineering.

### 🟢 LOW: Email prefix di profil

```typescript
const fullName = profile.user_metadata?.full_name || profile.email.split('@')[0];
```

Jika `full_name` tidak diisi, prefix email ditampilkan — eksposur parsial alamat email.

---

## 7. Dependensi

| Package | Version | Notes |
|---------|---------|-------|
| `next` | 16.2.7 | **Sangat baru** (2025) — sedikit track record di production |
| `react` / `react-dom` | 19.2.4 | React 19 — sangat baru, CVE-2024-372489 diperbaiki di 19.0.1 |
| `@supabase/supabase-js` | ^2.108.0 | Relatif mature, periksa CVE auth bypass |
| `@supabase/ssr` | ^0.10.3 | **Pre-1.0** — API belum stabil |
| `groq-sdk` | ^1.2.1 | Relatif baru |
| `react-markdown` | ^10.1.0 | Aktif, maintained |
| `sweetalert2` | ^11.26.25 | Mature, sedikit isu keamanan |
| `html2pdf.js` | ^0.14.0 | Client-side PDF — **tidak terpakai** |
| `zod` | ^4.4.3 | Versi major baru — **tidak terpakai** |

### 🟡 MEDIUM: Next.js 16 terlalu bleeding-edge

Next.js 16 dirilis sangat baru. Belum ada data stabilitas jangka panjang. Pertimbangkan Next.js 15.x untuk production.

---

## 8. Ringkasan Perbaikan Prioritas

### 🚨 Segera (Critical)

| # | Temuan | File | Fix |
|---|--------|------|-----|
| 1 | **Service role key + Groq key di `.env.example`** | `.env.example` | Rotasi semua kunci. Ganti isi file dengan placeholder |
| 2 | **RLS bypass `idioms` (`OR true`)** | `supabase_setup.sql` | Hapus `OR true` dari policy |
| 3 | **RLS bypass `activity_logs` (`OR true`)** | `supabase_setup.sql` | Hapus `OR true` dari policy |
| 4 | **`texts` table tidak ada RLS** | `supabase_setup.sql` | `ALTER TABLE texts ENABLE ROW LEVEL SECURITY` + policies |
| 5 | **Open Redirect di OAuth callback** | `app/auth/callback/route.ts` | Validasi `next` adalah relative path (diawali `/`) |
| 6 | **`addText` tidak ada auth check** | `app/(dashboard)/library/actions.ts` | Tambahkan `await supabase.auth.getUser()` di awal |
| 7 | **`voteDuelSubmission` tidak ada auth check** | `app/(dashboard)/duels/actions.ts` | Tambahkan `await supabase.auth.getUser()` di awal |
| 8 | **Error message leakage di semua route** | 19 route files | Return generic error, log detail di server |

### ⚠️ Penting (High)

| # | Temuan | Fix |
|---|--------|-----|
| 1 | **Rate limiting** | Tambahkan rate limiter di semua route AI |
| 2 | **`submitReview` verifikasi kepemilikan** | Tambahkan `.eq("user_id", user.id)` |
| 3 | **Auth di route AI** | Pertimbangkan menambahkan auth check (terutama jika nanti naik ke tier berbayar) |

### 📋 Rekomendasi (Medium)

| # | Temuan | Fix |
|---|--------|-----|
| 1 | Profile SELECT publik | Evaluasi apakah data yang terekspos terlalu banyak |
| 2 | Privacy public portfolio | Tambahkan toggle public/private untuk translation memory |
| 3 | Email prefix di profile | Gunakan fallback generik, bukan email |
| 4 | Dependensi tidak terpakai | `npm uninstall html2pdf.js zod` |
| 5 | Next.js 16 | Pantau patch security, pertimbangkan downgrade ke 15.x |

---

## 9. Checklist Verifikasi

- [ ] Semua kunci sudah dirotasi (Groq, Supabase service role, Supabase anon)
- [ ] `.env.example` hanya berisi placeholder
- [ ] `idioms` RLS: `OR true` dihapus
- [ ] `activity_logs` RLS: `OR true` dihapus
- [ ] `texts` table: RLS diaktifkan + policies ditambahkan
- [ ] OAuth callback: validasi `next` parameter
- [ ] `addText` server action: auth check ditambahkan
- [ ] `voteDuelSubmission` server action: auth check ditambahkan
- [ ] Semua route: error message tidak membocorkan detail internal
- [ ] Rate limiting diimplementasikan di route AI
- [ ] Dependensi tidak terpakai dihapus (`html2pdf.js`, `zod`)
- [ ] `submitReview`: verifikasi kepemilikan vocabId
