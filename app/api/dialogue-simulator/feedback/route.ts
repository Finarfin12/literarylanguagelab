import { runAI } from "@/lib/ai/run";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const FEEDBACK_PROMPT = `You are an expert English language tutor analyzing a student's spoken English from a roleplay conversation. The student is an Indonesian learner.

Analyze ALL of the student's messages and provide structured feedback. Return ONLY valid JSON (no markdown fences).

Response format:
{
  "fluency_score": 75,
  "grammar_score": 80,
  "vocabulary_score": 70,
  "overall_feedback_id": "Ringkasan umpan balik dalam bahasa Indonesia yang mudah dipahami.",
  "corrections": [
    {
      "original": "I goed there",
      "corrected": "I went there",
      "explanation_id": "Penjelasan singkat dalam bahasa Indonesia."
    }
  ],
  "vocabulary_suggestions": [
    {
      "used": "good",
      "better": "excellent / outstanding",
      "context_id": "Konteks penggunaan dalam bahasa Indonesia."
    }
  ],
  "cultural_tip": "A brief cultural tip related to the scenario in Indonesian.",
  "strengths": ["Hal positif 1 dalam bahasa Indonesia", "Hal positif 2"]
}`;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { scenario, userMessages } = await req.json();

    if (!userMessages || userMessages.length === 0) {
      return NextResponse.json({ error: "Tidak ada pesan pengguna untuk dianalisis." }, { status: 400 });
    }


    const userText = userMessages.map((m: string, i: number) => `Message ${i + 1}: "${m}"`).join("\n");

    const completion = await runAI("dialogue-feedback", {
      messages: [
        { role: "system", content: FEEDBACK_PROMPT },
        { role: "user", content: `Scenario: ${scenario}\n\nStudent's messages:\n${userText}` },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }, { userId: user?.id });

    const raw = completion.content || "{}";

    let parsed;
    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        fluency_score: 0,
        grammar_score: 0,
        vocabulary_score: 0,
        overall_feedback_id: "Maaf, AI gagal menganalisis percakapan Anda. Silakan coba lagi.",
        corrections: [],
        vocabulary_suggestions: [],
        cultural_tip: "",
        strengths: [],
      };
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("Dialogue Feedback Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
