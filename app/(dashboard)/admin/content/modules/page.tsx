import Link from "next/link";
import { Library } from "lucide-react";
import { requireAdminPage } from "../../_lib/guard";
import { AdminPageHeader, MigrationNotice, Notice } from "../../_lib/ui";
import { MISSING_SCHEMA_CODES } from "../../_lib/content-types";
import { getFeatureFlags } from "@/lib/ai/flags";
import { STUDY_FLAG } from "@/lib/study-access";
import { LESSON_COLUMNS, type LessonRow, type SubjectRow } from "@/lib/study-server";
import { checkLesson } from "@/lib/lesson-check";
import { allRoomPaths } from "@/lib/rooms";
import ContentSubnav from "../ContentSubnav";
import ModuleManager, { type AdminLesson, type AdminSubject } from "./ModuleManager";

export const dynamic = "force-dynamic";

export default async function AdminModulesPage() {
  const { supabase } = await requireAdminPage();

  const [subjectsRes, lessonsRes, exercisesRes, flags] = await Promise.all([
    supabase.from("study_subjects").select("slug, stage, title, description_id, outcomes, room_slug, sources, sort_order, status").order("sort_order"),
    supabase.from("study_lessons").select(LESSON_COLUMNS).order("sort_order"),
    // Soal terkait pelajaran/kuis (kolom dari migrasi 0023); error diabaikan
    supabase.from("exercises").select("lesson_slug, subject_slug, status").or("lesson_slug.not.is.null,subject_slug.not.is.null").limit(5000),
    getFeatureFlags(),
  ]);

  const missing = !!subjectsRes.error && !!subjectsRes.error.code && MISSING_SCHEMA_CODES.includes(subjectsRes.error.code);
  const known = allRoomPaths();

  const perLesson = new Map<string, number>();
  const quiz = new Map<string, number>();
  for (const r of (exercisesRes.error ? [] : exercisesRes.data || []) as { lesson_slug: string | null; subject_slug: string | null }[]) {
    if (r.lesson_slug) perLesson.set(r.lesson_slug, (perLesson.get(r.lesson_slug) ?? 0) + 1);
    else if (r.subject_slug) quiz.set(r.subject_slug, (quiz.get(r.subject_slug) ?? 0) + 1);
  }

  const lessons: AdminLesson[] = ((lessonsRes.error ? [] : lessonsRes.data || []) as unknown as LessonRow[]).map((l) => {
    const objectives = Array.isArray(l.objectives) ? l.objectives : [];
    const sources = Array.isArray(l.sources) ? l.sources : [];
    const toolPaths = Array.isArray(l.tool_paths) ? l.tool_paths : [];
    const check = checkLesson({ title: l.title, objectives, body_md: l.body_md, summary_md: l.summary_md, tool_paths: toolPaths, sources }, perLesson.get(l.slug) ?? 0, known);
    return {
      slug: l.slug,
      subject_slug: l.subject_slug,
      sort_order: l.sort_order,
      title: l.title,
      objectives,
      body_md: l.body_md,
      summary_md: l.summary_md,
      task: l.task && typeof l.task.prompt === "string" ? l.task.prompt : "",
      tool_paths: toolPaths,
      sources,
      status: l.status,
      origin: l.origin,
      edited_at: l.edited_at,
      reviewed_at: l.reviewed_at,
      exercises: perLesson.get(l.slug) ?? 0,
      wordCount: check.wordCount,
      problems: check.items.filter((i) => !i.ok).map((i) => `${i.label}: ${i.detail}`),
    };
  });

  const subjects: AdminSubject[] = ((subjectsRes.error ? [] : subjectsRes.data || []) as unknown as SubjectRow[]).map((s) => ({
    slug: s.slug,
    stage: s.stage,
    title: s.title,
    sort_order: s.sort_order,
    status: s.status,
    quizCount: quiz.get(s.slug) ?? 0,
  }));
  const flagOn = flags[STUDY_FLAG] === true;

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto pb-24">
      <AdminPageHeader
        icon={<Library className="w-7 h-7" />}
        title="Konten: Modul"
        description="Tinjau, sunting, dan terbitkan pelajaran Modul Belajar. Tulis manual, impor dari berkas, atau buat draf dengan AI; semuanya masuk sebagai draft."
      />
      <ContentSubnav />

      {missing && <MigrationNotice file="0023_study_modules.sql" message={subjectsRes.error?.message} />}
      {subjectsRes.error && !missing && <p className="text-danger mb-4">Gagal memuat modul: {subjectsRes.error.message}</p>}
      {!missing && (
        <Notice tone="warning">
          Modul Belajar {flagOn ? "sedang DINYALAKAN untuk semua pengguna" : "masih tersembunyi dari pengguna biasa (hanya admin yang melihat)"}.
          {" "}Ubah di <Link href="/admin/features" className="font-bold underline">Admin → Fitur</Link> (flag <code>modul_belajar</code>). Nyalakan setelah
          tahap Fondasi lengkap dan ditinjau. Impor dari berkas: <code>node scripts/import-modules.mjs</code>. Soal dikelola di tab Latihan.
        </Notice>
      )}

      <ModuleManager subjects={subjects} lessons={lessons} schemaReady={!missing} />
    </div>
  );
}
