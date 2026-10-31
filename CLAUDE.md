# Literary Language Lab — aturan sesi

Dibaca otomatis oleh Claude Code di setiap sesi. Detail lengkap: `docs/v3/HANDOFF.md`.

- Stack: Next.js 16.2 (App Router, breaking changes: `proxy.ts` bukan `middleware.ts`; `params`/`searchParams` adalah Promise), React 19, Supabase, Tailwind v4, TypeScript. Panduan Next.js: `node_modules/next/dist/docs/`.
- Status & rencana: `docs/SESSION_HANDOFF.md` (v2) dan `docs/v3/` (PRD, IMPLEMENTATION_PLAN, HANDOFF). Kerjakan hanya fase yang diminta.
- Git: branch `main`, satu commit per fase, identitas **finarfin112 <finarfinar112@gmail.com>** (Vercel memblokir penulis lain). Push selalu tanya dulu.
- Database: tidak ada akses dan tidak ada `.env`. Migrasi ditulis di `supabase/migrations/NNNN_*.sql`, tidak dijalankan. Kode harus tetap jalan sebelum migrasi dijalankan. Jangan jalankan `0009_drop_gamification.sql`.
- AI: selalu lewat `runAI()` (`lib/ai/run.ts`); feature key baru → `lib/ai/features.ts` + seed `ai_feature_routes` di migrasi.
- Auth/admin: `requireUser`/`requireAdmin` (`lib/auth.ts`), `requireAdminPage`/`assertAdmin` (`app/(dashboard)/admin/_lib/guard.ts`), `logAdminAction` (`lib/admin-audit.ts`).
- UI: komponen di `components/ui/`, target sentuh ≥ 44px, cek lebar 375px. Teks UI & komentar dalam bahasa Indonesia.
- Verifikasi: `npx tsc --noEmit`; lint tidak boleh menambah temuan dibanding HEAD (repo punya ±980 temuan lama); build di path pendek jika path repo panjang (Windows).
- Tidak ada gamifikasi (XP, streak, peringkat) — keputusan produk v2.
