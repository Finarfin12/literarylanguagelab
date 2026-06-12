"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { MENU_GROUPS } from "@/lib/menu-config";
import { User, Settings, LogOut, ChevronRight, HelpCircle, MessageSquare, Sun, Moon } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import AnimatedPage from "@/components/AnimatedPage";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

export default function MobileMenuPage() {
  const [userProfile, setUserProfile] = useState<any>(null);
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
      }
    }
    loadUser();
  }, [supabase]);

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

      {/* Accordion Menu List */}
      <div className="space-y-6">
        {MENU_GROUPS.map((group) => {
          const Icon = group.icon;
          return (
            <div key={group.title} className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-border/50 bg-muted/20 flex items-center gap-3">
                <Icon className={`w-5 h-5 ${group.color}`} />
                <h3 className="font-bold font-serif text-foreground">{group.title}</h3>
              </div>
              <div className="divide-y divide-border/50">
                {group.items.map((item) => (
                  <Link 
                    key={item.name} 
                    href={item.path}
                    className="flex items-center justify-between px-5 py-4 hover:bg-muted transition-colors group"
                  >
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      {item.name}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
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
