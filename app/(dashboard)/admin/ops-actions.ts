"use server";

// Server actions untuk tab Fitur (feature flag) dan Pemakaian (kuota).
// Ditulis ke system_config dengan service role setelah memastikan pemanggil adalah admin.

import { revalidatePath } from "next/cache";
import { assertAdmin, toErrorMessage, type ActionResult } from "./_lib/guard";
import { getServiceClient } from "@/lib/ai/admin-client";
import { invalidateFeatureFlags } from "@/lib/ai/flags";
import { resolveFlag } from "@/lib/ai/flag-rules";
import { logAdminAction } from "@/lib/admin-audit";
import { RATE_LIMIT_USE_CASES } from "./_lib/constants";

async function readConfig(key: string): Promise<Record<string, unknown>> {
  const supabase = getServiceClient();
  if (!supabase) throw new Error("SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi di server.");
  const { data, error } = await supabase.from("system_config").select("value").eq("key", key).maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.value as Record<string, unknown>) || {};
}

async function writeConfig(key: string, value: Record<string, unknown>) {
  const supabase = getServiceClient();
  if (!supabase) throw new Error("SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi di server.");
  const { error } = await supabase
    .from("system_config")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw new Error(error.message);
}

export async function setFeatureFlag(featureKey: string, enabled: boolean): Promise<ActionResult> {
  try {
    const { user } = await assertAdmin();
    if (!/^[a-z0-9_-]{1,64}$/i.test(featureKey)) return { ok: false, error: "Key fitur tidak valid." };

    const before = await readConfig("features");
    const after = { ...before, [featureKey]: enabled };
    await writeConfig("features", after);

    await logAdminAction({
      actorId: user.id,
      action: "feature.toggle",
      target: featureKey,
      before: { enabled: resolveFlag(before as Record<string, boolean>, featureKey) },
      after: { enabled },
    });
    invalidateFeatureFlags();
    revalidatePath("/admin/features");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function saveRateLimits(formData: FormData): Promise<ActionResult> {
  try {
    const { user } = await assertAdmin();
    const before = await readConfig("rate_limits");
    const after: Record<string, { requests_per_minute: number; requests_per_hour: number }> = {};

    for (const useCase of RATE_LIMIT_USE_CASES) {
      const perMinute = Number(formData.get(`${useCase}_minute`));
      const perHour = Number(formData.get(`${useCase}_hour`));
      if (!Number.isInteger(perMinute) || perMinute < 1 || perMinute > 1000) {
        return { ok: false, error: `Batas per menit untuk ${useCase} harus 1–1000.` };
      }
      if (!Number.isInteger(perHour) || perHour < perMinute || perHour > 100000) {
        return { ok: false, error: `Batas per jam untuk ${useCase} harus ≥ batas per menit (maks 100000).` };
      }
      after[useCase] = { requests_per_minute: perMinute, requests_per_hour: perHour };
    }

    await writeConfig("rate_limits", after);
    await logAdminAction({ actorId: user.id, action: "quota.update", target: "rate_limits", before, after });
    revalidatePath("/admin/usage");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
