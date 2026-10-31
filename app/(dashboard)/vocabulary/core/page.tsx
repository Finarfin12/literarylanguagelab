import Link from "next/link";
import { BookMarked } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import AnimatedPage from "@/components/AnimatedPage";
import { Card, EmptyState } from "@/components/ui/primitives";
import { isCefrLevel } from "@/lib/cefr";
import AddWordsButton from "./AddWordsButton";

const PAGE_SIZE = 50;
const LEVELS = ["A1", "A2", "B1", "B2"] as const;

type WordStatus = "belum" | "sedang" | "dikuasai";
const STATUS_LABEL: Record<WordStatus, { text: string; cls: string }> = {
  belum: { text: "Belum", cls: "bg-muted text-muted-foreground" },
  sedang: { text: "Sedang dipelajari", cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  dikuasai: { text: "Dikuasai", cls: "bg-brand/10 text-brand" },
};

export default async function CoreWordsPage({ searchParams }: { searchParams: Promise<{ level?: string; page?: string }> }) {
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

  let q = supabase
    .from("core_words")
    .select("word, band, cefr_estimate, pos, example", { count: "exact" })
    .order("band", { ascending: true })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (level !== "all") q = q.eq("cefr_estimate", level);
  const { data: words, count, error } = await q;

  const notReady = error && (error.code === "42P01" || error.code === "PGRST205");
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Status per kata dari Vocabulary Bank pengguna
  const status = new Map<string, WordStatus>();
  if (user && words && words.length > 0) {
    const { data: owned } = await supabase
      .from("vocabulary")
      .select("word, mastery_level")
      .eq("user_id", user.id)
      .in("word", words.map((w) => w.word));
    for (const o of owned || []) {
      status.set(String(o.word).toLowerCase(), (o.mastery_level ?? 0) >= 3 ? "dikuasai" : "sedang");
    }
  }

  const href = (l: string, p = 1) => `/vocabulary/core?level=${l}${p > 1 ? `&page=${p}` : ""}`;
  const chip = (active: boolean) =>
    `inline-flex items-center min-h-[44px] px-4 rounded-full text-sm font-bold border ${active ? "bg-brand text-background border-brand" : "bg-card text-muted-foreground border-border hover:bg-muted"}`;

  return (
    <AnimatedPage className="p-4 lg:p-8 max-w-4xl mx-auto pb-24">
      <div className="mb-6">
        <h1 className="text-2xl md:text-4xl font-serif font-bold text-foreground flex items-center gap-3">
          <BookMarked className="w-7 h-7 text-brand" /> Kosakata Inti
        </h1>
        <p className="text-muted-foreground mt-2">
          Kata-kata paling sering dipakai dalam bahasa Inggris sehari-hari. Kuasai dari level terendah, lalu tambahkan ke Review.
        </p>
      </div>

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

          <ul className="divide-y divide-border bg-card border border-border rounded-2xl">
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
    </AnimatedPage>
  );
}
