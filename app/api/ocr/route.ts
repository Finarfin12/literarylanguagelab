import { NextResponse } from "next/server";
import { getAIClient, getAIConfig, getRateLimit } from "@/lib/ai-config";


export async function POST(req: Request) {
  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const config = await getAIConfig("tools");
    const groq = await getAIClient("tools");
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Extract all the text from this image exactly as it is written. Do not add any conversational filler, markdown formatting, or commentary. Just output the raw text." },
            { type: "image_url", image_url: { url: imageBase64 } }
          ]
        }
      ],
      model: config.model,
      temperature: config.temperature,
      max_tokens: config.max_tokens,
    });

    const result = completion.choices[0]?.message?.content || "";
    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("OCR Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
