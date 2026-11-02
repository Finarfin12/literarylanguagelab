"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronRight, Circle, RefreshCw } from "lucide-react";
import { loadGrammarProgressSynced, readDoneSlugs } from "@/lib/grammar-progress";
import { dueGrammarTopics, mergeDoneSlugs } from "@/lib/exercises/review";

export interface TopicSummary {
  slug: string;
  title: string;
  cefr_level: string;
  sort_order: number;
  summary_id: string;
}

export default function TopicList({ topics }: { topics: TopicSummary[] }) {
  const [done, setDone] = useState<Set<string>>(new Set());
  const [due, setDue] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    const slugs = topics.map((t) => t.slug);
    // Membaca localStorage hanya mungkin setelah mount
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sumber data hanya ada di browser
    setDone(new Set(readDoneSlugs(slugs)));
    // Fase 15: database (bila migrasi 0012 sudah dijalankan) menggantikan localStorage; status lama dipindahkan sekali
    loadGrammarProgressSynced(slugs).then((rows) => {
      if (cancelled || rows === null) return;
      setDone(mergeDoneSlugs(rows, []));
      setDue(new Set(dueGrammarTopics(rows, new Date()).map((r) => r.topic_slug)));
    });
    return () => {
      cancelled = true;
    };
  }, [topics]);

  const levels = Array.from(new Set(topics.map((t) => t.cefr_level)));

  return (
    <div className="space-y-8">
      {levels.map((level) => {
        const inLevel = topics.filter((t) => t.cefr_level === level);
        const doneCount = inLevel.filter((t) => done.has(t.slug)).length;
        return (
          <section key={level} aria-labelledby={`lvl-${level}`}>
            <h2 id={`lvl-${level}`} className="flex items-center gap-3 text-lg font-medium font-serif mb-3">
              Level {level}
              <span className="text-xs font-sans font-bold text-muted-foreground">{doneCount}/{inLevel.length} selesai</span>
            </h2>
            <ul className="divide-y divide-border bg-card border border-border rounded-card overflow-hidden">
              {inLevel.map((t) => {
                const isDone = done.has(t.slug);
                const isDue = isDone && due.has(t.slug);
                return (
                  <li key={t.slug}>
                    <Link href={isDue ? `/english-lab/grammar/${t.slug}?review=1` : `/english-lab/grammar/${t.slug}`} className="flex items-center gap-3 px-4 min-h-[64px] py-2 hover:bg-muted transition-colors">
                      {isDone ? <CheckCircle2 className="w-5 h-5 text-brand-ink shrink-0" aria-label="Selesai" /> : <Circle className="w-5 h-5 text-muted-foreground shrink-0" aria-label="Belum selesai" />}
                      <span className="min-w-0 flex-1">
                        <span className="block font-bold text-foreground">{t.sort_order}. {t.title}</span>
                        <span className="block text-xs text-muted-foreground line-clamp-1">{t.summary_id}</span>
                      </span>
                      {isDue && (
                        <span className="inline-flex items-center gap-1 shrink-0 text-xs font-bold px-2 py-1 rounded-full bg-warning-tint text-warning-ink">
                          <RefreshCw className="w-3 h-3" aria-hidden="true" /> Waktunya diulang
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
