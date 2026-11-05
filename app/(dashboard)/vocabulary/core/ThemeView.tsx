import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { Card, EmptyState } from "@/components/ui/primitives";
import { coreStatus, type CoreStatus } from "@/lib/core-words";
import { themeLabel } from "@/lib/core-themes";
import AddThemeWordsButton from "./AddThemeWordsButton";

type ThemeRow = { word: string; band: number; cefr_estimate: string; pos: string | null; translation_id: string | null };

const STATUS_LABEL: Record<CoreStatus, { text: string; cls: string }> = {
  belum: { text: "Belum", cls: "bg-muted text-muted-foreground" },
  sedang: { text: "Sedang dipelajari", cls: "bg-muted text-foreground " },
  dikuasai: { text: "Dikuasai", cls: "bg-brand-tint text-brand-ink" },
};

/** Tampilan "Per tema" Kosakata Inti (Fase 22.5): kata A1 per tema dengan arti Indonesia. Urutan frekuensi (band) tetap. */
export default async function ThemeView({ theme, userId, themes }: { theme: string; userId: string | undefined; themes: { slug: string; label: string; count: number }[] }) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("core_words")
    .select("word, band, cefr_estimate, pos, translation_id")
    .eq("theme", theme)
    .order("band", { ascending: true })
    .limit(200);
  const words = (error ? [] : data || []) as ThemeRow[];

  const status = new Map<string, CoreStatus>();
  if (userId && words.length > 0) {
    const { data: owned } = await supabase.from("vocabulary").select("word, mastery_level").eq("user_id", userId).in("word", words.map((w) => w.word.toLowerCase()));
    const levels = new Map<string, number>();
    for (const o of owned || []) levels.set(String(o.word).toLowerCase(), o.mastery_level ?? 0);
    for (const w of words) status.set(w.word.toLowerCase(), coreStatus({ word: w.word }, levels));
  }

  const chip = (active: boolean) =>
    `inline-flex items-center min-h-[44px] px-4 rounded-full text-sm font-bold border ${active ? "bg-brand-solid text-on-brand border-brand" : "bg-card text-muted-foreground border-border hover:bg-muted"}`;

  return (
    <>
      <nav aria-label="Pilih tema" className="flex flex-wrap gap-2 mb-6">
        {themes.map((t) => (
          <Link key={t.slug} href={`/vocabulary/core?view=tema&theme=${t.slug}`} aria-current={t.slug === theme ? "page" : undefined} className={chip(t.slug === theme)}>
            {t.label} <span className="ml-1.5 text-xs opacity-80 nums">{t.count}</span>
          </Link>
        ))}
      </nav>

      {words.length === 0 ? (
        <EmptyState title="Tema ini belum punya kata" description="Pilih tema lain di atas." />
      ) : (
        <>
          <Card className="mb-4">
            <p className="text-sm text-muted-foreground mb-3">
              {words.length} kata bertema {themeLabel(theme).toLowerCase()}. Kata yang kamu tambahkan masuk ke Bank Kosakata dan jadwal Review, lengkap dengan arti Indonesia.
            </p>
            <AddThemeWordsButton theme={theme} />
          </Card>
          <ul className="divide-y divide-border bg-card border border-border rounded-card">
            {words.map((w) => {
              const label = STATUS_LABEL[status.get(w.word.toLowerCase()) ?? "belum"];
              return (
                <li key={w.word} className="flex items-start gap-3 px-4 py-3 min-h-[56px]">
                  <div className="min-w-0 flex-1">
                    <p lang="en" className="font-bold text-foreground">
                      {w.word} {w.pos && <span className="text-xs font-normal text-muted-foreground">({w.pos})</span>}
                    </p>
                    {w.translation_id && <p className="text-sm text-foreground/80">{w.translation_id}</p>}
                  </div>
                  <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-muted shrink-0 hidden sm:inline">{w.cefr_estimate}</span>
                  <span className={`text-[11px] font-bold px-2 py-1 rounded-full shrink-0 ${label.cls}`}>{label.text}</span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}
