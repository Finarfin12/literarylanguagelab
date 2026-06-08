import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { title, author, content, messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // truncate content to save tokens if it's too long
    const truncatedContent = content ? content.substring(0, 3000) + (content.length > 3000 ? "..." : "") : "No text provided.";

    const systemPrompt = `You are a strict but brilliant English Literature Reading Companion. 
The user is currently reading: "${title}" by ${author}.
Here is the text context:
---
${truncatedContent}
---
Answer the user's questions about this specific text. Focus on literary analysis, themes, subtext, character motivations, and historical context.
Respond ONLY IN ENGLISH for the main analysis to preserve immersion, but you may provide Indonesian translations in parentheses for complex literary jargon if necessary.
Keep your answers focused, academic, and engaging. Use Markdown formatting.`;

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
      temperature: 0.5,
      max_tokens: 1500,
    });

    const result = completion.choices[0]?.message?.content || "";
    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("Companion Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
