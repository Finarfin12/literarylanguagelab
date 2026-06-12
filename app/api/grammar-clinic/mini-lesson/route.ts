import { NextResponse } from "next/server";
import { getAIClient, getAIConfig } from "@/lib/ai-config";

export async function POST(req: Request) {
  try {
    const { category, percentage, examples } = await req.json();

    if (!category) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }

    const config = await getAIConfig("tools");
    const groq = await getAIClient("tools");

    const prompt = `You are a strict but encouraging Grammar Tutor. 
The user is struggling with the grammar category: "${category}". 
This error makes up ${percentage}% of their recent mistakes.

Here are some real examples of their mistakes in this category:
${examples.map((ex: any) => `- Wrote: "${ex.original}" | Should be: "${ex.corrected}"`).join("\n")}

Your task is to generate a JSON response containing a short mini-lesson and a 5-question fill-in-the-blank quiz (rumpang) targeting this specific weakness. Use classic English literature style for the quiz sentences.

IMPORTANT: Respond ONLY with valid JSON. No markdown wrapper, no extra text.

JSON format:
{
  "title": "Mini-Lesson: [Category Name]",
  "lesson_text": "A brief explanation in Indonesian of how to use this grammar rule correctly, citing their mistakes as learning points.",
  "quiz": [
    {
      "sentence": "The ____ fell heavily upon the old castle.",
      "answer": "rain",
      "options": ["rain", "rains", "rained"]
    }
  ]
}
`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful JSON-only API. Only output valid JSON." },
        { role: "user", content: prompt }
      ],
      model: config.model,
      temperature: 0.3,
      max_tokens: 1500,
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    let parsed;
    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("Mini Lesson Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
