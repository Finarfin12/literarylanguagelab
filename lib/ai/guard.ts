// Pelindung route AI (Fase 19.2): login → batas pemakaian → validasi ukuran badan permintaan.
// Satu pintu untuk route yang memanggil runAI; logika validasinya ada di guard-rules.ts (diuji unit).

import { NextResponse } from "next/server";
import { requireUser, type AuthContext } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateBody, type BodyLimits } from "./guard-rules";

export type GuardOptions = BodyLimits & {
  /** Feature key AI (juga dipakai untuk flag fitur dan kategori batas pemakaian). */
  limitKey: string;
};

export type GuardOk = AuthContext & { body: Record<string, unknown> };

/**
 * Mengembalikan { user, supabase, profile, body } bila lolos, atau NextResponse galat
 * (401/403 login, 503 fitur mati, 429 batas pemakaian, 400/413 badan permintaan).
 * Badan diperiksa SETELAH batas pemakaian supaya permintaan sampah pun ikut dihitung.
 */
export async function guardAIRoute(req: Request, options: GuardOptions): Promise<GuardOk | NextResponse> {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;

  const limited = await checkRateLimit(auth.user.id, options.limitKey);
  if (limited) return limited;

  const raw = await req.json().catch(() => null);
  const checked = validateBody(raw, options);
  if (!checked.ok) {
    return NextResponse.json({ error: checked.error }, { status: checked.status });
  }

  return { ...auth, body: checked.body };
}
