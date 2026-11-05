import { runAI } from "@/lib/ai/run";
import { guardAIRoute } from "@/lib/ai/guard";
import { NextResponse } from "next/server";
import { getRateLimit } from "@/lib/ai-config";
import { formatAITextResponse, withAITextOutputRules } from "@/lib/ai-output";
import { TOOLS } from "@/lib/tools-config";


export async function POST(req: Request) {
  try {
    const guard = await guardAIRoute(req, { limitKey: "dynamic-tools", maxChars: 40000, maxMessages: 5 });
    if (guard instanceof NextResponse) return guard;
    const { user, supabase, body } = guard;
    const { toolId, text, configValue } = body as { toolId?: string; text?: string; configValue?: string };

    if (!text || !toolId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const tool = TOOLS.find(t => t.id === toolId);
    if (!tool) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }

    const prompt = `Input Text:\n"${text}"\n\n${configValue ? `Target Configuration: ${configValue}` : ""}`;

    const shouldFormatText = tool.id !== "semantic-map";
    const completion = await runAI("dynamic-tools", {
      messages: [
        { role: "system", content: shouldFormatText ? withAITextOutputRules(tool.systemPrompt) : tool.systemPrompt },
        { role: "user", content: prompt }
      ],
    }, { userId: user?.id });

    const rawResult = completion.content || "";
    const result = shouldFormatText ? formatAITextResponse(rawResult) : rawResult;

    // LOG ACTIVITY
    try {
      if (user) {
        await supabase.from("activity_logs").insert({
          user_id: user.id,
          action_type: `Tool Used: ${tool.title}${configValue ? ` (${configValue})` : ""}`,
        });
      }
    } catch (logError) {
      console.error("Failed to log activity:", logError);
    }

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("Dynamic Tool Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
