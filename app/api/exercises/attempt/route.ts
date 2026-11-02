import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { submitAttempt } from "@/lib/exercises/server";

// Menilai satu jawaban di server (klien tidak dipercaya) dan mencatatnya. Tidak memanggil AI.
// Body: { exercise_id: string, response: object }
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { supabase, user } = auth;

  const body = await req.json().catch(() => null);
  if (!body || typeof body.exercise_id !== "string" || !UUID.test(body.exercise_id)) {
    return NextResponse.json({ error: "exercise_id tidak valid." }, { status: 400 });
  }
  if (JSON.stringify(body.response ?? null).length > 4000) return NextResponse.json({ error: "Jawaban terlalu panjang." }, { status: 413 });

  const { available, result } = await submitAttempt(supabase, user.id, body.exercise_id, body.response);
  if (!result) return NextResponse.json({ error: available ? "Soal tidak ditemukan." : "Latihan belum tersedia." }, { status: available ? 404 : 503 });
  return NextResponse.json(result);
}
