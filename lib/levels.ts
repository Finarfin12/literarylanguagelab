// Logika murni level per keterampilan dan Tes Naik Level (PRD 5.3). Tanpa akses database agar bisa diuji unit.
// Prinsip: level naik karena bukti, bersifat pribadi, TIDAK PERNAH turun otomatis, gagal tes tanpa penalti.
import type { CefrLevel } from "./cefr";

// Urutan level diulang di sini (bukan diimpor) supaya modul ini bisa diuji unit tanpa resolusi impor TypeScript.
// tests/levels.test.mts memastikan daftar ini sama dengan lib/cefr.ts.
const ORDER: readonly CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export const SKILLS = ["reading", "vocabulary", "grammar", "listening", "production"] as const;
export type Skill = (typeof SKILLS)[number];

export const SKILL_LABELS: Record<Skill, string> = {
  reading: "Membaca",
  vocabulary: "Kosakata",
  grammar: "Grammar",
  listening: "Menyimak",
  production: "Menulis & berbicara",
};

export const TEST_SECTIONS = ["reading", "grammar", "vocabulary", "listening"] as const;
export type TestSection = (typeof TEST_SECTIONS)[number];

export interface Evidence {
  skill: Skill;
  source: string;
  score: number | null;
  cefr_estimate: string | null;
  text_cefr: string | null;
  ref_id: string | null;
  created_at: string;
}

export type SkillLevels = Partial<Record<Skill, CefrLevel>>;
export type VocabMastery = Partial<Record<CefrLevel, { total: number; mastered: number }>>;

export interface LevelRules {
  reading: { minTexts: number; minAvgScore: number };
  vocabulary: { minMasteredPct: number };
  production: { minResults: number };
  grammar: { minResults: number; minAvgScore: number };
  listening: { minResults: number; minAvgScore: number };
  test: { questionsPerSection: number; passTotalPct: number; minSectionPct: number; cooldownDays: number; expiresMinutes: number };
}

export const DEFAULT_LEVEL_RULES: LevelRules = {
  reading: { minTexts: 5, minAvgScore: 70 },
  vocabulary: { minMasteredPct: 80 },
  production: { minResults: 3 },
  grammar: { minResults: 5, minAvgScore: 70 },
  listening: { minResults: 5, minAvgScore: 70 },
  test: { questionsPerSection: 3, passTotalPct: 70, minSectionPct: 50, cooldownDays: 14, expiresMinutes: 60 },
};

/** Gabungkan aturan dari system_config.level_rules dengan default; nilai yang bukan angka positif diabaikan. */
export function mergeLevelRules(raw: unknown): LevelRules {
  const out: LevelRules = JSON.parse(JSON.stringify(DEFAULT_LEVEL_RULES));
  if (!raw || typeof raw !== "object") return out;
  const src = raw as Record<string, unknown>;
  for (const group of Object.keys(out) as (keyof LevelRules)[]) {
    const incoming = src[group];
    if (!incoming || typeof incoming !== "object") continue;
    const target = out[group] as Record<string, number>;
    for (const key of Object.keys(target)) {
      const v = (incoming as Record<string, unknown>)[key];
      if (typeof v === "number" && Number.isFinite(v) && v > 0) target[key] = v;
    }
  }
  return out;
}

export function levelIdx(level: string | null | undefined): number {
  return ORDER.indexOf(level as CefrLevel);
}

export function nextLevel(level: string | null | undefined): CefrLevel | null {
  const i = levelIdx(level);
  return i >= 0 && i < ORDER.length - 1 ? ORDER[i + 1] : null;
}

function maxLevel(a: CefrLevel, b: CefrLevel): CefrLevel {
  return levelIdx(a) >= levelIdx(b) ? a : b;
}

function byNewest(a: Evidence, b: Evidence): number {
  return b.created_at < a.created_at ? -1 : b.created_at > a.created_at ? 1 : 0;
}

function avg(nums: number[]): number {
  return nums.length === 0 ? 0 : nums.reduce((s, n) => s + n, 0) / nums.length;
}

/**
 * Bukti membaca pada teks level `level`, satu entri per teks. Beberapa kuis bab pada teks yang sama
 * (ref_id sama) dirata-ratakan menjadi satu skor untuk teks itu.
 */
function readingEvidenceAt(evidence: Evidence[], level: string): Evidence[] {
  const groups = new Map<string, Evidence[]>();
  let loose = 0;
  for (const e of [...evidence].sort(byNewest)) {
    if (e.skill !== "reading" || e.text_cefr !== level || e.score === null) continue;
    const key = e.ref_id ?? `row-${loose++}`;
    const list = groups.get(key);
    if (list) list.push(e);
    else groups.set(key, [e]);
  }
  return [...groups.values()].map((rows) => ({ ...rows[0], score: avg(rows.map((r) => r.score as number)) }));
}

function latestScores(evidence: Evidence[], skill: Skill, n: number): number[] {
  return [...evidence]
    .sort(byNewest)
    .filter((e) => e.skill === skill && e.score !== null)
    .slice(0, n)
    .map((e) => e.score as number);
}

function latestEstimates(evidence: Evidence[], n: number): CefrLevel[] {
  return [...evidence]
    .sort(byNewest)
    .filter((e) => e.skill === "production" && levelIdx(e.cefr_estimate) >= 0)
    .slice(0, n)
    .map((e) => e.cefr_estimate as CefrLevel);
}

function pct(m: { total: number; mastered: number } | undefined): number | null {
  if (!m || m.total <= 0) return null;
  return (m.mastered / m.total) * 100;
}

/** Level yang bisa disimpulkan dari bukti saja (tanpa memperhitungkan level saat ini); undefined jika belum cukup. */
function deriveFromEvidence(skill: Skill, evidence: Evidence[], vocab: VocabMastery, rules: LevelRules): CefrLevel | undefined {
  if (skill === "reading") {
    for (let i = ORDER.length - 1; i >= 0; i--) {
      const rows = readingEvidenceAt(evidence, ORDER[i]);
      if (rows.length >= rules.reading.minTexts && avg(rows.map((r) => r.score as number)) >= rules.reading.minAvgScore) return ORDER[i];
    }
    return undefined;
  }
  if (skill === "vocabulary") {
    let derived: CefrLevel | undefined;
    for (const level of ORDER) {
      const p = pct(vocab[level]);
      if (p === null || p < rules.vocabulary.minMasteredPct) break;
      derived = level;
    }
    return derived;
  }
  if (skill === "production") {
    const est = latestEstimates(evidence, rules.production.minResults);
    if (est.length < rules.production.minResults) return undefined;
    const sorted = est.map((l) => levelIdx(l)).sort((a, b) => a - b);
    return ORDER[sorted[Math.floor((sorted.length - 1) / 2)]];
  }
  // Skor grammar dan menyimak tidak membawa informasi level: levelnya hanya naik lewat Tes Naik Level.
  return undefined;
}

/** Level satu keterampilan. Tidak pernah lebih rendah dari `current`. */
export function computeSkillLevel(
  skill: Skill,
  evidence: Evidence[],
  current: CefrLevel,
  vocab: VocabMastery = {},
  rules: LevelRules = DEFAULT_LEVEL_RULES
): CefrLevel {
  const derived = deriveFromEvidence(skill, evidence, vocab, rules);
  return derived ? maxLevel(current, derived) : current;
}

/**
 * Level semua keterampilan. `stored` = profiles.skill_levels, `base` = level keseluruhan di profil
 * (dipakai untuk keterampilan yang belum punya level tersimpan). Hasil tidak pernah di bawah level tersimpan.
 */
export function computeSkillLevels(
  evidence: Evidence[],
  base: CefrLevel,
  stored: SkillLevels = {},
  vocab: VocabMastery = {},
  rules: LevelRules = DEFAULT_LEVEL_RULES
): Record<Skill, CefrLevel> {
  const out = {} as Record<Skill, CefrLevel>;
  for (const skill of SKILLS) out[skill] = computeSkillLevel(skill, evidence, stored[skill] ?? base, vocab, rules);
  return out;
}

/** Median level, pembulatan ke bawah untuk jumlah genap. null jika tidak ada level. */
export function overallLevel(levels: SkillLevels): CefrLevel | null {
  const idx = Object.values(levels)
    .map((l) => levelIdx(l))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b);
  if (idx.length === 0) return null;
  const mid = Math.floor(idx.length / 2);
  const median = idx.length % 2 === 1 ? idx[mid] : Math.floor((idx[mid - 1] + idx[mid]) / 2);
  return ORDER[median];
}

export interface Criterion {
  key: Skill;
  label: string;
  met: boolean;
  progressText: string;
}

export interface Readiness {
  level: CefrLevel;
  target: CefrLevel | null;
  criteria: Criterion[];
  ready: boolean;
}

/** Syarat siap naik dari `level` ke level berikutnya. Di C2 tidak ada target (ready = false). */
export function levelUpReadiness(
  evidence: Evidence[],
  level: CefrLevel,
  vocab: VocabMastery = {},
  rules: LevelRules = DEFAULT_LEVEL_RULES
): Readiness {
  const target = nextLevel(level);
  if (!target) return { level, target: null, criteria: [], ready: false };

  const criteria: Criterion[] = [];

  // Membaca: cukup teks pada level target dengan rata-rata kuis memadai
  const reading = readingEvidenceAt(evidence, target);
  const readingAvg = Math.round(avg(reading.map((r) => r.score as number)));
  criteria.push({
    key: "reading",
    label: `Membaca: ${rules.reading.minTexts} teks level ${target}, rata-rata kuis ≥ ${rules.reading.minAvgScore}%`,
    met: reading.length >= rules.reading.minTexts && readingAvg >= rules.reading.minAvgScore,
    progressText: reading.length === 0 ? `0/${rules.reading.minTexts} teks` : `${Math.min(reading.length, rules.reading.minTexts)}/${rules.reading.minTexts} teks, rata-rata ${readingAvg}%`,
  });

  // Kosakata: kosakata inti level saat ini dikuasai
  const vp = pct(vocab[level]);
  criteria.push({
    key: "vocabulary",
    label: `Kosakata: ≥ ${rules.vocabulary.minMasteredPct}% kosakata inti level ${level} dikuasai`,
    met: vp === null ? !vocab[level] && levelIdx(level) > levelIdx("B2") : vp >= rules.vocabulary.minMasteredPct,
    progressText:
      vp === null
        ? levelIdx(level) > levelIdx("B2")
          ? "Tidak ada daftar kosakata inti untuk level ini"
          : "Belum ada data kosakata inti"
        : `${Math.round(vp)}% dikuasai (${vocab[level]!.mastered}/${vocab[level]!.total})`,
  });

  // Menulis & berbicara: estimasi AI terbaru mencapai level target
  const est = latestEstimates(evidence, rules.production.minResults);
  const atTarget = est.filter((l) => levelIdx(l) >= levelIdx(target)).length;
  criteria.push({
    key: "production",
    label: `Menulis & berbicara: ${rules.production.minResults} hasil terakhir diestimasi ≥ ${target}`,
    met: est.length >= rules.production.minResults && atTarget === est.length,
    progressText: `${atTarget}/${rules.production.minResults} hasil mencapai ${target}`,
  });

  // Grammar & menyimak: rata-rata N hasil terakhir
  for (const skill of ["grammar", "listening"] as const) {
    const rule = rules[skill];
    const scores = latestScores(evidence, skill, rule.minResults);
    const a = Math.round(avg(scores));
    criteria.push({
      key: skill,
      label: `${SKILL_LABELS[skill]}: rata-rata ${rule.minResults} hasil terakhir ≥ ${rule.minAvgScore}%`,
      met: scores.length >= rule.minResults && a >= rule.minAvgScore,
      progressText: scores.length === 0 ? `0/${rule.minResults} hasil` : `${scores.length}/${rule.minResults} hasil, rata-rata ${a}%`,
    });
  }

  return { level, target, criteria, ready: criteria.every((c) => c.met) };
}

export interface CooldownResult {
  allowed: boolean;
  nextAt: Date | null;
  daysLeft: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Tes ulang baru boleh setelah `cooldownDays` sejak tes terakhir (lulus maupun tidak). */
export function canTakeLevelTest(lastTestAt: string | Date | null | undefined, now: Date, cooldownDays = DEFAULT_LEVEL_RULES.test.cooldownDays): CooldownResult {
  if (!lastTestAt) return { allowed: true, nextAt: null, daysLeft: 0 };
  const last = lastTestAt instanceof Date ? lastTestAt : new Date(lastTestAt);
  if (Number.isNaN(last.getTime())) return { allowed: true, nextAt: null, daysLeft: 0 };
  const nextAt = new Date(last.getTime() + cooldownDays * DAY_MS);
  if (now.getTime() >= nextAt.getTime()) return { allowed: true, nextAt: null, daysLeft: 0 };
  return { allowed: false, nextAt, daysLeft: Math.ceil((nextAt.getTime() - now.getTime()) / DAY_MS) };
}

export interface TestEvaluation {
  sectionPct: Partial<Record<TestSection, number>>;
  totalPct: number;
  passed: boolean;
  weakSections: TestSection[];
}

/** Penilaian Tes Naik Level: lulus jika total ≥ passTotalPct dan tidak ada bagian < minSectionPct. */
export function evaluateLevelTest(
  sections: Partial<Record<TestSection, { correct: number; total: number }>>,
  rules: LevelRules = DEFAULT_LEVEL_RULES
): TestEvaluation {
  const sectionPct: Partial<Record<TestSection, number>> = {};
  let correct = 0;
  let total = 0;
  for (const s of TEST_SECTIONS) {
    const v = sections[s];
    if (!v || v.total <= 0) continue;
    const c = Math.max(0, Math.min(v.correct, v.total));
    sectionPct[s] = Math.round((c / v.total) * 100);
    correct += c;
    total += v.total;
  }
  const totalPct = total === 0 ? 0 : Math.round((correct / total) * 100);
  const weakSections = (Object.keys(sectionPct) as TestSection[]).filter((s) => (sectionPct[s] as number) < rules.test.minSectionPct);
  const passed = total > 0 && totalPct >= rules.test.passTotalPct && weakSections.length === 0;
  return { sectionPct, totalPct, passed, weakSections };
}

/**
 * Level baru setelah tes. Lulus → level target; gagal → level tidak berubah (tanpa penalti).
 * Tidak pernah mengembalikan level lebih rendah dari `current`.
 */
export function levelAfterTest(current: CefrLevel, target: CefrLevel, passed: boolean): CefrLevel {
  return passed ? maxLevel(current, target) : current;
}
