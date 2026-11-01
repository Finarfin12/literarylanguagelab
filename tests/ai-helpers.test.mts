// Uji unit lib/ai/json.ts, lib/tone.ts, lib/wotd.ts (Fase 14f). Jalankan:
//   node --experimental-transform-types --no-warnings tests/ai-helpers.test.mts <path-repo>
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = path.resolve(process.argv[2] ?? ".");
const load = (f: string) => import(pathToFileURL(path.join(repo, f)).href);
const j = await load("lib/ai/json.ts");
const t = await load("lib/tone.ts");
const w = await load("lib/wotd.ts");

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

test("extractJsonObject: JSON polos, pagar kode, dan kalimat pengantar", () => {
  assert.deepEqual(j.extractJsonObject('{"a":1}'), { a: 1 });
  assert.deepEqual(j.extractJsonObject('```json\n{"a":1}\n```'), { a: 1 });
  assert.deepEqual(j.extractJsonObject('Berikut hasilnya:\n```\n{"a":{"b":2}}\n```\nSemoga membantu'), { a: { b: 2 } });
});

test("extractJsonObject: sampah/kosong/terpotong → null", () => {
  assert.equal(j.extractJsonObject(""), null);
  assert.equal(j.extractJsonObject(null), null);
  assert.equal(j.extractJsonObject("tidak ada json"), null);
  assert.equal(j.extractJsonObject('{"a":1,'), null);
});

test("sanitizeToneResult: nilai sah dan rapi", () => {
  const r = t.sanitizeToneResult({ tone: "Sarcastic", confidence: 87.6, markers: ["so very", " ", 5], preservation_tips: " tips ", better_translation: "x" });
  assert.equal(r.tone, "sarcastic");
  assert.equal(r.confidence, 88);
  assert.deepEqual(r.markers, ["so very"]);
  assert.equal(r.preservation_tips, "tips");
});

test("sanitizeToneResult: confidence dijepit 0–100; non-angka → 0", () => {
  assert.equal(t.sanitizeToneResult({ tone: "formal", confidence: 250 }).confidence, 100);
  assert.equal(t.sanitizeToneResult({ tone: "formal", confidence: -5 }).confidence, 0);
  assert.equal(t.sanitizeToneResult({ tone: "formal", confidence: "abc" }).confidence, 0);
  assert.equal(t.sanitizeToneResult({ tone: "formal", confidence: "70" }).confidence, 70);
});

test("sanitizeToneResult: nada tak dikenal / bukan objek → null", () => {
  assert.equal(t.sanitizeToneResult({ tone: "angry" }), null);
  assert.equal(t.sanitizeToneResult(null), null);
  assert.equal(t.sanitizeToneResult("x"), null);
  assert.equal(t.MAX_TONE_TEXT, 1000);
  assert.equal(t.MAX_TONE_CONTEXT, 2000);
});

test("pickWordOfTheDay: deterministik per pengguna per hari", () => {
  const words = ["apple", "banana", "cherry", "date", "elder", "fig"].map((x) => ({ word: x }));
  const a = w.pickWordOfTheDay(words, "user-1", "2026-11-01");
  const b = w.pickWordOfTheDay([...words].reverse(), "user-1", "2026-11-01");
  assert.equal(a.word, b.word, "urutan input tidak memengaruhi hasil");
  assert.equal(w.pickWordOfTheDay(words, "user-1", "2026-11-01").word, a.word);
});

test("pickWordOfTheDay: berganti antar hari dan antar pengguna", () => {
  const words = Array.from({ length: 50 }, (_, i) => ({ word: `w${i}` }));
  const days = new Set<string>();
  for (let d = 1; d <= 20; d++) days.add(w.pickWordOfTheDay(words, "u", `2026-11-${String(d).padStart(2, "0")}`).word);
  assert.ok(days.size >= 10, `hanya ${days.size} kata berbeda dalam 20 hari`);
  const users = new Set<string>();
  for (let u = 0; u < 20; u++) users.add(w.pickWordOfTheDay(words, `user-${u}`, "2026-11-01").word);
  assert.ok(users.size >= 8);
});

test("pickWordOfTheDay: kosong/tanpa kata → null", () => {
  assert.equal(w.pickWordOfTheDay([], "u", "d"), null);
  assert.equal(w.pickWordOfTheDay([{ word: "  " }], "u", "d"), null);
  assert.ok(w.FALLBACK_WORDS.length >= 5);
});

const goodLesson = { lesson: "Arti ...", collocations: ["a", "b", "c", "d"], quiz: { question: "Q?", options: ["A", "B", "C", "D"], answer: 2 } };

test("validateWotd: respons sah; kolokasi dipotong 3", () => {
  const r = w.validateWotd(goodLesson, "luminous");
  assert.equal(r.word, "luminous");
  assert.equal(r.collocations.length, 3);
  assert.equal(r.quiz.answer, 2);
});

test("validateWotd: opsi < 2 atau > 4, jawaban di luar rentang → null", () => {
  assert.equal(w.validateWotd({ ...goodLesson, quiz: { question: "Q", options: ["A"], answer: 0 } }, "x"), null);
  assert.equal(w.validateWotd({ ...goodLesson, quiz: { question: "Q", options: ["A", "B", "C", "D", "E"], answer: 0 } }, "x"), null);
  assert.equal(w.validateWotd({ ...goodLesson, quiz: { question: "Q", options: ["A", "B"], answer: 2 } }, "x"), null);
  assert.equal(w.validateWotd({ ...goodLesson, quiz: { question: "Q", options: ["A", "B"], answer: -1 } }, "x"), null);
  assert.equal(w.validateWotd({ ...goodLesson, quiz: { question: "Q", options: ["A", "B"], answer: 0.5 } }, "x"), null);
});

test("validateWotd: pelajaran/kuis kosong atau bentuk salah → null; jawaban string angka diterima", () => {
  assert.equal(w.validateWotd({ ...goodLesson, lesson: " " }, "x"), null);
  assert.equal(w.validateWotd({ lesson: "x" }, "x"), null);
  assert.equal(w.validateWotd(null, "x"), null);
  assert.equal(w.validateWotd({ ...goodLesson, quiz: { question: "Q", options: ["A", "B"], answer: "1" } }, "x").quiz.answer, 1);
});

test("hashString stabil", () => {
  assert.equal(w.hashString("abc"), w.hashString("abc"));
  assert.notEqual(w.hashString("abc"), w.hashString("abd"));
});

console.log(`\n${passed} lulus, 0 gagal`);
