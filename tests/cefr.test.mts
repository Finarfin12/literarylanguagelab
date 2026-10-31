// Uji unit lib/cefr.ts. Jalankan:
//   node --experimental-transform-types --no-warnings tests/cefr.test.mts <path-repo>
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = path.resolve(process.argv[2] ?? ".");
const m = await import(pathToFileURL(path.join(repo, "lib/cefr.ts")).href);

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

test("levelIndex", () => {
  assert.equal(m.levelIndex("A1"), 0);
  assert.equal(m.levelIndex("C2"), 5);
  assert.equal(m.levelIndex("X9"), -1);
  assert.equal(m.levelIndex(null), -1);
});

test("neighborLevels default = satu di bawah + level itu", () => {
  assert.deepEqual(m.neighborLevels("B1"), ["A2", "B1"]);
  assert.deepEqual(m.neighborLevels("A1"), ["A1"]);
  assert.deepEqual(m.neighborLevels("C2"), ["C1", "C2"]);
});

test("neighborLevels dengan rentang atas", () => {
  assert.deepEqual(m.neighborLevels("B1", 1, 1), ["A2", "B1", "B2"]);
  assert.deepEqual(m.neighborLevels("C2", 0, 3), ["C2"]);
  assert.deepEqual(m.neighborLevels("zzz"), []);
});

test("bandToCefr batas tepat", () => {
  assert.equal(m.bandToCefr(1), "A1");
  assert.equal(m.bandToCefr(500), "A1");
  assert.equal(m.bandToCefr(501), "A2");
  assert.equal(m.bandToCefr(1000), "A2");
  assert.equal(m.bandToCefr(1001), "B1");
  assert.equal(m.bandToCefr(2000), "B1");
  assert.equal(m.bandToCefr(2001), "B2");
  assert.equal(m.bandToCefr(2800), "B2");
});

test("bandToCefr di luar rentang → null", () => {
  assert.equal(m.bandToCefr(2801), null);
  assert.equal(m.bandToCefr(0), null);
  assert.equal(m.bandToCefr(-5), null);
  assert.equal(m.bandToCefr(Number.NaN), null);
});

test("beginnerModeLevel: satu di bawah, minimal A2", () => {
  assert.equal(m.beginnerModeLevel("C1"), "B2");
  assert.equal(m.beginnerModeLevel("B1"), "A2");
  assert.equal(m.beginnerModeLevel("A2"), "A2");
  assert.equal(m.beginnerModeLevel("A1"), "A2");
  assert.equal(m.beginnerModeLevel(null), "B1");
});

test("explanationLanguage sesuai PRD 5.2", () => {
  assert.equal(m.explanationLanguage("A1"), "id");
  assert.equal(m.explanationLanguage("A2"), "id");
  assert.equal(m.explanationLanguage("B1"), "mixed");
  assert.equal(m.explanationLanguage("B2"), "en");
  assert.equal(m.explanationLanguage("C2"), "en");
  assert.equal(m.explanationLanguage(undefined), null);
});

test("explanationInstruction kosong tanpa level, terisi dengan level", () => {
  assert.equal(m.explanationInstruction(null), "");
  assert.match(m.explanationInstruction("A1"), /Indonesian/);
  assert.match(m.explanationInstruction("B2"), /clear English/);
});

console.log(`\n${passed} lulus, 0 gagal`);
