import { NextResponse } from "next/server";
import { getAIClient, getAIConfig, getRateLimit } from "@/lib/ai-config";
import { formatAITextResponse, withAITextOutputRules } from "@/lib/ai-output";
import { TOOLS } from "@/lib/tools-config";
import { createClient } from "@/utils/supabase/server";


export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { toolId, text, configValue } = await req.json();

    if (!text || !toolId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const tool = TOOLS.find(t => t.id === toolId);
    if (!tool) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }

    const prompt = `Input Text:\n"${text}"\n\n${configValue ? `Target Configuration: ${configValue}` : ""}`;

    const config = await getAIConfig("tools");
    const groq = await getAIClient("tools");
    const shouldFormatText = tool.id !== "semantic-map";
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: shouldFormatText ? withAITextOutputRules(tool.systemPrompt) : tool.systemPrompt },
        { role: "user", content: prompt }
      ],
      model: config.model,
      temperature: config.temperature,
      max_tokens: config.max_tokens,
    });

    const rawResult = completion.choices[0]?.message?.content || "";
    const result = shouldFormatText ? formatAITextResponse(rawResult) : rawResult;

    // LOG ACTIVITY
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
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
