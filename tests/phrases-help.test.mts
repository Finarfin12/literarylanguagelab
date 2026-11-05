// Uji Fase 22.3-22.5: bantuan Dialogue Simulator, frasa harian (lib + migrasi 0021), dan kosakata per tema (0022 + CSV).
// Jalankan:
//   node --experimental-transform-types --no-warnings tests/phrases-help.test.mts <path-repo>
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = path.resolve(process.argv[2] ?? ".");
const load = (f: string) => import(pathToFileURL(path.join(repo, f)).href);
const help = await load("lib/dialogue-help.ts");
const ph = await load("lib/phrases.ts");
const th = await load("lib/core-themes.ts");
const a0 = await load("scripts/lib/a0-enrich.mjs");
const g = await load("lib/exercises/grade.ts");

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}
const read = (p: string) => fs.readFileSync(path.join(repo, p), "utf8");

// --- 22.3 Bantuan Dialogue Simulator ---
const scenarioSrc = read("lib/dialogue-scenarios.ts");
const scenarioIds = [...scenarioSrc.matchAll(/^\s*id:\s*"([^"]+)"/gm)].map((m) => m[1]);
const hintPhrases = (id: string) => {
  const block = scenarioSrc.slice(scenarioSrc.indexOf(`id: "${id}"`));
  const m = block.match(/hintPhrases:\s*\[([^\]]*)\]/);
  return [...(m?.[1] ?? "").matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((x) => x[1].replace(/\\"/g, '"'));
};

test("setiap skenario punya bantuan: arti untuk semua frasa bantuan dan 2-3 awalan kalimat", () => {
  assert.ok(scenarioIds.length >= 8);
  for (const id of scenarioIds) {
    const h = help.helpFor(id);
    assert.ok(h, `bantuan untuk ${id} tidak ada`);
    for (const phrase of hintPhrases(id)) assert.ok(help.phraseMeaning(id, phrase), `${id}: arti untuk "${phrase}"`);
    assert.ok(h.starters.length >= 2 && h.starters.length <= 3, `${id}: awalan kalimat`);
    for (const s of h.starters) assert.ok(/[A-Za-z]/.test(s) && s.length <= 60, `${id}: ${s}`);
  }
  assert.equal(help.helpFor("tidak-ada"), null);
  assert.equal(help.phraseMeaning("ordering-coffee", "bukan frasa"), null);
});

test("sakelar Bantuan pemula: bawaan menyala hanya untuk A1; pilihan tersimpan menang", () => {
  assert.equal(help.beginnerHelpDefault("A1"), true);
  for (const l of ["A2", "B1", "C2", null, undefined]) assert.equal(help.beginnerHelpDefault(l as string | null), false);
  assert.equal(help.resolveBeginnerHelp("off", "A1"), false);
  assert.equal(help.resolveBeginnerHelp("on", "B2"), true);
  assert.equal(help.resolveBeginnerHelp(null, "A1"), true);
  assert.equal(help.resolveBeginnerHelp("rusak", "B2"), false);
});

test("route terjemahan memakai guardAIRoute dan membatasi panjang teks", () => {
  const src = read("app/api/dialogue-simulator/translate/route.ts");
  assert.match(src, /guardAIRoute\(/);
  assert.match(src, /MAX_TRANSLATE_CHARS/);
  assert.ok(help.MAX_TRANSLATE_CHARS <= 1000);
});

test("halaman simulator: perilaku lama tetap saat bantuan mati (frasa dan input tidak diubah)", () => {
  const page = read("app/(dashboard)/english-lab/dialogue-simulator/page.tsx");
  assert.match(page, /beginnerHelp && phraseMeaning/);
  assert.match(page, /beginnerHelp && \(helpFor/);
  assert.match(page, /msg\.role === "assistant" && beginnerHelp/);
  assert.match(page, /onClick=\{\(\) => setInputText\(h\)\}/);
});

// --- 22.4 Frasa harian ---
const sql21 = read("supabase/migrations/0021_daily_phrases.sql");
const code21 = sql21.replace(/^--.*$/gm, "");
const unq = (t: string) => t.replace(/''/g, "'");
const rows = [...code21.matchAll(/^\s*\('([a-z0-9-]+)', '([a-z-]+)', '((?:[^']|'')*)', '((?:[^']|'')*)', '((?:[^']|'')*)', (\d+)\)/gm)].map((m) => ({
  slug: m[1],
  situation: m[2],
  text_en: unq(m[3]),
  text_id: unq(m[4]),
  literal_id: unq(m[5]),
  sort_order: Number(m[6]),
}));

test("30 frasa awal untuk 6 situasi, 5 per situasi, semuanya draft dan lolos validasi", () => {
  assert.equal(rows.length, 30);
  assert.equal(new Set(rows.map((r) => r.slug)).size, 30);
  for (const s of ph.PHRASE_SITUATIONS) assert.equal(rows.filter((r) => r.situation === s.id).length, 5, s.id);
  for (const r of rows) {
    const v = ph.cleanPhrase(r);
    assert.equal(v.ok, true, `${r.slug}: ${v.error}`);
    assert.ok(r.literal_id, `${r.slug}: arti kata per kata`);
  }
  // Bagian seed (INSERT) hanya boleh berstatus draft
  const seed = code21.slice(code21.indexOf("INSERT INTO daily_phrases"));
  assert.ok(!/'published'/.test(seed), "seed tidak boleh langsung terbit");
  assert.match(seed, /SELECT v\.slug[^;]*'draft'/);
});

test("migrasi 0021: RLS, idempoten, dan tipe soal pattern", () => {
  assert.match(code21, /ENABLE ROW LEVEL SECURITY/);
  assert.match(code21, /CREATE TABLE IF NOT EXISTS daily_phrases/);
  assert.match(code21, /public\.is_admin\(\)/);
  assert.match(code21, /WHERE NOT EXISTS \(SELECT 1 FROM daily_phrases\)/);
  assert.match(code21, /'dictation', 'pattern'/);
  assert.match(code21, /to_regclass\('public\.exercises'\)/);
});

test("4 soal penyusun kalimat awal (draft) lolos validasi dan bisa dijawab benar", () => {
  const section = code21.slice(code21.indexOf("-- 4. Soal penyusun") >= 0 ? code21.indexOf("INSERT INTO exercises") : 0);
  const items = [...section.matchAll(/\('([a-z-]+)',\s*'(\{[^\n]*?\})',\s*'(\{[^\n]*?\})',\s*'((?:[^']|'')*)'\)/g)];
  assert.equal(items.length, 4);
  const units = new Set<string>();
  for (const [, unit, prompt, answer, expl] of items) {
    units.add(unit);
    const draft = { type: "pattern", cefr_level: "A1", topic_slug: null, unit_slug: unit, tags: ["seed-0021", "pattern"], prompt: JSON.parse(prompt), answer: JSON.parse(answer), explanation_id: unq(expl) };
    const v = g.validateExerciseDraft(draft);
    assert.equal(v.ok, true, `${unit}: ${v.error}`);
    // jawaban benar tersusun dari pilihan yang tersedia dan dinilai benar
    const target = v.value.answer.sentences[0] as string;
    const subj = v.value.prompt.subjects.find((s: { text: string }) => target.startsWith(s.text + " "));
    assert.ok(subj, target);
    assert.ok(/eats|drink|am|is/.test(target));
  }
  assert.deepEqual([...units].sort(), ["rutinitas-harian", "salam-perkenalan"]);
});

test("cleanPhrase menolak masukan rusak; groupPhrases mengurutkan situasi dan frasa", () => {
  assert.equal(ph.cleanPhrase({ slug: "X!", situation: "salam", text_en: "a", text_id: "b" }).ok, false);
  assert.equal(ph.cleanPhrase({ slug: "ok-slug", situation: "tidak-ada", text_en: "a", text_id: "b" }).ok, false);
  assert.equal(ph.cleanPhrase({ slug: "ok-slug", situation: "salam", text_en: "", text_id: "b" }).ok, false);
  assert.equal(ph.cleanPhrase({ slug: "ok-slug", situation: "salam", text_en: "Hi", text_id: "Halo", sort_order: -1 }).ok, false);
  const ok = ph.cleanPhrase({ slug: " Ok-Slug ", situation: "salam", text_en: " Hi ", text_id: "Halo" });
  assert.equal(ok.ok, true);
  assert.equal(ok.value.slug, "ok-slug");
  assert.equal(ok.value.literal_id, null);
  const groups = ph.groupPhrases([
    { situation: "darurat", sort_order: 2, id: 1 },
    { situation: "salam", sort_order: 2, id: 2 },
    { situation: "salam", sort_order: 1, id: 3 },
  ]);
  assert.deepEqual(groups.map((x: { id: string }) => x.id), ["salam", "darurat"]);
  assert.deepEqual(groups[0].phrases.map((x: { id: number }) => x.id), [3, 2]);
  assert.deepEqual(ph.phraseToVocabulary({ text_en: "  How   are you? ", text_id: " Apa kabar? " }), { word: "How are you?", definition: "Apa kabar?" });
});

test("Frasa harian terdaftar di Ruang I dan punya nama, tanpa AI", () => {
  const rooms = read("lib/rooms.ts");
  assert.match(rooms, /paths: \["\/frasa-harian"\]/);
  assert.match(rooms, /"\/frasa-harian": \{ name: "Frasa harian"/);
  for (const f of ["app/(dashboard)/frasa-harian/page.tsx", "app/(dashboard)/frasa-harian/actions.ts", "app/(dashboard)/admin/phrase-actions.ts"]) {
    assert.ok(!/runAI|openai|groq/i.test(read(f)), `${f} tidak boleh memakai AI`);
  }
  assert.match(read("app/(dashboard)/admin/phrase-actions.ts"), /assertAdmin\(\)/);
  assert.match(read("app/(dashboard)/admin/phrase-actions.ts"), /logAdminAction/);
});

// --- 22.5 Kosakata per tema ---
test("parseThemeCsv: baris sah, masalah dilaporkan, kata kembar dilewati", () => {
  const csv = "word,theme,translation_id\nmother,keluarga,ibu\nWater,makanan-minuman,air\nmother,keluarga,ibu lagi\nbad word!,keluarga,x\nfather,Keluarga Besar,ayah\nbrother,keluarga,\n,,\n";
  const r = a0.parseThemeCsv(csv);
  assert.deepEqual(r.rows.map((x: { word: string }) => x.word), ["mother", "water"]);
  assert.equal(r.rows[1].theme, "makanan-minuman");
  assert.equal(r.errors.length, 4);
  assert.match(r.errors.join("\n"), /sudah muncul sebelumnya/);
  assert.equal(a0.parseThemeCsv("a,b\n1,2").rows.length, 0);
  assert.match(a0.parseThemeCsv("a,b\n1,2").errors[0], /Header/);
  assert.equal(a0.parseThemeCsv("").rows.length, 0);
});

test("buildThemeUpdates: hanya kata yang ada di core_words (tidak pernah INSERT)", () => {
  const { rows } = a0.parseThemeCsv("word,theme,translation_id\nmother,keluarga,ibu\nzzyzx,keluarga,tidak ada\nwater,minuman,air\n");
  const r = a0.buildThemeUpdates(["Mother", "water", "book"], rows);
  assert.deepEqual(r.updates.map((u: { word: string }) => u.word), ["mother", "water"]);
  assert.deepEqual(r.notInCore, ["zzyzx"]);
  assert.deepEqual(r.themes, { keluarga: 1, minuman: 1 });
  const script = read("scripts/enrich-a0.mjs").replace(/^\s*\/\/.*$/gm, "");
  assert.ok(!/\.insert\(|\.upsert\(/.test(script), "skrip hanya UPDATE");
  assert.match(script, /\.update\(patch\)/);
});

test("tema: label, penghitungan, dan migrasi 0022", () => {
  assert.equal(th.themeLabel("makanan-minuman"), "Makanan minuman");
  assert.deepEqual(th.countThemes([{ theme: "b" }, { theme: "a" }, { theme: "b" }, { theme: null }]).map((t: { slug: string; count: number }) => [t.slug, t.count]), [["b", 2], ["a", 1]]);
  assert.deepEqual(th.countThemes([]), []);
  const sql = read("supabase/migrations/0022_core_words_a0.sql").replace(/^--.*$/gm, "");
  assert.match(sql, /ADD COLUMN IF NOT EXISTS translation_id TEXT/);
  assert.match(sql, /ADD COLUMN IF NOT EXISTS theme TEXT/);
  assert.match(sql, /CREATE INDEX IF NOT EXISTS/);
  assert.ok(!/DROP|DELETE/i.test(sql));
  // urutan frekuensi tetap bawaan: tampilan tema juga diurutkan per band
  assert.match(read("app/(dashboard)/vocabulary/core/ThemeView.tsx"), /order\("band", \{ ascending: true \}\)/);
});

// --- 22.2 satu kali lagi: soal bunyi-huruf bertag minimal-pair tidak ditoleransi ---
test("dikte pasangan bunyi (tag minimal-pair) tetap ketat", () => {
  const ex = { type: "dictation", prompt: { text: "sheep" }, answer: { accept: ["sheep"] }, tags: ["minimal-pair"] };
  assert.equal(g.gradeAnswer(ex, { text: "ship" }).correct, false);
  assert.equal(g.gradeAnswer(ex, { text: "sheep" }).correct, true);
});

console.log(`\n${passed} lulus, 0 gagal`);
