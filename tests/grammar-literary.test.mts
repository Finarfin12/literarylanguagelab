// Uji migrasi 0025 (topik grammar B2-C1 bertema sastra, Fase 29 item 4): bentuk topik, contoh, dan soal draft sah menurut
// validator mesin latihan. Jalankan:
//   node --experimental-transform-types --no-warnings tests/grammar-literary.test.mts <path-repo>
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = path.resolve(process.argv[2] ?? ".");
const g = await import(pathToFileURL(path.join(repo, "lib/exercises/grade.ts")).href);
const sql = fs.readFileSync(path.join(repo, "supabase/migrations/0025_grammar_literary.sql"), "utf8");

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

const SLUGS = ["inversion-for-emphasis", "subjunctive-mood", "participle-clauses"];

// Topik: ('slug', 'Judul', 'C1', 21, 'ringkasan', '[...]'::jsonb)
const topicRe = /\('([a-z0-9-]+)', '([^'\n]+)', '(C1|B2)', (\d+),\s*'([^'\n]+)',\s*'(\[[^\n]*\])'::jsonb\)/g;
const topics = [...sql.matchAll(topicRe)].map((m) => ({
  slug: m[1],
  title: m[2],
  level: m[3],
  order: Number(m[4]),
  summary: m[5],
  examples: JSON.parse(m[6]) as { en: string; id: string }[],
}));

// Soal: ('mcq', 'C1', 'slug', '{prompt}', '{answer}', 'penjelasan')
const exRe = /\('(mcq|cloze|order|match)', '(C1|B2)', '([a-z0-9-]+)',\s*'(\{[^\n]*\})',\s*'(\{[^\n]*\})',\s*'([^\n]*)'\)/g;
const exercises = [...sql.matchAll(exRe)].map((m) => ({
  type: m[1],
  cefr_level: m[2],
  topic_slug: m[3],
  prompt: JSON.parse(m[4]),
  answer: JSON.parse(m[5]),
  explanation_id: m[6],
  tags: ["grammar-sastra"],
}));

test("tiga topik: slug, level C1/B2, urutan setelah 20 topik dasar, tanpa duplikat", () => {
  assert.deepEqual(topics.map((t) => t.slug), SLUGS);
  assert.deepEqual(topics.map((t) => t.order), [21, 22, 23]);
  for (const t of topics) {
    assert.ok(["B2", "C1"].includes(t.level), t.slug);
    assert.ok(t.title.length > 5, t.slug);
  }
});

test("ringkasan Indonesia memadai dan tiap topik punya 4 contoh en/id yang terisi", () => {
  for (const t of topics) {
    assert.ok(t.summary.length >= 300, `${t.slug}: ringkasan ${t.summary.length} karakter`);
    assert.equal(t.examples.length, 4, t.slug);
    for (const ex of t.examples) {
      assert.ok(ex.en.trim().length > 10 && ex.id.trim().length > 10, `${t.slug}: ${ex.en}`);
    }
  }
});

test("lima soal per topik, semua sah menurut validateExerciseDraft", () => {
  for (const slug of SLUGS) {
    const own = exercises.filter((e) => e.topic_slug === slug);
    assert.equal(own.length, 5, slug);
    assert.ok(new Set(own.map((e) => e.type)).size >= 3, `${slug}: tipe soal harus beragam`);
  }
  assert.equal(exercises.length, 15);
  for (const e of exercises) {
    const v = g.validateExerciseDraft(e);
    assert.ok(v.ok, `${e.topic_slug}: ${JSON.stringify(e.prompt)} -> ${v.error}`);
  }
});

test("soal pilihan ganda: jawaban benar ada di pilihan dan pilihan tidak kembar", () => {
  for (const e of exercises.filter((x) => x.type === "mcq")) {
    const opts: string[] = e.prompt.options;
    assert.equal(new Set(opts).size, opts.length, e.prompt.question);
    assert.ok(opts.includes(e.answer.correct), e.prompt.question);
  }
});

test("soal urutan: token yang diacak membentuk kalimat jawaban", () => {
  for (const e of exercises.filter((x) => x.type === "order")) {
    const tokens: string[] = e.prompt.tokens;
    const sentence: string = e.answer.sentences[0];
    const words = sentence.replace(/([,.])/g, " $1 ").split(/\s+/).filter(Boolean);
    assert.deepEqual([...tokens].sort(), [...words].sort(), sentence);
    assert.notDeepEqual(tokens, words, `token harus diacak: ${sentence}`);
  }
});

test("migrasi: idempoten, soal berstatus draft, dan berisi ROLLBACK", () => {
  assert.match(sql, /ON CONFLICT \(slug\) DO NOTHING/);
  assert.match(sql, /NOT EXISTS \(SELECT 1 FROM exercises x WHERE x\.topic_slug = e\.topic AND 'grammar-sastra' = ANY \(x\.tags\)\)/);
  assert.match(sql, /'draft', 'admin'/);
  assert.ok(!/'published'/.test(sql.split("-- 2.")[1]), "soal tidak boleh langsung terbit");
  assert.match(sql, /ROLLBACK/);
});

test("halaman dan menu tidak lagi mengklaim hanya A1-B1 atau tepat 20 topik", () => {
  const page = fs.readFileSync(path.join(repo, "app/(dashboard)/english-lab/grammar/page.tsx"), "utf8");
  const menu = fs.readFileSync(path.join(repo, "lib/menu-config.ts"), "utf8");
  assert.ok(!/A1 sampai B1/.test(page));
  assert.ok(!/20 topik grammar A1-B1/.test(menu));
});

console.log(`\n${passed} lulus, 0 gagal`);
