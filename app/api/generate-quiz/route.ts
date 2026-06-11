import { NextResponse } from "next/server";
import { getAIClient, getAIConfig } from "@/lib/ai-config";

const SYSTEM_PROMPT = `You are a friendly reading companion for an intermediate English learner (CEFR B1).
The user is reading a classic literature book. You will be provided with the last few paragraphs they just read (which represent the end of a chapter).
Your task is to generate ONE simple multiple-choice reading comprehension question to ensure they understood the main event or feeling in those paragraphs.

The question must be in Indonesian, but the answer options should be in English (or a mix, whatever makes sense).
Do NOT make it tricky. It should be very obvious if they actually read it.

Return the result as a JSON object matching this schema:
{
  "question": "Pertanyaan dalam bahasa Indonesia...",
  "options": [
    "Option A",
    "Option B",
    "Option C",
    "Option D"
  ],
  "correct_index": 0, // integer 0-3
  "explanation": "Penjelasan singkat dalam bahasa Indonesia mengapa jawaban ini benar."
}

ONLY RETURN VALID JSON. Do not wrap in markdown tags like \`\`\`json.`;

export async function POST(req: Request) {
  try {
    const { contextText, title, author } = await req.json();

    if (!contextText || contextText.trim() === "") {
      return NextResponse.json({ error: "Missing context text" }, { status: 400 });
    }

    const config = await getAIConfig("tools");
    const groq = await getAIClient("tools");

    const prompt = `Book: ${title} by ${author}\n\nRecent Text Context:\n"${contextText}"`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      model: config.model,
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const resultStr = completion.choices[0]?.message?.content || "{}";
    const result = JSON.parse(resultStr);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Quiz Generation Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
