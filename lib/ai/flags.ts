// lib/ai/flags.ts
// Feature flag dari system_config.features ({ [featureKey]: boolean }), diatur di Admin → Fitur.
// Key yang tidak terdaftar dianggap aktif (B-07). Di-cache 60 detik per instance server.

import { getServiceClient } from "./admin-client";

const CACHE_TTL_MS = 60 * 1000;
let cache: { at: number; value: Record<string, boolean> } | null = null;

export class FeatureDisabledError extends Error {
  constructor(public featureKey: string) {
    super("Fitur ini sedang dinonaktifkan oleh admin.");
    this.name = "FeatureDisabledError";
  }
}

export function invalidateFeatureFlags() {
  cache = null;
}

export async function getFeatureFlags(): Promise<Record<string, boolean>> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.value;

  let value: Record<string, boolean> = {};
  const supabase = getServiceClient();
  if (supabase) {
    try {
      const { data } = await supabase.from("system_config").select("value").eq("key", "features").maybeSingle();
      if (data?.value && typeof data.value === "object") value = data.value as Record<string, boolean>;
    } catch {
      // Tabel belum ada: semua fitur dianggap aktif
    }
  }
  cache = { at: Date.now(), value };
  return value;
}

export async function isFeatureOn(featureKey: string): Promise<boolean> {
  const flags = await getFeatureFlags();
  return flags[featureKey] !== false;
}
