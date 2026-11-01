"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Languages } from "lucide-react";

type StageResponse = { show: boolean; stage: { stage: "Pemula" | "Berkembang" | "Mahir"; average: number; count: number } | null };

const STAGE_HINT: Record<string, string> = {
  Pemula: "Rata-rata skor di bawah 2,0. Fokus pada ketepatan makna dan kewajaran bahasa Indonesia.",
  Berkembang: "Rata-rata skor 2,0–2,5. Terjemahanmu sudah cukup akurat; tingkatkan keberterimaan dan keterbacaan.",
  Mahir: "Rata-rata skor di atas 2,5. Terjemahanmu akurat, wajar, dan mudah dibaca.",
};

/** Tahap penerjemah (terpisah dari CEFR). Hanya tampil bagi pengguna dengan tujuan "penerjemahan". */
export default function TranslatorStageCard() {
  const [data, setData] = useState<StageResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/translation/stage")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) setData(d);
      })
      .catch(() => {
        // kartu opsional: abaikan jika gagal
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!data || !data.show) return null;

  return (
    <div className="bg-card border border-border rounded-card p-5 md:p-7 mb-8">
      <h2 className="font-serif text-xl font-medium mb-1 flex items-center gap-2"><Languages className="w-5 h-5 text-brand-ink" aria-hidden="true" /> Tahap penerjemah</h2>
      {data.stage ? (
        <>
          <p className="text-2xl font-serif font-medium text-foreground mt-2">{data.stage.stage}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Rata-rata skor rubrik {data.stage.average.toFixed(2)} dari 3, berdasarkan {data.stage.count} penilaian terakhir.
          </p>
          <p className="text-sm text-muted-foreground mt-2">{STAGE_HINT[data.stage.stage]}</p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground mt-2">
          Belum ada penilaian. Nilai terjemahanmu dengan rubrik di{" "}
          <Link href="/translation-workspace" className="text-brand-ink underline">Ruang Kerja Segmen</Link> atau mode Rubrik di Translation Workshop.
        </p>
      )}
    </div>
  );
}
