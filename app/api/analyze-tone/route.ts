import { runAI } from "@/lib/ai/run";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { extractJsonObject } from "@/lib/ai/json";
import { MAX_TONE_CONTEXT, MAX_TONE_TEXT, sanitizeToneResult } from "@/lib/tone";

export async function POST(req: Request) {
  try {
    const authResult = await requireUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const rateLimitRes = await checkRateLimit(user.id, "analyze-tone");
    if (rateLimitRes) {
      return rateLimitRes;
    }

    const body = await req.json().catch(() => null);
    const text = body && typeof body.text === "string" ? body.text.trim() : "";
    const context = body && typeof body.context === "string" ? body.context.trim() : "";
    if (!text) return NextResponse.json({ error: "Text is required" }, { status: 400 });
    if (text.length > MAX_TONE_TEXT) {
      return NextResponse.json({ error: `Teks terlalu panjang (maksimum ${MAX_TONE_TEXT} karakter).` }, { status: 413 });
    }
    if (context.length > MAX_TONE_CONTEXT) {
      return NextResponse.json({ error: `Konteks terlalu panjang (maksimum ${MAX_TONE_CONTEXT} karakter).` }, { status: 413 });
    }

    const completion = await runAI("analyze-tone", {
      messages: [
        {
          role: "system",
          content: `Analyze the tone of this English sentence. Context provided may help.

Return JSON with:
- "tone": one of (neutral/formal/sarcastic/ironic/humorous/melancholic/dramatic/romantic/ominous/urgent)
- "confidence": 0-100 score
- "markers": array of linguistic markers (word choices, syntax, punctuation) that indicate this tone
- "preservation_tips": how to preserve this tone when translating to Indonesian
- "better_translation": a suggested Indonesian translation that preserves the tone (if applicable)

Respond in Indonesian for preservation_tips and better_translation. Keep markers in English. Output only the JSON object.`,
        },
        { role: "user", content: `Sentence: "${text}"\n\nContext: ${context || "(no context provided)"}` },
      ],
      response_format: { type: "json_object" },
    }, { userId: user?.id });

    // Tahan pagar kode ```json ... ``` dan keluaran yang tidak valid: 502 berpesan jelas, bukan 500 generik
    const result = sanitizeToneResult(extractJsonObject(completion.content));
    if (!result) {
      return NextResponse.json({ error: "AI mengembalikan hasil yang tidak bisa dibaca. Coba lagi." }, { status: 502 });
    }
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error("Tone analysis error:", err);
    return NextResponse.json({ error: "Layanan AI gagal menganalisis nada. Coba lagi." }, { status: 500 });
  }
}
