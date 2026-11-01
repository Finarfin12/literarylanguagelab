import { runAI } from "@/lib/ai/run";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { extractJsonObject } from "@/lib/ai/json";
import { FALLBACK_WORDS, pickWordOfTheDay, validateWotd, type WotdCandidate } from "@/lib/wotd";

// Mini-lesson + kuis 1 soal untuk Word of the Day. Dipanggil hanya saat pengguna menekan "Pelajari" (bukan saat halaman dibuka).
// Kata deterministik per pengguna per hari: kosakata pengguna → core_words A1–A2 (bila tabel ada) → daftar cadangan.
export async function GET() {
  try {
    const authResult = await requireUser();
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const rateLimitRes = await checkRateLimit(user.id, "wotd");
    if (rateLimitRes) return rateLimitRes;

    const supabase = await createClient();
    const today = new Date().toISOString().slice(0, 10);

    const { data: vocab } = await supabase
      .from("vocabulary")
      .select("word, context_sentence, definition")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200);
    let pool: WotdCandidate[] = (vocab ?? []).map((v) => ({ word: v.word, context: v.context_sentence || v.definition }));

    if (pool.length === 0) {
      // Kosakata kosong: kata inti level awal (band ≤ 1000). Error tabel/kolom tidak ada → lewati ke daftar cadangan.
      const { data: core, error } = await supabase.from("core_words").select("word, example").lte("band", 1000).limit(300);
      if (!error && core) pool = core.map((c) => ({ word: c.word, context: c.example }));
    }
    if (pool.length === 0) pool = FALLBACK_WORDS;

    const picked = pickWordOfTheDay(pool, user.id, today) ?? FALLBACK_WORDS[0];
    const wordToTeach = picked.word;
    const context = picked.context ?? "";

    const prompt = `You are a lively English tutor. The "Word of the Day" for the user is "${wordToTeach}".
Context/Definition: "${context}"

Generate a short, engaging mini-lesson (in Indonesian) and a quick quiz.
Include:
1. Meaning (Arti)
2. Common Collocations (Kata yang sering dipasangkan, max 3)
3. A 1-question multiple choice quiz testing the meaning or usage of the word, with 3 or 4 options.

Respond ONLY with valid JSON, no comments.
Format:
{
  "word": "${wordToTeach}",
  "lesson": "Explanation...",
  "collocations": ["collocation 1", "collocation 2"],
  "quiz": {
    "question": "Quiz question here...",
    "options": ["A", "B", "C", "D"],
    "answer": 0
  }
}
"answer" is the zero-based index of the correct option.`;

    const completion = await runAI("wotd", {
      messages: [
        { role: "system", content: "You are a helpful JSON-only API. Only output valid JSON." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    }, { userId: user.id });

    const lesson = validateWotd(extractJsonObject(completion.content), wordToTeach);
    if (!lesson) {
      return NextResponse.json({ error: "AI mengembalikan pelajaran yang tidak valid. Coba lagi." }, { status: 502 });
    }
    return NextResponse.json(lesson);
  } catch (error: unknown) {
    console.error("WOTD Error:", error);
    return NextResponse.json({ error: "Layanan AI gagal membuat pelajaran. Coba lagi." }, { status: 500 });
  }
}
