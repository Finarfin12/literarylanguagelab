// Uji unit lib/reading-drill.ts dan pendaftaran halaman latihan skimming/scanning (Fase 29, item 1). Jalankan:
//   node --experimental-transform-types --no-warnings tests/reading-drill.test.mts <path-repo>
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = path.resolve(process.argv[2] ?? ".");
const load = (f: string) => import(pathToFileURL(path.join(repo, f)).href);
const d = await load("lib/reading-drill.ts");
const rooms = await load("lib/rooms.ts");
const read = (p: string) => fs.readFileSync(path.join(repo, p), "utf8");

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

test("teks latihan: id unik, level sah, panjang wajar, paragraf 3-6", () => {
  const ids = d.READING_TEXTS.map((t: { id: string }) => t.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.length >= 4);
  for (const t of d.READING_TEXTS) {
    assert.ok(["B1", "B2", "C1"].includes(t.level), t.id);
    const words = d.textWordCount(t);
    assert.ok(words >= 120 && words <= 300, `${t.id}: ${words} kata`);
    assert.ok(t.paragraphs.length >= 3 && t.paragraphs.length <= 6, t.id);
  }
});

test("soal skimming: 4 pilihan, tepat satu jawaban, ada penjelasan Indonesia", () => {
  for (const t of d.READING_TEXTS) {
    assert.ok(t.skim.length >= 2, t.id);
    for (const q of t.skim) {
      assert.equal(q.options.length, 4, `${t.id}: ${q.question}`);
      assert.equal(new Set(q.options).size, 4);
      assert.ok(Number.isInteger(q.correct) && q.correct >= 0 && q.correct < 4);
      assert.ok(q.explanation_id.length > 20);
    }
  }
});

test("soal scanning: paragraf sah dan jawaban muncul harfiah di paragraf itu", () => {
  for (const t of d.READING_TEXTS) {
    assert.ok(t.scan.length >= 3, t.id);
    for (const q of t.scan) {
      assert.ok(q.paragraph >= 0 && q.paragraph < t.paragraphs.length, `${t.id}: ${q.question}`);
      assert.ok(t.paragraphs[q.paragraph].toLowerCase().includes(q.answer.toLowerCase()), `${t.id}: "${q.answer}" tidak ada di paragraf ${q.paragraph}`);
    }
  }
});

test("jawaban scanning tidak ambigu: tidak muncul di paragraf lain sebagai frasa utuh", () => {
  for (const t of d.READING_TEXTS) {
    for (const q of t.scan) {
      // jawaban pendek ("nine", "meaning") boleh muncul di paragraf lain sebagai bagian kata lain; yang diperiksa hanya frasa >= 2 kata
      if (!q.answer.includes(" ")) continue;
      t.paragraphs.forEach((p: string, i: number) => {
        if (i !== q.paragraph) assert.ok(!p.toLowerCase().includes(q.answer.toLowerCase()), `${t.id}: "${q.answer}" juga di paragraf ${i}`);
      });
    }
  }
});

test("gradeSkim dan gradeScan: benar, salah, dan masukan tak sah", () => {
  const t = d.getReadingText("night-market");
  assert.ok(d.gradeSkim(t.skim[0], 0));
  assert.ok(!d.gradeSkim(t.skim[0], 2));
  assert.ok(!d.gradeSkim(t.skim[0], 0.5));
  assert.ok(d.gradeScan(t.scan[0], 0));
  assert.ok(!d.gradeScan(t.scan[0], 1));
  assert.ok(!d.gradeScan(t.scan[0], NaN));
  assert.equal(d.getReadingText("tidak-ada"), undefined);
});

test("formatElapsed, wordsPerMinute, dan timerStatus", () => {
  assert.equal(d.formatElapsed(0), "0:00");
  assert.equal(d.formatElapsed(65), "1:05");
  assert.equal(d.formatElapsed(600), "10:00");
  assert.equal(d.formatElapsed(-4), "0:00");
  assert.equal(d.formatElapsed(NaN), "0:00");
  assert.equal(d.wordsPerMinute(200, 60), 200);
  assert.equal(d.wordsPerMinute(180, 30), 360);
  assert.equal(d.wordsPerMinute(200, 0), null);
  assert.equal(d.wordsPerMinute(0, 30), null);
  assert.equal(d.timerStatus(59, 60), "dalam-target");
  assert.equal(d.timerStatus(60, 60), "dalam-target");
  assert.equal(d.timerStatus(61, 60), "melewati-target");
});

test("summarizeScan: benar, total, dan rata-rata waktu hanya dari yang bertimer", () => {
  assert.deepEqual(d.summarizeScan([{ correct: true, seconds: 10 }, { correct: false, seconds: 20 }, { correct: true, seconds: null }]), {
    correct: 2,
    total: 3,
    avgSeconds: 15,
  });
  assert.deepEqual(d.summarizeScan([{ correct: true, seconds: null }]), { correct: 1, total: 1, avgSeconds: null });
  assert.deepEqual(d.summarizeScan([]), { correct: 0, total: 0, avgSeconds: null });
});

test("halaman /latihan-membaca terdaftar di ruang, tampil tanpa flag, dan punya nama", () => {
  assert.ok(rooms.allRoomPaths().has("/latihan-membaca"));
  assert.equal(rooms.isPathVisible("/latihan-membaca", false), true);
  assert.equal(rooms.resolveItem("/latihan-membaca", []).name, "Latihan Skimming & Scanning");
  assert.ok(fs.existsSync(path.join(repo, "app/(dashboard)/latihan-membaca/page.tsx")));
});

test("komponen: tanpa AI, tanpa jaringan, timer opsional, dan teks tidak disembunyikan paksa", () => {
  const src = read("components/reading/ReadingDrill.tsx");
  assert.ok(!/fetch\(|runAI|\/api\//.test(src), "latihan tidak boleh memanggil jaringan atau AI");
  assert.ok(/useTimer/.test(src));
  assert.ok(!/hidden|invisible|blur-/.test(src.replace(/aria-hidden/g, "")), "teks tidak boleh disembunyikan");
  const page = read("app/(dashboard)/latihan-membaca/page.tsx");
  assert.ok(!/runAI|supabase/.test(page), "halaman tidak memakai AI atau database");
});

console.log(`\n${passed} lulus, 0 gagal`);
