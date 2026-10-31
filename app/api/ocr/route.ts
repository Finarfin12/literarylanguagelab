import { runAI } from "@/lib/ai/run";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

const OCR_PROMPT = `Transcribe all text in this image exactly as written (it is usually a page of a book).
- Keep the original language, spelling, and punctuation. Do not translate or correct.
- Keep paragraph breaks as blank lines. Join lines that were only wrapped by the page width.
- Skip page numbers, running headers, and footers.
- Output only the text: no commentary, no markdown, no code fences.
/no_think`;

// Buang blok <think> dan pagar kode yang kadang tetap dikirim model reasoning.
function cleanOcrOutput(text: string) {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/^```[a-z]*\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

export async function POST(req: Request) {
  try {
    const authResult = await requireUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const rateLimitRes = await checkRateLimit(user.id, "ocr");
    if (rateLimitRes) {
      return rateLimitRes;
    }

    const { imageBase64 } = await req.json();

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // B-04: Wajib data URL dengan MIME jpeg/png/webp
    const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,/);
    if (!mimeMatch || !["image/jpeg", "image/png", "image/webp"].includes(mimeMatch[1].toLowerCase())) {
      return NextResponse.json(
        { error: "Format gambar tidak didukung. Harap gunakan format JPEG, PNG, atau WebP." },
        { status: 400 }
      );
    }

    // B-04: Validasi ukuran base64 (maksimal 4 MB)
    const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
    const approximateBytes = (base64Data.length * 3) / 4;
    if (approximateBytes > 4 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Ukuran gambar melebihi batas maksimum 4 MB." },
        { status: 400 }
      );
    }

    // Model OCR diatur di admin (Routing Fitur → ocr), default qwen/qwen3.8-27b.
    // "/no_think" mematikan mode thinking Qwen agar output berupa teks mentah.
    const completion = await runAI("ocr", {
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: OCR_PROMPT },
            { type: "image_url", image_url: { url: imageBase64 } },
          ],
        },
      ],
      temperature: 0,
      max_tokens: 4000,
    }, { userId: user.id, timeoutMs: 60 * 1000 });

    const result = cleanOcrOutput(completion.content || "");
    if (!result) {
      return NextResponse.json({ error: "Tidak ada teks yang terbaca. Coba foto yang lebih terang dan tegak." }, { status: 422 });
    }
    return NextResponse.json({ result });
  } catch (error: unknown) {
    console.error("OCR Error:", error);
    return NextResponse.json({ error: "Gagal membaca gambar. Coba lagi beberapa saat lagi." }, { status: 502 });
  }
}
