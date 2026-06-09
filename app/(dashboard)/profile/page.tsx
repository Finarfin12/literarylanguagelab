"use client";

import { useEffect, useState } from "react";
import { User, BookOpen, Clock, Activity, Loader2, Sparkles, CalendarDays, Flame, TrendingUp, Zap } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

function getLevel(xp: number) {
  if (xp < 50) return { level: 1, title: "Pemula", nextXP: 50 };
  if (xp < 150) return { level: 2, title: "Pelajar Sastra", nextXP: 150 };
  if (xp < 350) return { level: 3, title: "Kutu Buku", nextXP: 350 };
  if (xp < 700) return { level: 4, title: "Sastrawan Muda", nextXP: 700 };
  if (xp < 1200) return { level: 5, title: "Kritikus Sastra", nextXP: 1200 };
  if (xp < 2000) return { level: 6, title: "Maestro Bahasa", nextXP: 2000 };
  if (xp < 3200) return { level: 7, title: "Jenius Literasi", nextXP: 3200 };
  return { level: 8, title: "Legenda Literary Lab", nextXP: Infinity };
}

function getLevelProgress(xp: number) {
  const { level } = getLevel(xp);
  const thresholds = [0, 50, 150, 350, 700, 1200, 2000, 3200];
  const current = thresholds[level - 1] || 0;
  const next = thresholds[level] || current + 1;
  return Math.round(((xp - current) / (next - current)) * 100);
}

export default function ProfilePage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ vocabCount: 0, idiomCount: 0, xp: 0, streak: 0, textsCompleted: 0, reviewsThisWeek: 0 });

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) { setLoading(false); return; }
      setProfile(user);

      const [profileRes, vocabRes, idiomRes, sessionsRes, reviewsRes] = await Promise.allSettled([
        supabase.from("profiles").select("xp, streak").eq("id", user.id).single(),
        supabase.from("vocabulary").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("idioms").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("reading_sessions").select("text_id").eq("user_id", user.id),
        (async () => {
          const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          return supabase.from("activity_logs").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("action_type", "reviewed_vocab").gte("created_at", oneWeekAgo.toISOString());
        })(),
      ]);

      const profileData = profileRes.status === "fulfilled" ? profileRes.value.data : null;
      const vocabCount = vocabRes.status === "fulfilled" ? vocabRes.value.count : 0;
      const idiomCount = idiomRes.status === "fulfilled" ? idiomRes.value.count : 0;
      const sessions = sessionsRes.status === "fulfilled" ? sessionsRes.value.data : null;
      const reviewsThisWeek = reviewsRes.status === "fulfilled" ? reviewsRes.value.count : 0;

      if (!cancelled) {
        setStats({
          vocabCount: vocabCount || 0,
          idiomCount: idiomCount || 0,
          xp: profileData?.xp || 0,
          streak: profileData?.streak || 0,
          textsCompleted: new Set(sessions?.map((s) => s.text_id) || []).size,
          reviewsThisWeek: reviewsThisWeek || 0,
        });
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
  const fullName = profile.user_metadata?.full_name || profile.email.split("@")[0];
  const aboutMe = profile.user_metadata?.about_me || "Belum ada biografi. Tambahkan di pengaturan.";
  const { level, title, nextXP } = getLevel(stats.xp);
  const progressPct = getLevelProgress(stats.xp);

  const statCards = [
    { icon: BookOpen, value: stats.vocabCount, label: "Kosakata", color: "text-brand", bg: "bg-brand/10", border: "border-brand/20" },
    { icon: Activity, value: stats.idiomCount, label: "Idiom", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
    { icon: Flame, value: stats.streak, label: "Streak (Hari)", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
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
          </div>
          <Link href="/settings" className="mb-2 px-6 py-2.5 bg-muted hover:bg-muted/80 border border-border rounded-xl transition-colors font-medium">Edit Profil</Link>
        </div>

        {/* XP & Level Bar */}
        <div className="bg-card border border-border rounded-3xl p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-yellow-400/20 flex items-center justify-center"><Zap className="w-6 h-6 text-yellow-400" /></div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-foreground">Level {level}</span>
                  <span className="text-sm text-muted-foreground px-2 py-0.5 bg-muted rounded-full">• {title} •</span>
                </div>
                <p className="text-sm text-muted-foreground">{stats.xp} XP</p>
              </div>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              {nextXP === Infinity ? "Maksimum!" : `${stats.xp}/${nextXP} XP ke Level ${level + 1}`}
            </div>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-yellow-400 to-brand rounded-full transition-all duration-700" style={{ width: `${Math.min(progressPct, 100)}%` }} />
          </div>
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
                {stats.streak >= 7 && <span className="px-3 py-1 bg-orange-500/10 text-orange-500 rounded-full text-xs font-bold border border-orange-500/20">7 Hari Streak</span>}
                {stats.streak >= 30 && <span className="px-3 py-1 bg-rose-500/10 text-rose-400 rounded-full text-xs font-bold border border-rose-500/20">Bulan Penuh</span>}
                {stats.textsCompleted >= 5 && <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs font-bold border border-blue-500/20">Kutu Buku</span>}
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
              <div className="relative before:absolute before:inset-y-0 before:left-[11px] before:w-px before:bg-border">
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
