import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { RUBRIC_ID, STAGE_WINDOW, translatorStage } from "@/lib/translation/rubric";

/** Tahap kompetensi penerjemah (Pemula/Berkembang/Mahir) dari skor rubrik beberapa terjemahan terakhir. */
export async function GET() {
  try {
    const authResult = await requireUser();
    if (authResult instanceof NextResponse) return authResult;
    const { supabase, user } = authResult;

    // Hanya relevan bagi pengguna dengan tujuan "penerjemahan". Kolom dari migrasi 0006: jika belum ada, tampilkan nihil.
    const { data: profile, error: pErr } = await supabase.from("profiles").select("learning_goal").eq("id", user.id).maybeSingle();
    if (pErr || profile?.learning_goal !== "penerjemahan") return NextResponse.json({ show: false });

    const { data, error } = await supabase
      .from("translation_assessments")
      .select("weighted_score")
      .eq("user_id", user.id)
      .eq("rubric", RUBRIC_ID)
      .order("created_at", { ascending: false })
      .limit(STAGE_WINDOW);
    if (error) return NextResponse.json({ show: false });

    const stage = translatorStage((data || []).map((r) => Number(r.weighted_score)));
    return NextResponse.json({ show: true, stage });
  } catch (error) {
    console.error("Translator stage error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
