// Soal otomatis dari Kosakata Inti (Fase 15 / 14g), TANPA AI: pilihan ganda "apa arti kata ini?" dan pasangkan
// kata ↔ definisi. Pengecoh diambil dari kata dengan `cefr_estimate` yang sama. Murni dan berbenih (`rng`).
import type { ExerciseDraft } from "./types";

type Rng = () => number;

// Salinan kecil dari shuffled() di session.ts: modul ini tidak boleh punya impor runtime (lihat tests/exercises.test.mts)
function shuffled<T>(items: readonly T[], rng: Rng): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export interface CoreWordForExercise {
  word: string;
  definition_en: string | null;
  cefr_estimate: string | null;
}

export interface CoreWordExerciseOptions {
  /** Jumlah soal pilihan ganda. */
  mcqCount: number;
  /** Jumlah soal pasangkan (masing-masing 4 pasang). */
  matchCount: number;
  /** Kata yang sudah punya soal (tag `core:<kata>`), dilewati. */
  skipWords?: ReadonlySet<string>;
  rng: Rng;
}

const OPTION_COUNT = 4;
const MATCH_SIZE = 4;
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export const coreWordTag = (word: string) => `core:${word.trim().toLowerCase()}`;

const level = (w: CoreWordForExercise) => (w.cefr_estimate && LEVELS.includes(w.cefr_estimate) ? w.cefr_estimate : "A1");

function usable(words: readonly CoreWordForExercise[]): (CoreWordForExercise & { definition_en: string })[] {
  const seenWords = new Set<string>();
  const seenDefs = new Set<string>();
  const out: (CoreWordForExercise & { definition_en: string })[] = [];
  for (const w of words) {
    const def = (w.definition_en ?? "").trim();
    const word = w.word.trim();
    // Definisi yang terlalu pendek/panjang atau yang memuat kata itu sendiri membocorkan jawaban atau membingungkan
    if (!word || def.length < 4 || def.length > 200) continue;
    if (new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(def)) continue;
    const key = word.toLowerCase();
    if (seenWords.has(key) || seenDefs.has(def.toLowerCase())) continue;
    seenWords.add(key);
    seenDefs.add(def.toLowerCase());
    out.push({ ...w, word, definition_en: def });
  }
  return out;
}

/** Membuat draf soal dari daftar kata inti. Kata tanpa definisi dilewati. */
export function buildCoreWordExercises(words: readonly CoreWordForExercise[], options: CoreWordExerciseOptions): ExerciseDraft[] {
  const { rng } = options;
  const skip = options.skipWords ?? new Set<string>();
  const pool = usable(words);
  const fresh = pool.filter((w) => !skip.has(w.word.toLowerCase()));
  const drafts: ExerciseDraft[] = [];

  // Pilihan ganda
  for (const w of shuffled(fresh, rng).slice(0, Math.max(0, options.mcqCount))) {
    const sameLevel = pool.filter((x) => x.word !== w.word && level(x) === level(w));
    const others = sameLevel.length >= OPTION_COUNT - 1 ? sameLevel : pool.filter((x) => x.word !== w.word);
    const distractors = shuffled(others, rng).slice(0, OPTION_COUNT - 1).map((x) => x.definition_en);
    if (distractors.length < OPTION_COUNT - 1) continue;
    drafts.push({
      type: "mcq",
      cefr_level: level(w),
      topic_slug: null,
      unit_slug: null,
      tags: ["core-word", coreWordTag(w.word)],
      prompt: { question: `Apa arti kata “${w.word}”?`, options: shuffled([w.definition_en, ...distractors], rng) },
      answer: { correct: w.definition_en },
      explanation_id: `“${w.word}” berarti: ${w.definition_en}`,
    });
  }

  // Pasangkan: 4 kata dari level yang sama per soal
  const used = new Set<string>();
  const byLevel = new Map<string, (CoreWordForExercise & { definition_en: string })[]>();
  for (const w of shuffled(fresh, rng)) {
    const list = byLevel.get(level(w)) ?? [];
    list.push(w);
    byLevel.set(level(w), list);
  }
  let made = 0;
  for (const [lvl, list] of byLevel) {
    for (let i = 0; i + MATCH_SIZE <= list.length && made < options.matchCount; i += MATCH_SIZE) {
      const group = list.slice(i, i + MATCH_SIZE).filter((w) => !used.has(w.word));
      if (group.length < MATCH_SIZE) continue;
      group.forEach((w) => used.add(w.word));
      drafts.push({
        type: "match",
        cefr_level: lvl,
        topic_slug: null,
        unit_slug: null,
        tags: ["core-word", ...group.map((w) => coreWordTag(w.word))],
        prompt: {
          lefts: group.map((w) => w.word),
          rights: shuffled(group.map((w) => w.definition_en), rng),
          instruction: "Pasangkan setiap kata dengan artinya.",
        },
        answer: { pairs: group.map((w) => ({ left: w.word, right: w.definition_en })) },
        explanation_id: group.map((w) => `“${w.word}”: ${w.definition_en}`).join("\n"),
      });
      made++;
    }
  }

  return drafts;
}
