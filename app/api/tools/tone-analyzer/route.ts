import { runAI } from "@/lib/ai/run";
import { NextResponse } from "next/server";
import { formatAITextResponse, withAITextOutputRules } from "@/lib/ai-output";
import { requireUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const authResult = await requireUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { user } = authResult;

    const rateLimitRes = await checkRateLimit(user.id, "tone-analyzer");
    if (rateLimitRes) {
      return rateLimitRes;
    }

    const { text, targetTone, mode } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const sample = text.slice(0, 3000);
    const effectiveTarget = String(targetTone || "Akademis Profesional").slice(0, 80);
    // mode "detect": hanya deteksi nada. Selain itu (termasuk klien lama tanpa mode): deteksi + transformasi.
    const detectOnly = mode === "detect";

    const detection = `## TONE DETECTION
1. Classify the CURRENT tone (neutral/formal/sarcastic/ironic/humorous/melancholic/dramatic/romantic/ominous/urgent)
2. Identify 2-3 linguistic markers (word choices, syntax, punctuation) that indicate this tone
3. Explain how to preserve this tone when translating to Indonesian with specific examples`;

    const transformation = `## TONE TRANSFORMATION
4. Estimate the CEFR reading level (A1-C2) of the original text
5. Rewrite the text to perfectly match the Target Tone
6. Provide a 'Before & After' comparison
7. Explain the grammar/diction choices made for the transformation`;

    const outputRules = `Respond entirely in Indonesian (except tone classification label, linguistic markers, and English text quotes which stay in English) using HIGHLY STRUCTURED Markdown (must use ## Headers, bullet points, bold text, and ⚠️ warnings where literal translation would fail). English text quotes in italic or blockquotes.`;

    const prompt = detectOnly
      ? `Text:\n"${sample}"\n\nTask:\n\n${detection}\n\n${outputRules}`
      : `Text:\n"${sample}"\n\nTarget Tone: ${effectiveTarget}\n\nTask:\n\n${detection}\n\n${transformation}\n\n${outputRules}`;

    const completion = await runAI("tone-analyzer", {
      messages: [
        { role: "system", content: withAITextOutputRules("You are a literary tone analyst and transformation expert. You help Indonesian students of English Literature understand tone nuances and rewrite texts for different audiences.") },
        { role: "user", content: prompt }
      ],
    }, { userId: user?.id });

    const result = formatAITextResponse(completion.content || "");
    return NextResponse.json({ result });
  } catch (error: unknown) {
    console.error("Tone Analyzer Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
