// Generator soal untuk Placement Test dan Tes Naik Level (dipakai bersama oleh kedua route).
import { runAI } from "@/lib/ai/run";

export const PLACEMENT_SECTIONS = ["reading", "grammar", "vocabulary", "listening"] as const;
export type PlacementSection = (typeof PLACEMENT_SECTIONS)[number];

export const SECTION_PROMPTS: Record<string, string> = {
  reading: `You are an English placement test generator for Indonesian learners. Generate a READING COMPREHENSION question.
Given the target CEFR level, create:
1. A short English passage (3-5 sentences, appropriate complexity for the level)
2. One multiple-choice question about the passage
3. 4 answer options (A, B, C, D)
4. The correct answer letter

Return ONLY valid JSON:
{
  "passage": "The passage text here...",
  "question": "What is the main idea?",
  "options": ["A. option1", "B. option2", "C. option3", "D. option4"],
  "correct": "A",
  "explanation_id": "Penjelasan singkat dalam bahasa Indonesia"
}`,

  grammar: `You are an English placement test generator for Indonesian learners. Generate a GRAMMAR question.
Given the target CEFR level, create a fill-in-the-blank or error identification question testing grammar knowledge appropriate for that level.

Return ONLY valid JSON:
{
  "question": "Choose the correct sentence:",
  "options": ["A. option1", "B. option2", "C. option3", "D. option4"],
  "correct": "B",
  "explanation_id": "Penjelasan singkat dalam bahasa Indonesia mengapa jawaban ini benar"
}`,

  vocabulary: `You are an English placement test generator for Indonesian learners. Generate a VOCABULARY question.
Given the target CEFR level, create a question that tests word knowledge (definition, synonym, or usage in context) appropriate for that level.

Return ONLY valid JSON:
{
  "question": "What does 'elaborate' mean in this context: 'She gave an elaborate explanation.'",
  "options": ["A. option1", "B. option2", "C. option3", "D. option4"],
  "correct": "C",
  "explanation_id": "Penjelasan singkat dalam bahasa Indonesia"
}`,

  listening: `You are an English placement test generator for Indonesian learners. Generate a LISTENING comprehension question.
Given the target CEFR level, create:
1. A short sentence or dialogue (2-3 sentences) that will be read aloud via TTS
2. One comprehension question about it
3. 4 answer options
4. The correct answer

Return ONLY valid JSON:
{
  "audio_text": "The text that will be spoken by TTS",
  "question": "What did the speaker say about...?",
  "options": ["A. option1", "B. option2", "C. option3", "D. option4"],
  "correct": "A",
  "explanation_id": "Penjelasan singkat dalam bahasa Indonesia"
}`
};

export interface GeneratedQuestion {
  passage?: string;
  audio_text?: string;
  question: string;
  options: string[];
  correct: string;
  explanation_id?: string;
}

function extractJson(raw: string): unknown {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI response parse error");
  return JSON.parse(match[0]);
}

function isValidQuestion(q: unknown): q is GeneratedQuestion {
  if (!q || typeof q !== "object") return false;
  const v = q as Record<string, unknown>;
  return (
    typeof v.question === "string" &&
    Array.isArray(v.options) &&
    v.options.length >= 2 &&
    v.options.every((o) => typeof o === "string") &&
    typeof v.correct === "string" &&
    /^[A-D]$/i.test(v.correct.trim().charAt(0))
  );
}

/** Satu soal pada level tertentu (Placement Test adaptif). */
export async function generatePlacementQuestion(section: string, level: string, userId?: string): Promise<GeneratedQuestion> {
  const prompt = (SECTION_PROMPTS as Record<string, string>)[section];
  if (!prompt) throw new Error("Invalid section");
  const response = await runAI("placement-test", {
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: `Generate a question for CEFR level: ${level}` },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  }, { userId });
  return extractJson(response.content || "{}") as GeneratedQuestion;
}

/** Beberapa soal berbeda pada satu level (Tes Naik Level). Soal yang formatnya tidak valid dibuang. */
export async function generateLevelTestQuestions(section: PlacementSection, level: string, count: number, userId?: string): Promise<GeneratedQuestion[]> {
  const base = SECTION_PROMPTS[section];
  const response = await runAI("level-test", {
    messages: [
      {
        role: "system",
        content: `${base}

Now generate ${count} DIFFERENT questions in total. Return ONLY valid JSON of the form {"questions": [ <${count} objects, each exactly in the format above> ]}. Test only CEFR level ${level}; do not make the questions easier or harder.`,
      },
      { role: "user", content: `Generate ${count} questions for CEFR level: ${level}` },
    ],
    temperature: 0.7,
    max_tokens: 2500,
  }, { userId });
  const parsed = extractJson(response.content || "{}") as { questions?: unknown[] };
  return (parsed.questions || []).filter(isValidQuestion).slice(0, count);
}
