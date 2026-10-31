// Uji unit lib/core-words.ts. Jalankan:
//   node --experimental-transform-types --no-warnings tests/core-words.test.mts <path-repo>
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = path.resolve(process.argv[2] ?? ".");
const m = await import(pathToFileURL(path.join(repo, "lib/core-words.ts")).href);

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

const rows = [
  { word: "search", forms: ["searches", "searched", "searching"] },
  { word: "be", forms: ["am", "is", "are", "been", "was"] },
  { word: "left", forms: ["lefts"] },
  { word: "leave", forms: ["leaves", "left", "leaving"] }, // "left" juga bentuk dari leave (homograf)
  { word: "plain" },
  { word: "odd", forms: null },
];

test("lemmaOf: kata inti, bentuk kata, dan bukan keduanya", () => {
  assert.equal(m.lemmaOf("search", rows), "search");
  assert.equal(m.lemmaOf("searched", rows), "search");
  assert.equal(m.lemmaOf("WAS", rows), "be");
  assert.equal(m.lemmaOf("  Leaving ", rows), "leave");
  assert.equal(m.lemmaOf("zebra", rows), null);
  assert.equal(m.lemmaOf("", rows), null);
});

test("lemmaOf: kecocokan persis menang atas bentuk kata (homograf left)", () => {
  assert.equal(m.lemmaOf("left", rows), "left");
});

test("lemmaOf: baris tanpa forms (kolom belum ada) tetap bekerja", () => {
  assert.equal(m.lemmaOf("plain", rows), "plain");
  assert.equal(m.lemmaOf("odd", rows), "odd");
  assert.equal(m.lemmaOf("plains", [{ word: "plain" }]), null);
});

test("lemmaOf: bentuk yang dimiliki dua kata inti memakai yang lebih dulu", () => {
  const dup = [{ word: "a", forms: ["x"] }, { word: "b", forms: ["x"] }];
  assert.equal(m.lemmaOf("x", dup), "a");
});

test("buildLemmaIndex dapat dipakai ulang untuk banyak pencarian", () => {
  const index = m.buildLemmaIndex(rows);
  assert.ok(index instanceof Map);
  assert.equal(m.lemmaOf("searches", index), "search");
  assert.equal(m.lemmaOf("are", index), "be");
});

test("coreStatus: belum / sedang / dikuasai", () => {
  const search = rows[0];
  assert.equal(m.coreStatus(search, new Map()), "belum");
  assert.equal(m.coreStatus(search, new Map([["search", 1]])), "sedang");
  assert.equal(m.coreStatus(search, new Map([["search", 0]])), "sedang");
  assert.equal(m.coreStatus(search, new Map([["search", 3]])), "dikuasai");
});

test("coreStatus: kata simpanan dalam bentuk lain dihitung (searched → search)", () => {
  const search = rows[0];
  assert.equal(m.coreStatus(search, new Map([["searched", 1]])), "sedang");
  assert.equal(m.coreStatus(search, new Map([["searched", 4]])), "dikuasai");
  // status tertinggi menang
  assert.equal(m.coreStatus(search, new Map([["search", 1], ["searching", 5]])), "dikuasai");
  // kata lain tidak ikut terhitung
  assert.equal(m.coreStatus(search, new Map([["research", 5]])), "belum");
});

test("coreStatus: tanpa forms hanya kata itu sendiri", () => {
  assert.equal(m.coreStatus({ word: "plain" }, new Map([["plains", 5]])), "belum");
  assert.equal(m.coreStatus({ word: "plain" }, new Map([["plain", 3]])), "dikuasai");
});

test("isOwned: kata atau bentuknya", () => {
  assert.equal(m.isOwned(rows[0], new Set(["searched"])), true);
  assert.equal(m.isOwned(rows[0], new Set(["search"])), true);
  assert.equal(m.isOwned(rows[0], new Set(["other"])), false);
});

test("wordCandidates: huruf kecil dan tanpa duplikat", () => {
  assert.deepEqual(m.wordCandidates({ word: "Search", forms: ["SEARCH", "Searches", " searches "] }), ["search", "searches"]);
});

console.log(`\n${passed} lulus, 0 gagal`);
