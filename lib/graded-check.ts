// Pemeriksaan otomatis bacaan berjenjang (Fase 18.6): jumlah kata sesuai level dan persentase kata Kosakata Inti.
// HANYA informasi untuk admin; tidak memblokir Terbitkan. Fungsi murni tanpa impor runtime (tests/graded-check.test.mts).

export interface CoreWordLite {
  word: string;
  /** Peringkat NGSL (band); null/undefined = tidak diketahui. */
  band?: number | null;
  /** Bentuk kata dari NGSL (migrasi 0015), mis. searched untuk search. */
  forms?: string[] | null;
}

export interface LevelRule {
  /** Rentang jumlah kata; null = tanpa batas (hanya ditampilkan). */
  min: number | null;
  max: number | null;
  /** Kata dihitung "dalam daftar" bila peringkat NGSL-nya <= batas ini. */
  bandLimit: number;
  /** Target persentase cakupan. */
  target: number;
}

export const LEVEL_RULES: Record<string, LevelRule> = {
  A1: { min: 80, max: 120, bandLimit: 500, target: 90 },
  A2: { min: 120, max: 180, bandLimit: 1000, target: 92 },
  B1: { min: null, max: null, bandLimit: 2000, target: 92 },
  B2: { min: null, max: null, bandLimit: 2800, target: 92 },
};

export interface GradedCheck {
  wordCount: number;
  /** null bila level tidak punya rentang (B1 ke atas) atau level tidak dikenal. */
  inRange: boolean | null;
  range: { min: number; max: number } | null;
  /** Persentase token yang dihitung dan ada di Kosakata Inti pada level itu; null bila daftar kosong / tak ada token. */
  coveragePct: number | null;
  target: number | null;
  meetsTarget: boolean | null;
  /** Jumlah token yang dihitung (nama diri dan angka tidak dihitung). */
  counted: number;
  /** Contoh kata di luar daftar (unik, maksimal 12), terurut menurut kemunculan. */
  offListSample: string[];
  offListCount: number;
}

const APOS = /[‘’ʼ`´]/g;
const IRREGULAR_NT: Record<string, string> = { "can't": "can", "won't": "will", "shan't": "shall", "ain't": "be" };

/** Jumlah kata: potongan yang dipisah spasi dan memuat huruf atau angka. */
export function countWords(content: string): number {
  return (content.match(/\S+/g) ?? []).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

interface Tok {
  text: string;
  sentenceStart: boolean;
}

/** Memecah teks menjadi kata (huruf, apostrof, tanda hubung dipecah), menandai kata di awal kalimat. */
function tokenize(content: string): Tok[] {
  const text = content.replace(APOS, "'");
  const out: Tok[] = [];
  // Angka dengan akhiran huruf (10th, 2nd) satu token angka, bukan angka + kata
  const re = /\d+(?:[.,]\d+)?[A-Za-z]*|[A-Za-z][A-Za-z']*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const before = text.slice(0, m.index).replace(/[\s"'“”(\[]+$/, "");
    const start = before === "" || /[.!?:\n]$/.test(before) || /\n\s*$/.test(text.slice(0, m.index));
    out.push({ text: m[0].replace(/^'+|'+$/g, ""), sentenceStart: start });
  }
  return out.filter((t) => t.text !== "");
}

/** Mengubah "don't" → "do", "she's" → "she", "I'm" → "i", "they're" → "they"; kata lain tetap. */
function baseOf(lower: string): string {
  if (IRREGULAR_NT[lower]) return IRREGULAR_NT[lower];
  const m = lower.match(/^(.+?)(?:n't|'s|'m|'re|'ve|'ll|'d)$/);
  return m ? m[1] : lower;
}

const isCapitalized = (w: string) => /^[A-Z]/.test(w);

/**
 * Memeriksa bacaan. Nama diri (huruf kapital di tengah kalimat, atau di awal kalimat bila nama yang sama muncul
 * di tengah kalimat) dan angka tidak dihitung. Kata dikenali lewat `word` atau `forms`.
 */
export function checkGradedText(content: string, level: string, coreWords: readonly CoreWordLite[]): GradedCheck {
  const rule = LEVEL_RULES[level.toUpperCase()] ?? null;
  const wordCount = countWords(content);
  const range = rule && rule.min !== null && rule.max !== null ? { min: rule.min, max: rule.max } : null;
  const inRange = range ? wordCount >= range.min && wordCount <= range.max : null;

  const empty: GradedCheck = {
    wordCount, inRange, range, coveragePct: null, target: rule?.target ?? null, meetsTarget: null, counted: 0, offListSample: [], offListCount: 0,
  };
  if (!rule || coreWords.length === 0) return empty;

  // Indeks kata (huruf kecil) → peringkat terendah. Kecocokan persis dengan kata inti menang atas bentuk kata.
  const rank = new Map<string, number>();
  const BIG = Number.MAX_SAFE_INTEGER;
  for (const c of coreWords) {
    const w = c.word.trim().toLowerCase();
    if (w) rank.set(w, Math.min(rank.get(w) ?? BIG, c.band ?? BIG));
  }
  for (const c of coreWords) {
    const band = c.band ?? BIG;
    for (const f of c.forms ?? []) {
      const k = f.trim().toLowerCase();
      if (k && !rank.has(k)) rank.set(k, band);
    }
  }
  // "I" selalu ada di daftar umum walau tidak tercatat sebagai kata inti
  if (!rank.has("i")) rank.set("i", 1);

  const toks = tokenize(content);
  const midNames = new Set(toks.filter((t) => !t.sentenceStart && isCapitalized(t.text) && t.text !== "I" && !/^I'/.test(t.text)).map((t) => t.text.toLowerCase()));

  let counted = 0;
  let inList = 0;
  const off: string[] = [];
  const seen = new Set<string>();
  for (const t of toks) {
    if (/^\d/.test(t.text)) continue;
    const lower = t.text.toLowerCase();
    const isI = t.text === "I" || /^I'/.test(t.text);
    if (!isI && isCapitalized(t.text) && (!t.sentenceStart || midNames.has(lower))) continue; // nama diri
    const base = baseOf(lower);
    counted++;
    const r = rank.get(base) ?? rank.get(lower);
    if (r !== undefined && r <= rule.bandLimit) inList++;
    else if (!seen.has(base)) {
      seen.add(base);
      off.push(base);
    }
  }

  if (counted === 0) return empty;
  const coveragePct = Math.round((inList / counted) * 1000) / 10;
  return {
    ...empty,
    coveragePct,
    counted,
    meetsTarget: coveragePct >= rule.target,
    offListSample: off.slice(0, 12),
    offListCount: counted - inList,
  };
}

/** Ringkasan satu baris untuk kartu draft: "112 kata · 94% Kosakata Inti A1 ✓" (hanya jumlah kata bila daftar kosong). */
export function summarizeCheck(c: GradedCheck, level: string): string {
  const parts = [`${c.wordCount} kata`];
  if (c.range) parts[0] += c.inRange ? " ✓" : ` (di luar ${c.range.min}–${c.range.max})`;
  if (c.coveragePct !== null) parts.push(`${c.coveragePct}% Kosakata Inti ${level.toUpperCase()}${c.meetsTarget ? " ✓" : " (di bawah target " + c.target + "%)"}`);
  return parts.join(" · ");
}
