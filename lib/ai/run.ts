// lib/ai/run.ts
// Satu pintu untuk semua pemanggilan AI: resolve model fitur → panggil provider →
// coba model cadangan jika error 5xx/timeout → catat ke ai_usage_logs.

import { getServiceClient } from "./admin-client";
import { chat, ProviderError, type ChatMessage } from "./providers/openai-compatible";
import { resolveFeature, type ResolvedModel } from "./resolve";
import { assertSafeBaseUrl } from "./url-guard";

const DEFAULT_TIMEOUT_MS = 30 * 1000;

export interface RunAIParams {
  messages: ChatMessage[];
  /** Nilai default dari route. Diabaikan jika admin mengisi temperature di Routing Fitur. */
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" | "text" };
}

export interface RunAIContext {
  userId?: string;
  timeoutMs?: number;
}

export interface RunAIResult {
  content: string;
  reasoning?: string;
  model: string;
  provider: string;
  usedFallback: boolean;
}

async function logUsage(row: Record<string, unknown>) {
  const supabase = getServiceClient();
  if (!supabase) return;
  try {
    await supabase.from("ai_usage_logs").insert(row);
  } catch {
    // Best effort: log tidak boleh menggagalkan request
  }
}

async function callModel(
  target: ResolvedModel,
  params: RunAIParams,
  overrides: { temperature?: number | null; maxTokens?: number | null },
  timeoutMs: number
) {
  if (!target.apiKey && !target.allowPrivateNetwork) {
    throw new ProviderError(`API key untuk provider '${target.providerName}' belum dikonfigurasi.`, 401);
  }
  if (!target.trusted) {
    await assertSafeBaseUrl(target.baseUrl, target.allowPrivateNetwork);
  }

  return chat({
    baseUrl: target.baseUrl,
    apiKey: target.apiKey,
    model: target.model,
    messages: params.messages,
    temperature: overrides.temperature ?? params.temperature ?? target.defaultTemperature,
    maxTokens: overrides.maxTokens ?? params.max_tokens ?? target.defaultMaxTokens,
    responseFormat: params.response_format,
    signal: AbortSignal.timeout(timeoutMs),
  });
}

export async function runAI(featureKey: string, params: RunAIParams, ctx: RunAIContext = {}): Promise<RunAIResult> {
  const route = await resolveFeature(featureKey);
  const overrides = { temperature: route.temperature, maxTokens: route.maxTokens };
  const timeoutMs = ctx.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const attempts = route.fallback ? [route.primary, route.fallback] : [route.primary];

  let lastError: unknown;
  for (let i = 0; i < attempts.length; i++) {
    const target = attempts[i];
    const started = Date.now();
    try {
      const result = await callModel(target, params, overrides, timeoutMs);
      await logUsage({
        user_id: ctx.userId ?? null,
        feature_key: featureKey,
        provider_id: target.providerId,
        model_id: target.model,
        tokens_in: result.tokensIn ?? null,
        tokens_out: result.tokensOut ?? null,
        latency_ms: Date.now() - started,
        status: "success",
        used_fallback: i > 0,
      });
      return {
        content: result.content,
        reasoning: result.reasoning,
        model: target.model,
        provider: target.providerName,
        usedFallback: i > 0,
      };
    } catch (error) {
      lastError = error;
      await logUsage({
        user_id: ctx.userId ?? null,
        feature_key: featureKey,
        provider_id: target.providerId,
        model_id: target.model,
        latency_ms: Date.now() - started,
        status: "error",
        error: error instanceof Error ? error.message.slice(0, 500) : "Unknown error",
        used_fallback: i > 0,
      });
      const retryable = error instanceof ProviderError && error.retryable;
      if (!retryable) break;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("AI request gagal");
}

export type { ChatMessage } from "./providers/openai-compatible";
