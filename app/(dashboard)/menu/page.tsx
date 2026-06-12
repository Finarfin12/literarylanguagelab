"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MENU_GROUPS } from "@/lib/menu-config";
import { User, Settings, LogOut, ChevronRight } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import AnimatedPage from "@/components/AnimatedPage";

export default function MobileMenuPage() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const supabase = createClient();

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
            <h2 className="font-bold text-lg text-foreground leading-tight">
              {userProfile?.name || "Loading..."}
            </h2>
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
      <div className="mt-8 grid grid-cols-2 gap-4">
        <Link href="/settings" className="flex items-center justify-center gap-2 p-4 rounded-2xl border border-border bg-card text-foreground font-medium hover:bg-muted transition-colors">
          <Settings className="w-4 h-4" />
          Settings
        </Link>
        <button 
          onClick={handleSignOut}
          className="flex items-center justify-center gap-2 p-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 text-rose-500 font-medium hover:bg-rose-500 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </AnimatedPage>
  );
}
