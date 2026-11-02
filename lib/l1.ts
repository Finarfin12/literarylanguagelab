// Modul khas penutur Indonesia (Fase 17): Kesalahan Umum dan Pasangan Bunyi. Logika murni tanpa impor runtime
// agar bisa diuji unit (tests/l1.test.mts). Acakan diberikan lewat `rng` supaya hasilnya bisa diuji.

export interface L1Error {
  slug: string;
  title: string;
  wrong: string;
  right: string;
  explanation_id: string;
  cefr_level: string;
  sort_order: number;
}

export interface MinimalPair {
  slug: string;
  word_a: string;
  word_b: string;
  ipa_a: string;
  ipa_b: string;
  note_id: string;
  sort_order: number;
}

export type Rng = () => number;

/** Tag soal untuk satu kesalahan umum; dipakai seed (0014) dan halaman latihan. */
export const L1_ERROR_TAG = "l1-error";
export const MINIMAL_PAIR_TAG = "minimal-pair";
export const l1ErrorTag = (slug: string) => `l1:${slug}`;
export const pairTag = (slug: string) => `mp:${slug}`;

const SLUG = /^[a-z0-9-]{2,64}$/;
const str = (v: unknown, max: number) => (typeof v === "string" && v.trim() && v.trim().length <= max ? v.trim() : null);

/** Membaca baris l1_errors dengan longgar; baris rusak → null. */
export function parseL1Error(raw: unknown): L1Error | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const slug = str(r.slug, 64);
  const title = str(r.title, 120);
  const wrong = str(r.wrong, 240);
  const right = str(r.right, 240);
  const explanation = str(r.explanation_id, 1200);
  const level = str(r.cefr_level, 4);
  if (!slug || !SLUG.test(slug) || !title || !wrong || !right || !explanation || !level) return null;
  return { slug, title, wrong, right, explanation_id: explanation, cefr_level: level, sort_order: Number.isFinite(Number(r.sort_order)) ? Number(r.sort_order) : 0 };
}

/** Membaca baris minimal_pairs dengan longgar; baris rusak (atau kedua kata sama) → null. */
export function parseMinimalPair(raw: unknown): MinimalPair | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const slug = str(r.slug, 64);
  const a = str(r.word_a, 40);
  const b = str(r.word_b, 40);
  const ipaA = str(r.ipa_a, 60);
  const ipaB = str(r.ipa_b, 60);
  const note = str(r.note_id, 600);
  if (!slug || !SLUG.test(slug) || !a || !b || !ipaA || !ipaB || !note || a.toLowerCase() === b.toLowerCase()) return null;
  return { slug, word_a: a, word_b: b, ipa_a: ipaA, ipa_b: ipaB, note_id: note, sort_order: Number.isFinite(Number(r.sort_order)) ? Number(r.sort_order) : 0 };
}

/** Kesalahan dikelompokkan per level (A1, A2, B1, ...) dengan urutan tampil tetap. */
export function groupErrorsByLevel(errors: readonly L1Error[]): { level: string; errors: L1Error[] }[] {
  const levels = Array.from(new Set(errors.map((e) => e.cefr_level))).sort();
  return levels.map((level) => ({ level, errors: errors.filter((e) => e.cefr_level === level).sort((a, b) => a.sort_order - b.sort_order || a.slug.localeCompare(b.slug)) }));
}

export interface PairRound {
  pairSlug: string;
  /** Kata yang diperdengarkan. */
  word: string;
  spoken: "a" | "b";
  /** Dua pilihan dalam urutan tampil (acak). */
  options: [string, string];
}

function shuffled<T>(items: readonly T[], rng: Rng): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Menyusun `count` ronde latihan dengar: pasangan yang berbeda dulu (diacak), diulang bila `count` lebih banyak dari
 * jumlah pasangan; tiap ronde memilih kata yang diperdengarkan dan urutan pilihan secara acak.
 */
export function pickPairRounds(pairs: readonly MinimalPair[], count: number, rng: Rng): PairRound[] {
  const n = Math.max(0, Math.floor(count));
  if (pairs.length === 0 || n === 0) return [];
  const rounds: PairRound[] = [];
  let queue: MinimalPair[] = [];
  while (rounds.length < n) {
    if (queue.length === 0) queue = shuffled(pairs, rng);
    const pair = queue.shift() as MinimalPair;
    const spoken: "a" | "b" = rng() < 0.5 ? "a" : "b";
    const options = shuffled([pair.word_a, pair.word_b], rng) as [string, string];
    rounds.push({ pairSlug: pair.slug, word: spoken === "a" ? pair.word_a : pair.word_b, spoken, options });
  }
  return rounds;
}

/** Jawaban benar bila kata yang dipilih sama dengan yang diperdengarkan (tanpa membedakan huruf besar). */
export function gradePairChoice(round: Pick<PairRound, "word">, choice: string): boolean {
  return choice.trim().toLowerCase() === round.word.toLowerCase();
}
