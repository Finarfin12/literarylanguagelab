// Uji isi migrasi 0020 (Fase 21): unit pemula `bunyi-huruf` dan `salam-perkenalan`. Jalankan:
//   node --experimental-transform-types --no-warnings tests/beginner-units.test.mts <path-repo>
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = path.resolve(process.argv[2] ?? ".");
const load = (f: string) => import(pathToFileURL(path.join(repo, f)).href);
const course = await load("lib/course.ts");
const g = await load("lib/exercises/grade.ts");

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

const sql = fs.readFileSync(path.join(repo, "supabase/migrations/0020_beginner_units.sql"), "utf8");
const code = sql.replace(/^--.*$/gm, "");
const blocks = [...sql.matchAll(/\$j\$([\s\S]*?)\$j\$::jsonb/g)].map((m) => JSON.parse(m[1]));

test("dua unit: bunyi-huruf dan salam-perkenalan, langkah sah dan tidak ada yang kosong", () => {
  assert.equal(blocks.length, 2);
  for (const steps of blocks) {
    const v = course.validateSteps(steps);
    assert.equal(v.ok, true, v.error);
    assert.equal(course.readySteps(v.value), v.value.length, "ada langkah kosong");
  }
});

test("bunyi-huruf mencakup th, v/f, sh/s, huruf bisu, mengeja nama, bacaan, latihan, dan ucapan", () => {
  const steps = blocks[0];
  const titles = steps.map((s: { title?: string }) => (s.title ?? "").toLowerCase()).join(" | ");
  for (const needle of ["th", "v dan f", "sh dan s", "tidak dibunyikan", "mengeja nama", "bacaan", "latihan", "ucapkan"]) {
    assert.ok(titles.includes(needle), `langkah "${needle}" tidak ada`);
  }
  const types = new Set(steps.map((s: { type: string }) => s.type));
  for (const t of ["vocab", "listen", "read", "exercise", "speak"]) assert.ok(types.has(t), t);
  // Tanpa panggilan AI: semua isi ada di seed
  assert.ok(!/runAI|openai|groq/i.test(sql));
});

test("kata bunyi asing memakai reading_aid dan arti Indonesia; audio tetap acuan", () => {
  const vocab = blocks[0].filter((s: { type: string }) => s.type === "vocab");
  assert.ok(vocab.length >= 4);
  for (const s of vocab) {
    for (const i of s.items) {
      assert.ok(i.meaning_id, `${i.word}: arti kosong`);
      assert.ok(i.reading_aid && i.reading_aid.length <= 60, `${i.word}: cara baca`);
    }
  }
  const words = course.unitVocabEntries(course.parseSteps(blocks[0])).map((e: { word: string }) => e.word);
  for (const w of ["think", "very", "ship", "knee", "write"]) assert.ok(words.includes(w), w);
  // Catatan wajib: cara baca hanya perkiraan
  assert.ok(/audio/i.test(sql) && /perkiraan/i.test(sql));
});

test("kata unit tidak mencampur nama huruf (tombol Simpan ke Review tidak mengotori Review)", () => {
  const words = course.unitVocabEntries(course.parseSteps(blocks[0])).map((e: { word: string }) => e.word);
  assert.ok(words.every((w: string) => w.length > 1), "kata satu huruf tidak boleh masuk daftar kata");
});

test("salam-perkenalan: cara baca perkiraan, dua langkah dengar, kalimat ucap", () => {
  const steps = blocks[1];
  const vocab = steps.find((s: { type: string }) => s.type === "vocab");
  assert.equal(vocab.items.length, 8);
  for (const i of vocab.items) assert.ok(i.reading_aid, i.word);
  assert.equal(steps.filter((s: { type: string }) => s.type === "listen").length, 2);
  assert.ok(steps.find((s: { type: string }) => s.type === "speak").sentences.length >= 4);
});

test("tujuh soal draf bunyi-huruf lolos validasi dan beragam", () => {
  const rows = [...code.matchAll(/^\s*\('(mcq|cloze|order|match|dictation)', '(\{.*?\})', '(\{.*?\})', '((?:[^']|'')*)'\)/gm)];
  assert.equal(rows.length, 7);
  const types = new Set<string>();
  for (const [, type, prompt, answer, expl] of rows) {
    const un = (t: string) => t.replace(/''/g, "'");
    const v = g.validateExerciseDraft({
      type,
      cefr_level: "A1",
      topic_slug: null,
      unit_slug: "bunyi-huruf",
      tags: ["seed-0020"],
      prompt: JSON.parse(un(prompt)),
      answer: JSON.parse(un(answer)),
      explanation_id: un(expl),
    });
    assert.equal(v.ok, true, `${type}: ${v.error}`);
    types.add(type);
  }
  assert.equal(types.size, 5);
});

test("migrasi idempoten dan aman: tidak menimpa suntingan, soal hanya draft, tidak ada penerbitan", () => {
  assert.match(code, /position\('reading_aid' IN steps::text\) = 0/);
  assert.match(code, /IF EXISTS \(SELECT 1 FROM exercises WHERE unit_slug = 'bunyi-huruf' AND tags @> ARRAY\['seed-0020'\]\)/);
  assert.ok(code.includes("'draft', 'admin'"));
  assert.ok(!/status = 'published'|'published'/.test(code), "seed tidak boleh menerbitkan");
  assert.match(code, /to_regclass\('public\.course_units'\)/);
});

console.log(`\n${passed} lulus, 0 gagal`);
