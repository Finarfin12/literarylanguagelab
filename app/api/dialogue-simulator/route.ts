import { runAI } from "@/lib/ai/run";
import { NextResponse } from "next/server";
import { DIALOGUE_SCENARIOS } from "@/lib/dialogue-scenarios";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { scenarioId, messages } = await req.json();

    const scenario = DIALOGUE_SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) {
      return NextResponse.json({ error: "Skenario tidak ditemukan." }, { status: 400 });
    }


    const chatMessages = [
      { role: "system" as const, content: scenario.systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const completion = await runAI("dialogue-simulator", {
      messages: chatMessages,
      temperature: 0.7,
      max_tokens: 300,
    }, { userId: user?.id });

    const reply = completion.content || "I'm sorry, could you repeat that?";

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Dialogue Simulator Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
