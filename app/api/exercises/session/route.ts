import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { isMissingSchema } from "@/lib/skill-evidence";
import { parseExerciseRow } from "@/lib/exercises/grade";
import { mulberry32, pickSession } from "@/lib/exercises/session";
import type { AttemptSummary, Exercise } from "@/lib/exercises/types";

// Memilih soal latihan terstruktur untuk satu sesi. Tidak memanggil AI.
// Body: { topic_slug?: string, unit_slug?: string, tag?: string, count?: number } (minimal salah satu dari ketiganya)
const SLUG = /^[a-z0-9-]{2,64}$/;
const TAG = /^[a-z0-9:-]{2,64}$/;
const POOL_LIMIT = 300;

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { supabase, user } = auth;

  const body = await req.json().catch(() => ({}));
  const topic = typeof body?.topic_slug === "string" && SLUG.test(body.topic_slug) ? body.topic_slug : null;
  const unit = typeof body?.unit_slug === "string" && SLUG.test(body.unit_slug) ? body.unit_slug : null;
  const tag = typeof body?.tag === "string" && TAG.test(body.tag) ? body.tag : null;
  if (!topic && !unit && !tag) return NextResponse.json({ error: "Tentukan topik, unit, atau tag." }, { status: 400 });
  const count = Math.max(1, Math.min(20, Math.floor(Number(body?.count) || 8)));

  let q = supabase.from("exercises").select("*").eq("status", "published").limit(POOL_LIMIT);
  if (topic) q = q.eq("topic_slug", topic);
  else if (unit) q = q.eq("unit_slug", unit);
  if (tag) q = q.contains("tags", [tag]); // Fase 17: mis. "l1-error", "l1:third-person-s", "minimal-pair"
  const { data, error } = await q;
  if (error) {
    if (isMissingSchema(error)) return NextResponse.json({ available: false, total: 0, exercises: [] });
    return NextResponse.json({ error: "Gagal memuat soal." }, { status: 500 });
  }

  const pool = (data || []).map(parseExerciseRow).filter((e): e is Exercise => e !== null);
  if (pool.length === 0) return NextResponse.json({ available: true, total: 0, exercises: [] });

  const { data: attemptRows } = await supabase
    .from("exercise_attempts")
    .select("exercise_id, correct, created_at")
    .eq("user_id", user.id)
    .in("exercise_id", pool.map((e) => e.id))
    .order("created_at", { ascending: false })
    .limit(2000);

  const seed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
  const picked = pickSession(pool, (attemptRows || []) as AttemptSummary[], count, mulberry32(seed));
  return NextResponse.json({ available: true, total: pool.length, exercises: picked });
}
