// Akses Kursus Dasar (Fase 16): flag `kursus_dasar` + peran admin. Hanya untuk server.
// Pengguna biasa hanya melihat Kursus Dasar bila flag NYALA secara eksplisit (true). Berbeda dari flag lain
// (key yang belum terdaftar dianggap aktif), key ini sengaja default mati: sebelum migrasi 0013 dijalankan
// dan selama konten belum siap (Fase 18), kursus tersembunyi. Admin selalu bisa membuka (pratinjau).
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getFeatureFlags } from "@/lib/ai/flags";

export const COURSE_FLAG = "kursus_dasar";

export interface CourseAccess {
  /** Kursus boleh dibuka oleh pengguna ini (flag menyala atau admin). */
  visible: boolean;
  isAdmin: boolean;
  /** Flag menyala untuk semua pengguna. false + isAdmin = "Pratinjau admin". */
  flagOn: boolean;
}

export const getCourseAccess = cache(async (supabase: SupabaseClient, userId: string | undefined): Promise<CourseAccess> => {
  const flagOn = (await getFeatureFlags())[COURSE_FLAG] === true;
  if (flagOn) return { visible: true, isAdmin: false, flagOn };
  if (!userId) return { visible: false, isAdmin: false, flagOn };
  // Peran hanya dicek bila flag mati (satu query ringan)
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  const isAdmin = data?.role === "admin";
  return { visible: isAdmin, isAdmin, flagOn };
});
