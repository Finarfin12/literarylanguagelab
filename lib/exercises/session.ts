// Memilih soal untuk satu sesi latihan (Fase 15). Murni: acakan diberikan lewat `rng` supaya hasilnya bisa diuji.
import type { AttemptSummary } from "./types";

export type Rng = () => number;

/** Pembangkit angka acak berbenih (mulberry32): benih sama → urutan sama. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Benih angka dari teks (id soal) agar urutan tampilan stabil antar render. */
export function seedFromString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Salinan array yang diacak (Fisher–Yates). */
export function shuffled<T>(items: readonly T[], rng: Rng): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Urutan tampilan untuk pilihan/potongan kata: acak tetapi stabil (berbenih dari `seedKey`) dan, bila mungkin,
 * tidak sama dengan urutan asli — supaya soal "susun kalimat" tidak muncul dalam keadaan sudah benar.
 */
export function displayOrder<T>(items: readonly T[], seedKey: string): T[] {
  if (items.length < 2) return items.slice();
  const rng = mulberry32(seedFromString(seedKey));
  let out = shuffled(items, rng);
  if (out.every((x, i) => x === items[i])) out = [...out.slice(1), out[0]];
  return out;
}

/** Percobaan terakhir per soal. */
export function latestAttempts(attempts: readonly AttemptSummary[]): Map<string, AttemptSummary> {
  const latest = new Map<string, AttemptSummary>();
  for (const a of attempts) {
    const prev = latest.get(a.exercise_id);
    if (!prev || a.created_at > prev.created_at) latest.set(a.exercise_id, a);
  }
  return latest;
}

/**
 * Memilih paling banyak `count` soal. Prioritas: (1) soal yang percobaan terakhirnya salah, (2) soal yang belum
 * pernah dikerjakan, (3) soal yang terakhir dijawab benar, yang paling lama lebih dulu. Dalam tiap kelompok urutannya
 * diacak; hasil akhir diacak lagi supaya soal salah tidak selalu berada di depan.
 */
export function pickSession<T extends { id: string }>(
  exercises: readonly T[],
  attempts: readonly AttemptSummary[],
  count: number,
  rng: Rng
): T[] {
  const n = Math.max(0, Math.floor(count));
  if (n === 0 || exercises.length === 0) return [];
  const latest = latestAttempts(attempts);

  const missed: T[] = [];
  const fresh: T[] = [];
  const done: T[] = [];
  for (const ex of exercises) {
    const a = latest.get(ex.id);
    if (!a) fresh.push(ex);
    else if (!a.correct) missed.push(ex);
    else done.push(ex);
  }
  // Yang terakhir benar: yang paling lama tidak diulang dulu; seri diacak lewat acakan sebelum sortir stabil
  const doneSorted = shuffled(done, rng).sort((x, y) => (latest.get(x.id)!.created_at < latest.get(y.id)!.created_at ? -1 : latest.get(x.id)!.created_at > latest.get(y.id)!.created_at ? 1 : 0));

  const picked = [...shuffled(missed, rng), ...shuffled(fresh, rng), ...doneSorted].slice(0, n);
  return shuffled(picked, rng);
}
