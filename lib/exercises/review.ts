// Jadwal review topik grammar (Fase 15): memakai SM-2 yang sama dengan kosakata (lib/spaced-repetition.ts).
// Murni. `calculateSM2` diberikan lewat parameter supaya modul ini bisa diuji unit tanpa alias/ekstensi impor.
import type { SM2Result } from "../spaced-repetition";

export type Sm2Fn = (quality: number, lastInterval?: number, lastRepetition?: number, lastEaseFactor?: number) => SM2Result;

export interface GrammarProgressState {
  interval: number;
  efactor: number;
  repetitions: number;
}

export interface GrammarSchedule extends GrammarProgressState {
  next_review_at: string;
}

export const INITIAL_GRAMMAR_STATE: GrammarProgressState = { interval: 1, efactor: 2.5, repetitions: 0 };

const DAY_MS = 24 * 60 * 60 * 1000;

/** Skor sesi latihan (0-100) → kualitas SM-2 (0-5). Di bawah 60 dianggap lupa. */
export function qualityFromScore(scorePct: number): number {
  const s = Number.isFinite(scorePct) ? Math.max(0, Math.min(100, scorePct)) : 0;
  if (s >= 90) return 5;
  if (s >= 75) return 4;
  if (s >= 60) return 3;
  if (s >= 40) return 2;
  return 1;
}

/** Jadwal berikutnya setelah review dengan kualitas tertentu. Topik yang baru selesai: panggil dengan state awal. */
export function scheduleGrammarReview(
  state: Partial<GrammarProgressState> | null | undefined,
  quality: number,
  now: Date,
  sm2: Sm2Fn
): GrammarSchedule {
  const q = Math.max(0, Math.min(5, Math.round(quality)));
  const result = sm2(q, state?.interval ?? INITIAL_GRAMMAR_STATE.interval, state?.repetitions ?? 0, state?.efactor ?? INITIAL_GRAMMAR_STATE.efactor);
  return {
    interval: result.interval,
    repetitions: result.repetition,
    efactor: result.easeFactor,
    next_review_at: new Date(now.getTime() + result.interval * DAY_MS).toISOString(),
  };
}

export interface DueRow {
  topic_slug: string;
  completed_at: string | null;
  next_review_at: string | null;
}

/** Topik yang sudah selesai dan jadwal reviewnya sudah lewat, yang paling lama menunggu lebih dulu. */
export function dueGrammarTopics<T extends DueRow>(rows: readonly T[], now: Date): T[] {
  const t = now.getTime();
  return rows
    .filter((r) => r.completed_at && r.next_review_at && new Date(r.next_review_at).getTime() <= t)
    .sort((a, b) => (a.next_review_at! < b.next_review_at! ? -1 : a.next_review_at! > b.next_review_at! ? 1 : 0));
}

/** Slug topik yang dianggap selesai: dari database bila tersedia, selain itu dari localStorage (cadangan). */
export function mergeDoneSlugs(dbRows: readonly DueRow[] | null, localSlugs: readonly string[]): Set<string> {
  if (dbRows === null) return new Set(localSlugs);
  return new Set(dbRows.filter((r) => r.completed_at).map((r) => r.topic_slug));
}

/** Slug yang ada di localStorage tetapi belum di database: kandidat migrasi sekali jalan. */
export function slugsToMigrate(dbRows: readonly DueRow[], localSlugs: readonly string[]): string[] {
  const inDb = new Set(dbRows.filter((r) => r.completed_at).map((r) => r.topic_slug));
  return localSlugs.filter((s) => !inDb.has(s));
}
