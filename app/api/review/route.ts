import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { calculateSM2 } from "@/lib/spaced-repetition";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { vocabId, quality, lastInterval, lastRepetition, lastEaseFactor } = await req.json();

    if (!vocabId || quality === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Calculate next review using SM-2
    const { interval, repetition, easeFactor } = calculateSM2(
      quality, 
      lastInterval || 0, 
      lastRepetition || 0, 
      lastEaseFactor || 2.5
    );

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    // Update vocabulary in DB
    const { error } = await supabase
      .from("vocabulary")
      .update({
        mastery_level: Math.min(5, repetition), // Use repetition for mastery visual
        next_review_at: nextReview.toISOString(),
        interval: interval,
        repetition_count: repetition,
        efactor: easeFactor
      })
      .eq("id", vocabId)
      .eq("user_id", user.id);

    if (error) throw error;

    // Award XP for review
    const { data: profile } = await supabase.from("profiles").select("xp").eq("id", user.id).single();
    if (profile) {
      await supabase.from("profiles").update({ xp: profile.xp + 2 }).eq("id", user.id);
    }

    // Auto-complete Quests
    try {
      const { count } = await supabase.from("vocabulary").select("*", { count: "exact", head: true }).eq("user_id", user.id).gt("repetition_count", 0);
      const reviewCount = count || 0;

      if (reviewCount >= 10) {
        await supabase.from('journey_progress').upsert({
          user_id: user.id, quest_id: 'a1_flashcard', journey_level: 1, completed: true, completed_at: new Date().toISOString()
        }, { onConflict: 'user_id,quest_id' });
      }
      if (reviewCount >= 25) {
        await supabase.from('journey_progress').upsert({
          user_id: user.id, quest_id: 'a2_flashcard', journey_level: 2, completed: true, completed_at: new Date().toISOString()
        }, { onConflict: 'user_id,quest_id' });
      }
      if (reviewCount >= 40) {
        await supabase.from('journey_progress').upsert({
          user_id: user.id, quest_id: 'b1_vocab', journey_level: 3, completed: true, completed_at: new Date().toISOString()
        }, { onConflict: 'user_id,quest_id' });
      }
    } catch (e) {
      console.error("Auto quest tracking error", e);
    }

    return NextResponse.json({ success: true, nextReview });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
