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

    return NextResponse.json({ success: true, nextReview });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
