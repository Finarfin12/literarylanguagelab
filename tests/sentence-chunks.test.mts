// Uji unit lib/reader/sentence-chunks.ts (Bedah Sintaksis per 2 kalimat). Jalankan:
//   node --experimental-transform-types --no-warnings tests/sentence-chunks.test.mts <path-repo>
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = path.resolve(process.argv[2] ?? ".");
const m = await import(pathToFileURL(path.join(repo, "lib/reader/sentence-chunks.ts")).href);

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

const P = "It is a truth. Mr. Darcy walked in! Did she know? Yes, she did.   The end";

test("menggabungkan potongan = teks asli (spasi dipertahankan)", () => {
  assert.equal(m.chunkText(P).join(""), P);
  const multiline = "Line one.\nLine two! And three?\n\nFour.";
  assert.equal(m.chunkText(multiline).join(""), multiline);
});

test("maksimal 2 kalimat per potongan", () => {
  const chunks: string[] = m.chunkText("A b. C d. E f. G h. I j.");
  assert.deepEqual(chunks, ["A b. C d. ", "E f. G h. ", "I j."]);
});

test("paragraf pendek tetap satu potongan; kosong → tidak ada potongan", () => {
  assert.deepEqual(m.chunkText("Hello there."), ["Hello there."]);
  assert.deepEqual(m.chunkText(""), []);
});

test("teks tanpa tanda akhir kalimat tetap diproses", () => {
  assert.deepEqual(m.chunkText("no punctuation here at all"), ["no punctuation here at all"]);
});

test("kutipan & kurung penutup ikut kalimatnya", () => {
  const t = 'He said "Go home." She left. (It rained.) End.';
  assert.equal(m.chunkText(t).join(""), t);
  assert.ok(m.splitSentences(t)[0].endsWith('home." '));
});

test("kalimat sangat panjang dipotong per batas kata", () => {
  const long = Array.from({ length: 120 }, (_, i) => `w${i}`).join(" ") + ".";
  const chunks: string[] = m.chunkText(long);
  assert.ok(chunks.length >= 3);
  for (const c of chunks) assert.ok(c.trim().split(/\s+/).length <= m.MAX_WORDS_PER_CHUNK);
  assert.equal(chunks.join(""), long);
});

test("potongan tidak melebihi batas kata walau hanya 2 kalimat", () => {
  const s = (n: number) => Array.from({ length: n }, (_, i) => `x${i}`).join(" ") + ". ";
  const chunks: string[] = m.chunkText(s(30) + s(30) + s(5));
  assert.equal(chunks.length, 2); // 30 | 30+5 (30+30 > 45 kata)
  assert.equal(chunks.join(""), s(30) + s(30) + s(5));
});

test("paragraf buku panjang: jumlah potongan masuk akal dan teks utuh", () => {
  const sentence = "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife. ";
  const text = sentence.repeat(10).trim();
  const chunks: string[] = m.chunkText(text);
  assert.equal(chunks.join(""), text);
  assert.ok(chunks.length >= 5 && chunks.length <= 10);
});

console.log(`\n${passed} lulus, 0 gagal`);
