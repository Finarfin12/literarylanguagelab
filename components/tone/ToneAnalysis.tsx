"use client";

// Analisis tone satu kalimat/segmen lewat /api/analyze-tone (Fase 14f): nada, markers, tips mempertahankan nada saat
// menerjemahkan, dan usulan terjemahan. Usulan TIDAK pernah menimpa terjemahan pengguna: tombol "Pakai usulan" hanya
// muncul bila `onUse` diberikan dan hanya mengisi saat ditekan.

import { useState } from "react";
import { Loader2, Music2 } from "lucide-react";
import { MAX_TONE_CONTEXT, MAX_TONE_TEXT, type ToneResult } from "@/lib/tone";

const TONE_LABELS: Record<string, string> = {
  neutral: "Netral",
  formal: "Formal",
  sarcastic: "Sarkastis",
  ironic: "Ironis",
  humorous: "Humoris",
  melancholic: "Melankolis",
  dramatic: "Dramatis",
  romantic: "Romantis",
  ominous: "Mengancam",
  urgent: "Mendesak",
};

export default function ToneAnalysis({
  text,
  context,
  onUse,
  label = "Analisis tone",
}: {
  text: string;
  context?: string;
  onUse?: (translation: string) => void;
  label?: string;
}) {
  const [result, setResult] = useState<ToneResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forText, setForText] = useState("");

  // hasil milik teks sebelumnya disembunyikan bila kalimat berganti
  const current = result && forText === text ? result : null;

  const run = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/analyze-tone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, MAX_TONE_TEXT), context: (context ?? "").slice(0, MAX_TONE_CONTEXT) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Gagal menganalisis tone.");
      setResult(data as ToneResult);
      setForText(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menganalisis tone.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-border rounded-card p-4">
      <h4 className="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-2">
        <Music2 className="w-4 h-4" aria-hidden="true" />
        Tone &amp; Terjemahan
      </h4>
      <button
        type="button"
        onClick={run}
        disabled={loading || !text.trim()}
        className="w-full min-h-[44px] rounded-control bg-brand-tint text-brand-ink font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? "Menganalisis..." : current ? "Analisis ulang" : label}
      </button>

      {error && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}

      {current && (
        <div className="mt-4 space-y-3 text-sm text-foreground">
          <p>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-brand-tint text-brand-ink font-semibold">
              {TONE_LABELS[current.tone] ?? current.tone}
            </span>{" "}
            <span className="text-muted-foreground nums">keyakinan {current.confidence}%</span>
          </p>
          {current.markers.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.14em] mb-1">Penanda</p>
              <div className="flex flex-wrap gap-1.5">
                {current.markers.map((m) => (
                  <span key={m} className="px-2.5 py-1 rounded-full bg-muted text-xs">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
          {current.preservation_tips && (
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.14em] mb-1">Tips menjaga nada</p>
              <p className="leading-relaxed">{current.preservation_tips}</p>
            </div>
          )}
          {current.better_translation && (
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.14em] mb-1">Usulan terjemahan</p>
              <p className="font-serif text-base leading-relaxed bg-muted rounded-control p-3">{current.better_translation}</p>
              {onUse && (
                <button
                  type="button"
                  onClick={() => onUse(current.better_translation)}
                  className="mt-2 min-h-[44px] px-4 rounded-control border border-border bg-card text-sm font-semibold hover:bg-muted"
                >
                  Pakai usulan
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
