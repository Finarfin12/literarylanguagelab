import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { applyGrammarReview, loadGrammarProgress, setGrammarDone } from "@/lib/exercises/server";

// Kemajuan & jadwal review topik Grammar Dasar (Fase 15). Pengganti localStorage; sebelum migrasi 0012
// dijalankan semua jawaban berisi { available: false } dan klien memakai localStorage seperti sebelumnya.
const SLUG = /^[a-z0-9-]{2,64}$/;

export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  return NextResponse.json(await loadGrammarProgress(auth.supabase, auth.user.id));
}

/**
 * Body:
 *  { action: "complete", slug, done: boolean }  — tandai selesai / batalkan
 *  { action: "migrate", slugs: string[] }       — pindahkan status dari localStorage (sekali jalan)
 *  { action: "review", slug, quality: 0-5 }     — hasil review manual ("masih ingat" / "perlu diulang")
 */
export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { supabase, user } = auth;

  const body = await req.json().catch(() => null);
  const action = body?.action;

  if (action === "complete") {
    if (typeof body.slug !== "string" || !SLUG.test(body.slug)) return NextResponse.json({ error: "Slug tidak valid." }, { status: 400 });
    const res = await setGrammarDone(supabase, user.id, body.slug, body.done !== false);
    if (!res.available) return NextResponse.json({ available: false, rows: [] });
    if (!res.ok) return NextResponse.json({ error: "Gagal menyimpan." }, { status: 500 });
    return NextResponse.json(await loadGrammarProgress(supabase, user.id));
  }

  if (action === "migrate") {
    const slugs: string[] = Array.isArray(body.slugs)
      ? Array.from(new Set<string>(body.slugs.filter((s: unknown): s is string => typeof s === "string" && SLUG.test(s)))).slice(0, 100)
      : [];
    const current = await loadGrammarProgress(supabase, user.id);
    if (!current.available) return NextResponse.json({ available: false, rows: [] });
    // Hanya topik yang benar-benar ada (kunci asing); topik yang sudah selesai di database tidak dijadwal ulang
    const { data: topics } = slugs.length ? await supabase.from("grammar_topics").select("slug").in("slug", slugs) : { data: [] as { slug: string }[] };
    for (const t of topics || []) await setGrammarDone(supabase, user.id, t.slug, true);
    return NextResponse.json(await loadGrammarProgress(supabase, user.id));
  }

  if (action === "review") {
    if (typeof body.slug !== "string" || !SLUG.test(body.slug)) return NextResponse.json({ error: "Slug tidak valid." }, { status: 400 });
    const quality = Number(body.quality);
    if (!Number.isFinite(quality) || quality < 0 || quality > 5) return NextResponse.json({ error: "Kualitas harus 0-5." }, { status: 400 });
    const review = await applyGrammarReview(supabase, user.id, body.slug, quality);
    if (!review) return NextResponse.json({ error: "Topik belum ditandai selesai." }, { status: 409 });
    return NextResponse.json({ available: true, review });
  }

  return NextResponse.json({ error: "Aksi tidak dikenal." }, { status: 400 });
}
