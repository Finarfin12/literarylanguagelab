// Membaca level CEFR pengguna di server (dari profiles, bukan dari klien).
import type { SupabaseClient } from "@supabase/supabase-js";
import { isCefrLevel, type CefrLevel } from "./cefr";

/** Level CEFR pengguna, atau null jika belum ditentukan / query gagal. Tidak pernah melempar error. */
export async function getUserCefr(supabase: SupabaseClient, userId: string): Promise<CefrLevel | null> {
  try {
    const { data } = await supabase.from("profiles").select("cefr_level").eq("id", userId).maybeSingle();
    return isCefrLevel(data?.cefr_level) ? data.cefr_level : null;
  } catch {
    return null;
  }
}
