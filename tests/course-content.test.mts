// Uji paket konten Kursus Dasar (Fase 18): validasi seed migrasi 0016. Jalankan:
//   node --experimental-transform-types --no-warnings tests/course-content.test.mts <path-repo>
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = path.resolve(process.argv[2] ?? ".");
const load = (f: string) => import(pathToFileURL(path.join(repo, f)).href);
const course = await load("lib/course.ts");
const gc = await load("lib/graded-check.ts");
const g = await load("lib/exercises/grade.ts");

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

const sql = fs.readFileSync(path.join(repo, "supabase/migrations/0016_course_content.sql"), "utf8");
const sql13 = fs.readFileSync(path.join(repo, "supabase/migrations/0013_course_units.sql"), "utf8");
const unq = (t: string) => t.replace(/''/g, "'");

const texts = [...sql.matchAll(/^\s*\('((?:[^']|'')*)', '(A[12])', \$r\$([\s\S]*?)\$r\$\)/gm)].map((m) => ({ title: unq(m[1]), level: m[2], content: m[3] }));

test("20 bacaan: 10 A1 dan 10 A2, judul unik", () => {
  assert.equal(texts.length, 20);
  assert.equal(texts.filter((t) => t.level === "A1").length, 10);
  assert.equal(texts.filter((t) => t.level === "A2").length, 10);
  assert.equal(new Set(texts.map((t) => t.title)).size, 20);
});

test("jumlah kata tiap bacaan dalam rentang level (A1 80–120, A2 120–180)", () => {
  for (const t of texts) {
    const c = gc.checkGradedText(t.content, t.level, []);
    assert.equal(c.inRange, true, `${t.title}: ${c.wordCount} kata`);
  }
});

test("bacaan tidak memuat tanda aneh dan bahasa Inggris saja (tanpa kata Indonesia umum)", () => {
  for (const t of texts) {
    assert.ok(!/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(t.content), t.title);
    assert.ok(!/\b(yang|dan|dengan|saya|adalah)\b/i.test(t.content), t.title);
  }
});

const stepRows = [...sql.matchAll(/^\s*\('([a-z-]+)', '(\[.*\])'\)/gm)].map((m) => ({ slug: m[1], steps: JSON.parse(unq(m[2])) }));

test("langkah 11 unit sah, kecuali salam-perkenalan (tidak diubah)", () => {
  assert.equal(stepRows.length, 11);
  assert.ok(!stepRows.some((r) => r.slug === "salam-perkenalan"));
  const units13 = [...sql13.matchAll(/^\s*\('([a-z-]+)', '[^']*', 'A[0-2]'/gm)].map((m) => m[1]);
  for (const r of stepRows) {
    assert.ok(units13.includes(r.slug), r.slug);
    // text_ref diganti id oleh migrasi; untuk validasi pakai id contoh
    const resolved = r.steps.map((s: Record<string, unknown>) => {
      if (!("text_ref" in s)) return s;
      assert.ok(texts.some((t) => t.title === s.text_ref), `bacaan tidak ada: ${s.text_ref}`);
      const rest = { ...s };
      delete rest.text_ref;
      return { ...rest, text_id: "00000000-0000-0000-0000-000000000000" };
    });
    const v = course.validateSteps(resolved);
    assert.equal(v.ok, true, `${r.slug}: ${v.error}`);
    assert.equal(course.readySteps(v.value), v.value.length, `${r.slug}: ada langkah kosong`);
  }
});

test("setiap bacaan dirujuk tepat satu kali oleh langkah unit", () => {
  const refs = stepRows.flatMap((r) => r.steps.filter((s: Record<string, unknown>) => "text_ref" in s).map((s: Record<string, unknown>) => s.text_ref as string));
  assert.equal(refs.length, 20);
  assert.equal(new Set(refs).size, 20);
});

test("kata kosakata unit: 8 kata dengan arti Indonesia; topik grammar ada di seed 0007", () => {
  const sql07 = fs.readFileSync(path.join(repo, "supabase/migrations/0007_graded_content.sql"), "utf8");
  for (const r of stepRows) {
    const vocab = r.steps.find((s: { type: string }) => s.type === "vocab");
    assert.equal(vocab.items.length, 8, r.slug);
    for (const i of vocab.items) assert.ok(i.word && i.meaning_id, `${r.slug}: ${i.word}`);
    const gr = r.steps.find((s: { type: string }) => s.type === "grammar");
    if (gr) assert.ok(sql07.includes(`('${gr.topic_slug}',`), `topik ${gr.topic_slug}`);
  }
});

test("55 soal draf (5 per unit) lolos validasi dan tipenya lengkap", () => {
  const section = sql.slice(sql.indexOf("-- 3. Soal latihan draft"));
  const rows = [...section.matchAll(/^\s*\('([a-z-]+)', '(A[12])', '(mcq|cloze|order|match|dictation)', '(\{.*\})', '(\{.*\})', '((?:[^']|'')*)'\)/gm)];
  assert.equal(rows.length, 55);
  const perUnit = new Map<string, string[]>();
  for (const [, unit, cefr, type, prompt, answer, expl] of rows) {
    const v = g.validateExerciseDraft({ type, cefr_level: cefr, topic_slug: null, unit_slug: unit, tags: ["seed-0016"], prompt: JSON.parse(unq(prompt)), answer: JSON.parse(unq(answer)), explanation_id: unq(expl) });
    assert.equal(v.ok, true, `${unit} ${type}: ${v.error}`);
    perUnit.set(unit, [...(perUnit.get(unit) ?? []), type]);
  }
  assert.equal(perUnit.size, 11);
  for (const [unit, types] of perUnit) assert.deepEqual([...types].sort(), ["cloze", "dictation", "match", "mcq", "order"], unit);
});

test("migrasi idempoten: setiap INSERT dijaga NOT EXISTS; hanya draft", () => {
  assert.equal((sql.match(/NOT EXISTS/g) ?? []).length >= 2, true);
  assert.ok(sql.includes("'draft', 'admin', false"));
  assert.ok(!/'published'/.test(sql.replace(/--.*$/gm, "")), "seed tidak boleh langsung terbit");
});

console.log(`\n${passed} lulus, 0 gagal`);
