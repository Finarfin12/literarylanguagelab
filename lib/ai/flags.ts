// lib/ai/flags.ts
// Feature flag dari system_config.features ({ [featureKey]: boolean }), diatur di Admin → Fitur.
// Key yang tidak terdaftar dianggap aktif (B-07), kecuali fitur eksperimen di FEATURE_DEFAULTS (bawaan mati).
// Bila konfigurasi gagal dibaca: pakai nilai terakhir yang berhasil dibaca, lalu FEATURE_DEFAULTS (Fase 19.4).
// Di-cache 60 detik per instance server (kegagalan hanya 10 detik agar cepat pulih).

import { getServiceClient } from "./admin-client";
import { FEATURE_DEFAULTS, resolveFlag, withDefaults } from "./flag-rules";

export { FEATURE_DEFAULTS };

const CACHE_TTL_MS = 60 * 1000;
const FAILURE_TTL_MS = 10 * 1000;

export type FeatureFlagStatus = {
  flags: Record<string, boolean>;
  /** false = konfigurasi tidak terbaca; flags berisi nilai terakhir yang berhasil dibaca atau bawaan. */
  readable: boolean;
  reason?: string;
};

let cache: { at: number; ttl: number; status: FeatureFlagStatus } | null = null;
let lastGood: Record<string, boolean> | null = null;

export class FeatureDisabledError extends Error {
  constructor(public featureKey: string) {
    super("Fitur ini sedang dinonaktifkan oleh admin.");
    this.name = "FeatureDisabledError";
  }
}

export function invalidateFeatureFlags() {
  cache = null;
}

async function loadStatus(): Promise<FeatureFlagStatus> {
  const supabase = getServiceClient();
  if (!supabase) {
    return { flags: withDefaults(lastGood), readable: false, reason: "SUPABASE_SERVICE_ROLE_KEY belum diisi." };
  }
  try {
    const { data, error } = await supabase.from("system_config").select("value").eq("key", "features").maybeSingle();
    if (error) {
      return { flags: withDefaults(lastGood), readable: false, reason: error.message };
    }
    const stored = data?.value && typeof data.value === "object" ? (data.value as Record<string, boolean>) : {};
    lastGood = stored;
    return { flags: withDefaults(stored), readable: true };
  } catch (err) {
    return { flags: withDefaults(lastGood), readable: false, reason: err instanceof Error ? err.message : "Galat tak dikenal." };
  }
}

export async function getFeatureFlagStatus(options: { fresh?: boolean } = {}): Promise<FeatureFlagStatus> {
  if (!options.fresh && cache && Date.now() - cache.at < cache.ttl) return cache.status;
  const status = await loadStatus();
  cache = { at: Date.now(), ttl: status.readable ? CACHE_TTL_MS : FAILURE_TTL_MS, status };
  return status;
}

export async function getFeatureFlags(): Promise<Record<string, boolean>> {
  return (await getFeatureFlagStatus()).flags;
}

export async function isFeatureOn(featureKey: string): Promise<boolean> {
  return resolveFlag(await getFeatureFlags(), featureKey);
}
