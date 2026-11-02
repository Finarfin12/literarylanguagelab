import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import AnimatedPage from "@/components/AnimatedPage";
import { Badge, Card, EmptyState, Eyebrow } from "@/components/ui/primitives";
import { getRequestUser } from "@/utils/supabase/get-user";
import { getCourseAccess } from "@/lib/course-access";
import { loadUnit, loadUnitProgress, loadUnits } from "@/lib/course-server";
import { isStepEmpty, resumeIndex, suggestNextUnit } from "@/lib/course";
import { DIALOGUE_SCENARIOS } from "@/lib/dialogue-scenarios";
import type { ResolvedText, ResolvedTopic, ResolvedVocab, StepView } from "@/components/course/types";
import UnitPlayer from "@/components/course/UnitPlayer";

export const dynamic = "force-dynamic";

export default async function UnitPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { supabase, user } = await getRequestUser();
  const access = await getCourseAccess(supabase, user?.id);

  if (!access.visible) {
    return (
      <AnimatedPage className="mx-auto w-full max-w-[960px] px-4 md:px-6 pt-6 pb-24">
        <Card><EmptyState title="Segera hadir" description="Kursus Dasar sedang disiapkan." /></Card>
      </AnimatedPage>
    );
  }

  const { available, unit } = await loadUnit(supabase, slug);
  if (!available) {
    return (
      <AnimatedPage className="mx-auto w-full max-w-[960px] px-4 md:px-6 pt-6 pb-24">
        <Card><EmptyState title="Unit belum tersedia" description="Migrasi 0013_course_units.sql belum dijalankan." /></Card>
      </AnimatedPage>
    );
  }
  if (!unit) notFound();

  const steps = unit.steps;

  // Data tiap jenis langkah dikumpulkan sekali (paralel), lalu dipetakan ke langkah
  const vocabWords = Array.from(new Set(steps.flatMap((s) => (s.type === "vocab" ? s.items.map((i) => i.word.toLowerCase()) : []))));
  const topicSlugs = Array.from(new Set(steps.flatMap((s) => (s.type === "grammar" && s.topic_slug ? [s.topic_slug] : []))));
  const textIds = Array.from(new Set(steps.flatMap((s) => (s.type === "read" && s.text_id ? [s.text_id] : []))));

  const [coreRes, topicRes, textRes, exerciseRes, progressRows, allUnits, profile] = await Promise.all([
    // definition_en dari Kosakata Inti (migrasi 0015); error (kolom belum ada) diabaikan
    vocabWords.length ? supabase.from("core_words").select("word, definition_en").in("word", vocabWords) : Promise.resolve({ data: [], error: null }),
    topicSlugs.length ? supabase.from("grammar_topics").select("slug, title, summary_id, examples").in("slug", topicSlugs) : Promise.resolve({ data: [], error: null }),
    textIds.length ? supabase.from("texts").select("id, title, author, content").in("id", textIds) : Promise.resolve({ data: [], error: null }),
    steps.some((s) => s.type === "exercise")
      ? supabase.from("exercises").select("id", { count: "exact", head: true }).eq("unit_slug", unit.slug).eq("status", "published")
      : Promise.resolve({ count: 0, error: null }),
    user ? loadUnitProgress(supabase, user.id) : Promise.resolve([]),
    loadUnits(supabase),
    user ? supabase.from("profiles").select("cefr_level").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  const definitions = new Map<string, string>();
  for (const r of (coreRes.error ? [] : coreRes.data || []) as { word: string; definition_en: string | null }[]) {
    if (r.definition_en) definitions.set(r.word.toLowerCase(), r.definition_en);
  }
  const topics = new Map<string, ResolvedTopic>();
  for (const t of (topicRes.error ? [] : topicRes.data || []) as { slug: string; title: string; summary_id: string; examples: unknown }[]) {
    topics.set(t.slug, { slug: t.slug, title: t.title, summary_id: t.summary_id, examples: Array.isArray(t.examples) ? (t.examples as { en: string; id: string }[]) : [] });
  }
  const texts = new Map<string, ResolvedText>();
  for (const t of (textRes.error ? [] : textRes.data || []) as { id: string; title: string; author: string | null; content: string }[]) {
    texts.set(t.id, { id: t.id, title: t.title, author: t.author ?? undefined, content: t.content });
  }
  const exerciseCount = exerciseRes.error ? 0 : exerciseRes.count ?? 0;
  // Langkah latihan bertanda (Fase 17): hitung soal terbit per tag
  const tagCounts = new Map<string, number>();
  for (const tg of Array.from(new Set(steps.flatMap((s) => (s.type === "exercise" && s.tag ? [s.tag] : []))))) {
    const r = await supabase.from("exercises").select("id", { count: "exact", head: true }).eq("status", "published").contains("tags", [tg]);
    tagCounts.set(tg, r.error ? 0 : r.count ?? 0);
  }

  const views: StepView[] = steps.map((step) => {
    const base: StepView = { step, empty: isStepEmpty(step) };
    switch (step.type) {
      case "vocab": {
        // Definisi tulisan admin menang; selebihnya dari Kosakata Inti
        const vocab: ResolvedVocab[] = step.items.map((i) => ({ ...i, definition_en: i.definition_en ?? definitions.get(i.word.toLowerCase()) }));
        return { ...base, vocab };
      }
      case "grammar":
        return { ...base, topic: topics.get(step.topic_slug) ?? null, empty: base.empty || !topics.has(step.topic_slug) };
      case "read": {
        const fromDb = step.text_id ? texts.get(step.text_id) : undefined;
        const text = fromDb ?? (step.content ? { id: null, title: step.title ?? unit.title, content: step.content } : null);
        return { ...base, text, empty: !text };
      }
      case "exercise":
      {
        const n = step.tag ? tagCounts.get(step.tag) ?? 0 : exerciseCount;
        return { ...base, exerciseCount: n, empty: n === 0 };
      }
      case "speak": {
        const sc = step.scenario_id ? DIALOGUE_SCENARIOS.find((d) => d.id === step.scenario_id) : undefined;
        return { ...base, scenario: sc ? { id: sc.id, title: sc.title } : null };
      }
      default:
        return base;
    }
  });

  const progress = progressRows.find((p) => p.unit_slug === unit.slug) ?? null;
  const others = allUnits.units.filter((u) => u.slug !== unit.slug);
  const nextUnit = suggestNextUnit(others, progressRows, (profile.data?.cefr_level as string | null) ?? null);
  const previewOnly = access.isAdmin && !access.flagOn;

  return (
    <AnimatedPage className="mx-auto w-full max-w-[960px] px-4 md:px-6 pt-6 pb-24 lg:pb-12">
      <Link href="/kursus" className="inline-flex items-center gap-2 min-h-[44px] text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Semua unit
      </Link>

      <header className="mt-1 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <Eyebrow>Unit {unit.sort_order} · Level {unit.cefr_level}</Eyebrow>
          {previewOnly && <Badge tone="muted">Pratinjau admin</Badge>}
          {access.isAdmin && unit.status === "draft" && <Badge tone="muted">Draft</Badge>}
        </div>
        <h1 className="font-serif text-[28px] md:text-4xl font-medium leading-[1.15] text-foreground mt-1">{unit.title}</h1>
        {unit.intro_id && <p className="text-muted-foreground mt-2 max-w-xl">{unit.intro_id}</p>}
      </header>

      {views.length === 0 ? (
        <Card><EmptyState title="Unit ini belum punya langkah" description="Admin dapat menyusunnya di Admin → Konten → Kursus." /></Card>
      ) : (
        <UnitPlayer
          unitSlug={unit.slug}
          unitTitle={unit.title}
          views={views}
          startIndex={resumeIndex(progress, views.length)}
          alreadyCompleted={!!progress?.completed_at}
          isAdmin={access.isAdmin}
          nextUnit={nextUnit ? { slug: nextUnit.slug, title: nextUnit.title } : null}
        />
      )}
    </AnimatedPage>
  );
}
