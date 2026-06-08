import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { text, targetTone } = await req.json();

    if (!text || !targetTone) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const prompt = `Text:\n"${text}"\n\nTarget Tone: ${targetTone}\n\nTask: 
1. Evaluate the current grammatical structure and tone of the text.
2. Estimate its CEFR reading level.
3. Provide a 'Before & After' comparison showing how the text is rewritten to perfectly match the requested Target Tone.
4. Explain the grammar/diction choices made to achieve this new tone.

Respond entirely in Indonesian using clear Markdown formatting (except for the English text itself).`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful and highly intelligent literature and grammar assistant." },
        { role: "user", content: prompt }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 1500,
    });

    const result = completion.choices[0]?.message?.content || "";
    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("Tone Analyzer Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
