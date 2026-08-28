import { NextResponse } from "next/server";
import { getAIClient, getAIConfig, getRateLimit } from "@/lib/ai-config";
import { formatAITextResponse, withAITextOutputRules } from "@/lib/ai-output";
import { createClient } from "@/utils/supabase/server";const MODES: Record<string, string> = {
  "dictionary": "You are a literary dictionary. Provide the definition of the word/phrase, its grammatical register (e.g., formal, archaic, colloquial), and a brief explanation in Indonesian. Respond in Markdown format. Be concise.",
  "cultural": "You are 'Cultural Context Decoder'. Explain the cultural, historical, or mythological origins of the word/phrase. Give an example of its usage. Explain in Indonesian using Markdown.",
  "nuance": "You are 'Nuance Detector'. Explain the specific connotative 'flavor' of the word. Is it warm, cold, formal, casual, sharp, soft? Compare it to a similar synonym to highlight its unique nuance. Explain in Indonesian using Markdown.",
  "synonyms": "You are 'Literary Synonyms'. Provide up to 5 advanced or literary synonyms for this word/phrase. Explain briefly in what specific emotion or situation each synonym is best used. Explain in Indonesian using Markdown.",
  "literary-focus": "You are a Literary Language expert. Analyze the word/phrase provided in the literary context. Provide:\n1. Definition in this specific context\n2. Register (formal/literary/colloquial/archaic)\n3. Why the author likely chose this word over simpler alternatives\n4. One example of similar usage\n\nKeep response concise and helpful for an intermediate English learner. Provide all your explanations and results in BOTH English and Indonesian. Format nicely in Markdown.",
  "translate": "You are a translator. Translate the word/phrase contextually into Indonesian. Provide the literal translation and the contextual translation based on the sentence.",
  "etymology": "You are an Etymologist. Explain the historical origin and root (Latin, Greek, Old English, etc.) of the word/phrase in Indonesian.",
  "lyricism": "You are a Poetry Expert. Analyze the phonetic sounds (alliteration, assonance, consonance) and rhythmic qualities of the word/phrase. Explain in Indonesian.",
  "metaphors": "You are a Literary Critic. Explain any hidden metaphors, symbolisms, or deeper thematic meanings of this word in the context of classic literature. Explain in Indonesian.",
  "quote": "Find 1 or 2 famous quotes from classic literature (other than the current context) that beautifully use this word/phrase. Explain the quote briefly in Indonesian.",
  "time-traveler": "Explain how the meaning or usage of this word has evolved from the 16th/18th century to modern times. Explain in Indonesian.",
  "rhyme": "Provide a list of words that rhyme perfectly or near-perfectly with this word. Group them by syllable count. Explain in Indonesian.",
  "semantic-map": "Return ONLY a JSON object representing a semantic network for this word. Format: {\"nodes\": [{\"id\": \"word\", \"group\": 1}], \"links\": [{\"source\": \"word\", \"target\": \"related_word\", \"value\": 1}]}. No explanations, just valid JSON.",
  "grammar": "You are a Grammar Instructor. Analyze the exact grammatical function of the word/phrase in the provided sentence. Explain its part of speech, tense, syntactic role, and provide a mini grammar lesson based on this usage. Explain in Indonesian.",
  "phonetics": "Provide the exact IPA (International Phonetic Alphabet) pronunciation for this word in both American and British English. Explain any silent letters or tricky pronunciation rules in Indonesian.",
  "sentence-translation": "You are an expert literary translator. Translate the provided sentence contextually into Indonesian. Provide the literal translation first, then a beautifully flowing contextual translation that captures the author's intended mood and style. Explain briefly why you chose certain words for the contextual translation.",
  "sentence-grammar": "You are a Master Grammarian. Break down the syntax of the provided sentence. Identify the main Subject, Verb, and Object. Explain any complex clauses, archaic grammatical structures, or unusual word orders used by the author. Explain clearly in Indonesian using Markdown.",
  "sentence-idioms": "You are a Literary Detective. Analyze the provided sentence to identify any idioms, figures of speech (metaphors, similes, personification), or historical/cultural references. Explain what they mean and how they contribute to the sentence's overall impact. Explain in Indonesian.",
  "pictionary": "You are a visual translator. Return exactly ONE emoji that best represents the word/phrase. Do NOT return any text, only the emoji. For example, if the word is 'sword', return ⚔️. If the word is 'sadness', return 😢.",
  "simplify": "You are a Graded Reader engine. Rewrite the provided sentence or paragraph into simple, modern English suitable for a B1 CEFR learner. Remove archaic words, simplify complex clauses, and make it easy to understand. Also, provide a very brief explanation in Indonesian of what changed.",
  "collocations": "You are a Lexical Expert. For the given word, provide 3 to 5 common literary or natural collocations (word partnerships) that frequently appear in English literature. Format your response STRICTLY as a JSON array of strings. Example: [\"bitter cold\", \"cast a spell\", \"deep gloom\"]. Do not include any markdown formatting, markdown blocks, or explanations."
};

const RAW_OUTPUT_MODES = new Set(["semantic-map", "collocations", "pictionary"]);

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { word, contextSentence, title, author, mode = "dictionary", dictionaryPrefs } = await req.json();

    if (!word || !MODES[mode]) {
      return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 });
    }

    let prompt = `Target Word/Phrase: "${word}"\nContext Sentence: "${contextSentence || 'No context provided'}"`;
    if (title && author) {
      prompt += `\nFrom: ${title} by ${author}`;
    }

    const config = await getAIConfig("tools");
    const groq = await getAIClient("tools");

    // Dynamic prompt adjustments based on dictionaryPrefs
    const shouldFormatText = !RAW_OUTPUT_MODES.has(mode);
    let systemContent = shouldFormatText ? withAITextOutputRules(MODES[mode]) : MODES[mode];
    if (dictionaryPrefs) {
      const targetLang = dictionaryPrefs.def_language === "en" ? "English" : "Indonesian";
      if (mode === "dictionary" || mode === "literary-focus") {
        let rules = `\n\nIMPORTANT PREFERENCES:\n- Explain definitions and meanings primarily in ${targetLang}.`;
        if (dictionaryPrefs.show_register) rules += "\n- Please explicitly mention the grammatical/literary register (e.g. archaic, formal, slang).";
        if (dictionaryPrefs.show_etymology) rules += "\n- Include a brief etymology or origin of the word.";
        systemContent += rules;
      }
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: prompt }
      ],
      model: config.model,
      temperature: config.temperature,
      max_tokens: config.max_tokens,
    });

    const rawResult = completion.choices[0]?.message?.content || "";
    const result = shouldFormatText ? formatAITextResponse(rawResult) : rawResult;

    // LOG ACTIVITY
    try {
      const { createClient } = await import("@/utils/supabase/server");
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("activity_logs").insert({
          user_id: user.id,
          action_type: `Word Lookup: ${mode}`,
        });
      }
    } catch (logError) {
      console.error("Failed to log activity:", logError);
    }

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("Lookup Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
