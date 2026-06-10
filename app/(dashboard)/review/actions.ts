"use server";

import { createClient } from "@/utils/supabase/server";

import { calculateSM2 } from "@/lib/spaced-repetition";

export async function submitReview(
  vocabId: string, 
  grade: number, // 0-5
  currentRepetition: number,
  currentInterval: number,
  currentEfactor: number
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authorized");

  // SM-2 Algorithm Implementation
  const { repetition: nextRepetition, interval: nextInterval, easeFactor: nextEfactor } = calculateSM2(
    grade,
    currentInterval,
    currentRepetition,
    currentEfactor
  );

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval);

  const { error } = await supabase
    .from("vocabulary")
    .update({
      repetition_count: nextRepetition,
      interval: nextInterval,
      efactor: nextEfactor,
      next_review_at: nextReviewDate.toISOString(),
      mastery_level: Math.min(5, nextRepetition) // Update mastery level just to reflect in UI
    })
    .eq("id", vocabId)
    .eq("user_id", user.id);

  // Log activity
  await supabase.from("activity_logs").insert({
    user_id: user.id,
    action_type: 'reviewed_vocab',
    details: vocabId
  });

  if (error) {
    throw new Error(error.message);
  }

  return true;
}
