// Pengecekan admin untuk halaman dan server action di /admin.
// Server action bisa dipanggil langsung lewat POST, jadi setiap action wajib memanggil assertAdmin().

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

async function getAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, isAdmin: false };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return { supabase, user, isAdmin: profile?.role === "admin" };
}

/** Untuk Server Component: redirect jika bukan admin. */
export async function requireAdminPage() {
  const ctx = await getAdmin();
  if (!ctx.user) redirect("/login");
  if (!ctx.isAdmin) redirect("/dashboard");
  return { supabase: ctx.supabase, user: ctx.user };
}

/** Untuk Server Action: melempar Error jika bukan admin. */
export async function assertAdmin() {
  const ctx = await getAdmin();
  if (!ctx.user || !ctx.isAdmin) throw new Error("Akses khusus administrator.");
  return { supabase: ctx.supabase, user: ctx.user };
}

export function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Terjadi kesalahan.";
}
