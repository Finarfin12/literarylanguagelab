import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODES: Record<string, string> = {
  "dictionary": "You are a literary dictionary. Provide the definition of the word/phrase, its grammatical register, and a brief explanation in Indonesian.",
  "translate": "You are a translator. Provide the most accurate translation of this word/phrase in Indonesian, considering the context sentence if provided.",
  "rhyme": "Provide a list of 5-10 words that rhyme with the target word. Then, provide a short 2-line poetic couplet using the target word. Respond in Indonesian (except for the English rhymes).",
  "quote": "Provide 1 famous literary quote that uses the target word. Include the author and book name. Explain the meaning of the quote briefly in Indonesian.",
  "lyricism": "Analyze the lyricism and phonetic sound of the word. Is it euphonious or cacophonous? What consonants/vowels give it that sound? Respond in Indonesian.",
  "metaphors": "Provide 3 original metaphors that use or describe the target word. Explain the imagery behind each metaphor in Indonesian.",
  "etymology": "Explain the etymology (origin) of the word. What Latin/Greek/Old English roots does it come from? How did the meaning evolve? Respond in Indonesian.",
  "time-traveler": "Explain how the meaning or usage of this word has changed across different literary eras (e.g., Renaissance, Victorian, Modern). Respond in Indonesian.",
  "semantic-map": "Provide a JSON object representing a semantic network graph for this word. The JSON must have the format: { \"nodes\": [{\"id\": \"word\", \"label\": \"Word\", \"group\": 1}], \"edges\": [{\"from\": \"word1\", \"to\": \"word2\", \"label\": \"relation\"}] }. ONLY output valid JSON.",
  "cultural": "Explain the cultural, historical, or mythological origins of the word/phrase. Give an example of its usage. Explain in Indonesian.",
  "nuance": "Explain the specific connotative 'flavor' of the word. Is it warm, cold, formal, casual? Compare it to a similar synonym to highlight its unique nuance. Explain in Indonesian.",
  "synonyms": "Provide up to 5 advanced or literary synonyms for this word/phrase. Explain briefly in what specific emotion or situation each synonym is best used. Explain in Indonesian."
};

export async function POST(req: Request) {
  try {
    const { word, contextSentence, mode = "dictionary" } = await req.json();

    if (!word || !MODES[mode]) {
      return NextResponse.json({ error: "Invalid request parameters" }, { status: 400 });
    }

    const prompt = `Target Word/Phrase: "${word}"\nContext Sentence: "${contextSentence || 'No context provided'}"`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: MODES[mode] + (mode !== "semantic-map" ? " Respond using Markdown formatting." : "") },
        { role: "user", content: prompt }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: mode === "semantic-map" ? 0.1 : 0.4,
      max_tokens: 1500,
    });

    const result = completion.choices[0]?.message?.content || "";
    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("Lookup Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
