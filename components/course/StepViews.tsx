"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, BookmarkPlus, Check, ExternalLink, Loader2, Turtle, Volume2 } from "lucide-react";
import { Card } from "@/components/ui/primitives";
import ExerciseSession from "@/components/exercises/ExerciseSession";
import PronunciationLab from "@/components/PronunciationLab";
import { smallButtonClass } from "@/components/exercises/shared";
import type { StepView } from "./types";
import { speakText } from "./speak";
import { saveUnitWordsToReview } from "@/app/(dashboard)/kursus/actions";

/** Tombol Normal dan Lambat untuk satu kalimat/kata. Bila perangkat tidak punya suara, teksnya tetap bisa dibaca. */
export function SpeakButtons({ text, label }: { text: string; label?: string }) {
  const [problem, setProblem] = useState(false);
  const play = async (slow: boolean) => setProblem(!(await speakText(text, slow)));
  return (
    <span className="inline-flex items-center gap-2">
<button type="button" onClick={() => play(false)} aria-label={`Putar normal${label ? `: ${label}` : ""}`} className={`${smallButtonClass} !px-3`}>
        <Volume2 className="w-4 h-4" aria-hidden="true" /> <span className="text-xs font-semibold">Normal</span>
      </button>
      <button type="button" onClick={() => play(true)} aria-label={`Putar lambat${label ? `: ${label}` : ""}`} className={`${smallButtonClass} !px-3`}>
        <Turtle className="w-4 h-4" aria-hidden="true" /> <span className="text-xs font-semibold">Lambat</span>
      </button>
      {problem && <span role="alert" className="text-xs text-danger">Perangkat ini tidak punya suara. Baca teksnya saja.</span>}
    </span>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 text-sm text-foreground bg-brand-tint border border-brand/20 rounded-control p-3 leading-relaxed">{children}</p>;
}

type SaveState = { status: "idle" } | { status: "saving" } | { status: "done"; added: number; skipped: number } | { status: "error"; message: string };

/** Tombol "Simpan kata ke Review": hanya bertindak setelah diketuk; kata yang sudah dimiliki dilewati, galat bisa dicoba lagi. */
function SaveWordsButton({ unitSlug }: { unitSlug: string }) {
  const [state, setState] = useState<SaveState>({ status: "idle" });
  const save = async () => {
    setState({ status: "saving" });
    try {
      const res = await saveUnitWordsToReview(unitSlug);
      setState(res.ok ? { status: "done", added: res.added, skipped: res.skipped } : { status: "error", message: res.error });
    } catch {
      setState({ status: "error", message: "Gagal menyimpan. Periksa koneksi, lalu coba lagi." });
    }
  };
  return (
    <div className="mt-4" aria-live="polite">
      {state.status !== "done" && (
        <button type="button" onClick={save} disabled={state.status === "saving"} className={smallButtonClass}>
          {state.status === "saving" ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <BookmarkPlus className="w-4 h-4" aria-hidden="true" />}
          {state.status === "saving" ? "Menyimpan..." : state.status === "error" ? "Coba lagi" : "Simpan kata ke Review"}
        </button>
      )}
      {state.status === "done" && (
        <p className="flex items-center gap-2 text-sm text-brand-ink font-semibold">
          <Check className="w-4 h-4" aria-hidden="true" />
          {state.added > 0 ? `${state.added} kata disimpan ke Review.` : "Semua kata ini sudah ada di Review."}
          {state.added > 0 && state.skipped > 0 ? ` ${state.skipped} kata sudah kamu miliki.` : ""}
          <Link href="/review" className="underline">Buka Review</Link>
        </p>
      )}
      {state.status === "error" && <p role="alert" className="mt-2 text-sm text-danger">{state.message}</p>}
    </div>
  );
}

export function VocabStep({ view, unitSlug }: { view: StepView; unitSlug: string }) {
  const words = view.vocab ?? [];
  const hasAid = words.some((v) => v.reading_aid);
  return (
    <div>
      <ul className="divide-y divide-border">
        {words.map((v) => (
          <li key={v.word} className="flex items-start gap-3 py-3 min-h-[56px]">
            <div className="min-w-0 flex-1">
              <p lang="en" className="font-serif text-xl text-foreground">{v.word}</p>
              {v.reading_aid && (
                <p className="text-sm text-muted-foreground">
                  <span className="text-xs uppercase tracking-wide">cara baca perkiraan</span> <span className="font-semibold text-foreground">{v.reading_aid}</span>
                </p>
              )}
              {v.meaning_id && <p className="text-sm text-foreground">{v.meaning_id}</p>}
              {v.definition_en && <p lang="en" className="text-sm text-muted-foreground">{v.definition_en}</p>}
            </div>
            <SpeakButtons text={v.word} label={v.word} />
          </li>
        ))}
      </ul>
      {hasAid && <Note>Cara baca di atas hanya perkiraan dengan huruf Indonesia. Dengarkan audionya sebagai acuan utama.</Note>}
      {words.length > 0 && <SaveWordsButton unitSlug={unitSlug} />}
    </div>
  );
}

export function GrammarStep({ view }: { view: StepView }) {
  const t = view.topic;
  if (!t) return null;
  return (
    <div>
      <p className="font-serif text-xl text-foreground mb-2">{t.title}</p>
      <p className="text-foreground leading-relaxed">{t.summary_id}</p>
      {t.examples.length > 0 && (
        <ul className="mt-4 space-y-3">
          {t.examples.map((ex, i) => (
            <li key={i} className="border-l-4 border-brand/40 pl-3">
              <p className="font-serif text-foreground flex items-center gap-2 flex-wrap">
                {ex.en} <SpeakButtons text={ex.en} label={ex.en} />
              </p>
              <p className="text-sm text-muted-foreground">{ex.id}</p>
            </li>
          ))}
        </ul>
      )}
      <Link href={`/english-lab/grammar/${t.slug}`} className="mt-4 inline-flex items-center gap-2 min-h-[44px] text-sm font-semibold text-brand-ink">
        Buka topik lengkap dengan latihan <ExternalLink className="w-4 h-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

export function ReadStep({ view }: { view: StepView }) {
  const text = view.text;
  if (!text) return null;
  const note = view.step.type === "read" ? view.step.note_id : undefined;
  return (
    <div>
      <p className="font-serif text-xl text-foreground">{text.title}</p>
      {text.author && <p className="text-sm text-muted-foreground mb-3">{text.author}</p>}
      <div lang="en" className="mt-3 space-y-3 font-serif text-lg leading-[1.7] text-foreground">
        {text.content.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
      </div>
      {text.id && (
        <Link href={`/read/${text.id}`} className="mt-4 inline-flex items-center gap-2 min-h-[44px] text-sm font-semibold text-brand-ink">
          <BookOpen className="w-4 h-4" aria-hidden="true" /> Buka di Reader (ketuk kata untuk artinya) <ExternalLink className="w-4 h-4" aria-hidden="true" />
        </Link>
      )}
      {note && <Note>{note}</Note>}
    </div>
  );
}

export function ListenStep({ view }: { view: StepView }) {
  const [show, setShow] = useState(false);
  if (view.step.type !== "listen") return null;
  const { text, note_id } = view.step;
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-3">Dengarkan beberapa kali, lalu coba tebak isinya sebelum membuka teks.</p>
      <SpeakButtons text={text} label="rekaman unit" />
      <div className="mt-4">
        <button type="button" onClick={() => setShow((s) => !s)} aria-expanded={show} className={smallButtonClass}>
          {show ? "Sembunyikan teks" : "Tampilkan teks"}
        </button>
      </div>
      {show && <p lang="en" className="mt-3 font-serif text-lg leading-relaxed text-foreground">{text}</p>}
      {note_id && <Note>{note_id}</Note>}
    </div>
  );
}

export function ExerciseStep({ view, unitSlug }: { view: StepView; unitSlug: string }) {
  const count = view.step.type === "exercise" ? view.step.count : undefined;
  const tag = view.step.type === "exercise" ? view.step.tag : undefined;
  // Langkah bertanda mengambil soal dari tag itu saja; selain itu soal unit
  return <ExerciseSession unitSlug={tag ? undefined : unitSlug} tag={tag} count={count ?? 6} title={view.step.title ?? "Latihan unit"} />;
}

export function SpeakStep({ view }: { view: StepView }) {
  if (view.step.type !== "speak") return null;
  return (
    <div className="space-y-5">
      {view.step.sentences.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">Dengar dulu, lalu ucapkan kalimat ini. Salin ke Pronunciation Clinic di bawah untuk dinilai.</p>
          <ul className="divide-y divide-border">
            {view.step.sentences.map((s) => (
              <li key={s} className="flex items-center gap-3 py-3 min-h-[56px]">
                <p lang="en" className="flex-1 min-w-0 font-serif text-lg text-foreground">{s}</p>
                <SpeakButtons text={s} label={s} />
              </li>
            ))}
          </ul>
        </div>
      )}
      <Card className="!p-0 overflow-hidden">
        <PronunciationLab />
      </Card>
      {view.scenario && (
        <Link href="/english-lab/dialogue-simulator" className="inline-flex items-center gap-2 min-h-[44px] text-sm font-semibold text-brand-ink">
          Lanjut bercakap di Dialogue Simulator: skenario &ldquo;{view.scenario.title}&rdquo; <ExternalLink className="w-4 h-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
