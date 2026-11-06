"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin/content", label: "Teks & Grammar", exact: true },
  { href: "/admin/content/exercises", label: "Latihan" },
  { href: "/admin/content/course", label: "Kursus" },
  { href: "/admin/content/phrases", label: "Frasa" },
  { href: "/admin/content/modules", label: "Modul" },
];

/** Sub-tab di dalam tab Konten: Teks & Grammar | Latihan (Fase 15) | Kursus (Fase 16). */
export default function ContentSubnav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Bagian Konten" className="flex flex-wrap gap-2 mb-6">
      {ITEMS.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center min-h-[44px] px-4 rounded-full text-sm font-bold border ${
              active ? "bg-brand-solid text-on-brand border-brand" : "bg-card text-muted-foreground border-border hover:bg-muted"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
