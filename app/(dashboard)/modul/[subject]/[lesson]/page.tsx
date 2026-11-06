import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, ExternalLink, Wrench } from "lucide-react";
import AnimatedPage from "@/components/AnimatedPage";
import { Badge, Card, CardTitle, EmptyState, Eyebrow } from "@/components/ui/primitives";
import ExerciseSession from "@/components/exercises/ExerciseSession";
import LessonMarkdown from "@/components/study/LessonMarkdown";
import { LessonCompanion, LessonFooter, TaskBox } from "@/components/study/LessonActions";
import StudyDisclaimer from "@/components/study/StudyDisclaimer";
import { getRequestUser } from "@/utils/supabase/get-user";
import { getStudyAccess } from "@/lib/study-access";
import { countLessonExercises, loadCompletedLessons, loadLesson, loadStudyIndex, loadTask } from "@/lib/study-server";
import { lessonsOf, nextLesson } from "@/lib/study";
import { resolveItem } from "@/lib/rooms";
import { MENU_GROUPS } from "@/lib/menu-config";

export const dynamic = "force-dynamic";

export default async function LessonPage({ params }: { params: Promise<{ subject: string; lesson: string }> }) {
  const { subject: subjectSlug, lesson: lessonSlug } = await params;
  const { supabase, user } = await getRequestUser();
  const access = await getStudyAccess(supabase, user?.id);

  if (!access.visible) {
    return (
      <AnimatedPage className="mx-auto w-full max-w-[960px] px-4 md:px-6 pt-6 pb-24">
        <Card><EmptyState title="Segera hadir" description="Modul Belajar sedang disiapkan." /></Card>
      </AnimatedPage>
    );
  }

  const [{ available, lesson }, index] = await Promise.all([loadLesson(supabase, lessonSlug), loadStudyIndex(supabase)]);
  if (!available || !index.available) {
    return (
      <AnimatedPage className="mx-auto w-full max-w-[960px] px-4 md:px-6 pt-6 pb-24">
        <Card><EmptyState title="Modul Belajar belum tersedia" description="Migrasi 0023_study_modules.sql belum dijalankan." /></Card>
      </AnimatedPage>
    );
  }
  if (!lesson || lesson.subject_slug !== subjectSlug) notFound();
  const subject = index.subjects.find((s) => s.slug === subjectSlug);
  if (!subject) notFound();

  const completedSet = user ? await loadCompletedLessons(supabase, user.id) : new Set<string>();
  const [task, exerciseCount] = await Promise.all([user && lesson.task ? loadTask(supabase, user.id, lesson.slug) : Promise.resolve(""), countLessonExercises(supabase, lesson.slug)]);

  const position = lessonsOf(index.lessons, subjectSlug).findIndex((l) => l.slug === lesson.slug) + 1;
  const total = lessonsOf(index.lessons, subjectSlug).length;
  const next = nextLesson(index.subjects, index.lessons, completedSet, lesson.slug);
  const menu = MENU_GROUPS.flatMap((g) => g.items);
  const tools = lesson.tool_paths.map((p) => resolveItem(p, menu));
  const previewOnly = access.isAdmin && lesson.status === "draft";

  return (
    <AnimatedPage className="mx-auto w-full max-w-[860px] px-4 md:px-6 pt-6 pb-24 lg:pb-12">
      <Link href={`/modul/${subjectSlug}`} className="inline-flex items-center gap-2 min-h-[44px] text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" aria-hidden="true" /> {subject.title}
      </Link>

      <header className="mt-1 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <Eyebrow>Pelajaran {position} dari {total}</Eyebrow>
          {previewOnly && <Badge tone="muted">Draf (pratinjau admin)</Badge>}
        </div>
        <h1 className="font-serif text-[28px] md:text-[38px] font-medium leading-[1.15] text-foreground mt-1">{lesson.title}</h1>
      </header>

      {lesson.objectives.length > 0 && (
        <Card className="mb-8">
          <p className="font-bold text-foreground mb-2">Tujuan pelajaran</p>
          <ul className="list-disc pl-5 space-y-1 text-foreground">
            {lesson.objectives.map((o) => <li key={o}>{o}</li>)}
          </ul>
        </Card>
      )}

      <article aria-label="Isi pelajaran">
        <LessonMarkdown>{lesson.body_md}</LessonMarkdown>
      </article>

      <div className="mt-10 space-y-6">
        {exerciseCount > 0 && (
          <section aria-labelledby="latihan">
            <h2 id="latihan" className="sr-only">Latihan</h2>
            <ExerciseSession lessonSlug={lesson.slug} count={Math.min(exerciseCount, 8)} title="Latihan pelajaran" />
          </section>
        )}

        {lesson.summary_md.trim() && (
          <Card>
            <CardTitle>Rangkuman</CardTitle>
            <LessonMarkdown>{lesson.summary_md}</LessonMarkdown>
          </Card>
        )}

        {lesson.task && <TaskBox lessonSlug={lesson.slug} prompt={lesson.task.prompt} initial={task} />}

        {lesson.sources.length > 0 && (
          <Card>
            <CardTitle>Sumber dan bacaan lanjutan</CardTitle>
            <ul className="space-y-2 text-sm">
              {lesson.sources.map((s) => (
                <li key={`${s.title}-${s.url ?? ""}`} className="flex items-start gap-2">
                  <span className="min-w-0">
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-brand-ink underline underline-offset-2">
                        {s.title} <ExternalLink className="inline w-3 h-3" aria-hidden="true" />
                      </a>
                    ) : (
                      <span className="text-foreground">{s.title}</span>
                    )}
                    {s.note && <span className="block text-muted-foreground">{s.note}</span>}
                  </span>
                  {s.status === "perlu-cek" && (
                    <span className="shrink-0 inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full bg-warning-tint text-warning-ink">
                      <AlertTriangle className="w-3 h-3" aria-hidden="true" /> Perlu dicek
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {tools.length > 0 && (
          <Card>
            <CardTitle icon={<Wrench className="w-5 h-5 text-brand-ink" />}>Praktikkan (opsional)</CardTitle>
            <p className="text-sm text-muted-foreground -mt-2 mb-3">Pelajaran ini sudah lengkap tanpa alat. Alat di bawah hanya untuk berlatih lebih jauh.</p>
            <ul className="flex flex-wrap gap-2">
              {tools.map((t) => (
                <li key={t.path}>
                  <Link href={t.path} className="inline-flex items-center min-h-[44px] px-4 rounded-control border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted">{t.name}</Link>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <LessonCompanion lessonSlug={lesson.slug} />

        <LessonFooter
          lessonSlug={lesson.slug}
          completed={completedSet.has(lesson.slug)}
          next={next ? { href: `/modul/${next.subject_slug}/${next.slug}`, title: next.title } : null}
          subjectHref={`/modul/${subjectSlug}`}
        />
      </div>

      <StudyDisclaimer />
    </AnimatedPage>
  );
}
