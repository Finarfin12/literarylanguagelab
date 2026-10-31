import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { recordEvidence } from "@/lib/skill-evidence";

// Sumber yang boleh dilaporkan klien. Skor dinilai di browser (Listening Test), jadi hanya dipakai
// sebagai bukti ringan; kenaikan level tetap harus lewat Tes Naik Level yang dinilai di server.
const ALLOWED: Record<string, { skill: "listening"; source: string }> = {
  listening_test: { skill: "listening", source: "listening_test" },
};

export async function POST(req: Request) {
  try {
    const authResult = await requireUser();
    if (authResult instanceof NextResponse) return authResult;
    const { supabase, user } = authResult;

    const { kind, score } = await req.json();
    const rule = typeof kind === "string" ? ALLOWED[kind] : undefined;
    if (!rule) return NextResponse.json({ error: "Jenis bukti tidak dikenal." }, { status: 400 });
    if (typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > 100) {
      return NextResponse.json({ error: "Skor harus 0-100." }, { status: 400 });
    }

    await recordEvidence(supabase, user.id, { skill: rule.skill, source: rule.source, score });
    return NextResponse.json({ recorded: true });
  } catch (error) {
    console.error("Skill evidence error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
