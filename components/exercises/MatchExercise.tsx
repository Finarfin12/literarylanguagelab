"use client";

import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { displayOrder } from "@/lib/exercises/session";
import type { MatchResponse } from "@/lib/exercises/types";
import { choiceClass, type TypeProps } from "./shared";

/** Pasangkan: ketuk item di daftar atas, lalu ketuk pasangannya di daftar bawah. Ketuk item yang sudah berpasangan untuk melepasnya. */
export default function MatchExercise({ exercise, locked, onSubmit }: TypeProps<"match", MatchResponse>) {
  const lefts = exercise.prompt.lefts;
  const rights = useMemo(() => displayOrder(exercise.prompt.rights, exercise.id), [exercise.prompt.rights, exercise.id]);
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [active, setActive] = useState<string | null>(null);
  const usedRights = new Set(Object.values(pairs));
  const complete = lefts.every((l) => pairs[l]);
  const truth = new Map(exercise.answer.pairs.map((p) => [p.left, p.right]));

  const pickLeft = (left: string) => {
    if (locked) return;
    if (pairs[left]) {
      setPairs((p) => {
        const next = { ...p };
        delete next[left];
        return next;
      });
      setActive(left);
    } else {
      setActive((a) => (a === left ? null : left));
    }
  };

  const pickRight = (right: string) => {
    if (locked || !active) return;
    setPairs((p) => ({ ...p, [active]: right }));
    setActive(null);
  };

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-3">{exercise.prompt.instruction || "Pasangkan setiap item dengan pasangannya."}</p>

      <ul aria-label="Daftar yang dipasangkan" className="space-y-2">
        {lefts.map((left) => {
          const paired = pairs[left];
          const right = locked && paired ? truth.get(left) === paired : null;
          const state = right === true ? "correct" : right === false ? "wrong" : active === left ? "selected" : paired ? "selected" : locked ? "muted" : "idle";
          return (
            <li key={left}>
              <button type="button" disabled={locked} onClick={() => pickLeft(left)} aria-pressed={active === left} className={`${choiceClass(state)} flex items-center justify-between gap-3`}>
                <span className="min-w-0">
                  <span className="block font-semibold">{left}</span>
                  <span className="block text-sm font-normal text-muted-foreground">{paired ? `= ${paired}` : active === left ? "Pilih pasangannya di bawah" : "Ketuk lalu pilih pasangan"}</span>
                </span>
                {right === true && <Check className="w-5 h-5 shrink-0" aria-label="Pasangan benar" />}
                {right === false && <X className="w-5 h-5 shrink-0" aria-label="Pasangan salah" />}
              </button>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Pilihan pasangan</p>
      <ul aria-label="Pilihan pasangan" className="space-y-2">
        {rights.map((right) => {
          const used = usedRights.has(right);
          return (
            <li key={right}>
              <button
                type="button"
                disabled={locked || !active || used}
                onClick={() => pickRight(right)}
                className={`${choiceClass(used ? "muted" : "idle")}${used && !locked ? " opacity-60" : ""}`}
              >
                {right}
              </button>
            </li>
          );
        })}
      </ul>

      {!locked && (
        <Button className="mt-4 w-full sm:w-auto" disabled={!complete} onClick={() => onSubmit({ pairs })}>
          Periksa
        </Button>
      )}
    </div>
  );
}
