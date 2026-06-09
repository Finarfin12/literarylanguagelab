// Example: Refactored app/api/lookup/route.ts untuk pakai config system

import { NextResponse } from "next/server";
import { getAIConfig, getAIClient } from "@/lib/ai-config";

const MODES: Record<string, string> = {
  "dictionary": "You are a literary dictionary. Provide the definition of the word/phrase, its grammatical register (e.g., formal, archaic, colloquial), and a brief explanation in Indonesian. Respond in Markdown format. Be concise.",
  "cultural": "You are 'Cultural Context Decoder'. Explain the cultural, historical, or mythological origins of the word/phrase. Give an example of its usage. Explain in Indonesian using Markdown.",
  "nuance": "You are 'Nuance Detector'. Explain the specific connotative 'flavor' of the word. Is it warm, cold, formal, casual, sharp, soft? Compare it to a similar synonym to highlight its unique nuance. Explain in Indonesian using Markdown.",
  "synonyms": "You are 'Literary Synonyms'. Provide up to 5 advanced or literary synonyms for this word/phrase. Explain briefly in what specific emotion or situation each synonym is best used. Explain in Indonesian using Markdown.",
  "literary-focus": "You are a Literary Language expert. Analyze the word/phrase provided in the literary context. Provide:\\n1. Definition in this specific context\\n2. Register (formal/literary/colloquial/archaic)\\n3. Why the author likely chose this word over simpler alternatives\\n4. One example of similar usage\\n\\nKeep response concise and helpful for an intermediate English learner. Provide all your explanations and results in BOTH English and Indonesian. Format nicely in Markdown."
};

export async function POST(req: Request) {
  try {
    const { word, contextSentence, title, author, mode = "dictionary" } = await req.json();

    if (!word || !MODES[mode]) {
      return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 });
    }

    // Get AI config dari database
    const config = await getAIConfig('lookup');
    
    // Get AI client berdasarkan provider
    const client = await getAIClient('lookup');

    let prompt = `Target Word/Phrase: "${word}"\\nContext Sentence: "${contextSentence || 'No context provided'}"`;
    if (title && author) {
      prompt += `\\nFrom: ${title} by ${author}`;
    }

    // Provider-aware completion call
    let result = "";
    
    if (config.provider === 'groq') {
      const completion = await client.chat.completions.create({
        messages: [
          { role: "system", content: MODES[mode] },
          { role: "user", content: prompt }
        ],
        model: config.model,
        temperature: config.temperature,
        max_tokens: config.max_tokens,
      });
      result = completion.choices[0]?.message?.content || "";
    } 
    else if (config.provider === 'openai') {
      const completion = await client.chat.completions.create({
        messages: [
          { role: "system", content: MODES[mode] },
          { role: "user", content: prompt }
        ],
        model: config.model,
        temperature: config.temperature,
        max_tokens: config.max_tokens,
      });
      result = completion.choices[0]?.message?.content || "";
    }
    else if (config.provider === 'anthropic') {
      const completion = await client.messages.create({
        model: config.model,
        max_tokens: config.max_tokens,
        temperature: config.temperature,
        messages: [
          { role: "user", content: `${MODES[mode]}\\n\\n${prompt}` }
        ],
      });
      result = completion.content[0]?.text || "";
    }

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("Lookup Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
