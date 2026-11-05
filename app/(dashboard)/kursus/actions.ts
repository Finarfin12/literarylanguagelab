"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getCourseAccess } from "@/lib/course-access";
import { parseSteps, unitVocabEntries } from "@/lib/course";

export type SaveUnitWordsResult = { ok: true; added: number; skipped: number } | { ok: false; error: string };

const SLUG = /^[a-z0-9-]{2,64}$/;

/**
 * Simpan kata-kata sebuah unit Kursus Dasar ke Vocabulary Bank (Review), memakai tabel vocabulary + SRS yang sudah ada.
 * Kata yang sudah dimiliki dilewati dan tidak ditimpa. Daftar kata diambil dari database (bukan dari klien).
 * Tanpa panggilan AI.
 */
export async function saveUnitWordsToReview(unitSlug: string): Promise<SaveUnitWordsResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Silakan masuk terlebih dahulu." };
  if (typeof unitSlug !== "string" || !SLUG.test(unitSlug)) return { ok: false, error: "Unit tidak valid." };

  const access = await getCourseAccess(supabase, user.id);
  if (!access.visible) return { ok: false, error: "Kursus Dasar belum dibuka." };

  const { data: unit, error: unitError } = await supabase.from("course_units").select("title, steps").eq("slug", unitSlug).maybeSingle();
  if (unitError || !unit) return { ok: false, error: "Unit tidak ditemukan." };

  const entries = unitVocabEntries(parseSteps(unit.steps));
  if (entries.length === 0) return { ok: true, added: 0, skipped: 0 };

  const { data: owned, error: ownedError } = await supabase
    .from("vocabulary")
    .select("word")
    .eq("user_id", user.id)
    .in("word", entries.map((e) => e.word));
  if (ownedError) return { ok: false, error: "Gagal memeriksa Vocabulary Bank. Coba lagi." };

  const ownedSet = new Set((owned ?? []).map((o) => String(o.word).toLowerCase()));
  const fresh = entries.filter((e) => !ownedSet.has(e.word));
  if (fresh.length === 0) return { ok: true, added: 0, skipped: entries.length };

  const now = new Date().toISOString();
  const { error } = await supabase.from("vocabulary").upsert(
    fresh.map((e) => ({
      user_id: user.id,
      word: e.word,
      definition: e.meaning_id ?? e.definition_en ?? "",
      context_sentence: null,
      context_source: `Kursus Dasar: ${unit.title}`,
      mastery_level: 0,
      next_review_at: now,
      interval: 0,
      repetition_count: 0,
      efactor: 2.5,
      is_collocation: false,
    })),
    { onConflict: "user_id,word", ignoreDuplicates: true }
  );
  if (error) return { ok: false, error: "Gagal menyimpan ke Vocabulary Bank. Coba lagi." };

  revalidatePath("/vocabulary");
  revalidatePath("/review");
  return { ok: true, added: fresh.length, skipped: entries.length - fresh.length };
}
