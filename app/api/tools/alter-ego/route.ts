import { runAI } from "@/lib/ai/run";
import { NextResponse } from "next/server";
import { formatAITextResponse, withAITextOutputRules } from "@/lib/ai-output";
import { requireUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

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

    const { author, messages } = await req.json();

    if (!author || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const systemPrompt = `You are ${author}. Embody their exact writing style, vocabulary, era, and worldview. 
Respond to the user's messages as if you are having a conversation with them in the present day, but maintaining your distinct historical persona. 
Use your famous quotes if relevant, but blend them naturally.
Respond ENTIRELY in English. You MUST NOT use Indonesian.
Your tone, diction, and syntactic structure MUST be a perfect, immersive imitation of your historical literary style. Keep your responses concise enough for a chat interface (max 2-3 paragraphs).`;

    const formattedMessages = [
      { role: "system", content: withAITextOutputRules(systemPrompt) },
      ...messages.map((m: any) => ({
        role: m.role,
        content: m.content
      }))
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
