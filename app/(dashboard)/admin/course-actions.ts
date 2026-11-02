"use server";

// Server actions tab Konten → Kursus (Fase 16): kelola unit dan langkahnya. Setiap action memanggil assertAdmin()
// dan mencatat logAdminAction(). Tidak memanggil AI.

import { revalidatePath } from "next/cache";
import { assertAdmin, toErrorMessage, type ActionResult } from "./_lib/guard";
import { logAdminAction } from "@/lib/admin-audit";
import { COURSE_LEVELS, readySteps, validateSteps } from "@/lib/course";
import { MISSING_SCHEMA_CODES } from "./_lib/content-types";

const MIGRATION_HINT = "Migrasi 0013_course_units.sql belum dijalankan.";

function dbError(error: { code?: string; message: string }): string {
  return error.code && MISSING_SCHEMA_CODES.includes(error.code) ? MIGRATION_HINT : error.message;
}

function revalidateCourse() {
  revalidatePath("/admin/content/course");
  revalidatePath("/kursus");
}

/** Membuat atau memperbarui unit. Unit baru berstatus draft; status unit yang ada tidak berubah lewat aksi ini. */
export async function saveCourseUnit(input: {
  slug: string;
  isNew: boolean;
  title: string;
  cefr_level: string;
  sort_order: number;
  theme_id: string;
  intro_id: string;
  steps: unknown;
}): Promise<ActionResult> {
  try {
    const { supabase, user } = await assertAdmin();
    const slug = input.slug.trim().toLowerCase();
    if (!/^[a-z0-9-]{2,64}$/.test(slug)) return { ok: false, error: "Slug hanya huruf kecil, angka, dan tanda hubung (2-64 karakter)." };
    const title = input.title.trim();
    if (!title || title.length > 120) return { ok: false, error: "Judul wajib diisi (maks. 120 karakter)." };
    if (!(COURSE_LEVELS as readonly string[]).includes(input.cefr_level)) return { ok: false, error: "Level tidak valid." };
    if (!Number.isInteger(input.sort_order) || input.sort_order < 0 || input.sort_order > 1000) return { ok: false, error: "Urutan harus bilangan bulat 0-1000." };
    const intro = input.intro_id.trim().slice(0, 600);
    const theme = input.theme_id.trim().slice(0, 40) || null;
    const steps = validateSteps(input.steps);
    if (!steps.ok) return { ok: false, error: steps.error };

    const row = { title, cefr_level: input.cefr_level, sort_order: input.sort_order, theme_id: theme, intro_id: intro, steps: steps.value, updated_at: new Date().toISOString() };

    if (input.isNew) {
      const { error } = await supabase.from("course_units").insert({ slug, ...row, status: "draft" });
      if (error) return { ok: false, error: error.code === "23505" ? "Slug sudah dipakai unit lain." : dbError(error) };
    } else {
      const { error } = await supabase.from("course_units").update(row).eq("slug", slug);
      if (error) return { ok: false, error: dbError(error) };
    }

    await logAdminAction({
      actorId: user.id,
      action: input.isNew ? "course_unit.create" : "course_unit.save",
      target: slug,
      after: { title, cefr_level: input.cefr_level, steps: steps.value.length, ready: readySteps(steps.value) },
    });
    revalidateCourse();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function setCourseUnitPublished(slug: string, published: boolean): Promise<ActionResult> {
  try {
    const { supabase, user } = await assertAdmin();
    if (published) {
      const { data, error } = await supabase.from("course_units").select("steps").eq("slug", slug).maybeSingle();
      if (error) return { ok: false, error: dbError(error) };
      const steps = validateSteps(data?.steps ?? []);
      if (!steps.ok || readySteps(steps.value) === 0) return { ok: false, error: "Isi minimal satu langkah dengan konten sebelum menerbitkan unit." };
    }
    const { error } = await supabase.from("course_units").update({ status: published ? "published" : "draft", updated_at: new Date().toISOString() }).eq("slug", slug);
    if (error) return { ok: false, error: dbError(error) };
    await logAdminAction({ actorId: user.id, action: published ? "course_unit.publish" : "course_unit.unpublish", target: slug });
    revalidateCourse();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function deleteCourseUnit(slug: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await assertAdmin();
    // Soal yang memakai unit ini tidak ikut terhapus; unit_slug-nya hanya menjadi yatim
    const { error } = await supabase.from("course_units").delete().eq("slug", slug);
    if (error) return { ok: false, error: dbError(error) };
    await logAdminAction({ actorId: user.id, action: "course_unit.delete", target: slug });
    revalidateCourse();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
