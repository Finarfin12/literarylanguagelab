// Logika murni Kursus Dasar (Fase 16): bentuk langkah unit, validasi, persen selesai, dan unit yang disarankan.
// Tanpa impor runtime dan tanpa akses database agar bisa diuji unit (tests/course.test.mts).
// Unit TIDAK dikunci: unit berikutnya hanya disarankan.

export const STEP_TYPES = ["vocab", "grammar", "read", "listen", "exercise", "speak"] as const;
export type StepType = (typeof STEP_TYPES)[number];

export const STEP_LABELS: Record<StepType, string> = {
  vocab: "Kosakata",
  grammar: "Pola grammar",
  read: "Baca",
  listen: "Dengar",
  exercise: "Latihan",
  speak: "Bicara",
};

export interface VocabItem {
  word: string;
  /** Arti singkat bahasa Indonesia (opsional). */
  meaning_id?: string;
  /** Definisi bahasa Inggris sederhana; bila kosong diambil dari Kosakata Inti (definition_en, Fase 14g). */
  definition_en?: string;
}

interface StepBase {
  /** Judul langkah yang tampil di pemutar; bila kosong dipakai nama jenis langkah. */
  title?: string;
}

export type CourseStep =
  | (StepBase & { type: "vocab"; items: VocabItem[] })
  | (StepBase & { type: "grammar"; topic_slug: string })
  | (StepBase & { type: "read"; text_id?: string; content?: string; note_id?: string })
  | (StepBase & { type: "listen"; text: string; note_id?: string })
  | (StepBase & { type: "exercise"; count?: number })
  | (StepBase & { type: "speak"; sentences: string[]; scenario_id?: string });

export interface CourseUnitLike {
  slug: string;
  cefr_level: string;
  sort_order: number;
  /** Jumlah langkah yang sudah berisi (bukan placeholder). */
  ready_steps?: number;
}

export interface UnitProgressLike {
  unit_slug: string;
  /** Jumlah langkah yang sudah selesai = indeks langkah berikutnya (0-based). */
  step_index: number;
  completed_at: string | null;
}

/** Urutan level kursus; A0 = pra-A1 (Unit 0, penjelasan berbahasa Indonesia penuh). */
export const COURSE_LEVELS = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"] as const;

const SLUG = /^[a-z0-9-]{2,64}$/;

const str = (v: unknown, max: number): string | undefined => {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t && t.length <= max ? t : undefined;
};

function cleanItems(raw: unknown): VocabItem[] | null {
  if (!Array.isArray(raw)) return null;
  const out: VocabItem[] = [];
  for (const r of raw) {
    // Boleh berupa teks saja ("apple") atau objek
    const o = typeof r === "string" ? { word: r } : (r as Record<string, unknown> | null);
    const word = str(o?.word, 60);
    if (!word) return null;
    const item: VocabItem = { word };
    const m = str(o?.meaning_id, 160);
    const d = str(o?.definition_en, 240);
    if (m) item.meaning_id = m;
    if (d) item.definition_en = d;
    out.push(item);
  }
  return out;
}

/** Merapikan satu langkah; null bila bentuknya tidak dikenal atau bidangnya melanggar batas. */
export function cleanStep(raw: unknown): CourseStep | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const title = str(r.title, 120);
  const base = title ? { title } : {};

  switch (r.type) {
    case "vocab": {
      const items = cleanItems(r.items ?? []);
      return items && items.length <= 40 ? { ...base, type: "vocab", items } : null;
    }
    case "grammar": {
      const topic = r.topic_slug === undefined || r.topic_slug === "" ? "" : r.topic_slug;
      if (typeof topic !== "string" || (topic !== "" && !SLUG.test(topic))) return null;
      return { ...base, type: "grammar", topic_slug: topic };
    }
    case "read": {
      const text_id = r.text_id === undefined || r.text_id === "" ? undefined : str(r.text_id, 64);
      const content = r.content === undefined || r.content === "" ? undefined : str(r.content, 6000);
      const note = r.note_id === undefined || r.note_id === "" ? undefined : str(r.note_id, 600);
      if ((r.text_id && !text_id) || (r.content && !content) || (r.note_id && !note)) return null;
      return { ...base, type: "read", ...(text_id ? { text_id } : {}), ...(content ? { content } : {}), ...(note ? { note_id: note } : {}) };
    }
    case "listen": {
      const text = r.text === undefined || r.text === "" ? "" : str(r.text, 600);
      const note = r.note_id === undefined || r.note_id === "" ? undefined : str(r.note_id, 600);
      if (text === undefined || (r.note_id && !note)) return null;
      return { ...base, type: "listen", text, ...(note ? { note_id: note } : {}) };
    }
    case "exercise": {
      if (r.count === undefined || r.count === null) return { ...base, type: "exercise" };
      const n = Number(r.count);
      return Number.isInteger(n) && n >= 1 && n <= 20 ? { ...base, type: "exercise", count: n } : null;
    }
    case "speak": {
      const list = Array.isArray(r.sentences) ? r.sentences : r.sentences === undefined ? [] : null;
      if (!list || list.length > 12) return null;
      const sentences: string[] = [];
      for (const s of list) {
        const t = str(s, 200);
        if (!t) return null;
        sentences.push(t);
      }
      const scenario = r.scenario_id === undefined || r.scenario_id === "" ? undefined : str(r.scenario_id, 64);
      if (r.scenario_id && !scenario) return null;
      return { ...base, type: "speak", sentences, ...(scenario ? { scenario_id: scenario } : {}) };
    }
    default:
      return null;
  }
}

/** Membaca `steps` dari database dengan longgar: langkah yang rusak dilewati supaya satu data buruk tidak merusak unit. */
export function parseSteps(raw: unknown): CourseStep[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(cleanStep).filter((s): s is CourseStep => s !== null);
}

/** Validasi ketat untuk admin: semua langkah harus sah. */
export function validateSteps(raw: unknown): { ok: true; value: CourseStep[] } | { ok: false; error: string } {
  if (!Array.isArray(raw)) return { ok: false, error: "Langkah harus berupa daftar." };
  if (raw.length > 20) return { ok: false, error: "Maksimal 20 langkah per unit." };
  const value: CourseStep[] = [];
  for (let i = 0; i < raw.length; i++) {
    const s = cleanStep(raw[i]);
    if (!s) return { ok: false, error: `Langkah ${i + 1} tidak valid (cek isi dan batas panjangnya).` };
    value.push(s);
  }
  return { ok: true, value };
}

/** Langkah placeholder: merujuk konten yang belum diisi. Pemutar menandainya "belum tersedia" dan boleh dilewati. */
export function isStepEmpty(step: CourseStep): boolean {
  switch (step.type) {
    case "vocab":
      return step.items.length === 0;
    case "grammar":
      return !step.topic_slug;
    case "read":
      return !step.text_id && !step.content;
    case "listen":
      return !step.text;
    case "exercise":
      return false; // ada atau tidaknya soal unit diketahui saat dimuat (ExerciseSession menanganinya)
    case "speak":
      return step.sentences.length === 0 && !step.scenario_id;
  }
}

/** Jumlah langkah yang sudah berisi. */
export function readySteps(steps: readonly CourseStep[]): number {
  return steps.filter((s) => !isStepEmpty(s)).length;
}

export function stepTitle(step: CourseStep): string {
  return step.title || STEP_LABELS[step.type];
}

/** Persen selesai (0-100). Unit yang ditandai selesai selalu 100. */
export function unitPercent(stepIndex: number, totalSteps: number, completed: boolean): number {
  if (completed) return 100;
  if (totalSteps <= 0) return 0;
  const done = Math.max(0, Math.min(totalSteps, Math.floor(stepIndex || 0)));
  return Math.round((done / totalSteps) * 100);
}

/**
 * Setelah langkah `current` selesai: indeks langkah berikutnya dan apakah unit selesai. Kemajuan tidak pernah
 * mundur (mengulang langkah lama tidak mengurangi progres).
 */
export function advance(current: number, savedIndex: number, totalSteps: number): { stepIndex: number; completed: boolean } {
  const reached = Math.max(Math.floor(savedIndex || 0), Math.floor(current) + 1);
  const stepIndex = Math.min(reached, totalSteps);
  return { stepIndex, completed: totalSteps > 0 && stepIndex >= totalSteps };
}

/** Langkah yang dibuka saat unit dibuka: lanjutkan dari yang belum selesai; unit selesai mulai dari awal. */
export function resumeIndex(progress: UnitProgressLike | null | undefined, totalSteps: number): number {
  if (!progress || progress.completed_at || totalSteps <= 0) return 0;
  return Math.max(0, Math.min(totalSteps - 1, Math.floor(progress.step_index || 0)));
}

const levelRank = (l: string | null | undefined): number => {
  const i = (COURSE_LEVELS as readonly string[]).indexOf((l ?? "").toUpperCase());
  return i < 0 ? -1 : i;
};

/**
 * Unit yang disarankan (tidak ada yang dikunci): (1) unit yang sedang dikerjakan, (2) unit pertama yang belum
 * selesai dan sudah punya langkah berisi, pada level pengguna atau di atasnya. Unit di bawah level pengguna
 * dilewati, kecuali tidak ada pilihan lain. null bila semuanya selesai atau belum ada unit berisi.
 */
export function suggestNextUnit<T extends CourseUnitLike>(units: readonly T[], progress: readonly UnitProgressLike[], userCefr?: string | null): T | null {
  const byUnit = new Map(progress.map((p) => [p.unit_slug, p]));
  const sorted = units.slice().sort((a, b) => a.sort_order - b.sort_order);
  const open = sorted.filter((u) => !byUnit.get(u.slug)?.completed_at && (u.ready_steps ?? 1) > 0);

  const inProgress = open.find((u) => (byUnit.get(u.slug)?.step_index ?? 0) > 0);
  if (inProgress) return inProgress;

  const user = levelRank(userCefr);
  const atOrAbove = user > 0 ? open.filter((u) => levelRank(u.cefr_level) >= user) : open;
  return atOrAbove[0] ?? open[0] ?? null;
}

/** Ringkasan untuk daftar unit. */
export function courseSummary(units: readonly CourseUnitLike[], progress: readonly UnitProgressLike[]): { total: number; completed: number } {
  const done = new Set(progress.filter((p) => p.completed_at).map((p) => p.unit_slug));
  return { total: units.length, completed: units.filter((u) => done.has(u.slug)).length };
}

/** Mengelompokkan unit per level dengan urutan level kursus, lalu urutan unit. */
export function groupByLevel<T extends CourseUnitLike>(units: readonly T[]): { level: string; units: T[] }[] {
  const levels = Array.from(new Set(units.map((u) => u.cefr_level)));
  levels.sort((a, b) => levelRank(a) - levelRank(b) || a.localeCompare(b));
  return levels.map((level) => ({ level, units: units.filter((u) => u.cefr_level === level).sort((a, b) => a.sort_order - b.sort_order) }));
}
