import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getRequestUser } from "@/utils/supabase/get-user";
import AnimatedPage from "@/components/AnimatedPage";
import { Card, CardTitle } from "@/components/ui/primitives";
import TopicPractice from "./TopicPractice";

export const dynamic = "force-dynamic";

type Example = { en: string; id: string };

const isPast = (iso: string) => new Date(iso).getTime() <= Date.now();

export default async function GrammarTopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: topic } = await supabase
    .from("grammar_topics")
    .select("slug, title, cefr_level, sort_order, summary_id, examples, related_text_ids")
    .eq("slug", slug)
    .maybeSingle();
  if (!topic) notFound();

  // Topik sebelum/sesudah untuk navigasi berurutan
  const [prevRes, nextRes] = await Promise.all([
    supabase.from("grammar_topics").select("slug, title").lt("sort_order", topic.sort_order).order("sort_order", { ascending: false }).limit(1),
    supabase.from("grammar_topics").select("slug, title").gt("sort_order", topic.sort_order).order("sort_order", { ascending: true }).limit(1),
  ]);
  const prev = prevRes.data?.[0];
  const next = nextRes.data?.[0];

  // Bacaan terkait (diatur admin)
  const relatedIds = (topic.related_text_ids || []) as string[];
  const { data: related } = relatedIds.length
    ? await supabase.from("texts").select("id, title, cefr_level").in("id", relatedIds).eq("is_public", true)
    : { data: [] as { id: string; title: string; cefr_level: string | null }[] };

  const examples = (Array.isArray(topic.examples) ? topic.examples : []) as Example[];

  // Fase 15: jumlah soal terstruktur terbit + apakah jadwal review topik ini sudah lewat.
  // Sebelum migrasi 0012 kedua tabel belum ada: error diabaikan dan halaman tampil seperti sebelumnya.
  const { user } = await getRequestUser();
  const [exerciseRes, progressRes] = await Promise.all([
    supabase.from("exercises").select("id", { count: "exact", head: true }).eq("topic_slug", topic.slug).eq("status", "published"),
    user
      ? supabase.from("grammar_progress").select("completed_at, next_review_at").eq("user_id", user.id).eq("topic_slug", topic.slug).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  const exerciseCount = exerciseRes.error ? 0 : exerciseRes.count ?? 0;
  const progress = progressRes.error ? null : progressRes.data;
  const reviewDue = !!progress?.completed_at && !!progress.next_review_at && isPast(progress.next_review_at);

  return (
    <AnimatedPage className="p-4 lg:p-8 max-w-3xl mx-auto pb-24">
      <Link href="/english-lab/grammar" className="inline-flex items-center gap-2 min-h-[44px] text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Semua topik
      </Link>

      <div className="mt-2 mb-6">
        <span className="text-xs font-bold px-2 py-1 rounded bg-brand-tint text-brand-ink">Level {topic.cefr_level}</span>
        <h1 className="text-[28px] md:text-4xl leading-[1.15] mt-2 font-serif font-medium text-foreground">{topic.title}</h1>
      </div>

      <Card className="mb-4">
        <CardTitle>Ringkasan</CardTitle>
        <p className="text-foreground leading-relaxed">{topic.summary_id}</p>
      </Card>

      {examples.length > 0 && (
        <Card className="mb-4">
          <CardTitle>Contoh</CardTitle>
          <ul className="space-y-3">
            {examples.map((ex, i) => (
              <li key={i} className="border-l-4 border-brand/40 pl-3">
                <p className="font-serif text-foreground">{ex.en}</p>
                <p className="text-sm text-muted-foreground">{ex.id}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <TopicPractice slug={topic.slug} title={topic.title} summary={topic.summary_id} exerciseCount={exerciseCount} reviewDue={reviewDue} />

      {related && related.length > 0 && (
        <Card className="mt-4">
          <CardTitle icon={<BookOpen className="w-5 h-5 text-brand-ink" />}>Bacaan terkait</CardTitle>
          <ul className="divide-y divide-border -mx-2">
            {related.map((t) => (
              <li key={t.id}>
                <Link href={`/read/${t.id}`} className="flex items-center justify-between gap-3 px-2 min-h-[48px] hover:bg-muted rounded-control">
                  <span className="font-medium text-foreground">{t.title}</span>
                  {t.cefr_level && <span className="text-xs font-bold px-2 py-1 rounded bg-muted">{t.cefr_level}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <nav className="mt-8 flex items-center justify-between gap-3" aria-label="Topik berurutan">
        {prev ? (
          <Link href={`/english-lab/grammar/${prev.slug}`} className="min-h-[44px] inline-flex items-center px-4 rounded-control border border-border bg-card text-sm font-bold hover:bg-muted">
            ← {prev.title}
          </Link>
        ) : <span />}
        {next ? (
          <Link href={`/english-lab/grammar/${next.slug}`} className="min-h-[44px] inline-flex items-center px-4 rounded-control border border-border bg-card text-sm font-bold hover:bg-muted text-right">
            {next.title} →
          </Link>
        ) : <span />}
      </nav>
    </AnimatedPage>
  );
}
