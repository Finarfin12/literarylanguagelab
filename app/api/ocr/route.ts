import { runAI } from "@/lib/ai/run";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

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

    // B-04: Validasi format MIME (jpeg/png/webp)
    const mimeMatch = imageBase64.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,/);
    if (mimeMatch) {
      const mime = mimeMatch[1].toLowerCase();
      if (!["image/jpeg", "image/png", "image/webp"].includes(mime)) {
        return NextResponse.json(
          { error: "Format gambar tidak didukung. Harap gunakan format JPEG, PNG, atau WebP." },
          { status: 400 }
        );
      }
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

    const completion = await runAI("ocr", {
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all the text from this image exactly as it is written. Do not add any conversational filler, markdown formatting, or commentary. Just output the raw text.",
            },
            { type: "image_url", image_url: { url: imageBase64 } },
          ],
        },
      ],
    }, { userId: user?.id });

    const result = completion.content || "";
    return NextResponse.json({ result });
  } catch (error: unknown) {
    console.error("OCR Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
