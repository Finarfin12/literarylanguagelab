import { NextResponse } from "next/server";
import { getAIClient, getAIConfig, getRateLimit } from "@/lib/ai-config";


export async function POST(req: Request) {
  try {
    const { word } = await req.json();

    if (!word) {
      return NextResponse.json({ error: "Word is required" }, { status: 400 });
    }

    const trimmedWord = word.trim().toLowerCase();

    // 1. Fetch Dictionary API
    let dictionaryData = null;
    try {
      const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(trimmedWord)}`);
      if (dictRes.ok) {
        dictionaryData = await dictRes.json();
      }
    } catch (e) {
      console.error("Dictionary API Error:", e);
    }

    // 2. Fetch Datamuse (Synonyms & Rhymes)
    let synonyms: string[] = [];
    let rhymes: string[] = [];
    try {
      const [synRes, rhyRes] = await Promise.all([
        fetch(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(trimmedWord)}&max=10`),
        fetch(`https://api.datamuse.com/words?rel_rhy=${encodeURIComponent(trimmedWord)}&max=10`)
      ]);
      
      if (synRes.ok) {
        const synData = await synRes.json();
        synonyms = synData.map((s: any) => s.word);
      }
      if (rhyRes.ok) {
        const rhyData = await rhyRes.json();
        rhymes = rhyData.map((r: any) => r.word);
      }
    } catch (e) {
      console.error("Datamuse API Error:", e);
    }

    // 3. Translation (LibreTranslate -> Fallback to Groq)
    let translation = "";
    try {
      const libreRes = await fetch("https://translate.argosopentech.com/translate", {
        method: "POST",
        body: JSON.stringify({
          q: trimmedWord,
          source: "en",
          target: "id",
          format: "text"
        }),
        headers: { "Content-Type": "application/json" }
      });

      if (libreRes.ok) {
        const libreData = await libreRes.json();
        translation = libreData.translatedText;
      } else {
        throw new Error("LibreTranslate failed or rate-limited");
      }
    } catch (libreError) {
      console.warn("Falling back to Groq for translation:", libreError);
      // Fallback to Groq
      try {
        const config = await getAIConfig("lookup");
        const groq = await getAIClient("lookup");
        const groqCompletion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: "You are a professional English to Indonesian translator. Translate the given English word/phrase into Indonesian. Provide only the direct translation, nothing else." },
            { role: "user", content: trimmedWord }
          ],
          model: config.model,
          temperature: config.temperature,
      max_tokens: config.max_tokens,
        });
        translation = groqCompletion.choices[0]?.message?.content?.trim() || "";
      } catch (groqError) {
        console.error("Groq translation failed:", groqError);
      }
    }

    return NextResponse.json({
      dictionary: dictionaryData,
      synonyms,
      rhymes,
      translation
    });

  } catch (error: any) {
    console.error("Lexicon Search Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
