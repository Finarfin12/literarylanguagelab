import { runAI } from "@/lib/ai/run";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const authResult = await requireUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const rateLimitRes = await checkRateLimit(user.id, "highlight-syntax");
    if (rateLimitRes) {
      return rateLimitRes;
    }

    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }


    const systemPrompt = `You are a linguist parsing English syntax. Analyze the provided text and classify each word (or short phrase) into one of four roles: "Subject", "Verb", "Object", or "Other".
Return a JSON array of objects, where each object has "word" (the exact text segment) and "role" (one of the 4 categories). 
Ensure the combined "word" strings exactly reconstruct the original text, including spaces and punctuation. If a space or punctuation is attached to a word, include it in the "word" field.
Example Output format:
{
  "tokens": [
    {"word": "The quick brown fox ", "role": "Subject"},
    {"word": "jumps over ", "role": "Verb"},
    {"word": "the lazy dog.", "role": "Object"}
  ]
}
IMPORTANT: Only output valid JSON without markdown wrapping or extra commentary.`;

    const response = await runAI("highlight-syntax", {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text }
      ],
      temperature: 0.1,
      max_tokens: 2048,
      response_format: { type: "json_object" },
    }, { userId: user?.id });

    // Model kadang membungkus JSON dengan ```; ambil objek JSON terluar saja
    const raw = response.content?.trim() || "{}";
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    let data: { tokens?: unknown };
    try {
      data = JSON.parse(start >= 0 && end > start ? raw.slice(start, end + 1) : raw);
    } catch {
      return NextResponse.json({ error: "AI mengembalikan JSON tidak valid. Coba lagi." }, { status: 502 });
    }
    const tokens = Array.isArray(data.tokens)
      ? data.tokens.filter((t): t is { word: string; role: string } => !!t && typeof (t as { word?: unknown }).word === "string")
      : [];
    if (tokens.length === 0) {
      return NextResponse.json({ error: "AI tidak mengembalikan hasil bedah. Coba lagi." }, { status: 502 });
    }

    return NextResponse.json({ tokens });
  } catch (error: unknown) {
    console.error("Syntax Highlighting Error:", error);
    // Galat dari penyedia AI (mis. 400 "Failed to validate JSON") tidak diteruskan mentah ke pengguna
    return NextResponse.json({ error: "Layanan AI gagal memproses teks ini. Coba lagi." }, { status: 500 });
  }
}
