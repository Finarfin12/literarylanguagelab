// Uji unit lib/reader/syntax-align.ts (teks asli selalu utuh walau AI menghilangkan kata). Jalankan:
//   node --experimental-transform-types --no-warnings tests/syntax-align.test.mts <path-repo>
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = path.resolve(process.argv[2] ?? ".");
const m = await import(pathToFileURL(path.join(repo, "lib/reader/syntax-align.ts")).href);

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}
const join = (t: { word: string }[]) => t.map((x) => x.word).join("");

const ORIG = "It was not that he felt any emotion akin to love. All emotions were abhorrent to his mind.";

test("token lengkap: gabungan = teks asli dan peran terpasang", () => {
  const r = m.alignTokens("The fox jumps over the dog.", [
    { word: "The fox ", role: "Subject" },
    { word: "jumps over ", role: "Verb" },
    { word: "the dog.", role: "Object" },
  ]);
  assert.equal(join(r), "The fox jumps over the dog.");
  assert.deepEqual(r.map((x: { role: string }) => x.role), ["Subject", "Other", "Verb", "Other", "Object"]);
});

test("AI menghilangkan kata: teks asli tetap utuh (tidak 'loncat')", () => {
  const r = m.alignTokens(ORIG, [
    { word: "It", role: "Subject" },
    { word: "was", role: "Verb" },
    { word: "All emotions,", role: "Subject" }, // kalimat 'that he felt ... love.' dilewati model
    { word: "were", role: "Verb" },
  ]);
  assert.equal(join(r), ORIG);
  assert.ok(join(r).includes("that he felt any emotion akin to love."));
});

test("kata yang tidak ada di teks diabaikan tanpa merusak urutan", () => {
  const r = m.alignTokens("She walked home.", [
    { word: "She", role: "Subject" },
    { word: "ran", role: "Verb" },
    { word: "home.", role: "Object" },
  ]);
  assert.equal(join(r), "She walked home.");
  assert.equal(r.filter((x: { role: string }) => x.role === "Object").length, 1);
});

test("spasi berbeda (baris baru, spasi ganda) tetap cocok", () => {
  const orig = "Line one\nline  two.";
  const r = m.alignTokens(orig, [{ word: "Line one line two.", role: "Subject" }]);
  assert.equal(join(r), orig);
  assert.equal(r[0].role, "Subject");
});

test("karakter regex di token aman", () => {
  const orig = "Cost (approx.) is $5.00? Yes.";
  const r = m.alignTokens(orig, [{ word: "(approx.)", role: "Other" }, { word: "$5.00?", role: "Object" }]);
  assert.equal(join(r), orig);
});

test("peran tak dikenal → Other; token bukan string/kosong dilewati", () => {
  const r = m.alignTokens("Hello world", [{ word: "Hello", role: "Aneh" }, { word: 5 }, { word: "  " }, { word: "world", role: "Object" }]);
  assert.equal(join(r), "Hello world");
  assert.equal(r[0].role, "Other");
});

test("tanpa token → seluruh teks sebagai satu bagian Other", () => {
  assert.deepEqual(m.alignTokens("Just text.", []), [{ word: "Just text.", role: "Other" }]);
  assert.deepEqual(m.alignTokens("", []), []);
});

test("urutan: token tidak mundur ke kemunculan sebelumnya", () => {
  const r = m.alignTokens("the cat saw the dog", [{ word: "the", role: "Other" }, { word: "cat", role: "Subject" }, { word: "the dog", role: "Object" }]);
  assert.equal(join(r), "the cat saw the dog");
  const obj = r.find((x: { role: string }) => x.role === "Object");
  assert.equal(obj.word, "the dog");
});

test("batas kata: 'is' tidak cocok di dalam 'this'", () => {
  const r = m.alignTokens("this is it", [{ word: "is", role: "Verb" }]);
  assert.equal(join(r), "this is it");
  assert.equal(r.find((x: { role: string }) => x.role === "Verb").word, "is");
  assert.equal(r[0].word, "this ");
});

console.log(`\n${passed} lulus, 0 gagal`);
