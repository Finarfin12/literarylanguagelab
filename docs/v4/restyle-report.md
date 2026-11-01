# Laporan v4-restyle (diterapkan)

Dibuat: 2026-11-01 oleh `scripts/v4-restyle.mjs`. Aturan: docs/v4/DESIGN.md §3.4.

- File berubah: **75** · penggantian warna: **810** · kelas dihapus: **143**
- Penggantian di luar `className`/`cn(...)` (objek data): **99** baris
- File dilewati (warna pembawa informasi): **10**

## File berubah (terbanyak dulu)

### components/reader/TextDisplay.tsx — 52 ganti, 4 hapus
- bg-purple-500 → bg-brand-solid ×1
- hover:bg-purple-600 → hover:bg-brand-hover ×1
- text-white → text-on-brand ×6
- bg-blue-500/10 → bg-muted ×1
- border-blue-500/20 → border-border ×1
- text-blue-500 → text-brand-ink ×2
- bg-blue-500/50 → bg-muted ×1
- border-blue-500 → border-border ×1
- bg-red-500/50 → bg-danger-tint ×1
- border-red-500 → border-danger/30 ×1
- bg-yellow-500/50 → bg-warning-tint ×1
- border-yellow-500 → border-warning-ink/30 ×1
- bg-orange-500 → bg-brand-solid ×2
- text-orange-100 → text-foreground ×1
- text-orange-500 → text-foreground ×1
- bg-green-500/10 → bg-muted ×1
- border-green-500 → border-border ×1
- text-green-600 → text-foreground ×1
- dark:text-green-400 → text-foreground ×1
- bg-red-500/10 → bg-muted ×1
- border-red-500 → border-border ×1
- text-red-600 → text-foreground ×1
- dark:text-red-400 → text-foreground ×1
- hover:bg-orange-600 → hover:bg-brand-hover ×1
- bg-green-500/10 → bg-brand-tint ×2
- border-green-500/30 → border-brand/30 ×2
- bg-red-500/10 → bg-danger-tint ×1
- border-red-500/30 → border-danger/30 ×1
- text-green-500 → text-brand-ink ×2
- text-red-500 → text-danger ×1
- bg-red-500 → bg-danger ×1
- hover:bg-red-600 → hover:bg-danger/90 ×1
- bg-blue-600 → bg-brand-solid ×2
- text-blue-100 → text-brand-ink ×1
- bg-green-500/20 → bg-brand-tint ×1
- text-green-600 → text-brand-ink ×2
- border-green-500 → border-brand/30 ×1
- focus:ring-blue-500 → focus:ring-border ×1
- hover:bg-blue-700 → hover:bg-brand-hover ×1
- text-purple-500 → text-foreground ×1
- ✂ dark:text-green-400 (duplikat setelah pemetaan) ×1
- ✂ dark:text-red-400 (duplikat setelah pemetaan) ×1
- ✂ shadow-[0_0_20px_rgba(168,85,247,0.4)] (glow berwarna) ×1
- ✂ backdrop-blur-3xl (backdrop-blur pada kartu) ×1

### app/(dashboard)/english-lab/grammar-clinic/page.tsx — 49 ganti, 5 hapus
- bg-blue-500/15 → bg-muted ×1
- text-blue-400 → text-foreground ×1
- border-blue-500/30 → border-border ×1
- bg-purple-500/15 → bg-muted ×1
- text-purple-400 → text-foreground ×1
- border-purple-500/30 → border-border ×1
- bg-amber-500/15 → bg-muted ×1
- text-amber-400 → text-foreground ×1
- border-amber-500/30 → border-border ×1
- bg-cyan-500/15 → bg-muted ×1
- text-cyan-400 → text-foreground ×1
- border-cyan-500/30 → border-border ×1
- bg-red-500/15 → bg-muted ×1
- text-red-400 → text-foreground ×1
- border-red-500/30 → border-border ×1
- bg-pink-500/15 → bg-muted ×1
- text-pink-400 → text-foreground ×1
- border-pink-500/30 → border-border ×1
- bg-emerald-500/15 → bg-muted ×1
- text-emerald-400 → text-foreground ×1
- border-emerald-500/30 → border-border ×1
- bg-orange-500/15 → bg-muted ×1
- text-orange-400 → text-foreground ×1
- border-orange-500/30 → border-border ×1
- bg-indigo-500/15 → bg-muted ×1
- text-indigo-400 → text-foreground ×1
- border-indigo-500/30 → border-border ×1
- bg-rose-500/15 → bg-muted ×1
- text-rose-400 → text-foreground ×1
- border-rose-500/30 → border-border ×1
- bg-red-500 → bg-danger ×1
- text-white → text-on-brand ×1
- bg-gradient-to-r → bg-muted ×1
- text-amber-400 → text-warning-ink ×4
- text-red-400 → text-danger ×3
- text-emerald-400 → text-brand-ink ×2
- bg-amber-500/5 → bg-warning-tint ×1
- border-amber-500/20 → border-warning-ink/30 ×1
- border-emerald-500 → border-brand/30 ×1
- text-emerald-500 → text-brand-ink ×1
- border-red-500 → border-danger/30 ×1
- text-red-500 → text-danger ×1
- ring-emerald-500 → ring-brand/30 ×1
- ✂ hover:shadow-[0_0_20px_rgba(62,207,142,0.3)] (glow berwarna) ×1
- ✂ from-brand/0 (gradasi dekoratif) ×1
- ✂ via-emerald-400 (gradasi dekoratif) ×1
- ✂ to-brand/0 (gradasi dekoratif) ×1
- ✂ hover:shadow-[0_0_15px_rgba(62,207,142,0.3)] (glow berwarna) ×1

### app/page.tsx — 37 ganti, 16 hapus
- selection:bg-orange-500/30 → selection:bg-muted ×1
- selection:text-orange-600 → selection:text-foreground ×1
- bg-gradient-to-b → bg-muted ×1
- text-orange-500 → text-foreground ×4
- hover:bg-orange-500 → hover:bg-brand-hover ×1
- bg-orange-500/10 → bg-muted ×2
- border-orange-500/20 → border-border ×3
- text-orange-600 → text-foreground ×2
- dark:text-orange-400 → text-foreground ×2
- bg-gradient-to-r → bg-muted ×1
- bg-orange-500 → bg-brand-solid ×2
- text-white → text-on-brand ×1
- hover:border-orange-500/40 → hover:border-border ×1
- text-blue-500 → text-brand-ink ×2
- bg-blue-500/10 → bg-muted ×1
- border-blue-500/20 → border-border ×1
- text-emerald-500 → text-brand-ink ×2
- bg-emerald-500/10 → bg-brand-tint ×1
- border-emerald-500/20 → border-brand/30 ×1
- text-rose-500 → text-foreground ×2
- bg-rose-500/10 → bg-muted ×1
- border-rose-500/20 → border-border ×1
- bg-gradient-to-br → bg-muted ×1
- bg-orange-500/20 → bg-muted ×1
- border-orange-500/30 → border-border ×1
- ✂ from-orange-500/50 (gradasi dekoratif) ×1
- ✂ to-transparent (gradasi dekoratif) ×1
- ✂ dark:text-orange-400 (duplikat setelah pemetaan) ×2
- ✂ from-orange-500 (gradasi dekoratif) ×1
- ✂ to-amber-500 (gradasi dekoratif) ×1
- ✂ shadow-[0_0_40px_rgba(249,115,22,0.3)] (glow berwarna) ×1
- ✂ hover:shadow-[0_0_60px_rgba(249,115,22,0.5)] (glow berwarna) ×1
- ✂ hover:-translate-y-1 (hover melompat) ×1
- ✂ backdrop-blur-md (backdrop-blur pada kartu) ×4
- ✂ from-orange-500/10 (gradasi dekoratif) ×1
- ✂ to-amber-500/10 (gradasi dekoratif) ×1
- ✂ group-hover:-translate-y-4 (hover melompat) ×1

### app/(dashboard)/english-lab/dialogue-simulator/page.tsx — 40 ganti, 1 hapus
- text-emerald-400 → text-brand-ink ×5
- bg-emerald-500/10 → bg-brand-tint ×2
- border-emerald-500/30 → border-brand/30 ×2
- text-amber-400 → text-warning-ink ×5
- bg-amber-500/10 → bg-warning-tint ×3
- border-amber-500/30 → border-warning-ink/30 ×3
- text-red-400 → text-danger ×4
- bg-red-500/10 → bg-danger-tint ×2
- border-red-500/30 → border-danger/30 ×2
- bg-emerald-500/5 → bg-brand-tint ×1
- border-emerald-500/20 → border-brand/30 ×1
- bg-red-500/5 → bg-danger-tint ×1
- border-red-500/20 → border-danger/30 ×1
- bg-blue-500/5 → bg-muted ×1
- border-blue-500/20 → border-border ×1
- text-blue-400 → text-brand-ink ×1
- bg-amber-500/5 → bg-warning-tint ×1
- border-amber-500/20 → border-warning-ink/30 ×1
- hover:bg-amber-500/20 → hover:bg-warning-tint ×1
- bg-red-500 → bg-danger ×1
- text-white → text-on-brand ×1
- ✂ hover:-translate-y-1 (hover melompat) ×1

### app/(dashboard)/english-lab/slang-decoder/page.tsx — 36 ganti, 4 hapus
- bg-purple-500/15 → bg-muted ×1
- text-purple-400 → text-foreground ×3
- border-purple-500/30 → border-border ×1
- bg-blue-500/15 → bg-muted ×1
- text-blue-400 → text-foreground ×1
- border-blue-500/30 → border-border ×1
- bg-emerald-500/15 → bg-muted ×1
- text-emerald-400 → text-foreground ×1
- border-emerald-500/30 → border-border ×1
- bg-pink-500/15 → bg-muted ×1
- text-pink-400 → text-foreground ×1
- border-pink-500/30 → border-border ×1
- bg-amber-500/15 → bg-muted ×1
- text-amber-400 → text-foreground ×1
- border-amber-500/30 → border-border ×1
- bg-gradient-to-r → bg-muted ×1
- focus:ring-purple-500 → focus:ring-border ×1
- focus:border-purple-500 → focus:border-border ×1
- bg-red-500 → bg-danger ×1
- text-white → text-on-brand ×2
- hover:bg-purple-500/10 → hover:bg-muted ×2
- hover:text-purple-400 → hover:text-foreground ×2
- bg-purple-500 → bg-brand-solid ×1
- hover:bg-purple-600 → hover:bg-brand-hover ×1
- bg-purple-500/5 → bg-muted ×1
- border-purple-500/20 → border-border ×1
- bg-red-400 → bg-danger ×1
- bg-amber-400 → bg-warning-ink ×1
- bg-emerald-400 → bg-brand-solid ×1
- hover:border-purple-500/30 → hover:border-border ×1
- group-hover:text-purple-400 → group-hover:text-foreground ×1
- ✂ from-brand/0 (gradasi dekoratif) ×1
- ✂ via-purple-500 (gradasi dekoratif) ×1
- ✂ to-brand/0 (gradasi dekoratif) ×1
- ✂ hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] (glow berwarna) ×1

### app/(dashboard)/tools/writing-assistant/page.tsx — 36 ganti, 2 hapus
- bg-blue-500/10 → bg-muted ×1
- text-blue-500 → text-brand-ink ×3
- focus:ring-blue-500 → focus:ring-border ×1
- bg-blue-500 → bg-brand-solid ×2
- hover:bg-blue-600 → hover:bg-brand-hover ×1
- text-white → text-on-brand ×1
- text-red-500 → text-danger ×2
- bg-gradient-to-br → bg-muted ×1
- border-blue-500/20 → border-border ×1
- text-blue-600 → text-brand-ink ×2
- border-blue-500 → border-border ×1
- bg-red-500/10 → bg-danger-tint ×1
- text-red-600 → text-danger ×1
- border-red-500/20 → border-danger/30 ×1
- decoration-red-500/50 → decoration-danger/50 ×1
- bg-green-500/10 → bg-brand-tint ×1
- text-green-600 → text-brand-ink ×1
- border-green-500/20 → border-brand/30 ×1
- text-emerald-500 → text-brand-ink ×1
- text-emerald-600 → text-brand-ink ×1
- bg-emerald-500/10 → bg-brand-tint ×1
- border-emerald-500/20 → border-brand/30 ×1
- text-purple-500 → text-foreground ×2
- bg-purple-500/10 → bg-muted ×1
- text-purple-600 → text-foreground ×1
- border-purple-500/20 → border-border ×1
- text-amber-500 → text-warning-ink ×1
- text-amber-600 → text-warning-ink ×1
- bg-amber-500/10 → bg-warning-tint ×1
- border-amber-500/20 → border-warning-ink/30 ×1
- ✂ from-blue-500/10 (gradasi dekoratif) ×1
- ✂ to-purple-500/10 (gradasi dekoratif) ×1

### app/(dashboard)/english-lab/listening-test/page.tsx — 34 ganti, 1 hapus
- text-emerald-400 → text-foreground ×1
- bg-emerald-500/10 → bg-muted ×1
- border-emerald-500/30 → border-border ×1
- text-amber-400 → text-foreground ×1
- bg-amber-500/10 → bg-muted ×1
- border-amber-500/30 → border-border ×1
- text-orange-400 → text-foreground ×1
- bg-orange-500/10 → bg-muted ×1
- border-orange-500/30 → border-border ×1
- bg-blue-500/10 → bg-muted ×1
- text-blue-400 → text-brand-ink ×1
- border-blue-500/20 → border-border ×1
- bg-amber-500/10 → bg-warning-tint ×1
- text-amber-400 → text-warning-ink ×1
- border-amber-500/20 → border-warning-ink/30 ×1
- bg-purple-500/10 → bg-muted ×1
- text-purple-400 → text-foreground ×1
- border-purple-500/20 → border-border ×1
- bg-emerald-500/20 → bg-brand-tint ×1
- text-emerald-500 → text-brand-ink ×5
- bg-amber-500/20 → bg-warning-tint ×1
- text-amber-500 → text-warning-ink ×1
- bg-red-500/20 → bg-danger-tint ×1
- text-red-500 → text-danger ×3
- bg-emerald-500/5 → bg-brand-tint ×1
- border-emerald-500/30 → border-brand/30 ×1
- bg-red-500/5 → bg-danger-tint ×1
- border-red-500/30 → border-danger/30 ×1
- ✂ hover:shadow-[0_0_20px_rgba(62,207,142,0.3)] (glow berwarna) ×1

### components/Sidebar.tsx — 27 ganti, 8 hapus
- hover:text-red-400 → hover:text-danger ×1
- bg-blue-500/10 → bg-muted ×1
- border-blue-500/20 → border-border ×1
- text-blue-400 → text-brand-ink ×1
- text-blue-500 → text-brand-ink ×1
- bg-orange-500/10 → bg-muted ×1
- border-orange-500/20 → border-border ×1
- text-orange-400 → text-foreground ×1
- text-orange-500 → text-foreground ×1
- bg-emerald-500/10 → bg-brand-tint ×2
- border-emerald-500/20 → border-brand/30 ×2
- text-emerald-400 → text-brand-ink ×2
- text-emerald-500 → text-brand-ink ×2
- bg-purple-500/10 → bg-muted ×1
- border-purple-500/20 → border-border ×1
- text-purple-400 → text-foreground ×1
- text-purple-500 → text-foreground ×1
- bg-red-500/10 → bg-danger-tint ×1
- border-red-500/20 → border-danger/30 ×1
- text-red-400 → text-danger ×1
- text-red-500 → text-danger ×1
- hover:text-red-500 → hover:text-danger ×1
- hover:bg-red-500/10 → hover:bg-danger-tint ×1
- ✂ backdrop-blur-xl (backdrop-blur pada kartu) ×1
- ✂ shadow-[0_0_15px_rgba(62,207,142,0.15)] (glow berwarna) ×1
- ✂ shadow-[0_0_15px_rgba(59,130,246,0.15)] (glow berwarna) ×1
- ✂ shadow-[0_0_15px_rgba(249,115,22,0.15)] (glow berwarna) ×1
- ✂ shadow-[0_0_15px_rgba(16,185,129,0.15)] (glow berwarna) ×2
- ✂ shadow-[0_0_15px_rgba(168,85,247,0.15)] (glow berwarna) ×1
- ✂ shadow-[0_0_15px_rgba(239,68,68,0.15)] (glow berwarna) ×1

### app/(dashboard)/english-lab/placement-test/page.tsx — 26 ganti, 7 hapus
- text-blue-400 → text-foreground ×1
- text-emerald-400 → text-foreground ×1
- text-purple-400 → text-foreground ×1
- text-amber-400 → text-foreground ×1
- bg-gradient-to-br → bg-muted ×1
- bg-gradient-to-r → bg-muted ×1
- bg-emerald-500/10 → bg-muted ×1
- border-emerald-500/50 → border-border ×1
- ring-emerald-500/30 → ring-border ×1
- bg-red-500/10 → bg-muted ×1
- border-red-500/50 → border-border ×1
- ring-red-500/30 → ring-border ×1
- bg-emerald-500 → bg-brand-solid ×2
- text-white → text-on-brand ×2
- bg-red-500 → bg-danger ×1
- bg-emerald-500/5 → bg-brand-tint ×1
- border-emerald-500/20 → border-brand/30 ×1
- bg-red-500/5 → bg-danger-tint ×1
- border-red-500/20 → border-danger/30 ×1
- text-emerald-500 → text-brand-ink ×1
- text-red-500 → text-danger ×1
- bg-blue-500 → bg-brand-solid ×1
- bg-purple-500 → bg-brand-solid ×1
- bg-amber-500 → bg-brand-solid ×1
- ✂ from-brand/20 (gradasi dekoratif) ×1
- ✂ to-emerald-500/10 (gradasi dekoratif) ×1
- ✂ hover:shadow-[0_0_20px_rgba(62,207,142,0.4)] (glow berwarna) ×3
- ✂ from-brand (gradasi dekoratif) ×1
- ✂ to-emerald-400 (gradasi dekoratif) ×1

### components/reader/ReadingCompanionSidebar.tsx — 27 ganti, 2 hapus
- bg-purple-500 → bg-brand-solid ×2
- hover:bg-purple-600 → hover:bg-brand-hover ×2
- text-white → text-on-brand ×2
- bg-purple-500/20 → bg-muted ×3
- text-purple-400 → text-foreground ×5
- hover:bg-rose-500/10 → hover:bg-muted ×1
- hover:text-rose-500 → hover:text-foreground ×1
- bg-purple-500/10 → bg-muted ×3
- text-purple-500 → text-foreground ×1
- bg-blue-500/20 → bg-muted ×1
- text-blue-400 → text-brand-ink ×1
- bg-blue-500/10 → bg-muted ×1
- border-blue-500/20 → border-border ×1
- border-purple-500/20 → border-border ×2
- focus-within:ring-purple-500 → focus-within:ring-border ×1
- ✂ shadow-[0_0_20px_rgba(168,85,247,0.4)] (glow berwarna) ×1
- ✂ md:backdrop-blur-3xl (backdrop-blur pada kartu) ×1

### app/(dashboard)/profile/page.tsx — 23 ganti, 3 hapus
- text-purple-400 → text-foreground ×2
- bg-purple-500/10 → bg-muted ×2
- border-purple-500/20 → border-border ×2
- text-orange-500 → text-foreground ×1
- bg-orange-500/10 → bg-muted ×1
- border-orange-500/20 → border-border ×1
- text-emerald-400 → text-foreground ×1
- bg-emerald-500/10 → bg-muted ×1
- border-emerald-500/20 → border-border ×1
- bg-gradient-to-r → bg-muted ×1
- text-yellow-400 → text-warning-ink ×1
- bg-green-500/10 → bg-brand-tint ×1
- text-green-500 → text-brand-ink ×1
- border-green-500/20 → border-brand/30 ×1
- bg-blue-500/10 → bg-muted ×1
- text-blue-400 → text-brand-ink ×1
- border-blue-500/20 → border-border ×1
- bg-pink-500/10 → bg-muted ×1
- text-pink-500 → text-foreground ×1
- border-pink-500/20 → border-border ×1
- ✂ from-brand/20 (gradasi dekoratif) ×1
- ✂ via-purple-500/20 (gradasi dekoratif) ×1
- ✂ to-brand/20 (gradasi dekoratif) ×1

### app/(dashboard)/translation-workshop/page.tsx — 17 ganti, 8 hapus
- bg-blue-500 → bg-brand-solid ×1
- text-white → text-on-brand ×5
- bg-amber-500 → bg-warning-ink ×1
- bg-purple-500 → bg-brand-solid ×1
- bg-rose-500 → bg-brand-solid ×1
- bg-cyan-500 → bg-brand-solid ×1
- bg-gradient-to-r → bg-muted ×1
- text-blue-400 → text-brand-ink ×1
- focus:ring-blue-500 → focus:ring-border ×1
- focus:border-blue-500 → focus:border-border ×1
- border-cyan-500/30 → border-border ×1
- text-cyan-500 → text-foreground ×2
- ✂ backdrop-blur-md (backdrop-blur pada kartu) ×2
- ✂ from-blue-500/0 (gradasi dekoratif) ×1
- ✂ via-blue-500 (gradasi dekoratif) ×1
- ✂ to-blue-500/0 (gradasi dekoratif) ×1
- ✂ hover:shadow-[0_0_30px_rgba(62,207,142,0.4)] (glow berwarna) ×1
- ✂ hover:-translate-y-1 (hover melompat) ×1
- ✂ backdrop-blur-2xl (backdrop-blur pada kartu) ×1

### app/(dashboard)/english-lab/flashcard/page.tsx — 20 ganti, 4 hapus
- bg-red-500/10 → bg-danger-tint ×2
- border-red-500/20 → border-danger/30 ×1
- text-red-400 → text-danger ×2
- bg-amber-500/10 → bg-warning-tint ×1
- border-amber-500/20 → border-warning-ink/30 ×1
- text-amber-400 → text-warning-ink ×2
- bg-gradient-to-r → bg-muted ×1
- border-emerald-500 → border-border ×1
- bg-emerald-500/10 → bg-muted ×1
- border-red-500 → border-border ×1
- bg-red-500/10 → bg-muted ×1
- bg-red-500 → bg-danger ×1
- text-white → text-on-brand ×1
- bg-emerald-500/10 → bg-brand-tint ×1
- border-emerald-500/30 → border-brand/30 ×1
- border-red-500/30 → border-danger/30 ×1
- text-emerald-400 → text-brand-ink ×1
- ✂ from-amber-400/0 (gradasi dekoratif) ×1
- ✂ via-amber-400 (gradasi dekoratif) ×1
- ✂ to-amber-400/0 (gradasi dekoratif) ×1
- ✂ hover:shadow-[0_0_20px_rgba(62,207,142,0.3)] (glow berwarna) ×1

### app/(dashboard)/tools/page.tsx — 21 ganti, 2 hapus
- text-blue-400 → text-foreground ×1
- bg-blue-500/10 → bg-muted ×2
- hover:border-blue-400/30 → hover:border-border ×1
- text-amber-400 → text-foreground ×1
- bg-amber-500/10 → bg-muted ×2
- hover:border-amber-400/30 → hover:border-border ×1
- text-purple-400 → text-foreground ×1
- bg-purple-500/10 → bg-muted ×1
- hover:border-purple-400/30 → hover:border-border ×1
- text-green-400 → text-foreground ×1
- bg-green-500/10 → bg-muted ×1
- hover:border-green-400/30 → hover:border-border ×1
- text-amber-500 → text-foreground ×1
- hover:border-amber-500/30 → hover:border-border ×1
- text-emerald-500 → text-foreground ×1
- bg-emerald-500/10 → bg-muted ×1
- hover:border-emerald-500/30 → hover:border-border ×1
- text-blue-500 → text-foreground ×1
- hover:border-blue-500/30 → hover:border-border ×1
- ✂ backdrop-blur-md (backdrop-blur pada kartu) ×1
- ✂ hover:-translate-y-1 (hover melompat) ×1

### app/(dashboard)/forum/thread/[id]/page.tsx — 20 ganti, 1 hapus
- bg-red-500/20 → bg-danger-tint ×3
- text-red-400 → text-danger ×3
- bg-orange-500/20 → bg-muted ×1
- text-orange-400 → text-foreground ×1
- bg-blue-500/20 → bg-muted ×2
- text-blue-400 → text-brand-ink ×2
- hover:text-red-400 → hover:text-danger ×2
- border-red-500/40 → border-danger/30 ×1
- border-red-500/30 → border-danger/30 ×1
- border-blue-500/30 → border-border ×1
- bg-red-500/10 → bg-danger-tint ×1
- text-red-500 → text-danger ×1
- hover:bg-red-500/20 → hover:bg-danger-tint ×1
- ✂ backdrop-blur-md (backdrop-blur pada kartu) ×1

### app/(dashboard)/gutenberg/page.tsx — 20 ganti, 1 hapus
- bg-orange-500/10 → bg-muted ×2
- text-orange-500 → text-foreground ×2
- bg-blue-500 → bg-brand-solid ×1
- text-white → text-on-brand ×3
- bg-orange-500 → bg-brand-solid ×2
- focus:border-orange-500 → focus:border-border ×1
- hover:bg-orange-600 → hover:bg-brand-hover ×1
- text-rose-500 → text-foreground ×1
- text-orange-600 → text-foreground ×1
- bg-blue-500/10 → bg-muted ×1
- text-blue-500 → text-brand-ink ×1
- hover:bg-orange-500 → hover:bg-brand-hover ×2
- hover:border-orange-500 → hover:border-border ×2
- ✂ hover:-translate-y-1 (hover melompat) ×1

### components/vocabulary/ReviewClient.tsx — 17 ganti, 3 hapus
- bg-gradient-to-br → bg-muted ×1
- bg-red-500/10 → bg-danger-tint ×1
- text-red-400 → text-danger ×1
- border-red-500/30 → border-danger/30 ×1
- hover:bg-red-500/20 → hover:bg-danger-tint ×1
- bg-orange-500/10 → bg-muted ×1
- text-orange-400 → text-foreground ×1
- border-orange-500/30 → border-border ×1
- hover:bg-orange-500/20 → hover:bg-muted ×1
- bg-blue-500/10 → bg-muted ×1
- text-blue-400 → text-brand-ink ×1
- border-blue-500/30 → border-border ×1
- hover:bg-blue-500/20 → hover:bg-muted ×1
- bg-green-500/10 → bg-brand-tint ×1
- text-green-400 → text-brand-ink ×1
- border-green-500/30 → border-brand/30 ×1
- hover:bg-green-500/20 → hover:bg-brand-tint ×1
- ✂ backdrop-blur-xl (backdrop-blur pada kartu) ×1
- ✂ from-blue-500/5 (gradasi dekoratif) ×1
- ✂ to-transparent (gradasi dekoratif) ×1

### app/(dashboard)/messages/page.tsx — 17 ganti, 1 hapus
- text-blue-500 → text-brand-ink ×4
- focus:ring-blue-500 → focus:ring-border ×2
- bg-blue-500/10 → bg-muted ×1
- bg-red-500 → bg-danger ×1
- text-white → text-on-brand ×3
- text-emerald-500 → text-brand-ink ×1
- bg-blue-600 → bg-brand-solid ×1
- text-blue-200 → text-brand-ink ×2
- bg-blue-500 → bg-brand-solid ×1
- hover:bg-blue-600 → hover:bg-brand-hover ×1
- ✂ shadow-blue-500/20 (bayangan berwarna (glow)) ×1

### app/(dashboard)/tools/cultural-context/page.tsx — 16 ganti, 1 hapus
- bg-amber-500/10 → bg-warning-tint ×2
- text-amber-500 → text-warning-ink ×3
- focus:ring-amber-500 → focus:ring-warning-ink/30 ×4
- bg-amber-500 → bg-warning-ink ×1
- text-white → text-on-brand ×1
- hover:bg-amber-600 → hover:bg-warning-ink/90 ×1
- hover:border-amber-500/30 → hover:border-warning-ink/30 ×1
- text-amber-600 → text-warning-ink ×1
- border-amber-500/20 → border-warning-ink/30 ×1
- text-emerald-500 → text-brand-ink ×1
- ✂ shadow-amber-500/20 (bayangan berwarna (glow)) ×1

### app/(dashboard)/tools/story-quiz/page.tsx — 13 ganti, 4 hapus
- bg-red-500/10 → bg-danger-tint ×2
- border-red-500/20 → border-danger/30 ×1
- text-red-400 → text-danger ×2
- bg-green-500/20 → bg-muted ×1
- border-green-500 → border-border ×1
- text-green-400 → text-foreground ×1
- bg-red-500/20 → bg-muted ×1
- border-red-500 → border-border ×1
- text-red-400 → text-foreground ×1
- bg-green-500/10 → bg-brand-tint ×1
- text-green-400 → text-brand-ink ×1
- ✂ hover:shadow-[0_0_15px_rgba(62,207,142,0.4)] (glow berwarna) ×2
- ✂ backdrop-blur-md (backdrop-blur pada kartu) ×1
- ✂ hover:shadow-[0_0_30px_rgba(62,207,142,0.4)] (glow berwarna) ×1

### components/PronunciationLab.tsx — 14 ganti, 2 hapus
- text-emerald-500 → text-foreground ×1
- bg-emerald-500/10 → bg-muted ×1
- border-emerald-500/20 → border-border ×1
- text-yellow-500 → text-foreground ×1
- bg-yellow-500/10 → bg-muted ×1
- border-yellow-500/20 → border-border ×1
- text-red-500 → text-foreground ×1
- bg-red-500/10 → bg-muted ×1
- border-red-500/20 → border-border ×1
- bg-red-500 → bg-danger ×1
- text-white → text-on-brand ×1
- bg-red-500/10 → bg-danger-tint ×1
- text-red-500 → text-danger ×1
- border-red-500/20 → border-danger/30 ×1
- ✂ hover:-translate-y-0.5 (hover melompat) ×1
- ✂ hover:shadow-[0_0_20px_rgba(62,207,142,0.4)] (glow berwarna) ×1

### app/(auth)/register/page.tsx — 9 ganti, 6 hapus
- focus:border-blue-400 → focus:border-border ×3
- focus:ring-blue-400 → focus:ring-border ×3
- bg-blue-500 → bg-brand-solid ×1
- hover:bg-blue-600 → hover:bg-brand-hover ×1
- text-blue-400 → text-brand-ink ×1
- ✂ backdrop-blur-xl (backdrop-blur pada kartu) ×1
- ✂ hover:shadow-blue-500/20 (bayangan berwarna (glow)) ×1
- ✂ backdrop-blur-sm (backdrop-blur pada kartu) ×3
- ✂ shadow-blue-500/20 (bayangan berwarna (glow)) ×1

### app/(dashboard)/history/page.tsx — 9 ganti, 5 hapus
- border-blue-500/20 → border-border ×1
- bg-blue-500/10 → bg-muted ×1
- text-blue-400 → text-brand-ink ×1
- border-purple-500/20 → border-border ×1
- bg-purple-500/10 → bg-muted ×1
- text-purple-400 → text-foreground ×1
- border-red-500/20 → border-danger/30 ×1
- bg-red-500/10 → bg-danger-tint ×1
- text-red-500 → text-danger ×1
- ✂ backdrop-blur-md (backdrop-blur pada kartu) ×5

### app/(dashboard)/glossary/page.tsx — 13 ganti, 0 hapus
- text-amber-500 → text-warning-ink ×3
- focus:border-amber-500 → focus:border-warning-ink/30 ×5
- bg-amber-500 → bg-warning-ink ×1
- text-white → text-on-brand ×1
- hover:bg-amber-600 → hover:bg-warning-ink/90 ×1
- hover:text-red-500 → hover:text-danger ×1
- hover:bg-red-500/10 → hover:bg-danger-tint ×1

### app/(dashboard)/library/add/ocr/page.tsx — 9 ganti, 4 hapus
- bg-gradient-to-r → bg-muted ×1
- text-blue-400 → text-brand-ink ×2
- hover:border-blue-400 → hover:border-border ×1
- bg-blue-500 → bg-brand-solid ×1
- hover:bg-blue-600 → hover:bg-brand-hover ×1
- text-white → text-on-brand ×1
- hover:text-red-500 → hover:text-danger ×1
- hover:bg-red-500/10 → hover:bg-danger-tint ×1
- ✂ from-blue-500/0 (gradasi dekoratif) ×1
- ✂ via-blue-500 (gradasi dekoratif) ×1
- ✂ to-blue-500/0 (gradasi dekoratif) ×1
- ✂ hover:shadow-[0_0_20px_rgba(62,207,142,0.4)] (glow berwarna) ×1

### app/(dashboard)/tools/lexicon-search/page.tsx — 11 ganti, 2 hapus
- bg-red-500 → bg-danger ×1
- text-white → text-on-brand ×1
- text-amber-400 → text-warning-ink ×1
- text-blue-400 → text-brand-ink ×2
- bg-blue-500/10 → bg-muted ×1
- border-blue-500/20 → border-border ×1
- text-purple-400 → text-foreground ×2
- bg-purple-500/10 → bg-muted ×1
- border-purple-500/20 → border-border ×1
- ✂ backdrop-blur-md (backdrop-blur pada kartu) ×2

### components/vocabulary/FlashcardMode.tsx — 10 ganti, 2 hapus
- bg-red-500/10 → bg-danger-tint ×1
- text-red-600 → text-danger ×1
- dark:text-red-400 → text-danger ×1
- border-red-500/30 → border-danger/30 ×1
- hover:bg-red-500/20 → hover:bg-danger-tint ×1
- bg-green-500/10 → bg-brand-tint ×1
- text-green-600 → text-brand-ink ×1
- dark:text-green-400 → text-brand-ink ×1
- border-green-500/30 → border-brand/30 ×1
- hover:bg-green-500/20 → hover:bg-brand-tint ×1
- ✂ dark:text-red-400 (duplikat setelah pemetaan) ×1
- ✂ dark:text-green-400 (duplikat setelah pemetaan) ×1

### components/admin/RoleDropdown.tsx — 11 ganti, 0 hapus
- text-red-500 → text-danger ×1
- border-red-500/50 → border-danger/30 ×1
- hover:bg-red-500/10 → hover:bg-danger-tint ×1
- text-purple-500 → text-foreground ×1
- border-purple-500/50 → border-border ×1
- hover:bg-purple-500/10 → hover:bg-muted ×1
- text-blue-500 → text-brand-ink ×1
- border-blue-500/50 → border-border ×1
- hover:bg-blue-500/10 → hover:bg-muted ×1
- text-red-500/70 → text-danger/70 ×1
- hover:text-red-500 → hover:text-danger ×1

### app/(dashboard)/clubs/[id]/page.tsx — 10 ganti, 0 hapus
- bg-green-500/10 → bg-brand-tint ×1
- text-green-600 → text-brand-ink ×1
- border-green-500/20 → border-brand/30 ×1
- bg-red-500/10 → bg-danger-tint ×1
- text-red-600 → text-danger ×1
- border-red-500/20 → border-danger/30 ×1
- text-blue-500 → text-brand-ink ×2
- bg-blue-500/10 → bg-muted ×1
- text-green-500 → text-brand-ink ×1

### app/(dashboard)/admin/content/ContentManager.tsx — 9 ganti, 0 hapus
- border-red-500/30 → border-danger/30 ×1
- bg-red-500/10 → bg-danger-tint ×3
- text-red-500 → text-danger ×3
- text-amber-500 → text-warning-ink ×1
- hover:bg-red-500/20 → hover:bg-danger-tint ×1

### app/(dashboard)/menu/page.tsx — 9 ganti, 0 hapus
- text-red-500 → text-foreground ×1
- bg-red-500 → bg-danger ×1
- text-white → text-on-brand ×1
- text-amber-500 → text-warning-ink ×1
- text-blue-500 → text-brand-ink ×1
- border-rose-500/20 → border-border ×1
- bg-rose-500/10 → bg-muted ×1
- text-rose-500 → text-foreground ×1
- hover:bg-rose-500 → hover:bg-brand-hover ×1

### app/(dashboard)/tools/untranslatables/page.tsx — 9 ganti, 0 hapus
- bg-teal-500/10 → bg-muted ×1
- text-teal-500 → text-foreground ×2
- focus:border-teal-500 → focus:border-border ×1
- focus:ring-teal-500 → focus:ring-border ×1
- bg-teal-500 → bg-brand-solid ×1
- text-white → text-on-brand ×1
- hover:bg-teal-600 → hover:bg-brand-hover ×1
- prose-headings:text-teal-500 → prose-headings:text-foreground ×1

### app/(dashboard)/vocabulary/review/page.tsx — 5 ganti, 4 hapus
- text-amber-400 → text-warning-ink ×1
- bg-red-500/10 → bg-danger-tint ×1
- hover:bg-red-500/20 → hover:bg-danger-tint ×1
- text-red-400 → text-danger ×1
- border-red-500/20 → border-danger/30 ×1
- ✂ backdrop-blur-xl (backdrop-blur pada kartu) ×2
- ✂ hover:shadow-[0_0_20px_rgba(62,207,142,0.4)] (glow berwarna) ×1
- ✂ hover:-translate-y-1 (hover melompat) ×1

### app/(dashboard)/admin/_lib/ui.tsx — 7 ganti, 1 hapus
- border-red-500/30 → border-danger/30 ×1
- bg-red-500/10 → bg-danger-tint ×1
- text-red-500 → text-danger ×1
- border-amber-500/30 → border-warning-ink/30 ×1
- bg-amber-500/10 → bg-warning-tint ×1
- text-amber-600 → text-warning-ink ×1
- dark:text-amber-400 → text-warning-ink ×1
- ✂ dark:text-amber-400 (duplikat setelah pemetaan) ×1

### app/(dashboard)/forum/create/page.tsx — 7 ganti, 1 hapus
- bg-red-500/10 → bg-danger-tint ×2
- border-red-500/20 → border-danger/30 ×1
- accent-red-500 → accent-danger ×1
- text-red-500 → text-danger ×2
- hover:bg-red-500/20 → hover:bg-danger-tint ×1
- ✂ backdrop-blur-md (backdrop-blur pada kartu) ×1

### app/(dashboard)/tools/alter-ego/page.tsx — 5 ganti, 3 hapus
- hover:text-red-400 → hover:text-danger ×1
- bg-blue-500/20 → bg-muted ×1
- text-blue-400 → text-brand-ink ×1
- bg-blue-500/10 → bg-muted ×1
- border-blue-500/20 → border-border ×1
- ✂ backdrop-blur-md (backdrop-blur pada kartu) ×2
- ✂ hover:shadow-[0_0_15px_rgba(62,207,142,0.4)] (glow berwarna) ×1

### app/(dashboard)/tools/paraphrase/page.tsx — 2 ganti, 6 hapus
- bg-gradient-to-r → bg-muted ×1
- text-blue-400 → text-brand-ink ×1
- ✂ backdrop-blur-md (backdrop-blur pada kartu) ×1
- ✂ from-blue-500/0 (gradasi dekoratif) ×1
- ✂ via-blue-500 (gradasi dekoratif) ×1
- ✂ to-blue-500/0 (gradasi dekoratif) ×1
- ✂ hover:shadow-[0_0_30px_rgba(62,207,142,0.4)] (glow berwarna) ×1
- ✂ backdrop-blur-2xl (backdrop-blur pada kartu) ×1

### app/(dashboard)/clubs/page.tsx — 7 ganti, 0 hapus
- text-blue-500 → text-brand-ink ×1
- bg-green-500/10 → bg-brand-tint ×1
- text-green-600 → text-brand-ink ×1
- border-green-500/20 → border-brand/30 ×1
- bg-red-500/10 → bg-danger-tint ×1
- text-red-600 → text-danger ×1
- border-red-500/20 → border-danger/30 ×1

### app/(dashboard)/dashboard/page.tsx — 7 ganti, 0 hapus
- text-orange-500 → text-foreground ×1
- text-emerald-500 → text-foreground ×1
- text-purple-500 → text-foreground ×1
- text-blue-400 → text-brand-ink ×2
- bg-blue-500/10 → bg-muted ×1
- bg-blue-400 → bg-brand-solid ×1

### components/lingowise/LingoWiseClient.tsx — 2 ganti, 5 hapus
- bg-red-500 → bg-danger ×1
- text-white → text-on-brand ×1
- ✂ backdrop-blur-md (backdrop-blur pada kartu) ×3
- ✂ shadow-[0_0_20px_rgba(62,207,142,0.2)] (glow berwarna) ×1
- ✂ hover:-translate-y-1 (hover melompat) ×1

### app/(dashboard)/admin/page.tsx — 6 ganti, 0 hapus
- text-blue-400 → text-foreground ×1
- text-red-500 → text-danger ×2
- text-amber-500 → text-warning-ink ×1
- text-purple-400 → text-foreground ×1
- text-emerald-500 → text-foreground ×1

### app/(dashboard)/forum/page.tsx — 5 ganti, 1 hapus
- hover:text-red-400 → hover:text-danger ×1
- bg-red-500/10 → bg-danger-tint ×1
- text-red-500 → text-danger ×2
- text-yellow-500 → text-warning-ink ×1
- ✂ hover:-translate-y-1 (hover melompat) ×1

### app/(dashboard)/gutenberg/[id]/page.tsx — 6 ganti, 0 hapus
- text-orange-500 → text-foreground ×2
- text-rose-500 → text-foreground ×1
- hover:bg-orange-500 → hover:bg-brand-hover ×1
- text-yellow-500 → text-warning-ink ×1
- text-blue-500 → text-brand-ink ×1

### lib/menu-config.ts — 6 ganti, 0 hapus
- text-blue-400 → text-foreground ×1
- text-amber-400 → text-foreground ×1
- text-emerald-400 → text-foreground ×1
- text-purple-400 → text-foreground ×1
- text-cyan-400 → text-foreground ×1
- text-rose-400 → text-foreground ×1

### app/(dashboard)/admin/providers/ProviderManager.tsx — 5 ganti, 0 hapus
- bg-blue-500/10 → bg-muted ×1
- text-blue-400 → text-brand-ink ×1
- bg-red-500/10 → bg-danger-tint ×1
- text-red-500 → text-danger ×1
- hover:bg-red-500/20 → hover:bg-danger-tint ×1

### app/(dashboard)/help/page.tsx — 5 ganti, 0 hapus
- text-orange-500 → text-foreground ×1
- text-rose-400 → text-foreground ×1
- text-blue-400 → text-foreground ×1
- text-purple-400 → text-foreground ×1
- text-amber-400 → text-foreground ×1

### app/(dashboard)/library/add/page.tsx — 3 ganti, 2 hapus
- bg-blue-500/10 → bg-muted ×1
- text-blue-400 → text-brand-ink ×1
- border-blue-400 → border-border ×1
- ✂ hover:shadow-[0_0_20px_rgba(62,207,142,0.4)] (glow berwarna) ×1
- ✂ hover:-translate-y-0.5 (hover melompat) ×1

### app/(dashboard)/library/page.tsx — 3 ganti, 2 hapus
- bg-red-500/10 → bg-danger-tint ×1
- border-red-500/50 → border-danger/30 ×1
- text-red-400 → text-danger ×1
- ✂ backdrop-blur-md (backdrop-blur pada kartu) ×1
- ✂ hover:-translate-y-1 (hover melompat) ×1

### components/reader/VocabFlashcardModal.tsx — 4 ganti, 1 hapus
- hover:bg-rose-500 → hover:bg-brand-hover ×1
- bg-emerald-500/10 → bg-brand-tint ×1
- border-emerald-500/50 → border-brand/30 ×1
- text-emerald-500 → text-brand-ink ×1
- ✂ shadow-[0_0_30px_rgba(62,207,142,0.2)] (glow berwarna) ×1

### app/(dashboard)/admin/usage/page.tsx — 4 ganti, 0 hapus
- bg-red-500/10 → bg-danger-tint ×1
- text-red-500 → text-danger ×2
- text-amber-500 → text-warning-ink ×1

### app/(dashboard)/preview/[id]/page.tsx — 3 ganti, 1 hapus
- bg-emerald-500/10 → bg-brand-tint ×1
- border-emerald-500/50 → border-brand/30 ×1
- text-emerald-500 → text-brand-ink ×1
- ✂ shadow-[0_0_30px_rgba(62,207,142,0.15)] (glow berwarna) ×1

### app/(dashboard)/tools/a-z-dictionary/page.tsx — 1 ganti, 3 hapus
- text-blue-400 → text-brand-ink ×1
- ✂ shadow-[0_0_15px_rgba(62,207,142,0.4)] (glow berwarna) ×1
- ✂ backdrop-blur-md (backdrop-blur pada kartu) ×1
- ✂ hover:-translate-y-1 (hover melompat) ×1

### app/(dashboard)/tools/parallel-text/page.tsx — 4 ganti, 0 hapus
- text-blue-400 → text-brand-ink ×2
- bg-blue-500/10 → bg-muted ×1
- border-blue-500/20 → border-border ×1

### app/(dashboard)/tools/tone-analyzer/page.tsx — 0 ganti, 4 hapus
- ✂ backdrop-blur-md (backdrop-blur pada kartu) ×1
- ✂ hover:shadow-[0_0_20px_rgba(62,207,142,0.4)] (glow berwarna) ×1
- ✂ hover:-translate-y-0.5 (hover melompat) ×1
- ✂ backdrop-blur-2xl (backdrop-blur pada kartu) ×1

### app/(dashboard)/translation-memory/page.tsx — 4 ganti, 0 hapus
- text-blue-500 → text-brand-ink ×1
- text-blue-400 → text-brand-ink ×1
- hover:text-red-500 → hover:text-danger ×1
- hover:bg-red-500/10 → hover:bg-danger-tint ×1

### app/(dashboard)/vocabulary/core/page.tsx — 3 ganti, 1 hapus
- bg-amber-500/10 → bg-muted ×1
- text-amber-600 → text-foreground ×1
- dark:text-amber-400 → text-foreground ×1
- ✂ dark:text-amber-400 (duplikat setelah pemetaan) ×1

### components/reader/WordLookupSidebar.tsx — 3 ganti, 1 hapus
- bg-green-500/20 → bg-brand-tint ×1
- text-green-400 → text-brand-ink ×1
- border-green-500/30 → border-brand/30 ×1
- ✂ hover:shadow-[0_0_20px_rgba(62,207,142,0.4)] (glow berwarna) ×1

### app/(auth)/login/page.tsx — 0 ganti, 3 hapus
- ✂ backdrop-blur-xl (backdrop-blur pada kartu) ×1
- ✂ backdrop-blur-sm (backdrop-blur pada kartu) ×2

### app/(dashboard)/admin/models/ModelManager.tsx — 3 ganti, 0 hapus
- bg-red-500/10 → bg-danger-tint ×1
- text-red-500 → text-danger ×1
- hover:bg-red-500/20 → hover:bg-danger-tint ×1

### app/(dashboard)/idioms/page.tsx — 1 ganti, 2 hapus
- hover:text-red-400 → hover:text-danger ×1
- ✂ backdrop-blur-md (backdrop-blur pada kartu) ×1
- ✂ hover:shadow-[0_0_15px_rgba(62,207,142,0.4)] (glow berwarna) ×1

### app/(dashboard)/settings/page.tsx — 3 ganti, 0 hapus
- bg-red-500/10 → bg-danger-tint ×1
- text-red-500 → text-danger ×1
- border-red-500/20 → border-danger/30 ×1

### app/(dashboard)/translation-workspace/[id]/SegmentPanel.tsx — 2 ganti, 1 hapus
- text-amber-600 → text-warning-ink ×1
- dark:text-amber-400 → text-warning-ink ×1
- ✂ dark:text-amber-400 (duplikat setelah pemetaan) ×1

### app/(dashboard)/translation-workspace/[id]/WorkspaceEditor.tsx — 2 ganti, 1 hapus
- text-amber-600 → text-warning-ink ×1
- dark:text-amber-400 → text-warning-ink ×1
- ✂ dark:text-amber-400 (duplikat setelah pemetaan) ×1

### app/p/[username]/page.tsx — 3 ganti, 0 hapus
- text-amber-500 → text-warning-ink ×1
- text-blue-500 → text-brand-ink ×1
- text-blue-400 → text-brand-ink ×1

### components/library/DeleteTextButton.tsx — 3 ganti, 0 hapus
- bg-red-500/10 → bg-danger-tint ×1
- text-red-500 → text-danger ×1
- hover:bg-red-500 → hover:bg-danger/90 ×1

### components/vocabulary/VocabularyBankClient.tsx — 2 ganti, 1 hapus
- hover:bg-red-500/20 → hover:bg-danger-tint ×1
- hover:text-red-400 → hover:text-danger ×1
- ✂ hover:shadow-[0_0_15px_rgba(62,207,142,0.4)] (glow berwarna) ×1

### app/(dashboard)/community/page.tsx — 2 ganti, 0 hapus
- hover:bg-red-500/10 → hover:bg-danger-tint ×1
- hover:text-red-500 → hover:text-danger ×1

### components/community/ProfileActions.tsx — 2 ganti, 0 hapus
- hover:bg-red-500/10 → hover:bg-danger-tint ×1
- hover:text-red-500 → hover:text-danger ×1

### components/reader/BookmarkSidebar.tsx — 2 ganti, 0 hapus
- hover:text-red-500 → hover:text-danger ×2

### components/TopActions.tsx — 2 ganti, 0 hapus
- bg-red-500 → bg-danger ×1
- text-white → text-on-brand ×1

### app/(dashboard)/admin/content/page.tsx — 1 ganti, 0 hapus
- text-red-500 → text-danger ×1

### app/(dashboard)/admin/usage/QuotaForm.tsx — 1 ganti, 0 hapus
- text-amber-500 → text-warning-ink ×1

### app/(dashboard)/admin/users/page.tsx — 1 ganti, 0 hapus
- text-red-500 → text-danger ×1

### app/(dashboard)/english-lab/grammar/[slug]/TopicPractice.tsx — 1 ganti, 0 hapus
- border-amber-500/50 → border-warning-ink/30 ×1

### app/(dashboard)/tools/[id]/page.tsx — 1 ganti, 0 hapus
- text-red-500 → text-danger ×1

## Penggantian di luar className (objek data) — tinjau

- components/reader/TextDisplay.tsx: `if (isCorrect) btnClass = "bg-green-500/10 border-green-500 text-green-600 dark:text-green-400";`
- components/reader/TextDisplay.tsx: `else if (isSelected) btnClass = "bg-red-500/10 border-red-500 text-red-600 dark:text-red-400";`
- app/(dashboard)/english-lab/grammar-clinic/page.tsx: `"Tense": "bg-blue-500/15 text-blue-400 border-blue-500/30",`
- app/(dashboard)/english-lab/grammar-clinic/page.tsx: `"Subject-Verb Agreement": "bg-purple-500/15 text-purple-400 border-purple-500/30",`
- app/(dashboard)/english-lab/grammar-clinic/page.tsx: `"Article": "bg-amber-500/15 text-amber-400 border-amber-500/30",`
- app/(dashboard)/english-lab/grammar-clinic/page.tsx: `"Preposition": "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",`
- app/(dashboard)/english-lab/grammar-clinic/page.tsx: `"Spelling": "bg-red-500/15 text-red-400 border-red-500/30",`
- app/(dashboard)/english-lab/grammar-clinic/page.tsx: `"Punctuation": "bg-pink-500/15 text-pink-400 border-pink-500/30",`
- app/(dashboard)/english-lab/grammar-clinic/page.tsx: `"Word Choice": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",`
- app/(dashboard)/english-lab/grammar-clinic/page.tsx: `"Plural/Singular": "bg-orange-500/15 text-orange-400 border-orange-500/30",`
- app/(dashboard)/english-lab/grammar-clinic/page.tsx: `"Run-on Sentence": "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",`
- app/(dashboard)/english-lab/grammar-clinic/page.tsx: `"Fragment": "bg-rose-500/15 text-rose-400 border-rose-500/30",`
- app/(dashboard)/english-lab/grammar-clinic/page.tsx: `} ${quizChecked && opt === q.answer && answered !== opt ? "ring-2 ring-emerald-500 ring-offset-1 ring-offset-background" : ""}'}`
- app/(dashboard)/english-lab/dialogue-simulator/page.tsx: `const color = score >= 80 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" : score >= 60 ? "text-amber-400 bg-amber-500/10 borde`
- app/(dashboard)/english-lab/dialogue-simulator/page.tsx: `const color = score >= 80 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" : score >= 60 ? "text-amber-400 bg-amber-500/10 borde`
- app/(dashboard)/english-lab/dialogue-simulator/page.tsx: `const color = score >= 80 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" : score >= 60 ? "text-amber-400 bg-amber-500/10 borde`
- app/(dashboard)/english-lab/slang-decoder/page.tsx: `"Slang": "bg-purple-500/15 text-purple-400 border-purple-500/30",`
- app/(dashboard)/english-lab/slang-decoder/page.tsx: `"Abbreviation": "bg-blue-500/15 text-blue-400 border-blue-500/30",`
- app/(dashboard)/english-lab/slang-decoder/page.tsx: `"Internet Lingo": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",`
- app/(dashboard)/english-lab/slang-decoder/page.tsx: `"Pop Culture": "bg-pink-500/15 text-pink-400 border-pink-500/30",`
- app/(dashboard)/english-lab/slang-decoder/page.tsx: `"Idiom": "bg-amber-500/15 text-amber-400 border-amber-500/30",`
- app/(dashboard)/english-lab/listening-test/page.tsx: `{ id: "A1", label: "Beginner", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },`
- app/(dashboard)/english-lab/listening-test/page.tsx: `{ id: "A1", label: "Beginner", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },`
- app/(dashboard)/english-lab/listening-test/page.tsx: `{ id: "A1", label: "Beginner", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },`
- app/(dashboard)/english-lab/listening-test/page.tsx: `{ id: "B1", label: "Intermediate", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },`
- app/(dashboard)/english-lab/listening-test/page.tsx: `{ id: "B1", label: "Intermediate", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },`
- app/(dashboard)/english-lab/listening-test/page.tsx: `{ id: "B1", label: "Intermediate", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },`
- app/(dashboard)/english-lab/listening-test/page.tsx: `{ id: "B2", label: "Upper Int.", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },`
- app/(dashboard)/english-lab/listening-test/page.tsx: `{ id: "B2", label: "Upper Int.", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },`
- app/(dashboard)/english-lab/listening-test/page.tsx: `{ id: "B2", label: "Upper Int.", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },`
- app/(dashboard)/english-lab/placement-test/page.tsx: `{ id: 'reading', label: 'Reading', icon: BookOpen, color: 'text-blue-400', questions: 3 },`
- app/(dashboard)/english-lab/placement-test/page.tsx: `{ id: 'grammar', label: 'Grammar', icon: PenLine, color: 'text-emerald-400', questions: 3 },`
- app/(dashboard)/english-lab/placement-test/page.tsx: `{ id: 'vocabulary', label: 'Vocabulary', icon: BookMarked, color: 'text-purple-400', questions: 2 },`
- app/(dashboard)/english-lab/placement-test/page.tsx: `{ id: 'listening', label: 'Listening', icon: Headphones, color: 'text-amber-400', questions: 2 },`
- app/(dashboard)/english-lab/placement-test/page.tsx: `if (isCorrect) optClass = 'bg-emerald-500/10 border-emerald-500/50 ring-2 ring-emerald-500/30';`
- app/(dashboard)/english-lab/placement-test/page.tsx: `else if (isSelected && !isCorrect) optClass = 'bg-red-500/10 border-red-500/50 ring-2 ring-red-500/30';`
- app/(dashboard)/english-lab/placement-test/page.tsx: `{ label: '📚 Vocabulary', score: finalResult.scores.vocabulary, color: 'bg-purple-500' },`
- app/(dashboard)/english-lab/placement-test/page.tsx: `{ label: '🎧 Listening', score: finalResult.scores.listening, color: 'bg-amber-500' },`
- app/(dashboard)/profile/page.tsx: `{ icon: Activity, value: stats.idiomCount, label: "Idiom", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" `
- app/(dashboard)/profile/page.tsx: `{ icon: Activity, value: stats.idiomCount, label: "Idiom", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" `
- app/(dashboard)/profile/page.tsx: `{ icon: Activity, value: stats.idiomCount, label: "Idiom", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" `
- app/(dashboard)/profile/page.tsx: `{ icon: BookMarked, value: stats.textsCompleted, label: "Teks Dibaca", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-ora`
- app/(dashboard)/profile/page.tsx: `{ icon: BookMarked, value: stats.textsCompleted, label: "Teks Dibaca", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-ora`
- app/(dashboard)/profile/page.tsx: `{ icon: BookMarked, value: stats.textsCompleted, label: "Teks Dibaca", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-ora`
- app/(dashboard)/profile/page.tsx: `{ icon: TrendingUp, value: stats.reviewsThisWeek, label: "Review Minggu Ini", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "b`
- app/(dashboard)/profile/page.tsx: `{ icon: TrendingUp, value: stats.reviewsThisWeek, label: "Review Minggu Ini", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "b`
- app/(dashboard)/profile/page.tsx: `{ icon: TrendingUp, value: stats.reviewsThisWeek, label: "Review Minggu Ini", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "b`
- app/(dashboard)/english-lab/flashcard/page.tsx: `if (isAnswer) borderClass = "border-emerald-500 bg-emerald-500/10";`
- app/(dashboard)/english-lab/flashcard/page.tsx: `else if (isSelected && !isAnswer) borderClass = "border-red-500 bg-red-500/10";`
- app/(dashboard)/tools/page.tsx: `colorClass: "text-blue-400",`
- app/(dashboard)/tools/page.tsx: `bgClass: "bg-blue-500/10",`
- app/(dashboard)/tools/page.tsx: `borderClass: "hover:border-blue-400/30"`
- app/(dashboard)/tools/page.tsx: `colorClass: "text-amber-400", bgClass: "bg-amber-500/10", borderClass: "hover:border-amber-400/30"`
- app/(dashboard)/tools/page.tsx: `colorClass: "text-amber-400", bgClass: "bg-amber-500/10", borderClass: "hover:border-amber-400/30"`
- app/(dashboard)/tools/page.tsx: `colorClass: "text-amber-400", bgClass: "bg-amber-500/10", borderClass: "hover:border-amber-400/30"`
- app/(dashboard)/tools/page.tsx: `colorClass: "text-purple-400", bgClass: "bg-purple-500/10", borderClass: "hover:border-purple-400/30"`
- app/(dashboard)/tools/page.tsx: `colorClass: "text-purple-400", bgClass: "bg-purple-500/10", borderClass: "hover:border-purple-400/30"`
- app/(dashboard)/tools/page.tsx: `colorClass: "text-purple-400", bgClass: "bg-purple-500/10", borderClass: "hover:border-purple-400/30"`
- app/(dashboard)/tools/page.tsx: `colorClass: "text-green-400", bgClass: "bg-green-500/10", borderClass: "hover:border-green-400/30"`
- app/(dashboard)/tools/page.tsx: `colorClass: "text-green-400", bgClass: "bg-green-500/10", borderClass: "hover:border-green-400/30"`
- app/(dashboard)/tools/page.tsx: `colorClass: "text-green-400", bgClass: "bg-green-500/10", borderClass: "hover:border-green-400/30"`
- app/(dashboard)/tools/page.tsx: `colorClass: "text-amber-500", bgClass: "bg-amber-500/10", borderClass: "hover:border-amber-500/30"`
- app/(dashboard)/tools/page.tsx: `colorClass: "text-amber-500", bgClass: "bg-amber-500/10", borderClass: "hover:border-amber-500/30"`
- app/(dashboard)/tools/page.tsx: `colorClass: "text-amber-500", bgClass: "bg-amber-500/10", borderClass: "hover:border-amber-500/30"`
- app/(dashboard)/tools/page.tsx: `colorClass: "text-emerald-500", bgClass: "bg-emerald-500/10", borderClass: "hover:border-emerald-500/30"`
- app/(dashboard)/tools/page.tsx: `colorClass: "text-emerald-500", bgClass: "bg-emerald-500/10", borderClass: "hover:border-emerald-500/30"`
- app/(dashboard)/tools/page.tsx: `colorClass: "text-emerald-500", bgClass: "bg-emerald-500/10", borderClass: "hover:border-emerald-500/30"`
- app/(dashboard)/tools/page.tsx: `colorClass: "text-blue-500", bgClass: "bg-blue-500/10", borderClass: "hover:border-blue-500/30"`
- app/(dashboard)/tools/page.tsx: `colorClass: "text-blue-500", bgClass: "bg-blue-500/10", borderClass: "hover:border-blue-500/30"`
- app/(dashboard)/tools/page.tsx: `colorClass: "text-blue-500", bgClass: "bg-blue-500/10", borderClass: "hover:border-blue-500/30"`
- app/(dashboard)/tools/story-quiz/page.tsx: `btnClass = "bg-green-500/20 border-green-500 text-green-400 font-bold";`
- app/(dashboard)/tools/story-quiz/page.tsx: `btnClass = "bg-red-500/20 border-red-500 text-red-400 line-through opacity-70";`
- components/PronunciationLab.tsx: `if (score >= 90) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";`
- components/PronunciationLab.tsx: `if (score >= 70) return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";`
- components/PronunciationLab.tsx: `return "text-red-500 bg-red-500/10 border-red-500/20";`
- components/admin/RoleDropdown.tsx: `? 'text-purple-500 border-purple-500/50 hover:bg-purple-500/10'`
- components/admin/RoleDropdown.tsx: `? 'text-blue-500 border-blue-500/50 hover:bg-blue-500/10'`
- app/(dashboard)/menu/page.tsx: `color: "text-red-500",`
- app/(dashboard)/admin/_lib/ui.tsx: `const color = tone === "error" ? "border-red-500/30 bg-red-500/10 text-red-500" : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:t`
- app/(dashboard)/admin/_lib/ui.tsx: `const color = tone === "error" ? "border-red-500/30 bg-red-500/10 text-red-500" : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:t`
- app/(dashboard)/dashboard/page.tsx: `{ icon: Clock, color: "text-orange-500", label: "Waktu baca minggu ini", value: weeklyMinutes, unit: "menit" },`
- app/(dashboard)/dashboard/page.tsx: `{ icon: CheckCircle2, color: "text-emerald-500", label: "Teks dibaca", value: completedTexts },`
- app/(dashboard)/dashboard/page.tsx: `{ icon: BookMarked, color: "text-purple-500", label: "Total kosa kata", value: vocabCount },`
- app/(dashboard)/admin/page.tsx: `{ icon: Activity, color: "text-blue-400", label: "Request AI 7 hari", value: requests.length.toLocaleString("id-ID") },`
- app/(dashboard)/admin/page.tsx: `{ icon: AlertTriangle, color: errorRate > 5 ? "text-red-500" : "text-amber-500", label: "Error rate 7 hari", value: '${errorRate}%' },`
- app/(dashboard)/admin/page.tsx: `{ icon: AlertTriangle, color: errorRate > 5 ? "text-red-500" : "text-amber-500", label: "Error rate 7 hari", value: '${errorRate}%' },`
- app/(dashboard)/admin/page.tsx: `{ icon: Users, color: "text-purple-400", label: "Pengguna aktif AI 7 hari", value: '${activeUsers7d} / ${usersRes.count ?? "?"}' },`
- app/(dashboard)/admin/page.tsx: `color: "text-emerald-500",`
- lib/menu-config.ts: `color: "text-blue-400",`
- lib/menu-config.ts: `color: "text-amber-400",`
- lib/menu-config.ts: `color: "text-emerald-400",`
- lib/menu-config.ts: `color: "text-purple-400",`
- lib/menu-config.ts: `color: "text-cyan-400",`
- lib/menu-config.ts: `color: "text-rose-400",`
- app/(dashboard)/help/page.tsx: `{ icon: MessageCircle, label: "Forum & Community", desc: "Diskusi forum, klub baca, dan anotasi bersama", href: "/forum", color: "text-rose-`
- app/(dashboard)/help/page.tsx: `{ icon: GraduationCap, label: "Translation Workshop", desc: "Latihan terjemahan English→Indonesia dengan evaluasi AI", href: "/translation-w`
- app/(dashboard)/help/page.tsx: `{ icon: Globe, label: "Vocabulary & Review", desc: "Bank kosa kata + spaced repetition SM-2", href: "/vocabulary", color: "text-purple-400" `
- app/(dashboard)/help/page.tsx: `{ icon: Gamepad2, label: "Tools & Games", desc: "25+ tools: Story Quiz, Paraphrase Challenge, Alter Ego Chat", href: "/tools", color: "text-`
- app/(dashboard)/vocabulary/core/page.tsx: `sedang: { text: "Sedang dipelajari", cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },`

## Dilewati (pengecualian informasi; tinjau di sub-fase 14, cukup periksa kontras)

- app/(dashboard)/community-annotations/page.tsx — warna anotasi pengguna (14 kelas warna, 0 dekoratif tidak disentuh)
- app/(dashboard)/tools/annotations/page.tsx — pemilih warna anotasi (1 kelas warna, 0 dekoratif tidak disentuh)
- app/(dashboard)/tools/comparator/page.tsx — tanda diff (tambah/hapus) (10 kelas warna, 1 dekoratif tidak disentuh)
- app/(dashboard)/tools/sentence-architect/page.tsx — warna kelas kata (subjek/verba/objek) (22 kelas warna, 1 dekoratif tidak disentuh)
- components/GraphViewer.tsx — warna simpul/seri grafik (4 kelas warna, 4 dekoratif tidak disentuh)
- components/reader/CulturalTextRenderer.tsx — penanda referensi budaya (amber) berbeda dari idiom (7 kelas warna, 2 dekoratif tidak disentuh)
- components/reader/InteractiveParagraph.tsx — warna sorotan & bedah sintaksis (9 kelas warna, 0 dekoratif tidak disentuh)
- components/reader/ReaderBlock.tsx — warna sorotan & bedah sintaksis (4 kelas warna, 0 dekoratif tidak disentuh)
- components/reader/SemanticMapViewer.tsx — warna simpul/seri grafik (1 kelas warna, 4 dekoratif tidak disentuh)
- components/reader/SentenceAnalysisSidebar.tsx — warna kelas kata / analisis kalimat (15 kelas warna, 0 dekoratif tidak disentuh)

## Perlu ditinjau manual (dibiarkan skrip)

- **app/(auth)/register/page.tsx**
  - from-blue-500/20 — stop gradasi di string terpisah dari bg-gradient-to-*; ubah manual bersama pemakainya ×1
- **app/(dashboard)/admin/AdminTabs.tsx**
  - backdrop-blur — backdrop-blur bukan pada kartu (header/overlay?); dibiarkan ×1
- **app/(dashboard)/community/page.tsx**
  - animate-pulse — animate-pulse: dekoratif atau skeleton? dibiarkan ×1
- **app/(dashboard)/english-lab/dialogue-simulator/page.tsx**
  - animate-pulse — animate-pulse: dekoratif atau skeleton? dibiarkan ×1
- **app/(dashboard)/english-lab/flashcard/page.tsx**
  - const BOX_COLORS = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-eme — dilewati: skala kotak Leitner 1-5 (merah-hijau) ×1
  - animate-pulse — animate-pulse: dekoratif atau skeleton? dibiarkan ×1
- **app/(dashboard)/english-lab/grammar-clinic/page.tsx**
  - bg-gradient-to-r — gradasi tanpa warna palet (token/transparan); periksa fungsinya (mis. fade) ×1
  - animate-pulse — animate-pulse: dekoratif atau skeleton? dibiarkan ×3
  - backdrop-blur-sm — backdrop-blur bukan pada kartu (header/overlay?); dibiarkan ×1
  - backdrop-blur-md — backdrop-blur bukan pada kartu (header/overlay?); dibiarkan ×1
- **app/(dashboard)/english-lab/listening-test/page.tsx**
  - bg-gradient-to-r — gradasi tanpa warna palet (token/transparan); periksa fungsinya (mis. fade) ×1
  - animate-pulse — animate-pulse: dekoratif atau skeleton? dibiarkan ×1
- **app/(dashboard)/english-lab/placement-test/page.tsx**
  - from-sky-500 — stop gradasi di string terpisah dari bg-gradient-to-*; ubah manual bersama pemakainya ×1
  - to-blue-600 — stop gradasi di string terpisah dari bg-gradient-to-*; ubah manual bersama pemakainya ×1
  - from-emerald-500 — stop gradasi di string terpisah dari bg-gradient-to-*; ubah manual bersama pemakainya ×1
  - to-teal-600 — stop gradasi di string terpisah dari bg-gradient-to-*; ubah manual bersama pemakainya ×1
  - from-amber-500 — stop gradasi di string terpisah dari bg-gradient-to-*; ubah manual bersama pemakainya ×1
  - to-orange-600 — stop gradasi di string terpisah dari bg-gradient-to-*; ubah manual bersama pemakainya ×1
  - from-purple-500 — stop gradasi di string terpisah dari bg-gradient-to-*; ubah manual bersama pemakainya ×1
  - to-violet-600 — stop gradasi di string terpisah dari bg-gradient-to-*; ubah manual bersama pemakainya ×1
  - from-rose-500 — stop gradasi di string terpisah dari bg-gradient-to-*; ubah manual bersama pemakainya ×1
  - to-pink-600 — stop gradasi di string terpisah dari bg-gradient-to-*; ubah manual bersama pemakainya ×1
  - from-yellow-400 — stop gradasi di string terpisah dari bg-gradient-to-*; ubah manual bersama pemakainya ×1
  - to-amber-500 — stop gradasi di string terpisah dari bg-gradient-to-*; ubah manual bersama pemakainya ×1
  - animate-pulse — animate-pulse: dekoratif atau skeleton? dibiarkan ×1
  - bg-gradient-to-br — gradasi tanpa warna palet (token/transparan); periksa fungsinya (mis. fade) ×1
- **app/(dashboard)/english-lab/slang-decoder/page.tsx**
  - animate-pulse — animate-pulse: dekoratif atau skeleton? dibiarkan ×1
- **app/(dashboard)/forum/create/page.tsx**
  - animate-pulse — animate-pulse: dekoratif atau skeleton? dibiarkan ×1
- **app/(dashboard)/forum/page.tsx**
  - animate-pulse — animate-pulse: dekoratif atau skeleton? dibiarkan ×1
  - backdrop-blur-sm — backdrop-blur bukan pada kartu (header/overlay?); dibiarkan ×1
- **app/(dashboard)/forum/thread/[id]/page.tsx**
  - animate-pulse — animate-pulse: dekoratif atau skeleton? dibiarkan ×2
- **app/(dashboard)/gutenberg/[id]/page.tsx**
  - animate-pulse — animate-pulse: dekoratif atau skeleton? dibiarkan ×1
- **app/(dashboard)/help/page.tsx**
  - backdrop-blur-md — backdrop-blur bukan pada kartu (header/overlay?); dibiarkan ×1
- **app/(dashboard)/history/page.tsx**
  - animate-pulse — animate-pulse: dekoratif atau skeleton? dibiarkan ×1
- **app/(dashboard)/library/add/ocr/page.tsx**
  - bg-gradient-to-r — gradasi tanpa warna palet (token/transparan); periksa fungsinya (mis. fade) ×1
- **app/(dashboard)/library/add/page.tsx**
  - bg-gradient-to-r — gradasi tanpa warna palet (token/transparan); periksa fungsinya (mis. fade) ×2
- **app/(dashboard)/library/page.tsx**
  - bg-gradient-to-br — gradasi tanpa warna palet (token/transparan); periksa fungsinya (mis. fade) ×1
- **app/(dashboard)/preview/[id]/page.tsx**
  - animate-pulse — animate-pulse: dekoratif atau skeleton? dibiarkan ×1
- **app/(dashboard)/profile/page.tsx**
  - bg-gradient-to-br — gradasi tanpa warna palet (token/transparan); periksa fungsinya (mis. fade) ×1
- **app/(dashboard)/tools/a-z-dictionary/page.tsx**
  - backdrop-blur-xl — backdrop-blur bukan pada kartu (header/overlay?); dibiarkan ×1
  - animate-pulse — animate-pulse: dekoratif atau skeleton? dibiarkan ×1
- **app/(dashboard)/tools/alter-ego/page.tsx**
  - animate-pulse — animate-pulse: dekoratif atau skeleton? dibiarkan ×1
  - backdrop-blur-xl — backdrop-blur bukan pada kartu (header/overlay?); dibiarkan ×1
- **app/(dashboard)/tools/lexicon-search/page.tsx**
  - animate-pulse — animate-pulse: dekoratif atau skeleton? dibiarkan ×1
- **app/(dashboard)/tools/paraphrase/page.tsx**
  - bg-gradient-to-r — gradasi tanpa warna palet (token/transparan); periksa fungsinya (mis. fade) ×1
- **app/(dashboard)/tools/story-quiz/page.tsx**
  - animate-pulse — animate-pulse: dekoratif atau skeleton? dibiarkan ×1
  - bg-gradient-to-r — gradasi tanpa warna palet (token/transparan); periksa fungsinya (mis. fade) ×1
- **app/(dashboard)/tools/tone-analyzer/page.tsx**
  - bg-gradient-to-r — gradasi tanpa warna palet (token/transparan); periksa fungsinya (mis. fade) ×1
- **app/(dashboard)/translation-workshop/page.tsx**
  - bg-gradient-to-r — gradasi tanpa warna palet (token/transparan); periksa fungsinya (mis. fade) ×2
- **app/(dashboard)/vocabulary/review/page.tsx**
  - animate-pulse — animate-pulse: dekoratif atau skeleton? dibiarkan ×2
- **app/page.tsx**
  - backdrop-blur-sm — backdrop-blur bukan pada kartu (header/overlay?); dibiarkan ×1
- **components/clubs/CreateClubModal.tsx**
  - backdrop-blur-sm — backdrop-blur bukan pada kartu (header/overlay?); dibiarkan ×1
- **components/lingowise/LingoWiseClient.tsx**
  - bg-gradient-to-r — gradasi tanpa warna palet (token/transparan); periksa fungsinya (mis. fade) ×1
  - animate-pulse — animate-pulse: dekoratif atau skeleton? dibiarkan ×2
- **components/MobileBottomNav.tsx**
  - backdrop-blur-xl — backdrop-blur bukan pada kartu (header/overlay?); dibiarkan ×1
- **components/PronunciationLab.tsx**
  - animate-pulse — animate-pulse: dekoratif atau skeleton? dibiarkan ×1
- **components/reader/ReadingCompanionSidebar.tsx**
  - animate-pulse — animate-pulse: dekoratif atau skeleton? dibiarkan ×1
- **components/reader/TextDisplay.tsx**
  - backdrop-blur-xl — backdrop-blur bukan pada kartu (header/overlay?); dibiarkan ×3
  - animate-pulse — animate-pulse: dekoratif atau skeleton? dibiarkan ×3
- **components/reader/VocabFlashcardModal.tsx**
  - backdrop-blur-sm — backdrop-blur bukan pada kartu (header/overlay?); dibiarkan ×1
  - animate-pulse — animate-pulse: dekoratif atau skeleton? dibiarkan ×1
  - backdrop-blur-md — backdrop-blur bukan pada kartu (header/overlay?); dibiarkan ×1
- **components/reader/WordLookupSidebar.tsx**
  - animate-pulse — animate-pulse: dekoratif atau skeleton? dibiarkan ×2
  - backdrop-blur-xl — backdrop-blur bukan pada kartu (header/overlay?); dibiarkan ×1
- **components/Sidebar.tsx**
  - backdrop-blur-2xl — backdrop-blur bukan pada kartu (header/overlay?); dibiarkan ×1
- **components/ui/primitives.tsx**
  - animate-pulse — animate-pulse: dekoratif atau skeleton? dibiarkan ×1

## Info: kelas palet netral (slate/gray/zinc/neutral/stone) — tidak diubah

- components/admin/RoleDropdown.tsx: 4
- app/(dashboard)/english-lab/slang-decoder/page.tsx: 3
- components/reader/TextDisplay.tsx: 2
- components/reader/CulturalTextRenderer.tsx: 1
