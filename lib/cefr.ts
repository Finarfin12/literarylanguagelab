// Fungsi murni seputar level CEFR. Tanpa import agar mudah diuji unit.

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

export function isCefrLevel(v: unknown): v is CefrLevel {
  return typeof v === "string" && (CEFR_LEVELS as readonly string[]).includes(v);
}

/** Indeks 0..5, atau -1 jika bukan level CEFR. */
export function levelIndex(level: string | null | undefined): number {
  return isCefrLevel(level) ? CEFR_LEVELS.indexOf(level) : -1;
}

/** Level yang berjarak `below` ke bawah dan `above` ke atas dari `level` (termasuk level itu sendiri). */
export function neighborLevels(level: string | null | undefined, below = 1, above = 0): CefrLevel[] {
  const i = levelIndex(level);
  if (i < 0) return [];
  return CEFR_LEVELS.slice(Math.max(0, i - below), Math.min(CEFR_LEVELS.length, i + above + 1)) as CefrLevel[];
}

/**
 * Batas band NGSL (peringkat frekuensi) per level.
 * ANGKA INI USULAN dan perlu dikonfirmasi pemilik (PRD Q1).
 * Band di atas batas terakhir tidak dipetakan (null).
 */
export const BAND_LIMITS: { max: number; level: CefrLevel }[] = [
  { max: 500, level: "A1" },
  { max: 1000, level: "A2" },
  { max: 2000, level: "B1" },
  { max: 2800, level: "B2" },
];

/** Petakan peringkat frekuensi NGSL ke perkiraan CEFR. Band < 1 atau tak terpetakan → null. */
export function bandToCefr(band: number): CefrLevel | null {
  if (!Number.isFinite(band) || band < 1) return null;
  for (const { max, level } of BAND_LIMITS) {
    if (band <= max) return level;
  }
  return null;
}

/** Level Beginner Mode: satu di bawah level pengguna, minimal `floor` (default A2). Tanpa level → B1. */
export function beginnerModeLevel(userLevel: string | null | undefined, floor: CefrLevel = "A2"): CefrLevel {
  const i = levelIndex(userLevel);
  if (i < 0) return "B1";
  return CEFR_LEVELS[Math.max(i - 1, CEFR_LEVELS.indexOf(floor))];
}

export type ExplanationLanguage = "id" | "mixed" | "en";

/** Bahasa penjelasan AI menurut PRD §5.2: A1-A2 Indonesia, B1 campur, B2+ Inggris. */
export function explanationLanguage(level: string | null | undefined): ExplanationLanguage | null {
  const i = levelIndex(level);
  if (i < 0) return null;
  if (i <= 1) return "id";
  if (i === 2) return "mixed";
  return "en";
}

/** Instruksi tambahan untuk system prompt; string kosong jika level tidak diketahui. */
export function explanationInstruction(level: string | null | undefined): string {
  const lang = explanationLanguage(level);
  if (!lang) return "";
  if (lang === "id") {
    return `The learner's English level is ${level} (beginner). Write the explanation in simple Indonesian with short sentences. Keep English words and example sentences in English, and avoid grammar jargon unless you explain it.`;
  }
  if (lang === "mixed") {
    return `The learner's English level is ${level} (intermediate). Mix Indonesian and simple English: key explanations in Indonesian, with short English clarifications.`;
  }
  return `The learner's English level is ${level} (upper intermediate or above). Write the explanation in clear English.`;
}
