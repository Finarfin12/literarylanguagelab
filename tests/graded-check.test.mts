// Uji unit lib/graded-check.ts (Fase 18.6). Jalankan:
//   node --experimental-transform-types --no-warnings tests/graded-check.test.mts <path-repo>
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = path.resolve(process.argv[2] ?? ".");
const m = await import(pathToFileURL(path.join(repo, "lib/graded-check.ts")).href);

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

const core = [
  { word: "i", band: 10 }, { word: "be", band: 2, forms: ["am", "is", "are", "was", "were", "been"] },
  { word: "a", band: 5 }, { word: "go", band: 40, forms: ["goes", "went", "going", "gone"] },
  { word: "to", band: 4 }, { word: "school", band: 300, forms: ["schools"] },
  { word: "do", band: 20 }, { word: "not", band: 30 }, { word: "like", band: 60 },
  { word: "she", band: 12 }, { word: "he", band: 11 },
  { word: "student", band: 900 }, // di luar batas A1 (500) tetapi dalam A2 (1000)
  { word: "rare", band: 2500 },
];

test("countWords: hanya potongan yang memuat huruf/angka", () => {
  assert.equal(m.countWords("I go to school."), 4);
  assert.equal(m.countWords("  one   two\n\nthree — four "), 4);
  assert.equal(m.countWords(""), 0);
  assert.equal(m.countWords("— ... !!"), 0);
});

test("rentang kata per level: A1 80–120, A2 120–180, B1 tanpa batas", () => {
  const words = (n: number) => Array.from({ length: n }, () => "go").join(" ");
  assert.equal(m.checkGradedText(words(100), "A1", core).inRange, true);
  assert.equal(m.checkGradedText(words(79), "A1", core).inRange, false);
  assert.equal(m.checkGradedText(words(121), "A1", core).inRange, false);
  assert.equal(m.checkGradedText(words(150), "A2", core).inRange, true);
  assert.equal(m.checkGradedText(words(119), "A2", core).inRange, false);
  assert.equal(m.checkGradedText(words(500), "B1", core).inRange, null);
  assert.equal(m.checkGradedText(words(500), "B1", core).range, null);
  assert.equal(m.checkGradedText("go", "ZZ", core).target, null);
});

test("cakupan: kata dikenali lewat word atau forms; batas band per level", () => {
  const c = m.checkGradedText("She goes to school. I went to school.", "A1", core);
  assert.equal(c.counted, 8);
  assert.equal(c.coveragePct, 100);
  assert.equal(c.meetsTarget, true);
  const s1 = m.checkGradedText("She is a student.", "A1", core); // student band 900 > 500
  assert.equal(s1.coveragePct, 75);
  assert.deepEqual(s1.offListSample, ["student"]);
  assert.equal(s1.meetsTarget, false);
  const s2 = m.checkGradedText("She is a student.", "A2", core);
  assert.equal(s2.coveragePct, 100);
  assert.equal(m.checkGradedText("She is a rare student.", "A2", core).offListCount, 1);
});

test("nama diri dan angka tidak dihitung", () => {
  const c = m.checkGradedText("I go to Bandung with Ana. Ana likes 3 schools. We go to Medan.", "A1", core);
  const off = c.offListSample;
  assert.ok(!off.includes("bandung") && !off.includes("ana") && !off.includes("medan"), off.join());
  assert.ok(!c.offListSample.includes("3"));
});

test("angka dengan akhiran huruf (10th, 2nd) tidak dihitung sebagai kata", () => {
  const c = m.checkGradedText("I go to school 10th school 2nd school.", "A1", core);
  assert.equal(c.offListCount, 0, c.offListSample.join());
  assert.ok(!c.offListSample.includes("th") && !c.offListSample.includes("nd"));
});

test("nama di awal kalimat dikenali bila muncul juga di tengah kalimat", () => {
  const c = m.checkGradedText("Ana is a student. I like Ana.", "A2", core);
  assert.ok(!c.offListSample.includes("ana"));
  const d = m.checkGradedText("Quickly I go.", "A1", core); // awal kalimat, bukan nama, tidak di daftar
  assert.deepEqual(d.offListSample, ["quickly"]);
});

test("kontraksi: don't, she's, I'm, can't dikembalikan ke kata dasar; apostrof miring sama", () => {
  const c = m.checkGradedText("I don’t like school. She's a student. I'm not.", "A2", core);
  assert.equal(c.offListCount, 0, c.offListSample.join());
});

test("daftar kosong atau teks tanpa token: tanpa cakupan, jumlah kata tetap", () => {
  const c = m.checkGradedText("I go to school.", "A1", []);
  assert.equal(c.coveragePct, null);
  assert.equal(c.wordCount, 4);
  assert.equal(c.meetsTarget, null);
  assert.equal(m.checkGradedText("123 456", "A1", core).coveragePct, null);
});

test("contoh kata di luar daftar: unik dan maksimal 12", () => {
  const text = Array.from({ length: 20 }, (_, i) => `zork${String.fromCharCode(97 + i)}`).join(" ") + " zorka zorka";
  const c = m.checkGradedText(text, "A1", core);
  assert.equal(c.offListSample.length, 12);
  assert.equal(new Set(c.offListSample).size, 12);
});

test("summarizeCheck: ringkasan satu baris", () => {
  const words = (n: number) => Array.from({ length: n }, () => "go").join(" ");
  assert.equal(m.summarizeCheck(m.checkGradedText(words(100), "A1", core), "A1"), "100 kata ✓ · 100% Kosakata Inti A1 ✓");
  assert.match(m.summarizeCheck(m.checkGradedText("go", "A1", core), "A1"), /^1 kata \(di luar 80–120\)/);
  assert.equal(m.summarizeCheck(m.checkGradedText(words(100), "A1", []), "A1"), "100 kata ✓");
  assert.match(m.summarizeCheck(m.checkGradedText("She is a student.", "A1", core), "A1"), /di bawah target 90%/);
});

console.log(`\n${passed} lulus, 0 gagal`);
