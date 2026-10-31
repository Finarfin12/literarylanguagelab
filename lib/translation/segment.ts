// Segmentasi teks sumber menjadi kalimat untuk Ruang Kerja Segmen. Fungsi murni, tanpa import.

// Singkatan umum yang diakhiri titik tetapi bukan akhir kalimat (huruf kecil, tanpa titik di tengah).
const ABBREVIATIONS = new Set([
  "mr", "mrs", "ms", "mx", "dr", "prof", "sr", "jr", "st", "mt", "vs", "rev", "hon", "gen", "col", "capt",
  "lt", "sgt", "gov", "sen", "rep", "fig", "no", "vol", "ed", "approx", "dept", "est", "inc", "ltd", "co",
  "e.g", "i.e", "cf", "al", "ca", "viz", "a.m", "p.m", "u.s", "u.k",
]);

/** Token tepat sebelum tanda baca pada posisi `end` (indeks titik pertama). */
function tokenBefore(text: string, end: number): string {
  let start = end;
  while (start > 0 && /[A-Za-z.]/.test(text[start - 1])) start--;
  return text.slice(start, end);
}

function isAbbreviation(token: string): boolean {
  if (!token) return false;
  const t = token.toLowerCase();
  if (ABBREVIATIONS.has(t)) return true;
  // Inisial satu huruf kapital ("J. K. Rowling") dan singkatan bertitik ("U.S.A")
  if (/^[A-Z]$/.test(token)) return true;
  if (/^(?:[A-Za-z]\.)+[A-Za-z]$/.test(token)) return true;
  return false;
}

/** Pecah satu paragraf (tanpa baris kosong) menjadi kalimat. */
function splitParagraph(paragraph: string): string[] {
  const text = paragraph.replace(/\s*\n\s*/g, " ").replace(/[ \t]+/g, " ").trim();
  if (!text) return [];

  const sentences: string[] = [];
  let start = 0;
  // Calon batas: tanda akhir kalimat (+ kutip/kurung penutup), spasi, lalu awal kalimat baru (huruf kapital, angka, atau kutip pembuka + kapital)
  const boundary = /([.!?]+["'”’)\]]*)(\s+)(?=["'“‘(\[]?[A-Z0-9])/g;
  let m: RegExpExecArray | null;
  while ((m = boundary.exec(text)) !== null) {
    const punct = m[1];
    // Hanya titik tunggal yang bisa merupakan singkatan; "?" dan "!" selalu mengakhiri kalimat
    if (punct.startsWith(".") && !punct.startsWith("..")) {
      const token = tokenBefore(text, m.index);
      if (isAbbreviation(token)) continue;
    }
    const end = m.index + punct.length;
    const piece = text.slice(start, end).trim();
    if (piece) sentences.push(piece);
    start = m.index + m[0].length;
  }
  const rest = text.slice(start).trim();
  if (rest) sentences.push(rest);
  return sentences;
}

/**
 * Pecah teks menjadi kalimat. Baris kosong (paragraf) selalu memisahkan segmen;
 * baris baru tunggal di dalam paragraf dianggap pemotongan baris biasa dan digabung.
 * Menangani singkatan umum (Mr., Dr., e.g., i.e.), inisial, angka desimal, dan kutipan.
 */
export function splitSentences(text: string): string[] {
  if (!text || !text.trim()) return [];
  return text
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .flatMap(splitParagraph);
}
