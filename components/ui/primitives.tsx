// components/ui/primitives.tsx
// Komponen dasar sistem desain v2. Semua memakai token di app/globals.css
// (brand, card, border, muted, danger, radius-control, radius-card) agar konsisten di tema terang/gelap.

import Link from "next/link";
import { Loader2 } from "lucide-react";

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// ---------- Button ----------

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-brand text-background hover:bg-brand-hover",
  secondary: "bg-muted text-foreground border border-border hover:bg-muted/70",
  ghost: "text-muted-foreground hover:text-foreground hover:bg-muted",
  danger: "bg-danger/10 text-danger hover:bg-danger/20",
};

export function buttonClasses(variant: ButtonVariant = "primary", className?: string) {
  return cx(
    "inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-control text-sm font-bold transition-colors disabled:opacity-50 disabled:pointer-events-none",
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
    <div className={cx("bg-card border border-border rounded-card p-4 md:p-6 shadow-sm", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ icon, children, action }: { icon?: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <h2 className="text-base md:text-lg font-bold text-foreground flex items-center gap-2">
        {icon}
        {children}
      </h2>
      {action}
    </div>
  );
}

// ---------- Input ----------

export const inputClasses =
  "w-full min-h-[44px] bg-foreground/5 border border-foreground/10 rounded-control px-3 py-2.5 text-base md:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(inputClasses, className)} {...props} />;
}

// ---------- Badge ----------

export function Badge({ children, tone = "brand" }: { children: React.ReactNode; tone?: "brand" | "muted" | "danger" }) {
  const tones = {
    brand: "bg-brand/10 text-brand",
    muted: "bg-muted text-muted-foreground",
    danger: "bg-danger/10 text-danger",
  };
  return (
    <span className={cx("inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded", tones[tone])}>
      {children}
    </span>
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
      <p className="font-bold text-foreground">{title}</p>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ---------- Skeleton ----------

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("animate-pulse rounded-control bg-muted", className)} />;
}
