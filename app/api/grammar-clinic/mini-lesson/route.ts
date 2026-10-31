import { runAI } from "@/lib/ai/run";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { getUserCefr } from "@/lib/user-level";
import { explanationInstruction } from "@/lib/cefr";

export async function POST(req: Request) {
  try {
    const authResult = await requireUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const rateLimitRes = await checkRateLimit(user.id, "grammar-clinic");
    if (rateLimitRes) {
      return rateLimitRes;
    }

    const { category, percentage, examples, topic, summary } = await req.json();
    const levelRule = explanationInstruction(await getUserCefr(authResult.supabase, user.id));

    // Mode topik (Grammar Dasar): pelajaran dari topik kurikulum, bukan dari daftar kesalahan pengguna
    if (typeof topic === "string" && topic.trim()) {
      const topicName = topic.trim().slice(0, 100);
      const topicPrompt = `Teach the English grammar topic "${topicName}" to an Indonesian learner.${summary ? ` Reference summary (Indonesian): ${String(summary).slice(0, 600)}` : ""}
${levelRule}

Return ONLY valid JSON:
{
  "title": "Mini-Lesson: ${topicName}",
  "lesson_text": "A clear explanation with the key rule, 2-3 common mistakes Indonesian speakers make, and a memory tip. Use short paragraphs.",
  "quiz": [
    { "sentence": "She ____ to school every day.", "answer": "goes", "options": ["go", "goes", "going"] }
  ]
}
The quiz must have exactly 5 fill-in-the-blank items about this topic with 3 options each; "answer" must be one of the options. Use simple, everyday sentences.`;

      const topicCompletion = await runAI("grammar-mini-lesson", {
        messages: [
          { role: "system", content: "You are a helpful JSON-only API. Only output valid JSON." },
          { role: "user", content: topicPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }, { userId: user?.id });

      try {
        const cleaned = (topicCompletion.content || "{}").replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        return NextResponse.json(JSON.parse(cleaned));
      } catch {
        return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
      }
    }

    if (!category) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }


    const prompt = `You are a strict but encouraging Grammar Tutor. 
The user is struggling with the grammar category: "${category}". 
This error makes up ${percentage}% of their recent mistakes.${levelRule ? `\n${levelRule}` : ""}

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

    const completion = await runAI("grammar-mini-lesson", {
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
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error("Mini Lesson Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
