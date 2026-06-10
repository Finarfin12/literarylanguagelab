import { NextResponse } from "next/server";
import { getAIClient, getAIConfig, getRateLimit } from "@/lib/ai-config";


export async function POST(req: Request) {
  try {
    const { text, context } = await req.json();
    if (!text) return NextResponse.json({ error: "Text is required" }, { status: 400 });

    const config = await getAIConfig("tools");
    const groq = await getAIClient("tools");
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Analyze the tone of this English sentence. Context provided may help.

Return JSON with:
- "tone": one of (neutral/formal/sarcastic/ironic/humorous/melancholic/dramatic/romantic/ominous/urgent)
- "confidence": 0-100 score
- "markers": array of linguistic markers (word choices, syntax, punctuation) that indicate this tone
- "preservation_tips": how to preserve this tone when translating to Indonesian
- "better_translation": a suggested Indonesian translation that preserves the tone (if applicable)

Respond in Indonesian for preservation_tips and better_translation. Keep markers in English.`,
        },
        { role: "user", content: `Sentence: "${text}"\n\nContext: ${context || "(no context provided)"}` },
      ],
      model: config.model,
      temperature: config.temperature,
      max_tokens: config.max_tokens,
      response_format: { type: "json_object" },
    });

    return NextResponse.json(JSON.parse(completion.choices[0]?.message?.content || "{}"));
  } catch (err: unknown) {
    console.error("Tone analysis error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
