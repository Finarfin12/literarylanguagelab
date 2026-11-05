import { runAI } from "@/lib/ai/run";
import { NextResponse } from "next/server";
import { formatAITextResponse, withAITextOutputRules } from "@/lib/ai-output";
import { requireUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { buildSystemPrompt, parseAlterEgoRequest } from "@/lib/alter-ego";

export async function POST(req: Request) {
  try {
    const authResult = await requireUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const rateLimitRes = await checkRateLimit(user.id, "alter-ego");
    if (rateLimitRes) {
      return rateLimitRes;
    }

    const body = await req.json().catch(() => null);
    const parsed = parseAlterEgoRequest(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const formattedMessages = [
      { role: "system" as const, content: withAITextOutputRules(buildSystemPrompt(parsed.author)) },
      ...parsed.messages,
    ];

    const completion = await runAI("alter-ego", {
      messages: formattedMessages,
      temperature: 0.8,
      max_tokens: 1000,
    }, { userId: user?.id });

    const result = formatAITextResponse(completion.content || "");
    return NextResponse.json({ result });
  } catch (error: unknown) {
    console.error("Alter Ego Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
