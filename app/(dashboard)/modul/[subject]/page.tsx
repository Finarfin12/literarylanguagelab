import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Circle } from "lucide-react";
import AnimatedPage from "@/components/AnimatedPage";
import { Badge, Card, EmptyState, Eyebrow, ProgressBar } from "@/components/ui/primitives";
import ExerciseSession from "@/components/exercises/ExerciseSession";
import StudyDisclaimer from "@/components/study/StudyDisclaimer";
import { getRequestUser } from "@/utils/supabase/get-user";
import { getStudyAccess } from "@/lib/study-access";
import { countQuizExercises, loadCompletedLessons, loadStudyIndex } from "@/lib/study-server";
import { STAGE_LABELS, isStage, lessonsOf, subjectComplete, subjectProgress } from "@/lib/study";

export const dynamic = "force-dynamic";

export default async function SubjectPage({ params }: { params: Promise<{ subject: string }> }) {
  const { subject: slug } = await params;
  const { supabase, user } = await getRequestUser();
  const access = await getStudyAccess(supabase, user?.id);

  if (!access.visible) {
    return (
      <AnimatedPage className="mx-auto w-full max-w-[960px] px-4 md:px-6 pt-6 pb-24">
        <Card><EmptyState title="Segera hadir" description="Modul Belajar sedang disiapkan." /></Card>
      </AnimatedPage>
    );
  }

  const index = await loadStudyIndex(supabase);
  if (!index.available) {
    return (
      <AnimatedPage className="mx-auto w-full max-w-[960px] px-4 md:px-6 pt-6 pb-24">
        <Card><EmptyState title="Modul Belajar belum tersedia" description="Migrasi 0023_study_modules.sql belum dijalankan." /></Card>
      </AnimatedPage>
    );
  }
  const subject = index.subjects.find((s) => s.slug === slug);
  if (!subject) notFound();

  const completed = user ? await loadCompletedLessons(supabase, user.id) : new Set<string>();
  const lessons = lessonsOf(index.lessons, slug);
  const progress = subjectProgress(index.lessons, slug, completed);
  const quizCount = await countQuizExercises(supabase, slug);
  const firstOpen = lessons.find((l) => !completed.has(l.slug)) ?? lessons[0];
  const allDone = subjectComplete(index.lessons, slug, completed);

  return (
    <AnimatedPage className="mx-auto w-full max-w-[960px] px-4 md:px-6 pt-6 pb-24 lg:pb-12">
      <Link href="/modul" className="inline-flex items-center gap-2 min-h-[44px] text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Semua mata pelajaran
      </Link>

      <header className="mt-1 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <Eyebrow>Tahap {isStage(subject.stage) ? STAGE_LABELS[subject.stage] : subject.stage}</Eyebrow>
          {subject.status === "draft" && <Badge tone="muted">Draf</Badge>}
        </div>
        <h1 className="font-serif text-[28px] md:text-4xl font-medium leading-[1.15] text-foreground mt-1">{subject.title}</h1>
        {subject.description_id && <p className="text-muted-foreground mt-2 max-w-xl">{subject.description_id}</p>}
        {progress.total > 0 && (
          <div className="mt-4 max-w-sm">
            <ProgressBar value={progress.percent} label={`Progres ${subject.title}`} />
            <p className="text-sm text-muted-foreground mt-1 nums">{progress.done} dari {progress.total} pelajaran selesai</p>
          </div>
        )}
      </header>

      {subject.outcomes.length > 0 && (
        <Card className="mb-6">
          <p className="font-bold text-foreground mb-2">Setelah mempelajari ini, kamu bisa</p>
          <ul className="list-disc pl-5 space-y-1 text-foreground">
            {subject.outcomes.map((o) => <li key={o}>{o}</li>)}
          </ul>
        </Card>
      )}

      {lessons.length === 0 ? (
        <Card><EmptyState title="Pelajaran belum tersedia" description="Pelajaran untuk mata pelajaran ini sedang disiapkan." /></Card>
      ) : (
        <>
          <h2 className="font-serif text-xl font-medium text-foreground mb-3">Pelajaran</h2>
          <ol className="divide-y divide-border bg-card border border-border rounded-card overflow-hidden mb-4">
            {lessons.map((l, i) => {
              const done = completed.has(l.slug);
              return (
                <li key={l.slug}>
                  <Link href={`/modul/${slug}/${l.slug}`} className="flex items-center gap-3 px-4 min-h-[60px] py-2 hover:bg-muted transition-colors">
                    {done ? <CheckCircle2 className="w-5 h-5 text-brand-ink shrink-0" aria-label="Selesai" /> : <Circle className="w-5 h-5 text-muted-foreground shrink-0" aria-label="Belum selesai" />}
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs text-muted-foreground">Pelajaran {i + 1}</span>
                      <span className="block font-bold text-foreground">{l.title}</span>
                    </span>
                    {l.status === "draft" && <Badge tone="muted">Draf</Badge>}
                  </Link>
                </li>
              );
            })}
          </ol>
          {firstOpen && (
            <Link href={`/modul/${slug}/${firstOpen.slug}`} className="inline-flex items-center gap-2 min-h-[44px] font-semibold text-brand-ink">
              {progress.done > 0 ? "Lanjutkan" : "Mulai"}: {firstOpen.title} <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          )}
        </>
      )}

      {quizCount > 0 && (
        <section className="mt-10" aria-labelledby="kuis-akhir">
          <h2 id="kuis-akhir" className="font-serif text-xl font-medium text-foreground mb-1">Kuis akhir</h2>
          <p className="text-sm text-muted-foreground mb-3">
            {allDone ? "Semua pelajaran selesai. Uji pemahamanmu." : "Boleh dikerjakan kapan saja, tetapi lebih berguna setelah semua pelajaran selesai."}
          </p>
          <ExerciseSession subjectSlug={slug} quiz count={10} title={`Kuis akhir: ${subject.title}`} />
        </section>
      )}

      <StudyDisclaimer />
    </AnimatedPage>
  );
}
