// Uji unit lib/translation/summary.ts dan pemasangan kartu ringkasan (Fase 29, item 2). Jalankan:
//   node --experimental-transform-types --no-warnings tests/translation-summary.test.mts <path-repo>
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = path.resolve(process.argv[2] ?? ".");
const load = (f: string) => import(pathToFileURL(path.join(repo, f)).href);
const s = await load("lib/translation/summary.ts");
const read = (p: string) => fs.readFileSync(path.join(repo, p), "utf8");

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

const segments = [
  { idx: 0, source: "The cat sat on the mat.", target: "Kucing itu duduk di atas tikar.", status: "done" },
  { idx: 1, source: "It was 1,000 days.", target: "Itu 1.000 hari.", status: "draft" },
  { idx: 2, source: "Hello there.", target: null, status: "draft" },
  { idx: 3, source: "Good morning, everyone.", target: "   ", status: "done" },
];
type Metric = { id: string; value: string; formula: string; excluded: string | null };
const metric = (sum: { metrics: Metric[] }, id: string) => sum.metrics.find((m) => m.id === id) as Metric;

test("countWords dan fmt: pemisah, token tanpa huruf, dan koma desimal", () => {
  assert.equal(s.countWords("a — b"), 2);
  assert.equal(s.countWords(""), 0);
  assert.equal(s.countWords(null), 0);
  assert.equal(s.countWords("  satu   dua\ntiga "), 3);
  assert.equal(s.fmt(2.25, 2), "2,25");
  assert.equal(s.fmt(50, 1), "50,0");
  assert.equal(s.fmt(NaN), "-");
});

test("ringkasan: kemajuan, kata sumber, kata terjemahan, dan rasio dari segmen bertarget saja", () => {
  const sum = s.summarizeProject({ segments, warnings: [], assessment: null });
  assert.equal(metric(sum, "progress").value, "2 dari 4 segmen selesai (50,0%)");
  assert.equal(metric(sum, "source-words").value, "15 kata");
  assert.equal(metric(sum, "target-words").value, "9 kata");
  // rasio: 9 kata terjemahan ÷ 10 kata sumber dari segmen 1 dan 2 saja (bukan 15)
  assert.equal(metric(sum, "length-ratio").value, "0,90");
});

test("data yang dikecualikan disebut dengan nomor segmen (kosong dan hanya spasi)", () => {
  const sum = s.summarizeProject({ segments, warnings: [], assessment: null });
  assert.match(metric(sum, "target-words").excluded as string, /2 segmen dengan terjemahan kosong \(nomor 3, 4\)/);
  assert.equal(metric(sum, "length-ratio").excluded, metric(sum, "target-words").excluded);
  assert.equal(metric(sum, "source-words").excluded, null);
  const none = s.summarizeProject({ segments: [segments[0]], warnings: [], assessment: null });
  assert.equal(metric(none, "target-words").excluded, null);
});

test("setiap metrik punya rumus; label 'untuk ditinjau' dan penafian ada", () => {
  const sum = s.summarizeProject({ segments, warnings: [], assessment: null });
  assert.equal(sum.label, "Ringkasan untuk ditinjau");
  assert.match(sum.disclaimer, /bukan penilaian mutu/);
  for (const m of sum.metrics) assert.ok(m.formula.length > 10, m.id);
});

test("panjang rata-rata dan segmen terpanjang", () => {
  const sum = s.summarizeProject({ segments, warnings: [], assessment: null });
  assert.equal(metric(sum, "segment-length").value, "3,8 kata per segmen; terpanjang segmen 1 (6 kata)");
});

test("peringatan pemeriksaan otomatis dikelompokkan per jenis", () => {
  const sum = s.summarizeProject({ segments, warnings: [{ idx: 3, type: "empty" }, { idx: 1, type: "numbers" }], assessment: null });
  assert.equal(metric(sum, "qa-warnings").value, "2 peringatan (kosong 1, angka 1)");
  const none = s.summarizeProject({ segments, warnings: [], assessment: null });
  assert.equal(metric(none, "qa-warnings").value, "tidak ada peringatan");
});

test("rubrik: rata-rata per kriteria, skor tertimbang 3:2:1, dan segmen yang tidak dinilai dikecualikan", () => {
  const rows = [
    { idx: 0, accuracy: 3, acceptability: 2, readability: 3 },
    { idx: 1, accuracy: 2, acceptability: 2, readability: 1 },
  ];
  const sum = s.summarizeProject({ segments, warnings: [], assessment: rows });
  assert.equal(metric(sum, "rubric").value, "akurasi 2,50, keberterimaan 2,00, keterbacaan 2,00; skor tertimbang 2,25");
  assert.equal(metric(sum, "rubric").excluded, null);
  const partial = s.summarizeProject({ segments, warnings: [], assessment: [rows[0]] });
  assert.match(metric(partial, "rubric").excluded as string, /1 segmen bertarget tidak ada dalam penilaian terakhir \(nomor 2\)/);
  const clamped = s.summarizeProject({ segments, warnings: [], assessment: [{ idx: 0, accuracy: 9, acceptability: -1, readability: NaN }] });
  assert.match(metric(clamped, "rubric").value, /akurasi 3,00, keberterimaan 1,00, keterbacaan 1,00/);
  assert.equal(metric(s.summarizeProject({ segments, warnings: [], assessment: null }), "rubric").value, "belum dinilai");
  assert.equal(metric(s.summarizeProject({ segments, warnings: [], assessment: [] }), "rubric").value, "belum dinilai");
});

test("anotasi teknik hanya muncul bila jumlahnya diberikan", () => {
  assert.ok(!s.summarizeProject({ segments, warnings: [], assessment: null }).metrics.some((m: { id: string }) => m.id === "annotated"));
  const sum = s.summarizeProject({ segments, warnings: [], assessment: null, annotatedSegmentCount: 1 });
  assert.equal(metric(sum, "annotated").value, "1 dari 4 segmen (25,0%)");
});

test("proyek kosong tidak membagi dengan nol", () => {
  const sum = s.summarizeProject({ segments: [], warnings: [], assessment: null });
  assert.equal(metric(sum, "progress").value, "belum ada segmen");
  assert.equal(metric(sum, "length-ratio").value, "-");
  assert.equal(metric(sum, "segment-length").value, "-");
});

test("summaryToText memuat label, penafian, rumus, dan data yang dikecualikan", () => {
  const text = s.summaryToText("Proyek Uji", s.summarizeProject({ segments, warnings: [], assessment: null }));
  assert.match(text, /^Ringkasan untuk ditinjau: Proyek Uji/);
  assert.match(text, /bukan penilaian mutu/);
  assert.match(text, /Rumus: /);
  assert.match(text, /Dikecualikan: 2 segmen dengan terjemahan kosong/);
});

test("kartu ringkasan terpasang di editor, tanpa AI dan tanpa jaringan", () => {
  const card = read("app/(dashboard)/translation-workspace/[id]/ProjectSummaryCard.tsx");
  assert.ok(/SUMMARY_LABEL|summary\.label/.test(card));
  assert.ok(!/fetch\(|runAI|\/api\//.test(card));
  const editor = read("app/(dashboard)/translation-workspace/[id]/WorkspaceEditor.tsx");
  assert.ok(/ProjectSummaryCard/.test(editor));
});

console.log(`\n${passed} lulus, 0 gagal`);
