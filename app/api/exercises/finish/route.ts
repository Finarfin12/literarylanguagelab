import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { finishExerciseSession } from "@/lib/exercises/server";

// Menutup sesi latihan: bukti kemampuan + pembaruan jadwal review topik (bila jatuh tempo). Tidak memanggil AI.
// Body: { exercise_ids: string[], topic_slug?: string }
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9-]{2,64}$/;

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { supabase, user } = auth;

  const body = await req.json().catch(() => null);
  const ids: string[] = Array.isArray(body?.exercise_ids)
    ? body.exercise_ids.filter((x: unknown): x is string => typeof x === "string" && UUID.test(x)).slice(0, 30)
    : [];
  if (ids.length === 0) return NextResponse.json({ error: "exercise_ids kosong." }, { status: 400 });
  const topic = typeof body?.topic_slug === "string" && SLUG.test(body.topic_slug) ? body.topic_slug : null;

  const summary = await finishExerciseSession(supabase, user.id, ids, topic);
  if (!summary) return NextResponse.json({ error: "Belum ada jawaban tercatat untuk sesi ini." }, { status: 404 });
  return NextResponse.json(summary);
}
