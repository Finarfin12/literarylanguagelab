import { NextResponse } from "next/server";
import { getAIClient, getAIConfig, getRateLimit } from "@/lib/ai-config";
import { formatAITextResponse, withAITextOutputRules } from "@/lib/ai-output";


const MODES: Record<string, string> = {
  "general": `You are an expert Literature Translation Evaluator. The user is an Indonesian university student studying English Literature. 
They will provide you with an Original Text (English) and their Translation (Indonesian).

Evaluate their translation critically based STRICTLY on these 4 metrics:
1. Akurasi makna (Accuracy of Meaning)
2. Nuansa yang hilang/dipertahankan (Preservation of Nuance/Imagery)
3. Register consistency (Is the level of formality and style consistent?)
4. Saran perbaikan konkret (Concrete suggestions)

Provide your entire evaluation in BOTH English and Indonesian. At the end, give a final score out of 10 ("SKOR AKHIR: X/10").
Use Markdown formatting.`,

  "equivalence": `You are a Translation Equivalence Checker. The user will provide Original Text (English) and Translation (Indonesian).
Evaluate the translation based on these 4 theoretical equivalence types:
1. Semantic Equivalence (Are the core meanings identical?)
2. Pragmatic Equivalence (Is the communicative function the same?)
3. Dynamic Equivalence (Does it produce the same effect on the target reader?)
4. Formal Equivalence (Is the grammatical structure and syntax preserved?)

Highlight problematic parts, give a score out of 10, and provide suggestions. Respond in BOTH English and Indonesian using Markdown.`,

  "register": `You are a Register Matcher. The user will provide Original Text (English) and Translation (Indonesian).
Your task:
1. Detect the register of the English text (e.g., archaic, formal, literary, neutral, colloquial).
2. Detect the register of the Indonesian translation.
3. Check for mismatches. If the original is formal but translation is casual, point it out!
4. Provide a corrected suggestion that matches the original register.

Respond in BOTH English and Indonesian using Markdown.`,

  "back_translation": `You are a Back-Translation Tester. The user will provide Original Text (English) and Translation (Indonesian).
Your task:
1. Back-translate the Indonesian text literally back into English. (Show this under "Back-Translation:")
2. Compare the Back-Translation with the Original Text.
3. Highlight differences in meaning, nuance, and tone. (e.g., "gazed" became "stared").
4. Provide suggestions to fix the Indonesian translation so the back-translation matches the original intent perfectly.

Respond in BOTH English and Indonesian using Markdown.`
};

export async function POST(req: Request) {
  try {
    const { originalText, translatedText, mode = "general" } = await req.json();

    if (!originalText || !translatedText || !MODES[mode]) {
      return NextResponse.json({ error: "Missing or invalid parameters" }, { status: 400 });
    }

    const prompt = `Original Text:\n"${originalText}"\n\nStudent Translation:\n"${translatedText}"`;

    const config = await getAIConfig("tools");
    const groq = await getAIClient("tools");
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: withAITextOutputRules(MODES[mode]) },
        { role: "user", content: prompt }
      ],
      model: config.model,
      temperature: config.temperature,
      max_tokens: config.max_tokens,
    });

    const result = formatAITextResponse(completion.choices[0]?.message?.content || "");
    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("Translation Eval Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
