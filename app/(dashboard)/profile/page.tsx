"use client";

import { useEffect, useState } from "react";
import { User, BookOpen, Clock, Activity, Loader2, Sparkles, MapPin, CalendarDays, ExternalLink } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

export default function ProfilePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ vocabCount: 0, idiomCount: 0 });

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setProfile(user);
        
        // Fetch stats
        const { count: vocabCount } = await supabase.from('vocabulary').select('*', { count: 'exact', head: true });
        const { count: idiomCount } = await supabase.from('idioms').select('*', { count: 'exact', head: true });
        
        setStats({ 
          vocabCount: vocabCount || 0, 
          idiomCount: idiomCount || 0 
        });
      }
      setLoading(false);
    }
    loadData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p>Anda belum login.</p>
      </div>
    );
  }

  const joinDate = new Date(profile.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
  const avatarUrl = profile.user_metadata?.avatar_url;
  const fullName = profile.user_metadata?.full_name || profile.email.split('@')[0];
  const aboutMe = profile.user_metadata?.about_me || "Belum ada biografi. Tambahkan di pengaturan.";

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      {/* Cover Banner */}
      <div className="h-48 w-full bg-gradient-to-r from-brand/20 via-purple-500/20 to-brand/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5 bg-[size:20px_20px]" />
      </div>

      <div className="max-w-5xl mx-auto px-8 relative -mt-20 pb-12">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6 mb-12">
          <div className="w-40 h-40 rounded-full border-4 border-background bg-white/5 overflow-hidden shrink-0 shadow-2xl relative">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 mb-2">
            <h1 className="text-4xl font-serif font-bold text-foreground">{fullName}</h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <CalendarDays className="w-4 h-4" /> Bergabung sejak {joinDate}
            </p>
          </div>
          <div className="mb-2">
            <Link href="/settings" className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors font-medium flex items-center gap-2">
              Edit Profil
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: About & Badges */}
          <div className="space-y-8">
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-brand" /> Tentang Saya
              </h2>
              <p className="text-muted-foreground leading-relaxed">{aboutMe}</p>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" /> Pencapaian
              </h2>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-brand/10 text-brand rounded-full text-xs font-bold border border-brand/20">Early Adopter</span>
                {stats.vocabCount > 10 && <span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-xs font-bold border border-purple-500/20">Vocab Explorer</span>}
              </div>
            </div>
          </div>

          {/* Right Column: Stats & Activity */}
          <div className="lg:col-span-2 space-y-8">
            
            <h2 className="text-2xl font-serif font-bold text-foreground">Statistik Pembelajaran</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-brand/10 to-transparent border border-brand/20 p-6 rounded-3xl flex items-center gap-6">
                <div className="w-14 h-14 rounded-full bg-brand/20 flex items-center justify-center shrink-0">
                  <BookOpen className="w-7 h-7 text-brand" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{stats.vocabCount}</p>
                  <p className="text-sm text-muted-foreground font-medium">Kosakata Tersimpan</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20 p-6 rounded-3xl flex items-center gap-6">
                <div className="w-14 h-14 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                  <Activity className="w-7 h-7 text-purple-400" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{stats.idiomCount}</p>
                  <p className="text-sm text-muted-foreground font-medium">Idiom Tersimpan</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl mt-8">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-muted-foreground" /> Aktivitas Terakhir
              </h3>
              <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-[11px] before:w-px before:bg-white/10">
                <div className="flex gap-4 relative">
                  <div className="w-6 h-6 rounded-full bg-brand/20 border-2 border-background flex items-center justify-center shrink-0 relative z-10">
                    <div className="w-2 h-2 rounded-full bg-brand" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Membuat Profil</p>
                    <p className="text-xs text-muted-foreground">{joinDate}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
