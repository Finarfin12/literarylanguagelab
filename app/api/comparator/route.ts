import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are a Master Translation Analyst. The user will provide an Original English text and a Professional Indonesian Translation.
Your goal is to reverse-engineer and annotate the translator's decisions line-by-line or phrase-by-phrase.
Provide:
1. Alignment: Show the original phrase and its corresponding translation.
2. Strategy Used: (e.g., Formal equivalence, Cultural substitution, Modulation, Transposition).
3. Trade-offs: What was lost or gained? (e.g., "Maintains tone but loses literal brevity").
4. Alternatives: Provide one alternative translation approach.

Respond in BOTH English and Indonesian using HIGHLY STRUCTURED Markdown.`;

export async function POST(req: Request) {
  try {
    const { originalText, translatedText } = await req.json();

    if (!originalText || !translatedText) {
      return NextResponse.json({ error: "Missing text parameters" }, { status: 400 });
    }

    const prompt = `Original Text:\n"${originalText}"\n\nProfessional Translation:\n"${translatedText}"`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 1500,
    });

    const result = completion.choices[0]?.message?.content || "";
    return NextResponse.json({ result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
