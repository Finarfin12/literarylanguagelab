import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const level = url.searchParams.get("level") || "B2";

    const systemPrompt = `You are a literature teacher generating paraphrase challenges. 
Generate 1 random, beautiful sentence from a classic English literature novel that matches the CEFR level ${level}.
The sentence should be maximum 30 words.
DO NOT provide any other text, intro, or markdown. Output ONLY a valid JSON object in this exact format:
{
  "quote": "The actual quote here...",
  "author": "Author Name",
  "book": "Book Name"
}`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "system", content: systemPrompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.9,
      max_tokens: 200,
    });

    const result = completion.choices[0]?.message?.content || "";
    // Robust parsing
    const start = result.indexOf('{');
    const end = result.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error("Invalid JSON generated");
    
    const parsed = JSON.parse(result.substring(start, end + 1));
    return NextResponse.json(parsed);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
