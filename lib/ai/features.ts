// lib/ai/features.ts
// Daftar fitur AI yang bisa diatur model-nya di tab admin "Routing Fitur".
// Harus sama dengan seed di supabase/migrations/0003_ai_registry.sql.

export type AICapability = "text" | "vision" | "tools" | "stt" | "tts";

export interface AIFeature {
  key: string;
  label: string;
  group: "Reader" | "English Lab" | "Tools" | "Translation" | "Lainnya";
  requires: AICapability;
}

export const AI_FEATURES: AIFeature[] = [
  { key: "lookup", label: "Word Lookup", group: "Reader", requires: "text" },
  { key: "reading-companion", label: "Reading Companion", group: "Reader", requires: "text" },
  { key: "simplify-text", label: "Simplify Text (Beginner Mode)", group: "Reader", requires: "text" },
  { key: "highlight-syntax", label: "Bedah Sintaksis", group: "Reader", requires: "text" },
  { key: "parse-sentence", label: "Analisis Kalimat", group: "Reader", requires: "text" },
  { key: "generate-quiz", label: "Kuis Pemahaman", group: "Reader", requires: "text" },
  { key: "vocab-analysis", label: "Pre-Reading Vocab Preview", group: "Reader", requires: "text" },
  { key: "analyze-difficulty", label: "Analisis Tingkat Kesulitan", group: "Reader", requires: "text" },
  { key: "analyze-tone", label: "Analisis Tone Teks", group: "Reader", requires: "text" },
  { key: "writing-evaluate", label: "Latihan Menulis (setelah membaca)", group: "Reader", requires: "text" },
  { key: "ocr", label: "OCR Lens", group: "Reader", requires: "vision" },

  { key: "grammar-clinic", label: "Grammar Clinic", group: "English Lab", requires: "text" },
  { key: "grammar-mini-lesson", label: "Grammar Mini Lesson", group: "English Lab", requires: "text" },
  { key: "dialogue-simulator", label: "Dialogue Simulator", group: "English Lab", requires: "text" },
  { key: "dialogue-feedback", label: "Dialogue Simulator Feedback", group: "English Lab", requires: "text" },
  { key: "listening-test", label: "Listening Test", group: "English Lab", requires: "text" },
  { key: "listening-quiz", label: "Listening Quiz", group: "English Lab", requires: "text" },
  { key: "evaluate-listening", label: "Evaluasi Dikte", group: "English Lab", requires: "text" },
  { key: "slang-decoder", label: "Slang Decoder", group: "English Lab", requires: "text" },
  { key: "placement-test", label: "Placement Test", group: "English Lab", requires: "text" },
  { key: "writing-feedback", label: "Writing Feedback", group: "English Lab", requires: "text" },

  { key: "lingowise", label: "LingoWise AI", group: "Tools", requires: "text" },
  { key: "alter-ego", label: "Alter Ego Chat", group: "Tools", requires: "text" },
  { key: "paraphrase-generate", label: "Paraphrase (soal)", group: "Tools", requires: "text" },
  { key: "paraphrase-evaluate", label: "Paraphrase (evaluasi)", group: "Tools", requires: "text" },
  { key: "story-quiz", label: "Story Quiz", group: "Tools", requires: "text" },
  { key: "tone-analyzer", label: "Tone Analyzer", group: "Tools", requires: "text" },
  { key: "dynamic-tools", label: "Toolkits Hub (tools dinamis)", group: "Tools", requires: "text" },
  { key: "generate-text", label: "Generator Teks", group: "Tools", requires: "text" },
  { key: "graded-text-generate", label: "Generator Teks Berjenjang (admin)", group: "Tools", requires: "text" },

  { key: "translation", label: "Translation Workshop", group: "Translation", requires: "text" },
  { key: "comparator", label: "Translation Comparator", group: "Translation", requires: "text" },
  { key: "untranslatables", label: "Untranslatables", group: "Translation", requires: "text" },
  { key: "lexicon-translation", label: "Lexicon Search (terjemahan)", group: "Translation", requires: "text" },

  { key: "liter-ai", label: "Liter-AI (bantuan)", group: "Lainnya", requires: "text" },
  { key: "wotd", label: "Word of the Day", group: "Lainnya", requires: "text" },
];

export function getFeature(key: string): AIFeature | undefined {
  return AI_FEATURES.find((f) => f.key === key);
}
