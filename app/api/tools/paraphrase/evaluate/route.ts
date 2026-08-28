import { NextResponse } from "next/server";
import { getAIClient, getAIConfig, getRateLimit } from "@/lib/ai-config";
import { formatAITextResponse, withAITextOutputRules } from "@/lib/ai-output";



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

    const config = await getAIConfig("tools");
    const groq = await getAIClient("tools");
    const completion = await groq.chat.completions.create({
      messages: [{ role: "system", content: withAITextOutputRules(systemPrompt) }],
      model: config.model,
      temperature: config.temperature,
      max_tokens: config.max_tokens,
    });

    const result = formatAITextResponse(completion.choices[0]?.message?.content || "");
    return NextResponse.json({ result });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
