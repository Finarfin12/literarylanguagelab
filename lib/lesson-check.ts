// Pemeriksaan otomatis satu pelajaran (Fase 24.2). HANYA informasi untuk admin; tidak memblokir Terbitkan,
// seperti lib/graded-check.ts. Fungsi murni tanpa akses database (tests/study.test.mts); tipe-saja pada impor
// agar bisa dijalankan skrip impor langsung oleh Node.
import { LESSON_LIMITS } from "./study.ts";

export interface LessonForCheck {
  title: string;
  objectives: readonly string[];
  body_md: string;
  summary_md: string;
  tool_paths: readonly string[];
  sources: readonly { title: string; url?: string; status?: string }[];
}

export interface CheckItem {
  id: "objectives" | "words" | "exercises" | "summary" | "sources" | "tools" | "verify";
  label: string;
  ok: boolean;
  detail: string;
}

export interface LessonCheck {
  wordCount: number;
  items: CheckItem[];
  /** true bila semua butir lolos. */
  ok: boolean;
}

/** Hitung kata isi pelajaran: tanda markdown dan blok kode tidak dihitung. */
export function countWords(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*_`|~-]+/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1");
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

/** Jumlah penanda "[perlu cek]" di teks (rujukan atau klaim yang belum dipastikan). */
export function countUnverified(...texts: string[]): number {
  return texts.reduce((n, t) => n + (t.match(/\[perlu cek\]/gi)?.length ?? 0), 0);
}

/**
 * @param exerciseCount jumlah soal yang terkait pelajaran (draf maupun terbit)
 * @param knownPaths path yang ada di lib/rooms.ts (allRoomPaths)
 */
export function checkLesson(lesson: LessonForCheck, exerciseCount: number, knownPaths: ReadonlySet<string>): LessonCheck {
  const words = countWords(lesson.body_md);
  const { minWords, maxWords, minExercises } = LESSON_LIMITS;
  const unknownTools = lesson.tool_paths.filter((p) => !knownPaths.has(p));
  const unverified = countUnverified(lesson.body_md, lesson.summary_md, ...lesson.sources.map((s) => `${s.title} ${s.status === "perlu-cek" ? "[perlu cek]" : ""}`));

  const items: CheckItem[] = [
    {
      id: "objectives",
      label: "Tujuan pelajaran",
      ok: lesson.objectives.length >= 1,
      detail: lesson.objectives.length ? `${lesson.objectives.length} tujuan` : "Belum ada tujuan.",
    },
    {
      id: "words",
      label: "Panjang isi",
      ok: words >= minWords && words <= maxWords,
      detail: `${words} kata (target ${minWords}-${maxWords})`,
    },
    {
      id: "exercises",
      label: "Latihan",
      ok: exerciseCount >= minExercises,
      detail: `${exerciseCount} soal (minimal ${minExercises})`,
    },
    {
      id: "summary",
      label: "Rangkuman",
      ok: lesson.summary_md.trim().length > 0,
      detail: lesson.summary_md.trim() ? "Ada" : "Belum ada rangkuman.",
    },
    {
      id: "sources",
      label: "Sumber",
      ok: lesson.sources.length >= 1,
      detail: lesson.sources.length ? `${lesson.sources.length} sumber` : "Belum ada sumber.",
    },
    {
      id: "tools",
      label: "Alat praktik",
      ok: unknownTools.length === 0,
      detail: unknownTools.length ? `Tidak ada di ruang: ${unknownTools.join(", ")}` : lesson.tool_paths.length ? `${lesson.tool_paths.length} alat valid` : "Tanpa alat (boleh)",
    },
    {
      id: "verify",
      label: "Rujukan perlu dicek",
      ok: unverified === 0,
      detail: unverified ? `${unverified} penanda [perlu cek]` : "Tidak ada penanda",
    },
  ];
  return { wordCount: words, items, ok: items.every((i) => i.ok) };
}
