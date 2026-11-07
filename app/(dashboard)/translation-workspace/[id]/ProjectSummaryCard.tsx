"use client";

import { useMemo, useState } from "react";
import { BarChart3, Check, Copy } from "lucide-react";
import { Button, Card } from "@/components/ui/primitives";
import { summarizeProject, summaryToText, type SummaryAssessmentRow, type SummarySegment, type SummaryWarning } from "@/lib/translation/summary";

/**
 * Ringkasan statistik proyek (Fase 29, item 2): berlabel "ringkasan untuk ditinjau", dengan rumus dan data yang
 * dikecualikan di setiap angka. Dihitung di browser dari data yang sudah dimuat; tanpa AI dan tanpa jaringan.
 */
export default function ProjectSummaryCard({
  title,
  segments,
  warnings,
  assessment,
  annotatedSegmentCount,
}: {
  title: string;
  segments: SummarySegment[];
  warnings: SummaryWarning[];
  assessment: SummaryAssessmentRow[] | null;
  annotatedSegmentCount: number;
}) {
  const [copied, setCopied] = useState<"idle" | "ok" | "gagal">("idle");
  const summary = useMemo(
    () => summarizeProject({ segments, warnings, assessment, annotatedSegmentCount }),
    [segments, warnings, assessment, annotatedSegmentCount]
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summaryToText(title, summary));
      setCopied("ok");
    } catch {
      setCopied("gagal");
    }
    window.setTimeout(() => setCopied("idle"), 2500);
  };

  return (
    <Card className="mt-8">
      <details>
        <summary className="cursor-pointer min-h-[44px] flex items-center gap-2 font-serif text-lg font-medium text-foreground">
          <BarChart3 className="w-5 h-5 text-brand-ink" aria-hidden="true" />
          {summary.label}
        </summary>
        <div className="pt-3">
          <p className="text-sm text-muted-foreground mb-4">{summary.disclaimer}</p>
          <dl className="space-y-4">
            {summary.metrics.map((m) => (
              <div key={m.id} className="border-b border-border pb-3 last:border-b-0">
                <dt className="text-sm font-semibold text-foreground">{m.label}</dt>
                <dd className="text-foreground">{m.value}</dd>
                <dd className="text-xs text-muted-foreground mt-1">Rumus: {m.formula}.</dd>
                {m.excluded && <dd className="text-xs text-warning-ink mt-1">Dikecualikan: {m.excluded}</dd>}
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <Button variant="secondary" onClick={copy}>
              {copied === "ok" ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
              Salin ringkasan
            </Button>
            <span role="status" className="text-sm text-muted-foreground">
              {copied === "ok" ? "Tersalin." : copied === "gagal" ? "Gagal menyalin; salin manual dari teks di atas." : ""}
            </span>
          </div>
        </div>
      </details>
    </Card>
  );
}
