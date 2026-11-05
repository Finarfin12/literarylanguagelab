"use server";

// Server actions tab Konten → Frasa (Fase 22.4): tinjau, ubah, dan terbitkan frasa harian. Setiap action memanggil
// assertAdmin() dan mencatat logAdminAction(). Tidak memanggil AI.

import { revalidatePath } from "next/cache";
import { assertAdmin, toErrorMessage, type ActionResult } from "./_lib/guard";
import { logAdminAction } from "@/lib/admin-audit";
import { cleanPhrase } from "@/lib/phrases";
import { MISSING_SCHEMA_CODES } from "./_lib/content-types";

const MIGRATION_HINT = "Migrasi 0021_daily_phrases.sql belum dijalankan.";

function dbError(error: { code?: string; message: string }): string {
  return error.code && MISSING_SCHEMA_CODES.includes(error.code) ? MIGRATION_HINT : error.message;
}

function revalidatePhrases() {
  revalidatePath("/admin/content/phrases");
  revalidatePath("/frasa-harian");
}

/** Membuat frasa baru (draft) atau memperbarui isinya; status tidak berubah lewat aksi ini. */
export async function savePhrase(input: {
  isNew: boolean;
  slug: string;
  situation: string;
  text_en: string;
  text_id: string;
  literal_id: string;
  sort_order: number;
}): Promise<ActionResult> {
  try {
    const { supabase, user } = await assertAdmin();
    const cleaned = cleanPhrase(input);
    if (!cleaned.ok) return { ok: false, error: cleaned.error };
    const p = cleaned.value;
    const row = { situation: p.situation, text_en: p.text_en, text_id: p.text_id, literal_id: p.literal_id, sort_order: p.sort_order };

    if (input.isNew) {
      const { error } = await supabase.from("daily_phrases").insert({ slug: p.slug, ...row, status: "draft" });
      if (error) return { ok: false, error: error.code === "23505" ? "Slug sudah dipakai frasa lain." : dbError(error) };
    } else {
      const { error } = await supabase.from("daily_phrases").update(row).eq("slug", p.slug);
      if (error) return { ok: false, error: dbError(error) };
    }
    await logAdminAction({ actorId: user.id, action: input.isNew ? "phrase.create" : "phrase.save", target: p.slug, after: { situation: p.situation } });
    revalidatePhrases();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function setPhrasePublished(slug: string, published: boolean): Promise<ActionResult> {
  try {
    const { supabase, user } = await assertAdmin();
    if (!/^[a-z0-9-]{2,80}$/.test(slug)) return { ok: false, error: "Slug tidak valid." };
    const { error } = await supabase.from("daily_phrases").update({ status: published ? "published" : "draft" }).eq("slug", slug);
    if (error) return { ok: false, error: dbError(error) };
    await logAdminAction({ actorId: user.id, action: published ? "phrase.publish" : "phrase.unpublish", target: slug });
    revalidatePhrases();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function deletePhrase(slug: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await assertAdmin();
    if (!/^[a-z0-9-]{2,80}$/.test(slug)) return { ok: false, error: "Slug tidak valid." };
    const { error } = await supabase.from("daily_phrases").delete().eq("slug", slug);
    if (error) return { ok: false, error: dbError(error) };
    await logAdminAction({ actorId: user.id, action: "phrase.delete", target: slug });
    revalidatePhrases();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
