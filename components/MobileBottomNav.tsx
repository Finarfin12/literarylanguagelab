"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Library, BookOpen, Sparkles, User, Menu } from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();

  const NAV_ITEMS = [
    { name: "Home", path: "/dashboard", icon: LayoutDashboard },
    { name: "Library", path: "/library", icon: Library },
    { name: "Books", path: "/gutenberg", icon: BookOpen },
    { name: "Tools", path: "/tools", icon: Sparkles },
    { name: "Menu", path: "/menu", icon: Menu },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border z-50 px-2 py-2 flex justify-between items-center safe-area-pb">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.path);
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.path}
            className={`flex flex-col items-center justify-center w-16 h-12 rounded-xl transition-all ${
              isActive ? "text-brand" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className={`w-5 h-5 mb-1 ${isActive ? "fill-brand/20" : ""}`} />
            <span className="text-[10px] font-medium">{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
