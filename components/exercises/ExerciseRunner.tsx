"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { gradeAnswer } from "@/lib/exercises/grade";
import type { Exercise, ExerciseResponse, GradeResult } from "@/lib/exercises/types";
import ClozeExercise from "./ClozeExercise";
import DictationExercise from "./DictationExercise";
import MatchExercise from "./MatchExercise";
import McqExercise from "./McqExercise";
import OrderExercise from "./OrderExercise";
import PatternBuilder from "./PatternBuilder";
import { ExerciseFeedback } from "./shared";

/**
 * Satu soal lengkap: tampilan sesuai tipe, penilaian langsung (tanpa AI), umpan balik + penjelasan Indonesia.
 * Gunakan `key={exercise.id}` di pemanggil agar status direset untuk tiap soal.
 */
export default function ExerciseRunner({
  exercise,
  onAnswered,
  onNext,
  nextLabel = "Berikutnya",
}: {
  exercise: Exercise;
  onAnswered?: (response: ExerciseResponse, result: GradeResult) => void;
  onNext?: () => void;
  nextLabel?: string;
}) {
  const [result, setResult] = useState<GradeResult | null>(null);
  const locked = result !== null;

  const submit = (response: ExerciseResponse) => {
    if (locked) return;
    const graded = gradeAnswer(exercise, response);
    setResult(graded);
    onAnswered?.(response, graded);
  };

  return (
    <div>
      {exercise.type === "mcq" && <McqExercise exercise={exercise} locked={locked} result={result} onSubmit={submit} />}
      {exercise.type === "cloze" && <ClozeExercise exercise={exercise} locked={locked} result={result} onSubmit={submit} />}
      {exercise.type === "order" && <OrderExercise exercise={exercise} locked={locked} result={result} onSubmit={submit} />}
      {exercise.type === "match" && <MatchExercise exercise={exercise} locked={locked} result={result} onSubmit={submit} />}
      {exercise.type === "dictation" && <DictationExercise exercise={exercise} locked={locked} result={result} onSubmit={submit} />}
      {exercise.type === "pattern" && <PatternBuilder exercise={exercise} locked={locked} result={result} onSubmit={submit} />}

      {result && (
        <div className="mt-4 space-y-3">
          <ExerciseFeedback result={result} explanation={exercise.explanation_id} />
          {onNext && (
            <Button onClick={onNext} className="w-full sm:w-auto">
              {nextLabel} <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
