import { cache } from "react";
import { createClient } from "./server";

/**
 * Klien Supabase + pengguna untuk satu request server. Dibungkus cache() supaya layout dan halaman
 * yang sama-sama membutuhkan pengguna hanya memanggil auth.getUser() (sebuah round trip jaringan) sekali.
 */
export const getRequestUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
});
