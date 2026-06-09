import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { quote, paraphrase } = await req.json();

    if (!quote || !paraphrase) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const systemPrompt = `You are a literature examiner evaluating a student's paraphrase.
Original Quote: "${quote}"
Student's Paraphrase: "${paraphrase}"

Evaluate the student's paraphrase based on:
1. Meaning Retention: Did they capture the core message?
2. Nuance & Tone: Did they retain the feeling or completely destroy the poetic nature?
3. Grammar & Vocabulary: Is the English natural and correct?

Provide all your explanations and results in BOTH English and Indonesian using clear Markdown. 
At the end of your feedback, provide a final score in this exact format: "SKOR: X/10".`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "system", content: systemPrompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 1000,
    });

    const result = completion.choices[0]?.message?.content || "";
    return NextResponse.json({ result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
