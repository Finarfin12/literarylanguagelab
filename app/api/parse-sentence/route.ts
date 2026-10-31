import { runAI } from "@/lib/ai/run";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const SYSTEM_PROMPT = `You are an expert linguistics parser. 
You will be provided with a long, complex English sentence.
Your task is to parse the grammatical anatomy of this sentence into a strictly formatted JSON object.
Do NOT wrap the JSON in markdown blocks (like \`\`\`json). Return ONLY valid JSON.

The JSON MUST follow this exact schema:
{
  "sentence": "The original sentence",
  "tree": [
    {
      "type": "Main Clause",
      "text": "The text of the clause",
      "children": [
        { "type": "Subject", "text": "The woman" },
        { "type": "Verb", "text": "decided" },
        { "type": "Object", "text": "to leave" },
        { "type": "Modifier", "text": "finally" }
      ]
    },
    {
      "type": "Relative Clause",
      "text": "who had been waiting for hours...",
      "children": [
        { "type": "Subject", "text": "who" },
        { "type": "Verb", "text": "had been waiting" },
        { "type": "Modifier", "text": "for hours in the rain without an umbrella" }
      ]
    }
  ],
  "translation_strategies": [
    {
      "name": "Keep Structure",
      "indonesian": "...",
      "explanation": "Explain why maintaining the structure works or feels clunky."
    },
    {
      "name": "Split Sentences",
      "indonesian": "...",
      "explanation": "Explain how splitting the clauses makes it more natural in Indonesian."
    }
  ],
  "anatomy_explanation": "A concise explanation (in Indonesian) of how the grammatical structure of this sentence works to convey its meaning."
}

Break the sentence into logical clauses (Main Clause, Relative Clause, Subordinate Clause, etc.).
For each clause, identify the core components (Subject, Verb, Object, Modifier, Conjunction).
Provide exactly two translation strategies: "Keep Structure" and "Split Sentences".
Finally, provide a clear, concise 'anatomy_explanation' in Indonesian explaining how the grammar functions.
`;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text } = await req.json();

    if (!text || text.trim() === "") {
      return NextResponse.json({ error: "Missing sentence text" }, { status: 400 });
    }

    
    const completion = await runAI("parse-sentence", {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Parse this sentence:\n\n${text}` }
      ],
      temperature: 0.1, // Low temperature for deterministic JSON structure
      response_format: { type: "json_object" },
    }, { userId: user?.id });

    const resultText = completion.content || "{}";
    
    // Parse to ensure it's valid JSON
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
          action_type: `Tool Used: Sentence Architect`,
        });
      }
    } catch (logError) {
      console.error("Failed to log activity:", logError);
    }

    return NextResponse.json(parsedResult);
  } catch (error: any) {
    console.error("Sentence Parser Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
