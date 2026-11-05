// Uji unit penyusun kalimat (lib/exercises/patterns.ts) dan toleransi salah ketik (lib/exercises/grade.ts), Fase 22.1-22.2.
// Jalankan:
//   node --experimental-transform-types --no-warnings tests/patterns.test.mts <path-repo>
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = path.resolve(process.argv[2] ?? ".");
const load = (f: string) => import(pathToFileURL(path.join(repo, f)).href);
const p = await load("lib/exercises/patterns.ts");
const g = await load("lib/exercises/grade.ts");

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

const prompt = {
  subjects: [
    { text: "I", person: "i" },
    { text: "You", person: "other" },
    { text: "She", person: "sg3" },
    { text: "They", person: "other" },
  ],
  verbs: [
    { base: "eat", third: "eats", meaning_id: "makan" },
    { base: "like", third: "likes" },
  ],
  objects: ["rice", "tea"],
  hint: "Dia (perempuan) makan nasi.",
};
const exercise = { type: "pattern", prompt, answer: { sentences: ["She eats rice."] }, tags: [] };

test("conjugate: I dan jamak memakai bentuk dasar, he/she/it memakai bentuk -s", () => {
  const [i, you, she] = prompt.subjects;
  assert.equal(p.conjugate(i, prompt.verbs[0]), "eat");
  assert.equal(p.conjugate(you, prompt.verbs[0]), "eat");
  assert.equal(p.conjugate(she, prompt.verbs[0]), "eats");
  // bentuk khusus untuk I (am)
  const be = { base: "are", third: "is", first: "am" };
  assert.equal(p.conjugate(i, be), "am");
  assert.equal(p.conjugate(you, be), "are");
  assert.equal(p.conjugate(she, be), "is");
});

test("buildPatternSentence: kapital di awal, titik di akhir, null bila pilihan tidak ada", () => {
  assert.equal(p.buildPatternSentence(prompt, { subject: "She", verb: "eat", object: "rice" }), "She eats rice.");
  assert.equal(p.buildPatternSentence(prompt, { subject: "They", verb: "like", object: "tea" }), "They like tea.");
  assert.equal(p.buildPatternSentence(prompt, { subject: "He", verb: "eat", object: "rice" }), null);
  assert.equal(p.buildPatternSentence(prompt, { subject: "She", verb: "run", object: "rice" }), null);
  assert.equal(p.buildPatternSentence(prompt, { subject: "She", verb: "eat", object: "milk" }), null);
  assert.equal(p.buildPatternSentence(prompt, null), null);
});

test("catatan Indonesia: I → She mengubah eat → eats", () => {
  const [i, , she, they] = prompt.subjects;
  assert.match(p.conjugationNote(she, prompt.verbs[0]), /eat menjadi eats/);
  assert.match(p.conjugationNote(they, prompt.verbs[0]), /tanpa -s/);
  assert.equal(p.conjugationNote(i, prompt.verbs[0]), null);
  assert.match(p.conjugationNote(i, { base: "are", third: "is", first: "am" }), /am/);
});

test("gradeAnswer pattern: benar, salah subjek, salah bentuk, bentuk jawaban rusak (tanpa AI)", () => {
  assert.equal(g.gradeAnswer(exercise, { subject: "She", verb: "eat", object: "rice" }).correct, true);
  const wrongSubject = g.gradeAnswer(exercise, { subject: "I", verb: "eat", object: "rice" });
  assert.equal(wrongSubject.correct, false);
  assert.equal(wrongSubject.expected, "She eats rice.");
  assert.equal(g.gradeAnswer(exercise, { subject: "She", verb: "like", object: "rice" }).correct, false);
  assert.equal(g.gradeAnswer(exercise, { subject: "She", verb: "eat", object: "tea" }).correct, false);
  assert.equal(g.gradeAnswer(exercise, null).correct, false);
  assert.equal(g.gradeAnswer(exercise, { subject: 1, verb: [], object: {} }).correct, false);
});

test("validateExerciseDraft pattern: sah, dan kalimat benar harus bisa dibentuk", () => {
  const base = { type: "pattern", cefr_level: "A1", topic_slug: null, unit_slug: "rutinitas-harian", tags: [], explanation_id: "He/she/it memakai kata kerja + s." };
  const ok = g.validateExerciseDraft({ ...base, prompt, answer: { sentences: ["She eats rice."] } });
  assert.equal(ok.ok, true, ok.error);
  assert.equal(g.validateExerciseDraft({ ...base, prompt, answer: { sentences: ["She eat rice."] } }).ok, false, "bentuk salah tidak bisa dibentuk");
  assert.equal(g.validateExerciseDraft({ ...base, prompt: { ...prompt, subjects: [] }, answer: { sentences: ["She eats rice."] } }).ok, false);
  assert.equal(g.validateExerciseDraft({ ...base, prompt: { ...prompt, subjects: [{ text: "I", person: "x" }] }, answer: { sentences: ["I eat rice."] } }).ok, false);
  assert.equal(g.validateExerciseDraft({ ...base, prompt: { ...prompt, objects: ["rice", "rice"] }, answer: { sentences: ["She eats rice."] } }).ok, false);
  assert.equal(g.validateExerciseDraft({ ...base, prompt, answer: { sentences: [] } }).ok, false);
  assert.ok(g.exerciseSkill({ type: "pattern" }) === "grammar");
});

// --- 22.2 toleransi salah ketik ---

test("oneEditApart: satu penyisipan, penghapusan, atau penggantian", () => {
  assert.equal(g.oneEditApart("receive", "recieve"), false, "tukar dua huruf = dua suntingan");
  assert.equal(g.oneEditApart("receive", "receve"), true);
  assert.equal(g.oneEditApart("receive", "receivee"), true);
  assert.equal(g.oneEditApart("receive", "receiva"), true);
  assert.equal(g.oneEditApart("receive", "receive"), false);
  assert.equal(g.oneEditApart("receive", "recv"), false);
  assert.equal(g.oneEditApart("a", "b"), true);
});

test("typoMatch: hanya satu kata ≥ 6 huruf yang salah satu huruf", () => {
  assert.deepEqual(g.typoMatch("I like chocolat", "I like chocolate"), { given: "chocolat", expected: "chocolate" });
  assert.equal(g.typoMatch("I lik chocolate", "I like chocolate"), null, "kata pendek harus persis");
  assert.equal(g.typoMatch("I like chocolat cak", "I like chocolate cake"), null, "dua kata salah");
  assert.equal(g.typoMatch("I like chocolate", "I like chocolate"), null, "persis bukan salah ketik");
  assert.equal(g.typoMatch("", "I like chocolate"), null);
  assert.equal(g.typoMatch("I like", "I like chocolate"), null, "jumlah kata berbeda");
});

test("cloze: salah ketik pada kata panjang dianggap benar dengan catatan; kata pendek tetap salah", () => {
  const cloze = { type: "cloze", prompt: { text: "I eat ___ every day." }, answer: { blanks: [["chocolate"]] }, tags: [] };
  const typo = g.gradeAnswer(cloze, { blanks: ["chocolat"] });
  assert.equal(typo.correct, true);
  assert.deepEqual(typo.typo, { given: "chocolat", expected: "chocolate" });
  const exact = g.gradeAnswer(cloze, { blanks: ["Chocolate"] });
  assert.equal(exact.correct, true);
  assert.equal(exact.typo, undefined);
  const short = { type: "cloze", prompt: { text: "I ___ a teacher." }, answer: { blanks: [["am"]] }, tags: [] };
  assert.equal(g.gradeAnswer(short, { blanks: ["an"] }).correct, false);
  assert.equal(g.gradeAnswer(cloze, { blanks: ["chocolatte"] }).correct, true, "satu huruf lebih");
  assert.equal(g.gradeAnswer(cloze, { blanks: ["chokolat"] }).correct, false, "dua suntingan");
});

test("dictation: salah ketik diterima dengan catatan; tag ejaan dan minimal-pair tetap ketat", () => {
  const dict = { type: "dictation", prompt: { text: "My favourite colour is yellow." }, answer: { accept: ["My favourite colour is yellow."] }, tags: [] };
  const typo = g.gradeAnswer(dict, { text: "My favourite colour is yelow." });
  assert.equal(typo.correct, true, "yellow → yelow: satu penghapusan pada kata 6 huruf");
  assert.deepEqual(typo.typo, { given: "yelow", expected: "yellow" });
  assert.equal(g.gradeAnswer(dict, { text: "My favourite colour is yellow." }).typo, undefined);
  // dua kata salah ketik sekaligus tidak ditoleransi
  assert.equal(g.gradeAnswer(dict, { text: "My favorite colour is yelow." }).correct, false);
  // soal ejaan: tidak ada toleransi
  for (const tag of ["ejaan", "spelling", "strict-spelling", "minimal-pair"]) {
    assert.equal(g.gradeAnswer({ ...dict, tags: [tag] }, { text: "My favourite colour is yelow." }).correct, false, tag);
    assert.equal(g.gradeAnswer({ ...dict, tags: [tag] }, { text: "My favourite colour is yellow." }).correct, true, tag);
  }
  assert.equal(g.isStrictSpelling(["ejaan"]), true);
  assert.equal(g.isStrictSpelling(["core-word"]), false);
  assert.equal(g.isStrictSpelling(null), false);
});

console.log(`\n${passed} lulus, 0 gagal`);
