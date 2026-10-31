"use server";

// Server actions untuk tab Provider AI, Model, dan Routing Fitur.
// API key hanya dienkripsi/didekripsi di sini dan tidak pernah dikembalikan ke browser.

import { revalidatePath } from "next/cache";
import { assertAdmin, toErrorMessage, type ActionResult } from "./_lib/guard";
import { encryptSecret, maskSecret } from "@/lib/ai/crypto";
import { getFeature, type AICapability } from "@/lib/ai/features";
import { chat, listModels } from "@/lib/ai/providers/openai-compatible";
import { invalidateAIRegistryCache, resolveProviderKey } from "@/lib/ai/resolve";
import { assertSafeBaseUrl } from "@/lib/ai/url-guard";

const CAPABILITIES: AICapability[] = ["text", "vision", "tools", "stt", "tts"];
const TEST_TIMEOUT_MS = 15 * 1000;

function refresh() {
  invalidateAIRegistryCache();
  revalidatePath("/admin/providers");
  revalidatePath("/admin/models");
  revalidatePath("/admin/routing");
}

function optionalNumber(value: FormDataEntryValue | null): number | null {
  if (value === null || String(value).trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// ---------- Provider ----------

export async function saveProvider(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase } = await assertAdmin();
    const id = String(formData.get("id") || "");
    const name = String(formData.get("name") || "").trim();
    const baseUrl = String(formData.get("base_url") || "").trim().replace(/\/+$/, "");
    const apiKey = String(formData.get("api_key") || "").trim();
    const allowPrivate = formData.get("allow_private_network") === "on";
    const isActive = formData.get("is_active") === "on";

    if (!name) return { ok: false, error: "Nama provider wajib diisi." };
    await assertSafeBaseUrl(baseUrl, allowPrivate);

    const row: Record<string, unknown> = {
      name,
      type: "openai_compatible",
      base_url: baseUrl,
      allow_private_network: allowPrivate,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    };
    if (apiKey) {
      row.api_key_encrypted = encryptSecret(apiKey);
      row.api_key_hint = maskSecret(apiKey);
    }

    const { error } = id
      ? await supabase.from("ai_providers").update(row).eq("id", id)
      : await supabase.from("ai_providers").insert(row);
    if (error) return { ok: false, error: error.message };

    refresh();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function deleteProvider(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await assertAdmin();
    const { data: provider } = await supabase.from("ai_providers").select("env_key_name").eq("id", id).maybeSingle();
    if (provider?.env_key_name) {
      return { ok: false, error: "Provider bawaan (env) tidak bisa dihapus. Nonaktifkan saja jika tidak dipakai." };
    }
    const { error } = await supabase.from("ai_providers").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    refresh();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

async function loadProviderForCall(id: string) {
  const { supabase } = await assertAdmin();
  const { data: provider, error } = await supabase
    .from("ai_providers")
    .select("id, base_url, api_key_encrypted, env_key_name, allow_private_network")
    .eq("id", id)
    .maybeSingle();
  if (error || !provider) throw new Error(error?.message || "Provider tidak ditemukan.");
  await assertSafeBaseUrl(provider.base_url, provider.allow_private_network);
  return { supabase, provider, apiKey: resolveProviderKey(provider) };
}

export async function fetchProviderModels(id: string): Promise<ActionResult<string[]>> {
  try {
    const { provider, apiKey } = await loadProviderForCall(id);
    const models = await listModels(provider.base_url, apiKey, AbortSignal.timeout(TEST_TIMEOUT_MS));
    return { ok: true, data: models };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function testProvider(
  id: string
): Promise<ActionResult<{ modelCount: number; testedModel: string | null; latencyMs: number; reply: string }>> {
  try {
    const { supabase, provider, apiKey } = await loadProviderForCall(id);
    const started = Date.now();
    const models = await listModels(provider.base_url, apiKey, AbortSignal.timeout(TEST_TIMEOUT_MS));

    // Pakai model teks yang terdaftar untuk provider ini; jika belum ada, model pertama dari /models.
    const { data: registered } = await supabase
      .from("ai_models")
      .select("model_id, capabilities")
      .eq("provider_id", id)
      .eq("is_active", true);
    const textModel = registered?.find((m) => (m.capabilities || []).includes("text"))?.model_id || models[0] || null;

    let reply = "";
    if (textModel) {
      const result = await chat({
        baseUrl: provider.base_url,
        apiKey,
        model: textModel,
        messages: [{ role: "user", content: "Reply with the single word: OK" }],
        maxTokens: 200,
        signal: AbortSignal.timeout(TEST_TIMEOUT_MS),
      });
      reply = result.content.trim().slice(0, 80);
    }

    return { ok: true, data: { modelCount: models.length, testedModel: textModel, latencyMs: Date.now() - started, reply } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

// ---------- Model ----------

export async function saveModel(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase } = await assertAdmin();
    const id = String(formData.get("id") || "");
    const providerId = String(formData.get("provider_id") || "");
    const modelId = String(formData.get("model_id") || "").trim();
    const capabilities = formData
      .getAll("capabilities")
      .map(String)
      .filter((c): c is AICapability => CAPABILITIES.includes(c as AICapability));

    if (!providerId || !modelId) return { ok: false, error: "Provider dan ID model wajib diisi." };
    if (capabilities.length === 0) return { ok: false, error: "Pilih minimal satu kemampuan." };

    const row = {
      provider_id: providerId,
      model_id: modelId,
      label: String(formData.get("label") || "").trim() || null,
      capabilities,
      default_temperature: optionalNumber(formData.get("default_temperature")),
      default_max_tokens: optionalNumber(formData.get("default_max_tokens")),
      is_active: formData.get("is_active") === "on",
    };

    const { error } = id
      ? await supabase.from("ai_models").update(row).eq("id", id)
      : await supabase.from("ai_models").insert(row);
    if (error) return { ok: false, error: error.code === "23505" ? "Model ini sudah terdaftar untuk provider tersebut." : error.message };

    refresh();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function importModels(providerId: string, modelIds: string[]): Promise<ActionResult<number>> {
  try {
    const { supabase } = await assertAdmin();
    const rows = modelIds
      .map((m) => m.trim())
      .filter(Boolean)
      .slice(0, 200)
      .map((model_id) => ({ provider_id: providerId, model_id, capabilities: ["text"] }));
    if (rows.length === 0) return { ok: false, error: "Tidak ada model yang dipilih." };

    const { error } = await supabase
      .from("ai_models")
      .upsert(rows, { onConflict: "provider_id,model_id", ignoreDuplicates: true });
    if (error) return { ok: false, error: error.message };

    refresh();
    return { ok: true, data: rows.length };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function deleteModel(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await assertAdmin();
    const { error } = await supabase.from("ai_models").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    refresh();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

// ---------- Routing ----------

export async function saveRoute(formData: FormData): Promise<ActionResult> {
  try {
    const { supabase } = await assertAdmin();
    const featureKey = String(formData.get("feature_key") || "");
    const feature = getFeature(featureKey);
    if (!feature) return { ok: false, error: "Fitur tidak dikenal." };

    const modelId = String(formData.get("model_id") || "") || null;
    const fallbackId = String(formData.get("fallback_model_id") || "") || null;
    if (modelId && modelId === fallbackId) return { ok: false, error: "Model cadangan harus berbeda dari model utama." };

    // Pastikan model yang dipilih punya kemampuan yang dibutuhkan fitur (mis. OCR → vision)
    const ids = [modelId, fallbackId].filter((v): v is string => !!v);
    if (ids.length > 0) {
      const { data: models, error } = await supabase.from("ai_models").select("id, model_id, capabilities").in("id", ids);
      if (error) return { ok: false, error: error.message };
      const missing = (models || []).find((m) => !(m.capabilities || []).includes(feature.requires));
      if (missing) {
        return { ok: false, error: `Model ${missing.model_id} tidak punya kemampuan '${feature.requires}' yang dibutuhkan ${feature.label}.` };
      }
    }

    const temperature = optionalNumber(formData.get("temperature"));
    if (temperature !== null && (temperature < 0 || temperature > 2)) {
      return { ok: false, error: "Temperature harus di antara 0 dan 2." };
    }
    const maxTokens = optionalNumber(formData.get("max_tokens"));
    if (maxTokens !== null && (maxTokens < 1 || maxTokens > 32000)) {
      return { ok: false, error: "Max tokens harus di antara 1 dan 32000." };
    }

    const { error } = await supabase.from("ai_feature_routes").upsert({
      feature_key: featureKey,
      model_id: modelId,
      fallback_model_id: fallbackId,
      temperature,
      max_tokens: maxTokens,
      updated_at: new Date().toISOString(),
    });
    if (error) return { ok: false, error: error.message };

    refresh();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
