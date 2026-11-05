// Aturan validasi badan permintaan untuk route AI (Fase 19.2).
// Fungsi murni (tanpa import) agar bisa diuji unit; dipakai oleh lib/ai/guard.ts.

export type BodyLimits = {
  /** Total karakter dari semua string di badan permintaan. */
  maxChars: number;
  /** Jumlah item maksimum untuk setiap larik tingkat atas (messages, answers, dst.). */
  maxMessages: number;
};

export type BodyCheck =
  | { ok: true; body: Record<string, unknown> }
  | { ok: false; status: number; error: string };

const MAX_DEPTH = 6;
const ROLES = new Set(["user", "assistant"]);

/** Menjumlahkan panjang semua string; berhenti lebih awal begitu melewati batas. */
export function countChars(value: unknown, limit: number, depth = 0): number {
  if (typeof value === "string") return value.length;
  if (depth >= MAX_DEPTH || value === null || typeof value !== "object") return 0;
  let total = 0;
  const items = Array.isArray(value) ? value : Object.values(value as Record<string, unknown>);
  for (const item of items) {
    total += countChars(item, limit - total, depth + 1);
    if (total > limit) return total;
  }
  return total;
}

export function validateBody(body: unknown, limits: BodyLimits): BodyCheck {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, status: 400, error: "Permintaan tidak valid." };
  }
  const record = body as Record<string, unknown>;

  for (const value of Object.values(record)) {
    if (Array.isArray(value) && value.length > limits.maxMessages) {
      return {
        ok: false,
        status: 413,
        error: `Terlalu banyak item dalam satu permintaan (maksimum ${limits.maxMessages}).`,
      };
    }
  }

  // Pesan percakapan hanya boleh berperan user/assistant: peran system tidak boleh datang dari klien.
  if (record.messages !== undefined) {
    if (!Array.isArray(record.messages)) {
      return { ok: false, status: 400, error: "Format pesan tidak valid." };
    }
    for (const m of record.messages) {
      const msg = m as { role?: unknown; content?: unknown } | null;
      if (!msg || typeof msg !== "object" || typeof msg.role !== "string" || !ROLES.has(msg.role) || typeof msg.content !== "string") {
        return { ok: false, status: 400, error: "Format pesan tidak valid." };
      }
    }
  }

  if (countChars(record, limits.maxChars) > limits.maxChars) {
    return {
      ok: false,
      status: 413,
      error: `Teks terlalu panjang (maksimum ${limits.maxChars.toLocaleString("id-ID")} karakter per permintaan).`,
    };
  }

  return { ok: true, body: record };
}
