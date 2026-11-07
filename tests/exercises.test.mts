// Uji unit lib/exercises/* (Fase 15). Jalankan:
//   node --experimental-transform-types --no-warnings tests/exercises.test.mts <path-repo>
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = path.resolve(process.argv[2] ?? ".");
const load = (f: string) => import(pathToFileURL(path.join(repo, f)).href);
const g = await load("lib/exercises/grade.ts");
const s = await load("lib/exercises/session.ts");
const r = await load("lib/exercises/review.ts");
const c = await load("lib/exercises/from-core-words.ts");
const sm = await load("lib/spaced-repetition.ts");

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

const base = { cefr_level: "A1", topic_slug: "to-be", unit_slug: null, tags: [], explanation_id: "Penjelasan." };
const mcq = { ...base, type: "mcq", prompt: { question: "She ___ happy.", options: ["am", "is", "are"] }, answer: { correct: "is" } };
const cloze = { ...base, type: "cloze", prompt: { text: "I ___ a student and she ___ a teacher." }, answer: { blanks: [["am", "'m"], ["is"]] } };
const order = { ...base, type: "order", prompt: { tokens: ["she", "goes", "to", "school", "."] }, answer: { sentences: ["She goes to school.", "She goes to school"] } };
const match = {
  ...base,
  type: "match",
  prompt: { lefts: ["cat", "dog", "bird"], rights: ["burung", "anjing", "kucing"] },
  answer: { pairs: [{ left: "cat", right: "kucing" }, { left: "dog", right: "anjing" }, { left: "bird", right: "burung" }] },
};
const dictation = { ...base, type: "dictation", prompt: { text: "I don't like tea." }, answer: { accept: ["I don't like tea.", "I do not like tea."] } };

test("validator: tag modul belajar yang panjang (sampai 100 karakter) diterima; lebih dari itu ditolak", () => {
  const base = { type: "mcq", cefr_level: "C1", topic_slug: null, unit_slug: null, prompt: { question: "Pilih yang benar.", options: ["a", "b"] }, answer: { correct: "a" }, explanation_id: "Penjelasan singkat." };
  const long = `mod:${"a".repeat(80)}:12`;
  assert.equal(long.length, 87);
  assert.ok(g.validateExerciseDraft({ ...base, tags: [long] }).ok);
  assert.ok(g.validateExerciseDraft({ ...base, tags: ["x".repeat(g.MAX_TAG_LENGTH)] }).ok);
  const tooLong = g.validateExerciseDraft({ ...base, tags: ["x".repeat(g.MAX_TAG_LENGTH + 1)] });
  assert.equal(tooLong.ok, false);
  assert.match(tooLong.error, /maksimal 100/);
});

test("normalizeAnswer: huruf besar, tanda baca, spasi, apostrof miring, tanda hubung", () => {
  assert.equal(g.normalizeAnswer("  She’s   Happy! "), "she's happy");
  assert.equal(g.normalizeAnswer("well-known"), "well known");
  assert.equal(g.normalizeAnswer("'Hello,' he said."), "hello he said");
  assert.equal(g.normalizeAnswer(null), "");
  assert.equal(g.normalizeAnswer("café"), "café");
});

test("gradeAnswer mcq: benar, salah, kosong, bentuk rusak", () => {
  assert.equal(g.gradeAnswer(mcq, { choice: "is" }).correct, true);
  assert.equal(g.gradeAnswer(mcq, { choice: " is " }).correct, true);
  assert.equal(g.gradeAnswer(mcq, { choice: "are" }).correct, false);
  assert.equal(g.gradeAnswer(mcq, { choice: "" }).correct, false);
  assert.equal(g.gradeAnswer(mcq, null).correct, false);
  assert.equal(g.gradeAnswer(mcq, "is").correct, false);
  assert.equal(g.gradeAnswer(mcq, { choice: "are" }).expected, "is");
});

test("gradeAnswer cloze: jawaban alternatif, sebagian benar, expected terisi", () => {
  assert.equal(g.gradeAnswer(cloze, { blanks: ["am", "is"] }).correct, true);
  assert.equal(g.gradeAnswer(cloze, { blanks: ["'M", "IS."] }).correct, true);
  const half = g.gradeAnswer(cloze, { blanks: ["am", "are"] });
  assert.equal(half.correct, false);
  assert.equal(half.score, 0.5);
  assert.equal(half.expected, "I am a student and she is a teacher.");
  assert.equal(g.gradeAnswer(cloze, { blanks: ["am"] }).correct, false);
  assert.equal(g.gradeAnswer(cloze, { blanks: "am" }).correct, false);
  assert.equal(g.gradeAnswer(cloze, { blanks: ["", ""] }).score, 0);
});

test("gradeAnswer order: kalimat benar, alternatif, urutan salah", () => {
  assert.equal(g.gradeAnswer(order, { order: ["she", "goes", "to", "school", "."] }).correct, true);
  assert.equal(g.gradeAnswer(order, { order: ["She", "goes", "to", "school"] }).correct, true);
  assert.equal(g.gradeAnswer(order, { order: ["goes", "she", "to", "school", "."] }).correct, false);
  assert.equal(g.gradeAnswer(order, { order: [] }).correct, false);
  assert.equal(g.gradeAnswer(order, { order: [1, 2] }).correct, false);
  assert.equal(g.gradeAnswer(order, {}).expected, "She goes to school.");
});

test("gradeAnswer match: semua benar, sebagian, rusak", () => {
  assert.equal(g.gradeAnswer(match, { pairs: { cat: "kucing", dog: "anjing", bird: "burung" } }).correct, true);
  const part = g.gradeAnswer(match, { pairs: { cat: "kucing", dog: "burung", bird: "anjing" } });
  assert.equal(part.correct, false);
  assert.ok(Math.abs(part.score - 1 / 3) < 1e-9);
  assert.equal(g.gradeAnswer(match, { pairs: {} }).score, 0);
  assert.equal(g.gradeAnswer(match, { pairs: [] }).correct, false);
  assert.equal(g.gradeAnswer(match, undefined).correct, false);
});

test("gradeAnswer dictation: normalisasi dan alternatif", () => {
  assert.equal(g.gradeAnswer(dictation, { text: "i dont like tea" }).correct, false); // "dont" ≠ "don't"
  assert.equal(g.gradeAnswer(dictation, { text: "I don’t like tea" }).correct, true);
  assert.equal(g.gradeAnswer(dictation, { text: "I do not like tea." }).correct, true);
  assert.equal(g.gradeAnswer(dictation, { text: "  " }).correct, false);
  assert.equal(g.gradeAnswer(dictation, { text: 42 }).correct, false);
});

test("exerciseSkill", () => {
  assert.equal(g.exerciseSkill({ type: "dictation" }), "listening");
  assert.equal(g.exerciseSkill({ type: "match" }), "vocabulary");
  assert.equal(g.exerciseSkill({ type: "mcq", tags: ["core-word"] }), "vocabulary");
  assert.equal(g.exerciseSkill({ type: "mcq", tags: [] }), "grammar");
  assert.equal(g.exerciseSkill({ type: "cloze" }), "grammar");
});

test("validateExerciseDraft: kelima tipe sah", () => {
  for (const ex of [mcq, cloze, order, match, dictation]) {
    const v = g.validateExerciseDraft(ex);
    assert.equal(v.ok, true, JSON.stringify(v));
  }
});

test("validateExerciseDraft mcq: jawaban harus ada di pilihan, pilihan tidak kembar", () => {
  assert.equal(g.validateExerciseDraft({ ...mcq, answer: { correct: "was" } }).ok, false);
  assert.equal(g.validateExerciseDraft({ ...mcq, prompt: { question: "q?q", options: ["a", "a"] }, answer: { correct: "a" } }).ok, false);
  assert.equal(g.validateExerciseDraft({ ...mcq, prompt: { question: "q?q", options: ["a"] }, answer: { correct: "a" } }).ok, false);
});

test("validateExerciseDraft cloze: jumlah bagian kosong = jumlah jawaban; jawaban tunggal berupa teks diterima", () => {
  assert.equal(g.validateExerciseDraft({ ...cloze, answer: { blanks: [["am"]] } }).ok, false);
  assert.equal(g.validateExerciseDraft({ ...cloze, prompt: { text: "no blank here" }, answer: { blanks: [["x"]] } }).ok, false);
  const flat = g.validateExerciseDraft({ ...cloze, answer: { blanks: ["am", "is"] } });
  assert.equal(flat.ok, true);
  assert.deepEqual(flat.value.answer.blanks, [["am"], ["is"]]);
});

test("validateExerciseDraft order: kalimat benar harus tersusun dari tepat semua potongan", () => {
  assert.equal(g.validateExerciseDraft({ ...order, answer: { sentences: ["She goes to the school."] } }).ok, false);
  assert.equal(g.validateExerciseDraft({ ...order, answer: { sentences: ["School to goes she."] } }).ok, true);
  const multi = g.validateExerciseDraft({ ...order, prompt: { tokens: ["She", "goes", "to school"] }, answer: { sentences: ["She goes to school"] } });
  assert.equal(multi.ok, true, JSON.stringify(multi));
});

test("validateExerciseDraft match: pasangan harus bijektif", () => {
  assert.equal(g.validateExerciseDraft({ ...match, answer: { pairs: match.answer.pairs.slice(0, 2) } }).ok, false);
  assert.equal(
    g.validateExerciseDraft({ ...match, answer: { pairs: [{ left: "cat", right: "kucing" }, { left: "dog", right: "kucing" }, { left: "bird", right: "burung" }] } }).ok,
    false
  );
  assert.equal(g.validateExerciseDraft({ ...match, prompt: { lefts: ["a", "b"], rights: ["x"] } }).ok, false);
});

test("validateExerciseDraft dictation: teks ikut diterima walau accept kosong", () => {
  const v = g.validateExerciseDraft({ ...dictation, answer: {} });
  assert.equal(v.ok, true);
  assert.deepEqual(v.value.answer.accept, ["I don't like tea."]);
  const w = g.validateExerciseDraft({ ...dictation, answer: { accept: ["I do not like tea."] } });
  assert.deepEqual(w.value.answer.accept, ["I don't like tea.", "I do not like tea."]);
});

test("validateExerciseDraft: bidang umum", () => {
  assert.equal(g.validateExerciseDraft(null).ok, false);
  assert.equal(g.validateExerciseDraft({ ...mcq, type: "essay" }).ok, false);
  assert.equal(g.validateExerciseDraft({ ...mcq, cefr_level: "Z9" }).ok, false);
  assert.equal(g.validateExerciseDraft({ ...mcq, cefr_level: "b1" }).value.cefr_level, "B1");
  assert.equal(g.validateExerciseDraft({ ...mcq, explanation_id: "" }).ok, false);
  assert.equal(g.validateExerciseDraft({ ...mcq, topic_slug: "Bad Slug" }).ok, false);
  assert.equal(g.validateExerciseDraft({ ...mcq, topic_slug: "" }).value.topic_slug, null);
  assert.equal(g.validateExerciseDraft({ ...mcq, tags: "x" }).ok, false);
  assert.deepEqual(g.validateExerciseDraft({ ...mcq, tags: ["a", " a ", "b"] }).value.tags, ["a", "b"]);
});

test("parseExerciseRow: baris rusak menjadi null, baris sah mendapat id", () => {
  assert.equal(g.parseExerciseRow({ ...mcq, id: "x1" }).id, "x1");
  assert.equal(g.parseExerciseRow({ ...mcq, id: "x1", prompt: {} }), null);
  assert.equal(g.parseExerciseRow({ ...mcq }), null);
  assert.equal(g.parseExerciseRow(null), null);
});

test("mulberry32/seedFromString: deterministik", () => {
  const a = s.mulberry32(42);
  const b = s.mulberry32(42);
  assert.deepEqual([a(), a(), a()], [b(), b(), b()]);
  assert.notEqual(s.seedFromString("a"), s.seedFromString("b"));
  const x = a();
  assert.ok(x >= 0 && x < 1);
});

test("displayOrder: stabil, tidak sama dengan urutan asli, mempertahankan isi", () => {
  const items = ["she", "goes", "to", "school"];
  const one = s.displayOrder(items, "ex-1");
  assert.deepEqual(one, s.displayOrder(items, "ex-1"));
  assert.notDeepEqual(one, items);
  assert.deepEqual(one.slice().sort(), items.slice().sort());
  assert.deepEqual(s.displayOrder(["x"], "k"), ["x"]);
});

const pool = ["a", "b", "c", "d", "e", "f"].map((id) => ({ id }));

test("pickSession: soal salah diprioritaskan, lalu belum pernah, lalu benar", () => {
  const attempts = [
    { exercise_id: "a", correct: false, created_at: "2026-01-01T00:00:00Z" },
    { exercise_id: "b", correct: true, created_at: "2026-01-01T00:00:00Z" },
    { exercise_id: "c", correct: true, created_at: "2026-01-02T00:00:00Z" },
  ];
  const ids = (n: number) => s.pickSession(pool, attempts, n, s.mulberry32(7)).map((x: { id: string }) => x.id).sort();
  assert.deepEqual(ids(1), ["a"]);
  assert.deepEqual(ids(4), ["a", "d", "e", "f"]);
  assert.deepEqual(ids(5), ["a", "b", "d", "e", "f"]); // b (benar lebih lama) sebelum c
  assert.deepEqual(ids(99), ["a", "b", "c", "d", "e", "f"]);
});

test("pickSession: percobaan terakhir yang menentukan; jumlah dan input kosong", () => {
  const attempts = [
    { exercise_id: "a", correct: false, created_at: "2026-01-01T00:00:00Z" },
    { exercise_id: "a", correct: true, created_at: "2026-02-01T00:00:00Z" }, // sudah benar sekarang
    { exercise_id: "b", correct: true, created_at: "2026-01-01T00:00:00Z" },
    { exercise_id: "b", correct: false, created_at: "2026-02-01T00:00:00Z" }, // salah sekarang
  ];
  const picked = s.pickSession(pool, attempts, 1, s.mulberry32(1));
  assert.equal(picked[0].id, "b");
  assert.deepEqual(s.pickSession([], attempts, 5, s.mulberry32(1)), []);
  assert.deepEqual(s.pickSession(pool, [], 0, s.mulberry32(1)), []);
  assert.equal(s.pickSession(pool, [], 3, s.mulberry32(1)).length, 3);
  assert.equal(new Set(s.pickSession(pool, [], 6, s.mulberry32(3)).map((x: { id: string }) => x.id)).size, 6);
});

test("qualityFromScore", () => {
  assert.equal(r.qualityFromScore(100), 5);
  assert.equal(r.qualityFromScore(90), 5);
  assert.equal(r.qualityFromScore(80), 4);
  assert.equal(r.qualityFromScore(60), 3);
  assert.equal(r.qualityFromScore(45), 2);
  assert.equal(r.qualityFromScore(10), 1);
  assert.equal(r.qualityFromScore(NaN), 1);
  assert.equal(r.qualityFromScore(500), 5);
});

test("scheduleGrammarReview: selesai pertama 1 hari, lalu 6 hari, lalu mengalikan efactor; gagal kembali ke 1 hari", () => {
  const now = new Date("2026-03-01T00:00:00.000Z");
  const first = r.scheduleGrammarReview(null, 4, now, sm.calculateSM2);
  assert.equal(first.interval, 1);
  assert.equal(first.repetitions, 1);
  assert.equal(first.next_review_at, "2026-03-02T00:00:00.000Z");
  const second = r.scheduleGrammarReview(first, 4, now, sm.calculateSM2);
  assert.equal(second.interval, 6);
  assert.equal(second.next_review_at, "2026-03-07T00:00:00.000Z");
  const third = r.scheduleGrammarReview(second, 5, now, sm.calculateSM2);
  assert.ok(third.interval > 6);
  const lapse = r.scheduleGrammarReview(third, 1, now, sm.calculateSM2);
  assert.equal(lapse.interval, 1);
  assert.equal(lapse.repetitions, 0);
  assert.ok(lapse.efactor >= 1.3);
});

test("dueGrammarTopics: hanya yang selesai dan jatuh tempo, terlama dulu", () => {
  const now = new Date("2026-03-10T00:00:00.000Z");
  const rows = [
    { topic_slug: "a", completed_at: "2026-03-01T00:00:00Z", next_review_at: "2026-03-09T00:00:00Z" },
    { topic_slug: "b", completed_at: "2026-03-01T00:00:00Z", next_review_at: "2026-03-05T00:00:00Z" },
    { topic_slug: "c", completed_at: "2026-03-01T00:00:00Z", next_review_at: "2026-03-11T00:00:00Z" },
    { topic_slug: "d", completed_at: null, next_review_at: "2026-03-01T00:00:00Z" },
    { topic_slug: "e", completed_at: "2026-03-01T00:00:00Z", next_review_at: null },
  ];
  assert.deepEqual(r.dueGrammarTopics(rows, now).map((x: { topic_slug: string }) => x.topic_slug), ["b", "a"]);
});

test("mergeDoneSlugs & slugsToMigrate: database menang bila ada, localStorage sebagai cadangan", () => {
  const rows = [
    { topic_slug: "a", completed_at: "2026-03-01T00:00:00Z", next_review_at: null },
    { topic_slug: "b", completed_at: null, next_review_at: null },
  ];
  assert.deepEqual([...r.mergeDoneSlugs(rows, ["x"])], ["a"]);
  assert.deepEqual([...r.mergeDoneSlugs(null, ["x", "y"])], ["x", "y"]);
  assert.deepEqual(r.slugsToMigrate(rows, ["a", "b", "c"]), ["b", "c"]);
  assert.deepEqual(r.slugsToMigrate([], []), []);
});

const words = [
  { word: "book", definition_en: "a set of printed pages that are joined together", cefr_estimate: "A1" },
  { word: "house", definition_en: "a building where people live", cefr_estimate: "A1" },
  { word: "water", definition_en: "a clear liquid that people drink", cefr_estimate: "A1" },
  { word: "road", definition_en: "a long hard surface for vehicles to drive on", cefr_estimate: "A1" },
  { word: "tree", definition_en: "a tall plant with a thick trunk and branches", cefr_estimate: "A1" },
  { word: "run", definition_en: "to move quickly using your legs", cefr_estimate: "A2" },
  { word: "bad", definition_en: null, cefr_estimate: "A1" },
  { word: "loop", definition_en: "a loop is a shape like a circle", cefr_estimate: "A1" }, // memuat kata itu sendiri: dilewati
];

test("buildCoreWordExercises: mcq dan match sah, tanpa AI, pengecoh dari level sama", () => {
  const out = c.buildCoreWordExercises(words, { mcqCount: 3, matchCount: 1, rng: s.mulberry32(5) });
  assert.ok(out.length >= 4);
  for (const d of out) {
    const v = g.validateExerciseDraft(d);
    assert.equal(v.ok, true, JSON.stringify(v));
    assert.ok(d.tags.includes("core-word"));
  }
  const mcqs = out.filter((d: { type: string }) => d.type === "mcq");
  assert.equal(mcqs.length, 3);
  for (const d of mcqs) {
    assert.equal(d.prompt.options.length, 4);
    assert.ok(d.prompt.options.includes(d.answer.correct));
    assert.ok(d.tags.some((t: string) => t.startsWith("core:")));
    if (d.cefr_level === "A1") assert.ok(!d.prompt.options.includes(words[5].definition_en)); // definisi A2 tidak dipakai sebagai pengecoh A1
  }
  const matchEx = out.find((d: { type: string }) => d.type === "match");
  assert.equal(matchEx.prompt.lefts.length, 4);
  assert.ok(!out.some((d: { prompt: { question?: string } }) => d.prompt.question?.includes("bad") || d.prompt.question?.includes("loop")));
});

test("buildCoreWordExercises: skipWords, deterministik, data kurang", () => {
  const a = c.buildCoreWordExercises(words, { mcqCount: 2, matchCount: 0, rng: s.mulberry32(9) });
  const b = c.buildCoreWordExercises(words, { mcqCount: 2, matchCount: 0, rng: s.mulberry32(9) });
  assert.deepEqual(a, b);
  const skip = new Set(["book", "house", "water", "road", "tree", "run"]);
  assert.deepEqual(c.buildCoreWordExercises(words, { mcqCount: 5, matchCount: 1, skipWords: skip, rng: s.mulberry32(1) }), []);
  assert.deepEqual(c.buildCoreWordExercises(words.slice(0, 2), { mcqCount: 2, matchCount: 1, rng: s.mulberry32(1) }), []);
  assert.equal(c.coreWordTag(" Book "), "core:book");
});

console.log(`\n${passed} lulus, 0 gagal`);
