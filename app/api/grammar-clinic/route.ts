import { NextResponse } from "next/server";
import { getAIClient, getAIConfig } from "@/lib/ai-config";

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
    const { text } = await req.json();

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Teks tidak boleh kosong." }, { status: 400 });
    }

    const config = await getAIConfig("tools");
    const groq = await getAIClient("tools");

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text }
      ],
      model: config.model,
      temperature: 0.2,
      max_tokens: 2000,
    });

    const raw = completion.choices[0]?.message?.content || "{}";

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

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("Grammar Clinic Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
