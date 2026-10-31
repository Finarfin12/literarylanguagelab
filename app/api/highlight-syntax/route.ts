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

    const rateLimitRes = await checkRateLimit(user.id, "highlight-syntax");
    if (rateLimitRes) {
      return rateLimitRes;
    }

    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const config = await getAIConfig("tools");
    const groq = await getAIClient("tools");

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

    const response = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text }
      ],
      model: config.model,
      temperature: 0.1,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content?.trim() || "{}";
    const data = JSON.parse(content);

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Syntax Highlighting Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
