// Menyelaraskan token hasil AI (Bedah Sintaksis) dengan teks ASLI.
// Model sering menghilangkan kata, mengubah spasi, atau menggabung frasa, sehingga menampilkan token mentah membuat
// teks "loncat" (ada kalimat/kata yang hilang). Di sini teks asli selalu ditampilkan utuh: token hanya dipakai untuk
// memberi peran pada potongan yang ditemukan di teks; sisanya menjadi teks biasa (peran "Other").

export type SyntaxRole = "Subject" | "Verb" | "Object" | "Other";
export interface SyntaxToken {
  word: string;
  role: SyntaxRole;
}

const ROLES: SyntaxRole[] = ["Subject", "Verb", "Object", "Other"];

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Gabungan semua `word` hasil = `original` (selalu), dengan peran hanya pada potongan yang cocok urutannya. */
export function alignTokens(original: string, tokens: { word?: unknown; role?: unknown }[]): SyntaxToken[] {
  const out: SyntaxToken[] = [];
  let cursor = 0;
  for (const t of tokens) {
    if (typeof t.word !== "string") continue;
    const w = t.word.trim();
    if (!w) continue;
    const role = ROLES.includes(t.role as SyntaxRole) ? (t.role as SyntaxRole) : "Other";
    // Spasi di token boleh berbeda dari teks asli (spasi ganda, baris baru): cocokkan per kata dengan \s+
    // Batas kata agar "is" tidak cocok di dalam "this"
    const before = /^[\p{L}\p{N}]/u.test(w) ? "(?<![\\p{L}\\p{N}])" : "";
    const after = /[\p{L}\p{N}]$/u.test(w) ? "(?![\\p{L}\\p{N}])" : "";
    const rx = new RegExp(before + w.split(/\s+/).map(escapeRe).join("\\s+") + after, "giu");
    rx.lastIndex = cursor;
    const m = rx.exec(original);
    if (!m) continue; // token tidak ditemukan setelah posisi sekarang: abaikan, teks tetap tampil lewat celah
    if (m.index > cursor) out.push({ word: original.slice(cursor, m.index), role: "Other" });
    out.push({ word: m[0], role });
    cursor = m.index + m[0].length;
  }
  if (cursor < original.length) out.push({ word: original.slice(cursor), role: "Other" });
  return out;
}
