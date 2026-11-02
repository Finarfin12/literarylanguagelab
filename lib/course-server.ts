// Akses database Kursus Dasar (Fase 16). Hanya untuk server. Semua fungsi menangani migrasi 0013 yang belum dijalankan
// (`available: false`, bukan error).
import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingSchema } from "@/lib/skill-evidence";
import { parseSteps, readySteps, type CourseStep, type UnitProgressLike } from "@/lib/course";

export interface CourseUnitRow {
  slug: string;
  title: string;
  cefr_level: string;
  sort_order: number;
  theme_id: string | null;
  intro_id: string;
  steps: unknown;
  status: "draft" | "published";
}

export interface CourseUnit extends Omit<CourseUnitRow, "steps"> {
  steps: CourseStep[];
  ready_steps: number;
}

const UNIT_COLUMNS = "slug, title, cefr_level, sort_order, theme_id, intro_id, steps, status";

export function toUnit(row: CourseUnitRow): CourseUnit {
  const steps = parseSteps(row.steps);
  return { ...row, steps, ready_steps: readySteps(steps) };
}

/** Semua unit yang boleh dilihat pengguna ini (RLS: pengguna biasa hanya unit terbit, admin semuanya). */
export async function loadUnits(supabase: SupabaseClient): Promise<{ available: boolean; units: CourseUnit[] }> {
  const { data, error } = await supabase.from("course_units").select(UNIT_COLUMNS).order("sort_order", { ascending: true });
  if (error) {
    if (!isMissingSchema(error)) console.error("loadUnits gagal:", error.message);
    return { available: false, units: [] };
  }
  return { available: true, units: ((data || []) as CourseUnitRow[]).map(toUnit) };
}

export async function loadUnit(supabase: SupabaseClient, slug: string): Promise<{ available: boolean; unit: CourseUnit | null }> {
  const { data, error } = await supabase.from("course_units").select(UNIT_COLUMNS).eq("slug", slug).maybeSingle();
  if (error) return { available: !isMissingSchema(error), unit: null };
  return { available: true, unit: data ? toUnit(data as CourseUnitRow) : null };
}

export async function loadUnitProgress(supabase: SupabaseClient, userId: string): Promise<UnitProgressLike[]> {
  const { data, error } = await supabase.from("unit_progress").select("unit_slug, step_index, completed_at").eq("user_id", userId);
  return error ? [] : ((data || []) as UnitProgressLike[]);
}
