// Uji unit lib/next-step.ts. Jalankan:
//   node --experimental-transform-types --no-warnings tests/next-step.test.mts <path-repo>
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = path.resolve(process.argv[2] ?? ".");
const { getNextStep } = await import(pathToFileURL(path.join(repo, "lib/next-step.ts")).href);

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

const reading = { title: "The Lost Key", href: "/read/1" };
const levelText = { title: "A Day at the Market", href: "/read/2", minutes: 5 };

test("review jatuh tempo menang atas semuanya", () => {
  const s = getNextStep({ goal: "sastra", cefr: "B1", dueCount: 7, continueReading: reading, levelText });
  assert.equal(s.href, "/review");
  assert.match(s.title, /7 kata/);
});

test("review grammar jatuh tempo (Fase 15): kalah dari review kata, menang atas Tes Naik Level dan bacaan", () => {
  const grammarDue = { count: 2, slug: "present-simple", title: "Present simple" };
  const g = getNextStep({ goal: "umum", cefr: "B1", dueCount: 0, grammarDue, continueReading: reading, levelUpTarget: "B2" });
  assert.equal(g.href, "/english-lab/grammar/present-simple?review=1");
  assert.match(g.title, /Present simple/);
  assert.match(g.title, /\+1 topik/);
  const both = getNextStep({ goal: "umum", cefr: "B1", dueCount: 4, grammarDue });
  assert.equal(both.href, "/review");
  assert.match(both.reason, /2 topik grammar/);
  const single = getNextStep({ goal: "umum", cefr: "B1", dueCount: 0, grammarDue: { count: 1, slug: "to-be", title: "To be" } });
  assert.equal(single.title, "Review grammar: To be");
  assert.equal(getNextStep({ goal: "umum", cefr: "A1", dueCount: 0, grammarDue: { count: 0, slug: "x", title: "x" } }).href, "/english-lab/grammar-clinic");
  assert.equal(getNextStep({ goal: "umum", cefr: "A1", dueCount: 0, grammarDue: null }).href, "/english-lab/grammar-clinic");
});

test("unit Kursus Dasar (Fase 16): setelah lanjutkan bacaan, sebelum bacaan sesuai level", () => {
  const courseUnit = { title: "Salam & perkenalan", href: "/kursus/salam-perkenalan", started: false };
  const c = getNextStep({ goal: "umum", cefr: "A1", dueCount: 0, courseUnit, levelText });
  assert.equal(c.href, "/kursus/salam-perkenalan");
  assert.match(c.title, /^Mulai Kursus Dasar/);
  assert.match(getNextStep({ goal: "umum", cefr: "A1", dueCount: 0, courseUnit: { ...courseUnit, started: true } }).title, /^Lanjutkan Kursus Dasar/);
  assert.equal(getNextStep({ goal: "umum", cefr: "A1", dueCount: 0, courseUnit, continueReading: reading }).href, reading.href);
  assert.equal(getNextStep({ goal: "umum", cefr: "A1", dueCount: 2, courseUnit }).href, "/review");
  assert.equal(getNextStep({ goal: "umum", cefr: "A1", dueCount: 0, courseUnit: null, levelText }).href, levelText.href);
});

test("siap naik level: Tes Naik Level menang atas bacaan, kalah dari review", () => {
  const ready = getNextStep({ goal: "umum", cefr: "B1", dueCount: 0, continueReading: reading, levelText, levelUpTarget: "B2" });
  assert.equal(ready.href, "/english-lab/level-test");
  assert.match(ready.title, /B2/);
  const due = getNextStep({ goal: "umum", cefr: "B1", dueCount: 3, levelUpTarget: "B2" });
  assert.equal(due.href, "/review");
  const none = getNextStep({ goal: "umum", cefr: "B1", dueCount: 0, continueReading: reading, levelUpTarget: null });
  assert.equal(none.href, "/read/1");
});

test("tanpa review: lanjutkan bacaan", () => {
  const s = getNextStep({ goal: "umum", cefr: "A2", dueCount: 0, continueReading: reading, levelText });
  assert.equal(s.href, "/read/1");
  assert.match(s.title, /The Lost Key/);
});

test("tanpa bacaan berjalan: bacaan sesuai level (Fase 9)", () => {
  const s = getNextStep({ goal: "umum", cefr: "A2", dueCount: 0, levelText });
  assert.equal(s.href, "/read/2");
  assert.match(s.title, /A2/);
  assert.match(s.title, /5 menit/);
});

test("level belum diketahui: arahkan ke Placement Test", () => {
  const s = getNextStep({ goal: "sastra", cefr: null, dueCount: 0 });
  assert.equal(s.href, "/english-lab/placement-test");
});

test("saran per tujuan", () => {
  assert.equal(getNextStep({ goal: "umum", cefr: "A1", dueCount: 0 }).href, "/english-lab/grammar-clinic");
  assert.equal(getNextStep({ goal: "sastra", cefr: "B2", dueCount: 0 }).href, "/gutenberg");
  assert.equal(getNextStep({ goal: "penerjemahan", cefr: "B2", dueCount: 0 }).href, "/translation-workshop");
});

test("tujuan kosong dianggap umum", () => {
  assert.equal(getNextStep({ goal: null, cefr: "B1", dueCount: 0 }).href, "/english-lab/grammar-clinic");
});

test("selalu mengembalikan title, href, reason", () => {
  const s = getNextStep({ goal: null, cefr: null, dueCount: 0 });
  assert.ok(s.title && s.href && s.reason);
});

console.log(`\n${passed} lulus, 0 gagal`);
