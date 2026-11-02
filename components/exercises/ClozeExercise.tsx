"use client";

import { Fragment, useState } from "react";
import { Button } from "@/components/ui/primitives";
import { normalizeAnswer } from "@/lib/exercises/grade";
import { CLOZE_BLANK, type ClozeResponse } from "@/lib/exercises/types";
import type { TypeProps } from "./shared";

/** Isi bagian kosong: setiap "___" pada kalimat menjadi kolom ketik. */
export default function ClozeExercise({ exercise, locked, onSubmit }: TypeProps<"cloze", ClozeResponse>) {
  const parts = exercise.prompt.text.split(CLOZE_BLANK);
  const blankCount = parts.length - 1;
  const [values, setValues] = useState<string[]>(() => Array.from({ length: blankCount }, () => ""));
  const ready = values.every((v) => v.trim() !== "");

  const set = (i: number, v: string) => setValues((prev) => prev.map((x, idx) => (idx === i ? v : x)));
  const isRight = (i: number) => {
    const given = normalizeAnswer(values[i]);
    return given !== "" && exercise.answer.blanks[i].some((a) => normalizeAnswer(a) === given);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!locked && ready) onSubmit({ blanks: values });
      }}
    >
      <p className="font-serif text-xl text-foreground leading-[2.6]">
        {parts.map((part, i) => (
          <Fragment key={i}>
            {part}
            {i < blankCount && (
              <input
                value={values[i]}
                onChange={(e) => set(i, e.target.value)}
                readOnly={locked}
                aria-label={`Isian ${i + 1} dari ${blankCount}`}
                aria-invalid={locked ? !isRight(i) : undefined}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoComplete="off"
                className={`mx-1 w-28 min-h-[44px] align-middle rounded-control border bg-background px-2 text-center font-sans text-base focus:outline-none focus:border-brand ${
                  locked ? (isRight(i) ? "border-brand bg-brand-tint text-brand-ink font-semibold" : "border-danger bg-danger-tint text-danger font-semibold") : "border-border text-foreground"
                }`}
              />
            )}
          </Fragment>
        ))}
      </p>
      {exercise.prompt.hint && <p className="mt-2 text-sm text-muted-foreground">Petunjuk: {exercise.prompt.hint}</p>}
      {!locked && (
        <Button type="submit" className="mt-4 w-full sm:w-auto" disabled={!ready}>
          Periksa
        </Button>
      )}
    </form>
  );
}
