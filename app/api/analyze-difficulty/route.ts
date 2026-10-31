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

    const rateLimitRes = await checkRateLimit(user.id, "analyze-difficulty");
    if (rateLimitRes) {
      return rateLimitRes;
    }

    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: "Text is required" }, { status: 400 });

    const sample = text.slice(0, 3000);
    const completion = await runAI("analyze-difficulty", {
      messages: [
        {
          role: "system",
          content: `Analyze the difficulty of this English literary text. Return JSON with:
- "cefr": CEFR level (A1/A2/B1/B2/C1/C2)
- "score": numeric 1-10 difficulty score
- "word_complexity": percentage of advanced vocabulary (estimate)
- "avg_sentence_length": average sentence length in words
- "explanation": brief explanation in Indonesian why this level
- "recommended_for": who should read this (in Indonesian)`,
        },
        { role: "user", content: sample },
      ],
      response_format: { type: "json_object" },
    }, { userId: user?.id });

    return NextResponse.json(JSON.parse(completion.content || "{}"));
  } catch (err: unknown) {
    console.error("Difficulty analysis error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
