import { runAI } from "@/lib/ai/run";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const SYSTEM_PROMPT = `You are an expert cultural translator and Gen-Z slang dictionary. The user will provide a sentence or phrase containing modern English slang, internet abbreviations, pop culture references, or idioms.

Your job is to decode the slang and explain it in CASUAL Indonesian (Bahasa Gaul/Sehari-hari), NOT stiff textbook Indonesian.

Return ONLY valid JSON. No markdown fences.

Response format:
{
  "phrases": [
    {
      "phrase": "the specific slang word/phrase",
      "type": "Slang|Abbreviation|Internet Lingo|Pop Culture|Idiom|Business Jargon",
      "meaning_id": "Penjelasan artinya dalam bahasa Indonesia sehari-hari/gaul.",
      "meaning_en": "Meaning in plain English.",
      "formality": 1, // 1 (Very Casual) to 5 (Formal)
      "origin": "Where it came from (e.g., TikTok, Gaming, AAVE, Business)",
      "formal_equivalent": "How to say this in standard formal English.",
      "example": "A new example sentence using this slang."
    }
  ],
  "overall_meaning_id": "Jika user memasukkan kalimat utuh, terjemahkan secara keseluruhan ke bahasa Indonesia gaul."
}`;

export async function POST(req: Request) {
  try {
    const authResult = await requireUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const rateLimitRes = await checkRateLimit(user.id, "slang-decoder");
    if (rateLimitRes) {
      return rateLimitRes;
    }

    const { text } = await req.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Teks tidak boleh kosong." }, { status: 400 });
    }


    const completion = await runAI("slang-decoder", {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text }
      ],
      temperature: 0.5,
      max_tokens: 1500,
    }, { userId: user?.id });

    const raw = completion.content || "{}";

    let parsed;
    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        phrases: [],
        overall_meaning_id: "Maaf, gagal memproses teks ini.",
      };
    }

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error("Slang Decoder Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
