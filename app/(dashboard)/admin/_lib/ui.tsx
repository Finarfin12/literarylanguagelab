// Komponen kecil yang dipakai bersama oleh tab-tab admin AI.

import { AlertTriangle } from "lucide-react";

export const inputClass =
  "w-full bg-foreground/5 border border-foreground/10 rounded-control px-3 py-2.5 text-sm focus:outline-none focus:border-brand";
export const buttonClass =
  "inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-control text-sm font-bold transition-colors disabled:opacity-50";

export function AdminPageHeader({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="p-3 bg-brand-tint rounded-control text-brand-ink shrink-0">{icon}</div>
      <div>
        <h1 className="text-[28px] md:text-4xl leading-[1.15] font-serif font-medium text-foreground">{title}</h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">{description}</p>
      </div>
    </div>
  );
}

export function Notice({ children, tone = "warning" }: { children: React.ReactNode; tone?: "warning" | "error" }) {
  const color = tone === "error" ? "border-danger/30 bg-danger-tint text-danger" : "border-warning-ink/30 bg-warning-tint text-warning-ink ";
  return (
    <div className={`flex gap-3 items-start border rounded-control p-4 text-sm mb-6 ${color}`}>
      <AlertTriangle className="w-5 h-5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

/** Pesan jika tabel registry belum ada (migrasi 0003 belum dijalankan). */
export function MissingMigrationNotice({ message }: { message: string }) {
  return (
    <Notice tone="error">
      <p className="font-bold">Registry AI belum siap.</p>
      <p>
        Jalankan <code>supabase/migrations/0003_ai_registry.sql</code> di Supabase SQL Editor. Sementara itu semua fitur AI tetap
        memakai <code>GROQ_API_KEY</code>. Detail: {message}
      </p>
    </Notice>
  );
}

/** Pesan umum jika sebuah migrasi belum dijalankan (pola fallback v2/v3). */
export function MigrationNotice({ file, message }: { file: string; message?: string }) {
  return (
    <Notice tone="error">
      <p className="font-bold">Migrasi belum dijalankan.</p>
      <p>
        Jalankan <code>supabase/migrations/{file}</code> di Supabase SQL Editor agar fitur ini aktif.
        {message ? ` Detail: ${message}` : ""}
      </p>
    </Notice>
  );
}
