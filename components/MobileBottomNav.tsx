"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, BookMarked, Library, Menu } from "lucide-react";

// Bottom nav v4 (keputusan Q1): Beranda · Baca · Kosakata · Ruang · Menu. Alat tetap lewat Menu → Semua alat.
// `match` menentukan halaman mana yang menyalakan tab tersebut.
const NAV_ITEMS = [
  { name: "Beranda", path: "/dashboard", icon: LayoutDashboard, match: ["/dashboard"] },
  { name: "Baca", path: "/library", icon: BookOpen, match: ["/library", "/read", "/gutenberg", "/preview"] },
  { name: "Kosakata", path: "/vocabulary", icon: BookMarked, match: ["/vocabulary", "/review", "/idioms", "/glossary"] },
  { name: "Ruang", path: "/ruang", icon: Library, match: ["/ruang", "/tools", "/lingowise", "/english-lab", "/translation"] },
  { name: "Menu", path: "/menu", icon: Menu, match: ["/menu"] },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi utama"
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl border-t border-border z-50 px-1 pt-1 flex justify-around items-center safe-area-pb"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = item.match.some((p) => pathname.startsWith(p));
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.path}
            aria-current={isActive ? "page" : undefined}
            className={`flex flex-col items-center justify-center flex-1 min-w-0 h-14 rounded-xl transition-colors ${
              isActive ? "text-brand" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className={`w-5 h-5 mb-1 ${isActive ? "fill-brand/20" : ""}`} />
            <span className="text-[11px] font-medium">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
