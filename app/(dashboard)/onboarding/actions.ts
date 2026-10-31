"use server";

import { createClient } from "@/utils/supabase/server";
import {
  LEVEL_UNKNOWN,
  isCefrLevel,
  isDailyMinutes,
  isLearningGoal,
  type CefrLevel,
  type DailyMinutes,
  type LearningGoal,
} from "@/lib/learning-goals";

export type OnboardingResult = { ok: true; next: string } | { ok: false; error: string };

export type OnboardingInput = {
  level: CefrLevel | typeof LEVEL_UNKNOWN | null;
  goal: LearningGoal | null;
  minutes: DailyMinutes | null;
  skipped?: boolean;
};

/**
 * Simpan jawaban onboarding ke profil pengguna (sesi pengguna, bukan service role).
 * Server Action bisa dipanggil langsung lewat POST, jadi input divalidasi ulang di sini.
 */
export async function saveOnboarding(input: OnboardingInput): Promise<OnboardingResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Silakan masuk terlebih dahulu." };

  // Dilewati → tujuan default "umum"; level tidak diubah
  const goal = input.skipped ? "umum" : input.goal;
  if (!isLearningGoal(goal)) return { ok: false, error: "Pilih tujuan belajar terlebih dahulu." };

  const update: Record<string, unknown> = {
    learning_goal: goal,
    onboarded_at: new Date().toISOString(),
  };
  if (!input.skipped) {
    if (!isDailyMinutes(input.minutes)) return { ok: false, error: "Pilih waktu belajar per hari." };
    update.daily_minutes = input.minutes;
    if (isCefrLevel(input.level)) update.cefr_level = input.level;
    else if (input.level !== LEVEL_UNKNOWN) return { ok: false, error: "Pilih level bahasa Inggris." };
  }

  const { error } = await supabase.from("profiles").update(update).eq("id", user.id);
  if (error) {
    // 42703 / PGRST204: migrasi 0006 belum dijalankan
    if (error.code === "42703" || error.code === "PGRST204") {
      return { ok: false, error: "Fitur onboarding belum aktif di database (migrasi 0006 belum dijalankan)." };
    }
    return { ok: false, error: "Gagal menyimpan. Coba lagi." };
  }

  const next = !input.skipped && input.level === LEVEL_UNKNOWN ? "/english-lab/placement-test" : "/dashboard";
  return { ok: true, next };
}

/** Ubah tujuan & waktu belajar dari Pengaturan (tidak menyentuh onboarded_at). */
export async function saveLearningGoal(goal: LearningGoal, minutes: DailyMinutes): Promise<OnboardingResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Silakan masuk terlebih dahulu." };
  if (!isLearningGoal(goal) || !isDailyMinutes(minutes)) return { ok: false, error: "Pilihan tidak valid." };

  const { error } = await supabase
    .from("profiles")
    .update({ learning_goal: goal, daily_minutes: minutes })
    .eq("id", user.id);
  if (error) {
    if (error.code === "42703" || error.code === "PGRST204") {
      return { ok: false, error: "Migrasi 0006 belum dijalankan." };
    }
    return { ok: false, error: "Gagal menyimpan. Coba lagi." };
  }
  return { ok: true, next: "/dashboard" };
}
