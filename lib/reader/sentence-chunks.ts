// Memecah paragraf menjadi potongan pendek (default 2 kalimat) untuk Bedah Sintaksis.
// Paragraf buku klasik panjang membuat AI mengembalikan JSON yang terlalu besar/terpotong (Groq: "Failed to validate JSON"),
// jadi tiap potongan dikirim terpisah lalu hasilnya disambung. Menggabungkan semua potongan selalu menghasilkan teks asli
// (spasi dipertahankan), sehingga token hasil analisis tetap bisa direkonstruksi.

export const SENTENCES_PER_CHUNK = 2;
/** Batas kata per potongan; kalimat yang lebih panjang dipotong di batas kata. */
export const MAX_WORDS_PER_CHUNK = 45;

const SENTENCE_RE = /[^.!?]+(?:[.!?]+["'”’)\]]*)?\s*/g;

function wordCount(s: string): number {
  const t = s.trim();
  return t ? t.split(/\s+/).length : 0;
}

/** Pecah satu kalimat yang terlalu panjang menjadi bagian ≤ maxWords kata (spasi ikut bagian sebelumnya). */
function splitLongSentence(sentence: string, maxWords: number): string[] {
  if (wordCount(sentence) <= maxWords) return [sentence];
  const parts = sentence.match(/\S+\s*/g) ?? [sentence];
  const out: string[] = [];
  for (let i = 0; i < parts.length; i += maxWords) out.push(parts.slice(i, i + maxWords).join(""));
  return out;
}

/** Kalimat (dengan spasi/baris baru di belakangnya). Teks tanpa tanda akhir kalimat tetap menjadi satu kalimat. */
export function splitSentences(text: string): string[] {
  return text.match(SENTENCE_RE) ?? (text ? [text] : []);
}

export function chunkText(text: string, perChunk = SENTENCES_PER_CHUNK, maxWords = MAX_WORDS_PER_CHUNK): string[] {
  const sentences = splitSentences(text).flatMap((s) => splitLongSentence(s, maxWords));
  const chunks: string[] = [];
  let current = "";
  let count = 0;
  for (const s of sentences) {
    const fits = count < perChunk && wordCount(current) + wordCount(s) <= maxWords;
    if (current && !fits) {
      chunks.push(current);
      current = "";
      count = 0;
    }
    current += s;
    count++;
  }
  if (current) chunks.push(current);
  return chunks;
}
