// Validasi hasil /api/analyze-tone (Fase 14f). Murni, tanpa import, diuji unit.

export const TONES = ["neutral", "formal", "sarcastic", "ironic", "humorous", "melancholic", "dramatic", "romantic", "ominous", "urgent"] as const;
export type Tone = (typeof TONES)[number];

export const MAX_TONE_TEXT = 1000;
export const MAX_TONE_CONTEXT = 2000;

export interface ToneResult {
  tone: Tone;
  confidence: number;
  markers: string[];
  preservation_tips: string;
  better_translation: string;
}

function str(v: unknown, max = 1500): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/** Bentuk respons yang rapi dari keluaran model; null bila tidak ada nada yang dikenali. */
export function sanitizeToneResult(raw: unknown): ToneResult | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const tone = str(o.tone).toLowerCase() as Tone;
  if (!(TONES as readonly string[]).includes(tone)) return null;
  const n = typeof o.confidence === "number" ? o.confidence : Number(o.confidence);
  const confidence = Number.isFinite(n) ? Math.round(Math.min(100, Math.max(0, n))) : 0;
  const markers = Array.isArray(o.markers) ? o.markers.map((m) => str(m, 120)).filter(Boolean).slice(0, 8) : [];
  return {
    tone,
    confidence,
    markers,
    preservation_tips: str(o.preservation_tips),
    better_translation: str(o.better_translation),
  };
}
