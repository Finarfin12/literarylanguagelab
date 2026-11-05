"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, PartyPopper } from "lucide-react";
import { Button, ButtonLink, Card, EmptyState, ProgressBar } from "@/components/ui/primitives";
import { STEP_LABELS, stepTitle, unitPercent } from "@/lib/course";
import type { StepView } from "./types";
import { ExerciseStep, GrammarStep, ListenStep, ReadStep, SpeakStep, VocabStep } from "./StepViews";

/**
 * Pemutar unit: langkah berurutan, tetapi bebas berpindah (tidak ada yang dikunci). "Selesai, lanjut" menyimpan
 * kemajuan ke database; langkah placeholder (konten belum ada) ditandai dan bisa dilewati.
 */
export default function UnitPlayer({
  unitSlug,
  unitTitle,
  views,
  startIndex,
  alreadyCompleted,
  isAdmin,
  nextUnit,
}: {
  unitSlug: string;
  unitTitle: string;
  views: StepView[];
  startIndex: number;
  alreadyCompleted: boolean;
  isAdmin: boolean;
  nextUnit: { slug: string; title: string } | null;
}) {
  const [index, setIndex] = useState(startIndex);
  const [finished, setFinished] = useState(false);
  const [saved, setSaved] = useState(alreadyCompleted ? views.length : startIndex);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const view = views[index];
  const last = index === views.length - 1;
  const percent = unitPercent(saved, views.length, alreadyCompleted || finished);

  const complete = async () => {
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/course/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unit_slug: unitSlug, step: index }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan kemajuan.");
      setSaved(data.step_index);
      if (last) setFinished(true);
      else setIndex(index + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan kemajuan.");
    } finally {
      setSaving(false);
    }
  };

  if (finished) {
    return (
      <Card>
        <EmptyState
          icon={<PartyPopper className="w-8 h-8" aria-hidden="true" />}
          title={`Unit selesai: ${unitTitle}`}
          description="Kemajuanmu sudah tersimpan. Kamu bisa membuka ulang langkah mana pun kapan saja."
          action={
            <div className="flex flex-wrap items-center justify-center gap-3">
              {nextUnit && <ButtonLink href={`/kursus/${nextUnit.slug}`}>Berikutnya: {nextUnit.title}</ButtonLink>}
              <ButtonLink href="/kursus" variant="secondary">Semua unit</ButtonLink>
              <Button variant="ghost" onClick={() => { setFinished(false); setIndex(0); }}>Ulangi dari awal</Button>
            </div>
          }
        />
      </Card>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs font-bold text-muted-foreground mb-2">
        <span>Langkah {index + 1} dari {views.length}</span>
        <span className="nums">{percent}% selesai</span>
      </div>
      <ProgressBar value={percent} label={`Kemajuan ${unitTitle}`} className="mb-4" />

      {/* Daftar langkah: bebas berpindah */}
      <nav aria-label="Langkah unit" className="mb-5 -mx-1 overflow-x-auto scrollbar-none">
        <ol className="flex gap-2 px-1 pb-1">
          {views.map((v, i) => {
            const isCurrent = i === index;
            const isDone = i < saved;
            return (
              <li key={i} className="shrink-0">
                <button
                  type="button"
                  onClick={() => { setIndex(i); setError(""); }}
                  aria-current={isCurrent ? "step" : undefined}
                  className={`inline-flex items-center gap-2 min-h-[44px] px-3 rounded-control border text-sm font-semibold whitespace-nowrap transition-colors ${
                    isCurrent ? "border-brand bg-brand-tint text-brand-ink" : "border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" aria-label="Selesai" /> : <span className="nums" aria-hidden="true">{i + 1}</span>}
                  {STEP_LABELS[v.step.type]}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <Card>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{STEP_LABELS[view.step.type]}</p>
        <h2 className="font-serif text-[22px] md:text-[26px] font-medium leading-[1.2] text-foreground mt-1 mb-4">{stepTitle(view.step)}</h2>

        {view.empty && view.step.type !== "exercise" ? (
          <div className="rounded-control border border-dashed border-border p-5 text-center">
            <p className="font-semibold text-foreground">Konten langkah ini belum tersedia</p>
            <p className="text-sm text-muted-foreground mt-1">Kamu boleh melewatinya dan melanjutkan ke langkah berikutnya.</p>
            {isAdmin && (
              <Link href="/admin/content/course" className="mt-3 inline-flex items-center min-h-[44px] text-sm font-semibold text-brand-ink">
                Isi di Admin → Konten → Kursus
              </Link>
            )}
          </div>
        ) : (
          <>
            {view.step.type === "vocab" && <VocabStep view={view} unitSlug={unitSlug} />}
            {view.step.type === "grammar" && <GrammarStep view={view} />}
            {view.step.type === "read" && <ReadStep view={view} />}
            {view.step.type === "listen" && <ListenStep view={view} />}
            {view.step.type === "exercise" && (view.empty ? (
              <div className="rounded-control border border-dashed border-border p-5 text-center">
                <p className="font-semibold text-foreground">Soal untuk unit ini belum tersedia</p>
                <p className="text-sm text-muted-foreground mt-1">Kamu boleh melewatinya dan melanjutkan.</p>
              </div>
            ) : <ExerciseStep view={view} unitSlug={unitSlug} />)}
            {view.step.type === "speak" && <SpeakStep view={view} />}
          </>
        )}
      </Card>

      {error && <p role="alert" className="text-sm text-danger mt-3">{error}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={() => { setIndex(index - 1); setError(""); }} disabled={index === 0}>
          <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Sebelumnya
        </Button>
        <Button onClick={complete} loading={saving} className="flex-1 sm:flex-none">
          {view.empty ? (last ? "Lewati & selesaikan unit" : "Lewati langkah") : last ? "Selesaikan unit" : "Selesai, lanjut"}
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
