// Mengaitkan teks (draft) ke langkah baca sebuah unit Kursus Dasar (Fase 18). Dipakai "Buat bacaan dengan AI untuk unit
// ini" dan "Tulis teks sendiri". Bukan "use server": dipanggil dari dalam server action yang sudah memeriksa admin.
import type { SupabaseClient } from "@supabase/supabase-js";
import { attachReadStep, parseSteps } from "@/lib/course";
import { MISSING_SCHEMA_CODES } from "./content-types";

export async function attachTextToUnit(
  supabase: SupabaseClient,
  unitSlug: string,
  textId: string,
  title: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: unit, error } = await supabase.from("course_units").select("steps").eq("slug", unitSlug).maybeSingle();
  if (error) return { ok: false, error: error.code && MISSING_SCHEMA_CODES.includes(error.code) ? "Migrasi 0013_course_units.sql belum dijalankan." : error.message };
  if (!unit) return { ok: false, error: "Unit tidak ditemukan." };

  const steps = attachReadStep(parseSteps(unit.steps), textId, `Bacaan: ${title}`.slice(0, 120));
  const { error: updateError } = await supabase.from("course_units").update({ steps, updated_at: new Date().toISOString() }).eq("slug", unitSlug);
  return updateError ? { ok: false, error: updateError.message } : { ok: true };
}
