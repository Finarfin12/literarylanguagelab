// Uji unit lib/course.ts (Fase 16). Jalankan:
//   node --experimental-transform-types --no-warnings tests/course.test.mts <path-repo>
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = path.resolve(process.argv[2] ?? ".");
const c = await import(pathToFileURL(path.join(repo, "lib/course.ts")).href);
const g = await import(pathToFileURL(path.join(repo, "lib/exercises/grade.ts")).href);

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

test("cleanStep: keenam jenis langkah sah", () => {
  const steps = [
    { type: "vocab", items: [{ word: "hello", meaning_id: "halo" }, "goodbye"] },
    { type: "grammar", topic_slug: "to-be" },
    { type: "read", text_id: "abc-123" },
    { type: "read", content: "My name is Ana." },
    { type: "listen", text: "Nice to meet you." },
    { type: "exercise", count: 6 },
    { type: "speak", sentences: ["Hello, I am Ana."], scenario_id: "small-talk-neighbor" },
  ];
  for (const s of steps) assert.notEqual(c.cleanStep(s), null, JSON.stringify(s));
  assert.deepEqual(c.cleanStep(steps[0]).items, [{ word: "hello", meaning_id: "halo" }, { word: "goodbye" }]);
});

test("cleanStep: tolak bentuk rusak", () => {
  assert.equal(c.cleanStep(null), null);
  assert.equal(c.cleanStep({ type: "video" }), null);
  assert.equal(c.cleanStep({ type: "vocab", items: [{ word: "" }] }), null);
  assert.equal(c.cleanStep({ type: "vocab", items: "x" }), null);
  assert.equal(c.cleanStep({ type: "grammar", topic_slug: "Bad Slug" }), null);
  assert.equal(c.cleanStep({ type: "exercise", count: 0 }), null);
  assert.equal(c.cleanStep({ type: "exercise", count: 2.5 }), null);
  assert.equal(c.cleanStep({ type: "speak", sentences: [""] }), null);
  assert.equal(c.cleanStep({ type: "listen", text: 5 }), null);
});

test("parseSteps melewati langkah rusak; validateSteps menolaknya", () => {
  const raw = [{ type: "grammar", topic_slug: "to-be" }, { type: "nope" }, { type: "exercise" }];
  assert.equal(c.parseSteps(raw).length, 2);
  assert.deepEqual(c.parseSteps("x"), []);
  const v = c.validateSteps(raw);
  assert.equal(v.ok, false);
  assert.match(v.error, /Langkah 2/);
  assert.equal(c.validateSteps([{ type: "exercise" }]).ok, true);
  assert.equal(c.validateSteps("x").ok, false);
  assert.equal(c.validateSteps(Array.from({ length: 21 }, () => ({ type: "exercise" }))).ok, false);
});

test("isStepEmpty menandai placeholder", () => {
  assert.equal(c.isStepEmpty({ type: "vocab", items: [] }), true);
  assert.equal(c.isStepEmpty({ type: "vocab", items: [{ word: "a" }] }), false);
  assert.equal(c.isStepEmpty({ type: "grammar", topic_slug: "" }), true);
  assert.equal(c.isStepEmpty({ type: "read" }), true);
  assert.equal(c.isStepEmpty({ type: "read", content: "x" }), false);
  assert.equal(c.isStepEmpty({ type: "listen", text: "" }), true);
  assert.equal(c.isStepEmpty({ type: "exercise" }), false);
  assert.equal(c.isStepEmpty({ type: "speak", sentences: [] }), true);
  assert.equal(c.isStepEmpty({ type: "speak", sentences: [], scenario_id: "x" }), false);
  assert.equal(c.readySteps([{ type: "vocab", items: [] }, { type: "exercise" }]), 1);
});

test("stepTitle: judul sendiri atau nama jenis", () => {
  assert.equal(c.stepTitle({ type: "listen", text: "x" }), "Dengar");
  assert.equal(c.stepTitle({ type: "listen", text: "x", title: "Percakapan" }), "Percakapan");
});

test("unitPercent", () => {
  assert.equal(c.unitPercent(0, 6, false), 0);
  assert.equal(c.unitPercent(3, 6, false), 50);
  assert.equal(c.unitPercent(99, 6, false), 100);
  assert.equal(c.unitPercent(2, 6, true), 100);
  assert.equal(c.unitPercent(2, 0, false), 0);
  assert.equal(c.unitPercent(-4, 6, false), 0);
});

test("advance: maju satu langkah, tidak pernah mundur, selesai di langkah terakhir", () => {
  assert.deepEqual(c.advance(0, 0, 6), { stepIndex: 1, completed: false });
  assert.deepEqual(c.advance(2, 5, 6), { stepIndex: 5, completed: false }); // mengulang langkah lama
  assert.deepEqual(c.advance(5, 5, 6), { stepIndex: 6, completed: true });
  assert.deepEqual(c.advance(9, 0, 6), { stepIndex: 6, completed: true });
  assert.deepEqual(c.advance(0, 0, 0), { stepIndex: 0, completed: false });
});

test("resumeIndex", () => {
  assert.equal(c.resumeIndex(null, 6), 0);
  assert.equal(c.resumeIndex({ unit_slug: "a", step_index: 3, completed_at: null }, 6), 3);
  assert.equal(c.resumeIndex({ unit_slug: "a", step_index: 6, completed_at: null }, 6), 5);
  assert.equal(c.resumeIndex({ unit_slug: "a", step_index: 6, completed_at: "2026-01-01" }, 6), 0);
});

const units = [
  { slug: "u2", cefr_level: "A1", sort_order: 2, ready_steps: 5 },
  { slug: "u0", cefr_level: "A0", sort_order: 0, ready_steps: 3 },
  { slug: "u1", cefr_level: "A1", sort_order: 1, ready_steps: 5 },
  { slug: "u3", cefr_level: "A2", sort_order: 3, ready_steps: 0 }, // belum ada isinya
  { slug: "u4", cefr_level: "A2", sort_order: 4, ready_steps: 4 },
];

test("suggestNextUnit: unit pertama berurutan, tanpa kunci", () => {
  assert.equal(c.suggestNextUnit(units, [], null).slug, "u0");
  assert.equal(c.suggestNextUnit(units, [{ unit_slug: "u0", step_index: 3, completed_at: "x" }], null).slug, "u1");
});

test("suggestNextUnit: unit yang sedang dikerjakan didahulukan, unit kosong dilewati", () => {
  const progress = [
    { unit_slug: "u0", step_index: 3, completed_at: "x" },
    { unit_slug: "u1", step_index: 5, completed_at: "x" },
    { unit_slug: "u2", step_index: 1, completed_at: null },
  ];
  assert.equal(c.suggestNextUnit(units, progress, null).slug, "u2");
  const done = progress.map((p) => ({ ...p, completed_at: "x" }));
  assert.equal(c.suggestNextUnit(units, done, null).slug, "u4"); // u3 kosong dilewati
  assert.equal(c.suggestNextUnit(units, [...done, { unit_slug: "u4", step_index: 4, completed_at: "x" }], null), null);
});

test("suggestNextUnit: menyesuaikan level pengguna, tetap ada cadangan", () => {
  assert.equal(c.suggestNextUnit(units, [], "A2").slug, "u4");
  assert.equal(c.suggestNextUnit(units, [], "A1").slug, "u1");
  assert.equal(c.suggestNextUnit(units, [], "B2").slug, "u0"); // semua di bawah level: jatuh ke pilihan pertama
  assert.equal(c.suggestNextUnit([], [], "A1"), null);
});

test("courseSummary & groupByLevel", () => {
  assert.deepEqual(c.courseSummary(units, [{ unit_slug: "u0", step_index: 3, completed_at: "x" }, { unit_slug: "u1", step_index: 1, completed_at: null }]), { total: 5, completed: 1 });
  const g = c.groupByLevel(units);
  assert.deepEqual(g.map((x: { level: string }) => x.level), ["A0", "A1", "A2"]);
  assert.deepEqual(g[1].units.map((u: { slug: string }) => u.slug), ["u1", "u2"]);
});

test("attachReadStep: sesudah baca terakhir, atau sebelum dengar; placeholder diisi; tanpa duplikat", () => {
  const steps = [{ type: "vocab", items: [{ word: "a" }] }, { type: "read", text_id: "t1" }, { type: "listen", text: "x" }, { type: "exercise" }];
  const a = c.attachReadStep(steps, "t2", "Bacaan 2");
  assert.deepEqual(a.map((s: { type: string }) => s.type), ["vocab", "read", "read", "listen", "exercise"]);
  assert.equal(a[2].text_id, "t2");
  const b = c.attachReadStep([{ type: "vocab", items: [] }, { type: "listen", text: "x" }], "t1", "B");
  assert.deepEqual(b.map((s: { type: string }) => s.type), ["vocab", "read", "listen"]);
  const d = c.attachReadStep([{ type: "vocab", items: [] }, { type: "exercise" }], "t1", "B");
  assert.deepEqual(d.map((s: { type: string }) => s.type), ["vocab", "read", "exercise"]);
  assert.deepEqual(c.attachReadStep([{ type: "vocab", items: [] }], "t1", "B").map((s: { type: string }) => s.type), ["vocab", "read"]);
  const filled = c.attachReadStep([{ type: "read", title: "Bacaan" }, { type: "listen", text: "x" }], "t9", "AI");
  assert.equal(filled.length, 2);
  assert.equal(filled[0].text_id, "t9");
  assert.equal(filled[0].title, "Bacaan");
  assert.equal(c.attachReadStep(steps, "t1", "x").length, steps.length);
  assert.equal(steps.length, 4); // masukan tidak diubah
});

test("hasReadingContent & unitVocabWords", () => {
  assert.equal(c.hasReadingContent([{ type: "read" }, { type: "listen", text: "x" }]), false);
  assert.equal(c.hasReadingContent([{ type: "read", text_id: "t" }]), true);
  assert.equal(c.hasReadingContent([{ type: "read", content: "Hi." }]), true);
  assert.deepEqual(c.unitVocabWords([{ type: "vocab", items: [{ word: "Book" }, { word: "water" }] }, { type: "vocab", items: [{ word: "book" }] }]), ["book", "water"]);
});

test("seed migrasi 0013: semua langkah dan soal contoh lolos validasi", () => {
  const sql = fs.readFileSync(path.join(repo, "supabase/migrations/0013_course_units.sql"), "utf8");
  const stepLists = [...sql.matchAll(/\$j\$([\s\S]*?)\$j\$/g)].map((m) => m[1]).concat([...sql.matchAll(/^\s*'(\[\{"type".*\]|\[\])',$/gm)].map((m) => m[1]));
  assert.equal(stepLists.length, 12);
  for (const raw of stepLists) {
    const v = c.validateSteps(JSON.parse(raw));
    assert.equal(v.ok, true, raw.slice(0, 80));
  }
  const exRows = [...sql.matchAll(/\('(mcq|cloze|order|match|dictation)',\s*'(\{[\s\S]*?\})',\s*'(\{[\s\S]*?\})',\s*'([^']*)'\)/g)];
  assert.equal(exRows.length, 6);
  for (const [, type, prompt, answer, explanation_id] of exRows) {
    const v = g.validateExerciseDraft({ type, cefr_level: "A1", topic_slug: "to-be", unit_slug: "salam-perkenalan", tags: [], prompt: JSON.parse(prompt), answer: JSON.parse(answer), explanation_id });
    assert.equal(v.ok, true, `${type}: ${v.error}`);
  }
  // Unit contoh lengkap: tidak ada langkah kosong
  const example = JSON.parse(stepLists.find((s) => s.includes("Hi, I am Ana")) as string);
  assert.equal(c.readySteps(c.parseSteps(example)), example.length);
});

console.log(`\n${passed} lulus, 0 gagal`);
