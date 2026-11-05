// Aturan murni alur onboarding (Fase 21). Tanpa impor agar bisa diuji unit (tests/next-step.test.mts).

/** Level dari pilihan "Baru mulai dari nol": tanpa tes, disimpan sebagai A1. */
export const LEVEL_ZERO = "zero" as const;

/** Unit pertama Kursus Dasar, tujuan pemula yang memilih "Baru mulai dari nol". */
export const FIRST_COURSE_UNIT = "bunyi-huruf";

const CEFR = ["A1", "A2", "B1", "B2", "C1", "C2"];

/** Level CEFR yang disimpan ke profil untuk jawaban onboarding; null = level tidak diubah. */
export function onboardingCefr(level: unknown): string | null {
  if (level === LEVEL_ZERO) return "A1";
  return typeof level === "string" && CEFR.includes(level) ? level : null;
}

/**
 * Tujuan setelah onboarding: dilewati → Beranda; "belum tahu" → placement test;
 * "nol" → unit pertama bila Kursus Dasar boleh tampil, jika tidak Beranda.
 */
export function onboardingDestination(input: { level: unknown; skipped?: boolean; courseVisible: boolean }): string {
  if (input.skipped) return "/dashboard";
  if (input.level === "unknown") return "/english-lab/placement-test";
  if (input.level === LEVEL_ZERO && input.courseVisible) return `/kursus/${FIRST_COURSE_UNIT}`;
  return "/dashboard";
}
