// Kelompok rate limit yang dibaca getRateLimit() di lib/ai-config.ts
export const RATE_LIMIT_USE_CASES = ["lookup", "translation", "generation", "tools"] as const;

export const RATE_LIMIT_LABELS: Record<(typeof RATE_LIMIT_USE_CASES)[number], string> = {
  lookup: "Lookup & Lexicon",
  translation: "Terjemahan & Comparator",
  generation: "Generator teks",
  tools: "Tools AI lainnya",
};

export const DEFAULT_RATE_LIMIT = { requests_per_minute: 30, requests_per_hour: 500 };
