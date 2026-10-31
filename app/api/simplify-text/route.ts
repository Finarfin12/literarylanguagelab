import { runAI } from "@/lib/ai/run";
import { NextResponse } from "next/server";
import { formatAITextResponse } from "@/lib/ai-output";
import { requireUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const authResult = await requireUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const rateLimitRes = await checkRateLimit(user.id, "simplify-text");
    if (rateLimitRes) {
      return rateLimitRes;
    }

    const { text, level } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }


    const targetLevel = level || "B1";

    const systemPrompt = `You are an expert English teacher. Rewrite the following literary text into simple, modern English at the CEFR ${targetLevel} level.
Keep the core meaning, emotions, and plot intact. Do not summarize, just rewrite paragraph for paragraph. Output ONLY the simplified text.`;

    const response = await runAI("simplify-text", {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text }
      ],
      temperature: 0.3,
      max_tokens: 1024,
    }, { userId: user?.id });

    const simplifiedText = formatAITextResponse(response.content?.trim() || "");

    return NextResponse.json({ simplifiedText });
  } catch (error: unknown) {
    console.error("Simplify Text Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
