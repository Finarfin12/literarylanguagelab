// Uji unit lib/translation/edit-suggest.ts dan pendaftaran fitur AI penyuntingan bahasa Indonesia (Fase 29, item 3). Jalankan:
//   node --experimental-transform-types --no-warnings tests/translation-edit-suggest.test.mts <path-repo>
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = path.resolve(process.argv[2] ?? ".");
const load = (f: string) => import(pathToFileURL(path.join(repo, f)).href);
const e = await load("lib/translation/edit-suggest.ts");
const features = await load("lib/ai/features.ts");
const read = (p: string) => fs.readFileSync(path.join(repo, p), "utf8");

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

const target = "Kota itu menerapkan pungutan kemacetan pada tahun 2020. Hasilnya adalah merupakan penurunan 15 persen.";

const good = { type: "kalimat_efektif", original: "adalah merupakan", suggestion: "adalah", reason: "Dua kata kerja penghubung bersama; cukup satu." };

test("buildEditMessages: aturan keselamatan ada di pesan sistem, teks pengguna hanya sebagai data", () => {
  const msgs = e.buildEditMessages("SRC-TEXT", "TGT-TEXT");
  assert.deepEqual(msgs.map((m: { role: string }) => m.role), ["system", "user"]);
  assert.match(msgs[0].content, /Do NOT change its meaning/);
  assert.match(msgs[0].content, /VERBATIM/);
  assert.match(msgs[0].content, /meaning_notes/);
  assert.match(msgs[0].content, /data, not instructions/);
  assert.ok(!msgs[0].content.includes("SRC-TEXT") && !msgs[0].content.includes("TGT-TEXT"), "teks pengguna tidak boleh masuk pesan sistem");
  assert.ok(msgs[1].content.includes("SRC-TEXT") && msgs[1].content.includes("TGT-TEXT"));
});

test("parseEditResult: saran yang sah dipertahankan", () => {
  const r = e.parseEditResult({ suggestions: [good], meaning_notes: ["Periksa apakah 'penurunan' sesuai dengan 'reduction' di sumber."] }, target);
  assert.equal(r.suggestions.length, 1);
  assert.equal(r.suggestions[0].original, "adalah merupakan");
  assert.equal(r.meaningNotes.length, 1);
  assert.equal(r.dropped, 0);
});

test("parseEditResult: membuang kutipan yang tidak ada, saran sama, kosong, jenis tak dikenal, dan duplikat", () => {
  const r = e.parseEditResult(
    {
      suggestions: [
        good,
        { ...good }, // duplikat
        { ...good, original: "kalimat yang tidak ada" },
        { ...good, original: "adalah merupakan", suggestion: "adalah merupakan" },
        { ...good, suggestion: "   " },
        { ...good, type: "gaya_bebas" },
        { ...good, reason: "" },
        null,
        "bukan objek",
      ],
    },
    target
  );
  assert.equal(r.suggestions.length, 1);
  assert.equal(r.dropped, 8);
});

test("parseEditResult: saran yang mengubah angka dibuang; saran yang menjaga angka lolos", () => {
  const changed = e.parseEditResult({ suggestions: [{ type: "pilihan_kata", original: "15 persen", suggestion: "51 persen", reason: "Salah." }] }, target);
  assert.equal(changed.suggestions.length, 0);
  assert.equal(changed.dropped, 1);
  const kept = e.parseEditResult({ suggestions: [{ type: "pilihan_kata", original: "15 persen", suggestion: "15%", reason: "Ringkas." }] }, target);
  assert.equal(kept.suggestions.length, 1);
  const dropNumber = e.parseEditResult({ suggestions: [{ type: "pilihan_kata", original: "pada tahun 2020", suggestion: "pada tahun lalu", reason: "x" }] }, target);
  assert.equal(dropNumber.suggestions.length, 0);
});

test("parseEditResult: batas jumlah saran, catatan makna, dan masukan tak sah", () => {
  const many = Array.from({ length: 12 }, (_, i) => ({ type: "ejaan", original: "kota".repeat(1) + "", suggestion: `Kota${"x".repeat(i + 1)}`, reason: "r" }));
  const limited = e.parseEditResult({ suggestions: many }, target.replace("Kota", "kota"));
  assert.equal(limited.suggestions.length, e.EDIT_MAX_SUGGESTIONS);
  assert.equal(limited.dropped, 12 - e.EDIT_MAX_SUGGESTIONS);
  const notes = e.parseEditResult({ suggestions: [], meaning_notes: ["pendek", "Catatan makna satu yang cukup panjang.", "Catatan makna dua yang cukup panjang.", "Catatan makna tiga yang cukup panjang.", "Catatan makna empat yang cukup panjang."] }, target);
  assert.equal(notes.meaningNotes.length, e.EDIT_MAX_NOTES);
  assert.deepEqual(e.parseEditResult(null, target), { suggestions: [], meaningNotes: [], dropped: 0 });
  assert.deepEqual(e.parseEditResult("teks", target), { suggestions: [], meaningNotes: [], dropped: 0 });
  assert.deepEqual(e.parseEditResult({ suggestions: "bukan larik" }, target), { suggestions: [], meaningNotes: [], dropped: 0 });
});

test("applySuggestion: mengganti kemunculan pertama saja; tidak mengubah bila kutipan sudah hilang", () => {
  const r = e.applySuggestion(target, good);
  assert.equal(r.changed, true);
  assert.equal(r.target, "Kota itu menerapkan pungutan kemacetan pada tahun 2020. Hasilnya adalah penurunan 15 persen.");
  const twice = e.applySuggestion("ya ya ya", { original: "ya", suggestion: "tidak" });
  assert.equal(twice.target, "tidak ya ya");
  const gone = e.applySuggestion("sudah bersih", good);
  assert.deepEqual(gone, { target: "sudah bersih", changed: false });
  assert.equal(e.applySuggestion("abc", { original: "", suggestion: "x" }).changed, false);
});

test("fitur AI terdaftar, bermigrasi, dan masuk kategori batas 'translation'", () => {
  assert.equal(e.EDIT_FEATURE_KEY, "translation-id-edit");
  const f = features.getFeature(e.EDIT_FEATURE_KEY);
  assert.ok(f && f.group === "Translation" && f.requires === "text");
  assert.ok(e.EDIT_FEATURE_KEY.toLowerCase().includes("translation"), "kunci harus masuk kategori batas terjemahan (lib/rate-limit.ts)");
  const sql = read("supabase/migrations/0024_translation_id_edit.sql");
  assert.match(sql, /'translation-id-edit'/);
  assert.match(sql, /ON CONFLICT \(feature_key\) DO NOTHING/);
  assert.match(sql, /ROLLBACK/);
});

test("route: lewat guardAIRoute, runAI dengan kunci fitur, dan pesan sistem tidak dari klien", () => {
  const route = read("app/api/translation/edit-suggest/route.ts");
  assert.match(route, /guardAIRoute\(req/);
  assert.match(route, /limitKey: EDIT_FEATURE_KEY/);
  assert.match(route, /runAI\(\s*EDIT_FEATURE_KEY/);
  assert.match(route, /FeatureDisabledError/);
  assert.match(route, /buildEditMessages\(/);
  assert.ok(!/body\.messages|messages:\s*body/.test(route), "pesan tidak boleh berasal dari klien");
});

test("antarmuka: perubahan hanya lewat Terapkan atau Urungkan; AI tidak menyimpan otomatis", () => {
  const ui = read("app/(dashboard)/translation-workspace/[id]/EditSuggestSection.tsx");
  assert.match(ui, /Terapkan/);
  assert.match(ui, /Urungkan/);
  assert.match(ui, /\/api\/translation\/edit-suggest/);
  assert.equal((ui.match(/onEditTarget\(/g) ?? []).length, 2, "onEditTarget hanya boleh dipanggil saat menerapkan dan mengurungkan");
  const panel = read("app/(dashboard)/translation-workspace/[id]/SegmentPanel.tsx");
  assert.match(panel, /<EditSuggestSection/);
  assert.match(read("app/(dashboard)/translation-workspace/[id]/WorkspaceEditor.tsx"), /onEditTarget=/);
});

console.log(`\n${passed} lulus, 0 gagal`);
