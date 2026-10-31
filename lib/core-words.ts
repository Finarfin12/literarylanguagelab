// Logika murni Kosakata Inti: mencari kata inti (lemma) dari kata apa pun yang disimpan pengguna dan
// menentukan status per kata. Tanpa import agar bisa diuji unit.
// `forms` = bentuk kata dari NGSL (migrasi 0015); kolom boleh kosong/tidak ada sebelum migrasi dijalankan.

export interface CoreWordRow {
  word: string;
  forms?: string[] | null;
}

export type LemmaIndex = Map<string, string>;

export type CoreStatus = "belum" | "sedang" | "dikuasai";

/** Tingkat penguasaan (vocabulary.mastery_level) yang dianggap "dikuasai". */
export const MASTERED_LEVEL = 3;

const norm = (s: string) => s.trim().toLowerCase();

/** Kata inti beserta semua bentuknya, huruf kecil, tanpa duplikat. */
export function wordCandidates(row: CoreWordRow): string[] {
  return Array.from(new Set([norm(row.word), ...(row.forms ?? []).map(norm)].filter(Boolean)));
}

/**
 * Indeks bentuk → kata inti. Kecocokan persis dengan kata inti selalu menang atas bentuk kata;
 * jika sebuah bentuk dimiliki dua kata inti, yang lebih dulu di `rows` (urutan peringkat) dipakai.
 */
export function buildLemmaIndex(rows: CoreWordRow[]): LemmaIndex {
  const index: LemmaIndex = new Map();
  for (const row of rows) index.set(norm(row.word), norm(row.word));
  for (const row of rows) {
    const lemma = norm(row.word);
    for (const form of row.forms ?? []) {
      const f = norm(form);
      if (f && !index.has(f)) index.set(f, lemma);
    }
  }
  return index;
}

/** Kata inti dari `word` ("searched" → "search"); null jika bukan kata inti maupun bentuknya. */
export function lemmaOf(word: string, rows: CoreWordRow[] | LemmaIndex): string | null {
  const index = rows instanceof Map ? rows : buildLemmaIndex(rows);
  return index.get(norm(word)) ?? null;
}

/**
 * Status satu kata inti dari Vocabulary Bank pengguna. `owned` = kata (huruf kecil) → mastery_level.
 * Kata simpanan dalam bentuk lain ("searched") dihitung untuk kata inti "search"; status tertinggi menang.
 */
export function coreStatus(row: CoreWordRow, owned: Map<string, number>): CoreStatus {
  let best: number | null = null;
  for (const candidate of wordCandidates(row)) {
    const level = owned.get(candidate);
    if (level === undefined) continue;
    if (best === null || level > best) best = level;
  }
  if (best === null) return "belum";
  return best >= MASTERED_LEVEL ? "dikuasai" : "sedang";
}

/** Apakah pengguna sudah memiliki kata inti ini (dalam bentuk apa pun). */
export function isOwned(row: CoreWordRow, ownedWords: Set<string>): boolean {
  return wordCandidates(row).some((w) => ownedWords.has(w));
}
