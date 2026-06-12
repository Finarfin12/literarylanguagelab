import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { JOURNEY_LEVELS } from "@/lib/journey-quests";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get profile with journey info
    const { data: profile } = await supabase
      .from('profiles')
      .select('cefr_level, journey_level')
      .eq('id', user.id)
      .single();

    const journeyLevel = profile?.journey_level || 1;
    const cefrLevel = profile?.cefr_level || 'A1';

    // Get journey progress for current level
    const { data: progress } = await supabase
      .from('journey_progress')
      .select('quest_id, completed, completed_at')
      .eq('user_id', user.id)
      .eq('journey_level', journeyLevel);

    // Get journey definition
    const journey = JOURNEY_LEVELS.find(j => j.level === journeyLevel);
    if (!journey) {
      return NextResponse.json({ error: "Journey level not found" }, { status: 404 });
    }

    // Merge quest definitions with progress
    const completedMap = new Map(progress?.map(p => [p.quest_id, p]) || []);
    const quests = journey.quests.map(q => ({
      ...q,
      completed: completedMap.get(q.id)?.completed || false,
      completedAt: completedMap.get(q.id)?.completed_at || null,
    }));

    const completedCount = quests.filter(q => q.completed).length;
    const totalQuests = quests.length;

    // Check placement test history
    const { data: testResults } = await supabase
      .from('placement_test_results')
      .select('result_level, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    return NextResponse.json({
      cefrLevel,
      journeyLevel,
      title: journey.title,
      subtitle: journey.subtitle,
      quests,
      completedCount,
      totalQuests,
      milestone: journey.milestone,
      hasPlacementTest: (testResults?.length || 0) > 0,
      lastTestLevel: testResults?.[0]?.result_level || null,
      allLevels: JOURNEY_LEVELS.map(j => ({ level: j.level, cefr: j.cefr, title: j.title })),
    });
  } catch (error) {
    console.error("Journey GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { action, questId, journeyLevel: targetLevel } = await req.json();

    // === COMPLETE A QUEST ===
    if (action === 'complete') {
      if (!questId) return NextResponse.json({ error: "questId required" }, { status: 400 });

      const { data: profile } = await supabase
        .from('profiles')
        .select('journey_level')
        .eq('id', user.id)
        .single();

      const currentLevel = profile?.journey_level || 1;

      // Upsert progress
      await supabase.from('journey_progress').upsert({
        user_id: user.id,
        quest_id: questId,
        journey_level: currentLevel,
        completed: true,
        completed_at: new Date().toISOString(),
      }, { onConflict: 'user_id,quest_id' });

      // Check if all quests for this level are complete
      const journey = JOURNEY_LEVELS.find(j => j.level === currentLevel);
      if (journey) {
        const { data: allProgress } = await supabase
          .from('journey_progress')
          .select('quest_id, completed')
          .eq('user_id', user.id)
          .eq('journey_level', currentLevel)
          .eq('completed', true);

        const completedIds = new Set(allProgress?.map(p => p.quest_id) || []);
        const allComplete = journey.quests.every(q => completedIds.has(q.id));

        if (allComplete) {
          return NextResponse.json({ completed: true, levelComplete: true, milestone: journey.milestone });
        }
      }

      return NextResponse.json({ completed: true, levelComplete: false });
    }

    // === CHANGE JOURNEY LEVEL ===
    if (action === 'change_level') {
      if (!targetLevel) return NextResponse.json({ error: "journeyLevel required" }, { status: 400 });

      const journey = JOURNEY_LEVELS.find(j => j.level === targetLevel);
      if (!journey) return NextResponse.json({ error: "Invalid level" }, { status: 400 });

      await supabase.from('profiles').update({
        journey_level: targetLevel,
        cefr_level: journey.cefr,
      }).eq('id', user.id);

      return NextResponse.json({ journeyLevel: targetLevel, cefr: journey.cefr });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Journey POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
