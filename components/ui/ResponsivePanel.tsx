"use client";

// Panel yang tampil sebagai panel samping di layar ≥ lg (1024px) dan sebagai
// bottom sheet di layar lebih kecil. Dipakai oleh sidebar reader (Word Lookup,
// Sentence Analysis, Bookmark) agar semua fitur nyaman dipakai dari HP.

import { useEffect } from "react";

export default function ResponsivePanel({
  open,
  onClose,
  label,
  width = "400px",
  desktop = "fixed",
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** Nama panel untuk pembaca layar */
  label: string;
  /** Lebar panel di layar ≥ lg */
  width?: string;
  /** "absolute" jika panel menempel di dalam kontainer reader yang relative */
  desktop?: "fixed" | "absolute";
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const desktopPosition = desktop === "absolute" ? "lg:absolute" : "lg:fixed";

  return (
    <>
      {/* Latar gelap hanya di mobile; ketuk untuk menutup */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`lg:hidden fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      />
      <aside
        role="dialog"
        aria-label={label}
        aria-hidden={!open}
        style={{ "--panel-w": width } as React.CSSProperties}
        className={`fixed inset-x-0 bottom-0 h-[85dvh] rounded-t-3xl border-t z-[70]
          ${desktopPosition} lg:inset-auto lg:top-0 lg:right-0 lg:bottom-auto lg:h-full lg:w-[var(--panel-w)] lg:rounded-none lg:border-t-0 lg:border-l lg:z-50
          bg-background border-border flex flex-col overflow-hidden
          shadow-[0_-10px_50px_rgba(0,0,0,0.35)] lg:shadow-[0_0_50px_rgba(0,0,0,0.35)]
          transform transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
          ${open ? "translate-y-0 lg:translate-x-0" : "translate-y-full lg:translate-y-0 lg:translate-x-full"}`}
      >
        {/* Pegangan bottom sheet */}
        <div className="lg:hidden flex justify-center pt-2 pb-1 shrink-0">
          <span className="w-10 h-1.5 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">{open && children}</div>
      </aside>
    </>
  );
}
