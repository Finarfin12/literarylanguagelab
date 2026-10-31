"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { MENU_GROUPS } from "@/lib/menu-config";
import { User, Settings, LogOut, ChevronRight, ChevronDown, HelpCircle, MessageSquare, Sun, Moon, Search, Home, ShieldAlert } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import AnimatedPage from "@/components/AnimatedPage";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

// Halaman inti yang di desktop ada di Sidebar, bukan di MENU_GROUPS
const CORE_GROUP = {
  title: "Utama",
  icon: Home,
  color: "text-brand",
  items: [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Text Library", path: "/library" },
    { name: "Public Domain Books", path: "/gutenberg" },
    { name: "A-Z Dictionary", path: "/tools/a-z-dictionary" },
    { name: "All Toolkits Hub", path: "/tools" },
    { name: "LingoWise AI", path: "/lingowise" },
    { name: "Pesan", path: "/messages" },
    { name: "Profil", path: "/profile" },
  ],
};

const ADMIN_GROUP = {
  title: "Admin",
  icon: ShieldAlert,
  color: "text-red-500",
  items: [
    { name: "Pengguna", path: "/admin/users" },
    { name: "Provider AI", path: "/admin/providers" },
    { name: "Model", path: "/admin/models" },
    { name: "Routing Fitur", path: "/admin/routing" },
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
  const groups = [CORE_GROUP, ...MENU_GROUPS, ...(isAdmin ? [ADMIN_GROUP] : [])]
    .map((g) => ({
      ...g,
      items: searching
        ? g.items.filter((i) => i.name.toLowerCase().includes(q) || g.title.toLowerCase().includes(q))
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
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-card animate-in zoom-in">
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
          placeholder="Cari fitur, mis. OCR, flashcard, forum..."
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
          const isOpen = searching || !collapsed[group.title];
          return (
            <div key={group.title} className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => setCollapsed((c) => ({ ...c, [group.title]: !c[group.title] }))}
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
                      className="flex items-center justify-between px-5 min-h-[48px] hover:bg-muted transition-colors group"
                    >
                      <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                        {item.name}
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
          <span className="text-xs">Settings</span>
        </Link>
        <Link href="/help" className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-border bg-card text-foreground font-medium hover:bg-muted transition-colors">
          <HelpCircle className="w-5 h-5" />
          <span className="text-xs">Bantuan</span>
        </Link>
        <button 
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-border bg-card text-foreground font-medium hover:bg-muted transition-colors"
        >
          {mounted ? (theme === "dark" ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-blue-500" />) : <Moon className="w-5 h-5" />}
          <span className="text-xs">Tema</span>
        </button>
        <button 
          onClick={handleSignOut}
          className="flex items-center justify-center gap-2 p-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-500 font-medium hover:bg-rose-500 hover:text-white transition-colors col-span-3"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </AnimatedPage>
  );
}
