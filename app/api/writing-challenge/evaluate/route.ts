import { runAI } from "@/lib/ai/run";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { textId, textTitle, prompt, response, requiredVocab } = await req.json();

    if (!response || !prompt || !requiredVocab) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const systemPrompt = `You are an expert English teacher. The user has read a chapter from '${textTitle}'.
They were given this prompt: "${prompt}"
And asked to include these words: ${requiredVocab.join(", ")}

Their response:
"${response}"

Evaluate their response and return ONLY a raw JSON object (no markdown, no quotes) with this structure:
{
  "grammar_score": (0-100),
  "vocabulary_score": (0-100, based on usage of required words),
  "coherence_score": (0-100, how well it summarizes/answers the prompt),
  "feedback": "Short constructive feedback in Indonesian",
  "corrected_text": "The response with corrected grammar (if any)",
  "grammar_issues": ["list", "of", "original", "wrong", "words", "used"]
}`;


    const completion = await runAI("writing-evaluate", {
      messages: [
        { role: "system", content: "You are a helpful JSON-only API. Only output valid JSON." },
        { role: "user", content: systemPrompt }
      ],
      temperature: 0.1,
      max_tokens: 1500,
    }, { userId: user?.id });

    const evaluationJSON = completion.content || "{}";

    let scores;
    try {
      scores = JSON.parse(evaluationJSON.replace(/```json/g, "").replace(/```/g, "").trim());
    } catch (e) {
      console.error("Failed to parse evaluation JSON", evaluationJSON);
      return NextResponse.json({ error: "Failed to evaluate response" }, { status: 500 });
    }

    // Save to writing_submissions
    const { error: dbError } = await supabase.from("writing_submissions").insert({
      user_id: user.id,
      text_id: textId,
      prompt,
      response,
      scores: {
        grammar: scores.grammar_score,
        vocabulary: scores.vocabulary_score,
        coherence: scores.coherence_score,
        feedback: scores.feedback,
        corrected_text: scores.corrected_text
      }
    });

    if (dbError) {
      console.error("Failed to save submission", dbError);
    }

    // Phase 12: Personalized Error-Based Vocabulary Priority
    if (scores.grammar_issues && Array.isArray(scores.grammar_issues) && scores.grammar_issues.length > 0) {
      const originalWords = scores.grammar_issues.map((w: string) => w.toLowerCase());
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

    // Log Activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      action_type: `Completed Writing Challenge for ${textTitle}`
    });

    return NextResponse.json({ success: true, scores });
  } catch (error: any) {
    console.error("Writing Challenge Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
