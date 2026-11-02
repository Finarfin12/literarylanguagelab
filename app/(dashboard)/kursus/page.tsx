import Link from "next/link";
import { ChevronRight, GraduationCap } from "lucide-react";
import AnimatedPage from "@/components/AnimatedPage";
import { Badge, ButtonLink, Card, EmptyState, Eyebrow, ProgressBar } from "@/components/ui/primitives";
import { getRequestUser } from "@/utils/supabase/get-user";
import { getCourseAccess } from "@/lib/course-access";
import { loadUnitProgress, loadUnits } from "@/lib/course-server";
import { courseSummary, groupByLevel, suggestNextUnit, unitPercent } from "@/lib/course";

export const dynamic = "force-dynamic";
export const metadata = { title: "Kursus Dasar · Literary Language Lab" };

const LEVEL_TITLES: Record<string, string> = { A0: "Level A0 · pra-pemula", A1: "Level A1", A2: "Level A2" };

export default async function KursusPage() {
  const { supabase, user } = await getRequestUser();
  const access = await getCourseAccess(supabase, user?.id);

  // Flag mati: pengguna biasa hanya melihat "Segera hadir"
  if (!access.visible) {
    return (
      <AnimatedPage className="mx-auto w-full max-w-[960px] px-4 md:px-6 pt-6 pb-24 lg:pb-12">
        <Eyebrow>Ruang I</Eyebrow>
        <h1 className="font-serif text-[28px] md:text-4xl font-medium leading-[1.15] text-foreground mt-1">Kursus Dasar</h1>
        <Card className="mt-6">
          <EmptyState
            icon={<GraduationCap className="w-8 h-8" aria-hidden="true" />}
            title="Segera hadir"
            description="Kursus Dasar sedang disiapkan. Sementara itu, mulai dari Grammar Dasar, Kosakata Inti, dan bacaan berjenjang di Ruang I."
            action={<ButtonLink href="/ruang/belajar-dasar" variant="secondary">Buka Ruang I</ButtonLink>}
          />
        </Card>
      </AnimatedPage>
    );
  }

  const [{ available, units }, progress, profile] = await Promise.all([
    loadUnits(supabase),
    user ? loadUnitProgress(supabase, user.id) : Promise.resolve([]),
    user ? supabase.from("profiles").select("cefr_level").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const progressBySlug = new Map(progress.map((p) => [p.unit_slug, p]));
  const summary = courseSummary(units, progress);
  const suggested = suggestNextUnit(units, progress, (profile.data?.cefr_level as string | null) ?? null);
  const previewOnly = access.isAdmin && !access.flagOn;

  return (
    <AnimatedPage className="mx-auto w-full max-w-[960px] px-4 md:px-6 pt-6 pb-24 lg:pb-12">
      <header className="mb-8">
        <div className="flex items-center gap-2 flex-wrap">
          <Eyebrow>Ruang I</Eyebrow>
          {previewOnly && <Badge tone="muted">Pratinjau admin</Badge>}
        </div>
        <h1 className="font-serif text-[28px] md:text-4xl font-medium leading-[1.15] text-foreground mt-1">Kursus Dasar</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">
          Unit bertema dari A0 sampai A2. Setiap unit berisi langkah berurutan: kosakata, pola grammar, bacaan, dengar, latihan, dan bicara.
          Tidak ada yang dikunci; unit berikutnya hanya disarankan.
        </p>
        {previewOnly && (
          <p className="text-sm text-warning-ink bg-warning-tint border border-warning-ink/30 rounded-control p-3 mt-4">
            Kursus ini masih tersembunyi dari pengguna lain. Nyalakan flag <code>kursus_dasar</code> di Admin → Fitur bila kontennya sudah siap.
          </p>
        )}
      </header>

      {!available ? (
        <Card>
          <EmptyState
            icon={<GraduationCap className="w-8 h-8" aria-hidden="true" />}
            title="Unit belum tersedia"
            description="Migrasi 0013_course_units.sql belum dijalankan di Supabase."
          />
        </Card>
      ) : units.length === 0 ? (
        <Card><EmptyState icon={<GraduationCap className="w-8 h-8" aria-hidden="true" />} title="Belum ada unit" description="Admin dapat menambah unit di Admin → Konten → Kursus." /></Card>
      ) : (
        <>
          {suggested && (
            <Card className="border-brand-solid/40 bg-brand-tint/40 mb-8">
              <Eyebrow active className="mb-2">Disarankan untukmu</Eyebrow>
              <p className="font-serif text-[22px] md:text-[26px] font-medium leading-[1.2] text-foreground">{suggested.title}</p>
              <p className="text-sm text-muted-foreground mt-2 max-w-xl">{suggested.intro_id}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <ButtonLink href={`/kursus/${suggested.slug}`}>
                  {(progressBySlug.get(suggested.slug)?.step_index ?? 0) > 0 ? "Lanjutkan unit" : "Mulai unit"}
                </ButtonLink>
                <span className="text-xs text-muted-foreground nums">{summary.completed} dari {summary.total} unit selesai</span>
              </div>
            </Card>
          )}

          <div className="space-y-10">
            {groupByLevel(units).map(({ level, units: group }) => (
              <section key={level} aria-labelledby={`lvl-${level}`}>
                <h2 id={`lvl-${level}`} className="font-serif text-[22px] md:text-[26px] font-medium leading-[1.2] text-foreground mb-3">
                  {LEVEL_TITLES[level] ?? `Level ${level}`}
                </h2>
                <ul className="border-t border-rule">
                  {group.map((u) => {
                    const p = progressBySlug.get(u.slug);
                    const pct = unitPercent(p?.step_index ?? 0, u.steps.length, !!p?.completed_at);
                    const incomplete = u.ready_steps < u.steps.length;
                    return (
                      <li key={u.slug} className="border-b border-rule">
                        <Link href={`/kursus/${u.slug}`} className="flex items-center gap-4 min-h-[72px] py-3 px-1 hover:bg-muted/60 transition-colors group">
                          <span className="font-serif text-lg text-muted-foreground w-8 shrink-0 text-right nums" aria-hidden="true">{u.sort_order}</span>
                          <span className="flex-1 min-w-0">
                            <span className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-foreground">{u.title}</span>
                              {p?.completed_at && <Badge>Selesai</Badge>}
                              {access.isAdmin && u.status === "draft" && <Badge tone="muted">Draft</Badge>}
                              {access.isAdmin && incomplete && <Badge tone="muted">Konten belum lengkap</Badge>}
                            </span>
                            <span className="block text-sm text-muted-foreground leading-snug line-clamp-2">{u.intro_id}</span>
                            {pct > 0 && <ProgressBar value={pct} label={`Kemajuan ${u.title}`} className="mt-2 max-w-xs" />}
                          </span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground opacity-60 group-hover:opacity-100 shrink-0" aria-hidden="true" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </>
      )}
    </AnimatedPage>
  );
}
