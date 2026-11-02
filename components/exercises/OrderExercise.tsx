"use client";

import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { displayOrder } from "@/lib/exercises/session";
import type { OrderResponse } from "@/lib/exercises/types";
import { smallButtonClass, type TypeProps } from "./shared";

/** Susun kalimat: ketuk potongan kata untuk menaruhnya di baris jawaban; ketuk lagi untuk mengembalikannya. */
export default function OrderExercise({ exercise, locked, result, onSubmit }: TypeProps<"order", OrderResponse>) {
  const shuffledTokens = useMemo(() => displayOrder(exercise.prompt.tokens, exercise.id), [exercise.prompt.tokens, exercise.id]);
  // Indeks ke shuffledTokens, supaya potongan kembar (mis. dua "the") tidak tertukar
  const [placed, setPlaced] = useState<number[]>([]);
  const remaining = shuffledTokens.map((_, i) => i).filter((i) => !placed.includes(i));
  const complete = placed.length === shuffledTokens.length;

  const tile = "min-h-[44px] px-3 rounded-control border text-base font-serif transition-colors disabled:pointer-events-none";

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-3">Susun potongan di bawah menjadi kalimat yang benar.</p>
      {exercise.prompt.hint && <p className="text-sm text-foreground mb-3">Artinya: <span className="italic">{exercise.prompt.hint}</span></p>}

      <div
        aria-label="Susunan jawabanmu"
        className={`min-h-[64px] flex flex-wrap gap-2 p-3 rounded-control border border-dashed ${
          locked && result ? (result.correct ? "border-brand bg-brand-tint" : "border-danger bg-danger-tint") : "border-border bg-muted/40"
        }`}
      >
        {placed.length === 0 && <span className="text-sm text-muted-foreground self-center">Ketuk potongan kata di bawah</span>}
        {placed.map((idx, pos) => (
          <button
            key={`${idx}-${pos}`}
            type="button"
            disabled={locked}
            onClick={() => setPlaced((p) => p.filter((_, i) => i !== pos))}
            aria-label={`${shuffledTokens[idx]}, posisi ${pos + 1}. Ketuk untuk mengembalikan`}
            className={`${tile} border-brand bg-card text-foreground hover:bg-muted`}
          >
            {shuffledTokens[idx]}
          </button>
        ))}
      </div>

      <div aria-label="Potongan kata" className="mt-3 flex flex-wrap gap-2">
        {remaining.map((idx) => (
          <button
            key={idx}
            type="button"
            disabled={locked}
            onClick={() => setPlaced((p) => [...p, idx])}
            className={`${tile} border-border bg-card text-foreground hover:bg-muted`}
          >
            {shuffledTokens[idx]}
          </button>
        ))}
      </div>

      {!locked && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button disabled={!complete} onClick={() => onSubmit({ order: placed.map((i) => shuffledTokens[i]) })} className="flex-1 sm:flex-none">
            Periksa
          </Button>
          <button type="button" onClick={() => setPlaced([])} disabled={placed.length === 0} className={smallButtonClass}>
            <RotateCcw className="w-4 h-4" aria-hidden="true" /> Ulangi
          </button>
        </div>
      )}
    </div>
  );
}
