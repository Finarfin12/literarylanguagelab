import Link from "next/link";
import { ChevronRight } from "lucide-react";
import AnimatedPage from "@/components/AnimatedPage";
import { Badge, Eyebrow, Card } from "@/components/ui/primitives";
import { ROOMS, visibleSections } from "@/lib/rooms";
import { getRequestUser } from "@/utils/supabase/get-user";
import { getCourseAccess } from "@/lib/course-access";
import { getStudyAccess } from "@/lib/study-access";
import { loadLearningGoal } from "./_lib/goal";

export const metadata = { title: "Ruang · Literary Language Lab" };

export default async function RuangIndexPage() {
  const goal = await loadLearningGoal();
  const { supabase, user } = await getRequestUser();
  const courseAccess = await getCourseAccess(supabase, user?.id);
  const studyAccess = await getStudyAccess(supabase, user?.id);
  // Ruang sesuai tujuan belajar tampil pertama; urutan sisanya tetap
  const learning = ROOMS.filter((r) => r.goal).sort((a, b) => Number(b.goal === goal) - Number(a.goal === goal));
  const others = ROOMS.filter((r) => !r.goal);

  return (
    <AnimatedPage className="mx-auto w-full max-w-[960px] px-4 md:px-6 pt-6 pb-24 lg:pb-12">
      <header className="mb-8">
        <Eyebrow>Perpustakaan</Eyebrow>
        <h1 className="font-serif text-[28px] md:text-4xl font-medium leading-[1.15] text-foreground mt-1">Ruang belajar</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">
          Setiap ruang menyusun alat dalam urutan belajar. Semua ruang terbuka; pilih sesuai yang ingin kamu kerjakan hari ini.
        </p>
      </header>

      <div className="space-y-4">
        {learning.map((room) => {
          const sections = visibleSections(room, courseAccess.visible, studyAccess.visible);
          const count = new Set(sections.flatMap((s) => s.paths)).size;
          return (
            <Link key={room.slug} href={`/ruang/${room.slug}`} className="block group">
              <Card className="transition-colors group-hover:border-brand-solid">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Eyebrow active={room.goal === goal}>{room.eyebrow}</Eyebrow>
                      {room.goal === goal && <Badge>Tujuanmu</Badge>}
                    </div>
                    <h2 className="font-serif text-[22px] md:text-[26px] font-medium leading-[1.2] text-foreground mt-1">{room.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1.5">{room.description}</p>
                    <p className="text-xs text-muted-foreground mt-3 nums">{sections.length} bagian · {count} alat</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 mt-1" aria-hidden="true" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        {others.map((room) => (
          <Link key={room.slug} href={`/ruang/${room.slug}`} className="block group">
            <Card className="h-full transition-colors group-hover:border-brand-solid">
              <Eyebrow>{room.eyebrow}</Eyebrow>
              <h2 className="font-serif text-lg font-medium text-foreground mt-1">{room.title}</h2>
              <p className="text-sm text-muted-foreground mt-1.5">{room.description}</p>
            </Card>
          </Link>
        ))}
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Mencari satu alat tertentu?{" "}
        <Link href="/tools" className="text-brand-ink underline underline-offset-2">Lihat semua alat</Link>.
      </p>
    </AnimatedPage>
  );
}
