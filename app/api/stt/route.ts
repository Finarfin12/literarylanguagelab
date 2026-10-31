import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const rateLimitRes = await checkRateLimit(user.id, "stt");
    if (rateLimitRes) {
      return rateLimitRes;
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // B-04: Validasi format audio dan batas ukuran 25 MB
    if (!file.type || !file.type.startsWith("audio/")) {
      return NextResponse.json(
        { error: "Format file tidak didukung. Harap unggah file audio (audio/*)." },
        { status: 400 }
      );
    }

    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Ukuran audio melebihi batas maksimum 25 MB." },
        { status: 400 }
      );
    }

    // Use native fetch to avoid Next.js File object compatibility issues with groq-sdk
    const groqFormData = new FormData();
    groqFormData.append("file", file);
    groqFormData.append("model", "whisper-large-v3-turbo");
    groqFormData.append("language", "en");
    groqFormData.append(
      "prompt",
      "The user is saying an english word or sentence. Output strictly the english text."
    );
    groqFormData.append("response_format", "json");
    groqFormData.append("temperature", "0.0");

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: groqFormData,
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "Failed to process audio with Groq");
    }

    const transcription = await response.json();
    return NextResponse.json({ text: transcription.text });
  } catch (error: unknown) {
    console.error("STT Error:", error);
    return NextResponse.json(
      { error: (error as Error)?.message || "Failed to process audio" },
      { status: 500 }
    );
  }
}
