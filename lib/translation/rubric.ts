// Rubrik penilaian terjemahan Nababan, Nuraeni & Sumardiono (2012): akurasi, keberterimaan, keterbacaan,
// masing-masing skala 1-3 dengan bobot 3:2:1. Fungsi murni, tanpa import.

export const RUBRIC_ID = "nababan_2012";

export const RUBRIC_WEIGHTS = { accuracy: 3, acceptability: 2, readability: 1 } as const;

export interface RubricScores {
  accuracy: number;
  acceptability: number;
  readability: number;
}

export interface SegmentAssessment extends RubricScores {
  idx: number;
  notes?: string;
}

const clamp = (n: number) => Math.min(3, Math.max(1, n));
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Pastikan nilai skala 1-3; selain angka hingga ke batas terdekat, NaN menjadi 1. */
export function normalizeScore(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? clamp(n) : 1;
}

/** Skor tertimbang 1-3 untuk satu segmen, dibulatkan dua desimal. */
export function weightedScore(scores: RubricScores): number {
  const { accuracy, acceptability, readability } = RUBRIC_WEIGHTS;
  const total = accuracy + acceptability + readability;
  const sum =
    normalizeScore(scores.accuracy) * accuracy +
    normalizeScore(scores.acceptability) * acceptability +
    normalizeScore(scores.readability) * readability;
  return round2(sum / total);
}

/** Skor akhir proyek: rata-rata skor tertimbang semua segmen. 0 jika tidak ada segmen. */
export function aggregateScore(perSegment: RubricScores[]): number {
  if (perSegment.length === 0) return 0;
  return round2(perSegment.reduce((s, seg) => s + weightedScore(seg), 0) / perSegment.length);
}

export type TranslatorStage = "Pemula" | "Berkembang" | "Mahir";

export const STAGE_WINDOW = 5;

/**
 * Tahap kompetensi penerjemah dari rata-rata skor akhir `window` terjemahan terakhir (terbaru dulu):
 * < 2,0 Pemula; 2,0-2,5 Berkembang; > 2,5 Mahir. null jika belum ada penilaian.
 */
export function translatorStage(scoresNewestFirst: number[], window = STAGE_WINDOW): { stage: TranslatorStage; average: number; count: number } | null {
  const recent = scoresNewestFirst.filter((s) => Number.isFinite(s)).slice(0, window);
  if (recent.length === 0) return null;
  const average = round2(recent.reduce((a, b) => a + b, 0) / recent.length);
  const stage: TranslatorStage = average < 2 ? "Pemula" : average <= 2.5 ? "Berkembang" : "Mahir";
  return { stage, average, count: recent.length };
}
