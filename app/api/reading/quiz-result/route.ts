import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { isCefrLevel } from "@/lib/cefr";
import { recordEvidence } from "@/lib/skill-evidence";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Hasil kuis pemahaman bab di reader → bukti keterampilan membaca.
 * Level teks diambil di server dari texts.cefr_level, bukan dari klien. Teks tanpa level
 * (mis. buku Gutenberg) tidak dicatat karena tidak bisa dipakai sebagai bukti level.
 */
export async function POST(req: Request) {
  try {
    const authResult = await requireUser();
    if (authResult instanceof NextResponse) return authResult;
    const { supabase, user } = authResult;

    const { textId, correct } = await req.json();
    if (typeof correct !== "boolean") return NextResponse.json({ error: "Field 'correct' wajib berupa boolean." }, { status: 400 });
    if (typeof textId !== "string" || !UUID.test(textId)) return NextResponse.json({ recorded: false });

    const { data: text, error } = await supabase.from("texts").select("cefr_level").eq("id", textId).maybeSingle();
    if (error || !isCefrLevel(text?.cefr_level)) return NextResponse.json({ recorded: false });

    await recordEvidence(supabase, user.id, {
      skill: "reading",
      source: "reader_quiz",
      score: correct ? 100 : 0,
      text_cefr: text.cefr_level,
      ref_id: textId,
    });
    return NextResponse.json({ recorded: true });
  } catch (error) {
    console.error("Quiz result error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
