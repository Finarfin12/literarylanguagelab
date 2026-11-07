"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Lightbulb, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/primitives";
import ToneAnalysis from "@/components/tone/ToneAnalysis";
import EditSuggestSection from "./EditSuggestSection";
import { containsTerm, type QaWarning } from "@/lib/translation/qa";
import { matchTm } from "@/lib/translation/tm-match";
import {
  addAnnotation,
  deleteAnnotation,
  saveSegmentToMemory,
} from "../actions";
import type {
  WorkspaceAnnotation,
  WorkspaceGlossaryEntry,
  WorkspaceSegment,
  WorkspaceTechnique,
  WorkspaceTmEntry,
} from "../_lib/types";

type Suggestion = { source_span: string; target_span: string; technique_key: string; reason: string };

const fieldClass = "w-full bg-background border border-border rounded-control p-2 text-sm text-foreground focus:outline-none focus:border-brand";

/** Isi panel samping untuk satu segmen: saran TM, glosarium, peringatan QA, komentar, dan anotasi teknik. */
export default function SegmentPanel({
  segment,
  warnings,
  tm,
  glossary,
  techniques,
  annotations,
  onClose,
  onUseTm,
  onEditTarget,
  onComment,
  onAnnotationsChange,
}: {
  segment: WorkspaceSegment;
  warnings: QaWarning[];
  tm: WorkspaceTmEntry[];
  glossary: WorkspaceGlossaryEntry[];
  techniques: WorkspaceTechnique[];
  annotations: WorkspaceAnnotation[];
  onClose: () => void;
  onUseTm: (target: string) => void;
  onEditTarget: (target: string) => void;
  onComment: (comment: string) => void;
  onAnnotationsChange: (next: WorkspaceAnnotation[]) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [sourceSpan, setSourceSpan] = useState("");
  const [targetSpan, setTargetSpan] = useState("");
  const [techniqueKey, setTechniqueKey] = useState(techniques[0]?.key ?? "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const sourceRef = useRef<HTMLParagraphElement>(null);

  const matches = useMemo(() => matchTm(segment.source, tm), [segment.source, tm]);
  const terms = useMemo(() => glossary.filter((g) => containsTerm(segment.source, g.term)), [segment.source, glossary]);
  const technique = techniques.find((t) => t.key === techniqueKey);
  const nameOf = (key: string) => techniques.find((t) => t.key === key)?.name_id ?? key;

  const captureSourceSelection = () => {
    const sel = window.getSelection();
    const text = sel?.toString().trim() ?? "";
    // Seleksi harus berada di dalam teks sumber segmen ini
    if (text && sourceRef.current && sel?.anchorNode && sourceRef.current.contains(sel.anchorNode)) setSourceSpan(text);
    else setMessage("Sorot dulu frasa di teks sumber (kotak di atas), lalu tekan tombol ini.");
  };

  const captureTargetSelection = () => {
    const el = document.getElementById(`target-${segment.id}`) as HTMLTextAreaElement | null;
    const text = el ? el.value.slice(el.selectionStart, el.selectionEnd).trim() : "";
    if (text) setTargetSpan(text);
    else setMessage("Sorot dulu frasa di kolom terjemahan, lalu tekan tombol ini.");
  };

  const add = (input: { sourceSpan: string; targetSpan: string; techniqueKey: string; suggestedByAi: boolean }, after?: () => void) => {
    setMessage("");
    startTransition(async () => {
      const res = await addAnnotation({ segmentId: segment.id, ...input });
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      onAnnotationsChange([
        ...annotations,
        { id: res.data!.id, segment_id: segment.id, source_span: input.sourceSpan, target_span: input.targetSpan, technique_key: input.techniqueKey, suggested_by_ai: input.suggestedByAi },
      ]);
      after?.();
    });
  };

  const remove = (id: string) => {
    startTransition(async () => {
      const res = await deleteAnnotation(id);
      if (res.ok) onAnnotationsChange(annotations.filter((a) => a.id !== id));
      else setMessage(res.error);
    });
  };

  const suggest = async () => {
    setMessage("");
    setSuggesting(true);
    try {
      const res = await fetch("/api/translation/techniques", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceText: segment.source, targetText: segment.target ?? "" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal meminta saran.");
      setSuggestions(data.suggestions || []);
      if ((data.suggestions || []).length === 0) setMessage("AI tidak menemukan teknik yang jelas pada segmen ini.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Gagal meminta saran.");
    } finally {
      setSuggesting(false);
    }
  };

  const saveToTm = () => {
    setMessage("");
    startTransition(async () => {
      const res = await saveSegmentToMemory({ source: segment.source, target: segment.target ?? "", context: "Ruang Kerja Segmen" });
      setMessage(res.ok ? "Disimpan ke Translation Memory." : res.error);
    });
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h2 className="font-bold text-foreground">Segmen {segment.idx + 1}</h2>
        <button type="button" onClick={onClose} aria-label="Tutup panel" className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-control hover:bg-muted">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {message && <p role="status" className="text-sm text-muted-foreground bg-muted rounded-control p-2">{message}</p>}

        {warnings.length > 0 && (
          <section aria-label="Peringatan pemeriksaan otomatis">
            <h3 className="text-sm font-bold mb-2">Pemeriksaan otomatis</h3>
            <ul className="space-y-1">
              {warnings.map((w, i) => (
                <li key={i} className="text-sm text-warning-ink ">• {w.message}</li>
              ))}
            </ul>
          </section>
        )}

        <section aria-label="Saran Translation Memory">
          <h3 className="text-sm font-bold mb-2">Translation Memory (≥ 70%)</h3>
          {matches.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada kecocokan.</p>
          ) : (
            <ul className="space-y-2">
              {matches.map((m, i) => (
                <li key={i} className="border border-border rounded-control p-2 text-sm">
                  <p className="text-xs font-bold text-brand-ink">{Math.round(m.score * 100)}% cocok</p>
                  <p className="text-muted-foreground italic">{m.source}</p>
                  <p className="text-foreground">{m.target}</p>
                  <Button variant="secondary" className="mt-2" onClick={() => onUseTm(m.target)}>Pakai terjemahan ini</Button>
                </li>
              ))}
            </ul>
          )}
          <Button variant="ghost" className="mt-2" onClick={saveToTm} disabled={pending || !(segment.target ?? "").trim()}>Simpan segmen ini ke Translation Memory</Button>
        </section>

        <section aria-label="Istilah glosarium">
          <h3 className="text-sm font-bold mb-2">Glosarium</h3>
          {terms.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada istilah glosarium di segmen ini.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {terms.map((g) => (
                <li key={g.term}><strong>{g.term}</strong> → {g.preferred}</li>
              ))}
            </ul>
          )}
        </section>

        <section aria-label="Analisis tone segmen">
          <ToneAnalysis text={segment.source} onUse={onUseTm} label="Analisis tone segmen" />
        </section>

        <EditSuggestSection segment={segment} onEditTarget={onEditTarget} />

        <section aria-label="Komentar penerjemah">
          <h3 className="text-sm font-bold mb-2">Komentar penerjemah</h3>
          <textarea
            className={`${fieldClass} min-h-[80px]`}
            value={segment.comment ?? ""}
            onChange={(e) => onComment(e.target.value)}
            placeholder="Alasan pilihan terjemahanmu..."
            aria-label="Komentar penerjemah"
          />
        </section>

        <section aria-label="Anotasi teknik penerjemahan">
          <h3 className="text-sm font-bold mb-2">Teknik penerjemahan</h3>

          {annotations.length > 0 && (
            <ul className="space-y-2 mb-3">
              {annotations.map((a) => (
                <li key={a.id} className="border border-border rounded-control p-2 text-sm flex items-start gap-2">
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs font-bold text-brand-ink">{nameOf(a.technique_key)}{a.suggested_by_ai ? " · saran AI" : ""}</span>
                    <span className="block text-muted-foreground italic">&ldquo;{a.source_span}&rdquo;</span>
                    <span className="block text-foreground">&ldquo;{a.target_span}&rdquo;</span>
                  </span>
                  <button type="button" onClick={() => remove(a.id)} disabled={pending} aria-label="Hapus anotasi" className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-control hover:bg-danger/10 text-muted-foreground hover:text-danger">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="border border-border rounded-control p-3 space-y-3">
            <p ref={sourceRef} className="text-sm font-serif text-foreground bg-muted/50 rounded-control p-2 select-text">{segment.source}</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={captureSourceSelection}>Ambil frasa sumber</Button>
              <Button variant="secondary" onClick={captureTargetSelection}>Ambil frasa terjemahan</Button>
            </div>
            <p className="text-xs text-muted-foreground">Sumber: {sourceSpan ? `“${sourceSpan}”` : "belum dipilih"}</p>
            <p className="text-xs text-muted-foreground">Terjemahan: {targetSpan ? `“${targetSpan}”` : "belum dipilih"}</p>
            <select className={`${fieldClass} min-h-[44px]`} value={techniqueKey} onChange={(e) => setTechniqueKey(e.target.value)} aria-label="Pilih teknik">
              {techniques.map((t) => <option key={t.key} value={t.key}>{t.name_id} ({t.name_en})</option>)}
            </select>
            {technique && (
              <p className="text-xs text-muted-foreground">{technique.definition_id}{technique.example ? ` Contoh: ${technique.example}.` : ""}</p>
            )}
            <Button
              disabled={pending || !sourceSpan || !targetSpan || !techniqueKey}
              onClick={() => add({ sourceSpan, targetSpan, techniqueKey, suggestedByAi: false }, () => { setSourceSpan(""); setTargetSpan(""); })}
            >
              Tambah anotasi
            </Button>
          </div>

          <div className="mt-3">
            <Button variant="secondary" onClick={suggest} loading={suggesting} disabled={!(segment.target ?? "").trim()}>
              <Lightbulb className="w-4 h-4" /> Sarankan teknik
            </Button>
            {suggestions.length > 0 && (
              <ul className="mt-3 space-y-2">
                {suggestions.map((s, i) => (
                  <li key={i} className="border border-brand/30 bg-brand-tint rounded-control p-2 text-sm">
                    <p className="text-xs font-bold text-brand-ink">{nameOf(s.technique_key)}</p>
                    <p className="text-muted-foreground italic">&ldquo;{s.source_span}&rdquo;</p>
                    <p className="text-foreground">&ldquo;{s.target_span}&rdquo;</p>
                    {s.reason && <p className="text-xs text-muted-foreground mt-1">{s.reason}</p>}
                    <div className="mt-2 flex gap-2">
                      <Button
                        disabled={pending}
                        onClick={() => add({ sourceSpan: s.source_span, targetSpan: s.target_span, techniqueKey: s.technique_key, suggestedByAi: true }, () => setSuggestions((x) => x.filter((_, j) => j !== i)))}
                      >
                        Terima
                      </Button>
                      <Button variant="ghost" onClick={() => setSuggestions((x) => x.filter((_, j) => j !== i))}>Tolak</Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
