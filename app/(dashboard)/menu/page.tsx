"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { MENU_GROUPS, type MenuGroup } from "@/lib/menu-config";
import { ROOMS, resolveItem } from "@/lib/rooms";
import { User, Settings, LogOut, ChevronRight, ChevronDown, HelpCircle, MessageSquare, Sun, Moon, Search, Home, ShieldAlert, GraduationCap, BookOpen, Languages, BookMarked, Users, type LucideIcon } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import AnimatedPage from "@/components/AnimatedPage";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

// Halaman inti yang tidak termasuk grup tujuan belajar
const CORE_GROUP: MenuGroup = {
  title: "Utama",
  icon: Home,
  color: "text-brand",
  items: [
    { name: "Beranda", path: "/dashboard", description: "Langkah berikutnya dan ringkasan belajarmu." },
    { name: "Ruang belajar", path: "/ruang", description: "Tiga ruang belajar, Koleksi saya, dan Komunitas." },
    { name: "Semua Alat", path: "/tools", description: "Daftar lengkap alat bantu belajar." },
    { name: "LingoWise AI", path: "/lingowise", description: "Asisten AI untuk bertanya soal bahasa dan sastra." },
    { name: "Pesan", path: "/messages", description: "Kotak masuk pesan dari pengguna lain." },
    { name: "Profil", path: "/profile", description: "Profil dan progres belajarmu." },
  ],
};

const ROOM_ICONS: Record<string, LucideIcon> = {
  "belajar-dasar": GraduationCap,
  "baca-sastra": BookOpen,
  terjemah: Languages,
  koleksi: BookMarked,
  komunitas: Users,
};

/** Ruang → grup menu HP (semua item, urutan ruang). Pencarian mencari di semua grup ini. */
function roomGroups(): MenuGroup[] {
  const menu = MENU_GROUPS.flatMap((g) => g.items);
  return ROOMS.map((room) => ({
    title: `${room.eyebrow === room.title ? "" : room.eyebrow + " · "}${room.title}`,
    icon: ROOM_ICONS[room.slug] ?? Home,
    color: "text-foreground",
    items: Array.from(new Set(room.sections.flatMap((s) => s.paths))).map((p) => resolveItem(p, menu)),
  }));
}

const ADMIN_GROUP: MenuGroup = {
  title: "Admin",
  icon: ShieldAlert,
  color: "text-foreground",
  items: [
    { name: "Ringkasan", path: "/admin", description: "Ringkasan penggunaan aplikasi." },
    { name: "Pengguna", path: "/admin/users", description: "Kelola akun pengguna." },
    { name: "Provider AI", path: "/admin/providers", description: "Tambah dan atur penyedia AI." },
    { name: "Model", path: "/admin/models", description: "Daftar model AI yang tersedia." },
    { name: "Routing Fitur", path: "/admin/routing", description: "Pilih model untuk tiap fitur." },
    { name: "Pemakaian & Kuota", path: "/admin/usage", description: "Pantau pemakaian dan batas kuota." },
    { name: "Konten", path: "/admin/content", description: "Level teks, teks berjenjang, dan topik grammar." },
    { name: "Fitur", path: "/admin/features", description: "Nyalakan atau matikan fitur." },
    { name: "Audit Log", path: "/admin/audit", description: "Catatan tindakan admin." },
  ],
};

export default function MobileMenuPage() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const supabase = createClient();
  const unreadMessages = useUnreadMessages();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserProfile({
          email: user.email,
          name: user.user_metadata?.full_name || "Reader",
          avatar: user.user_metadata?.avatar_url,
        });
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
        setIsAdmin(profile?.role === "admin");
      }
    }
    loadUser();
  }, [supabase]);

  const searching = query.trim().length > 0;
  const q = query.trim().toLowerCase();
  const groups = [CORE_GROUP, ...roomGroups(), ...(isAdmin ? [ADMIN_GROUP] : [])]
    .map((g) => ({
      ...g,
      items: searching
        ? g.items.filter((i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q) || g.title.toLowerCase().includes(q))
        : g.items,
    }))
    .filter((g) => g.items.length > 0);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <AnimatedPage className="pb-24 pt-4 px-4 bg-background min-h-screen">
      {/* Profile Header section */}
      <div className="bg-card border border-border rounded-3xl p-5 mb-8 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-brand/10 border-2 border-brand/20 overflow-hidden flex items-center justify-center shrink-0">
            {userProfile?.avatar ? (
              <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-6 h-6 text-brand" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg text-foreground leading-tight">
                {userProfile?.name || "Loading..."}
              </h2>
              <Link
                href="/messages"
                className="relative flex items-center justify-center w-8 h-8 bg-muted rounded-full text-muted-foreground hover:text-brand hover:bg-brand/10 transition-colors"
                title="Inbox Pesan"
              >
                <MessageSquare className="w-4 h-4" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-on-brand shadow-sm ring-2 ring-card animate-in zoom-in">
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </span>
                )}
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              {userProfile?.email || "..."}
            </p>
          </div>
        </div>
        
        <Link href="/profile" className="p-3 bg-muted rounded-full text-foreground hover:bg-brand/10 hover:text-brand transition-colors">
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>

      {/* Pencarian fitur */}
      <div className="relative mb-6">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari fitur, mis. OCR, kosakata, forum..."
          aria-label="Cari fitur"
          className="w-full min-h-[48px] pl-11 pr-4 bg-card border border-border rounded-2xl text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand"
        />
      </div>

      {/* Accordion Menu List */}
      <div className="space-y-4">
        {groups.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">Tidak ada fitur yang cocok dengan &quot;{query}&quot;.</p>
        )}
        {groups.map((group) => {
          const Icon = group.icon;
          // Saat mencari, semua grup yang cocok selalu terbuka
          const isCollapsed = collapsed[group.title] ?? !!group.collapsedByDefault;
          const isOpen = searching || !isCollapsed;
          return (
            <div key={group.title} className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => setCollapsed((c) => ({ ...c, [group.title]: !(c[group.title] ?? !!group.collapsedByDefault) }))}
                aria-expanded={isOpen}
                className="w-full px-5 min-h-[56px] bg-muted/20 flex items-center gap-3 text-left"
              >
                <Icon className={`w-5 h-5 ${group.color}`} />
                <h3 className="font-bold font-serif text-foreground flex-1">{group.title}</h3>
                <span className="text-xs text-muted-foreground">{group.items.length}</span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="divide-y divide-border/50 border-t border-border/50">
                  {group.items.map((item) => (
                    <Link 
                      key={item.path} 
                      href={item.path}
                      className="flex items-center justify-between gap-3 px-5 min-h-[56px] hover:bg-muted transition-colors group"
                    >
                      <span className="py-2">
                        <span className="block text-sm font-medium text-foreground">{item.name}</span>
                        <span className="block text-xs text-muted-foreground leading-snug">{item.description}</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="mt-8 grid grid-cols-3 gap-3 pb-8">
        <Link href="/settings" className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-border bg-card text-foreground font-medium hover:bg-muted transition-colors">
          <Settings className="w-5 h-5" />
          <span className="text-xs">Pengaturan</span>
        </Link>
        <Link href="/help" className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-border bg-card text-foreground font-medium hover:bg-muted transition-colors">
          <HelpCircle className="w-5 h-5" />
          <span className="text-xs">Bantuan</span>
        </Link>
        <button 
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-border bg-card text-foreground font-medium hover:bg-muted transition-colors"
        >
          {mounted ? (theme === "dark" ? <Sun className="w-5 h-5 text-warning-ink" /> : <Moon className="w-5 h-5 text-brand-ink" />) : <Moon className="w-5 h-5" />}
          <span className="text-xs">Tema</span>
        </button>
        <button 
          onClick={handleSignOut}
          className="flex items-center justify-center gap-2 p-4 rounded-2xl border border-border bg-muted text-foreground font-medium hover:bg-brand-hover hover:text-white transition-colors col-span-3"
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </div>
    </AnimatedPage>
  );
}
