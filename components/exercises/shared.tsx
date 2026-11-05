// Bagian bersama komponen latihan terstruktur (Fase 15): kontrak props tiap tipe, kelas pilihan, dan kotak umpan balik.
// Gaya mengikuti docs/v4/DESIGN.md: token brand/danger, rounded-control, target sentuh >= 44px, tanpa bayangan dekoratif.
import { CheckCircle2, XCircle } from "lucide-react";
import type { Exercise, GradeResult } from "@/lib/exercises/types";

export type ExerciseOf<T extends Exercise["type"]> = Extract<Exercise, { type: T }>;

export interface TypeProps<T extends Exercise["type"], R> {
  exercise: ExerciseOf<T>;
  /** true setelah jawaban diperiksa: input dikunci dan benar/salah ditandai. */
  locked: boolean;
  result: GradeResult | null;
  onSubmit: (response: R) => void;
}

export type ChoiceState = "idle" | "selected" | "correct" | "wrong" | "muted";

/** Kelas satu pilihan/ubin. Benar/salah juga ditandai dengan ikon dan teks, bukan hanya warna. */
export function choiceClass(state: ChoiceState): string {
  const base = "w-full min-h-[44px] px-4 py-2 rounded-control border text-left text-base transition-colors";
  switch (state) {
    case "selected":
      return `${base} border-brand bg-brand-tint text-brand-ink font-semibold`;
    case "correct":
      return `${base} border-brand bg-brand-tint text-brand-ink font-semibold`;
    case "wrong":
      return `${base} border-danger bg-danger-tint text-danger font-semibold`;
    case "muted":
      return `${base} border-border bg-card text-muted-foreground`;
    default:
      return `${base} border-border bg-card text-foreground hover:bg-muted`;
  }
}

export const smallButtonClass =
  "inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-control border border-border bg-card text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:pointer-events-none";

/** Menandai huruf yang berbeda antara kata yang diketik dan kata yang benar (garis bawah + tebal, bukan hanya warna). */
function TypoDiff({ given, expected }: { given: string; expected: string }) {
  let i = 0;
  while (i < given.length && i < expected.length && given[i] === expected[i]) i++;
  let j = 0;
  while (j < given.length - i && j < expected.length - i && given[given.length - 1 - j] === expected[expected.length - 1 - j]) j++;
  const part = (w: string) => (
    <>
      {w.slice(0, i)}
      <span className="font-bold underline decoration-2 underline-offset-2">{w.slice(i, w.length - j) || "·"}</span>
      {w.slice(w.length - j)}
    </>
  );
  return (
    <p className="mt-2 text-foreground">
      <span className="text-muted-foreground">Kamu menulis </span>
      <span lang="en" className="font-serif">{part(given)}</span>
      <span className="text-muted-foreground">, ejaan yang benar </span>
      <span lang="en" className="font-serif">{part(expected)}</span>
      <span className="text-muted-foreground">.</span>
    </p>
  );
}

/** Kotak umpan balik setelah menjawab: hasil, jawaban yang benar bila salah, dan penjelasan bahasa Indonesia. */
export function ExerciseFeedback({ result, explanation }: { result: GradeResult; explanation: string }) {
  const partial = !result.correct && result.score > 0;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-control border p-4 text-sm ${result.correct ? "border-brand/40 bg-brand-tint" : "border-danger/30 bg-danger-tint"}`}
    >
      <p className={`flex items-center gap-2 font-bold text-base ${result.correct ? "text-brand-ink" : "text-danger"}`}>
        {result.correct ? <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" /> : <XCircle className="w-5 h-5 shrink-0" aria-hidden="true" />}
        {result.correct ? (result.typo ? "Benar, periksa ejaannya" : "Benar!") : partial ? "Sebagian benar" : "Belum tepat"}
      </p>
      {result.correct && result.typo && <TypoDiff given={result.typo.given} expected={result.typo.expected} />}
      {!result.correct && (
        <p className="mt-2 text-foreground">
          <span className="text-muted-foreground">Jawaban yang benar: </span>
          <span className="font-serif font-medium whitespace-pre-line">{result.expected}</span>
        </p>
      )}
      <p className="mt-2 text-foreground leading-relaxed whitespace-pre-line">{explanation}</p>
    </div>
  );
}
