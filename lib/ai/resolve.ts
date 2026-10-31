// lib/ai/resolve.ts
// Menentukan provider + model untuk sebuah fitur dari tabel ai_feature_routes.
// Jika registry belum ada / kosong / service role tidak tersedia, kembali ke konfigurasi
// lama (system_config + GROQ_API_KEY) agar aplikasi tetap jalan.

import { getAIConfig } from "@/lib/ai-config";
import { getServiceClient } from "./admin-client";
import { decryptSecret } from "./crypto";
import { getFeature } from "./features";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const GROQ_VISION_MODEL = "qwen/qwen3.8-27b";
const CACHE_TTL_MS = 60 * 1000;

// Hanya env berpola *_API_KEY yang boleh dibaca sebagai key provider bawaan.
const ENV_KEY_PATTERN = /^[A-Z0-9_]+_API_KEY$/;

export interface ResolvedModel {
  providerId: string | null;
  providerName: string;
  baseUrl: string;
  apiKey: string | null;
  allowPrivateNetwork: boolean;
  /** Provider bawaan dari env (tidak perlu dicek url-guard setiap request). */
  trusted: boolean;
  model: string;
  capabilities: string[];
  defaultTemperature?: number;
  defaultMaxTokens?: number;
}

export interface ResolvedFeature {
  primary: ResolvedModel;
  fallback?: ResolvedModel;
  temperature?: number | null;
  maxTokens?: number | null;
  mcpServerIds: string[];
  source: "registry" | "legacy";
}

interface ProviderRow {
  id: string;
  name: string;
  base_url: string;
  api_key_encrypted: string | null;
  env_key_name: string | null;
  allow_private_network: boolean;
  is_active: boolean;
}

interface ModelRow {
  id: string;
  model_id: string;
  capabilities: string[] | null;
  default_temperature: number | null;
  default_max_tokens: number | null;
  is_active: boolean;
  provider: ProviderRow | null;
}

interface RouteRow {
  feature_key: string;
  temperature: number | null;
  max_tokens: number | null;
  mcp_server_ids: string[] | null;
  model: ModelRow | null;
  fallback: ModelRow | null;
}

const cache = new Map<string, { at: number; value: ResolvedFeature }>();

export function invalidateAIRegistryCache() {
  cache.clear();
}

export function resolveProviderKey(provider: Pick<ProviderRow, "api_key_encrypted" | "env_key_name">): string | null {
  if (provider.api_key_encrypted) return decryptSecret(provider.api_key_encrypted);
  if (provider.env_key_name && ENV_KEY_PATTERN.test(provider.env_key_name)) {
    return process.env[provider.env_key_name] || null;
  }
  return null;
}

function toResolvedModel(row: ModelRow | null): ResolvedModel | undefined {
  if (!row || !row.is_active || !row.provider || !row.provider.is_active) return undefined;
  const p = row.provider;
  return {
    providerId: p.id,
    providerName: p.name,
    baseUrl: p.base_url,
    apiKey: resolveProviderKey(p),
    allowPrivateNetwork: p.allow_private_network,
    trusted: !p.api_key_encrypted && !!p.env_key_name && p.base_url === GROQ_BASE_URL,
    model: row.model_id,
    capabilities: row.capabilities || ["text"],
    defaultTemperature: row.default_temperature ?? undefined,
    defaultMaxTokens: row.default_max_tokens || undefined,
  };
}

async function legacyResolve(featureKey: string): Promise<ResolvedFeature> {
  const config = await getAIConfig("tools");
  const needsVision = getFeature(featureKey)?.requires === "vision";
  return {
    primary: {
      providerId: null,
      providerName: "Groq (env)",
      baseUrl: GROQ_BASE_URL,
      apiKey: process.env.GROQ_API_KEY || null,
      allowPrivateNetwork: false,
      trusted: true,
      model: needsVision ? GROQ_VISION_MODEL : config.model,
      capabilities: needsVision ? ["text", "vision"] : ["text"],
      defaultTemperature: config.temperature,
      defaultMaxTokens: config.max_tokens,
    },
    mcpServerIds: [],
    source: "legacy",
  };
}

const MODEL_SELECT =
  "id, model_id, capabilities, default_temperature, default_max_tokens, is_active, provider:ai_providers(id, name, base_url, api_key_encrypted, env_key_name, allow_private_network, is_active)";

export async function resolveFeature(featureKey: string): Promise<ResolvedFeature> {
  const hit = cache.get(featureKey);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

  let value: ResolvedFeature | null = null;
  const supabase = getServiceClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("ai_feature_routes")
        .select(
          `feature_key, temperature, max_tokens, mcp_server_ids,
           model:ai_models!ai_feature_routes_model_id_fkey(${MODEL_SELECT}),
           fallback:ai_models!ai_feature_routes_fallback_model_id_fkey(${MODEL_SELECT})`
        )
        .eq("feature_key", featureKey)
        .maybeSingle();

      const row = data as unknown as RouteRow | null;
      const primary = !error ? toResolvedModel(row?.model ?? null) : undefined;
      if (row && primary) {
        value = {
          primary,
          fallback: toResolvedModel(row.fallback),
          temperature: row.temperature,
          maxTokens: row.max_tokens,
          mcpServerIds: row.mcp_server_ids || [],
          source: "registry",
        };
      }
    } catch (error) {
      console.warn(`[ai] Registry tidak bisa dibaca untuk '${featureKey}', memakai konfigurasi lama:`, error);
    }
  }

  if (!value) value = await legacyResolve(featureKey);
  cache.set(featureKey, { at: Date.now(), value });
  return value;
}
