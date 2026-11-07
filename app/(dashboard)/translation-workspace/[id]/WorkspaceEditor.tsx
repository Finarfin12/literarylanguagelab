"use client";

import Markdown from "@/components/ui/Markdown";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Award, CheckCircle2, Download, PanelRightOpen } from "lucide-react";
import ResponsivePanel from "@/components/ui/ResponsivePanel";
import { Button, Card, CardTitle } from "@/components/ui/primitives";
import { runQaChecks, type QaWarning } from "@/lib/translation/qa";
import { saveSegment } from "../actions";
import SegmentPanel from "./SegmentPanel";
import ProjectSummaryCard from "./ProjectSummaryCard";
import type {
  WorkspaceAnnotation,
  WorkspaceAssessment,
  WorkspaceGlossaryEntry,
  WorkspaceProject,
  WorkspaceSegment,
  WorkspaceTechnique,
  WorkspaceTmEntry,
} from "../_lib/types";

const PAGE_SIZE = 20;
const AUTOSAVE_MS = 800;

type SaveState = "saving" | "saved" | "error";

export default function WorkspaceEditor({
  project,
  initialSegments,
  initialAnnotations,
  techniques,
  glossary,
  tm,
  latestAssessment,
}: {
  project: WorkspaceProject;
  initialSegments: WorkspaceSegment[];
  initialAnnotations: WorkspaceAnnotation[];
  techniques: WorkspaceTechnique[];
  glossary: WorkspaceGlossaryEntry[];
  tm: WorkspaceTmEntry[];
  latestAssessment: WorkspaceAssessment | null;
}) {
  const [segments, setSegments] = useState(initialSegments);
  const [annotations, setAnnotations] = useState(initialAnnotations);
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<Record<string, SaveState>>({});
  const [assessment, setAssessment] = useState<WorkspaceAssessment | null>(latestAssessment);
  const [rubricLoading, setRubricLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Simpan otomatis per segmen (debounce). Ref berisi data terbaru untuk dipakai timer.
  const segmentsRef = useRef(segments);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  const persist = async (id: string) => {
    const seg = segmentsRef.current.find((s) => s.id === id);
    if (!seg) return;
    setSaveState((s) => ({ ...s, [id]: "saving" }));
    const res = await saveSegment({ id, target: seg.target ?? "", status: seg.status, comment: seg.comment ?? "" });
    setSaveState((s) => ({ ...s, [id]: res.ok ? "saved" : "error" }));
    if (!res.ok) setMessage(res.error);
  };

  const flush = (id: string) => {
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
      void persist(id);
    }
  };

  const schedule = (id: string) => {
    const old = timers.current.get(id);
    if (old) clearTimeout(old);
    setSaveState((s) => ({ ...s, [id]: "saving" }));
    timers.current.set(
      id,
      setTimeout(() => {
        timers.current.delete(id);
        void persist(id);
      }, AUTOSAVE_MS)
    );
  };

  // Saat halaman ditutup, simpan perubahan yang masih menunggu
  useEffect(() => {
    const pendingTimers = timers.current;
    return () => {
      for (const id of Array.from(pendingTimers.keys())) {
        clearTimeout(pendingTimers.get(id));
        pendingTimers.delete(id);
        const seg = segmentsRef.current.find((s) => s.id === id);
        if (seg) void saveSegment({ id, target: seg.target ?? "", status: seg.status, comment: seg.comment ?? "" });
      }
    };
  }, []);

  const update = (id: string, patch: Partial<Pick<WorkspaceSegment, "target" | "status" | "comment">>) => {
    setSegments((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    schedule(id);
  };

  // Pemeriksaan kualitas otomatis dihitung ulang setiap segmen berubah
  const warnings = useMemo(() => runQaChecks(segments.map((s) => ({ idx: s.idx, source: s.source, target: s.target, status: s.status })), glossary), [segments, glossary]);
  const warningsByIdx = useMemo(() => {
    const map = new Map<number, QaWarning[]>();
    for (const w of warnings) map.set(w.idx, [...(map.get(w.idx) ?? []), w]);
    return map;
  }, [warnings]);

  const doneCount = segments.filter((s) => s.status === "done").length;
  const totalPages = Math.max(1, Math.ceil(segments.length / PAGE_SIZE));
  const visible = segments.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const selected = segments.find((s) => s.id === selectedId) ?? null;

  const techniqueName = (key: string) => techniques.find((t) => t.key === key)?.name_id ?? key;
  const distribution = useMemo(() => {
    const tally = new Map<string, number>();
    for (const a of annotations) tally.set(a.technique_key, (tally.get(a.technique_key) ?? 0) + 1);
    return [...tally.entries()].sort((a, b) => b[1] - a[1]);
  }, [annotations]);
  const maxCount = distribution[0]?.[1] ?? 1;

  const runRubric = async () => {
    setMessage("");
    // Pastikan semua perubahan sudah tersimpan agar penilaian memakai terjemahan terbaru
    for (const id of Array.from(timers.current.keys())) {
      const t = timers.current.get(id);
      if (t) clearTimeout(t);
      timers.current.delete(id);
      await persist(id);
    }
    setRubricLoading(true);
    try {
      const res = await fetch("/api/translation/rubric", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menilai.");
      setAssessment({
        id: data.assessmentId ?? "baru",
        weighted_score: data.weightedScore,
        created_at: new Date().toISOString(),
        per_segment: data.perSegment,
      });
      if (!data.saved) setMessage("Hasil ditampilkan tetapi belum tersimpan (migrasi 0010 belum dijalankan).");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Gagal menilai.");
    } finally {
      setRubricLoading(false);
    }
  };

  const exportHref = (kind: string) => `/api/translation/export?project=${project.id}&kind=${kind}`;
  const stateLabel = (id: string) => ({ saving: "Menyimpan…", saved: "Tersimpan", error: "Gagal menyimpan" })[saveState[id]] ?? "";

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto pb-32">
      <Link href="/translation-workspace" className="inline-flex items-center gap-2 min-h-[44px] text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Semua proyek
      </Link>

      <div className="mt-2 mb-6">
        <h1 className="text-[28px] md:text-4xl leading-[1.15] font-serif font-medium text-foreground">{project.title}</h1>
        {project.brief && <p className="text-sm text-muted-foreground mt-1">Brief: {project.brief}</p>}
        <p className="text-sm text-muted-foreground mt-2">
          {doneCount}/{segments.length} segmen selesai · {warnings.length} peringatan
        </p>
        <div className="h-2 mt-2 rounded-full bg-muted overflow-hidden" aria-hidden="true">
          <div className="h-full bg-brand" style={{ width: `${segments.length ? (doneCount / segments.length) * 100 : 0}%` }} />
        </div>
      </div>

      {message && <p role="status" className="mb-4 text-sm bg-muted rounded-control p-3">{message}</p>}

      <div className="flex flex-wrap gap-2 mb-6">
        <Button onClick={runRubric} loading={rubricLoading}><Award className="w-4 h-4" /> Nilai dengan rubrik</Button>
        <a href={exportHref("bilingual")} className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-control text-sm font-bold bg-muted text-foreground border border-border hover:bg-muted/70"><Download className="w-4 h-4" /> CSV bilingual</a>
        <a href={exportHref("techniques")} className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-control text-sm font-bold bg-muted text-foreground border border-border hover:bg-muted/70"><Download className="w-4 h-4" /> CSV teknik</a>
        <a href="/api/translation/export?kind=glossary" className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-control text-sm font-bold bg-muted text-foreground border border-border hover:bg-muted/70"><Download className="w-4 h-4" /> CSV glosarium</a>
      </div>

      {/* Segmen */}
      <ol className="space-y-4">
        {visible.map((seg) => {
          const segWarnings = warningsByIdx.get(seg.idx) ?? [];
          return (
            <li key={seg.id} className={`bg-card border rounded-card p-4 ${selectedId === seg.id ? "border-brand" : "border-border"}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-brand-ink">#{seg.idx + 1}</span>
                {segWarnings.length > 0 && <span className="text-xs font-bold text-warning-ink ">{segWarnings.length} peringatan</span>}
                <span className="flex-1" />
                <span className="text-xs text-muted-foreground" aria-live="polite">{stateLabel(seg.id)}</span>
              </div>
              <p className="font-serif text-foreground mb-3 leading-relaxed">{seg.source}</p>
              <textarea
                id={`target-${seg.id}`}
                value={seg.target ?? ""}
                onChange={(e) => update(seg.id, { target: e.target.value })}
                onBlur={() => flush(seg.id)}
                rows={3}
                maxLength={5000}
                aria-label={`Terjemahan segmen ${seg.idx + 1}`}
                placeholder="Terjemahanmu..."
                className="w-full bg-background border border-border rounded-control p-3 text-foreground font-serif focus:outline-none focus:border-brand"
              />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button variant={seg.status === "done" ? "primary" : "secondary"} onClick={() => update(seg.id, { status: seg.status === "done" ? "draft" : "done" })}>
                  <CheckCircle2 className="w-4 h-4" /> {seg.status === "done" ? "Selesai" : "Tandai selesai"}
                </Button>
                <Button variant="secondary" onClick={() => setSelectedId(seg.id)}>
                  <PanelRightOpen className="w-4 h-4" /> Bantuan &amp; anotasi
                </Button>
              </div>
            </li>
          );
        })}
      </ol>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <Button variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>Sebelumnya</Button>
          <span className="text-sm text-muted-foreground">Halaman {page + 1} dari {totalPages}</span>
          <Button variant="secondary" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Berikutnya</Button>
        </div>
      )}

      {/* Ringkasan statistik untuk ditinjau (Fase 29) */}
      <ProjectSummaryCard
        title={project.title}
        segments={segments}
        warnings={warnings}
        assessment={assessment?.per_segment ?? null}
        annotatedSegmentCount={new Set(annotations.map((a) => a.segment_id)).size}
      />

      {/* Distribusi teknik */}
      {distribution.length > 0 && (
        <Card className="mt-8">
          <CardTitle>Distribusi teknik penerjemahan</CardTitle>
          <ul className="space-y-2">
            {distribution.map(([key, n]) => (
              <li key={key} className="text-sm">
                <div className="flex justify-between mb-1"><span>{techniqueName(key)}</span><span className="font-bold">{n}</span></div>
                <div className="h-2 rounded-full bg-muted overflow-hidden" aria-hidden="true">
                  <div className="h-full bg-brand" style={{ width: `${(n / maxCount) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Hasil rubrik */}
      {assessment && (
        <Card className="mt-8">
          <CardTitle icon={<Award className="w-5 h-5 text-brand-ink" />}>Penilaian rubrik (Nababan et al., 2012)</CardTitle>
          <p className="text-foreground">Skor akhir tertimbang: <strong>{assessment.weighted_score.toFixed(2)}</strong> dari 3 <span className="text-xs text-muted-foreground">(akurasi : keberterimaan : keterbacaan = 3 : 2 : 1)</span></p>
          <p className="text-xs text-muted-foreground mb-3">Dinilai AI untuk belajar mandiri, bukan penilaian resmi.</p>
          <ul className="space-y-2 text-sm">
            {assessment.per_segment.map((p) => (
              <li key={p.idx} className="border border-border rounded-control p-2">
                <p className="font-bold">Segmen {p.idx + 1}: akurasi {p.accuracy}, keberterimaan {p.acceptability}, keterbacaan {p.readability}</p>
                {p.notes && <div className="text-muted-foreground"><Markdown>{p.notes}</Markdown></div>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <ResponsivePanel open={!!selected} onClose={() => setSelectedId(null)} label="Bantuan segmen" width="440px">
        {selected && (
          <SegmentPanel
            segment={selected}
            warnings={warningsByIdx.get(selected.idx) ?? []}
            tm={tm}
            glossary={glossary}
            techniques={techniques}
            annotations={annotations.filter((a) => a.segment_id === selected.id)}
            onClose={() => setSelectedId(null)}
            onUseTm={(target) => update(selected.id, { target })}
            onComment={(comment) => update(selected.id, { comment })}
            onAnnotationsChange={(next) => setAnnotations((prev) => [...prev.filter((a) => a.segment_id !== selected.id), ...next])}
          />
        )}
      </ResponsivePanel>
    </div>
  );
}
