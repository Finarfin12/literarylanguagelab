# Literary Language Lab — aturan sesi

Dibaca otomatis oleh Claude Code di setiap sesi. Detail lengkap: `docs/v4/HANDOFF.md` (aturan v4) dan `docs/v3/HANDOFF.md` (pola, jebakan, verifikasi).

- **Redesign v4 hanya mengubah tampilan: jangan menghapus, menggabung, atau mengurangi fitur apa pun.** Daftar periksa wajib: `docs/v4/FEATURE_INVENTORY.md`. Acuan visual tunggal: `docs/v4/DESIGN.md`. Ragu → tanya pemilik.
- Huruf serif **Michelangelus hanya lewat `local()`** (lisensi Microsoft 365, tanpa izin webfont): jangan pernah meng-commit atau meng-host file fontnya.

- Stack: Next.js 16.2 (App Router, breaking changes: `proxy.ts` bukan `middleware.ts`; `params`/`searchParams` adalah Promise), React 19, Supabase, Tailwind v4, TypeScript. Panduan Next.js: `node_modules/next/dist/docs/`.
- **Mulai sesi baru dari `docs/HANDOFF_NEXT_SESSION.md`** (keadaan terkini, tindakan tertunda, jebakan, resep verifikasi, prompt pembuka).
- Status & rencana: `docs/SESSION_HANDOFF.md` (status semua fase), `docs/v3/` (Fase 8–11, selesai), `docs/v4/` (Fase 12–18, selesai di kode), `docs/v5/` (Fase 19–25: keamanan & biaya AI, Alter Ego, alur pemula, susunan & label, peta belajar). Kerjakan hanya fase yang diminta.
- Git: branch `main`, satu commit per fase, identitas **finarfin112 <finarfinar112@gmail.com>** (Vercel memblokir penulis lain). Push selalu tanya dulu.
- Database: tidak ada akses dan tidak ada `.env`. Migrasi ditulis di `supabase/migrations/NNNN_*.sql`, tidak dijalankan. Kode harus tetap jalan sebelum migrasi dijalankan. Migrasi `0000`–`0005` dan `0009` (hapus gamifikasi) sudah dijalankan pemilik: kolom `profiles.xp`/`streak`/`journey_level` dan tabel duels/journey/daily sudah tidak ada.
- AI: selalu lewat `runAI()` (`lib/ai/run.ts`); feature key baru → `lib/ai/features.ts` + seed `ai_feature_routes` di migrasi.
- Auth/admin: `requireUser`/`requireAdmin` (`lib/auth.ts`), `requireAdminPage`/`assertAdmin` (`app/(dashboard)/admin/_lib/guard.ts`), `logAdminAction` (`lib/admin-audit.ts`).
- UI: komponen di `components/ui/`, target sentuh ≥ 44px, cek lebar 375px. Teks UI & komentar dalam bahasa Indonesia.
- Verifikasi: `npx tsc --noEmit`; lint tidak boleh menambah temuan dibanding HEAD (repo punya ±980 temuan lama); build di path pendek jika path repo panjang (Windows).
- Tidak ada gamifikasi (XP, streak, peringkat) — keputusan produk v2.
