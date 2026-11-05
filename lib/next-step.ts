// Saran "Langkah berikutnya" di beranda. Fungsi murni (tanpa akses database) agar mudah diuji.
import type { LearningGoal } from "./learning-goals";

/** Pemula baru (Fase 21): level A1 dan belum menyelesaikan dua unit Kursus Dasar pertama. */
export const BEGINNER_UNITS = 2;

export function isNewBeginner(input: { cefr: string | null; completedUnits: number | null | undefined }): boolean {
  return input.cefr === "A1" && typeof input.completedUnits === "number" && input.completedUnits < BEGINNER_UNITS;
}

export interface NextStepInput {
  goal: LearningGoal | null;
  /** Level CEFR pengguna; null jika belum pernah ditentukan. */
  cefr: string | null;
  /** Jumlah kata yang jatuh tempo untuk di-review. */
  dueCount: number;
  /** Fase 15: topik grammar yang jadwal reviewnya sudah lewat (yang paling lama menunggu); null jika tidak ada. */
  grammarDue?: { count: number; slug: string; title: string } | null;
  /** Fase 16: unit Kursus Dasar yang disarankan (lib/course.ts). Isi hanya bila kursus boleh tampil (flag `kursus_dasar` / admin). */
  courseUnit?: { title: string; href: string; started: boolean } | null;
  /** Bacaan terakhir yang belum selesai (teks Library atau buku Gutenberg). */
  continueReading?: { title: string; href: string } | null;
  /** Fase 21: jumlah unit Kursus Dasar yang sudah selesai; undefined bila kursus tidak boleh tampil (Beranda tidak berubah). */
  completedUnits?: number | null;
  /** Fase 10: level berikutnya jika semua syarat naik level terpenuhi dan tes boleh diambil; selain itu null. */
  levelUpTarget?: string | null;
  /** Fase 9: bacaan sesuai level pengguna. Boleh dikosongkan sebelum fitur itu ada. */
  levelText?: { title: string; href: string; minutes?: number } | null;
}

export interface NextStep {
  title: string;
  href: string;
  reason: string;
  /** Perkiraan waktu dalam menit; hanya diisi untuk langkah yang durasinya diketahui. */
  minutes?: number;
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

/** Perkiraan durasi satu sesi unit Kursus Dasar (menit). */
export const COURSE_SESSION_MINUTES = 10;

/**
 * Prioritas: review kata jatuh tempo > (pemula baru: unit Kursus Dasar) > review topik grammar jatuh tempo > Tes Naik Level (jika siap) > lanjutkan bacaan > unit Kursus Dasar > bacaan sesuai level > tes level > alat sesuai tujuan. */
export function getNextStep(input: NextStepInput): NextStep {
  const { goal, cefr, dueCount, grammarDue, courseUnit, continueReading, levelText, levelUpTarget, completedUnits } = input;

  if (dueCount > 0) {
    return {
      title: `Review ${dueCount} kata`,
      href: "/review",
      reason: grammarDue && grammarDue.count > 0
        ? `Kata ini sudah waktunya diulang. Ada juga ${grammarDue.count} topik grammar yang perlu diulang.`
        : "Kata ini sudah waktunya diulang. Mengulang tepat waktu membuatnya lebih awet.",
    };
  }

  // Pemula baru: unit kursus didahulukan di atas review grammar, bacaan, dan pilihan bawaan lain (review kata tetap paling atas)
  if (courseUnit && isNewBeginner({ cefr, completedUnits })) {
    return {
      title: `${courseUnit.started ? "Lanjutkan" : "Mulai"}: ${courseUnit.title}`,
      href: courseUnit.href,
      reason: courseUnit.started ? "Kamu sudah memulai unit ini. Lanjutkan langkah berikutnya." : "Langkah pertama yang paling pas untuk pemula: pendek, bertahap, dan tanpa tes.",
      minutes: COURSE_SESSION_MINUTES,
    };
  }

  if (grammarDue && grammarDue.count > 0) {
    return {
      title: grammarDue.count > 1 ? `Review grammar: ${grammarDue.title} (+${grammarDue.count - 1} topik)` : `Review grammar: ${grammarDue.title}`,
      href: `/english-lab/grammar/${grammarDue.slug}?review=1`,
      reason: "Topik ini sudah waktunya diulang. Beberapa soal singkat cukup untuk mengingatkan.",
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

  if (courseUnit) {
    return {
      title: `${courseUnit.started ? "Lanjutkan" : "Mulai"} Kursus Dasar: ${courseUnit.title}`,
      href: courseUnit.href,
      reason: courseUnit.started ? "Kamu sudah memulai unit ini. Lanjutkan langkah berikutnya." : "Unit berikutnya di Kursus Dasar, langkah demi langkah.",
      minutes: COURSE_SESSION_MINUTES,
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
