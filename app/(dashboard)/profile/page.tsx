"use client";

import { useEffect, useState } from "react";
import { User, BookOpen, Clock, Activity, Loader2, Sparkles, CalendarDays, BookMarked, TrendingUp, GraduationCap } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import Link from "next/link";

export default function ProfilePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<SupabaseUser | null>(null);
  const [stats, setStats] = useState({ vocabCount: 0, idiomCount: 0, cefrLevel: "", textsCompleted: 0, reviewsThisWeek: 0, followersCount: 0, followingCount: 0 });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [badges, setBadges] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) { setLoading(false); return; }
      setProfile(user);

      const results = await Promise.allSettled([
        supabase.from("profiles").select("cefr_level").eq("id", user.id).single(),
        supabase.from("vocabulary").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("idioms").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("reading_sessions").select("text_id").eq("user_id", user.id),
        supabase.from("user_badges").select("badge_type").eq("user_id", user.id),
        (async () => {
          const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          return supabase.from("activity_logs").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("action_type", "reviewed_vocab").gte("created_at", oneWeekAgo.toISOString());
        })(),
        supabase.from("activity_logs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("following_id", user.id),
        supabase.from("user_follows").select("*", { count: "exact", head: true }).eq("follower_id", user.id)
      ]);

      const profData = results[0].status === "fulfilled" ? results[0].value.data : null;
      const vCount = results[1].status === "fulfilled" ? results[1].value.count : 0;
      const iCount = results[2].status === "fulfilled" ? results[2].value.count : 0;
      const sData = results[3].status === "fulfilled" ? results[3].value.data : null;
      const bData = results[4].status === "fulfilled" ? results[4].value.data : null;
      const rCount = results[5].status === "fulfilled" ? results[5].value.count : 0;
      const logsData = results[6].status === "fulfilled" ? results[6].value.data : null;
      const followersC = results[7].status === "fulfilled" ? results[7].value.count : 0;
      const followingC = results[8].status === "fulfilled" ? results[8].value.count : 0;

      if (!cancelled) {
        if (bData) {
          setBadges(bData.map((b: any) => b.badge_type));
        }
        setStats({
          vocabCount: vCount || 0,
          idiomCount: iCount || 0,
          cefrLevel: profData?.cefr_level || "",
          textsCompleted: new Set(sData?.map((s: any) => s.text_id) || []).size,
          reviewsThisWeek: rCount || 0,
          followersCount: followersC || 0,
          followingCount: followingC || 0,
        });
        if (logsData) {
          setRecentLogs(logsData);
        }
        setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, [supabase]);


  if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div>;
  if (!profile) return <div className="flex-1 flex items-center justify-center"><p>Anda belum login.</p></div>;

  const joinDate = new Date(profile.created_at).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" });
  const avatarUrl = profile.user_metadata?.avatar_url;
  const fullName = profile.user_metadata?.full_name || profile.email?.split("@")[0] || "Anon";
  const aboutMe = profile.user_metadata?.about_me || "Belum ada biografi. Tambahkan di pengaturan.";

  const statCards = [
    { icon: BookOpen, value: stats.vocabCount, label: "Kosakata", color: "text-brand", bg: "bg-brand/10", border: "border-brand/20" },
    { icon: Activity, value: stats.idiomCount, label: "Idiom", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
    { icon: BookMarked, value: stats.textsCompleted, label: "Teks Dibaca", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
    { icon: TrendingUp, value: stats.reviewsThisWeek, label: "Review Minggu Ini", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="h-48 w-full bg-gradient-to-r from-brand/20 via-purple-500/20 to-brand/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5 bg-[size:20px_20px]" />
      </div>

      <div className="max-w-5xl mx-auto px-8 relative -mt-20 pb-12">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6 mb-12">
          <div className="w-40 h-40 rounded-full border-4 border-background bg-muted overflow-hidden shrink-0 shadow-2xl">
            {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User className="w-16 h-16 text-muted-foreground" /></div>}
          </div>
          <div className="flex-1 mb-2">
            <h1 className="text-4xl font-serif font-bold text-foreground">{fullName}</h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1"><CalendarDays className="w-4 h-4" /> Bergabung sejak {joinDate}</p>
            <div className="flex items-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-foreground">{stats.followersCount}</span>
                <span className="text-sm text-muted-foreground">Followers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-foreground">{stats.followingCount}</span>
                <span className="text-sm text-muted-foreground">Following</span>
              </div>
            </div>
          </div>
          <Link href="/settings" className="mb-2 px-6 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-xl transition-colors font-medium">Edit Profil</Link>
        </div>

        {/* Level CEFR */}
        <div className="bg-card border border-border rounded-3xl p-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center"><GraduationCap className="w-6 h-6 text-brand" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Level CEFR</p>
              <p className="text-xl font-bold text-foreground">{stats.cefrLevel || "Belum diketahui"}</p>
            </div>
          </div>
          {!stats.cefrLevel && (
            <Link href="/english-lab/placement-test" className="px-5 py-2.5 bg-brand text-background font-bold rounded-xl text-sm text-center">Ikuti Placement Test</Link>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            <div className="bg-card border border-border p-6 rounded-3xl">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><User className="w-5 h-5 text-brand" /> Tentang Saya</h2>
              <p className="text-muted-foreground leading-relaxed">{aboutMe}</p>
            </div>
            <div className="bg-card border border-border p-6 rounded-3xl">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-yellow-400" /> Pencapaian</h2>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-brand/10 text-brand rounded-full text-xs font-bold border border-brand/20">Early Adopter</span>
                {stats.vocabCount >= 10 && <span className="px-3 py-1 bg-purple-500/10 text-purple-400 rounded-full text-xs font-bold border border-purple-500/20">Vocab Explorer</span>}
                {stats.vocabCount >= 50 && <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-bold border border-green-500/20">Kolektor Kata</span>}
                {stats.textsCompleted >= 5 && <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs font-bold border border-blue-500/20">Kutu Buku</span>}
                {badges.map(b => (
                  <span key={b} className="px-3 py-1 bg-pink-500/10 text-pink-500 rounded-full text-xs font-bold border border-pink-500/20 capitalize">{b.replace(/_/g, ' ')}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-2xl font-serif font-bold text-foreground">Statistik Pembelajaran</h2>

            {/* Stat Cards - fixed equal height grid */}
            <div className="grid grid-cols-2 gap-4">
              {statCards.map((card) => (
                <div key={card.label} className={`bg-gradient-to-br ${card.bg} to-transparent border ${card.border} p-6 rounded-3xl flex items-center gap-5`}>
                  <div className={`w-12 h-12 rounded-full ${card.bg} flex items-center justify-center shrink-0`}>
                    <card.icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl font-bold text-foreground">{card.value}</p>
                    <p className="text-xs text-muted-foreground font-medium truncate">{card.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Activity Timeline */}
            <div className="bg-card border border-border p-8 rounded-3xl">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Clock className="w-5 h-5 text-muted-foreground" /> Aktivitas Terakhir</h3>
              <div className="relative before:absolute before:inset-y-0 before:left-[11px] before:w-px before:bg-border space-y-6">
                
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex gap-4 relative">
                    <div className="w-6 h-6 rounded-full bg-brand/20 border-2 border-background flex items-center justify-center shrink-0 relative z-10">
                      <div className="w-2 h-2 rounded-full bg-brand" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground capitalize">{log.action_type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}

                {recentLogs.length === 0 && (
                  <div className="flex gap-4 relative">
                    <div className="w-6 h-6 rounded-full bg-brand/20 border-2 border-background flex items-center justify-center shrink-0 relative z-10">
                      <div className="w-2 h-2 rounded-full bg-brand" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">Membuat Profil</p>
                      <p className="text-xs text-muted-foreground">{joinDate}</p>
                    </div>
                  </div>
                )}
                
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
