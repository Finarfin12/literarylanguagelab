// Akses database untuk bukti kemampuan dan level. Logika perhitungan ada di lib/levels.ts (murni).
// Hanya untuk server. Semua fungsi menangani migrasi 0008 yang belum dijalankan tanpa melempar error.
import type { SupabaseClient } from "@supabase/supabase-js";
import { getServiceClient } from "@/lib/ai/admin-client";
import { isCefrLevel, type CefrLevel } from "@/lib/cefr";
import {
  SKILLS,
  computeSkillLevels,
  mergeLevelRules,
  type Evidence,
  type LevelRules,
  type Skill,
  type SkillLevels,
  type VocabMastery,
} from "@/lib/levels";

const MISSING = ["42703", "PGRST204", "42P01", "PGRST205", "42883", "PGRST202"];

export function isMissingSchema(error: { code?: string } | null | undefined): boolean {
  return !!error?.code && MISSING.includes(error.code);
}

export interface EvidenceInput {
  skill: Skill;
  source: string;
  score?: number | null;
  cefr_estimate?: string | null;
  text_cefr?: string | null;
  ref_id?: string | null;
}

/** Catat satu bukti. Best effort: tidak pernah melempar error dan tidak boleh menggagalkan route pemanggil. */
export async function recordEvidence(supabase: SupabaseClient, userId: string, input: EvidenceInput): Promise<void> {
  try {
    const score = typeof input.score === "number" && Number.isFinite(input.score) ? Math.max(0, Math.min(100, input.score)) : null;
    await supabase.from("skill_evidence").insert({
      user_id: userId,
      skill: input.skill,
      source: input.source.slice(0, 40),
      score,
      cefr_estimate: isCefrLevel(input.cefr_estimate) ? input.cefr_estimate : null,
      text_cefr: isCefrLevel(input.text_cefr) ? input.text_cefr : null,
      ref_id: input.ref_id ? String(input.ref_id).slice(0, 80) : null,
    });
  } catch (error) {
    console.error("recordEvidence gagal:", error);
  }
}

/** Catat perubahan level (keseluruhan jika skill = null). Best effort. */
export async function recordLevelChange(
  supabase: SupabaseClient,
  userId: string,
  change: { skill?: Skill | null; from?: string | null; to: string; source: "placement" | "level_test" | "manual" | "evidence" }
): Promise<void> {
  try {
    await supabase.from("level_history").insert({
      user_id: userId,
      skill: change.skill ?? null,
      from_level: change.from ?? null,
      to_level: change.to,
      source: change.source,
    });
  } catch (error) {
    console.error("recordLevelChange gagal:", error);
  }
}

/** Aturan naik level dari system_config.level_rules (service role) digabung dengan default. */
export async function getLevelRules(): Promise<LevelRules> {
  const service = getServiceClient();
  if (!service) return mergeLevelRules(null);
  try {
    const { data } = await service.from("system_config").select("value").eq("key", "level_rules").maybeSingle();
    return mergeLevelRules(data?.value);
  } catch {
    return mergeLevelRules(null);
  }
}

export interface LevelContext {
  /** false jika migrasi 0008 belum dijalankan. */
  schemaReady: boolean;
  level: CefrLevel | null;
  stored: SkillLevels;
  lastTestAt: string | null;
  evidence: Evidence[];
  vocab: VocabMastery;
  rules: LevelRules;
}

function parseStored(raw: unknown): SkillLevels {
  const out: SkillLevels = {};
  if (raw && typeof raw === "object") {
    for (const skill of SKILLS) {
      const v = (raw as Record<string, unknown>)[skill];
      if (isCefrLevel(v)) out[skill] = v;
    }
  }
  return out;
}

export async function loadLevelContext(supabase: SupabaseClient, userId: string): Promise<LevelContext> {
  const [profileRes, evidenceRes, vocabRes, rules] = await Promise.all([
    supabase.from("profiles").select("cefr_level, skill_levels, last_level_test_at").eq("id", userId).maybeSingle(),
    supabase
      .from("skill_evidence")
      .select("skill, source, score, cefr_estimate, text_cefr, ref_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(400),
    supabase.rpc("core_word_mastery"),
    getLevelRules(),
  ]);

  let schemaReady = !profileRes.error && !evidenceRes.error;
  let profile = profileRes.data as { cefr_level?: string; skill_levels?: unknown; last_level_test_at?: string | null } | null;
  if (profileRes.error) {
    // Kolom baru belum ada: ambil level saja
    const basic = await supabase.from("profiles").select("cefr_level").eq("id", userId).maybeSingle();
    profile = basic.data as { cefr_level?: string } | null;
    schemaReady = false;
  }

  const vocab: VocabMastery = {};
  if (!vocabRes.error && Array.isArray(vocabRes.data)) {
    for (const row of vocabRes.data as { cefr_estimate: string; total: number | string; mastered: number | string }[]) {
      if (isCefrLevel(row.cefr_estimate)) vocab[row.cefr_estimate] = { total: Number(row.total), mastered: Number(row.mastered) };
    }
  }

  return {
    schemaReady,
    level: isCefrLevel(profile?.cefr_level) ? profile.cefr_level : null,
    stored: parseStored(profile?.skill_levels),
    lastTestAt: profile?.last_level_test_at ?? null,
    evidence: evidenceRes.error ? [] : ((evidenceRes.data || []) as Evidence[]),
    vocab,
    rules,
  };
}

/**
 * Hitung level per keterampilan dari bukti, lalu simpan jika ada yang naik (tidak pernah turun).
 * Mengembalikan level yang berlaku.
 */
export async function syncSkillLevels(supabase: SupabaseClient, userId: string, ctx: LevelContext): Promise<Record<Skill, CefrLevel> | null> {
  if (!ctx.level) return null;
  const computed = computeSkillLevels(ctx.evidence, ctx.level, ctx.stored, ctx.vocab, ctx.rules);
  if (!ctx.schemaReady) return computed;

  const raised = SKILLS.filter((s) => computed[s] !== (ctx.stored[s] ?? ctx.level));
  const changed = SKILLS.some((s) => computed[s] !== ctx.stored[s]);
  if (changed) {
    const { error } = await supabase.from("profiles").update({ skill_levels: computed }).eq("id", userId);
    if (!error) {
      for (const s of raised) {
        await recordLevelChange(supabase, userId, { skill: s, from: ctx.stored[s] ?? ctx.level, to: computed[s], source: "evidence" });
      }
    }
  }
  return computed;
}
