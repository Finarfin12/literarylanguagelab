"use server";

// Server actions tab Konten → Modul (Fase 24.5): tulis, sunting, tinjau, dan terbitkan pelajaran. Setiap action memanggil
// assertAdmin() dan mencatat logAdminAction(). Hanya generateLessonDraft yang memanggil AI (lewat runAI, tunduk pada kuota).

import { revalidatePath } from "next/cache";
import { assertAdmin, toErrorMessage, type ActionResult } from "./_lib/guard";
import { logAdminAction } from "@/lib/admin-audit";
import { runAI } from "@/lib/ai/run";
import { extractJsonObject } from "@/lib/ai/json";
import { LESSON_LIMITS, SLUG, cleanLessonInput, cleanList, cleanSources } from "@/lib/study";
import { validateExerciseDraft } from "@/lib/exercises/grade";
import { MISSING_SCHEMA_CODES } from "./_lib/content-types";

const MIGRATION_HINT = "Migrasi 0023_study_modules.sql belum dijalankan.";

function dbError(error: { code?: string; message: string }): string {
  return error.code && MISSING_SCHEMA_CODES.includes(error.code) ? MIGRATION_HINT : error.message;
}

function revalidateStudy(subjectSlug?: string) {
  revalidatePath("/admin/content/modules");
  revalidatePath("/modul");
  if (subjectSlug) revalidatePath(`/modul/${subjectSlug}`);
}

/**
 * Membuat pelajaran manual (draft) atau menyunting yang ada. Menyunting mengisi edited_at dan membatalkan status tinjau,
 * supaya impor berikutnya tidak menimpa dan pelajaran perlu ditinjau ulang sebelum diterbitkan lagi.
 */
export async function saveLesson(input: {
  isNew: boolean;
  slug: string;
  subject_slug: string;
  sort_order: number;
  title: string;
  objectives: string;
  body_md: string;
  summary_md: string;
  task: string;
  tool_paths: string;
  sources: unknown;
}): Promise<ActionResult> {
  try {
    const { supabase, user } = await assertAdmin();
    const cleaned = cleanLessonInput({ ...input, objectives: input.objectives, tool_paths: input.tool_paths });
    if (!cleaned.ok) return { ok: false, error: cleaned.error };
    const l = cleaned.value;
    const now = new Date().toISOString();
    const row = {
      subject_slug: l.subject_slug,
      sort_order: l.sort_order,
      title: l.title,
      objectives: l.objectives,
      body_md: l.body_md,
      summary_md: l.summary_md,
      task: l.task,
      tool_paths: l.tool_paths,
      sources: l.sources,
      updated_at: now,
    };

    if (input.isNew) {
      const { error } = await supabase.from("study_lessons").insert({ slug: l.slug, ...row, status: "draft", origin: "manual", edited_at: now });
      if (error) return { ok: false, error: error.code === "23505" ? "Slug sudah dipakai pelajaran lain." : dbError(error) };
    } else {
      // Disunting: tinjauan lama tidak berlaku lagi
      const { error } = await supabase.from("study_lessons").update({ ...row, edited_at: now, reviewed_at: null, reviewed_by: null }).eq("slug", l.slug);
      if (error) return { ok: false, error: dbError(error) };
    }
    await logAdminAction({ actorId: user.id, action: input.isNew ? "study_lesson.create" : "study_lesson.save", target: l.slug, after: { subject: l.subject_slug, title: l.title } });
    revalidateStudy(l.subject_slug);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

/** Menandai pelajaran sudah ditinjau (impor tidak akan menimpanya). Tidak menerbitkan. */
export async function markLessonReviewed(slug: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await assertAdmin();
    if (!SLUG.test(slug)) return { ok: false, error: "Slug tidak valid." };
    const { error } = await supabase.from("study_lessons").update({ reviewed_at: new Date().toISOString(), reviewed_by: user.id }).eq("slug", slug);
    if (error) return { ok: false, error: dbError(error) };
    await logAdminAction({ actorId: user.id, action: "study_lesson.review", target: slug });
    revalidateStudy();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

/** Menerbitkan (sekaligus menandai ditinjau) atau menarik pelajaran. Hasil checkLesson hanya informasi, tidak memblokir. */
export async function setLessonPublished(slug: string, published: boolean): Promise<ActionResult> {
  try {
    const { supabase, user } = await assertAdmin();
    if (!SLUG.test(slug)) return { ok: false, error: "Slug tidak valid." };
    const patch = published
      ? { status: "published", reviewed_at: new Date().toISOString(), reviewed_by: user.id, updated_at: new Date().toISOString() }
      : { status: "draft", updated_at: new Date().toISOString() };
    const { data, error } = await supabase.from("study_lessons").update(patch).eq("slug", slug).select("subject_slug").maybeSingle();
    if (error) return { ok: false, error: dbError(error) };
    await logAdminAction({ actorId: user.id, action: published ? "study_lesson.publish" : "study_lesson.unpublish", target: slug });
    revalidateStudy(data?.subject_slug);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function setSubjectPublished(slug: string, published: boolean): Promise<ActionResult> {
  try {
    const { supabase, user } = await assertAdmin();
    if (!SLUG.test(slug)) return { ok: false, error: "Slug tidak valid." };
    const { error } = await supabase.from("study_subjects").update({ status: published ? "published" : "draft", updated_at: new Date().toISOString() }).eq("slug", slug);
    if (error) return { ok: false, error: dbError(error) };
    await logAdminAction({ actorId: user.id, action: published ? "study_subject.publish" : "study_subject.unpublish", target: slug });
    revalidateStudy(slug);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

/**
 * Menerbitkan semua draf sekaligus (satu mata pelajaran, atau semuanya bila subject_slug kosong): mata pelajaran, pelajaran
 * (ditandai ditinjau), serta soal pelajaran dan kuis akhir yang valid. Soal ikut diterbitkan karena pengguna hanya melihat soal
 * berstatus terbit. Pelajaran yang sudah terbit tidak berubah. Hasil checkLesson hanya informasi, tidak memblokir.
 */
export async function publishStudyDrafts(input: { subject_slug?: string }): Promise<ActionResult<{ subjects: number; lessons: number; exercises: number; skipped: number }>> {
  try {
    const { supabase, user } = await assertAdmin();
    const only = input.subject_slug?.trim() || "";
    if (only && !SLUG.test(only)) return { ok: false, error: "Slug tidak valid." };
    const now = new Date().toISOString();

    let subjectQuery = supabase.from("study_subjects").update({ status: "published", updated_at: now }).eq("status", "draft");
    if (only) subjectQuery = subjectQuery.eq("slug", only);
    const subjectsRes = await subjectQuery.select("slug");
    if (subjectsRes.error) return { ok: false, error: dbError(subjectsRes.error) };

    // Pelajaran yang belum ditinjau ditandai ditinjau; yang sudah ditinjau mempertahankan tanda lamanya
    let lessonQuery = supabase.from("study_lessons").update({ status: "published", updated_at: now }).eq("status", "draft");
    if (only) lessonQuery = lessonQuery.eq("subject_slug", only);
    const lessonsRes = await lessonQuery.select("slug");
    if (lessonsRes.error) return { ok: false, error: dbError(lessonsRes.error) };
    const lessonSlugs = (lessonsRes.data || []).map((r) => r.slug as string);
    if (lessonSlugs.length > 0) {
      const { error } = await supabase.from("study_lessons").update({ reviewed_at: now, reviewed_by: user.id }).in("slug", lessonSlugs).is("reviewed_at", null);
      if (error) return { ok: false, error: dbError(error) };
    }

    // Soal draf pelajaran dan kuis akhir (tag mod:*), hanya yang lolos validasi
    let exerciseQuery = supabase.from("exercises").select("*").eq("status", "draft").or("lesson_slug.not.is.null,subject_slug.not.is.null").limit(5000);
    if (only) exerciseQuery = exerciseQuery.eq("subject_slug", only);
    const exercisesRes = await exerciseQuery;
    if (exercisesRes.error) return { ok: false, error: dbError(exercisesRes.error) };
    const rows = exercisesRes.data || [];
    const valid = rows.filter((row) => validateExerciseDraft(row).ok).map((row) => row.id as string);
    for (let i = 0; i < valid.length; i += 200) {
      const { error } = await supabase.from("exercises").update({ status: "published" }).in("id", valid.slice(i, i + 200));
      if (error) return { ok: false, error: dbError(error) };
    }

    const result = { subjects: subjectsRes.data?.length ?? 0, lessons: lessonSlugs.length, exercises: valid.length, skipped: rows.length - valid.length };
    await logAdminAction({ actorId: user.id, action: "study.publish_all", target: only || "semua", after: result });
    revalidateStudy(only || undefined);
    revalidatePath("/admin/content/exercises");
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function deleteLesson(slug: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await assertAdmin();
    if (!SLUG.test(slug)) return { ok: false, error: "Slug tidak valid." };
    // Soal yang terkait pelajaran tidak ikut terhapus; lesson_slug-nya hanya menjadi yatim
    const { error } = await supabase.from("study_lessons").delete().eq("slug", slug);
    if (error) return { ok: false, error: dbError(error) };
    await logAdminAction({ actorId: user.id, action: "study_lesson.delete", target: slug });
    revalidateStudy();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

const DRAFT_SYSTEM = `You write a draft study lesson in Indonesian (Bahasa Indonesia) for a self-study companion for students of English literature and translation.
Rules:
- Original writing only. Do not copy definitions, paragraph order, examples or exercises from any book or module.
- Structure: a short explanation built step by step, then 2 worked examples with English example text and an explanation in Indonesian, then a short list of key takeaways.
- Explain every English term the first time it appears. Keep English examples in English, each followed by an Indonesian explanation.
- Body between 600 and 1200 words, Markdown with ## and ### headings, English example passages in blockquotes (>).
- Do NOT invent references, quotations, statistics, or research findings. If you are unsure of a claim, add [perlu cek] right after it.
- Return ONLY a JSON object: {"title": string, "objectives": string[] (2-4 items, each a checkable skill), "body_md": string, "summary_md": string (4-7 bullet points in Markdown), "task": string (one small self-practice task)}.`;

/**
 * "Buat draf dengan AI" (Fase 24.5): membuat SATU pelajaran draf (origin 'ai') untuk sebuah mata pelajaran dari topik yang
 * ditulis admin. Tanpa sumber (admin menambahkannya setelah memeriksa), tanpa soal, dan selalu perlu ditinjau manusia.
 * Lewat runAI -> tercatat di ai_usage_logs dan tunduk pada kuota/flag.
 */
export async function generateLessonDraft(input: { subject_slug: string; topic: string; sort_order: number }): Promise<ActionResult<{ slug: string }>> {
  try {
    const { supabase, user } = await assertAdmin();
    if (!SLUG.test(input.subject_slug)) return { ok: false, error: "Pilih mata pelajaran." };
    const topic = (input.topic ?? "").trim();
    if (topic.length < 5 || topic.length > 200) return { ok: false, error: "Tulis topik pelajaran (5-200 karakter)." };
    if (!Number.isInteger(input.sort_order) || input.sort_order < 0 || input.sort_order > 1000) return { ok: false, error: "Urutan harus bilangan bulat 0-1000." };

    const { data: subject, error: subjectError } = await supabase.from("study_subjects").select("slug, title, description_id").eq("slug", input.subject_slug).maybeSingle();
    if (subjectError) return { ok: false, error: dbError(subjectError) };
    if (!subject) return { ok: false, error: "Mata pelajaran tidak ditemukan." };

    const result = await runAI(
      "lesson-draft",
      {
        messages: [
          { role: "system", content: DRAFT_SYSTEM },
          { role: "user", content: `Subject: ${subject.title}\nSubject description: ${subject.description_id}\nLesson topic: ${topic}` },
        ],
        temperature: 0.5,
        max_tokens: 3500,
      },
      { userId: user.id, timeoutMs: 90000 }
    );
    const json = extractJsonObject(result.content) as Record<string, unknown> | null;
    if (!json) return { ok: false, error: "AI tidak mengembalikan JSON yang bisa dibaca. Coba lagi." };

    const base = topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "pelajaran";
    const slug = `${input.subject_slug}-ai-${base}-${Date.now().toString(36).slice(-4)}`.slice(0, 80);
    const cleaned = cleanLessonInput({
      slug,
      subject_slug: input.subject_slug,
      sort_order: input.sort_order,
      title: typeof json.title === "string" ? json.title.slice(0, LESSON_LIMITS.maxTitleChars) : topic,
      objectives: cleanList(json.objectives, LESSON_LIMITS.maxObjectives),
      body_md: json.body_md,
      summary_md: json.summary_md,
      task: json.task,
      tool_paths: [],
      sources: cleanSources([]),
    });
    if (!cleaned.ok) return { ok: false, error: cleaned.error };
    if (!cleaned.value.body_md) return { ok: false, error: "AI tidak menulis isi pelajaran. Coba lagi." };

    const l = cleaned.value;
    const { error } = await supabase.from("study_lessons").insert({
      slug: l.slug,
      subject_slug: l.subject_slug,
      sort_order: l.sort_order,
      title: l.title,
      objectives: l.objectives,
      body_md: l.body_md,
      summary_md: l.summary_md,
      task: l.task,
      tool_paths: [],
      sources: [],
      status: "draft",
      origin: "ai",
    });
    if (error) return { ok: false, error: dbError(error) };
    await logAdminAction({ actorId: user.id, action: "study_lesson.generate_draft", target: l.slug, after: { subject: l.subject_slug, topic } });
    revalidateStudy(l.subject_slug);
    return { ok: true, data: { slug: l.slug } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
