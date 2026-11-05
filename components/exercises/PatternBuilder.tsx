"use client";

import { useState } from "react";
import { Button } from "@/components/ui/primitives";
import { buildPatternSentence, conjugate, conjugationNote } from "@/lib/exercises/patterns";
import type { PatternResponse } from "@/lib/exercises/types";
import type { TypeProps } from "./shared";

// Warna tiap bagian kalimat memakai token yang sudah lolos uji kontras (brand, warning, muted) dan SELALU disertai
// label teks, jadi informasinya tidak bergantung pada warna (docs/v4/DESIGN.md §3.4).
const SLOT = {
  subject: { label: "Subjek", box: "border-brand/50 bg-brand-tint text-brand-ink", tile: "border-brand/50 text-brand-ink" },
  verb: { label: "Kata kerja", box: "border-warning-ink/40 bg-warning-tint text-warning-ink", tile: "border-warning-ink/40 text-warning-ink" },
  object: { label: "Objek", box: "border-border bg-muted text-foreground", tile: "border-border text-foreground" },
} as const;

const tile = "min-h-[44px] px-4 rounded-control border bg-card font-serif text-base transition-colors disabled:pointer-events-none";

/**
 * Penyusun kalimat (Fase 22.1): ketuk satu subjek, satu kata kerja, dan satu objek. Bentuk kata kerja mengikuti subjek
 * (I → She mengubah eat → eats) dengan catatan singkat. Tanpa drag dan tanpa AI; dinilai oleh gradeAnswer.
 */
export default function PatternBuilder({ exercise, locked, result, onSubmit }: TypeProps<"pattern", PatternResponse>) {
  const { subjects, verbs, objects, hint } = exercise.prompt;
  const [subject, setSubject] = useState<string | null>(null);
  const [verb, setVerb] = useState<string | null>(null);
  const [object, setObject] = useState<string | null>(null);

  const subj = subjects.find((s) => s.text === subject) ?? null;
  const vb = verbs.find((v) => v.base === verb) ?? null;
  const shownVerb = subj && vb ? conjugate(subj, vb) : vb?.base ?? null;
  const note = subj && vb ? conjugationNote(subj, vb) : null;
  const complete = subject !== null && verb !== null && object !== null;
  const preview = complete ? buildPatternSentence(exercise.prompt, { subject, verb, object }) : null;

  const feedbackBox = locked && result ? (result.correct ? "border-brand bg-brand-tint" : "border-danger bg-danger-tint") : "border-border bg-muted/40";

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-3">Pilih satu subjek, satu kata kerja, dan satu objek untuk menyusun kalimat.</p>
      {hint && <p className="text-sm text-foreground mb-3">Artinya: <span className="italic">{hint}</span></p>}

      <div aria-label="Kalimatmu" className={`min-h-[64px] flex flex-wrap gap-2 p-3 rounded-control border border-dashed ${feedbackBox}`}>
        {!subject && !verb && !object && <span className="text-sm text-muted-foreground self-center">Kalimatmu muncul di sini</span>}
        {subject && <Chip kind="subject" text={subject} />}
        {shownVerb && <Chip kind="verb" text={shownVerb} />}
        {object && <Chip kind="object" text={object} />}
      </div>

      {note && !locked && <p role="status" className="mt-2 text-sm text-foreground bg-warning-tint border border-warning-ink/30 rounded-control p-2.5">{note}</p>}

      <Group kind="subject">
        {subjects.map((s) => (
          <button key={s.text} type="button" disabled={locked} aria-pressed={subject === s.text} onClick={() => setSubject(s.text)} className={`${tile} ${SLOT.subject.tile} ${subject === s.text ? "ring-2 ring-brand-solid font-bold" : "hover:bg-muted"}`}>
            {s.text}
          </button>
        ))}
      </Group>
      <Group kind="verb">
        {verbs.map((v) => (
          <button key={v.base} type="button" disabled={locked} aria-pressed={verb === v.base} onClick={() => setVerb(v.base)} className={`${tile} ${SLOT.verb.tile} ${verb === v.base ? "ring-2 ring-brand-solid font-bold" : "hover:bg-muted"}`}>
            {subj ? conjugate(subj, v) : v.base}
            {v.meaning_id && <span className="ml-1.5 font-sans text-xs text-muted-foreground">({v.meaning_id})</span>}
          </button>
        ))}
      </Group>
      <Group kind="object">
        {objects.map((o) => (
          <button key={o} type="button" disabled={locked} aria-pressed={object === o} onClick={() => setObject(o)} className={`${tile} ${SLOT.object.tile} ${object === o ? "ring-2 ring-brand-solid font-bold" : "hover:bg-muted"}`}>
            {o}
          </button>
        ))}
      </Group>

      {!locked && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button disabled={!complete} onClick={() => complete && onSubmit({ subject: subject!, verb: verb!, object: object! })} className="flex-1 sm:flex-none">
            Periksa
          </Button>
          {preview && <span className="self-center text-sm text-muted-foreground">Kalimatmu: <span lang="en" className="font-serif text-foreground">{preview}</span></span>}
        </div>
      )}
    </div>
  );
}

function Chip({ kind, text }: { kind: keyof typeof SLOT; text: string }) {
  return (
    <span className={`inline-flex flex-col rounded-control border px-3 py-1 ${SLOT[kind].box}`}>
      <span className="text-[10px] font-bold uppercase tracking-wider">{SLOT[kind].label}</span>
      <span lang="en" className="font-serif text-base">{text}</span>
    </span>
  );
}

function Group({ kind, children }: { kind: keyof typeof SLOT; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <p className={`inline-block text-xs font-bold uppercase tracking-wider rounded-control border px-2 py-0.5 mb-2 ${SLOT[kind].box}`}>{SLOT[kind].label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
