// Contoh isi `prompt` dan `answer` per tipe soal untuk formulir admin (Fase 15). Bentuk lengkap: lib/exercises/types.ts.
import type { Exercise, ExerciseType } from "@/lib/exercises/types";

export const EXERCISE_TEMPLATES: Record<ExerciseType, { prompt: unknown; answer: unknown }> = {
  mcq: { prompt: { question: "She ___ happy.", options: ["am", "is", "are"] }, answer: { correct: "is" } },
  cloze: { prompt: { text: "I ___ a student and she ___ a teacher.", hint: "to be" }, answer: { blanks: [["am"], ["is"]] } },
  order: { prompt: { tokens: ["goes", "She", "school", "to", "."], hint: "Dia pergi ke sekolah." }, answer: { sentences: ["She goes to school."] } },
  match: {
    prompt: { lefts: ["cat", "dog"], rights: ["anjing", "kucing"], instruction: "Pasangkan kata dengan artinya." },
    answer: { pairs: [{ left: "cat", right: "kucing" }, { left: "dog", right: "anjing" }] },
  },
  dictation: { prompt: { text: "She goes to school every day." }, answer: { accept: ["She goes to school every day."] } },
  pattern: {
    prompt: {
      subjects: [{ text: "I", person: "i" }, { text: "She", person: "sg3" }, { text: "They", person: "other" }],
      verbs: [{ base: "eat", third: "eats", meaning_id: "makan" }, { base: "like", third: "likes", meaning_id: "suka" }],
      objects: ["rice", "tea"],
      hint: "Dia (perempuan) makan nasi.",
    },
    answer: { sentences: ["She eats rice."] },
  },
};

export interface AdminExerciseRow {
  id: string;
  type: ExerciseType;
  cefr_level: string;
  topic_slug: string | null;
  unit_slug: string | null;
  tags: string[] | null;
  prompt: unknown;
  answer: unknown;
  explanation_id: string;
  status: "draft" | "published";
  source: string;
}

/** Ringkasan satu baris untuk daftar admin. */
export function exerciseSummary(row: AdminExerciseRow): string {
  const p = (row.prompt ?? {}) as Record<string, unknown>;
  switch (row.type) {
    case "mcq":
      return String(p.question ?? "");
    case "cloze":
      return String(p.text ?? "");
    case "order":
      return Array.isArray(p.tokens) ? p.tokens.join(" ") : "";
    case "match":
      return Array.isArray(p.lefts) ? p.lefts.join(", ") : "";
    case "dictation":
      return String(p.text ?? "");
    case "pattern":
      return String(p.hint ?? "") || (Array.isArray(p.objects) ? p.objects.join(", ") : "");
  }
}

export type PreviewExercise = Exercise;
