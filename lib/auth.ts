import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import type { User } from "@supabase/supabase-js";

export type AuthContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: User;
  profile?: {
    id: string;
    role?: string;
    [key: string]: unknown;
  } | null;
};

/**
 * Memastikan pengguna sudah login dan akun tidak berstatus 'banned'.
 * Mengembalikan NextResponse (401/403) jika tidak valid, atau { supabase, user, profile } jika valid.
 */
export async function requireUser(): Promise<AuthContext | NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { error: "Unauthorized: Silakan masuk terlebih dahulu." },
      { status: 401 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "banned") {
    return NextResponse.json(
      { error: "Forbidden: Akun Anda telah dinonaktifkan." },
      { status: 403 }
    );
  }

  return { supabase, user, profile };
}

/**
 * Memastikan pengguna memiliki peran 'admin'.
 * Mengembalikan NextResponse (401/403) jika bukan admin, atau AuthContext jika admin.
 */
export async function requireAdmin(): Promise<AuthContext | NextResponse> {
  const authResult = await requireUser();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { profile } = authResult;
  if (profile?.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden: Akses khusus administrator." },
      { status: 403 }
    );
  }

  return authResult;
}

