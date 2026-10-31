import { NextResponse } from "next/server";
import { runAI } from "@/lib/ai/run";
import { requireUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const TAXONOMY = "molina_hurtado_albir_2002";
const MAX_TEXT = 2000;

type Suggestion = { source_span: string; target_span: string; technique_key: string; reason: string };

/**
 * Saran teknik penerjemahan untuk satu pasangan teks. Hanya mengembalikan saran: pengguna yang
 * memutuskan dan menyimpannya (server action addAnnotation). Saran yang kuncinya tidak ada di taksonomi,
 * atau frasanya tidak benar-benar ada di teks, dibuang.
 */
export async function POST(req: Request) {
  try {
    const authResult = await requireUser();
    if (authResult instanceof NextResponse) return authResult;
    const { supabase, user } = authResult;

    const rateLimitRes = await checkRateLimit(user.id, "translation-technique-suggest");
    if (rateLimitRes) return rateLimitRes;

    const { sourceText, targetText } = await req.json();
    if (typeof sourceText !== "string" || typeof targetText !== "string" || !sourceText.trim() || !targetText.trim()) {
      return NextResponse.json({ error: "Teks sumber dan terjemahan wajib diisi." }, { status: 400 });
    }
    const source = sourceText.trim().slice(0, MAX_TEXT);
    const target = targetText.trim().slice(0, MAX_TEXT);

    const { data: techniques, error } = await supabase
      .from("translation_techniques")
      .select("key, name_en, name_id")
      .eq("taxonomy", TAXONOMY);
    if (error || !techniques || techniques.length === 0) {
      return NextResponse.json({ error: "Daftar teknik belum tersedia (migrasi 0010 belum dijalankan)." }, { status: 503 });
    }
    const validKeys = new Set(techniques.map((t) => t.key as string));
    const names = new Map(techniques.map((t) => [t.key as string, t.name_id as string]));
    const list = techniques.map((t) => `- ${t.key}: ${t.name_en}`).join("\n");

    const completion = await runAI("translation-technique-suggest", {
      messages: [
        {
          role: "system",
          content: `You are an expert in translation studies. Analyze an English source passage and its Indonesian translation using the translation techniques of Molina & Hurtado Albir (2002).
Pick up to 6 clear examples of techniques actually used. For each, copy the exact source phrase and the exact target phrase (they must appear verbatim in the texts), the technique key, and a one-sentence reason written in Indonesian.
Allowed technique keys:
${list}
Respond ONLY with valid JSON: {"suggestions":[{"source_span":"...","target_span":"...","technique_key":"...","reason":"..."}]}`,
        },
        { role: "user", content: `Source (English):\n${source}\n\nTranslation (Indonesian):\n${target}` },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 1500,
    }, { userId: user.id });

    let parsed: { suggestions?: Suggestion[] };
    try {
      parsed = JSON.parse((completion.content || "{}").replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
    } catch {
      return NextResponse.json({ error: "Respons AI tidak valid. Coba lagi." }, { status: 502 });
    }

    const lowerSource = source.toLowerCase();
    const lowerTarget = target.toLowerCase();
    const suggestions = (parsed.suggestions || [])
      .filter(
        (s) =>
          s &&
          typeof s.source_span === "string" &&
          typeof s.target_span === "string" &&
          typeof s.technique_key === "string" &&
          validKeys.has(s.technique_key) &&
          s.source_span.trim() !== "" &&
          s.target_span.trim() !== "" &&
          lowerSource.includes(s.source_span.trim().toLowerCase()) &&
          lowerTarget.includes(s.target_span.trim().toLowerCase())
      )
      .slice(0, 6)
      .map((s) => ({
        source_span: s.source_span.trim(),
        target_span: s.target_span.trim(),
        technique_key: s.technique_key,
        technique_name: names.get(s.technique_key) ?? s.technique_key,
        reason: String(s.reason || "").slice(0, 300),
      }));

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Technique suggest error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
