import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { BookOpen, BookMarked, RefreshCcw, Flame, CheckCircle2, TrendingUp } from "lucide-react";
import VocabChart from "@/components/dashboard/VocabChart";
import JourneyWidget from "@/components/dashboard/JourneyWidget";
import DailyPracticeWidget from "@/components/dashboard/DailyPracticeWidget";
import WritingChallengeWidget from "@/components/dashboard/WritingChallengeWidget";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Get total vocab count
  const { count: vocabCount } = await supabase
    .from("vocabulary")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user?.id);

  // 2. Get due reviews count
  const now = new Date().toISOString();
  const { count: dueCount } = await supabase
    .from("vocabulary")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user?.id)
    .lte("next_review_at", now);

  // 3. Get words reviewed this week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const { count: reviewedThisWeek } = await supabase
    .from("activity_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user?.id)
    .eq("action_type", "reviewed_vocab")
    .gte("created_at", oneWeekAgo.toISOString());

  // 4. Get completed/read texts count
  // For MVP, we count unique texts in reading_sessions
  const { data: readingSessions } = await supabase
    .from("reading_sessions")
    .select("text_id")
    .eq("user_id", user?.id);
  const completedTexts = new Set(readingSessions?.map(s => s.text_id) || []).size;

  // Trigger login streak update
  if (user?.id) {
    await supabase.rpc("update_login_streak", { target_user_id: user.id });
  }

  // 5. Get login-based streak from profiles
  const { data: profileData } = await supabase
    .from("profiles")
    .select("streak")
    .eq("id", user?.id)
    .single();
  const streak = profileData?.streak || 0;

  // 6. Vocabulary Growth Chart Data (Last 7 Days)
  const chartData = [];
  const { data: allVocabs } = await supabase
    .from("vocabulary")
    .select("created_at")
    .eq("user_id", user?.id)
    .gte("created_at", oneWeekAgo.toISOString());

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const count = allVocabs?.filter(v => v.created_at.startsWith(dateStr)).length || 0;
    chartData.push({
      date: d.toLocaleDateString('id-ID', { weekday: 'short' }),
      count
    });
  }

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10">
        <h1 className="text-4xl font-serif font-bold text-foreground">
          Welcome back, {user?.user_metadata?.full_name || "Scholar"}
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Lacak progres Anda dan terus konsisten membaca literatur bahasa Inggris.
        </p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <Flame className="w-5 h-5 text-orange-500" />
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Login Streak</h3>
          </div>
          <p className="text-4xl font-serif font-bold text-foreground">{streak} <span className="text-xl text-muted-foreground font-sans font-normal">Hari</span></p>
        </div>
        
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Teks Selesai</h3>
          </div>
          <p className="text-4xl font-serif font-bold text-foreground">{completedTexts}</p>
        </div>

        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-5 h-5 text-brand" />
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Review Minggu Ini</h3>
          </div>
          <p className="text-4xl font-serif font-bold text-foreground">{reviewedThisWeek || 0}</p>
        </div>

        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <BookMarked className="w-5 h-5 text-purple-500" />
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Total Kosa Kata</h3>
          </div>
          <p className="text-4xl font-serif font-bold text-foreground">{vocabCount || 0}</p>
        </div>
      </div>

      {/* Reading Journey Widget */}
      <div className="mb-8">
        <DailyPracticeWidget />
      </div>

      <div className="mb-8">
        <JourneyWidget />
      </div>

      {/* Chart & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col min-h-[300px]">
          <h3 className="text-lg font-bold text-foreground mb-6">Vocabulary Growth (7 Hari Terakhir)</h3>
          <div className="flex-1">
            <VocabChart data={chartData} />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-card shadow-sm backdrop-blur-md border border-brand/20 rounded-3xl p-6 shadow-lg relative overflow-hidden group flex-1 flex flex-col justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-brand/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 text-center">
              <RefreshCcw className="w-12 h-12 text-brand mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">Review Queue</h3>
              <p className="text-3xl font-serif font-bold text-foreground mb-4">{dueCount || 0} <span className="text-sm font-sans font-normal text-muted-foreground">kata menunggu</span></p>
              <Link href="/review" className="block w-full py-3 bg-brand text-background font-bold rounded-xl hover:shadow-[0_0_15px_rgba(62,207,142,0.4)] transition-all">
                Mulai Review
              </Link>
            </div>
          </div>
          
          <Link 
            href="/library"
            className="group block bg-card border border-border rounded-3xl p-6 hover:bg-muted transition-all relative overflow-hidden"
          >
            <BookOpen className="w-8 h-8 text-blue-400 mb-3" />
            <h2 className="text-lg font-bold text-foreground group-hover:text-blue-400 transition-colors mb-1">
              Lanjut Membaca
            </h2>
            <p className="text-sm text-muted-foreground">Buka Text Library</p>
          </Link>
          
          <WritingChallengeWidget />
        </div>
      </div>
    </div>
  );
}
