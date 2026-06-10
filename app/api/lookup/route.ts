import { NextResponse } from "next/server";
import { getAIClient, getAIConfig, getRateLimit } from "@/lib/ai-config";


const MODES: Record<string, string> = {
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
  "phonetics": "Provide the exact IPA (International Phonetic Alphabet) pronunciation for this word in both American and British English. Explain any silent letters or tricky pronunciation rules in Indonesian."
};

export async function POST(req: Request) {
  try {
    const { word, contextSentence, title, author, mode = "dictionary" } = await req.json();

    if (!word || !MODES[mode]) {
      return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 });
    }

    let prompt = `Target Word/Phrase: "${word}"\nContext Sentence: "${contextSentence || 'No context provided'}"`;
    if (title && author) {
      prompt += `\nFrom: ${title} by ${author}`;
    }

    const config = await getAIConfig("tools");
    const groq = await getAIClient("tools");
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: MODES[mode] },
        { role: "user", content: prompt }
      ],
      model: config.model,
      temperature: config.temperature,
      max_tokens: config.max_tokens,
    });

    const result = completion.choices[0]?.message?.content || "";
    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("Lookup Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
