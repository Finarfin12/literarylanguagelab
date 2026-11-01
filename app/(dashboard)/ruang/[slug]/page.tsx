import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AnimatedPage from "@/components/AnimatedPage";
import { Badge, Eyebrow } from "@/components/ui/primitives";
import { MENU_GROUPS } from "@/lib/menu-config";
import { ROOMS, getRoom, resolveItem } from "@/lib/rooms";
import { loadLearningGoal } from "../_lib/goal";

export function generateStaticParams() {
  return ROOMS.map((r) => ({ slug: r.slug }));
}

export default async function RoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const room = getRoom(slug);
  if (!room) notFound();

  const goal = await loadLearningGoal();
  const menu = MENU_GROUPS.flatMap((g) => g.items);
  // Nomor berlanjut antar bagian (gaya daftar isi)
  const starts = room.sections.map((_, i) => room.sections.slice(0, i).reduce((sum, s) => sum + s.paths.length, 0));

  return (
    <AnimatedPage className="mx-auto w-full max-w-[960px] px-4 md:px-6 pt-6 pb-24 lg:pb-12">
      <Link href="/ruang" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground min-h-[44px]">
        <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Semua ruang
      </Link>

      <header className="mb-8 mt-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Eyebrow active={room.goal === goal && !!goal}>{room.eyebrow}</Eyebrow>
          {room.goal && room.goal === goal && <Badge>Tujuanmu</Badge>}
        </div>
        <h1 className="font-serif text-[28px] md:text-4xl font-medium leading-[1.15] text-foreground mt-1">{room.title}</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">{room.description}</p>
      </header>

      <div className="space-y-10">
        {room.sections.map((section, si) => (
          <section key={section.title} aria-labelledby={`sec-${si}`}>
            <div className="mb-2">
              <Eyebrow>Bagian {si + 1}</Eyebrow>
              <h2 id={`sec-${si}`} className="font-serif text-[22px] md:text-[26px] font-medium leading-[1.2] text-foreground">{section.title}</h2>
              {section.blurb && <p className="text-sm text-muted-foreground mt-1">{section.blurb}</p>}
            </div>
            <ol className="border-t border-rule">
              {section.paths.map((p, pi) => {
                const item = resolveItem(p, menu);
                const n = starts[si] + pi + 1;
                return (
                  <li key={p} className="border-b border-rule">
                    <Link href={item.path} className="flex items-center gap-4 min-h-[64px] py-3 hover:bg-muted/60 transition-colors group px-1">
                      <span className="font-serif text-lg text-muted-foreground w-8 shrink-0 text-right nums" aria-hidden="true">{n}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-semibold text-foreground">{item.name}</span>
                        {item.description && <span className="block text-sm text-muted-foreground leading-snug">{item.description}</span>}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-60 group-hover:opacity-100 shrink-0" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </AnimatedPage>
  );
}
