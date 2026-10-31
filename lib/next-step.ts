// Saran "Langkah berikutnya" di beranda. Fungsi murni (tanpa akses database) agar mudah diuji.
import type { LearningGoal } from "./learning-goals";

export interface NextStepInput {
  goal: LearningGoal | null;
  /** Level CEFR pengguna; null jika belum pernah ditentukan. */
  cefr: string | null;
  /** Jumlah kata yang jatuh tempo untuk di-review. */
  dueCount: number;
  /** Bacaan terakhir yang belum selesai (teks Library atau buku Gutenberg). */
  continueReading?: { title: string; href: string } | null;
  /** Fase 10: level berikutnya jika semua syarat naik level terpenuhi dan tes boleh diambil; selain itu null. */
  levelUpTarget?: string | null;
  /** Fase 9: bacaan sesuai level pengguna. Boleh dikosongkan sebelum fitur itu ada. */
  levelText?: { title: string; href: string; minutes?: number } | null;
}

export interface NextStep {
  title: string;
  href: string;
  reason: string;
}

const GOAL_FALLBACK: Record<LearningGoal, NextStep> = {
  umum: {
    title: "Latih tata bahasa di Grammar Clinic",
    href: "/english-lab/grammar-clinic",
    reason: "Latihan singkat setiap hari membantu bahasa Inggrismu bertahan.",
  },
  sastra: {
    title: "Pilih satu karya di Buku Klasik",
    href: "/gutenberg",
    reason: "Mulai dari bab pendek, lalu simpan kata yang belum kamu kenal.",
  },
  penerjemahan: {
    title: "Terjemahkan satu paragraf di Translation Workshop",
    href: "/translation-workshop",
    reason: "Satu paragraf per hari sudah cukup untuk membangun kebiasaan.",
  },
};

/** Prioritas: review jatuh tempo > Tes Naik Level (jika siap) > lanjutkan bacaan > bacaan sesuai level > tes level > alat sesuai tujuan. */
export function getNextStep(input: NextStepInput): NextStep {
  const { goal, cefr, dueCount, continueReading, levelText, levelUpTarget } = input;

  if (dueCount > 0) {
    return {
      title: `Review ${dueCount} kata`,
      href: "/review",
      reason: "Kata ini sudah waktunya diulang. Mengulang tepat waktu membuatnya lebih awet.",
    };
  }

  if (levelUpTarget) {
    return {
      title: `Ikuti Tes Naik Level ke ${levelUpTarget}`,
      href: "/english-lab/level-test",
      reason: "Semua syarat naik levelmu sudah terpenuhi. Tes ini hanya 10-15 menit.",
    };
  }

  if (continueReading) {
    return {
      title: `Lanjutkan membaca: ${continueReading.title}`,
      href: continueReading.href,
      reason: "Kamu berhenti di tengah bacaan ini.",
    };
  }

  if (levelText) {
    const duration = levelText.minutes ? ` (${levelText.minutes} menit)` : "";
    return {
      title: `Baca${cefr ? ` teks ${cefr}` : ""}: ${levelText.title}${duration}`,
      href: levelText.href,
      reason: "Teks ini sesuai levelmu.",
    };
  }

  if (!cefr) {
    return {
      title: "Ikuti Placement Test",
      href: "/english-lab/placement-test",
      reason: "Tes singkat untuk mengetahui levelmu, supaya saran bacaan lebih pas.",
    };
  }

  return GOAL_FALLBACK[goal ?? "umum"];
}
