// Uji unit lib/l1.ts + validasi seed migrasi 0014 (Fase 17). Jalankan:
//   node --experimental-transform-types --no-warnings tests/l1.test.mts <path-repo>
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = path.resolve(process.argv[2] ?? ".");
const load = (f: string) => import(pathToFileURL(path.join(repo, f)).href);
const l1 = await load("lib/l1.ts");
const g = await load("lib/exercises/grade.ts");
const course = await load("lib/course.ts");
const s = await load("lib/exercises/session.ts");

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

const pairs = [
  { slug: "ship-sheep", word_a: "ship", word_b: "sheep", ipa_a: "/ʃɪp/", ipa_b: "/ʃiːp/", note_id: "n", sort_order: 1 },
  { slug: "bad-bed", word_a: "bad", word_b: "bed", ipa_a: "/bæd/", ipa_b: "/bed/", note_id: "n", sort_order: 2 },
  { slug: "think-sink", word_a: "think", word_b: "sink", ipa_a: "/θɪŋk/", ipa_b: "/sɪŋk/", note_id: "n", sort_order: 3 },
];

test("parseL1Error & parseMinimalPair: baris sah dan rusak", () => {
  const ok = { slug: "agree", title: "t", wrong: "I am agree", right: "I agree", explanation_id: "e", cefr_level: "A1", sort_order: 2 };
  assert.equal(l1.parseL1Error(ok).slug, "agree");
  assert.equal(l1.parseL1Error({ ...ok, right: "" }), null);
  assert.equal(l1.parseL1Error({ ...ok, slug: "Bad Slug" }), null);
  assert.equal(l1.parseL1Error(null), null);
  assert.equal(l1.parseMinimalPair(pairs[0]).word_b, "sheep");
  assert.equal(l1.parseMinimalPair({ ...pairs[0], word_b: "SHIP" }), null); // kedua kata sama
  assert.equal(l1.parseMinimalPair({ ...pairs[0], ipa_a: "" }), null);
});

test("groupErrorsByLevel: per level, berurutan", () => {
  const e = (slug: string, cefr_level: string, sort_order: number) => ({ slug, title: slug, wrong: "a", right: "b", explanation_id: "x", cefr_level, sort_order });
  const grouped = l1.groupErrorsByLevel([e("c", "A2", 1), e("b", "A1", 2), e("a", "A1", 1)]);
  assert.deepEqual(grouped.map((x: { level: string }) => x.level), ["A1", "A2"]);
  assert.deepEqual(grouped[0].errors.map((x: { slug: string }) => x.slug), ["a", "b"]);
});

test("pickPairRounds: pasangan berbeda dulu, jumlah tepat, deterministik, kata sesuai sisi", () => {
  const rounds = l1.pickPairRounds(pairs, 3, s.mulberry32(11));
  assert.equal(rounds.length, 3);
  assert.equal(new Set(rounds.map((r: { pairSlug: string }) => r.pairSlug)).size, 3);
  assert.deepEqual(rounds, l1.pickPairRounds(pairs, 3, s.mulberry32(11)));
  for (const r of rounds) {
    const p = pairs.find((x) => x.slug === r.pairSlug)!;
    assert.equal(r.word, r.spoken === "a" ? p.word_a : p.word_b);
    assert.deepEqual([...r.options].sort(), [p.word_a, p.word_b].sort());
  }
  assert.equal(l1.pickPairRounds(pairs, 7, s.mulberry32(2)).length, 7);
  assert.deepEqual(l1.pickPairRounds([], 5, s.mulberry32(1)), []);
  assert.deepEqual(l1.pickPairRounds(pairs, 0, s.mulberry32(1)), []);
});

test("gradePairChoice", () => {
  assert.equal(l1.gradePairChoice({ word: "sheep" }, "sheep"), true);
  assert.equal(l1.gradePairChoice({ word: "sheep" }, " Sheep "), true);
  assert.equal(l1.gradePairChoice({ word: "sheep" }, "ship"), false);
});

test("tag helper", () => {
  assert.equal(l1.l1ErrorTag("agree"), "l1:agree");
  assert.equal(l1.pairTag("ship-sheep"), "mp:ship-sheep");
});

// ---- Seed migrasi 0014 ----
const sql = fs.readFileSync(path.join(repo, "supabase/migrations/0014_l1_modules.sql"), "utf8");
const unq = (t: string) => t.replace(/''/g, "'");
/** Memecah satu bagian "INSERT ... VALUES (...), (...)" menjadi baris berisi nilai teks/angka. */
function rowsOf(section: string): string[][] {
  const rows: string[][] = [];
  for (const line of section.split("\n")) {
    const m = line.match(/^\s*\((.*)\),?$/);
    if (!m) continue;
    const vals = [...m[1].matchAll(/'((?:[^']|'')*)'|(\d+)/g)].map((x) => unq(x[1] ?? x[2]));
    rows.push(vals);
  }
  return rows;
}
const section = (from: string, to: string) => sql.slice(sql.indexOf(from), sql.indexOf(to));

test("seed 0014: 16 kesalahan umum lolos parse dan memuat kalimat salah ≠ benar", () => {
  const rows = rowsOf(section("INSERT INTO l1_errors", "-- 5."));
  assert.equal(rows.length, 16);
  for (const [slug, title, wrong, right, explanation_id, cefr_level, sort_order] of rows) {
    const e = l1.parseL1Error({ slug, title, wrong, right, explanation_id, cefr_level, sort_order });
    assert.notEqual(e, null, slug);
    assert.notEqual(wrong, right, slug);
  }
});

test("seed 0014: 15 pasangan bunyi lolos parse", () => {
  const rows = rowsOf(section("INSERT INTO minimal_pairs", "-- 6."));
  assert.equal(rows.length, 15);
  for (const [slug, word_a, word_b, ipa_a, ipa_b, note_id, sort_order] of rows) {
    assert.notEqual(l1.parseMinimalPair({ slug, word_a, word_b, ipa_a, ipa_b, note_id, sort_order }), null, slug);
  }
});

test("seed 0014: soal pilihan ganda & dikte lolos validasi; tag sesuai", () => {
  const mcq = rowsOf(section("SELECT 'mcq'", "WHERE NOT EXISTS"));
  assert.equal(mcq.length, 16);
  for (const [cefr, tags, prompt, answer, explanation_id] of mcq) {
    const v = g.validateExerciseDraft({ type: "mcq", cefr_level: cefr, topic_slug: null, unit_slug: null, tags: tags.split(","), prompt: JSON.parse(prompt), answer: JSON.parse(answer), explanation_id });
    assert.equal(v.ok, true, `${tags}: ${v.error}`);
    assert.ok(tags.startsWith("l1-error,l1:"));
    assert.ok(course.cleanStep({ type: "exercise", tag: tags.split(",")[2] }) !== null, "tag unit valid untuk langkah kursus");
  }
  const dict = rowsOf(section("SELECT 'dictation'", "-- 7."));
  assert.equal(dict.length, 6);
  for (const [tags, prompt, answer, explanation_id] of dict) {
    const v = g.validateExerciseDraft({ type: "dictation", cefr_level: "A1", topic_slug: null, unit_slug: null, tags: tags.split(","), prompt: JSON.parse(prompt), answer: JSON.parse(answer), explanation_id });
    assert.equal(v.ok, true, `${tags}: ${v.error}`);
    assert.ok(tags.includes("minimal-pair"));
  }
});

test("seed 0014: tiap kesalahan terhubung ke unit yang ada di seed 0013", () => {
  const units = [...fs.readFileSync(path.join(repo, "supabase/migrations/0013_course_units.sql"), "utf8").matchAll(/^\s*\('([a-z-]+)', '[^']*', 'A[0-2]'/gm)].map((m) => m[1]);
  assert.equal(units.length, 12);
  const linked = [...sql.matchAll(/for:([a-z-]+)/g)].map((m) => m[1]);
  for (const u of linked) assert.ok(units.includes(u), u);
  assert.ok(linked.includes("bunyi-huruf"));
});

console.log(`\n${passed} lulus, 0 gagal`);
