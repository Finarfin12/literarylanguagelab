// Bentuk data mesin latihan terstruktur (Fase 15). Hanya tipe dan konstanta: aman diimpor dari klien, server, dan uji unit.
// `prompt` dan `answer` disimpan sebagai jsonb di tabel `exercises` (migrasi 0012); validasinya ada di grade.ts.

export const EXERCISE_TYPES = ["mcq", "cloze", "order", "match", "dictation", "pattern"] as const;
export type ExerciseType = (typeof EXERCISE_TYPES)[number];

export const EXERCISE_TYPE_LABELS: Record<ExerciseType, string> = {
  mcq: "Pilihan ganda",
  cloze: "Isi bagian kosong",
  order: "Susun kalimat",
  match: "Pasangkan",
  dictation: "Dikte",
  pattern: "Penyusun kalimat",
};

/** Penanda bagian kosong pada soal cloze. */
export const CLOZE_BLANK = "___";

// --- Pilihan ganda ---
export interface McqPrompt { question: string; options: string[] }
export interface McqAnswer { correct: string }
export interface McqResponse { choice: string }

// --- Isi bagian kosong: tiap "___" di `text` punya satu daftar jawaban yang diterima ---
export interface ClozePrompt { text: string; hint?: string }
export interface ClozeAnswer { blanks: string[][] }
export interface ClozeResponse { blanks: string[] }

// --- Susun kalimat: `tokens` ditampilkan acak, `sentences` = kalimat benar yang diterima (yang pertama = kanonik) ---
export interface OrderPrompt { tokens: string[]; hint?: string }
export interface OrderAnswer { sentences: string[] }
export interface OrderResponse { order: string[] }

// --- Pasangkan: kiri ↔ kanan, `rights` ditampilkan acak ---
export interface MatchPrompt { lefts: string[]; rights: string[]; instruction?: string }
export interface MatchAnswer { pairs: { left: string; right: string }[] }
export interface MatchResponse { pairs: Record<string, string> }

// --- Dikte: `text` dibacakan lewat TTS, pengguna mengetik apa yang didengar ---
export interface DictationPrompt { text: string }
export interface DictationAnswer { accept: string[] }
export interface DictationResponse { text: string }

// --- Penyusun kalimat (Fase 22): pilih subjek, kata kerja, dan objek; bentuk kata kerja mengikuti subjek (lib/exercises/patterns.ts) ---
export interface PatternSubject { text: string; /** i = I; sg3 = he/she/it dan subjek tunggal lain; other = you/we/they dan jamak */ person: "i" | "sg3" | "other" }
export interface PatternVerb { base: string; /** bentuk setelah he/she/it (eats) */ third: string; /** bentuk setelah I bila berbeda (am) */ first?: string; meaning_id?: string }
export interface PatternPrompt { subjects: PatternSubject[]; verbs: PatternVerb[]; objects: string[]; hint?: string; note_id?: string }
export interface PatternAnswer { sentences: string[] }
export interface PatternResponse { subject: string; verb: string; object: string }

export type ExerciseResponse = McqResponse | ClozeResponse | OrderResponse | MatchResponse | DictationResponse | PatternResponse;

export interface ExerciseBase {
  cefr_level: string;
  topic_slug: string | null;
  unit_slug: string | null;
  tags: string[];
  /** Penjelasan bahasa Indonesia yang tampil setelah menjawab. */
  explanation_id: string;
}

type Variant =
  | { type: "mcq"; prompt: McqPrompt; answer: McqAnswer }
  | { type: "cloze"; prompt: ClozePrompt; answer: ClozeAnswer }
  | { type: "order"; prompt: OrderPrompt; answer: OrderAnswer }
  | { type: "match"; prompt: MatchPrompt; answer: MatchAnswer }
  | { type: "dictation"; prompt: DictationPrompt; answer: DictationAnswer }
  | { type: "pattern"; prompt: PatternPrompt; answer: PatternAnswer };

/** Soal yang belum disimpan (hasil AI, generator, atau formulir admin). */
export type ExerciseDraft = ExerciseBase & Variant;
/** Soal yang sudah ada di database. */
export type Exercise = ExerciseDraft & { id: string };

export interface GradeResult {
  correct: boolean;
  /** Jawaban benar dalam bentuk teks yang bisa ditampilkan. */
  expected: string;
  /** 0..1; < 1 untuk soal yang sebagian benar (pasangkan, cloze dengan beberapa bagian kosong). */
  score: number;
  /** Fase 22.2: dinilai benar walau ada satu salah ketik pada kata panjang. Berisi kata yang diketik dan yang benar. */
  typo?: { given: string; expected: string };
}

/** Riwayat singkat satu percobaan, dipakai untuk memilih soal sesi berikutnya. */
export interface AttemptSummary {
  exercise_id: string;
  correct: boolean;
  created_at: string;
}

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

/** Keterampilan yang dicatat sebagai bukti kemampuan (lib/levels.ts, Fase 10). */
export type ExerciseSkill = "grammar" | "vocabulary" | "listening";
