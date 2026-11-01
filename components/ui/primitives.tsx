// components/ui/primitives.tsx
// Komponen dasar sistem desain v4 ("perpustakaan akademis", docs/v4/DESIGN.md §7). Semua memakai token di
// app/globals.css (brand-solid, card, border, rule, muted, danger, radius-control, radius-card) agar konsisten
// di tema terang/gelap. Props tidak berubah dari v2; hanya gaya.

import Link from "next/link";
import { Loader2 } from "lucide-react";

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// ---------- Button ----------

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-brand-solid text-on-brand hover:bg-brand-hover",
  secondary: "bg-card text-foreground border border-[#d8d0be] dark:border-border hover:bg-muted",
  ghost: "text-muted-foreground hover:text-foreground hover:bg-muted",
  danger: "bg-danger/10 text-danger hover:bg-danger/20",
};

export function buttonClasses(variant: ButtonVariant = "primary", className?: string) {
  return cx(
    "inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-control text-sm font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none",
    BUTTON_VARIANTS[variant],
    className
  );
}

export function Button({
  variant = "primary",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; loading?: boolean }) {
  return (
    <button className={buttonClasses(variant, className)} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={buttonClasses(variant, className)}>
      {children}
    </Link>
  );
}

// ---------- Card ----------

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx("bg-card border border-border rounded-card p-5 md:p-7", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ icon, children, action }: { icon?: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <h2 className="font-serif text-lg md:text-xl font-medium leading-tight text-foreground flex items-center gap-2">
        {icon}
        {children}
      </h2>
      {action}
    </div>
  );
}

// ---------- Eyebrow & SectionHeading (gaya katalog) ----------

/** Label kapital kecil di atas judul, mis. "LANGKAH BERIKUTNYA" atau "RUANG I". `active` = hijau tua. */
export function Eyebrow({ children, active = false, className }: { children: React.ReactNode; active?: boolean; className?: string }) {
  return (
    <p
      className={cx(
        "text-[11px] md:text-xs font-bold uppercase tracking-[0.14em] leading-tight",
        active ? "text-brand-ink" : "text-muted-foreground",
        className
      )}
    >
      {children}
    </p>
  );
}

/** Judul bagian seperti bab buku (h2 serif) dengan aksi opsional di kanan, mis. "Rak bacaan →". */
export function SectionHeading({ children, action, className }: { children: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cx("flex items-end justify-between gap-3 mb-4", className)}>
      <h2 className="font-serif text-[22px] md:text-[26px] font-medium leading-[1.2] text-foreground">{children}</h2>
      {action && <div className="shrink-0 text-sm min-h-[44px] flex items-center">{action}</div>}
    </div>
  );
}

/** Sampul sederhana untuk rak bacaan: persegi panjang tenang dengan "punggung buku" di kiri. */
export function BookSpine({ title, subtitle, className }: { title: string; subtitle?: string; className?: string }) {
  return (
    <div
      className={cx(
        "relative w-24 aspect-[2/3] shrink-0 overflow-hidden rounded-r-md rounded-l-sm border border-border bg-brand-tint text-brand-ink flex flex-col justify-between p-2 pl-4",
        "before:absolute before:inset-y-0 before:left-0 before:w-2.5 before:bg-brand-solid/25 before:shadow-[inset_-1px_0_0_rgba(0,0,0,0.12)]",
        className
      )}
    >
      <span className="font-serif text-[13px] leading-tight font-medium line-clamp-4">{title}</span>
      {subtitle && <span className="text-[10px] font-bold uppercase tracking-[0.12em] line-clamp-2">{subtitle}</span>}
    </div>
  );
}

// ---------- Input ----------

export const inputClasses =
  "w-full min-h-[44px] bg-card border border-[#d8d0be] dark:border-border rounded-control px-3 py-2.5 text-base md:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-solid focus:ring-2 focus:ring-brand-solid/25";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(inputClasses, className)} {...props} />;
}

// ---------- Badge ----------

export function Badge({ children, tone = "brand" }: { children: React.ReactNode; tone?: "brand" | "muted" | "danger" }) {
  const tones = {
    brand: "bg-brand-tint text-brand-ink",
    muted: "bg-muted text-muted-foreground",
    danger: "bg-danger-tint text-danger",
  };
  return (
    <span className={cx("inline-flex items-center text-[11px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded", tones[tone])}>
      {children}
    </span>
  );
}

// ---------- ProgressBar ----------

/** Bilah progres tipis: jalur `rule`, isi `brand`. `value` 0–100. */
export function ProgressBar({ value, label, className }: { value: number; label?: string; className?: string }) {
  const pct = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={cx("h-1 w-full overflow-hidden rounded-full bg-rule", className)}
    >
      <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
    </div>
  );
}

// ---------- EmptyState ----------

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center py-8 px-4">
      {icon && <div className="text-muted-foreground mb-3">{icon}</div>}
      <p className="font-serif text-lg font-medium text-foreground">{title}</p>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ---------- Skeleton ----------

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-control bg-muted", className)} />;
}
