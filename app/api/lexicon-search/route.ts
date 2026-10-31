import { runAI } from "@/lib/ai/run";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

// Pencarian kata memanggil layanan publik gratis (dictionaryapi.dev, Datamuse, LibreTranslate) yang kadang lambat,
// membatasi permintaan, atau mati. Setiap panggilan diberi batas waktu, dijalankan paralel, dan kegagalan dibedakan
// dari "kata tidak ada" supaya pengguna tidak salah mengira kata itu memang tidak ditemukan.
export const maxDuration = 30;

type FetchResult<T> = { status: "ok"; data: T } | { status: "not_found" } | { status: "unavailable" };

async function fetchJson<T>(url: string, init: RequestInit = {}, timeoutMs = 8000): Promise<FetchResult<T>> {
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
    if (res.status === 404) return { status: "not_found" };
    if (!res.ok) return { status: "unavailable" };
    return { status: "ok", data: (await res.json()) as T };
  } catch {
    return { status: "unavailable" };
  }
}

const POS_NAMES: Record<string, string> = { n: "noun", v: "verb", adj: "adjective", adv: "adverb", u: "" };

type DatamuseEntry = { word: string; defs?: string[] };

/** Susun entri bergaya dictionaryapi.dev dari definisi Datamuse (cadangan saat dictionaryapi.dev tidak tersedia). */
function fromDatamuse(word: string, entry: DatamuseEntry) {
  const byPos = new Map<string, { definition: string }[]>();
  for (const raw of entry.defs ?? []) {
    const [pos, ...rest] = raw.split("\t");
    const definition = rest.join("\t").trim();
    if (!definition) continue;
    const name = POS_NAMES[pos] ?? pos;
    byPos.set(name, [...(byPos.get(name) ?? []), { definition }]);
  }
  return [
    {
      word: entry.word || word,
      phonetic: "",
      phonetics: [],
      meanings: [...byPos.entries()].map(([partOfSpeech, definitions]) => ({ partOfSpeech, definitions, synonyms: [], antonyms: [] })),
      source: "datamuse",
    },
  ];
}

async function lookupDictionary(word: string) {
  const primary = await fetchJson<unknown[]>(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
  if (primary.status === "ok" && Array.isArray(primary.data) && primary.data.length > 0) {
    return { dictionary: primary.data, dictionaryStatus: "ok" as const };
  }

  // Cadangan: definisi dari Datamuse. 404 dari dictionaryapi.dev berarti kata tidak ada di sana, tetapi Datamuse
  // mungkin masih punya definisinya.
  const fallback = await fetchJson<DatamuseEntry[]>(`https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=d&max=1`);
  if (fallback.status === "ok") {
    const entry = fallback.data.find((e) => e.word.toLowerCase() === word && e.defs && e.defs.length > 0);
    if (entry) return { dictionary: fromDatamuse(word, entry), dictionaryStatus: "ok" as const };
    // Kedua layanan menjawab dan tidak ada yang tahu kata ini
    if (primary.status === "not_found") return { dictionary: null, dictionaryStatus: "not_found" as const };
  }
  // Tidak ada jawaban yang bisa dipercaya: layanan tidak tersedia (bukan "kata tidak ada")
  return { dictionary: null, dictionaryStatus: primary.status === "not_found" ? ("not_found" as const) : ("unavailable" as const) };
}

async function lookupRelated(word: string) {
  const [syn, rhy] = await Promise.all([
    fetchJson<DatamuseEntry[]>(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(word)}&max=10`),
    fetchJson<DatamuseEntry[]>(`https://api.datamuse.com/words?rel_rhy=${encodeURIComponent(word)}&max=10`),
  ]);
  return {
    synonyms: syn.status === "ok" ? syn.data.map((s) => s.word) : [],
    rhymes: rhy.status === "ok" ? rhy.data.map((r) => r.word) : [],
  };
}

async function lookupTranslation(word: string, userId: string) {
  // LibreTranslate publik sering membatasi/mati: batas waktu pendek lalu jatuh ke AI
  const libre = await fetchJson<{ translatedText?: string }>(
    "https://translate.argosopentech.com/translate",
    { method: "POST", body: JSON.stringify({ q: word, source: "en", target: "id", format: "text" }), headers: { "Content-Type": "application/json" } },
    4000
  );
  if (libre.status === "ok" && libre.data.translatedText) return libre.data.translatedText;

  try {
    const completion = await runAI("lexicon-translation", {
      messages: [
        { role: "system", content: "You are a professional English to Indonesian translator. Translate the given English word/phrase into Indonesian. Provide only the direct translation, nothing else." },
        { role: "user", content: word },
      ],
    }, { userId });
    return completion.content?.trim() || "";
  } catch (error) {
    console.error("AI translation failed:", error);
    return "";
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await requireUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const rateLimitRes = await checkRateLimit(user.id, "lexicon-search");
    if (rateLimitRes) {
      return rateLimitRes;
    }

    const { word } = await req.json();

    if (!word || typeof word !== "string") {
      return NextResponse.json({ error: "Word is required" }, { status: 400 });
    }

    const trimmedWord = word.trim().toLowerCase().slice(0, 60);

    // Tiga kelompok panggilan berjalan paralel (sebelumnya berurutan, total waktu = jumlah semuanya)
    const [dict, related, translation] = await Promise.all([
      lookupDictionary(trimmedWord),
      lookupRelated(trimmedWord),
      lookupTranslation(trimmedWord, user.id),
    ]);

    return NextResponse.json({
      dictionary: dict.dictionary,
      dictionaryStatus: dict.dictionaryStatus,
      synonyms: related.synonyms,
      rhymes: related.rhymes,
      translation,
    });
  } catch (error: unknown) {
    console.error("Lexicon Search Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
