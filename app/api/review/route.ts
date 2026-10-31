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

    // Fetch current vocabulary details for Phase 12
    const { data: vocab } = await supabase.from('vocabulary').select('error_modifier, consecutive_correct').eq('id', vocabId).single();
    let error_modifier = vocab?.error_modifier ?? 1.0;
    let consecutive_correct = vocab?.consecutive_correct ?? 0;

    if (quality >= 4) {
      consecutive_correct += 1;
      if (consecutive_correct >= 3) {
        error_modifier = 1.0;
      }
    } else {
      consecutive_correct = 0;
    }

    // Calculate next review using SM-2
    let { interval, repetition, easeFactor } = calculateSM2(
      quality, 
      lastInterval || 0, 
      lastRepetition || 0, 
      lastEaseFactor || 2.5
    );

    // Apply error_modifier to interval
    interval = Math.max(1, Math.round(interval * error_modifier));

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
        efactor: easeFactor,
        error_modifier: error_modifier,
        consecutive_correct: consecutive_correct
      })
      .eq("id", vocabId)
      .eq("user_id", user.id);

    if (error) throw error;

    // Log Activity for review
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      action_type: "reviewed_vocab",
    });

    return NextResponse.json({ success: true, nextReview });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
