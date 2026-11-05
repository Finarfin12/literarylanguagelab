import { runAI } from "@/lib/ai/run";
import { guardAIRoute } from "@/lib/ai/guard";
import { NextResponse } from "next/server";
import { DIALOGUE_SCENARIOS } from "@/lib/dialogue-scenarios";

export async function POST(req: Request) {
  try {
    const guard = await guardAIRoute(req, { limitKey: "dialogue-simulator", maxChars: 20000, maxMessages: 60 });
    if (guard instanceof NextResponse) return guard;
    const { user, body } = guard;
    const { scenarioId, messages } = body as { scenarioId?: string; messages?: { role: "user" | "assistant"; content: string }[] };

    const scenario = DIALOGUE_SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) {
      return NextResponse.json({ error: "Skenario tidak ditemukan." }, { status: 400 });
    }


    const chatMessages = [
      { role: "system" as const, content: scenario.systemPrompt },
      ...(messages ?? []).map((m) => ({
        role: m.role,
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
