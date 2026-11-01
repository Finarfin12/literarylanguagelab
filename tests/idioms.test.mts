// Uji unit lib/idioms (deteksi idiom tanpa AI, termasuk pola posesif). Jalankan:
//   node --experimental-transform-types --no-warnings tests/idioms.test.mts <path-repo>
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = path.resolve(process.argv[2] ?? ".");
const m = await import(pathToFileURL(path.join(repo, "lib/idioms/index.ts")).href);
const dbSource = fs.readFileSync(path.join(repo, "lib/idioms/db.ts"), "utf8");
// db.ts hanya data: ambil barisnya lewat regex agar tak perlu mengimpor ekstensi .ts
const SOURCES = [...dbSource.matchAll(/\{ phrase: "([^"]+)", meaning: "([^"]*)", indonesian: "([^"]*)" \}/g)].map((x) => ({
  phrase: x[1],
  meaning: x[2],
  indonesian: x[3],
}));
const C = m.compileIdioms(SOURCES);
const find = (text: string) => m.detectIdioms(text, C);

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

test("data: ±180 idiom, frasa unik", () => {
  assert.ok(SOURCES.length >= 170, `hanya ${SOURCES.length}`);
  assert.equal(new Set(SOURCES.map((s) => s.phrase.toLowerCase())).size, SOURCES.length);
});

test("setiap idiom di DB cocok dengan dirinya sendiri (someone's → John's, someone → her)", () => {
  const bad: string[] = [];
  for (const s of SOURCES) {
    const sample = s.phrase.replace(/someone's/gi, "John's").replace(/somebody's/gi, "John's").replace(/\bsomeone\b/gi, "her").replace(/\bsomebody\b/gi, "her");
    const r = find(`Then ${sample} again.`);
    if (!r.some((x: { phrase: string }) => x.phrase === s.phrase)) bad.push(s.phrase);
  }
  assert.deepEqual(bad, []);
});

test("posesif: pull someone's leg cocok dengan my/his/John's/somebody's", () => {
  for (const t of ["You are pulling my leg.", "Don't pull his leg", "He loves to pull John's leg.", "pull somebody's leg", "pull someone's leg"]) {
    const r = find(t);
    // "pulling" bukan "pull": hanya yang berbentuk dasar yang cocok
    if (t.includes("pulling")) assert.equal(r.length, 0, t);
    else assert.equal(r[0]?.phrase, "pull someone's leg", t);
  }
});

test("objek: cut someone some slack cocok dengan him/her/me", () => {
  assert.equal(find("Please cut him some slack.")[0].phrase, "cut someone some slack");
  assert.equal(find("cut me some slack")[0].phrase, "cut someone some slack");
});

test("apostrof lengkung (buku) dan lurus sama-sama cocok", () => {
  assert.equal(find("You can’t judge a book by its cover.")[0].phrase, "can't judge a book by its cover");
  assert.equal(find("You can't judge a book by its cover.")[0].phrase, "can't judge a book by its cover");
});

test("tidak peka huruf besar; spasi ganda dan baris baru diterima", () => {
  assert.equal(find("BREAK THE ICE")[0].phrase, "break the ice");
  assert.equal(find("break  the\nice")[0].phrase, "break the ice");
});

test("hanya kata utuh: tidak cocok di dalam kata lain", () => {
  assert.equal(find("They hit the nails on the heads.").length, 0);
  assert.equal(find("a piece of cakes").length, 0);
});

test("posisi dan panjang cocok dengan teks asli", () => {
  const text = "It was a piece of cake, and we broke the ice.";
  const r = find(text);
  assert.equal(r.length, 1); // "broke" bukan bentuk dasar
  assert.equal(text.slice(r[0].index, r[0].index + r[0].length), "piece of cake");
  assert.equal(r[0].matched, "piece of cake");
});

test("hasil terurut menurut posisi", () => {
  const r = find("Time to bite the bullet. Then break the ice. Finally call it a day.");
  assert.deepEqual(r.map((x: { phrase: string }) => x.phrase), ["bite the bullet", "break the ice", "call it a day"]);
  for (let i = 1; i < r.length; i++) assert.ok(r[i].index > r[i - 1].index);
});

test("tumpang tindih: yang lebih panjang menang", () => {
  const r = m.detectIdioms("call it a night", m.compileIdioms([
    { phrase: "call it", meaning: "a", indonesian: "a" },
    { phrase: "call it a night", meaning: "b", indonesian: "b" },
  ]));
  assert.equal(r.length, 1);
  assert.equal(r[0].phrase, "call it a night");
});

test("kemunculan berulang semuanya dilaporkan", () => {
  assert.equal(find("piece of cake? piece of cake!").length, 2);
});

test("teks kosong → kosong; teks sangat panjang dipotong di batas", () => {
  assert.deepEqual(find(""), []);
  const long = "x ".repeat(15000) + "piece of cake";
  assert.equal(find(long).length, 0, "idiom setelah batas 20.000 karakter diabaikan");
  assert.equal(m.MAX_TEXT_LENGTH, 20000);
});

test("karakter regex di frasa tidak merusak pola", () => {
  const r = m.detectIdioms("It costs (a lot) of money.", m.compileIdioms([{ phrase: "(a lot) of money", meaning: "x", indonesian: "y" }]));
  assert.equal(r.length, 1);
});

console.log(`\n${passed} lulus, 0 gagal`);
