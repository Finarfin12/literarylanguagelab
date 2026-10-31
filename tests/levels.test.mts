// Uji unit lib/levels.ts. Jalankan:
//   node --experimental-transform-types --no-warnings tests/levels.test.mts <path-repo>
import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = path.resolve(process.argv[2] ?? ".");
const L = await import(pathToFileURL(path.join(repo, "lib/levels.ts")).href);
const C = await import(pathToFileURL(path.join(repo, "lib/cefr.ts")).href);

type Crit = { key: string; met: boolean; progressText: string };

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`ok - ${name}`);
}

let clock = 0;
function ev(partial: Record<string, unknown>) {
  clock++;
  return {
    skill: "reading",
    source: "reader_quiz",
    score: 80,
    cefr_estimate: null,
    text_cefr: null,
    ref_id: `r${clock}`,
    created_at: new Date(Date.UTC(2026, 9, 1, 0, clock)).toISOString(),
    ...partial,
  };
}

const rules = L.DEFAULT_LEVEL_RULES;

test("urutan level sama dengan lib/cefr.ts", () => {
  const order = ["A1", "A2", "B1", "B2", "C1", "C2"];
  assert.deepEqual([...C.CEFR_LEVELS], order);
  assert.deepEqual(order.map((l) => L.levelIdx(l)), [0, 1, 2, 3, 4, 5]);
  assert.equal(L.nextLevel("B1"), "B2");
  assert.equal(L.nextLevel("C2"), null);
  assert.equal(L.nextLevel("zz"), null);
});

test("overallLevel = median, genap dibulatkan ke bawah", () => {
  assert.equal(L.overallLevel({ reading: "B2", grammar: "A2", vocabulary: "B1", listening: "B1", production: "C1" }), "B1");
  assert.equal(L.overallLevel({ reading: "B2", grammar: "A2" }), "B1"); // (3+1)/2 = 2 -> B1
  assert.equal(L.overallLevel({ reading: "B2", grammar: "B1" }), "B1"); // (3+2)/2 = 2.5 -> 2 -> B1
  assert.equal(L.overallLevel({ reading: "C2" }), "C2");
  assert.equal(L.overallLevel({}), null);
});

test("level tidak pernah turun otomatis", () => {
  // Bukti membaca buruk dan produksi rendah tidak menurunkan level
  const bad = [
    ...Array.from({ length: 5 }, () => ev({ skill: "reading", text_cefr: "A1", score: 10 })),
    ...Array.from({ length: 3 }, () => ev({ skill: "production", cefr_estimate: "A1", score: null })),
  ];
  assert.equal(L.computeSkillLevel("reading", bad, "B2"), "B2");
  assert.equal(L.computeSkillLevel("production", bad, "B2"), "B2");
  const levels = L.computeSkillLevels(bad, "A1", { reading: "C1", grammar: "B2" });
  assert.equal(levels.reading, "C1");
  assert.equal(levels.grammar, "B2");
  assert.equal(levels.vocabulary, "A1");
  assert.equal(L.levelAfterTest("B1", "B2", false), "B1");
  assert.equal(L.levelAfterTest("B1", "B2", true), "B2");
  assert.equal(L.levelAfterTest("C1", "B2", true), "C1");
});

test("membaca naik jika cukup teks level tinggi dengan rata-rata memadai", () => {
  const good = Array.from({ length: 5 }, () => ev({ skill: "reading", text_cefr: "B2", score: 75 }));
  assert.equal(L.computeSkillLevel("reading", good, "B1"), "B2");
  const fewer = good.slice(0, 4);
  assert.equal(L.computeSkillLevel("reading", fewer, "B1"), "B1");
  const lowAvg = Array.from({ length: 5 }, () => ev({ skill: "reading", text_cefr: "B2", score: 60 }));
  assert.equal(L.computeSkillLevel("reading", lowAvg, "B1"), "B1");
});

test("bukti membaca per teks: kuis pada teks yang sama dirata-ratakan dan dihitung sekali", () => {
  const rows = [
    ...Array.from({ length: 3 }, () => ev({ skill: "reading", text_cefr: "B2", score: 90 })),
    ev({ skill: "reading", text_cefr: "B2", score: 90, ref_id: "same" }),
    ev({ skill: "reading", text_cefr: "B2", score: 90, ref_id: "same" }), // teks yang sama dihitung sekali
  ];
  const r = L.levelUpReadiness(rows, "B1", {}, rules);
  assert.equal(r.criteria.find((c: Crit) => c.key === "reading").met, false);
  assert.match(r.criteria.find((c: Crit) => c.key === "reading").progressText, /^4\/5/);
  // dua kuis pada satu teks: 100 dan 40 -> rata-rata 70, memenuhi ambang
  const two = [
    ...Array.from({ length: 4 }, () => ev({ skill: "reading", text_cefr: "B2", score: 70 })),
    ev({ skill: "reading", text_cefr: "B2", score: 100, ref_id: "t" }),
    ev({ skill: "reading", text_cefr: "B2", score: 40, ref_id: "t" }),
  ];
  const r2 = L.levelUpReadiness(two, "B1", {}, rules);
  assert.equal(r2.criteria.find((c: Crit) => c.key === "reading").met, true);
});

test("kosakata: level naik bertahap dari kosakata inti yang dikuasai", () => {
  const vocab = { A1: { total: 500, mastered: 420 }, A2: { total: 500, mastered: 410 }, B1: { total: 1000, mastered: 100 } };
  assert.equal(L.computeSkillLevel("vocabulary", [], "A1", vocab), "A2");
  assert.equal(L.computeSkillLevel("vocabulary", [], "A1", { A1: { total: 500, mastered: 100 } }), "A1");
  assert.equal(L.computeSkillLevel("vocabulary", [], "A1", {}), "A1");
});

test("produksi: median dari 3 estimasi terakhir", () => {
  const rows = [
    ev({ skill: "production", cefr_estimate: "B2", score: null }),
    ev({ skill: "production", cefr_estimate: "B1", score: null }),
    ev({ skill: "production", cefr_estimate: "B2", score: null }),
  ];
  assert.equal(L.computeSkillLevel("production", rows, "A2"), "B2");
  assert.equal(L.computeSkillLevel("production", rows.slice(0, 2), "A2"), "A2"); // belum cukup hasil
});

test("levelUpReadiness: semua syarat terpenuhi → ready", () => {
  const rows = [
    ...Array.from({ length: 5 }, () => ev({ skill: "reading", text_cefr: "B2", score: 80 })),
    ...Array.from({ length: 3 }, () => ev({ skill: "production", cefr_estimate: "B2", score: null })),
    ...Array.from({ length: 5 }, () => ev({ skill: "grammar", source: "grammar_clinic", score: 85 })),
    ...Array.from({ length: 5 }, () => ev({ skill: "listening", source: "listening_test", score: 75 })),
  ];
  const vocab = { B1: { total: 1000, mastered: 850 } };
  const r = L.levelUpReadiness(rows, "B1", vocab, rules);
  assert.equal(r.target, "B2");
  assert.equal(r.criteria.length, 5);
  assert.equal(r.ready, true);
  assert.ok(r.criteria.every((c: Crit) => c.met));
});

test("levelUpReadiness: satu syarat belum → tidak ready, dengan teks progres", () => {
  const rows = Array.from({ length: 5 }, () => ev({ skill: "grammar", source: "grammar_clinic", score: 50 }));
  const r = L.levelUpReadiness(rows, "A2", { A2: { total: 500, mastered: 400 } }, rules);
  assert.equal(r.ready, false);
  const grammar = r.criteria.find((c: Crit) => c.key === "grammar");
  assert.equal(grammar.met, false);
  assert.match(grammar.progressText, /rata-rata 50%/);
});

test("levelUpReadiness: hanya hasil terbaru yang dihitung untuk grammar", () => {
  const old = Array.from({ length: 5 }, () => ev({ skill: "grammar", score: 20, created_at: "2026-01-01T00:00:00.000Z" }));
  const fresh = Array.from({ length: 5 }, () => ev({ skill: "grammar", score: 90 }));
  const r = L.levelUpReadiness([...old, ...fresh], "A1", { A1: { total: 500, mastered: 450 } }, rules);
  assert.equal(r.criteria.find((c: Crit) => c.key === "grammar").met, true);
});

test("levelUpReadiness di C2: tidak ada target", () => {
  const r = L.levelUpReadiness([], "C2", {}, rules);
  assert.equal(r.target, null);
  assert.equal(r.ready, false);
});

test("levelUpReadiness di C1: kosakata inti tidak berlaku (tidak menghalangi)", () => {
  const r = L.levelUpReadiness([], "C1", {}, rules);
  assert.equal(r.criteria.find((c: Crit) => c.key === "vocabulary").met, true);
});

test("canTakeLevelTest: cooldown 14 hari", () => {
  const last = "2026-10-01T00:00:00.000Z";
  const day = (n: number) => new Date(Date.parse(last) + n * 86400000);
  assert.equal(L.canTakeLevelTest(null, day(0)).allowed, true);
  assert.equal(L.canTakeLevelTest(last, day(0)).allowed, false);
  assert.equal(L.canTakeLevelTest(last, day(13)).allowed, false);
  assert.equal(L.canTakeLevelTest(last, day(13)).daysLeft, 1);
  assert.equal(L.canTakeLevelTest(last, day(14)).allowed, true);
  assert.equal(L.canTakeLevelTest(last, day(30)).allowed, true);
  assert.equal(L.canTakeLevelTest("bukan-tanggal", day(0)).allowed, true);
  assert.equal(L.canTakeLevelTest(new Date(last), day(1), 3).daysLeft, 2);
});

test("evaluateLevelTest: lulus jika total >= 70% dan tiap bagian >= 50%", () => {
  const ok = L.evaluateLevelTest({ reading: { correct: 3, total: 3 }, grammar: { correct: 2, total: 3 }, vocabulary: { correct: 2, total: 3 }, listening: { correct: 2, total: 3 } }, rules);
  assert.equal(ok.totalPct, 75);
  assert.equal(ok.passed, true);
});

test("evaluateLevelTest: gagal jika ada bagian di bawah 50% walau total tinggi", () => {
  const r = L.evaluateLevelTest({ reading: { correct: 3, total: 3 }, grammar: { correct: 3, total: 3 }, vocabulary: { correct: 3, total: 3 }, listening: { correct: 1, total: 3 } }, rules);
  assert.equal(r.totalPct, 83);
  assert.equal(r.passed, false);
  assert.deepEqual(r.weakSections, ["listening"]);
});

test("evaluateLevelTest: gagal jika total di bawah 70% atau kosong", () => {
  const low = L.evaluateLevelTest({ reading: { correct: 2, total: 3 }, grammar: { correct: 2, total: 3 }, vocabulary: { correct: 2, total: 3 }, listening: { correct: 1, total: 3 } }, rules);
  assert.equal(low.passed, false);
  assert.equal(L.evaluateLevelTest({}, rules).passed, false);
  // jawaban benar tidak boleh melebihi jumlah soal
  const clamp = L.evaluateLevelTest({ reading: { correct: 99, total: 3 } }, rules);
  assert.equal(clamp.sectionPct.reading, 100);
});

test("mergeLevelRules: nilai tidak valid diabaikan", () => {
  const m = L.mergeLevelRules({ grammar: { minResults: 7, minAvgScore: "x" }, test: { cooldownDays: 21, passTotalPct: -5 }, aneh: 1 });
  assert.equal(m.grammar.minResults, 7);
  assert.equal(m.grammar.minAvgScore, 70);
  assert.equal(m.test.cooldownDays, 21);
  assert.equal(m.test.passTotalPct, 70);
  assert.deepEqual(L.mergeLevelRules(null), rules);
  assert.deepEqual(L.mergeLevelRules("x"), rules);
});

console.log(`\n${passed} lulus, 0 gagal`);
