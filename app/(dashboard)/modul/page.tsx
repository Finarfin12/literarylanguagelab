import Link from "next/link";
import { ArrowRight, GraduationCap } from "lucide-react";
import AnimatedPage from "@/components/AnimatedPage";
import { Badge, Card, EmptyState, Eyebrow, ProgressBar } from "@/components/ui/primitives";
import StudyDisclaimer from "@/components/study/StudyDisclaimer";
import { getRequestUser } from "@/utils/supabase/get-user";
import { getStudyAccess } from "@/lib/study-access";
import { loadCompletedLessons, loadStudyIndex } from "@/lib/study-server";
import { STAGE_BLURBS, STAGE_LABELS, groupByStage, stageProgress, subjectProgress, suggestedLesson, type Stage } from "@/lib/study";

export const dynamic = "force-dynamic";

export const metadata = { title: "Modul Belajar · Literary Language Lab" };

/** Modul Belajar (Fase 24.3): tahap → mata pelajaran, dengan progres dan pelajaran yang disarankan. Tidak ada yang dikunci. */
export default async function ModulPage() {
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

  const completed = user ? await loadCompletedLessons(supabase, user.id) : new Set<string>();
  const groups = groupByStage(index.subjects);
  const next = suggestedLesson(index.subjects, index.lessons, completed);
  const nextSubject = next ? index.subjects.find((s) => s.slug === next.subject_slug) : null;
  const previewOnly = access.isAdmin && !access.flagOn;

  return (
    <AnimatedPage className="mx-auto w-full max-w-[960px] px-4 md:px-6 pt-6 pb-24 lg:pb-12">
      <header className="mb-8">
        <div className="flex items-center gap-2 flex-wrap">
          <Eyebrow>Belajar mandiri</Eyebrow>
          {previewOnly && <Badge tone="muted">Pratinjau admin</Badge>}
        </div>
        <h1 className="font-serif text-[28px] md:text-4xl font-medium leading-[1.15] text-foreground mt-1 flex items-center gap-3">
          <GraduationCap className="w-7 h-7 text-brand-ink" aria-hidden="true" /> Modul Belajar
        </h1>
        <p className="text-muted-foreground mt-2 max-w-xl">
          Pelajaran lengkap per mata pelajaran: penjelasan, contoh, latihan, rangkuman, dan tugas. Bisa dipelajari tanpa membuka alat lain.
        </p>
      </header>

      {next && nextSubject && (
        <Card className="mb-8 border-brand-solid/40 bg-brand-tint/40">
          <Eyebrow active className="mb-2">{completed.size > 0 ? "Lanjutkan belajar" : "Mulai dari sini"}</Eyebrow>
          <p className="font-serif text-[22px] font-medium leading-[1.2] text-foreground">{next.title}</p>
          <p className="text-sm text-muted-foreground mt-1">{nextSubject.title}</p>
          <Link href={`/modul/${next.subject_slug}/${next.slug}`} className="mt-4 inline-flex items-center gap-2 min-h-[44px] font-semibold text-brand-ink">
            Buka pelajaran <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </Card>
      )}

      {groups.length === 0 ? (
        <Card><EmptyState title="Belum ada mata pelajaran" description="Mata pelajaran sedang disiapkan dan belum diterbitkan." /></Card>
      ) : (
        <div className="space-y-10">
          {groups.map((g) => {
            const sp = stageProgress(index.subjects, index.lessons, g.stage as Stage, completed);
            return (
              <section key={g.stage} aria-labelledby={`tahap-${g.stage}`}>
                <div className="flex items-end justify-between gap-3 flex-wrap">
                  <div>
                    <Eyebrow>Tahap</Eyebrow>
                    <h2 id={`tahap-${g.stage}`} className="font-serif text-2xl font-medium text-foreground">{STAGE_LABELS[g.stage]}</h2>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xl">{STAGE_BLURBS[g.stage]}</p>
                  </div>
                  {sp.total > 0 && <p className="text-sm font-semibold text-muted-foreground nums">{sp.done} dari {sp.total} pelajaran selesai</p>}
                </div>
                <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {g.subjects.map((s) => {
                    const p = subjectProgress(index.lessons, s.slug, completed);
                    return (
                      <li key={s.slug}>
                        <Link href={`/modul/${s.slug}`} className="block h-full p-5 rounded-card border border-border bg-card hover:border-brand-solid transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-serif text-xl font-medium leading-tight text-foreground">{s.title}</p>
                            {s.status === "draft" && <Badge tone="muted">Draf</Badge>}
                          </div>
                          {s.description_id && <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{s.description_id}</p>}
                          <div className="mt-4">
                            {p.total > 0 ? (
                              <>
                                <ProgressBar value={p.percent} label={`Progres ${s.title}`} />
                                <p className="text-xs text-muted-foreground mt-1 nums">{p.done} dari {p.total} pelajaran selesai</p>
                              </>
                            ) : (
                              <p className="text-xs text-muted-foreground">Pelajaran belum tersedia.</p>
                            )}
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <StudyDisclaimer />
    </AnimatedPage>
  );
}
