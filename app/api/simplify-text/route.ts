import { NextResponse } from "next/server";
import { Groq } from "groq-sdk";

export async function POST(req: Request) {
  try {
    const { text, level } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const targetLevel = level || "B1";

    const systemPrompt = `You are an expert English teacher. Rewrite the following literary text into simple, modern English at the CEFR ${targetLevel} level.
Keep the core meaning, emotions, and plot intact. Do not summarize, just rewrite paragraph for paragraph. Output ONLY the simplified text.`;

    const response = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text }
      ],
      model: "llama3-8b-8192",
      temperature: 0.3,
      max_tokens: 1024,
    });

    const simplifiedText = response.choices[0]?.message?.content?.trim() || "";

    return NextResponse.json({ simplifiedText });
  } catch (error: any) {
    console.error("Simplify Text Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
