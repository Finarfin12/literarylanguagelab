import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: "Text is required" }, { status: 400 });

    const sample = text.slice(0, 3000);
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `Analyze the difficulty of this English literary text. Return JSON with:
- "cefr": CEFR level (A1/A2/B1/B2/C1/C2)
- "score": numeric 1-10 difficulty score
- "word_complexity": percentage of advanced vocabulary (estimate)
- "avg_sentence_length": average sentence length in words
- "explanation": brief explanation in Indonesian why this level
- "recommended_for": who should read this (in Indonesian)`,
        },
        { role: "user", content: sample },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    return NextResponse.json(JSON.parse(completion.choices[0]?.message?.content || "{}"));
  } catch (err: unknown) {
    console.error("Difficulty analysis error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
