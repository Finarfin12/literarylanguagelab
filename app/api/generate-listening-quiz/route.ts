import { runAI } from "@/lib/ai/run";
import { guardAIRoute } from "@/lib/ai/guard";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const guard = await guardAIRoute(req, { limitKey: "listening-quiz", maxChars: 120000, maxMessages: 5 });
    if (guard instanceof NextResponse) return guard;
    const { user, body } = guard;
    const { text, title, author } = body as { text?: string; title?: string; author?: string };

    if (!text || text.trim() === "") {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }



    const prompt = `You are an expert English teacher. The user just read a chapter or a passage from "${title || "a book"}" by ${author || "unknown"}.
Based on this text, generate exactly 3 listening comprehension questions. The questions should test their understanding of the plot, characters, or main ideas.
The questions will be spoken aloud to the user, and they will answer orally.

For each question, provide:
1. "question": The question text to be spoken.
2. "expected_answer": A brief summary of what a correct answer should include (in English).

Respond ONLY with valid JSON in this format:
{
  "questions": [
    { "question": "What was the main character feeling when she entered the room?", "expected_answer": "She was feeling anxious and overwhelmed." }
  ]
}

Text passage:
"""
${text.substring(0, 15000)}
"""`;

    const completion = await runAI("listening-quiz", {
      messages: [
        { role: "system", content: "You are a helpful JSON-only API. Only output valid JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    }, { userId: user?.id });

    const raw = completion.content || "{}";
    let parsed;
    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
      
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
         throw new Error("Invalid format");
      }
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    return NextResponse.json({ questions: parsed.questions });
  } catch (error: any) {
    console.error("Listening Quiz Generation Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
