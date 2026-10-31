import { NextResponse } from "next/server";
import { getAIClient, getAIConfig } from "@/lib/ai-config";
import { requireUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const authResult = await requireUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const rateLimitRes = await checkRateLimit(user.id, "generate-text");
    if (rateLimitRes) {
      return rateLimitRes;
    }

    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const config = await getAIConfig("tools");
    const groq = await getAIClient("tools");
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a master literary writer. Create a short story or literary text in English based on the user's prompt. Your writing should be sophisticated, using advanced vocabulary, metaphors, and rich literary devices. You MUST respond strictly in valid JSON format with four keys: 'title' (string), 'author' (invent a fitting pen name, string), 'content' (the story itself, string), and 'difficulty' (integer from 1 to 5, where 5 is extremely challenging vocabulary)."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: config.model,
      temperature: config.temperature,
      max_tokens: config.max_tokens,
      response_format: { type: "json_object" }
    });

    const resultStr = completion.choices[0]?.message?.content || "{}";
    const result = JSON.parse(resultStr);

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Groq generation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
