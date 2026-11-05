// Data yang sudah diselesaikan server untuk tiap langkah unit (Fase 16), diteruskan ke pemutar (komponen klien).
import type { CourseStep } from "@/lib/course";

export interface ResolvedVocab {
  word: string;
  meaning_id?: string;
  definition_en?: string;
  /** Fase 21: cara baca perkiraan versi Indonesia. */
  reading_aid?: string;
}

export interface ResolvedTopic {
  slug: string;
  title: string;
  summary_id: string;
  examples: { en: string; id: string }[];
}

export interface ResolvedText {
  id: string | null;
  title: string;
  author?: string;
  content: string;
}

export interface StepView {
  step: CourseStep;
  /** Langkah placeholder: konten yang dirujuk belum ada. Boleh dilewati. */
  empty: boolean;
  vocab?: ResolvedVocab[];
  topic?: ResolvedTopic | null;
  text?: ResolvedText | null;
  /** Jumlah soal terbit untuk unit ini (langkah `exercise`). */
  exerciseCount?: number;
  scenario?: { id: string; title: string } | null;
}
