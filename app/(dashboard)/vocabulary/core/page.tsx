import Link from "next/link";
import { BookMarked } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import AnimatedPage from "@/components/AnimatedPage";
import { Card, EmptyState } from "@/components/ui/primitives";
import { isCefrLevel } from "@/lib/cefr";
import { coreStatus, wordCandidates, type CoreStatus } from "@/lib/core-words";
import AddWordsButton from "./AddWordsButton";
import ThemeView from "./ThemeView";
import { countThemes } from "@/lib/core-themes";

const PAGE_SIZE = 50;
const LEVELS = ["A1", "A2", "B1", "B2"] as const;

type WordStatus = CoreStatus;

// Kolom definition_en/forms dari migrasi 0015 (opsional sampai migrasi dijalankan)
type CoreRow = {
  word: string;
  band: number;
  cefr_estimate: string;
  pos: string | null;
  example: string | null;
  definition_en?: string | null;
  forms?: string[] | null;
};

const BASE_COLUMNS = "word, band, cefr_estimate, pos, example";
const ENRICHED_COLUMNS = `${BASE_COLUMNS}, definition_en, forms`;
const STATUS_LABEL: Record<WordStatus, { text: string; cls: string }> = {
  belum: { text: "Belum", cls: "bg-muted text-muted-foreground" },
  sedang: { text: "Sedang dipelajari", cls: "bg-muted text-foreground " },
  dikuasai: { text: "Dikuasai", cls: "bg-brand-tint text-brand-ink" },
};

export default async function CoreWordsPage({ searchParams }: { searchParams: Promise<{ level?: string; page?: string; view?: string; theme?: string }> }) {
  const supabase = await createClient();
  const params = await searchParams;
  const { data: { user } } = await supabase.auth.getUser();

  // Level default = level pengguna jika termasuk A1-B2, selain itu A1
  let userLevel: string | null = null;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("cefr_level").eq("id", user.id).maybeSingle();
    userLevel = (profile?.cefr_level as string | null) ?? null;
  }
  const requested = params.level === "all" ? "all" : isCefrLevel(params.level) && (LEVELS as readonly string[]).includes(params.level) ? params.level : null;
  const level = requested ?? (userLevel && (LEVELS as readonly string[]).includes(userLevel) ? userLevel : "A1");
  const page = Math.max(1, Number(params.page) || 1);

  // Fase 22.5: tab "Per tema" hanya muncul bila ada kata bertema (migrasi 0022 + CSV dari pemilik); tanpa itu halaman tidak berubah
  const themeRes = await supabase.from("core_words").select("theme").not("theme", "is", null).limit(3000);
  const themes = themeRes.error ? [] : countThemes((themeRes.data || []) as { theme: string | null }[]);
  const showThemes = params.view === "tema" && themes.length > 0;
  const activeTheme = showThemes ? (themes.find((t) => t.slug === params.theme)?.slug ?? themes[0].slug) : null;

  const fetchWords = (columns: string) => {
    let q = supabase
      .from("core_words")
      .select(columns, { count: "exact" })
      .order("band", { ascending: true })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    if (level !== "all") q = q.eq("cefr_estimate", level);
    return q;
  };
  let res = await fetchWords(ENRICHED_COLUMNS);
  // Migrasi 0015 belum dijalankan: ambil ulang tanpa kolom baru (tampilan lama)
  if (res.error && (res.error.code === "42703" || res.error.code === "PGRST204")) res = await fetchWords(BASE_COLUMNS);
  const { count, error } = res;
  const words = (res.data ?? null) as unknown as CoreRow[] | null;

  const notReady = error && (error.code === "42P01" || error.code === "PGRST205");
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Status per kata dari Vocabulary Bank pengguna; kata simpanan dalam bentuk lain ("searched") dihitung untuk "search"
  const status = new Map<string, WordStatus>();
  if (user && words && words.length > 0) {
    const candidates = Array.from(new Set(words.flatMap((w) => wordCandidates(w))));
    const { data: owned } = await supabase
      .from("vocabulary")
      .select("word, mastery_level")
      .eq("user_id", user.id)
      .in("word", candidates);
    const ownedLevels = new Map<string, number>();
    for (const o of owned || []) ownedLevels.set(String(o.word).toLowerCase(), o.mastery_level ?? 0);
    for (const w of words) status.set(String(w.word).toLowerCase(), coreStatus(w, ownedLevels));
  }

  const href = (l: string, p = 1) => `/vocabulary/core?level=${l}${p > 1 ? `&page=${p}` : ""}`;
  const chip = (active: boolean) =>
    `inline-flex items-center min-h-[44px] px-4 rounded-full text-sm font-bold border ${active ? "bg-brand-solid text-on-brand border-brand" : "bg-card text-muted-foreground border-border hover:bg-muted"}`;

  return (
    <AnimatedPage className="p-4 lg:p-8 max-w-4xl mx-auto pb-24">
      <div className="mb-6">
        <h1 className="text-[28px] md:text-4xl leading-[1.15] font-serif font-medium text-foreground flex items-center gap-3">
          <BookMarked className="w-7 h-7 text-brand-ink" /> Kosakata Inti
        </h1>
        <p className="text-muted-foreground mt-2">
          Kata-kata paling sering dipakai dalam bahasa Inggris sehari-hari. Kuasai dari level terendah, lalu tambahkan ke Review.
        </p>
      </div>

      {themes.length > 0 && (
        <nav aria-label="Tampilan kosakata" className="flex flex-wrap gap-2 mb-4">
          <Link href={href(level)} aria-current={!showThemes ? "page" : undefined} className={chip(!showThemes)}>Per level</Link>
          <Link href="/vocabulary/core?view=tema" aria-current={showThemes ? "page" : undefined} className={chip(showThemes)}>Per tema</Link>
        </nav>
      )}

      {showThemes && activeTheme ? (
        <ThemeView theme={activeTheme} userId={user?.id} themes={themes} />
      ) : (
      <>
      <nav aria-label="Filter level" className="flex flex-wrap gap-2 mb-6">
        {LEVELS.map((l) => (
          <Link key={l} href={href(l)} className={chip(level === l)}>{l}</Link>
        ))}
        <Link href={href("all")} className={chip(level === "all")}>Semua</Link>
      </nav>

      {notReady || (words && words.length === 0 && total === 0) ? (
        <EmptyState
          icon={<BookMarked className="w-8 h-8" />}
          title="Daftar kosakata inti belum tersedia"
          description={notReady ? "Migrasi 0007 belum dijalankan." : "Admin perlu mengimpor daftar NGSL terlebih dahulu (scripts/import-ngsl.mjs)."}
        />
      ) : (
        <>
          <Card className="mb-4">
            <p className="text-sm text-muted-foreground mb-3">
              {total} kata{level !== "all" ? ` di level ${level}` : ""}. Kata yang kamu tambahkan masuk ke Bank Kosakata dan jadwal Review.
            </p>
            <AddWordsButton level={level} />
          </Card>

          <ul className="divide-y divide-border bg-card border border-border rounded-card">
            {(words || []).map((w) => {
              const st = status.get(String(w.word).toLowerCase()) ?? "belum";
              const label = STATUS_LABEL[st];
              return (
                <li key={w.word} className="flex items-start gap-3 px-4 py-3 min-h-[56px]">
                  <span className="w-12 shrink-0 text-xs text-muted-foreground pt-1">#{w.band}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-foreground">
                      {w.word} {w.pos && <span className="text-xs font-normal text-muted-foreground">({w.pos})</span>}
                    </p>
                    {w.definition_en && <p className="text-sm text-foreground/80">{w.definition_en}</p>}
                    {w.example && <p className="text-sm text-muted-foreground italic">{w.example}</p>}
                  </div>
                  <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-muted shrink-0 hidden sm:inline">{w.cefr_estimate}</span>
                  <span className={`text-[11px] font-bold px-2 py-1 rounded-full shrink-0 ${label.cls}`}>{label.text}</span>
                </li>
              );
            })}
          </ul>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              {page > 1 ? <Link href={href(level, page - 1)} className={chip(false)}>Sebelumnya</Link> : <span />}
              <span className="text-sm text-muted-foreground">Halaman {page} dari {totalPages}</span>
              {page < totalPages ? <Link href={href(level, page + 1)} className={chip(false)}>Berikutnya</Link> : <span />}
            </div>
          )}
        </>
      )}
      </>
      )}
    </AnimatedPage>
  );
}
