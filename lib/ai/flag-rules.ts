// Aturan murni feature flag (Fase 19.4). Tanpa import agar bisa diuji unit; dipakai lib/ai/flags.ts.

/**
 * Fitur yang bawaannya MATI: tetap mati selama belum dinyalakan admin secara eksplisit,
 * termasuk saat konfigurasi gagal dibaca. Key lain yang tak terdaftar dianggap aktif (B-07).
 */
export const FEATURE_DEFAULTS: Readonly<Record<string, boolean>> = {
  kursus_dasar: false,
  modul_belajar: false,
};

/** Nilai satu flag: nilai tersimpan → bawaan fitur eksperimen → aktif. */
export function resolveFlag(stored: Record<string, boolean> | null | undefined, key: string): boolean {
  const v = stored?.[key];
  if (typeof v === "boolean") return v;
  return FEATURE_DEFAULTS[key] ?? true;
}

/** Peta lengkap untuk pemanggil lama (`flags[key] === true`): bawaan ditimpa nilai tersimpan. */
export function withDefaults(stored: Record<string, boolean> | null | undefined): Record<string, boolean> {
  return { ...FEATURE_DEFAULTS, ...(stored ?? {}) };
}
