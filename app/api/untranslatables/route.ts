import { runAI } from "@/lib/ai/run";
import { NextResponse } from "next/server";
import { formatAITextResponse, withAITextOutputRules } from "@/lib/ai-output";
import { requireUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const SYSTEM_PROMPT = `You are an expert in Literary Translation, specifically focusing on "Untranslatable" words.
The user will provide a word or concept that is difficult to translate directly into Indonesian (e.g., "wistful", "serendipity").
Provide:
1. Meaning: The core meaning and nuance of the word.
2. Strategies: How to translate it using 3-4 translation procedures (e.g., Descriptive translation, Borrowing with footnote, Cultural equivalent, Modulation). Explain the trade-off of each strategy.
3. Professional Examples: 2 hypothetical or real examples of how a professional translator might translate it in a literary context.

Respond in BOTH English and Indonesian using HIGHLY STRUCTURED Markdown.`;

export async function POST(req: Request) {
  try {
    const authResult = await requireUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const rateLimitRes = await checkRateLimit(user.id, "untranslatables");
    if (rateLimitRes) {
      return rateLimitRes;
    }

    const { word } = await req.json();

    if (!word) {
      return NextResponse.json({ error: "Missing word" }, { status: 400 });
    }

    const completion = await runAI("untranslatables", {
      messages: [
        { role: "system", content: withAITextOutputRules(SYSTEM_PROMPT) },
        { role: "user", content: `Analyze the word: "${word}"` }
      ],
    }, { userId: user?.id });

    const result = formatAITextResponse(completion.content || "");
    return NextResponse.json({ result });
  } catch (error: unknown) {
    console.error("Untranslatables Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
