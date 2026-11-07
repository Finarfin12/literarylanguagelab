// Ringkasan statistik proyek terjemahan (Fase 29, item 2). Fungsi murni, tanpa impor runtime agar bisa diuji unit
// (tests/translation-summary.test.mts). Tanpa AI. Setiap angka disertai RUMUS dan DATA YANG DIKECUALIKAN, dan seluruh
// ringkasan berlabel "ringkasan untuk ditinjau": hanya gambaran dari data proyek, bukan penilaian mutu terjemahan.

export const SUMMARY_LABEL = "Ringkasan untuk ditinjau";
export const SUMMARY_DISCLAIMER =
  "Dihitung otomatis dari data proyekmu. Angka ini hanya gambaran untuk kamu tinjau, bukan penilaian mutu terjemahan, dan tidak menggantikan membaca terjemahannya.";

export interface SummarySegment {
  idx: number;
  source: string;
  target: string | null;
  status: "draft" | "done" | string;
}

export interface SummaryWarning {
  idx: number;
  type: string;
}

export interface SummaryAssessmentRow {
  idx: number;
  accuracy: number;
  acceptability: number;
  readability: number;
}

export interface SummaryMetric {
  id: string;
  label: string;
  /** Nilai siap tampil (sudah berformat Indonesia). */
  value: string;
  /** Rumus dalam bahasa sehari-hari. */
  formula: string;
  /** Data yang tidak ikut dihitung dan alasannya; null bila semuanya dihitung. */
  excluded: string | null;
}

export interface ProjectSummary {
  label: string;
  disclaimer: string;
  metrics: SummaryMetric[];
}

/** Jumlah kata: dipisah spasi; token tanpa huruf atau angka (mis. "—") tidak dihitung. */
export function countWords(text: string | null | undefined): number {
  if (!text) return 0;
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

/** Angka berformat Indonesia (koma desimal). Bukan angka → "-". */
export function fmt(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return "-";
  return n.toFixed(digits).replace(".", ",");
}

function listIdx(idxs: number[], max = 8): string {
  const nums = idxs.map((i) => i + 1);
  return nums.length <= max ? nums.join(", ") : `${nums.slice(0, max).join(", ")}, dan ${nums.length - max} lainnya`;
}

const ASSESS_WEIGHTS = { accuracy: 3, acceptability: 2, readability: 1 } as const;
const clamp13 = (n: number) => Math.min(3, Math.max(1, Number.isFinite(n) ? n : 1));

/**
 * Susun ringkasan proyek. `assessment` boleh null (belum dinilai). Segmen "terjemahan kosong" (kosong atau hanya spasi)
 * dikecualikan dari semua angka yang membandingkan sumber dengan terjemahan.
 */
export function summarizeProject(input: {
  segments: SummarySegment[];
  warnings: SummaryWarning[];
  assessment: SummaryAssessmentRow[] | null;
  annotatedSegmentCount?: number;
}): ProjectSummary {
  const { segments, warnings, assessment } = input;
  const total = segments.length;
  const metrics: SummaryMetric[] = [];

  const hasTarget = (s: SummarySegment) => (s.target ?? "").trim().length > 0;
  const withTarget = segments.filter(hasTarget);
  const emptyTarget = segments.filter((s) => !hasTarget(s));
  const emptyNote = emptyTarget.length > 0 ? `${emptyTarget.length} segmen dengan terjemahan kosong (nomor ${listIdx(emptyTarget.map((s) => s.idx))}) tidak dihitung.` : null;

  // 1. Kemajuan
  const done = segments.filter((s) => s.status === "done").length;
  metrics.push({
    id: "progress",
    label: "Kemajuan",
    value: total === 0 ? "belum ada segmen" : `${done} dari ${total} segmen selesai (${fmt((done / total) * 100)}%)`,
    formula: "segmen berstatus selesai ÷ semua segmen × 100%",
    excluded: null,
  });

  // 2. Kata sumber
  const sourceWords = segments.reduce((n, s) => n + countWords(s.source), 0);
  metrics.push({
    id: "source-words",
    label: "Kata sumber",
    value: `${sourceWords} kata`,
    formula: "jumlah kata sumber di semua segmen",
    excluded: null,
  });

  // 3. Kata terjemahan
  const targetWords = withTarget.reduce((n, s) => n + countWords(s.target), 0);
  metrics.push({
    id: "target-words",
    label: "Kata terjemahan",
    value: `${targetWords} kata`,
    formula: "jumlah kata terjemahan di segmen yang sudah punya terjemahan",
    excluded: emptyNote,
  });

  // 4. Rasio panjang (hanya segmen bertarget; sumber dan terjemahan dari segmen yang sama)
  const pairedSource = withTarget.reduce((n, s) => n + countWords(s.source), 0);
  metrics.push({
    id: "length-ratio",
    label: "Rasio panjang terjemahan terhadap sumber",
    value: pairedSource === 0 ? "-" : fmt(targetWords / pairedSource, 2),
    formula: "kata terjemahan ÷ kata sumber, dihitung hanya pada segmen yang sudah diterjemahkan. Angka di atas 1 berarti terjemahan lebih panjang. Panjang dua bahasa memang berbeda, jadi ini bukan ukuran mutu",
    excluded: emptyNote,
  });

  // 5. Panjang rata-rata segmen sumber
  let avg = "-";
  let longest = "";
  if (total > 0) {
    avg = `${fmt(sourceWords / total)} kata per segmen`;
    const lg = segments.reduce((a, b) => (countWords(b.source) > countWords(a.source) ? b : a), segments[0]);
    longest = `; terpanjang segmen ${lg.idx + 1} (${countWords(lg.source)} kata)`;
  }
  metrics.push({
    id: "segment-length",
    label: "Panjang rata-rata segmen sumber",
    value: `${avg}${longest}`,
    formula: "kata sumber ÷ jumlah segmen",
    excluded: null,
  });

  // 6. Peringatan pemeriksaan otomatis
  const byType = new Map<string, number>();
  for (const w of warnings) byType.set(w.type, (byType.get(w.type) ?? 0) + 1);
  const TYPE_LABEL: Record<string, string> = { empty: "kosong", numbers: "angka", glossary: "glosarium", inconsistent: "konsistensi" };
  const parts = [...byType.entries()].map(([k, v]) => `${TYPE_LABEL[k] ?? k} ${v}`);
  metrics.push({
    id: "qa-warnings",
    label: "Peringatan pemeriksaan otomatis",
    value: warnings.length === 0 ? "tidak ada peringatan" : `${warnings.length} peringatan (${parts.join(", ")})`,
    formula: "jumlah peringatan dari pemeriksaan otomatis: segmen selesai tapi kosong, angka berbeda, istilah glosarium, dan sumber sama diterjemahkan berbeda",
    excluded: "Peringatan segmen kosong hanya dibuat untuk segmen berstatus selesai; segmen draft yang kosong tidak diperingatkan.",
  });

  // 7. Segmen beranotasi teknik (opsional)
  if (typeof input.annotatedSegmentCount === "number") {
    metrics.push({
      id: "annotated",
      label: "Segmen dengan anotasi teknik",
      value: total === 0 ? "-" : `${input.annotatedSegmentCount} dari ${total} segmen (${fmt((input.annotatedSegmentCount / total) * 100)}%)`,
      formula: "segmen yang punya minimal satu anotasi teknik ÷ semua segmen × 100%",
      excluded: null,
    });
  }

  // 8. Penilaian rubrik
  if (assessment && assessment.length > 0) {
    const rows = assessment;
    const mean = (pick: (r: SummaryAssessmentRow) => number) => rows.reduce((n, r) => n + clamp13(pick(r)), 0) / rows.length;
    const acc = mean((r) => r.accuracy);
    const acp = mean((r) => r.acceptability);
    const rea = mean((r) => r.readability);
    const wsum = ASSESS_WEIGHTS.accuracy + ASSESS_WEIGHTS.acceptability + ASSESS_WEIGHTS.readability;
    const perSegment = rows.map((r) => (clamp13(r.accuracy) * ASSESS_WEIGHTS.accuracy + clamp13(r.acceptability) * ASSESS_WEIGHTS.acceptability + clamp13(r.readability) * ASSESS_WEIGHTS.readability) / wsum);
    const overall = perSegment.reduce((a, b) => a + b, 0) / perSegment.length;
    const assessedIdx = new Set(rows.map((r) => r.idx));
    const notAssessed = withTarget.filter((s) => !assessedIdx.has(s.idx));
    metrics.push({
      id: "rubric",
      label: "Rata-rata rubrik (skala 1 sampai 3)",
      value: `akurasi ${fmt(acc, 2)}, keberterimaan ${fmt(acp, 2)}, keterbacaan ${fmt(rea, 2)}; skor tertimbang ${fmt(overall, 2)}`,
      formula: "rata-rata nilai tiap kriteria pada segmen yang dinilai; skor tertimbang = rata-rata dari (3 × akurasi + 2 × keberterimaan + 1 × keterbacaan) ÷ 6 per segmen. Penilaian terakhir dibuat AI untuk belajar mandiri",
      excluded: notAssessed.length > 0 ? `${notAssessed.length} segmen bertarget tidak ada dalam penilaian terakhir (nomor ${listIdx(notAssessed.map((s) => s.idx))}) dan tidak dihitung.` : null,
    });
  } else {
    metrics.push({
      id: "rubric",
      label: "Rata-rata rubrik (skala 1 sampai 3)",
      value: "belum dinilai",
      formula: "tersedia setelah proyek dinilai dengan rubrik",
      excluded: null,
    });
  }

  return { label: SUMMARY_LABEL, disclaimer: SUMMARY_DISCLAIMER, metrics };
}

/** Teks polos ringkasan, untuk disalin; label dan keterangan "untuk ditinjau" selalu ikut. */
export function summaryToText(title: string, s: ProjectSummary): string {
  const lines = [`${s.label}: ${title}`, s.disclaimer, ""];
  for (const m of s.metrics) {
    lines.push(`${m.label}: ${m.value}`);
    lines.push(`  Rumus: ${m.formula}`);
    if (m.excluded) lines.push(`  Dikecualikan: ${m.excluded}`);
  }
  return lines.join("\n");
}
