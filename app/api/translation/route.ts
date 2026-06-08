import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are an expert Literature Translation Evaluator. The user is an Indonesian university student studying English Literature. 
They will provide you with an Original Text (English) and their Translation (Indonesian).

Evaluate their translation critically based on:
1. Accuracy of Meaning (Did they mistranslate anything?)
2. Preservation of Imagery and Rhetorical Devices (Did they keep the poetic/literary feel?)
3. Nuance & Tone (Did they capture the specific 'flavor' of the original text?)
4. Naturalness in Indonesian (Does it sound awkward or like a machine translation?)

Provide constructive feedback in Indonesian. 
At the end, give a final score out of 10 in this format: "SKOR AKHIR: X/10".
Use clear Markdown formatting with headers, bullet points, and bold text for emphasis.`;

export async function POST(req: Request) {
  try {
    const { originalText, translatedText } = await req.json();

    if (!originalText || !translatedText) {
      return NextResponse.json({ error: "Missing text parameters" }, { status: 400 });
    }

    const prompt = `Original Text:\n"${originalText}"\n\nStudent Translation:\n"${translatedText}"`;

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
    console.error("Translation Eval Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
