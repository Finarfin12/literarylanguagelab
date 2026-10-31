import { NextResponse } from "next/server";
import { runAI } from "@/lib/ai/run";
import { requireUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { RUBRIC_ID, aggregateScore, normalizeScore, weightedScore, type SegmentAssessment } from "@/lib/translation/rubric";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_SEGMENTS = 30;
const MAX_CHARS = 1500;

type Pair = { idx: number; source: string; target: string };

/**
 * Penilaian terjemahan dengan rubrik Nababan et al. (2012). Dua cara pemanggilan:
 * - { projectId }: segmen dibaca dari database (milik pengguna, lewat RLS), bukan dari klien.
 * - { segments: [{ source, target }] }: dari Translation Workshop tanpa proyek.
 * Hasil disimpan ke translation_assessments (jika migrasi 0010 sudah dijalankan).
 */
export async function POST(req: Request) {
  try {
    const authResult = await requireUser();
    if (authResult instanceof NextResponse) return authResult;
    const { supabase, user } = authResult;

    const rateLimitRes = await checkRateLimit(user.id, "translation-rubric");
    if (rateLimitRes) return rateLimitRes;

    const body = await req.json();
    let projectId: string | null = null;
    let brief: string | null = null;
    let pairs: Pair[] = [];

    if (body.projectId !== undefined && body.projectId !== null) {
      if (typeof body.projectId !== "string" || !UUID.test(body.projectId)) return NextResponse.json({ error: "Proyek tidak valid." }, { status: 400 });
      const { data: project, error: pErr } = await supabase.from("translation_projects").select("id, brief").eq("id", body.projectId).maybeSingle();
      if (pErr) return NextResponse.json({ error: "Ruang Kerja belum aktif (migrasi 0010 belum dijalankan)." }, { status: 503 });
      if (!project) return NextResponse.json({ error: "Proyek tidak ditemukan." }, { status: 404 });
      projectId = project.id;
      brief = project.brief;
      const { data: segs } = await supabase
        .from("translation_segments")
        .select("idx, source, target")
        .eq("project_id", projectId)
        .order("idx", { ascending: true });
      pairs = (segs || []).filter((s) => (s.target ?? "").trim() !== "").map((s) => ({ idx: s.idx, source: s.source, target: s.target as string }));
    } else if (Array.isArray(body.segments)) {
      pairs = body.segments
        .filter((s: { source?: unknown; target?: unknown }) => typeof s?.source === "string" && typeof s?.target === "string" && s.source.trim() && s.target.trim())
        .map((s: { source: string; target: string }, i: number) => ({ idx: i, source: s.source.trim(), target: s.target.trim() }));
    }

    if (pairs.length === 0) return NextResponse.json({ error: "Belum ada segmen yang sudah diterjemahkan untuk dinilai." }, { status: 400 });
    if (pairs.length > MAX_SEGMENTS) return NextResponse.json({ error: `Maksimal ${MAX_SEGMENTS} segmen per penilaian.` }, { status: 400 });
    pairs = pairs.map((p) => ({ ...p, source: p.source.slice(0, MAX_CHARS), target: p.target.slice(0, MAX_CHARS) }));

    const listing = pairs.map((p) => `[${p.idx}]\nSource: ${p.source}\nTranslation: ${p.target}`).join("\n\n");
    const completion = await runAI("translation-rubric", {
      messages: [
        {
          role: "system",
          content: `You assess English-to-Indonesian translations with the rubric of Nababan, Nuraeni & Sumardiono (2012). For EACH segment give three scores on a 1-3 scale:
- accuracy: 3 = meaning conveyed accurately; 2 = partly accurate (some meaning shifted or lost); 1 = inaccurate.
- acceptability: 3 = natural and fits Indonesian norms; 2 = mostly natural with minor awkwardness; 1 = unnatural or breaks target norms.
- readability: 3 = easy to understand; 2 = moderately easy; 1 = hard to understand.
Add a short "notes" in Indonesian (max 2 sentences) explaining the scores.${brief ? `\nTranslation brief (purpose/target reader): ${String(brief).slice(0, 400)}` : ""}
Respond ONLY with valid JSON: {"segments":[{"idx":0,"accuracy":3,"acceptability":2,"readability":3,"notes":"..."}]} with one entry per segment, using the given idx numbers.`,
        },
        { role: "user", content: listing },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 2500,
    }, { userId: user.id });

    let parsed: { segments?: Partial<SegmentAssessment>[] };
    try {
      parsed = JSON.parse((completion.content || "{}").replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
    } catch {
      return NextResponse.json({ error: "Respons AI tidak valid. Coba lagi." }, { status: 502 });
    }

    // Hanya idx yang memang dikirim; nilai dinormalkan ke skala 1-3
    const byIdx = new Map((parsed.segments || []).map((s) => [Number(s.idx), s]));
    const perSegment: SegmentAssessment[] = [];
    for (const p of pairs) {
      const s = byIdx.get(p.idx);
      if (!s) continue;
      perSegment.push({
        idx: p.idx,
        accuracy: normalizeScore(s.accuracy),
        acceptability: normalizeScore(s.acceptability),
        readability: normalizeScore(s.readability),
        notes: String(s.notes || "").slice(0, 400),
      });
    }
    if (perSegment.length === 0) return NextResponse.json({ error: "AI tidak mengembalikan penilaian. Coba lagi." }, { status: 502 });

    const finalScore = aggregateScore(perSegment);
    const detailed = perSegment.map((s) => ({ ...s, weighted: weightedScore(s) }));

    const { data: saved, error: saveError } = await supabase
      .from("translation_assessments")
      .insert({ user_id: user.id, project_id: projectId, rubric: RUBRIC_ID, per_segment: perSegment, weighted_score: finalScore, assessed_by: "ai" })
      .select("id")
      .single();

    return NextResponse.json({
      assessmentId: saved?.id ?? null,
      saved: !saveError,
      weightedScore: finalScore,
      perSegment: detailed,
      skipped: pairs.length - perSegment.length,
    });
  } catch (error) {
    console.error("Rubric assessment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
