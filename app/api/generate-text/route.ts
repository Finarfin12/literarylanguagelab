import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

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
      model: "llama-3.3-70b-versatile",
      temperature: 0.8,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const resultStr = completion.choices[0]?.message?.content || "{}";
    const result = JSON.parse(resultStr);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Groq generation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
