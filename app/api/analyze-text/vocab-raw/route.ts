import { runAI } from "@/lib/ai/run";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const { text, maxWords = 10 } = await req.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!text || text.length < 50) {
      return NextResponse.json({ error: "Text too short for analysis" }, { status: 400 });
    }

    // Truncate to ~10000 chars to avoid overwhelming the LLM
    const textSample = text.substring(0, 10000);


    const prompt = `You are an expert English language teacher. Analyze the following literary text and extract exactly ${maxWords} advanced or interesting vocabulary words that a B1-C1 level English learner should know before reading the text.
For each word, provide:
1. "word": the exact word as it appears in the text.
2. "definition": a brief definition in Indonesian.
3. "example": the sentence or phrase from the text where the word is used.

Respond ONLY with valid JSON in this format:
{
  "vocab": [
    { "word": "melancholy", "definition": "perasaan sedih tanpa sebab yang jelas", "example": "A deep melancholy settled over the house." }
  ]
}

Text:
"""
${textSample}
"""`;

    const completion = await runAI("vocab-analysis", {
      messages: [
        { role: "system", content: "You are a helpful JSON-only API. Only output valid JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    }, { userId: user?.id });

    const raw = completion.content || "{}";
    let parsed;
    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
      
      if (!parsed.vocab || !Array.isArray(parsed.vocab)) {
         throw new Error("Invalid format");
      }
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    return NextResponse.json({ vocab: parsed.vocab });
  } catch (error: any) {
    console.error("Raw Vocab Extraction Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
