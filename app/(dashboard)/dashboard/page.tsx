import { createClient } from "@/utils/supabase/server";
import { getRequestUser } from "@/utils/supabase/get-user";
import Link from "next/link";
import { BookOpen, BookMarked, Clock, CheckCircle2, TrendingUp, ChevronRight, Library, Camera, Sparkles } from "lucide-react";
import VocabChart from "@/components/dashboard/VocabChart";
import AnimatedPage from "@/components/AnimatedPage";
import { Badge, BookSpine, ButtonLink, Card, CardTitle, EmptyState, Eyebrow, ProgressBar, SectionHeading } from "@/components/ui/primitives";
import { LEARNING_ROOMS } from "@/lib/rooms";
import WotdCard from "@/components/wotd/WotdCard";
import { getNextStep } from "@/lib/next-step";
import { neighborLevels } from "@/lib/cefr";
import { loadLevelContext } from "@/lib/skill-evidence";
import { canTakeLevelTest, levelUpReadiness } from "@/lib/levels";
import { toolsForGoal } from "@/lib/menu-config";
import { GOAL_LABELS, isLearningGoal, type LearningGoal } from "@/lib/learning-goals";

type RecentSession = {
  text_id: string | null;
  last_active_at: string | null;
  time_spent_seconds: number | null;
  texts: { title: string | null; author: string | null } | { title: string | null; author: string | null }[] | null;
  // Kolom dari migrasi 0005 (opsional sampai migrasi dijalankan)
  source_key?: string | null;
  source_title?: string | null;
  source_author?: string | null;
  progress_pct?: number | null;
};

// Profil untuk personalisasi. learning_goal dari migrasi 0006: jika belum ada, ambil cefr_level saja.
type LevelTextCandidate = { id: string; title: string; word_count: number | null };

async function loadPersonalization(supabase: Awaited<ReturnType<typeof createClient>>, userId: string | undefined) {
  const empty = { goal: null as LearningGoal | null, cefr: null as string | null, levelTexts: [] as LevelTextCandidate[] };
  if (!userId) return empty;
  const full = await supabase.from("profiles").select("cefr_level, learning_goal").eq("id", userId).maybeSingle();
  let goal: LearningGoal | null = null;
  let cefr: string | null = null;
  if (!full.error) {
    goal = isLearningGoal(full.data?.learning_goal) ? full.data.learning_goal : null;
    cefr = (full.data?.cefr_level as string | null) ?? null;
  } else {
    const basic = await supabase.from("profiles").select("cefr_level").eq("id", userId).maybeSingle();
    cefr = (basic.data?.cefr_level as string | null) ?? null;
  }

  // Kandidat bacaan sesuai level (Library berjenjang, migrasi 0007). Diambil di sini supaya berjalan
  // paralel dengan query beranda lain; jika kolom cefr_level belum ada, query error dan saran dilewati.
  const level = neighborLevels(cefr, 0, 0)[0];
  if (!level) return { goal, cefr, levelTexts: [] as LevelTextCandidate[] };
  const { data, error } = await supabase
    .from("texts")
    .select("id, title, word_count")
    .eq("is_public", true)
    .eq("cefr_level", level)
    .order("created_at", { ascending: false })
    .limit(20);
  return { goal, cefr, levelTexts: error ? [] : ((data || []) as LevelTextCandidate[]) };
}

// Level berikutnya jika syarat naik level terpenuhi dan tes boleh diambil (migrasi 0008); selain itu null.
async function loadLevelUpTarget(supabase: Awaited<ReturnType<typeof createClient>>, userId: string | undefined): Promise<string | null> {
  if (!userId) return null;
  try {
    const ctx = await loadLevelContext(supabase, userId);
    if (!ctx.schemaReady || !ctx.level) return null;
    const readiness = levelUpReadiness(ctx.evidence, ctx.level, ctx.vocab, ctx.rules);
    const cooldown = canTakeLevelTest(ctx.lastTestAt, new Date(), ctx.rules.test.cooldownDays);
    return readiness.ready && cooldown.allowed ? readiness.target : null;
  } catch {
    return null;
  }
}

// Fase 15: topik grammar yang jadwal reviewnya sudah lewat (tabel grammar_progress, migrasi 0012). Sebelum migrasi: null.
async function loadGrammarDue(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string | undefined
): Promise<{ count: number; slug: string; title: string } | null> {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from("grammar_progress")
      .select("topic_slug, completed_at, next_review_at")
      .eq("user_id", userId)
      .not("completed_at", "is", null)
      .lte("next_review_at", new Date().toISOString())
      .order("next_review_at", { ascending: true });
    if (error || !data || data.length === 0) return null;
    const { data: topic } = await supabase.from("grammar_topics").select("title").eq("slug", data[0].topic_slug).maybeSingle();
    return { count: data.length, slug: data[0].topic_slug as string, title: (topic?.title as string | undefined) ?? "Grammar" };
  } catch {
    return null;
  }
}

const SESSION_COLUMNS ="text_id, time_spent_seconds, last_active_at, texts(title, author)";

function formatAgo(iso: string | null) {
  if (!iso) return "";
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 60) return `${Math.max(diffMin, 1)} menit lalu`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  return `${Math.round(diffHour / 24)} hari lalu`;
}

export default async function DashboardPage() {
  const { supabase, user } = await getRequestUser();

  const now = new Date().toISOString();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [vocabRes, dueRes, dueWordsRes, reviewedRes, sessionsRes, newVocabRes, personal, levelUpTarget, grammarDue] = await Promise.all([
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
      .select(`${SESSION_COLUMNS}, source_key, source_title, source_author, progress_pct`)
      .eq("user_id", user?.id)
      .order("last_active_at", { ascending: false }),
    // Pertumbuhan kosa kata 7 hari
    supabase.from("vocabulary").select("created_at").eq("user_id", user?.id).gte("created_at", oneWeekAgo.toISOString()),
    // Tujuan belajar & level untuk "Langkah berikutnya"
    loadPersonalization(supabase, user?.id),
    loadLevelUpTarget(supabase, user?.id),
    loadGrammarDue(supabase, user?.id),
  ]);

  const vocabCount = vocabRes.count || 0;
  const dueCount = dueRes.count || 0;
  const dueWords = dueWordsRes.data || [];
  const reviewedThisWeek = reviewedRes.count || 0;
  // Sebelum migrasi 0005 kolom posisi belum ada: ambil ulang tanpa kolom tersebut
  const sessionsData = sessionsRes.error
    ? (await supabase.from("reading_sessions").select(SESSION_COLUMNS).eq("user_id", user?.id).order("last_active_at", { ascending: false })).data
    : sessionsRes.data;
  const readingSessions = (sessionsData || []) as RecentSession[];
  const sessionKey = (s: RecentSession) => s.text_id || s.source_key || "";

  const completedTexts = new Set(readingSessions.map(sessionKey).filter(Boolean)).size;
  const weeklySeconds = readingSessions
    .filter((s) => s.last_active_at && s.last_active_at >= oneWeekAgo.toISOString())
    .reduce((acc, s) => acc + (s.time_spent_seconds || 0), 0);
  const weeklyMinutes = Math.round(weeklySeconds / 60);

  // Lanjutkan Membaca: 3 bacaan terakhir (teks Library maupun buku Gutenberg), satu entri per bacaan
  const seen = new Set<string>();
  const continueReading = readingSessions
    .filter((s) => {
      const key = sessionKey(s);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3)
    .map((s) => {
      const text = Array.isArray(s.texts) ? s.texts[0] : s.texts;
      const gutenbergId = s.source_key?.startsWith("gutenberg_") ? s.source_key.slice("gutenberg_".length) : null;
      return {
        id: sessionKey(s),
        href: gutenbergId ? `/gutenberg/${gutenbergId}` : `/read/${s.text_id}`,
        title: text?.title || s.source_title || "Teks tanpa judul",
        author: text?.author || s.source_author,
        lastActive: s.last_active_at,
        progress: s.progress_pct ?? null,
      };
    });

  // Bacaan sesuai level: teks terbit di level pengguna yang belum pernah dibuka
  const openedIds = new Set(readingSessions.map((s) => s.text_id).filter(Boolean) as string[]);
  const pick = personal.levelTexts.find((t) => !openedIds.has(t.id));
  const levelText = pick
    ? { title: pick.title, href: `/read/${pick.id}`, minutes: pick.word_count ? Math.max(1, Math.round(pick.word_count / 200)) : undefined }
    : null;

  const openReading = continueReading.find((t) => t.progress === null || t.progress < 100) ?? null;
  const nextStep = getNextStep({
    goal: personal.goal,
    cefr: personal.cefr,
    dueCount,
    grammarDue,
    continueReading: openReading ? { title: openReading.title, href: openReading.href } : null,
    levelText,
    levelUpTarget,
  });
  const goalForTools: LearningGoal = personal.goal ?? "umum";
  const recommendedTools = toolsForGoal(goalForTools, 6);

  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const count = newVocabRes.data?.filter((v) => v.created_at.startsWith(dateStr)).length || 0;
    chartData.push({ date: d.toLocaleDateString("id-ID", { weekday: "short" }), count });
  }

  const stats = [
    { icon: Clock, color: "text-foreground", label: "Waktu baca minggu ini", value: weeklyMinutes, unit: "menit" },
    { icon: CheckCircle2, color: "text-foreground", label: "Teks dibaca", value: completedTexts },
    { icon: TrendingUp, color: "text-brand-ink", label: "Review minggu ini", value: reviewedThisWeek },
    { icon: BookMarked, color: "text-foreground", label: "Total kosa kata", value: vocabCount },
  ];

  const displayName = user?.user_metadata?.full_name || "Scholar";

  return (
    <AnimatedPage className="px-4 md:px-6 py-6 lg:py-8 max-w-[960px] mx-auto pb-24">
      {/* Sapaan */}
      <header className="mb-8">
        <Eyebrow>Ruang belajar</Eyebrow>
        <h1 className="font-serif text-[32px] md:text-[44px] font-medium leading-[1.1] text-foreground mt-1">Halo, {displayName}</h1>
        <p className="text-muted-foreground mt-2 md:text-lg">Lanjutkan bacaan dan ulangi kosa kata yang sudah waktunya.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-10">
        {/* Langkah berikutnya */}
        <Card className="lg:col-span-2 border-brand-solid/40 bg-brand-tint/40 flex flex-col">
          <Eyebrow active className="mb-2">Langkah berikutnya</Eyebrow>
          <p className="font-serif text-[22px] md:text-[26px] font-medium leading-[1.2] text-foreground">{nextStep.title}</p>
          <p className="text-sm md:text-base text-muted-foreground mt-2">{nextStep.reason}</p>
          <div className="mt-5">
            <ButtonLink href={nextStep.href}>Mulai</ButtonLink>
          </div>
        </Card>

        {/* Kosakata Jatuh Tempo */}
        <Card className="flex flex-col">
          <Eyebrow className="mb-2">Review Hari Ini</Eyebrow>
          <p className="font-serif text-[32px] md:text-[40px] font-medium leading-none text-foreground nums">
            {dueCount} <span className="text-sm font-sans font-normal text-muted-foreground">kata menunggu review</span>
          </p>
          {dueWords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {dueWords.map((w) => (
                <span key={w.id} className="text-xs px-2.5 py-1 rounded-full bg-muted text-foreground">
                  {w.word}
                </span>
              ))}
            </div>
          )}
          {grammarDue && (
            <Link
              href={`/english-lab/grammar/${grammarDue.slug}?review=1`}
              className="mt-3 flex items-center justify-between gap-2 min-h-[44px] rounded-control border border-border px-3 text-sm hover:bg-muted"
            >
              <span>
                <span className="font-bold nums">{grammarDue.count}</span> topik grammar menunggu review
                <span className="block text-xs text-muted-foreground">{grammarDue.title}</span>
              </span>
              <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </Link>
          )}
          <div className="mt-auto pt-4">
            <ButtonLink
              href={dueCount > 0 ? "/review" : grammarDue ? `/english-lab/grammar/${grammarDue.slug}?review=1` : "/vocabulary"}
              className="w-full"
            >
              {dueCount > 0 ? "Mulai Review" : grammarDue ? "Review Grammar" : "Buka Bank Kosakata"}
            </ButtonLink>
          </div>
        </Card>
      </div>

      {/* Lanjutkan Membaca (rak bacaan) */}
      <section className="mb-10" aria-labelledby="rak-bacaan">
        <SectionHeading
          action={
            <Link href="/library" className="font-semibold text-brand-ink flex items-center gap-1 min-h-[44px]">
              Library <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          }
        >
          <span id="rak-bacaan">Lanjutkan Membaca</span>
        </SectionHeading>
        {continueReading.length > 0 ? (
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {continueReading.map((t) => (
              <li key={t.id}>
                <Link href={t.href} className="flex gap-4 h-full p-4 rounded-card border border-border bg-card hover:border-brand-solid transition-colors">
                  <BookSpine title={t.title} subtitle={t.author ?? undefined} className="w-16" />
                  <div className="min-w-0 flex-1 flex flex-col">
                    <p className="font-serif text-lg font-medium leading-tight text-foreground line-clamp-2">{t.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {t.author ? `${t.author} · ` : ""}
                      {formatAgo(t.lastActive)}
                    </p>
                    {t.progress !== null && (
                      <div className="mt-auto pt-3">
                        <ProgressBar value={t.progress} label={`Progres membaca ${t.title}`} />
                        <p className="text-xs text-muted-foreground mt-1 nums">{Math.round(t.progress)}%</p>
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Card>
            <EmptyState
              icon={<Library className="w-8 h-8" />}
              title="Belum ada bacaan"
              description="Pilih teks dari Library atau buku klasik dari Public Domain Books."
              action={
                <div className="flex flex-wrap gap-2 justify-center">
                  <ButtonLink href="/library">Buka Library</ButtonLink>
                  <ButtonLink href="/gutenberg" variant="secondary">Baca Buku</ButtonLink>
                </div>
              }
            />
          </Card>
        )}
      </section>

      {/* Tiga ruang belajar */}
      <section className="mb-10" aria-labelledby="tiga-ruang">
        <SectionHeading
          action={
            <Link href="/ruang" className="font-semibold text-brand-ink flex items-center gap-1 min-h-[44px]">
              Semua ruang <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          }
        >
          <span id="tiga-ruang">Tiga ruang belajar</span>
        </SectionHeading>
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {LEARNING_ROOMS.map((room) => (
            <li key={room.slug}>
              <Link href={`/ruang/${room.slug}`} className="block h-full p-5 rounded-card border border-border bg-card hover:border-brand-solid transition-colors">
                <div className="flex items-center gap-2 flex-wrap">
                  <Eyebrow active={room.goal === personal.goal}>{room.eyebrow}</Eyebrow>
                  {room.goal === personal.goal && <Badge>Tujuanmu</Badge>}
                </div>
                <p className="font-serif text-xl font-medium leading-tight text-foreground mt-1">{room.title}</p>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{room.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Word of the Day: kata lokal + tombol Pelajari (AI hanya dipanggil saat ditekan) */}
      <section className="mb-10 max-w-md" aria-label="Word of the Day">
        <WotdCard />
      </section>

      {/* Progres Pribadi */}
      <Card>
        <CardTitle icon={<TrendingUp className="w-5 h-5 text-brand-ink" />}>Progres Pribadi</CardTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {stats.map(({ icon: Icon, color, label, value, unit }) => (
            <div key={label} className="rounded-control bg-muted p-3 md:p-4">
              <Icon className={`w-4 h-4 ${color} mb-2`} aria-hidden="true" />
              <p className="font-serif text-[28px] md:text-3xl font-medium leading-none text-foreground nums">
                {value}
                {unit && <span className="text-sm font-sans font-normal text-muted-foreground"> {unit}</span>}
              </p>
              <p className="text-xs text-muted-foreground mt-1.5">{label}</p>
            </div>
          ))}
        </div>
        <h3 className="text-sm font-bold text-muted-foreground mb-3">Kosa kata baru, 7 hari terakhir</h3>
        <div className="h-[220px]">
          <VocabChart data={chartData} />
        </div>
      </Card>

      {/* Alat untuk kamu */}
      <Card className="mt-4 md:mt-6">
        <CardTitle icon={<Sparkles className="w-5 h-5 text-brand-ink" />}>Alat untuk kamu</CardTitle>
        <p className="text-sm text-muted-foreground -mt-2 mb-4">Dipilih untuk tujuan: {GOAL_LABELS[goalForTools].title.toLowerCase()}. Ubah di Pengaturan.</p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {recommendedTools.map((t) => (
            <li key={t.path}>
              <Link href={t.path} className="block h-full p-3 min-h-[56px] rounded-control border border-border bg-card hover:bg-muted transition-colors">
                <span className="block text-sm font-semibold text-foreground">{t.name}</span>
                <span className="block text-xs text-muted-foreground mt-0.5">{t.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      {/* Pintasan */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 md:mt-6">
        {[
          { href: "/gutenberg", label: "Baca Buku", icon: BookOpen },
          { href: "/library/add/ocr", label: "Scan Halaman", icon: Camera },
          { href: "/vocabulary", label: "Bank Kosakata", icon: BookMarked },
          { href: "/tools", label: "Semua Alat", icon: Sparkles },
        ].map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex items-center gap-2 p-3 min-h-[48px] rounded-control border border-border bg-card hover:bg-muted text-sm font-semibold text-foreground transition-colors">
            <Icon className="w-4 h-4 text-brand-ink shrink-0" aria-hidden="true" /> {label}
          </Link>
        ))}
      </div>
    </AnimatedPage>
  );
}
