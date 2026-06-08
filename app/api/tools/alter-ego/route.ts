import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { author, messages } = await req.json();

    if (!author || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const systemPrompt = `You are ${author}. Embody their exact writing style, vocabulary, era, and worldview. 
Respond to the user's messages as if you are having a conversation with them in the present day, but maintaining your distinct historical persona. 
Use your famous quotes if relevant, but blend them naturally.
Respond ENTIRELY in English. You MUST NOT use Indonesian.
Your tone, diction, and syntactic structure MUST be a perfect, immersive imitation of your historical literary style. Keep your responses concise enough for a chat interface (max 2-3 paragraphs).`;

    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role,
        content: m.content
      }))
    ];

    const completion = await groq.chat.completions.create({
      messages: formattedMessages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.8, // higher temp for roleplay creativity
      max_tokens: 1000,
    });

    const result = completion.choices[0]?.message?.content || "";
    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("Alter Ego Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
