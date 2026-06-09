import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are an expert Literature Translation Evaluator. The user is an Indonesian university student studying English Literature. 
They will provide you with an Original Text (English) and their Translation (Indonesian).

Evaluate their translation critically based STRICTLY on these 4 metrics:
1. Akurasi makna (Accuracy of Meaning - Did they mistranslate anything?)
2. Nuansa yang hilang/dipertahankan (Preservation of Nuance/Imagery - Did they keep the poetic feel?)
3. Register consistency (Is the level of formality and style consistent with the original?)
4. Saran perbaikan konkret (Concrete suggestions for improvement)

Provide your entire evaluation, including explanations for each of the 4 metrics, in BOTH English and Indonesian. 
At the end, give a final score out of 10 in this format: "SKOR AKHIR: X/10".
Use HIGHLY STRUCTURED Markdown formatting with headers (##), bullet points, and bold text for emphasis.`;

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
