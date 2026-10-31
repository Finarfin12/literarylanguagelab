"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Server, Cpu, Route } from "lucide-react";

const TABS = [
  { href: "/admin/users", label: "Pengguna", icon: Users },
  { href: "/admin/providers", label: "Provider AI", icon: Server },
  { href: "/admin/models", label: "Model", icon: Cpu },
  { href: "/admin/routing", label: "Routing Fitur", icon: Route },
];

export default function AdminTabs() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b border-border">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 flex gap-1 overflow-x-auto [scrollbar-width:none]">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 px-4 min-h-[44px] text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
                active ? "border-brand text-brand" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
