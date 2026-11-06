// Akses database Modul Belajar (Fase 24). Hanya untuk server. Semua fungsi menangani migrasi 0023 yang belum
// dijalankan: `available: false`, bukan error. Pengguna biasa hanya menerima baris terbit (RLS); admin juga menerima draf.
import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingSchema } from "@/lib/skill-evidence";
import type { LessonSource } from "@/lib/study";

export interface SubjectRow {
  slug: string;
  stage: string;
  title: string;
  description_id: string;
  outcomes: string[];
  room_slug: string | null;
  sources: LessonSource[];
  sort_order: number;
  status: "draft" | "published";
}

export interface LessonRow {
  slug: string;
  subject_slug: string;
  sort_order: number;
  title: string;
  objectives: string[];
  body_md: string;
  summary_md: string;
  task: { prompt: string } | null;
  tool_paths: string[];
  sources: LessonSource[];
  status: "draft" | "published";
  origin: "claude" | "manual" | "ai";
  edited_at: string | null;
  reviewed_at: string | null;
}

const SUBJECT_COLUMNS = "slug, stage, title, description_id, outcomes, room_slug, sources, sort_order, status";
const LESSON_LIST_COLUMNS = "slug, subject_slug, sort_order, title, status";
export const LESSON_COLUMNS = "slug, subject_slug, sort_order, title, objectives, body_md, summary_md, task, tool_paths, sources, status, origin, edited_at, reviewed_at";

const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

function toSubject(r: Record<string, unknown>): SubjectRow {
  return { ...(r as unknown as SubjectRow), outcomes: asArray<string>(r.outcomes), sources: asArray<LessonSource>(r.sources) };
}

function toLesson(r: Record<string, unknown>): LessonRow {
  return {
    ...(r as unknown as LessonRow),
    objectives: asArray<string>(r.objectives),
    sources: asArray<LessonSource>(r.sources),
    tool_paths: asArray<string>(r.tool_paths),
    task: r.task && typeof r.task === "object" && typeof (r.task as { prompt?: unknown }).prompt === "string" ? (r.task as { prompt: string }) : null,
  };
}

/** Semua mata pelajaran (urutan belajar) dan ringkasan pelajarannya; `available: false` bila tabel belum ada. */
export async function loadStudyIndex(supabase: SupabaseClient): Promise<{
  available: boolean;
  subjects: SubjectRow[];
  lessons: Pick<LessonRow, "slug" | "subject_slug" | "sort_order" | "title" | "status">[];
}> {
  const [subjectsRes, lessonsRes] = await Promise.all([
    supabase.from("study_subjects").select(SUBJECT_COLUMNS).order("sort_order"),
    supabase.from("study_lessons").select(LESSON_LIST_COLUMNS).order("sort_order"),
  ]);
  if (subjectsRes.error || lessonsRes.error) {
    const err = subjectsRes.error ?? lessonsRes.error;
    if (err && !isMissingSchema(err)) console.error("loadStudyIndex gagal:", err.message);
    return { available: false, subjects: [], lessons: [] };
  }
  return {
    available: true,
    subjects: (subjectsRes.data || []).map((r) => toSubject(r as Record<string, unknown>)),
    lessons: (lessonsRes.data || []) as Pick<LessonRow, "slug" | "subject_slug" | "sort_order" | "title" | "status">[],
  };
}

/** Slug pelajaran yang sudah diselesaikan pengguna. Kosong bila tabel belum ada. */
export async function loadCompletedLessons(supabase: SupabaseClient, userId: string): Promise<Set<string>> {
  const { data, error } = await supabase.from("lesson_progress").select("lesson_slug").eq("user_id", userId);
  if (error) {
    if (!isMissingSchema(error)) console.error("loadCompletedLessons gagal:", error.message);
    return new Set();
  }
  return new Set((data || []).map((r) => String(r.lesson_slug)));
}

export async function loadSubject(supabase: SupabaseClient, slug: string): Promise<{ available: boolean; subject: SubjectRow | null }> {
  const { data, error } = await supabase.from("study_subjects").select(SUBJECT_COLUMNS).eq("slug", slug).maybeSingle();
  if (error) return { available: !isMissingSchema(error), subject: null };
  return { available: true, subject: data ? toSubject(data as Record<string, unknown>) : null };
}

export async function loadLesson(supabase: SupabaseClient, slug: string): Promise<{ available: boolean; lesson: LessonRow | null }> {
  const { data, error } = await supabase.from("study_lessons").select(LESSON_COLUMNS).eq("slug", slug).maybeSingle();
  if (error) return { available: !isMissingSchema(error), lesson: null };
  return { available: true, lesson: data ? toLesson(data as Record<string, unknown>) : null };
}

/** Jawaban tugas pribadi pengguna ("" bila belum ada). */
export async function loadTask(supabase: SupabaseClient, userId: string, lessonSlug: string): Promise<string> {
  const { data } = await supabase.from("lesson_tasks").select("content").eq("user_id", userId).eq("lesson_slug", lessonSlug).maybeSingle();
  return typeof data?.content === "string" ? data.content : "";
}

/** Jumlah soal terbit per pelajaran dan jumlah soal kuis akhir sebuah mata pelajaran. Kolom belum ada → 0. */
export async function countLessonExercises(supabase: SupabaseClient, lessonSlug: string): Promise<number> {
  const { count, error } = await supabase.from("exercises").select("id", { count: "exact", head: true }).eq("status", "published").eq("lesson_slug", lessonSlug);
  return error ? 0 : count ?? 0;
}

export async function countQuizExercises(supabase: SupabaseClient, subjectSlug: string): Promise<number> {
  const { count, error } = await supabase
    .from("exercises")
    .select("id", { count: "exact", head: true })
    .eq("status", "published")
    .eq("subject_slug", subjectSlug)
    .is("lesson_slug", null);
  return error ? 0 : count ?? 0;
}
