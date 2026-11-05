// Aturan murni untuk batas pemakaian lintas instance (Fase 19.3). Tanpa import agar bisa diuji unit.

export const DEFAULT_PER_DAY = 1000;

export type RpcError = { code?: string; message?: string; status?: number } | null | undefined;

/** Fungsi consume_rate_limit belum ada (migrasi 0019 belum dijalankan): 42883 (Postgres) / PGRST202 (PostgREST). */
export function isMissingRpc(error: RpcError): boolean {
  if (!error) return false;
  if (error.code === "42883" || error.code === "PGRST202") return true;
  return /could not find the function|function .* does not exist/i.test(error.message ?? "");
}

/** Hitungan dikembalikan SETELAH penambahan, jadi ditolak bila sudah melewati batas. */
export function isOverLimit(count: number, limit: number): boolean {
  return count > limit;
}

export type WindowSpec = { name: "minute" | "hour" | "day"; seconds: number; limit: number; retryAfter: number };

export function windowSpecs(limits: { perMinute: number; perHour: number; perDay: number }): WindowSpec[] {
  return [
    { name: "minute", seconds: 60, limit: limits.perMinute, retryAfter: 60 },
    { name: "hour", seconds: 3600, limit: limits.perHour, retryAfter: 3600 },
    { name: "day", seconds: 86400, limit: limits.perDay, retryAfter: 3600 },
  ];
}

export function limitMessage(name: WindowSpec["name"], limit: number): string {
  if (name === "minute") return `Batas pemakaian AI tercapai (maksimum ${limit} request/menit). Silakan tunggu sebentar.`;
  if (name === "hour") return "Batas pemakaian AI per jam tercapai. Silakan coba kembali nanti.";
  return "Batas pemakaian AI harian tercapai. Silakan coba lagi besok.";
}
