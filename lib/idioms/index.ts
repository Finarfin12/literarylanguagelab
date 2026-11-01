// Deteksi idiom lokal TANPA AI (Fase 14f). Fungsi murni: data (lib/idioms/db.ts) diberikan lewat parameter agar modul ini
// bisa diuji unit tanpa alias path. Pemakai di aplikasi memakai detectIdiomsInText() dari lib/idioms/detect.ts.

export interface IdiomSource {
  phrase: string;
  meaning: string;
  indonesian: string;
}

export interface CompiledIdiom extends IdiomSource {
  pattern: RegExp;
}

export interface IdiomMatch extends IdiomSource {
  /** Posisi awal di teks (indeks UTF-16) dan panjang teks yang cocok. */
  index: number;
  length: number;
  matched: string;
}

/** Batas panjang teks yang diproses sekali jalan. */
export const MAX_TEXT_LENGTH = 20000;

const APOSTROPHE = "['’]";
const POSSESSIVE = `(?:my|your|his|her|its|our|their|[A-Za-z]+${APOSTROPHE}s)`;
const OBJECT = "(?:someone|somebody|him|her|me|you|them|us)";

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Pola untuk satu frasa. "someone's" cocok dengan kata ganti/nama kepemilikan apa pun (my, his, John's, ...),
 * "someone" cocok dengan objek (him, her, somebody, ...). Apostrof lurus maupun lengkung diterima; spasi/baris baru fleksibel.
 */
export function buildPattern(phrase: string): RegExp {
  const parts = phrase
    .trim()
    .split(/\s+/)
    .map((tok) => {
      const lower = tok.toLowerCase();
      if (lower === "someone's" || lower === "somebody's") return POSSESSIVE;
      if (lower === "someone" || lower === "somebody") return OBJECT;
      return escapeRe(tok).replace(/['’]/g, APOSTROPHE);
    });
  return new RegExp("(?<![\\p{L}\\p{N}])" + parts.join("\\s+") + "(?![\\p{L}\\p{N}])", "giu");
}

export function compileIdioms(sources: IdiomSource[]): CompiledIdiom[] {
  return sources.map((s) => ({ ...s, pattern: buildPattern(s.phrase) }));
}

/** Semua idiom yang ditemukan, urut menurut posisi. Yang tumpang tindih: yang lebih awal/lebih panjang menang. */
export function detectIdioms(text: string, compiled: CompiledIdiom[], maxLength = MAX_TEXT_LENGTH): IdiomMatch[] {
  const input = text.length > maxLength ? text.slice(0, maxLength) : text;
  const found: IdiomMatch[] = [];
  for (const idiom of compiled) {
    const re = new RegExp(idiom.pattern.source, idiom.pattern.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(input)) !== null) {
      if (m[0].length === 0) {
        re.lastIndex++;
        continue;
      }
      found.push({ phrase: idiom.phrase, meaning: idiom.meaning, indonesian: idiom.indonesian, index: m.index, length: m[0].length, matched: m[0] });
    }
  }
  found.sort((a, b) => a.index - b.index || b.length - a.length);
  const out: IdiomMatch[] = [];
  let end = -1;
  for (const f of found) {
    if (f.index < end) continue; // tumpang tindih dengan yang sudah diterima
    out.push(f);
    end = f.index + f.length;
  }
  return out;
}
