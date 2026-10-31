import { runAI } from "@/lib/ai/run";
import { NextResponse } from "next/server";
import { formatAITextResponse, withAITextOutputRules } from "@/lib/ai-output";
import { requireUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const SYSTEM_PROMPT = `You are a Master Translation Analyst. The user will provide an Original English text and a Professional Indonesian Translation.
Your goal is to reverse-engineer and annotate the translator's decisions line-by-line or phrase-by-phrase.
Provide:
1. Alignment: Show the original phrase and its corresponding translation.
2. Strategy Used: (e.g., Formal equivalence, Cultural substitution, Modulation, Transposition).
3. Trade-offs: What was lost or gained? (e.g., "Maintains tone but loses literal brevity").
4. Alternatives: Provide one alternative translation approach.

Respond in BOTH English and Indonesian using HIGHLY STRUCTURED Markdown.`;

export async function POST(req: Request) {
  try {
    const authResult = await requireUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const rateLimitRes = await checkRateLimit(user.id, "comparator");
    if (rateLimitRes) {
      return rateLimitRes;
    }

    const { originalText, translatedText } = await req.json();

    if (!originalText || !translatedText) {
      return NextResponse.json({ error: "Missing text parameters" }, { status: 400 });
    }

    const prompt = `Original Text:\n"${originalText}"\n\nProfessional Translation:\n"${translatedText}"`;

    const completion = await runAI("comparator", {
      messages: [
        { role: "system", content: withAITextOutputRules(SYSTEM_PROMPT) },
        { role: "user", content: prompt }
      ],
    }, { userId: user?.id });

    const result = formatAITextResponse(completion.content || "");
    return NextResponse.json({ result });
  } catch (error: unknown) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
