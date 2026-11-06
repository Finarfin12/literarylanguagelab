"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getStudyAccess } from "@/lib/study-access";
import { SLUG } from "@/lib/study";

export type LessonActionResult = { ok: true } | { ok: false; error: string };

const MAX_TASK_CHARS = 6000;

type Authorized =
  | { ok: false; error: string }
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>>; user: { id: string }; lesson: { slug: string; subject_slug: string } };

async function authorize(lessonSlug: string): Promise<Authorized> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Silakan masuk terlebih dahulu." };
  if (typeof lessonSlug !== "string" || !SLUG.test(lessonSlug)) return { ok: false, error: "Pelajaran tidak valid." };
  const access = await getStudyAccess(supabase, user.id);
  if (!access.visible) return { ok: false, error: "Modul Belajar belum dibuka." };
  // RLS: pengguna biasa hanya melihat pelajaran terbit, jadi pelajaran draf tidak ditemukan di sini
  const { data, error } = await supabase.from("study_lessons").select("slug, subject_slug").eq("slug", lessonSlug).maybeSingle();
  if (error || !data) return { ok: false, error: "Pelajaran tidak ditemukan." };
  return { ok: true, supabase, user, lesson: data as { slug: string; subject_slug: string } };
}

/** Menandai pelajaran selesai, atau membatalkan tanda selesai. Hanya dipanggil dari tombol yang jelas. */
export async function setLessonCompleted(lessonSlug: string, completed: boolean): Promise<LessonActionResult> {
  const a = await authorize(lessonSlug);
  if (!a.ok) return { ok: false, error: a.error };
  const { supabase, user, lesson } = a;

  if (completed) {
    const { error } = await supabase
      .from("lesson_progress")
      .upsert({ user_id: user.id, lesson_slug: lesson.slug, completed_at: new Date().toISOString() }, { onConflict: "user_id,lesson_slug", ignoreDuplicates: true });
    if (error) return { ok: false, error: "Gagal menyimpan progres. Coba lagi." };
  } else {
    const { error } = await supabase.from("lesson_progress").delete().eq("user_id", user.id).eq("lesson_slug", lesson.slug);
    if (error) return { ok: false, error: "Gagal membatalkan tanda selesai. Coba lagi." };
  }
  revalidatePath("/modul");
  revalidatePath(`/modul/${lesson.subject_slug}`);
  return { ok: true };
}

/** Menyimpan jawaban tugas pribadi. Tidak dinilai AI dan tidak dibagikan. */
export async function saveLessonTask(lessonSlug: string, content: string): Promise<LessonActionResult> {
  const a = await authorize(lessonSlug);
  if (!a.ok) return { ok: false, error: a.error };
  const { supabase, user, lesson } = a;
  if (typeof content !== "string") return { ok: false, error: "Jawaban tidak valid." };
  if (content.length > MAX_TASK_CHARS) return { ok: false, error: `Jawaban terlalu panjang (maksimum ${MAX_TASK_CHARS.toLocaleString("id-ID")} karakter).` };

  const { error } = await supabase
    .from("lesson_tasks")
    .upsert({ user_id: user.id, lesson_slug: lesson.slug, content, updated_at: new Date().toISOString() }, { onConflict: "user_id,lesson_slug" });
  if (error) return { ok: false, error: "Gagal menyimpan jawaban. Coba lagi." };
  return { ok: true };
}
