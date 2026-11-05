import { runAI } from "@/lib/ai/run";
import { NextResponse } from "next/server";
import { guardAIRoute } from "@/lib/ai/guard";
import { MAX_TRANSLATE_CHARS } from "@/lib/dialogue-help";

/**
 * "Lihat terjemahan" pada balasan AI di Dialogue Simulator (Fase 22.3, Bantuan pemula). Hanya dipanggil saat pengguna
 * mengklik tombolnya; klien menyimpan hasilnya selama sesi supaya tidak diulang. Lewat guardAIRoute (login, batas, ukuran).
 */
export async function POST(req: Request) {
  try {
    const guard = await guardAIRoute(req, { limitKey: "dialogue-simulator", maxChars: MAX_TRANSLATE_CHARS, maxMessages: 1 });
    if (guard instanceof NextResponse) return guard;
    const { user, body } = guard;
    const { text } = body as { text?: string };

    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Teks yang diterjemahkan wajib diisi." }, { status: 400 });
    }

    const completion = await runAI("dialogue-simulator", {
      messages: [
        {
          role: "system",
          content: "You translate short English chat messages into natural Indonesian for a beginner learner. Output ONLY the Indonesian translation, with no quotes, notes, or explanations.",
        },
        { role: "user", content: text.trim() },
      ],
      temperature: 0.2,
      max_tokens: 300,
    }, { userId: user.id });

    const translation = (completion.content || "").trim();
    if (!translation) return NextResponse.json({ error: "Terjemahan kosong. Coba lagi." }, { status: 502 });
    return NextResponse.json({ translation });
  } catch (error) {
    console.error("Dialogue Translate Error:", error);
    return NextResponse.json({ error: "Terjemahan gagal. Coba lagi." }, { status: 500 });
  }
}
