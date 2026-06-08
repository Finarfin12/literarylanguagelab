import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { TOOLS } from "@/lib/tools-config";
import { createClient } from "@/utils/supabase/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { toolId, text, configValue } = await req.json();

    if (!text || !toolId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const tool = TOOLS.find(t => t.id === toolId);
    if (!tool) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }

    const prompt = `Input Text:\n"${text}"\n\n${configValue ? `Target Configuration: ${configValue}` : ""}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: tool.systemPrompt },
        { role: "user", content: prompt }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 1500,
    });

    const result = completion.choices[0]?.message?.content || "";

    // LOG ACTIVITY
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("activity_logs").insert({
          user_id: user.id,
          action: `Tool Used: ${tool.title}${configValue ? ` (${configValue})` : ""}`,
        });
      }
    } catch (logError) {
      console.error("Failed to log activity:", logError);
    }

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("Dynamic Tool Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
