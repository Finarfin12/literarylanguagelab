// lib/ai/providers/openai-compatible.ts
// Klien untuk provider ber-API OpenAI-compatible (Groq, OpenRouter, Together, DeepSeek,
// Mistral, OpenAI, Ollama/LM Studio) memakai fetch biasa, tanpa SDK tambahan.

export type ChatContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | ChatContentPart[];
}

export interface ChatRequest {
  baseUrl: string;
  apiKey?: string | null;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: "json_object" | "text" };
  signal?: AbortSignal;
}

export interface ChatResult {
  content: string;
  reasoning?: string;
  tokensIn?: number;
  tokensOut?: number;
}

export class ProviderError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ProviderError";
  }

  /** 5xx, 429, timeout, dan error jaringan layak dicoba ulang dengan model cadangan. */
  get retryable(): boolean {
    return this.status === undefined || this.status === 429 || this.status >= 500;
  }
}

function endpoint(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/, "")}${path}`;
}

function headers(apiKey?: string | null): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) h.Authorization = `Bearer ${apiKey}`;
  return h;
}

async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body?.error?.message || body?.message || res.statusText;
  } catch {
    return res.statusText;
  }
}

export async function chat(req: ChatRequest): Promise<ChatResult> {
  const body: Record<string, unknown> = {
    model: req.model,
    messages: req.messages,
  };
  if (req.temperature !== undefined) body.temperature = req.temperature;
  if (req.maxTokens) body.max_tokens = req.maxTokens;
  if (req.responseFormat) body.response_format = req.responseFormat;

  let res: Response;
  try {
    res = await fetch(endpoint(req.baseUrl, "/chat/completions"), {
      method: "POST",
      headers: headers(req.apiKey),
      body: JSON.stringify(body),
      signal: req.signal,
      redirect: "error",
      cache: "no-store",
    });
  } catch (error) {
    const message = error instanceof Error && error.name === "TimeoutError" ? "Timeout" : "Gagal menghubungi provider";
    throw new ProviderError(message);
  }

  if (!res.ok) {
    throw new ProviderError(`${res.status}: ${await readError(res)}`, res.status);
  }

  const data = await res.json();
  const message = data?.choices?.[0]?.message ?? {};
  const content: string = typeof message.content === "string" ? message.content : "";
  const reasoning: string | undefined = typeof message.reasoning === "string" ? message.reasoning : undefined;

  return {
    // Model reasoning (GPT-OSS) kadang mengembalikan jawaban di field 'reasoning' saja.
    content: content || reasoning || "",
    reasoning,
    tokensIn: data?.usage?.prompt_tokens,
    tokensOut: data?.usage?.completion_tokens,
  };
}

export async function listModels(baseUrl: string, apiKey?: string | null, signal?: AbortSignal): Promise<string[]> {
  let res: Response;
  try {
    res = await fetch(endpoint(baseUrl, "/models"), {
      headers: headers(apiKey),
      signal,
      redirect: "error",
      cache: "no-store",
    });
  } catch {
    throw new ProviderError("Gagal menghubungi provider");
  }
  if (!res.ok) {
    throw new ProviderError(`${res.status}: ${await readError(res)}`, res.status);
  }
  const data = await res.json();
  const list: { id?: string }[] = Array.isArray(data?.data) ? data.data : [];
  return list.map((m) => m.id).filter((id): id is string => typeof id === "string").sort();
}
