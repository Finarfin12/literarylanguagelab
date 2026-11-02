import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getCourseAccess } from "@/lib/course-access";
import { loadUnit } from "@/lib/course-server";
import { advance } from "@/lib/course";

// Menyimpan kemajuan Kursus Dasar: satu langkah selesai. Kemajuan tidak pernah mundur dan unit tidak dikunci.
// Body: { unit_slug: string, step: number }  (step = indeks langkah yang baru selesai, 0-based)
const SLUG = /^[a-z0-9-]{2,64}$/;

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { supabase, user } = auth;

  const body = await req.json().catch(() => null);
  const step = Number(body?.step);
  if (!body || typeof body.unit_slug !== "string" || !SLUG.test(body.unit_slug) || !Number.isInteger(step) || step < 0 || step > 50) {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const access = await getCourseAccess(supabase, user.id);
  if (!access.visible) return NextResponse.json({ error: "Kursus Dasar belum dibuka." }, { status: 403 });

  const { available, unit } = await loadUnit(supabase, body.unit_slug);
  if (!available) return NextResponse.json({ error: "Kursus Dasar belum tersedia." }, { status: 503 });
  if (!unit) return NextResponse.json({ error: "Unit tidak ditemukan." }, { status: 404 });
  if (step >= unit.steps.length) return NextResponse.json({ error: "Langkah tidak ada di unit ini." }, { status: 400 });

  const { data: existing } = await supabase
    .from("unit_progress")
    .select("step_index, completed_at")
    .eq("user_id", user.id)
    .eq("unit_slug", unit.slug)
    .maybeSingle();

  const next = advance(step, existing?.step_index ?? 0, unit.steps.length);
  const completedAt = existing?.completed_at ?? (next.completed ? new Date().toISOString() : null);

  const { error } = await supabase.from("unit_progress").upsert(
    { user_id: user.id, unit_slug: unit.slug, step_index: next.stepIndex, completed_at: completedAt, updated_at: new Date().toISOString() },
    { onConflict: "user_id,unit_slug" }
  );
  if (error) return NextResponse.json({ error: "Gagal menyimpan kemajuan." }, { status: 500 });
  return NextResponse.json({ step_index: next.stepIndex, completed: !!completedAt });
}
