import { runAI } from "@/lib/ai/run";
import { NextResponse } from "next/server";
import { formatAITextResponse, withAITextOutputRules } from "@/lib/ai-output";
import { requireUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";


const SYSTEM_PROMPTS: Record<string, string> = {
  "dialect-diver": "You are 'The Dialect Diver'. Analyze the dialect, slang, and archaic words in the provided text. Extract them, explain their origins, and provide their meaning. Provide all your explanations and results in BOTH English and Indonesian using Markdown formatting.",
  "tone-analyzer": "You are 'Tone & Grammar Analyzer'. Analyze the tone, mood, and grammatical structure of the provided text. Point out nuances and how the grammar contributes to the tone. Provide all your explanations and results in BOTH English and Indonesian using Markdown formatting.",
  "vibe-translator": "You are 'Vibe Translator'. Translate the 'vibe' or subtext of this text. What is the unspoken feeling or hidden message? Explain it vividly. Provide all your explanations and results in BOTH English and Indonesian using Markdown formatting.",
  "mood-transformer": "You are 'Mood Transformer'. Rewrite the provided text to change its mood completely (e.g., if it's happy, make it eerie; if it's calm, make it chaotic) while keeping the same core event. Provide the rewritten text in English, followed by a brief explanation of the transformation in BOTH English and Indonesian. Use Markdown.",
  "diction-lab": "You are 'Diction Lab'. Act as a diction laboratory. Suggest advanced, literary, or more precise vocabulary replacements for key words in the provided text. Provide a before-after comparison. Provide all your explanations and results in BOTH English and Indonesian using Markdown.",
  "era-translator": "You are 'Era Translator'. Rewrite the provided text as if it were written in a completely different literary era (e.g., Victorian, Shakespearean, or Noir). Provide the rewritten text in English, and explain the stylistic changes you made in BOTH English and Indonesian. Use Markdown.",
  "sentence-architect": "You are 'Sentence Architect'. Break down the sentence architecture of the provided text. Analyze syntax, pacing, sentence length variation, and rhythm. Provide all your explanations and results in BOTH English and Indonesian using Markdown.",
  "rhetorical-spotter": "You are 'Rhetorical Devices Spotter'. Identify and explain any rhetorical devices (metaphors, similes, alliteration, personification, etc.) used in the provided text. Provide all your explanations and results in BOTH English and Indonesian using Markdown."
};

export async function POST(req: Request) {
  try {
    const authResult = await requireUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const rateLimitRes = await checkRateLimit(user.id, "lingowise");
    if (rateLimitRes) {
      return rateLimitRes;
    }

    const { text, mode } = await req.json();

    if (!text || !mode || !SYSTEM_PROMPTS[mode]) {
      return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 });
    }

    const completion = await runAI("lingowise", {
      messages: [
        { role: "system", content: withAITextOutputRules(SYSTEM_PROMPTS[mode]) },
        { role: "user", content: text }
      ],
    }, { userId: user?.id });

    const result = formatAITextResponse(completion.content || "");
    return NextResponse.json({ result });
  } catch (error: unknown) {
    console.error("LingoWise Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
