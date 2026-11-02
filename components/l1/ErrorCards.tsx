"use client";

import { useState } from "react";
import { Check, ListChecks, X } from "lucide-react";
import { Card } from "@/components/ui/primitives";
import ExerciseSession from "@/components/exercises/ExerciseSession";
import { smallButtonClass } from "@/components/exercises/shared";
import { groupErrorsByLevel, l1ErrorTag, L1_ERROR_TAG, type L1Error } from "@/lib/l1";

/** Daftar Kesalahan Umum: kartu salah → benar + penjelasan + latihan (dinilai otomatis, tanpa AI). */
export default function ErrorCards({ errors }: { errors: L1Error[] }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="space-y-10">
      <ExerciseSession tag={L1_ERROR_TAG} count={8} title="Latihan campuran: pilih kalimat yang benar" />

      {groupErrorsByLevel(errors).map(({ level, errors: group }) => (
        <section key={level} aria-labelledby={`l1-${level}`}>
          <h2 id={`l1-${level}`} className="font-serif text-[22px] md:text-[26px] font-medium leading-[1.2] text-foreground mb-3">Level {level}</h2>
          <ul className="space-y-4">
            {group.map((e) => (
              <li key={e.slug}>
                <Card>
                  <h3 className="font-serif text-xl font-medium text-foreground">{e.title}</h3>
                  <dl className="mt-3 space-y-2">
                    <div className="flex items-start gap-2">
                      <dt className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-danger bg-danger-tint rounded-full px-2 py-1 mt-0.5"><X className="w-3 h-3" aria-hidden="true" /> Salah</dt>
                      <dd className="font-serif text-lg text-muted-foreground line-through decoration-danger/60">{e.wrong}</dd>
                    </div>
                    <div className="flex items-start gap-2">
                      <dt className="shrink-0 inline-flex items-center gap-1 text-xs font-bold text-brand-ink bg-brand-tint rounded-full px-2 py-1 mt-0.5"><Check className="w-3 h-3" aria-hidden="true" /> Benar</dt>
                      <dd className="font-serif text-lg text-foreground">{e.right}</dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-sm text-foreground leading-relaxed">{e.explanation_id}</p>
                  <div className="mt-4">
                    <button type="button" onClick={() => setOpen(open === e.slug ? null : e.slug)} aria-expanded={open === e.slug} className={smallButtonClass}>
                      <ListChecks className="w-4 h-4" aria-hidden="true" /> {open === e.slug ? "Tutup latihan" : "Coba soalnya"}
                    </button>
                  </div>
                  {open === e.slug && (
                    <div className="mt-4">
                      <ExerciseSession tag={l1ErrorTag(e.slug)} count={1} title={e.title} />
                    </div>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
