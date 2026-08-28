import { NextResponse } from "next/server";
import { getAIClient, getAIConfig, getRateLimit } from "@/lib/ai-config";
import { formatAITextResponse, withAITextOutputRules } from "@/lib/ai-output";


export async function POST(req: Request) {
  try {
    const { text, targetTone } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const sample = text.slice(0, 3000);
    const effectiveTarget = targetTone || "Akademis Profesional";

    const prompt = `Text:\n"${sample}"\n\nTarget Tone: ${effectiveTarget}\n\nTask:

## TONE DETECTION
1. Classify the CURRENT tone (neutral/formal/sarcastic/ironic/humorous/melancholic/dramatic/romantic/ominous/urgent)
2. Identify 2-3 linguistic markers (word choices, syntax, punctuation) that indicate this tone
3. Explain how to preserve this tone when translating to Indonesian with specific examples

## TONE TRANSFORMATION
4. Estimate the CEFR reading level (A1-C2) of the original text
5. Rewrite the text to perfectly match the Target Tone
6. Provide a 'Before & After' comparison
7. Explain the grammar/diction choices made for the transformation

Respond entirely in Indonesian (except tone classification label, linguistic markers, and English text quotes which stay in English) using HIGHLY STRUCTURED Markdown (must use ## Headers, bullet points, bold text, and ⚠️ warnings where literal translation would fail). English text quotes in italic or blockquotes.`;

    const config = await getAIConfig("tools");
    const groq = await getAIClient("tools");
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: withAITextOutputRules("You are a literary tone analyst and transformation expert. You help Indonesian students of English Literature understand tone nuances and rewrite texts for different audiences.") },
        { role: "user", content: prompt }
      ],
      model: config.model,
      temperature: config.temperature,
      max_tokens: config.max_tokens,
    });

    const result = formatAITextResponse(completion.choices[0]?.message?.content || "");
    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("Tone Analyzer Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
