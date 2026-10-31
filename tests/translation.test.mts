// Uji unit lib/translation/*. Jalankan:
//   node --experimental-transform-types --no-warnings tests/translation.test.mts <path-repo>
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = path.resolve(process.argv[2] ?? ".");
const load = (f: string) => import(pathToFileURL(path.join(repo, f)).href);
const seg = await load("lib/translation/segment.ts");
const qa = await load("lib/translation/qa.ts");
const rubric = await load("lib/translation/rubric.ts");
const tm = await load("lib/translation/tm-match.ts");
const csv = await load("lib/translation/csv.ts");

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

type Warn = { idx: number; type: string; message: string };
type Seg = { idx: number; source: string; target: string | null; status: string };
const s = (idx: number, source: string, target: string | null, status = "draft"): Seg => ({ idx, source, target, status });

// ---------- segment ----------
test("splitSentences: kalimat biasa", () => {
  assert.deepEqual(seg.splitSentences("It was cold. She left! Why did she go? Nobody knew."), [
    "It was cold.",
    "She left!",
    "Why did she go?",
    "Nobody knew.",
  ]);
});

test("splitSentences: singkatan umum tidak memecah", () => {
  assert.deepEqual(seg.splitSentences("Mr. Darcy met Dr. Smith in London. They talked."), ["Mr. Darcy met Dr. Smith in London.", "They talked."]);
  assert.deepEqual(seg.splitSentences("Bring books, e.g. novels, to class. Please do."), ["Bring books, e.g. novels, to class.", "Please do."]);
  assert.deepEqual(seg.splitSentences("He said so, i.e. he agreed. Then he left."), ["He said so, i.e. he agreed.", "Then he left."]);
  assert.deepEqual(seg.splitSentences("Mrs. Bennet sighed. J. K. Rowling wrote it."), ["Mrs. Bennet sighed.", "J. K. Rowling wrote it."]);
});

test("splitSentences: angka desimal tidak memecah", () => {
  assert.deepEqual(seg.splitSentences("The price rose to 3.14 dollars. It fell later."), ["The price rose to 3.14 dollars.", "It fell later."]);
});

test("splitSentences: kutipan", () => {
  assert.deepEqual(seg.splitSentences('"I won!" she said. "Really?" he asked.'), ['"I won!" she said.', '"Really?" he asked.']);
  assert.deepEqual(seg.splitSentences('He said, "Go home." Then he left.'), ['He said, "Go home."', "Then he left."]);
});

test("splitSentences: paragraf memisahkan, baris baru tunggal digabung", () => {
  const text = "First line of a sentence\nthat wraps here. Second one.\n\nNew paragraph without a stop";
  assert.deepEqual(seg.splitSentences(text), ["First line of a sentence that wraps here.", "Second one.", "New paragraph without a stop"]);
});

test("splitSentences: kosong dan satu kalimat", () => {
  assert.deepEqual(seg.splitSentences(""), []);
  assert.deepEqual(seg.splitSentences("   \n\n  "), []);
  assert.deepEqual(seg.splitSentences("Only one"), ["Only one"]);
  assert.deepEqual(seg.splitSentences("Done.\r\nNext one."), ["Done. Next one."].flatMap((x) => seg.splitSentences(x)));
});

// ---------- qa ----------
test("qa: segmen kosong hanya diperingatkan jika selesai (atau opsi draft)", () => {
  const segs = [s(0, "Hello.", "", "done"), s(1, "World.", "", "draft")];
  assert.deepEqual(qa.runQaChecks(segs).map((w: Warn) => [w.idx, w.type]), [[0, "empty"]]);
  assert.equal(qa.runQaChecks(segs, [], { includeDraftEmpty: true }).length, 2);
});

test("qa: angka berbeda terdeteksi, format desimal/ribuan tidak dianggap beda", () => {
  assert.equal(qa.runQaChecks([s(0, "He paid 25 dollars.", "Dia membayar 52 dolar.")]).some((w: Warn) => w.type === "numbers"), true);
  assert.equal(qa.runQaChecks([s(0, "It cost 3.14.", "Harganya 3,14.")]).some((w: Warn) => w.type === "numbers"), false);
  assert.equal(qa.runQaChecks([s(0, "There are 1,000 men.", "Ada 1.000 pria.")]).some((w: Warn) => w.type === "numbers"), false);
  assert.equal(qa.runQaChecks([s(0, "Chapter 4 begins.", "Bab dimulai.")]).some((w: Warn) => w.type === "numbers"), true);
  assert.deepEqual(qa.extractNumbers("In 1999, 3.5 and 1,200"), ["1999", "35", "1200"]);
});

test("qa: istilah glosarium tidak dipakai", () => {
  const glossary = [{ term: "whale", preferred: "paus" }];
  const w = qa.runQaChecks([s(0, "The whale surfaced.", "Ikan besar itu muncul.")], glossary);
  assert.equal(w.some((x: Warn) => x.type === "glossary"), true);
  const ok = qa.runQaChecks([s(0, "The whale surfaced.", "Paus itu muncul.")], glossary);
  assert.equal(ok.some((x: Warn) => x.type === "glossary"), false);
  // kata utuh: "whales" bukan "whale"; istilah tidak ada di sumber tidak diperiksa
  assert.equal(qa.runQaChecks([s(0, "Whaleboats came.", "Perahu datang.")], glossary).length, 0);
});

test("qa: sumber identik dengan terjemahan berbeda", () => {
  const segs = [s(0, "Good night.", "Selamat malam."), s(1, "Another line.", "Baris lain."), s(2, "good  night.", "Malam yang baik.")];
  const w = qa.runQaChecks(segs);
  assert.deepEqual(w.filter((x: Warn) => x.type === "inconsistent").map((x: Warn) => x.idx), [0, 2]);
  const same = qa.runQaChecks([s(0, "Good night.", "Selamat malam."), s(1, "Good night.", "selamat  malam.")]);
  assert.equal(same.some((x: Warn) => x.type === "inconsistent"), false);
});

test("qa: tanpa masalah → tidak ada peringatan", () => {
  assert.deepEqual(qa.runQaChecks([s(0, "She has 2 cats.", "Dia punya 2 kucing.", "done")]), []);
});

// ---------- rubric ----------
test("weightedScore: bobot 3:2:1", () => {
  assert.equal(rubric.weightedScore({ accuracy: 3, acceptability: 3, readability: 3 }), 3);
  assert.equal(rubric.weightedScore({ accuracy: 1, acceptability: 1, readability: 1 }), 1);
  assert.equal(rubric.weightedScore({ accuracy: 3, acceptability: 2, readability: 1 }), 2.33); // (9+4+1)/6
  assert.equal(rubric.weightedScore({ accuracy: 1, acceptability: 2, readability: 3 }), 1.67); // (3+4+3)/6
});

test("weightedScore: nilai di luar skala dibatasi 1-3", () => {
  assert.equal(rubric.weightedScore({ accuracy: 9, acceptability: 9, readability: 9 }), 3);
  assert.equal(rubric.weightedScore({ accuracy: 0, acceptability: -1, readability: 0 }), 1);
  assert.equal(rubric.weightedScore({ accuracy: Number.NaN, acceptability: 3, readability: 3 }), 2); // NaN dianggap 1: (3+6+3)/6
});

test("aggregateScore: rata-rata skor segmen", () => {
  assert.equal(rubric.aggregateScore([]), 0);
  assert.equal(rubric.aggregateScore([{ accuracy: 3, acceptability: 3, readability: 3 }, { accuracy: 1, acceptability: 1, readability: 1 }]), 2);
});

test("translatorStage: ambang 2,0 dan 2,5", () => {
  assert.equal(rubric.translatorStage([]), null);
  assert.equal(rubric.translatorStage([1.99]).stage, "Pemula");
  assert.equal(rubric.translatorStage([2.0]).stage, "Berkembang");
  assert.equal(rubric.translatorStage([2.5]).stage, "Berkembang");
  assert.equal(rubric.translatorStage([2.51]).stage, "Mahir");
});

test("translatorStage: hanya 5 terakhir (terbaru dulu) yang dihitung", () => {
  const r = rubric.translatorStage([3, 3, 3, 3, 3, 1, 1, 1]);
  assert.equal(r.count, 5);
  assert.equal(r.average, 3);
  assert.equal(r.stage, "Mahir");
  assert.equal(rubric.translatorStage([2.0, Number.NaN, 2.0]).count, 2);
});

// ---------- tm-match ----------
test("similarity: identik, beda huruf besar/tanda baca, dan berbeda total", () => {
  assert.equal(tm.similarity("The old man", "the old man!"), 1);
  assert.equal(tm.similarity("alpha beta", "gamma delta"), 0);
  assert.equal(tm.similarity("", "x"), 0);
});

test("matchTm: ambang 70% dan urutan", () => {
  const memory = [
    { source: "The old man and the sea", target: "Lelaki tua dan laut" },
    { source: "The old man and the river", target: "Lelaki tua dan sungai" },
    { source: "Completely unrelated sentence here", target: "Kalimat tak terkait" },
  ];
  const r = tm.matchTm("The old man and the sea", memory);
  assert.equal(r.length, 2);
  assert.equal(r[0].score, 1);
  assert.equal(r[0].target, "Lelaki tua dan laut");
  assert.ok(r[1].score >= 0.7 && r[1].score < 1);
  assert.equal(tm.matchTm("The old man and the sea", memory, 0.99).length, 1);
  assert.deepEqual(tm.matchTm("anything", []), []);
});

test("matchTm: duplikat dibuang dan dibatasi limit", () => {
  const dup = [{ source: "Hello there friend", target: "Halo sobat" }, { source: "Hello there friend", target: "Halo sobat" }];
  assert.equal(tm.matchTm("Hello there friend", dup).length, 1);
  const many = Array.from({ length: 10 }, (_, i) => ({ source: "Hello there friend", target: `T${i}` }));
  assert.equal(tm.matchTm("Hello there friend", many, 0.7, 3).length, 3);
});

// ---------- csv ----------
test("csv: kutip, koma, baris baru, dan injeksi rumus", () => {
  assert.equal(csv.csvCell("biasa"), "biasa");
  assert.equal(csv.csvCell("a,b"), '"a,b"');
  assert.equal(csv.csvCell('dia "bilang" ya'), '"dia ""bilang"" ya"');
  assert.equal(csv.csvCell("baris1\nbaris2"), '"baris1\nbaris2"');
  assert.equal(csv.csvCell('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"');
  assert.equal(csv.csvCell("+1"), "'+1");
  assert.equal(csv.csvCell("@a"), "'@a");
  assert.equal(csv.csvCell(null), "");
  assert.equal(csv.csvCell(12), "12");
  assert.equal(csv.csvCell("3-4"), "3-4"); // tanda hubung di tengah aman
});

test("csv: toCsv memakai BOM dan CRLF", () => {
  const out = csv.toCsv([["a", "b"], [1, "x,y"]]);
  assert.equal(out.charCodeAt(0), 0xfeff);
  assert.equal(out.slice(1), 'a,b\r\n1,"x,y"\r\n');
});

console.log(`\n${passed} lulus, 0 gagal`);
