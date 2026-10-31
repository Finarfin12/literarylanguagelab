import { getAIClient, getAIConfig } from "@/lib/ai-config";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

const SECTION_PROMPTS: Record<string, string> = {
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

function getAdaptiveLevel(currentEstimate: string, wasCorrect: boolean): string {
  const idx = CEFR_LEVELS.indexOf(currentEstimate as typeof CEFR_LEVELS[number]);
  if (idx === -1) return 'B1';
  if (wasCorrect && idx < CEFR_LEVELS.length - 1) return CEFR_LEVELS[idx + 1];
  if (!wasCorrect && idx > 0) return CEFR_LEVELS[idx - 1];
  return currentEstimate;
}

function calculateFinalLevel(scores: Record<string, { correct: number; total: number; lastLevel: string }>): string {
  const levels = Object.values(scores).map(s => s.lastLevel);
  const levelCounts: Record<string, number> = {};
  for (const l of levels) {
    levelCounts[l] = (levelCounts[l] || 0) + 1;
  }
  // Pick the most common level, or the median
  let best = 'A1';
  let bestCount = 0;
  for (const [level, count] of Object.entries(levelCounts)) {
    if (count > bestCount) {
      best = level;
      bestCount = count;
    }
  }
  return best;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // === GENERATE A QUESTION ===
    if (action === 'generate') {
      const { section, currentEstimate = 'B1' } = body;
      const prompt = SECTION_PROMPTS[section];
      if (!prompt) return NextResponse.json({ error: "Invalid section" }, { status: 400 });

      const config = await getAIConfig("tools");
      const groq = await getAIClient("tools");
      const response = await groq.chat.completions.create({
        model: config.model,
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: `Generate a question for CEFR level: ${currentEstimate}` },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const raw = response.choices[0]?.message?.content || '{}';
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return NextResponse.json({ error: "AI response parse error" }, { status: 500 });

      const question = JSON.parse(jsonMatch[0]);
      // Don't send correct answer to client during test
      const { correct, explanation_id, ...clientQuestion } = question;

      return NextResponse.json({
        question: clientQuestion,
        _server: { correct, explanation_id }, // stored server-side conceptually; sent for client-side eval in this simple impl
      });
    }

    // === FINALIZE TEST ===
    if (action === 'finalize') {
      const { scores } = body;
      // scores: { reading: { correct, total, lastLevel }, grammar: {...}, ... }

      const finalLevel = calculateFinalLevel(scores);

      const readingScore = Math.round((scores.reading?.correct / Math.max(scores.reading?.total, 1)) * 100);
      const grammarScore = Math.round((scores.grammar?.correct / Math.max(scores.grammar?.total, 1)) * 100);
      const vocabularyScore = Math.round((scores.vocabulary?.correct / Math.max(scores.vocabulary?.total, 1)) * 100);
      const listeningScore = Math.round((scores.listening?.correct / Math.max(scores.listening?.total, 1)) * 100);
      const totalScore = Math.round((readingScore + grammarScore + vocabularyScore + listeningScore) / 4);

      // Save result
      await supabase.from('placement_test_results').insert({
        user_id: user.id,
        result_level: finalLevel,
        reading_score: readingScore,
        grammar_score: grammarScore,
        vocabulary_score: vocabularyScore,
        listening_score: listeningScore,
        total_score: totalScore,
        details: scores,
      });

      // Update profile
      await supabase.from('profiles').update({
        cefr_level: finalLevel,
      }).eq('id', user.id);

      return NextResponse.json({
        finalLevel,
        scores: { reading: readingScore, grammar: grammarScore, vocabulary: vocabularyScore, listening: listeningScore, total: totalScore },
      });
    }

    // === SET LEVEL MANUALLY ===
    if (action === 'set_level') {
      const { level } = body;
      if (!CEFR_LEVELS.includes(level)) return NextResponse.json({ error: "Invalid level" }, { status: 400 });

      await supabase.from('profiles').update({
        cefr_level: level,
      }).eq('id', user.id);

      return NextResponse.json({ level });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Placement test error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
