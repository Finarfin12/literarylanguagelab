// Pilihan onboarding & tujuan belajar. Dipakai halaman onboarding, Pengaturan, menu, dan beranda.
// File biasa (bukan "use server") supaya konstanta boleh diekspor.

import { CEFR_LEVELS, isCefrLevel, type CefrLevel } from "./cefr";

// Level CEFR didefinisikan di lib/cefr.ts; diekspor ulang agar impor lama tetap jalan.
export { CEFR_LEVELS, isCefrLevel, type CefrLevel };

export const LEARNING_GOALS = ["umum", "sastra", "penerjemahan"] as const;
export type LearningGoal = (typeof LEARNING_GOALS)[number];

export const GOAL_LABELS: Record<LearningGoal, { title: string; description: string }> = {
  umum: { title: "Bahasa Inggris sehari-hari", description: "Membaca, kosakata, dan grammar untuk keperluan umum." },
  sastra: { title: "Memahami karya sastra", description: "Membaca karya klasik dan membedah gaya bahasanya." },
  penerjemahan: { title: "Latihan menerjemahkan", description: "Menerjemahkan, membandingkan, dan menilai hasil terjemahan." },
};

export const CEFR_LABELS: Record<CefrLevel, string> = {
  A1: "A1 - Pemula",
  A2: "A2 - Dasar",
  B1: "B1 - Menengah",
  B2: "B2 - Menengah atas",
  C1: "C1 - Mahir",
  C2: "C2 - Sangat mahir",
};

export const DAILY_MINUTES = [10, 20, 30] as const;
export type DailyMinutes = (typeof DAILY_MINUTES)[number];

/** Level dari pilihan "Belum tahu, tes dulu". */
export const LEVEL_UNKNOWN = "unknown" as const;

export function isLearningGoal(v: unknown): v is LearningGoal {
  return typeof v === "string" && (LEARNING_GOALS as readonly string[]).includes(v);
}

export function isDailyMinutes(v: unknown): v is DailyMinutes {
  return typeof v === "number" && (DAILY_MINUTES as readonly number[]).includes(v);
}
