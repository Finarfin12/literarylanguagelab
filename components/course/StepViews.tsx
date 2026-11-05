"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, ExternalLink, Turtle, Volume2 } from "lucide-react";
import { Card } from "@/components/ui/primitives";
import ExerciseSession from "@/components/exercises/ExerciseSession";
import PronunciationLab from "@/components/PronunciationLab";
import { smallButtonClass } from "@/components/exercises/shared";
import type { StepView } from "./types";
import { speakText } from "./speak";

/** Tombol putar + putar pelan untuk satu kalimat/kata. */
export function SpeakButtons({ text, label }: { text: string; label?: string }) {
  const [problem, setProblem] = useState(false);
  const play = async (slow: boolean) => setProblem(!(await speakText(text, slow)));
  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" onClick={() => play(false)} aria-label={`Putar${label ? `: ${label}` : ""}`} className={`${smallButtonClass} !px-3`}>
        <Volume2 className="w-4 h-4" aria-hidden="true" />
      </button>
      <button type="button" onClick={() => play(true)} aria-label={`Putar pelan${label ? `: ${label}` : ""}`} className={`${smallButtonClass} !px-3`}>
        <Turtle className="w-4 h-4" aria-hidden="true" />
      </button>
      {problem && <span role="alert" className="text-xs text-danger">Perangkat tidak mendukung suara.</span>}
    </span>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 text-sm text-foreground bg-brand-tint border border-brand/20 rounded-control p-3 leading-relaxed">{children}</p>;
}

export function VocabStep({ view }: { view: StepView }) {
  return (
    <ul className="divide-y divide-border">
      {(view.vocab ?? []).map((v) => (
        <li key={v.word} className="flex items-start gap-3 py-3 min-h-[56px]">
          <div className="min-w-0 flex-1">
            <p className="font-serif text-xl text-foreground">{v.word}</p>
            {v.meaning_id && <p className="text-sm text-foreground">{v.meaning_id}</p>}
            {v.definition_en && <p className="text-sm text-muted-foreground">{v.definition_en}</p>}
          </div>
          <SpeakButtons text={v.word} label={v.word} />
        </li>
      ))}
    </ul>
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
