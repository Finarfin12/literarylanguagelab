"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, BookA, PenLine, Menu } from "lucide-react";

// Bottom nav v4 (keputusan pemilik, 1 Nov 2026): Beranda · Kamus · Baca Buku · Grammar · Menu.
// Kosakata, Ruang, Library, dan semua alat lain tetap terjangkau lewat Beranda dan Menu (Menu aktif untuk halaman di luar empat tab lain).
// `match` menentukan halaman mana yang menyalakan tab tersebut.
const NAV_ITEMS = [
  { name: "Beranda", path: "/dashboard", icon: LayoutDashboard, match: ["/dashboard"] },
  { name: "Kamus", path: "/tools/a-z-dictionary", icon: BookA, match: ["/tools/a-z-dictionary"] },
  { name: "Baca Buku", path: "/gutenberg", icon: BookOpen, match: ["/gutenberg", "/library", "/read", "/preview"] },
  { name: "Grammar", path: "/english-lab/grammar", icon: PenLine, match: ["/english-lab/grammar"] },
  { name: "Menu", path: "/menu", icon: Menu, match: ["/menu"] },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  // Halaman di luar keempat tab pertama (Kosakata, Ruang, alat, profil, dll.) menyalakan Menu
  const matchedOther = NAV_ITEMS.slice(0, -1).some((i) => i.match.some((p) => pathname.startsWith(p)));

  return (
    <nav
      aria-label="Navigasi utama"
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-xl border-t border-border z-50 px-1 pt-1 flex justify-around items-center safe-area-pb"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = item.path === "/menu" ? !matchedOther : item.match.some((p) => pathname.startsWith(p));
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
