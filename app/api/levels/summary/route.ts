import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { loadLevelContext, syncSkillLevels } from "@/lib/skill-evidence";
import { SKILLS, SKILL_LABELS, canTakeLevelTest, levelUpReadiness, type Skill } from "@/lib/levels";

const SOURCE_LABELS: Record<string, string> = {
  reader_quiz: "Kuis bacaan",
  grammar_clinic: "Grammar Clinic",
  writing_eval: "Latihan menulis",
  dialogue: "Dialogue Simulator",
  listening_test: "Listening Test",
  listening_challenge: "Listening Challenge",
  level_test: "Tes Naik Level",
};

/** Ringkasan level per keterampilan, syarat naik level, dan status Tes Naik Level untuk profil. */
export async function GET() {
  try {
    const authResult = await requireUser();
    if (authResult instanceof NextResponse) return authResult;
    const { supabase, user } = authResult;

    const ctx = await loadLevelContext(supabase, user.id);
    if (!ctx.level) return NextResponse.json({ schemaReady: ctx.schemaReady, level: null });

    const levels = (await syncSkillLevels(supabase, user.id, ctx)) ?? null;
    const readiness = levelUpReadiness(ctx.evidence, ctx.level, ctx.vocab, ctx.rules);
    const cooldown = canTakeLevelTest(ctx.lastTestAt, new Date(), ctx.rules.test.cooldownDays);

    const skills = SKILLS.map((skill: Skill) => {
      // Evidence sudah terurut terbaru dulu dari query
      const last = ctx.evidence.find((e) => e.skill === skill);
      return {
        skill,
        label: SKILL_LABELS[skill],
        level: levels?.[skill] ?? ctx.level,
        lastSource: last ? SOURCE_LABELS[last.source] ?? last.source : null,
        lastAt: last?.created_at ?? null,
      };
    });

    return NextResponse.json({
      schemaReady: ctx.schemaReady,
      level: ctx.level,
      skills,
      readiness,
      test: {
        allowed: cooldown.allowed,
        daysLeft: cooldown.daysLeft,
        nextAt: cooldown.nextAt?.toISOString() ?? null,
        canStart: ctx.schemaReady && readiness.ready && cooldown.allowed,
      },
    });
  } catch (error) {
    console.error("Level summary error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
