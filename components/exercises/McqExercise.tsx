"use client";

import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { displayOrder } from "@/lib/exercises/session";
import type { McqResponse } from "@/lib/exercises/types";
import { choiceClass, type TypeProps } from "./shared";

/** Pilihan ganda: ketuk satu pilihan, lalu "Periksa". */
export default function McqExercise({ exercise, locked, onSubmit }: TypeProps<"mcq", McqResponse>) {
  const options = useMemo(() => displayOrder(exercise.prompt.options, exercise.id), [exercise.prompt.options, exercise.id]);
  const [choice, setChoice] = useState<string | null>(null);

  return (
    <div>
      <p className="font-serif text-xl leading-snug text-foreground mb-4">{exercise.prompt.question}</p>
      <div role="radiogroup" aria-label="Pilihan jawaban" className="space-y-2">
        {options.map((opt) => {
          const isChosen = choice === opt;
          const isRight = locked && opt === exercise.answer.correct;
          const isWrong = locked && isChosen && opt !== exercise.answer.correct;
          const state = isRight ? "correct" : isWrong ? "wrong" : locked ? "muted" : isChosen ? "selected" : "idle";
          return (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={isChosen}
              disabled={locked}
              onClick={() => setChoice(opt)}
              className={`${choiceClass(state)} flex items-center justify-between gap-3`}
            >
              <span>{opt}</span>
              {isRight && <Check className="w-5 h-5 shrink-0" aria-label="Jawaban benar" />}
              {isWrong && <X className="w-5 h-5 shrink-0" aria-label="Jawabanmu salah" />}
            </button>
          );
        })}
      </div>
      {!locked && (
        <Button className="mt-4 w-full sm:w-auto" disabled={choice === null} onClick={() => choice !== null && onSubmit({ choice })}>
          Periksa
        </Button>
      )}

    </div>
  );
}
