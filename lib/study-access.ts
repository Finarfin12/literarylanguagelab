// Akses Modul Belajar (Fase 24): flag `modul_belajar` + peran admin. Hanya untuk server.
// Seperti Kursus Dasar, fitur ini sengaja default MATI (FEATURE_DEFAULTS, fail-closed): pengguna biasa hanya melihatnya
// bila flag menyala eksplisit. Admin selalu bisa membuka (pratinjau) untuk meninjau pelajaran draf.
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getFeatureFlags } from "@/lib/ai/flags";

export const STUDY_FLAG = "modul_belajar";

export interface StudyAccess {
  /** Modul boleh dibuka oleh pengguna ini (flag menyala atau admin). */
  visible: boolean;
  isAdmin: boolean;
  /** Flag menyala untuk semua pengguna. false + isAdmin = "Pratinjau admin". */
  flagOn: boolean;
}

export const getStudyAccess = cache(async (supabase: SupabaseClient, userId: string | undefined): Promise<StudyAccess> => {
  const flagOn = (await getFeatureFlags())[STUDY_FLAG] === true;
  if (flagOn) return { visible: true, isAdmin: false, flagOn };
  if (!userId) return { visible: false, isAdmin: false, flagOn };
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  const isAdmin = data?.role === "admin";
  return { visible: isAdmin, isAdmin, flagOn };
});
