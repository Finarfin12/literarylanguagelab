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

    const rateLimitRes = await checkRateLimit(user.id, "tts");
    if (rateLimitRes) {
      return rateLimitRes;
    }

    const { text, voice = "troy" } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY is not configured.");
      return NextResponse.json({ error: "TTS service not configured" }, { status: 500 });
    }

    const response = await fetch("https://api.groq.com/openai/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "canopylabs/orpheus-v1-english",
        input: text,
        voice: voice,
        response_format: "wav",
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Groq TTS Error:", response.status, errorData);
      return NextResponse.json({ error: "Failed to generate speech" }, { status: response.status });
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error: unknown) {
    console.error("TTS API Error:", (error as Error)?.message || error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
