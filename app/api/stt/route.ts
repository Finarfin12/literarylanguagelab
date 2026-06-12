import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Use native fetch to avoid Next.js File object compatibility issues with groq-sdk
    const groqFormData = new FormData();
    groqFormData.append('file', file);
    groqFormData.append('model', 'whisper-large-v3-turbo');
    groqFormData.append('language', 'en');
    groqFormData.append('prompt', 'The user is saying an english word or sentence. Output strictly the english text.');
    groqFormData.append('response_format', 'json');
    groqFormData.append('temperature', '0.0');

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: groqFormData
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "Failed to process audio with Groq");
    }

    const transcription = await response.json();
    return NextResponse.json({ text: transcription.text });
  } catch (error: any) {
    console.error("STT Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process audio" }, { status: 500 });
  }
}
