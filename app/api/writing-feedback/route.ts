import { NextResponse } from "next/server";
import { getAIClient, getAIConfig } from "@/lib/ai-config";
import { createClient } from "@/utils/supabase/server";

const SYSTEM_PROMPT = `You are an expert English academic writing tutor.
You will receive an essay or text written by a non-native speaker.
Your task is to analyze the text and return a strictly formatted JSON object with detailed feedback.
Do NOT wrap the JSON in markdown blocks. Return ONLY valid JSON.

The JSON MUST follow this exact schema:
{
  "overall_score": 85, // 0-100 integer
  "grammar_corrections": [
    {
      "original": "The data show that...",
      "correction": "The data shows that...",
      "explanation": "Explanation of the grammar rule in Indonesian."
    }
  ],
  "register_analysis": [
    {
      "original": "This is a really big problem.",
      "suggestion": "This represents a significant challenge.",
      "explanation": "Explanation of why the suggestion is more academic in Indonesian."
    }
  ],
  "synonym_upgrades": [
    {
      "word": "good",
      "better_words": ["excellent", "profound", "favorable"],
      "context": "Suggesting stronger adjectives for academic context."
    }
  ],
  "sentence_variety": [
    {
      "feedback": "Your sentences are too short.",
      "example_revision": "Instead of A. B., try combining them: A, which leads to B."
    }
  ]
}

Provide all explanations and feedback in Indonesian, but keep the original and corrected texts in English.
`;

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || text.trim() === "") {
      return NextResponse.json({ error: "Missing text to analyze" }, { status: 400 });
    }

    const config = await getAIConfig("tools");
    const groq = await getAIClient("tools");
    
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Analyze this text:\n\n${text}` }
      ],
      model: config.model,
      temperature: 0.2, // Low temperature for deterministic JSON structure
      response_format: { type: "json_object" },
    });

    const resultText = completion.choices[0]?.message?.content || "{}";
    
    let parsedResult;
    try {
      parsedResult = JSON.parse(resultText);
    } catch (e) {
      console.error("Failed to parse JSON from AI:", resultText);
      return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 500 });
    }

    // LOG ACTIVITY
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("activity_logs").insert({
          user_id: user.id,
          action_type: `Tool Used: AI Writing Assistant`,
        });

        // Phase 12: Personalized Error-Based Vocabulary Priority
        if (parsedResult.grammar_corrections && Array.isArray(parsedResult.grammar_corrections) && parsedResult.grammar_corrections.length > 0) {
          const originalWords = parsedResult.grammar_corrections.map((c: any) => (c.original || "").toLowerCase().split(/\W+/)).flat().filter(Boolean);
          const { data: userVocab } = await supabase.from('vocabulary').select('id, word').eq('user_id', user.id);
          
          if (userVocab && userVocab.length > 0) {
            const errorVocabIds = userVocab
              .filter(v => originalWords.includes(v.word.toLowerCase()))
              .map(v => v.id);
            
            if (errorVocabIds.length > 0) {
              await supabase.from('vocabulary')
                .update({ error_modifier: 0.7, consecutive_correct: 0 })
                .in('id', errorVocabIds);
            }
          }
        }
      }
    } catch (logError) {
      console.error("Failed to log activity:", logError);
    }

    return NextResponse.json(parsedResult);
  } catch (error: any) {
    console.error("Writing Feedback Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
