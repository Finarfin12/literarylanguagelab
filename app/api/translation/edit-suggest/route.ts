import { NextResponse } from "next/server";
import { runAI } from "@/lib/ai/run";
import { guardAIRoute } from "@/lib/ai/guard";
import { FeatureDisabledError } from "@/lib/ai/flags";
import { extractJsonObject } from "@/lib/ai/json";
import { EDIT_FEATURE_KEY, EDIT_MAX_TEXT, buildEditMessages, parseEditResult } from "@/lib/translation/edit-suggest";

/**
 * Saran penyuntingan bahasa Indonesia untuk SATU segmen terjemahan (Fase 29, item 3). Hanya mengembalikan saran yang
 * sudah disaring (lib/translation/edit-suggest.ts): pengguna yang memutuskan dan menerapkan di editor. Tidak menyimpan
 * apa pun di server. Lewat guardAIRoute (login, batas pemakaian, ukuran badan) dan runAI (tercatat di ai_usage_logs).
 */
export async function POST(req: Request) {
  try {
    const guard = await guardAIRoute(req, { limitKey: EDIT_FEATURE_KEY, maxChars: EDIT_MAX_TEXT * 2 + 200, maxMessages: 2 });
    if (guard instanceof NextResponse) return guard;
    const { user, body } = guard;

    const { source, target } = body as { source?: unknown; target?: unknown };
    if (typeof source !== "string" || typeof target !== "string" || !source.trim() || !target.trim()) {
      return NextResponse.json({ error: "Teks sumber dan terjemahan wajib diisi." }, { status: 400 });
    }
    if (source.length > EDIT_MAX_TEXT || target.length > EDIT_MAX_TEXT) {
      return NextResponse.json({ error: `Segmen terlalu panjang (maksimum ${EDIT_MAX_TEXT} karakter).` }, { status: 413 });
    }

    const completion = await runAI(
      EDIT_FEATURE_KEY,
      { messages: buildEditMessages(source.trim(), target), response_format: { type: "json_object" }, temperature: 0.2, max_tokens: 1200 },
      { userId: user.id }
    );

    const json = extractJsonObject(completion.content);
    if (!json) return NextResponse.json({ error: "Respons AI tidak valid. Coba lagi." }, { status: 502 });
    return NextResponse.json(parseEditResult(json, target));
  } catch (error) {
    if (error instanceof FeatureDisabledError) return NextResponse.json({ error: error.message }, { status: 503 });
    console.error("Translation edit-suggest error:", error);
    return NextResponse.json({ error: "Saran penyuntingan belum bisa dibuat. Coba lagi nanti." }, { status: 500 });
  }
}
