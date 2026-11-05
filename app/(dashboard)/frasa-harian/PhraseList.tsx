"use client";

import { useState } from "react";
import Link from "next/link";
import { BookmarkPlus, Check, Loader2 } from "lucide-react";
import { Badge, Card, Eyebrow } from "@/components/ui/primitives";
import { SpeakButtons } from "@/components/course/StepViews";
import { smallButtonClass } from "@/components/exercises/shared";
import { savePhraseToReview } from "./actions";

export interface PhraseView {
  slug: string;
  text_en: string;
  text_id: string;
  literal_id: string | null;
  status: "draft" | "published";
}

export interface PhraseGroupView {
  id: string;
  label: string;
  phrases: PhraseView[];
}

type SaveState = { status: "idle" } | { status: "saving" } | { status: "done"; added: boolean } | { status: "error"; message: string };

function SaveButton({ slug }: { slug: string }) {
  const [state, setState] = useState<SaveState>({ status: "idle" });
  const save = async () => {
    setState({ status: "saving" });
    try {
      const res = await savePhraseToReview(slug);
      setState(res.ok ? { status: "done", added: res.added } : { status: "error", message: res.error });
    } catch {
      setState({ status: "error", message: "Gagal menyimpan. Periksa koneksi, lalu coba lagi." });
    }
  };
  if (state.status === "done") {
    return (
      <p className="flex items-center gap-2 text-sm font-semibold text-brand-ink" aria-live="polite">
        <Check className="w-4 h-4" aria-hidden="true" />
        {state.added ? "Disimpan ke Review." : "Sudah ada di Review."}
        <Link href="/review" className="underline">Buka Review</Link>
      </p>
    );
  }
  return (
    <div aria-live="polite">
      <button type="button" onClick={save} disabled={state.status === "saving"} className={smallButtonClass}>
        {state.status === "saving" ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <BookmarkPlus className="w-4 h-4" aria-hidden="true" />}
        {state.status === "saving" ? "Menyimpan..." : state.status === "error" ? "Coba lagi" : "Simpan ke Review"}
      </button>
      {state.status === "error" && <p role="alert" className="mt-1 text-sm text-danger">{state.message}</p>}
    </div>
  );
}

/** Daftar frasa per situasi: Inggris + audio → arti natural → arti kata per kata → simpan ke Review. */
export default function PhraseList({ groups }: { groups: PhraseGroupView[] }) {
  return (
    <div className="space-y-10">
      {groups.map((g) => (
        <section key={g.id} aria-labelledby={`sit-${g.id}`}>
          <Eyebrow>{g.label}</Eyebrow>
          <h2 id={`sit-${g.id}`} className="sr-only">{g.label}</h2>
          <ul className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            {g.phrases.map((p) => (
              <li key={p.slug}>
                <Card className="h-full flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <p lang="en" className="font-serif text-xl leading-snug text-foreground">{p.text_en}</p>
                    {p.status === "draft" && <Badge tone="muted">Draft</Badge>}
                  </div>
                  <SpeakButtons text={p.text_en} label={p.text_en} />
                  <p className="text-foreground">{p.text_id}</p>
                  {p.literal_id && (
                    <p className="text-sm text-muted-foreground">
                      <span className="text-xs uppercase tracking-wide">kata per kata</span>
                      <br />
                      {p.literal_id}
                    </p>
                  )}
                  <div className="mt-auto pt-1">
                    <SaveButton slug={p.slug} />
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
