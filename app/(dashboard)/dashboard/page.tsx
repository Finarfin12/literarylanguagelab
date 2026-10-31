import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { BookOpen, BookMarked, RefreshCcw, Clock, CheckCircle2, TrendingUp, ChevronRight, Library, Camera, Sparkles } from "lucide-react";
import VocabChart from "@/components/dashboard/VocabChart";
import AnimatedPage from "@/components/AnimatedPage";
import { ButtonLink, Card, CardTitle, EmptyState } from "@/components/ui/primitives";

type RecentSession = {
  text_id: string;
  last_active_at: string | null;
  time_spent_seconds: number | null;
  texts: { title: string | null; author: string | null } | { title: string | null; author: string | null }[] | null;
};

function formatAgo(iso: string | null) {
  if (!iso) return "";
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 60) return `${Math.max(diffMin, 1)} menit lalu`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  return `${Math.round(diffHour / 24)} hari lalu`;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const now = new Date().toISOString();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [vocabRes, dueRes, dueWordsRes, reviewedRes, sessionsRes, newVocabRes] = await Promise.all([
    // Total kosa kata
    supabase.from("vocabulary").select("*", { count: "exact", head: true }).eq("user_id", user?.id),
    // Jumlah kata jatuh tempo
    supabase.from("vocabulary").select("*", { count: "exact", head: true }).eq("user_id", user?.id).lte("next_review_at", now),
    // Contoh kata jatuh tempo
    supabase.from("vocabulary").select("id, word").eq("user_id", user?.id).lte("next_review_at", now).order("next_review_at", { ascending: true }).limit(6),
    // Review minggu ini
    supabase
      .from("activity_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user?.id)
      .eq("action_type", "reviewed_vocab")
      .gte("created_at", oneWeekAgo.toISOString()),
    // Sesi baca (teks selesai, waktu baca, lanjutkan membaca)
    supabase
      .from("reading_sessions")
      .select("text_id, time_spent_seconds, last_active_at, texts(title, author)")
      .eq("user_id", user?.id)
      .order("last_active_at", { ascending: false }),
    // Pertumbuhan kosa kata 7 hari
    supabase.from("vocabulary").select("created_at").eq("user_id", user?.id).gte("created_at", oneWeekAgo.toISOString()),
  ]);

  const vocabCount = vocabRes.count || 0;
  const dueCount = dueRes.count || 0;
  const dueWords = dueWordsRes.data || [];
  const reviewedThisWeek = reviewedRes.count || 0;
  const readingSessions = (sessionsRes.data || []) as RecentSession[];

  const completedTexts = new Set(readingSessions.map((s) => s.text_id)).size;
  const weeklySeconds = readingSessions
    .filter((s) => s.last_active_at && s.last_active_at >= oneWeekAgo.toISOString())
    .reduce((acc, s) => acc + (s.time_spent_seconds || 0), 0);
  const weeklyMinutes = Math.round(weeklySeconds / 60);

  // Lanjutkan Membaca: 3 teks terakhir yang dibuka (satu entri per teks)
  const seen = new Set<string>();
  const continueReading = readingSessions
    .filter((s) => {
      if (!s.text_id || seen.has(s.text_id)) return false;
      seen.add(s.text_id);
      return true;
    })
    .slice(0, 3)
    .map((s) => {
      const text = Array.isArray(s.texts) ? s.texts[0] : s.texts;
      return { id: s.text_id, title: text?.title || "Teks tanpa judul", author: text?.author, lastActive: s.last_active_at };
    });

  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const count = newVocabRes.data?.filter((v) => v.created_at.startsWith(dateStr)).length || 0;
    chartData.push({ date: d.toLocaleDateString("id-ID", { weekday: "short" }), count });
  }

  const stats = [
    { icon: Clock, color: "text-orange-500", label: "Waktu baca minggu ini", value: weeklyMinutes, unit: "menit" },
    { icon: CheckCircle2, color: "text-emerald-500", label: "Teks dibaca", value: completedTexts },
    { icon: TrendingUp, color: "text-brand", label: "Review minggu ini", value: reviewedThisWeek },
    { icon: BookMarked, color: "text-purple-500", label: "Total kosa kata", value: vocabCount },
  ];

  return (
    <AnimatedPage className="p-4 lg:p-8 max-w-6xl mx-auto pb-24">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-serif font-bold text-foreground">
          Ruang Belajar, {user?.user_metadata?.full_name || "Scholar"}
        </h1>
        <p className="text-muted-foreground mt-1 md:mt-2 md:text-lg">Lanjutkan bacaan dan ulangi kosa kata yang sudah waktunya.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
        {/* Lanjutkan Membaca */}
        <Card className="lg:col-span-2">
          <CardTitle
            icon={<BookOpen className="w-5 h-5 text-blue-400" />}
            action={
              <Link href="/library" className="text-sm font-bold text-brand flex items-center gap-1 min-h-[44px]">
                Library <ChevronRight className="w-4 h-4" />
              </Link>
            }
          >
            Lanjutkan Membaca
          </CardTitle>
          {continueReading.length > 0 ? (
            <ul className="divide-y divide-border -mx-2">
              {continueReading.map((t) => (
                <li key={t.id}>
                  <Link href={`/read/${t.id}`} className="flex items-center gap-3 px-2 py-3 min-h-[56px] rounded-control hover:bg-muted transition-colors">
                    <div className="w-10 h-10 rounded-control bg-blue-500/10 flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-foreground truncate">{t.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {t.author ? `${t.author} · ` : ""}
                        {formatAgo(t.lastActive)}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<Library className="w-8 h-8" />}
              title="Belum ada bacaan"
              description="Pilih teks dari Library atau buku klasik dari Public Domain Books."
              action={
                <div className="flex flex-wrap gap-2 justify-center">
                  <ButtonLink href="/library">Buka Library</ButtonLink>
                  <ButtonLink href="/gutenberg" variant="secondary">Buku Klasik</ButtonLink>
                </div>
              }
            />
          )}
        </Card>

        {/* Kosakata Jatuh Tempo */}
        <Card className="flex flex-col">
          <CardTitle icon={<RefreshCcw className="w-5 h-5 text-brand" />}>Kosa Kata Hari Ini</CardTitle>
          <p className="text-2xl md:text-4xl font-serif font-bold text-foreground">
            {dueCount} <span className="text-sm font-sans font-normal text-muted-foreground">kata menunggu review</span>
          </p>
          {dueWords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {dueWords.map((w) => (
                <span key={w.id} className="text-xs px-2 py-1 rounded-full bg-muted text-foreground">
                  {w.word}
                </span>
              ))}
            </div>
          )}
          <div className="mt-auto pt-4">
            <ButtonLink href={dueCount > 0 ? "/review" : "/vocabulary"} className="w-full">
              {dueCount > 0 ? "Mulai Review" : "Buka Vocabulary Bank"}
            </ButtonLink>
          </div>
        </Card>
      </div>

      {/* Progres Pribadi */}
      <Card>
        <CardTitle icon={<TrendingUp className="w-5 h-5 text-brand" />}>Progres Pribadi</CardTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {stats.map(({ icon: Icon, color, label, value, unit }) => (
            <div key={label} className="rounded-control bg-muted/50 p-3 md:p-4">
              <Icon className={`w-4 h-4 ${color} mb-2`} />
              <p className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                {value}
                {unit && <span className="text-sm font-sans font-normal text-muted-foreground"> {unit}</span>}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>
        <h3 className="text-sm font-bold text-muted-foreground mb-3">Kosa kata baru, 7 hari terakhir</h3>
        <div className="h-[220px]">
          <VocabChart data={chartData} />
        </div>
      </Card>

      {/* Pintasan */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 md:mt-6">
        {[
          { href: "/gutenberg", label: "Buku Klasik", icon: BookOpen },
          { href: "/library/add/ocr", label: "Scan Halaman", icon: Camera },
          { href: "/vocabulary", label: "Vocabulary Bank", icon: BookMarked },
          { href: "/tools", label: "Semua Alat", icon: Sparkles },
        ].map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex items-center gap-2 p-3 min-h-[48px] rounded-control border border-border bg-card hover:bg-muted text-sm font-bold text-foreground transition-colors">
            <Icon className="w-4 h-4 text-brand shrink-0" /> {label}
          </Link>
        ))}
      </div>
    </AnimatedPage>
  );
}
