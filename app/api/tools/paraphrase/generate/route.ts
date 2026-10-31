import { runAI } from "@/lib/ai/run";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(req: Request) {
  try {
    const authResult = await requireUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const rateLimitRes = await checkRateLimit(user.id, "paraphrase-generate");
    if (rateLimitRes) {
      return rateLimitRes;
    }

    const url = new URL(req.url);
    const level = url.searchParams.get("level") || "B2";

    const systemPrompt = `You are a literature teacher generating paraphrase challenges. 
Generate 1 random, beautiful sentence from a classic English literature novel that matches the CEFR level ${level}.
The sentence should be maximum 30 words.
DO NOT provide any other text, intro, or markdown. Output ONLY a valid JSON object in this exact format:
{
  "quote": "The actual quote here...",
  "author": "Author Name",
  "book": "Book Name"
}`;

    const completion = await runAI("paraphrase-generate", {
      messages: [{ role: "system", content: systemPrompt }],
    }, { userId: user?.id });

    const result = completion.content || "";
    const start = result.indexOf("{");
    const end = result.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("Invalid JSON generated");

    const parsed = JSON.parse(result.substring(start, end + 1));
    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error("Paraphrase Generate Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
