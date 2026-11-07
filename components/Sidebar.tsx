"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { createClient } from "@/utils/supabase/client";
import { 
  ChevronDown, ChevronRight, LogOut, 
  Sun, Moon, Sparkles, User, Settings, Library, BookOpen, BookA,
  Menu, PanelLeftClose, LayoutDashboard, ShieldAlert, BrainCircuit, MessageSquareText, Search
} from "lucide-react";
import { MENU_GROUPS } from "@/lib/menu-config";
import { ROOMS, isPathVisible, resolveItem } from "@/lib/rooms";
import { useCourseVisible, useStudyVisible } from "@/components/CourseVisibility";
import WotdCard from "@/components/wotd/WotdCard";
import { openFeatureSearch } from "@/components/FeatureSearch";

// Pintasan utama (PINNED_PATHS di lib/menu-config.ts): Text Library, Baca Buku, Kamus A-Z
const PINNED_LINKS = [
  { href: "/gutenberg", label: "Baca Buku", icon: BookOpen },
  { href: "/tools/a-z-dictionary", label: "Kamus A-Z", icon: BookA },
  { href: "/library", label: "Text Library", icon: Library },
];

interface SidebarProps {
  userEmail?: string;
  userName?: string;
  userAvatar?: string;
}

export default function Sidebar({ userEmail, userName, userAvatar }: SidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const courseVisible = useCourseVisible();
  const studyVisible = useStudyVisible();
  const supabase = createClient();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [localAvatar, setLocalAvatar] = useState(userAvatar);
  const [localName, setLocalName] = useState(userName);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Auto-close sidebar on mobile, open on desktop
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setLocalAvatar(user.user_metadata?.avatar_url);
      setLocalName(user.user_metadata?.full_name);
      
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile?.role === 'admin') {
        setIsAdmin(true);
      }
    }
    loadProfile();
  }, []);

  // Auto-close sidebar on mobile after navigation
  useEffect(() => {
    if (isMobile) setIsSidebarOpen(false);
  }, [pathname, isMobile]);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const menu = MENU_GROUPS.flatMap((g) => g.items);
  const toggleGroup = (slug: string, currentlyOpen: boolean) => {
    setOpenGroups((prev) => ({ ...prev, [slug]: !currentlyOpen }));
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="hidden lg:flex fixed top-6 left-6 z-50 p-2.5 bg-card shadow-sm border border-border rounded-control shadow-lg hover:bg-muted transition-colors group"
          title="Buka Menu"
        >
          <Menu className="w-5 h-5 text-foreground group-hover:text-brand-ink transition-colors" />
        </button>
      )}

      <aside className={`hidden lg:flex transition-all duration-300 ease-in-out border-r border-border bg-muted flex-col relative z-40 h-full ${
        isSidebarOpen ? "w-72 translate-x-0" : "w-0 -translate-x-full opacity-0 overflow-hidden border-none"
      }`}>
        <div className="p-6 shrink-0 flex items-center justify-between">
          <h2 className="text-2xl font-serif font-medium text-brand-ink flex items-center gap-2 whitespace-nowrap">
            <BrainCircuit className="w-6 h-6" />
            Literary Lab
          </h2>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 bg-muted rounded-control hover:bg-muted transition-colors text-muted-foreground hover:text-danger"
              title="Tutup Menu"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 bg-muted rounded-control hover:bg-muted transition-colors text-muted-foreground hover:text-brand-ink"
            >
              {mounted ? (theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />) : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

      <div className="px-6 mb-4">
        <WotdCard />
      </div>

      <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
        <div className="space-y-2 pb-8">

          {/* Pencarian fitur (Ctrl+K) */}
          <button
            type="button"
            onClick={openFeatureSearch}
            className="w-full flex items-center gap-3 px-4 min-h-[48px] rounded-control border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"
          >
            <Search className="w-5 h-5" aria-hidden="true" />
            <span className="font-semibold flex-1 text-left">Cari fitur</span>
            <kbd className="text-[11px] border border-border rounded px-1.5 py-0.5">Ctrl K</kbd>
          </button>

          {/* Beranda */}
          <Link
            href="/dashboard"
            aria-current={pathname === "/dashboard" ? "page" : undefined}
            className={`w-full flex items-center gap-3 px-4 min-h-[48px] rounded-control transition-colors ${
              pathname === "/dashboard" ? "bg-brand-tint text-brand-ink" : "text-foreground hover:bg-card"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" aria-hidden="true" />
            <span className="font-semibold">Beranda</span>
          </Link>

          {/* Fitur utama yang paling sering dipakai: selalu di atas, tepat di bawah Beranda */}
          {PINNED_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`w-full flex items-center gap-3 px-4 min-h-[48px] rounded-control transition-colors ${
                  active ? "bg-brand-tint text-brand-ink" : "text-foreground hover:bg-card"
                }`}
              >
                <Icon className="w-5 h-5" aria-hidden="true" />
                <span className="font-semibold">{label}</span>
              </Link>
            );
          })}

          <p className="px-4 pt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Ruang belajar</p>

          {ROOMS.map((room) => {
            const paths = Array.from(new Set(room.sections.flatMap((s) => s.paths))).filter((p) => isPathVisible(p, courseVisible, studyVisible));
            const isRoomActive = pathname === `/ruang/${room.slug}`;
            const hasActiveChild = paths.some((p) => pathname === p);
            const isOpen = openGroups[room.slug] ?? (isRoomActive || hasActiveChild);
            return (
              <div key={room.slug}>
                <div className="flex items-stretch">
                  <Link
                    href={`/ruang/${room.slug}`}
                    aria-current={isRoomActive ? "page" : undefined}
                    className={`flex-1 min-w-0 flex flex-col justify-center px-4 min-h-[48px] rounded-control transition-colors ${
                      isRoomActive ? "bg-brand-tint" : "hover:bg-card"
                    }`}
                  >
                    <span className={`text-[11px] font-bold uppercase tracking-[0.14em] ${isRoomActive ? "text-brand-ink" : "text-muted-foreground"}`}>{room.eyebrow}</span>
                    <span className={`font-serif text-base leading-tight ${hasActiveChild || isRoomActive ? "text-foreground font-medium" : "text-foreground"}`}>{room.title}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleGroup(room.slug, isOpen)}
                    aria-expanded={isOpen}
                    aria-label={`${isOpen ? "Ciutkan" : "Buka"} daftar alat ${room.title}`}
                    className="w-11 shrink-0 flex items-center justify-center text-muted-foreground hover:text-foreground"
                  >
                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>

                {isOpen && (
                  <div className="ml-4 pl-3 border-l border-border space-y-0.5 mb-2">
                    {paths.map((p) => {
                      const item = resolveItem(p, menu);
                      const isActive = pathname === item.path;
                      return (
                        <Link
                          key={p}
                          href={item.path}
                          aria-current={isActive ? "page" : undefined}
                          className={`block text-sm py-2 px-3 rounded-control transition-colors ${
                            isActive ? "bg-brand-tint text-brand-ink font-semibold" : "text-muted-foreground hover:bg-card hover:text-foreground"
                          }`}
                        >
                          {item.name}
                          {item.description && <span className="block text-xs font-normal text-muted-foreground leading-snug">{item.description}</span>}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <p className="px-4 pt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Pintasan</p>

          {/* Pintu masuk LingoWise AI (juga ada di Ruang II) */}
          <Link
            href="/lingowise"
            aria-current={pathname.startsWith("/lingowise") ? "page" : undefined}
            className={`w-full flex items-center gap-3 px-4 py-2.5 min-h-[48px] rounded-control transition-colors ${
              pathname.startsWith("/lingowise") ? "bg-brand-tint" : "hover:bg-card"
            }`}
          >
            <MessageSquareText className="w-5 h-5 text-brand-ink" aria-hidden="true" />
            <span className="flex flex-col">
              <span className="font-semibold text-foreground">LingoWise AI</span>
              <span className="text-xs font-normal text-muted-foreground leading-snug">Tanya AI soal bahasa dan sastra.</span>
            </span>
          </Link>

          {/* Semua alat (Toolkits Hub) */}
          <Link
            href="/tools"
            aria-current={pathname === "/tools" ? "page" : undefined}
            className={`w-full flex items-center gap-3 px-4 min-h-[48px] rounded-control transition-colors ${
              pathname === "/tools" ? "bg-brand-tint text-brand-ink" : "text-foreground hover:bg-card"
            }`}
          >
            <Sparkles className="w-5 h-5" aria-hidden="true" />
            <span className="font-semibold">Semua alat</span>
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              aria-current={pathname.startsWith("/admin") ? "page" : undefined}
              className={`w-full flex items-center gap-3 px-4 min-h-[48px] rounded-control transition-colors ${
                pathname.startsWith("/admin") ? "bg-danger-tint" : "hover:bg-card"
              }`}
            >
              <ShieldAlert className="w-5 h-5 text-danger" aria-hidden="true" />
              <span className="font-semibold text-foreground">Admin Panel</span>
            </Link>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-border shrink-0 bg-background flex items-center justify-between gap-2">
        <Link href="/profile" className="flex items-center gap-3 hover:bg-muted p-2 rounded-control transition-colors flex-1 overflow-hidden group">
          {localAvatar ? (
            <img src={localAvatar} alt="User Avatar" className="w-10 h-10 rounded-full object-cover border border-foreground/10" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-brand-tint border border-brand/20 flex items-center justify-center text-brand-ink font-bold text-lg">
              {localName?.charAt(0) || "U"}
            </div>
          )}
          
          <div className="flex flex-col text-left overflow-hidden">
            <span className="font-bold text-foreground text-sm truncate">{localName || "Pengguna"}</span>
            <span className="text-xs text-muted-foreground truncate">{userEmail}</span>
          </div>
        </Link>
        <div className="shrink-0 flex items-center">
          <Link href="/settings" className="p-2 rounded-control text-muted-foreground hover:text-brand-ink hover:bg-brand-tint transition-colors" title="Settings">
            <Settings className="w-4 h-4" />
          </Link>
          <form action="/auth/signout" method="post" className="m-0 p-0 flex">
            <button type="submit" className="p-2 rounded-control text-muted-foreground hover:text-danger hover:bg-danger-tint transition-colors" title="Sign Out">
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
    </>
  );
}
