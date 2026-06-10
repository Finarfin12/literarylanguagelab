import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getAIClient, getAIConfig, getRateLimit } from "@/lib/ai-config";


export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: session } = await supabase.auth.getSession();
    
    const { data: vocabData, error: vocabError } = await supabase
      .from('vocabulary')
      .select('word')
      // .eq('user_id', session.session?.user.id) // Optional if RLS is on
      .limit(30);

    if (vocabError || !vocabData || vocabData.length < 5) {
      return NextResponse.json({ error: "Anda butuh minimal 5 kata di Vocabulary Bank untuk memainkan Story Mode Quiz." }, { status: 400 });
    }

    // Shuffle and pick 5 words
    const words = vocabData.sort(() => 0.5 - Math.random()).slice(0, 5).map(v => v.word);
    
    const { genre } = await req.json();

    const systemPrompt = `You are a literature quiz generator. 
Using these 5 exact vocabulary words: [${words.join(", ")}], generate a very short, engaging story (max 200 words) in the genre of ${genre || "Mystery"}.
The 5 vocabulary words MUST be used in the story naturally.
Then, generate exactly 5 multiple choice questions testing the contextual meaning of those 5 words based on how they were used in the story.
You MUST output ONLY a valid JSON object matching this exact structure:
{
  "story": "The story text here...",
  "questions": [
    {
      "word": "target_word",
      "question": "What does the word 'target_word' most likely mean in this context?",
      "options": ["A option", "B option", "C option", "D option"],
      "correctAnswerIndex": 0,
      "explanation": "Short explanation in Indonesian."
    }
  ]
}`;

    const config = await getAIConfig("tools");
    const groq = await getAIClient("tools");
    const completion = await groq.chat.completions.create({
      messages: [{ role: "system", content: systemPrompt }],
      model: config.model,
      temperature: config.temperature,
      max_tokens: config.max_tokens,
    });

    const result = completion.choices[0]?.message?.content || "";
    const start = result.indexOf('{');
    const end = result.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error("Invalid JSON format from AI");
    
    const parsed = JSON.parse(result.substring(start, end + 1));
    return NextResponse.json({ ...parsed, words });
  } catch (error: any) {
    console.error("Story Quiz Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
