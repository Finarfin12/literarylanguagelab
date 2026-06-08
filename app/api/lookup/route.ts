import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createClient } from "@/utils/supabase/server";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { word, contextSentence, title, author } = await req.json();

    if (!word || !contextSentence) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const prompt = `
Analyze the word/phrase "${word}" as used in this literary context:
"${contextSentence}"

From: ${title} by ${author}

Provide:
1. Definition in this specific context
2. Register (formal/literary/colloquial/archaic)
3. Why the author likely chose this word over simpler alternatives
4. One example of similar usage

Keep response concise and helpful for an intermediate English learner.
Respond in Indonesian.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 500,
    });

    const responseText = chatCompletion.choices[0]?.message?.content || "";

    return NextResponse.json({ result: responseText });
  } catch (error: any) {
    console.error("Groq API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
