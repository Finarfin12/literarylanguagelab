// lib/reader-pages.ts
// Membagi teks panjang menjadi halaman baca (~900 kata) agar reader hanya merender
// sebagian kecil buku sekaligus. Halaman baru dimulai di judul bab bila memungkinkan.

export interface PageRange {
  start: number; // indeks blok pertama (inklusif)
  end: number; // indeks blok terakhir (eksklusif)
}

export interface ChapterMark {
  index: number;
  title: string;
  page: number;
}

type Unit = { type: "heading" | "paragraph" | "verse"; text: string };

export const DEFAULT_PAGE_WORDS = 900;
// Judul bab memulai halaman baru jika halaman berjalan sudah cukup isi
const MIN_WORDS_BEFORE_CHAPTER_BREAK = 150;

function countWords(text: string) {
  let count = 0;
  let inWord = false;
  for (let i = 0; i < text.length; i++) {
    const space = text.charCodeAt(i) <= 32;
    if (!space && !inWord) count++;
    inWord = !space;
  }
  return count;
}

export function paginate(units: Unit[], targetWords = DEFAULT_PAGE_WORDS): PageRange[] {
  const pages: PageRange[] = [];
  let start = 0;
  let words = 0;

  units.forEach((unit, i) => {
    const w = countWords(unit.text);
    const chapterBreak = unit.type === "heading" && words >= MIN_WORDS_BEFORE_CHAPTER_BREAK;
    const overflow = words > 0 && words + w > targetWords;
    if (i > start && (chapterBreak || overflow)) {
      pages.push({ start, end: i });
      start = i;
      words = 0;
    }
    words += w;
  });
  if (units.length > start) pages.push({ start, end: units.length });
  return pages.length ? pages : [{ start: 0, end: 0 }];
}

export function pageOfBlock(pages: PageRange[], blockIndex: number): number {
  let lo = 0;
  let hi = pages.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (blockIndex < pages[mid].start) hi = mid - 1;
    else if (blockIndex >= pages[mid].end) lo = mid + 1;
    else return mid;
  }
  return Math.max(0, Math.min(pages.length - 1, lo));
}

export function chapterMarks(units: Unit[], pages: PageRange[]): ChapterMark[] {
  const marks: ChapterMark[] = [];
  units.forEach((unit, index) => {
    if (unit.type === "heading") {
      marks.push({ index, title: unit.text.slice(0, 60), page: pageOfBlock(pages, index) });
    }
  });
  return marks;
}
