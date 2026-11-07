"use client";

import { useState } from "react";
import { PenLine, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import { EDIT_ISSUE_LABELS, applySuggestion, type EditResult, type EditSuggestion } from "@/lib/translation/edit-suggest";
import type { WorkspaceSegment } from "../_lib/types";

/**
 * Penyuntingan bahasa Indonesia (Fase 29, item 3): AI hanya MENGUSULKAN. Tidak ada yang berubah sebelum pengguna menekan
 * "Terapkan" pada satu saran; perubahan terakhir dapat diurungkan. Catatan makna hanyalah peringatan untuk diperiksa.
 */
export default function EditSuggestSection({ segment, onEditTarget }: { segment: WorkspaceSegment; onEditTarget: (target: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<EditResult | null>(null);
  const [undo, setUndo] = useState<string[]>([]);
  const target = segment.target ?? "";

  const ask = async () => {
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/translation/edit-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: segment.source, target }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal meminta saran.");
      const parsed = data as EditResult;
      setResult(parsed);
      if (parsed.suggestions.length === 0 && parsed.meaningNotes.length === 0) setMessage("AI tidak menemukan hal yang perlu disunting pada segmen ini. Tetap periksa sendiri.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Gagal meminta saran.");
    } finally {
      setLoading(false);
    }
  };

  const apply = (s: EditSuggestion, i: number) => {
    const r = applySuggestion(target, s);
    if (!r.changed) {
      setMessage("Kutipan itu sudah tidak ada di terjemahanmu, jadi saran ini dilewati.");
      setResult((x) => (x ? { ...x, suggestions: x.suggestions.filter((_, j) => j !== i) } : x));
      return;
    }
    setUndo((u) => [...u, target]);
    onEditTarget(r.target);
    setMessage("Saran diterapkan. Baca ulang kalimatnya dan bandingkan dengan sumber.");
    setResult((x) => (x ? { ...x, suggestions: x.suggestions.filter((_, j) => j !== i) } : x));
  };

  const undoLast = () => {
    const prev = undo[undo.length - 1];
    if (prev === undefined) return;
    onEditTarget(prev);
    setUndo((u) => u.slice(0, -1));
    setMessage("Perubahan terakhir diurungkan.");
  };

  return (
    <section aria-label="Penyuntingan bahasa Indonesia">
      <h3 className="text-sm font-bold mb-2">Penyuntingan bahasa Indonesia</h3>
      <p className="text-xs text-muted-foreground mb-2">
        Saran AI untuk kamu periksa: ejaan, tata bahasa, tanda baca, dan kalimat efektif. Tidak ada yang berubah sebelum kamu menekan Terapkan, dan AI bisa keliru.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={ask} loading={loading} disabled={!target.trim()}>
          <PenLine className="w-4 h-4" aria-hidden="true" /> Minta saran penyuntingan
        </Button>
        {undo.length > 0 && (
          <Button variant="ghost" onClick={undoLast}>
            <Undo2 className="w-4 h-4" aria-hidden="true" /> Urungkan perubahan terakhir
          </Button>
        )}
      </div>
      {message && <p role="status" className="mt-2 text-sm text-muted-foreground bg-muted rounded-control p-2">{message}</p>}

      {result && result.meaningNotes.length > 0 && (
        <div className="mt-3 border border-warning/40 bg-warning-tint rounded-control p-2 text-sm">
          <p className="text-xs font-bold text-warning-ink">Periksa maknanya dengan sumber (bukan saran perubahan)</p>
          <ul className="mt-1 space-y-1 text-warning-ink">
            {result.meaningNotes.map((n, i) => (
              <li key={i}>• {n}</li>
            ))}
          </ul>
        </div>
      )}

      {result && result.suggestions.length > 0 && (
        <ul className="mt-3 space-y-2">
          {result.suggestions.map((s, i) => (
            <li key={`${s.original}-${i}`} className="border border-brand/30 bg-brand-tint rounded-control p-2 text-sm">
              <p className="text-xs font-bold text-brand-ink">{EDIT_ISSUE_LABELS[s.type]} · saran AI</p>
              <p className="text-muted-foreground">Sekarang: <span className="line-through">{s.original}</span></p>
              <p className="text-foreground">Usulan: <strong>{s.suggestion}</strong></p>
              <p className="text-xs text-muted-foreground mt-1">{s.reason}</p>
              <div className="mt-2 flex gap-2">
                <Button onClick={() => apply(s, i)}>Terapkan</Button>
                <Button variant="ghost" onClick={() => setResult((x) => (x ? { ...x, suggestions: x.suggestions.filter((_, j) => j !== i) } : x))}>Abaikan</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {result && result.dropped > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">{result.dropped} saran AI dibuang otomatis karena tidak cocok dengan teksmu (kutipan tidak ada, angka berubah, atau tidak lengkap).</p>
      )}
    </section>
  );
}
