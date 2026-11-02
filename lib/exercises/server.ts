// Akses database mesin latihan & review grammar (Fase 15). Hanya untuk server (route API / Server Component).
// Semua fungsi menangani migrasi 0012 yang belum dijalankan: `available: false`, bukan error.
import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateSM2 } from "@/lib/spaced-repetition";
import { isMissingSchema, recordEvidence } from "@/lib/skill-evidence";
import { exerciseSkill, gradeAnswer, parseExerciseRow } from "./grade";
import { INITIAL_GRAMMAR_STATE, qualityFromScore, scheduleGrammarReview, type GrammarProgressState } from "./review";
import type { Exercise, ExerciseSkill } from "./types";

export interface GrammarProgressRow {
  topic_slug: string;
  completed_at: string | null;
  next_review_at: string | null;
  interval: number | null;
  efactor: number | null;
  repetitions: number | null;
}

const PROGRESS_COLUMNS = "topic_slug, completed_at, next_review_at, interval, efactor, repetitions";

const stateOf = (row: GrammarProgressRow | null | undefined): GrammarProgressState => ({
  interval: row?.interval ?? INITIAL_GRAMMAR_STATE.interval,
  efactor: row?.efactor ?? INITIAL_GRAMMAR_STATE.efactor,
  repetitions: row?.repetitions ?? 0,
});

/** Semua baris kemajuan grammar milik pengguna; `available: false` bila tabel belum ada. */
export async function loadGrammarProgress(supabase: SupabaseClient, userId: string): Promise<{ available: boolean; rows: GrammarProgressRow[] }> {
  const { data, error } = await supabase.from("grammar_progress").select(PROGRESS_COLUMNS).eq("user_id", userId);
  if (error) {
    if (!isMissingSchema(error)) console.error("loadGrammarProgress gagal:", error.message);
    return { available: false, rows: [] };
  }
  return { available: true, rows: (data || []) as GrammarProgressRow[] };
}

/** Menandai topik selesai (jadwal review pertama: 1 hari) atau membatalkannya. Topik yang sudah selesai tidak dijadwal ulang. */
export async function setGrammarDone(supabase: SupabaseClient, userId: string, slug: string, done: boolean, now = new Date()): Promise<{ ok: boolean; available: boolean }> {
  const { data: existing, error: readError } = await supabase.from("grammar_progress").select(PROGRESS_COLUMNS).eq("user_id", userId).eq("topic_slug", slug).maybeSingle();
  if (readError) return { ok: false, available: !isMissingSchema(readError) };
  const row = existing as GrammarProgressRow | null;

  if (!done) {
    if (!row) return { ok: true, available: true };
    const { error } = await supabase
      .from("grammar_progress")
      .update({ completed_at: null, next_review_at: null, interval: INITIAL_GRAMMAR_STATE.interval, efactor: INITIAL_GRAMMAR_STATE.efactor, repetitions: 0 })
      .eq("user_id", userId)
      .eq("topic_slug", slug);
    return { ok: !error, available: true };
  }
  if (row?.completed_at) return { ok: true, available: true };

  const schedule = scheduleGrammarReview(INITIAL_GRAMMAR_STATE, 4, now, calculateSM2);
  const { error } = await supabase.from("grammar_progress").upsert(
    {
      user_id: userId,
      topic_slug: slug,
      completed_at: now.toISOString(),
      next_review_at: schedule.next_review_at,
      interval: schedule.interval,
      efactor: schedule.efactor,
      repetitions: schedule.repetitions,
    },
    { onConflict: "user_id,topic_slug" }
  );
  return { ok: !error, available: true };
}

/** Menerapkan hasil review (kualitas SM-2 0-5) ke topik yang sudah selesai. null jika topik belum selesai / tabel belum ada. */
export async function applyGrammarReview(
  supabase: SupabaseClient,
  userId: string,
  slug: string,
  quality: number,
  now = new Date(),
  onlyIfDue = false
): Promise<{ next_review_at: string; interval: number } | null> {
  const { data, error } = await supabase.from("grammar_progress").select(PROGRESS_COLUMNS).eq("user_id", userId).eq("topic_slug", slug).maybeSingle();
  const row = data as GrammarProgressRow | null;
  if (error || !row?.completed_at) return null;
  if (onlyIfDue && row.next_review_at && new Date(row.next_review_at).getTime() > now.getTime()) return null;

  const schedule = scheduleGrammarReview(stateOf(row), quality, now, calculateSM2);
  const { error: updateError } = await supabase
    .from("grammar_progress")
    .update({ next_review_at: schedule.next_review_at, interval: schedule.interval, efactor: schedule.efactor, repetitions: schedule.repetitions })
    .eq("user_id", userId)
    .eq("topic_slug", slug);
  return updateError ? null : { next_review_at: schedule.next_review_at, interval: schedule.interval };
}

/** Memuat dan memvalidasi soal terbit berdasarkan id. Baris yang rusak dilewati. */
export async function loadPublishedExercises(supabase: SupabaseClient, ids: string[]): Promise<{ available: boolean; exercises: Exercise[] }> {
  if (ids.length === 0) return { available: true, exercises: [] };
  const { data, error } = await supabase.from("exercises").select("*").in("id", ids).eq("status", "published");
  if (error) return { available: !isMissingSchema(error), exercises: [] };
  return { available: true, exercises: (data || []).map(parseExerciseRow).filter((e): e is Exercise => e !== null) };
}

export interface FinishSummary {
  total: number;
  correct: number;
  scorePct: number;
  review: { next_review_at: string; interval: number } | null;
}

/**
 * Menutup satu sesi latihan: menghitung hasil dari percobaan TERBARU tiap soal (dinilai server, bukan klien),
 * mencatat satu bukti kemampuan per keterampilan, dan — bila topik sedang jatuh tempo — memperbarui jadwal reviewnya.
 */
export async function finishExerciseSession(
  supabase: SupabaseClient,
  userId: string,
  exerciseIds: string[],
  topicSlug: string | null,
  now = new Date()
): Promise<FinishSummary | null> {
  const since = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();
  const [{ exercises }, attemptsRes] = await Promise.all([
    loadPublishedExercises(supabase, exerciseIds),
    supabase.from("exercise_attempts").select("exercise_id, correct, created_at").eq("user_id", userId).in("exercise_id", exerciseIds).gte("created_at", since).order("created_at", { ascending: false }),
  ]);
  if (attemptsRes.error) return null;

  const latest = new Map<string, boolean>();
  for (const a of attemptsRes.data || []) if (!latest.has(a.exercise_id)) latest.set(a.exercise_id, a.correct);

  const perSkill = new Map<ExerciseSkill, { total: number; correct: number }>();
  let total = 0;
  let correct = 0;
  for (const ex of exercises) {
    if (!latest.has(ex.id)) continue;
    const ok = latest.get(ex.id) === true;
    total++;
    if (ok) correct++;
    const skill = exerciseSkill(ex);
    const s = perSkill.get(skill) ?? { total: 0, correct: 0 };
    s.total++;
    if (ok) s.correct++;
    perSkill.set(skill, s);
  }
  if (total === 0) return null;

  const scorePct = Math.round((correct / total) * 100);
  for (const [skill, s] of perSkill) {
    await recordEvidence(supabase, userId, { skill, source: "exercise-session", score: Math.round((s.correct / s.total) * 100), ref_id: topicSlug });
  }

  const review = topicSlug ? await applyGrammarReview(supabase, userId, topicSlug, qualityFromScore(scorePct), now, true) : null;
  return { total, correct, scorePct, review };
}

/** Menilai dan mencatat satu jawaban. null bila soal tidak ditemukan / belum terbit. */
export async function submitAttempt(
  supabase: SupabaseClient,
  userId: string,
  exerciseId: string,
  response: unknown
): Promise<{ available: boolean; result: ReturnType<typeof gradeAnswer> | null }> {
  const { available, exercises } = await loadPublishedExercises(supabase, [exerciseId]);
  const exercise = exercises[0];
  if (!exercise) return { available, result: null };
  const result = gradeAnswer(exercise, response);
  // Catat sebagai best effort: gagal mencatat tidak boleh menggagalkan umpan balik ke pengguna
  const { error } = await supabase.from("exercise_attempts").insert({ user_id: userId, exercise_id: exercise.id, correct: result.correct, response: response ?? null });
  if (error) console.error("Gagal mencatat percobaan latihan:", error.message);
  return { available: true, result };
}
