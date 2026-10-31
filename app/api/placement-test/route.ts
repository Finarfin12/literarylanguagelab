import { generatePlacementQuestion } from "@/lib/placement";
import { recordLevelChange } from "@/lib/skill-evidence";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

// Pengguna sendiri yang memilih level (tes ulang atau manual), jadi level per keterampilan mengikuti.
// Kolom skill_levels dari migrasi 0008: jika belum ada, update diabaikan.
async function resetSkillLevels(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  try {
    await supabase.from('profiles').update({ skill_levels: {} }).eq('id', userId);
  } catch {
    // abaikan
  }
}

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
      let question;
      try {
        question = await generatePlacementQuestion(section, currentEstimate, user?.id);
      } catch (e) {
        const message = e instanceof Error ? e.message : "";
        if (message === "Invalid section") return NextResponse.json({ error: "Invalid section" }, { status: 400 });
        return NextResponse.json({ error: "AI response parse error" }, { status: 500 });
      }
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

      // Update profile. Level per keterampilan diatur ulang ke level hasil tes (Placement Test diulang atas kemauan pengguna).
      const { data: before } = await supabase.from('profiles').select('cefr_level').eq('id', user.id).maybeSingle();
      await supabase.from('profiles').update({
        cefr_level: finalLevel,
      }).eq('id', user.id);
      await resetSkillLevels(supabase, user.id);
      if (before?.cefr_level !== finalLevel) {
        await recordLevelChange(supabase, user.id, { from: before?.cefr_level ?? null, to: finalLevel, source: 'placement' });
      }

      return NextResponse.json({
        finalLevel,
        scores: { reading: readingScore, grammar: grammarScore, vocabulary: vocabularyScore, listening: listeningScore, total: totalScore },
      });
    }

    // === SET LEVEL MANUALLY ===
    if (action === 'set_level') {
      const { level } = body;
      if (!CEFR_LEVELS.includes(level)) return NextResponse.json({ error: "Invalid level" }, { status: 400 });

      const { data: before } = await supabase.from('profiles').select('cefr_level').eq('id', user.id).maybeSingle();
      await supabase.from('profiles').update({
        cefr_level: level,
      }).eq('id', user.id);
      await resetSkillLevels(supabase, user.id);
      if (before?.cefr_level !== level) {
        await recordLevelChange(supabase, user.id, { from: before?.cefr_level ?? null, to: level, source: 'manual' });
      }

      return NextResponse.json({ level });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Placement test error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
