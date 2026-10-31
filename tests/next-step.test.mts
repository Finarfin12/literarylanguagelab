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
