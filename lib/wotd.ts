// Logika murni Word of the Day (Fase 14f): kata deterministik per pengguna per hari + validasi respons AI. Tanpa import, diuji unit.

/** Hash string 32-bit (FNV-1a), stabil di semua lingkungan. */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export interface WotdCandidate {
  word: string;
  context?: string | null;
}

/** Kata hari ini: sama sepanjang hari untuk satu pengguna, berganti setiap hari. `dateKey` mis. "2026-11-01". */
export function pickWordOfTheDay<T extends WotdCandidate>(words: T[], userId: string, dateKey: string): T | null {
  const usable = words.filter((w) => w.word && w.word.trim()).sort((a, b) => a.word.localeCompare(b.word));
  if (usable.length === 0) return null;
  return usable[hashString(`${userId}:${dateKey}`) % usable.length];
}

/** Cadangan bila pengguna belum punya kosakata dan tabel core_words tidak tersedia. */
export const FALLBACK_WORDS: WotdCandidate[] = [
  { word: "serendipity" },
  { word: "mellifluous" },
  { word: "epiphany" },
  { word: "eloquence" },
  { word: "luminous" },
  { word: "ephemeral" },
  { word: "solitude" },
];

/** Kata lokal yang tampil di kartu Word of the Day (tanpa panggilan AI). Berganti per tanggal kalender perangkat. */
export const LOCAL_WORDS: { word: string; def: string }[] = [
  { word: "Mellifluous", def: "Sweet or musical; pleasant to hear." },
  { word: "Serendipity", def: "The occurrence of events by chance in a happy or beneficial way." },
  { word: "Epiphany", def: "A moment of sudden revelation or insight." },
  { word: "Petrichor", def: "A pleasant smell that frequently accompanies the first rain after a long period of warm, dry weather." },
  { word: "Luminous", def: "Full of or shedding light; bright or shining, especially in the dark." },
  { word: "Eloquence", def: "Fluent or persuasive speaking or writing." },
  { word: "Ineffable", def: "Too great or extreme to be expressed or described in words." },
];

export function localWordOfTheDay(date: Date): { word: string; def: string } {
  return LOCAL_WORDS[date.getDate() % LOCAL_WORDS.length];
}

export interface WotdLesson {
  word: string;
  lesson: string;
  collocations: string[];
  quiz: { question: string; options: string[]; answer: number };
}

/** Bentuk respons yang aman dikirim ke UI; null bila kuis tidak valid (opsi 2–4, jawaban dalam rentang). */
export function validateWotd(raw: unknown, expectedWord: string): WotdLesson | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const quiz = o.quiz as Record<string, unknown> | undefined;
  if (!quiz || typeof quiz.question !== "string" || !quiz.question.trim()) return null;
  const options = Array.isArray(quiz.options) ? quiz.options.filter((x): x is string => typeof x === "string" && x.trim() !== "").map((x) => x.trim()) : [];
  if (options.length < 2 || options.length > 4) return null;
  const answer = typeof quiz.answer === "number" ? quiz.answer : Number(quiz.answer);
  if (!Number.isInteger(answer) || answer < 0 || answer >= options.length) return null;
  const lesson = typeof o.lesson === "string" ? o.lesson.trim() : "";
  if (!lesson) return null;
  const collocations = Array.isArray(o.collocations) ? o.collocations.filter((x): x is string => typeof x === "string" && x.trim() !== "").map((x) => x.trim()).slice(0, 3) : [];
  return { word: expectedWord, lesson, collocations, quiz: { question: quiz.question.trim(), options, answer } };
}
