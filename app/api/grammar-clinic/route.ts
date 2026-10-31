import { runAI } from "@/lib/ai/run";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const SYSTEM_PROMPT = `You are an expert English grammar tutor for Indonesian learners. The user will give you a piece of English text (could be an email, chat message, essay, or any text). Your job is to:

1. Identify ALL grammar, spelling, punctuation, and word-choice mistakes.
2. For each mistake, explain WHY it is wrong in simple Indonesian (Bahasa Indonesia).
3. Provide the corrected version.
4. Give an overall grammar score from 0-100.

IMPORTANT: You MUST respond with ONLY valid JSON. No markdown, no code fences, JUST the raw JSON object.

Response format:
{
  "score": 78,
  "corrections": [
    {
      "original": "the wrong phrase",
      "corrected": "the corrected phrase",
      "category": "Tense|Subject-Verb Agreement|Article|Preposition|Spelling|Punctuation|Word Choice|Plural/Singular|Run-on Sentence|Fragment",
      "explanation_id": "Penjelasan dalam bahasa Indonesia yang sederhana dan ramah, mengapa ini salah.",
      "explanation_en": "Brief English explanation."
    }
  ],
  "corrected_text": "The full corrected version of the text.",
  "tips": ["Satu atau dua tips umum dalam bahasa Indonesia untuk meningkatkan grammar pengguna."]
}

If the text has no errors, return score 100 with empty corrections array. Always be encouraging and supportive.`;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text } = await req.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Teks tidak boleh kosong." }, { status: 400 });
    }


    const completion = await runAI("grammar-clinic", {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text }
      ],
      temperature: 0.2,
      max_tokens: 2000,
    }, { userId: user?.id });

    const raw = completion.content || "{}";

    // Try to parse JSON — handle cases where AI wraps in ```json
    let parsed;
    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback if AI doesn't return valid JSON
      parsed = {
        score: 0,
        corrections: [],
        corrected_text: text,
        tips: ["Maaf, AI gagal menganalisis teks ini. Silakan coba lagi."],
        raw_response: raw
      };
    }

    // Save session to Supabase
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user && parsed.corrections) {
        // Extract unique categories
        const categories = Array.from(new Set(parsed.corrections.map((c: any) => c.category).filter(Boolean)));
        
        await supabase.from("grammar_sessions").insert({
          user_id: user.id,
          original_text: text,
          corrected_text: parsed.corrected_text || text,
          score: parsed.score || 0,
          corrections: parsed.corrections,
          error_categories: categories
        });

        // Phase 12: Personalized Error-Based Vocabulary Priority
        if (parsed.corrections && parsed.corrections.length > 0) {
          const originalWords = parsed.corrections.map((c: any) => (c.original || "").toLowerCase().split(/\W+/)).flat().filter(Boolean);
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
    } catch (dbError) {
      console.error("Failed to save grammar session:", dbError);
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("Grammar Clinic Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
