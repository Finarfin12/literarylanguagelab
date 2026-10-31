// Kemiripan segmen dengan Translation Memory: rasio Dice berbasis token (kata). Fungsi murni, tanpa import.

export const TM_THRESHOLD = 0.7;

export interface TmEntry {
  source: string;
  target: string;
}

export interface TmMatch extends TmEntry {
  /** 0..1 */
  score: number;
}

export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[\p{L}\p{N}]+(?:['’][\p{L}]+)?/gu) ?? []).map((t) => t.replace(/’/g, "'"));
}

/** Kemiripan Dice antara dua teks berdasarkan multiset token; 1 = sama persis (abaikan huruf besar dan tanda baca). */
export function similarity(a: string, b: string): number {
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (ta.length === 0 || tb.length === 0) return 0;
  const count = new Map<string, number>();
  for (const t of ta) count.set(t, (count.get(t) ?? 0) + 1);
  let common = 0;
  for (const t of tb) {
    const c = count.get(t);
    if (c) {
      common++;
      count.set(t, c - 1);
    }
  }
  return (2 * common) / (ta.length + tb.length);
}

/** Entri TM yang cukup mirip dengan `source`, diurutkan dari yang paling mirip. */
export function matchTm(source: string, memory: TmEntry[], threshold = TM_THRESHOLD, limit = 5): TmMatch[] {
  const seen = new Set<string>();
  const out: TmMatch[] = [];
  for (const entry of memory) {
    if (!entry.source || !entry.target) continue;
    const score = similarity(source, entry.source);
    if (score < threshold) continue;
    const key = `${entry.source}\u0000${entry.target}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...entry, score: Math.round(score * 100) / 100 });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}
