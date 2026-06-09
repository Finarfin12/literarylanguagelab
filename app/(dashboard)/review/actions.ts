"use server";

import { createClient } from "@/utils/supabase/server";

export async function submitReview(
  vocabId: string, 
  grade: number, // 0-5
  currentRepetition: number,
  currentInterval: number,
  currentEfactor: number
) {
  const supabase = await createClient();

  // SM-2 Algorithm Implementation
  let nextRepetition = currentRepetition;
  let nextInterval = currentInterval;
  let nextEfactor = currentEfactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));

  if (nextEfactor < 1.3) nextEfactor = 1.3;

  if (grade >= 3) {
    if (currentRepetition === 0) {
      nextInterval = 1;
    } else if (currentRepetition === 1) {
      nextInterval = 6;
    } else {
      nextInterval = Math.round(currentInterval * nextEfactor);
    }
    nextRepetition++;
  } else {
    nextRepetition = 0;
    nextInterval = 1;
  }

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
    .eq("id", vocabId);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}
