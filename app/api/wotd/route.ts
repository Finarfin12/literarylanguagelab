import { runAI } from "@/lib/ai/run";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Pick a random word from the user's vocabulary
    const { data: vocabWords } = await supabase
      .from('vocabulary')
      .select('word, context_sentence, definition')
      .eq('user_id', user.id)
      .limit(50); // Get a pool of 50 words

    let wordToTeach = "serendipity"; // Fallback
    let context = "";
    
    if (vocabWords && vocabWords.length > 0) {
      const randomIdx = Math.floor(Math.random() * vocabWords.length);
      wordToTeach = vocabWords[randomIdx].word;
      context = vocabWords[randomIdx].context_sentence || vocabWords[randomIdx].definition;
    }


    const prompt = `You are a lively English tutor. The "Word of the Day" for the user is "${wordToTeach}".
Context/Definition: "${context}"

Generate a short, engaging mini-lesson (in Indonesian) and a quick quiz.
Include:
1. Meaning (Arti)
2. Common Collocations (Kata yang sering dipasangkan, max 3)
3. A 1-question multiple choice quiz testing the meaning or usage of the word.

Respond ONLY with valid JSON.
Format:
{
  "word": "${wordToTeach}",
  "lesson": "Explanation...",
  "collocations": ["collocation 1", "collocation 2"],
  "quiz": {
    "question": "Quiz question here...",
    "options": ["A", "B", "C", "D"],
    "answer": 0 // index of the correct option
  }
}`;

    const completion = await runAI("wotd", {
      messages: [
        { role: "system", content: "You are a helpful JSON-only API. Only output valid JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1000,
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
  } catch (error: any) {
    console.error("WOTD Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
