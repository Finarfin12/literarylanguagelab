// Logika murni Modul Belajar (Fase 24): tahap, urutan belajar, progres, dan pelajaran yang disarankan.
// Tanpa impor runtime dan tanpa akses database agar bisa diuji unit (tests/study.test.mts) dan dipakai skrip impor.
// Tidak ada yang dikunci: pelajaran berikutnya hanya disarankan.

export const STAGES = ["fondasi", "transisi", "pendalaman", "lanjut"] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  fondasi: "Fondasi",
  transisi: "Transisi",
  pendalaman: "Pendalaman",
  lanjut: "Lanjut & proyek",
};

export const STAGE_BLURBS: Record<Stage, string> = {
  fondasi: "Kemampuan dasar membaca, menulis, struktur kalimat, dan kosakata.",
  transisi: "Dari bahasa sehari-hari ke bacaan sastra, esai, dan dasar penerjemahan.",
  pendalaman: "Bahasa Indonesia, cara kerja bahasa, dan teori serta praktik penerjemahan.",
  lanjut: "Struktur dan makna lebih dalam, domain khusus, fiksi, penelitian, dan proyek akhir.",
};

export function isStage(v: unknown): v is Stage {
  return typeof v === "string" && (STAGES as readonly string[]).includes(v);
}

export const SLUG = /^[a-z0-9-]{2,80}$/;

/** Batas isi pelajaran (informasi untuk admin, bukan penghalang terbit) dan batas penyimpanan. */
export const LESSON_LIMITS = {
  minWords: 600,
  maxWords: 1500,
  minExercises: 3,
  maxBodyChars: 40000,
  maxSummaryChars: 4000,
  maxTaskChars: 1200,
  maxTitleChars: 140,
  maxObjectives: 8,
  maxSources: 12,
} as const;

export interface SubjectLike {
  slug: string;
  stage: string;
  sort_order: number;
}

export interface LessonLike {
  slug: string;
  subject_slug: string;
  sort_order: number;
}

/** Mata pelajaran dalam urutan belajar lintas tahap (sort_order). */
export function orderSubjects<T extends SubjectLike>(subjects: readonly T[]): T[] {
  return subjects.slice().sort((a, b) => a.sort_order - b.sort_order);
}

/** Pelajaran satu mata pelajaran dalam urutan. */
export function lessonsOf<T extends LessonLike>(lessons: readonly T[], subjectSlug: string): T[] {
  return lessons.filter((l) => l.subject_slug === subjectSlug).sort((a, b) => a.sort_order - b.sort_order);
}

/** Mata pelajaran dikelompokkan per tahap dengan urutan tahap tetap; tahap kosong dibuang. */
export function groupByStage<T extends SubjectLike>(subjects: readonly T[]): { stage: Stage; subjects: T[] }[] {
  const ordered = orderSubjects(subjects);
  return STAGES.map((stage) => ({ stage, subjects: ordered.filter((s) => s.stage === stage) })).filter((g) => g.subjects.length > 0);
}

export interface Progress {
  done: number;
  total: number;
  /** 0-100 */
  percent: number;
}

function progressOf(slugs: readonly string[], completed: ReadonlySet<string>): Progress {
  const total = slugs.length;
  const done = slugs.filter((s) => completed.has(s)).length;
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
}

/** Progres satu mata pelajaran: pelajaran selesai dibanding semua pelajaran terbitnya. */
export function subjectProgress(lessons: readonly LessonLike[], subjectSlug: string, completed: ReadonlySet<string>): Progress {
  return progressOf(lessonsOf(lessons, subjectSlug).map((l) => l.slug), completed);
}

/** Progres satu tahap: semua pelajaran dari semua mata pelajaran di tahap itu. */
export function stageProgress(subjects: readonly SubjectLike[], lessons: readonly LessonLike[], stage: Stage, completed: ReadonlySet<string>): Progress {
  const subjectSlugs = new Set(subjects.filter((s) => s.stage === stage).map((s) => s.slug));
  return progressOf(lessons.filter((l) => subjectSlugs.has(l.subject_slug)).map((l) => l.slug), completed);
}

/** Semua pelajaran dalam urutan belajar global: urutan mata pelajaran, lalu urutan pelajaran. */
export function globalLessonOrder<T extends LessonLike>(subjects: readonly SubjectLike[], lessons: readonly T[]): T[] {
  const out: T[] = [];
  for (const s of orderSubjects(subjects)) out.push(...lessonsOf(lessons, s.slug));
  return out;
}

/**
 * Pelajaran yang disarankan setelah `currentSlug` (atau dari awal bila null): pelajaran berikutnya di urutan global
 * yang belum selesai. Tidak mengunci apa pun; pelajaran saat ini tidak pernah disarankan lagi. null bila semuanya selesai.
 */
export function nextLesson<T extends LessonLike>(
  subjects: readonly SubjectLike[],
  lessons: readonly T[],
  completed: ReadonlySet<string>,
  currentSlug: string | null = null
): T | null {
  const order = globalLessonOrder(subjects, lessons);
  const at = currentSlug ? order.findIndex((l) => l.slug === currentSlug) : -1;
  const after = at >= 0 ? order.slice(at + 1) : order;
  const nextOpen = after.find((l) => !completed.has(l.slug));
  if (nextOpen) return nextOpen;
  // Setelah pelajaran terakhir: tawarkan yang masih terlewat di depan, selain pelajaran saat ini
  return order.slice(0, Math.max(at, 0)).find((l) => !completed.has(l.slug) && l.slug !== currentSlug) ?? null;
}

/**
 * Pelajaran yang disarankan di halaman Modul: lanjutkan mata pelajaran yang sedang berjalan (sebagian selesai, paling awal
 * di urutan), selain itu pelajaran pertama yang belum selesai di urutan global. null bila belum ada pelajaran atau semuanya selesai.
 */
export function suggestedLesson<T extends LessonLike>(subjects: readonly SubjectLike[], lessons: readonly T[], completed: ReadonlySet<string>): T | null {
  for (const s of orderSubjects(subjects)) {
    const own = lessonsOf(lessons, s.slug);
    const done = own.filter((l) => completed.has(l.slug)).length;
    if (done > 0 && done < own.length) return own.find((l) => !completed.has(l.slug)) ?? null;
  }
  return globalLessonOrder(subjects, lessons).find((l) => !completed.has(l.slug)) ?? null;
}

/** Apakah semua pelajaran sebuah mata pelajaran sudah selesai (kuis akhir layak ditawarkan). */
export function subjectComplete(lessons: readonly LessonLike[], subjectSlug: string, completed: ReadonlySet<string>): boolean {
  const own = lessonsOf(lessons, subjectSlug);
  return own.length > 0 && own.every((l) => completed.has(l.slug));
}

// --- Normalisasi masukan (dipakai server action admin dan halaman tugas) ---

const str = (v: unknown, max: number): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t && t.length <= max ? t : null;
};

export interface LessonSource {
  title: string;
  url?: string;
  note?: string;
  /** "ok" = sudah diperiksa; "perlu-cek" = belum bisa dipastikan. */
  status?: "ok" | "perlu-cek";
}

/** Merapikan daftar sumber; entri rusak dilewati. URL hanya http(s). */
export function cleanSources(raw: unknown): LessonSource[] {
  if (!Array.isArray(raw)) return [];
  const out: LessonSource[] = [];
  for (const r of raw.slice(0, LESSON_LIMITS.maxSources)) {
    const o = typeof r === "object" && r !== null ? (r as Record<string, unknown>) : null;
    const title = str(o?.title, 200);
    if (!title) continue;
    const url = typeof o?.url === "string" && /^https?:\/\/\S+$/.test(o.url.trim()) ? o.url.trim().slice(0, 300) : undefined;
    const note = str(o?.note, 300) ?? undefined;
    const status = o?.status === "perlu-cek" ? "perlu-cek" : o?.status === "ok" ? "ok" : undefined;
    out.push({ title, ...(url ? { url } : {}), ...(note ? { note } : {}), ...(status ? { status } : {}) });
  }
  return out;
}

/** Sumber dari teks satu-per-baris "Judul | https://alamat | ok" (status bawaan perlu-cek). Dipakai formulir admin. */
export function parseSourceLines(text: string): LessonSource[] {
  const raw = String(text ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title = "", url = "", status = ""] = line.split("|").map((s) => s.trim());
      return { title, url: url && url !== "-" ? url : undefined, status: status === "ok" ? "ok" : "perlu-cek" };
    });
  return cleanSources(raw);
}

/** Kebalikan parseSourceLines, untuk mengisi formulir admin. */
export function formatSourceLines(sources: readonly LessonSource[]): string {
  return sources.map((s) => `${s.title} | ${s.url ?? "-"} | ${s.status === "ok" ? "ok" : "perlu-cek"}`).join("\n");
}

/** Daftar teks (tujuan, kemampuan) dari array atau dari teks satu-per-baris. */
export function cleanList(raw: unknown, max: number, maxLen = 300): string[] {
  const items = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(/\r?\n/) : [];
  const out: string[] = [];
  for (const i of items) {
    const t = typeof i === "string" ? i.replace(/^\s*[-*]\s+/, "").trim() : "";
    if (t && t.length <= maxLen) out.push(t);
    if (out.length >= max) break;
  }
  return out;
}

export interface LessonDraftInput {
  slug: string;
  subject_slug: string;
  sort_order: number;
  title: string;
  objectives: string[];
  body_md: string;
  summary_md: string;
  task: { prompt: string } | null;
  tool_paths: string[];
  sources: LessonSource[];
}

/** Validasi ketat satu pelajaran untuk disimpan (admin). Error berbahasa Indonesia. */
export function cleanLessonInput(raw: unknown): { ok: true; value: LessonDraftInput } | { ok: false; error: string } {
  if (typeof raw !== "object" || raw === null) return { ok: false, error: "Pelajaran harus berupa objek." };
  const r = raw as Record<string, unknown>;
  const slug = typeof r.slug === "string" ? r.slug.trim().toLowerCase() : "";
  if (!SLUG.test(slug)) return { ok: false, error: "Slug hanya huruf kecil, angka, dan tanda hubung (2-80 karakter)." };
  const subject = typeof r.subject_slug === "string" ? r.subject_slug.trim().toLowerCase() : "";
  if (!SLUG.test(subject)) return { ok: false, error: "Pilih mata pelajaran." };
  const order = Number(r.sort_order);
  if (!Number.isInteger(order) || order < 0 || order > 1000) return { ok: false, error: "Urutan harus bilangan bulat 0-1000." };
  const title = str(r.title, LESSON_LIMITS.maxTitleChars);
  if (!title) return { ok: false, error: `Judul wajib diisi (maks. ${LESSON_LIMITS.maxTitleChars} karakter).` };
  const objectives = cleanList(r.objectives, LESSON_LIMITS.maxObjectives);
  const body = typeof r.body_md === "string" ? r.body_md.trim() : "";
  if (body.length > LESSON_LIMITS.maxBodyChars) return { ok: false, error: `Isi pelajaran terlalu panjang (maks. ${LESSON_LIMITS.maxBodyChars.toLocaleString("id-ID")} karakter).` };
  const summary = typeof r.summary_md === "string" ? r.summary_md.trim() : "";
  if (summary.length > LESSON_LIMITS.maxSummaryChars) return { ok: false, error: "Rangkuman terlalu panjang." };
  const taskPrompt = typeof r.task === "string" ? r.task.trim() : typeof r.task === "object" && r.task !== null ? String((r.task as Record<string, unknown>).prompt ?? "").trim() : "";
  if (taskPrompt.length > LESSON_LIMITS.maxTaskChars) return { ok: false, error: "Tugas terlalu panjang." };
  // Dari formulir admin: path dipisah koma atau baris baru
  const toolsRaw = Array.isArray(r.tool_paths) ? r.tool_paths : typeof r.tool_paths === "string" ? r.tool_paths.split(/[\n,]/) : [];
  const tools = cleanList(toolsRaw, 6, 120).filter((p) => /^\/[a-z0-9/_-]*$/i.test(p));
  return {
    ok: true,
    value: {
      slug,
      subject_slug: subject,
      sort_order: order,
      title,
      objectives,
      body_md: body,
      summary_md: summary,
      task: taskPrompt ? { prompt: taskPrompt } : null,
      tool_paths: tools,
      sources: cleanSources(r.sources),
    },
  };
}
