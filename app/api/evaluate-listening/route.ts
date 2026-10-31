import { runAI } from "@/lib/ai/run";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const { answers, textId, chapter } = await req.json();
    // answers is an array of { question, expected_answer, user_transcript }

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({ error: "Missing answers" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    const prompt = `You are an expert English teacher evaluating a student's listening comprehension.
The student listened to the following questions and answered them orally (the transcript is provided).

Evaluate their answers based on accuracy (did they understand the question and the plot?) and language/clarity.

Questions and Answers:
${answers.map((a, i) => `
Q${i+1}: ${a.question}
Expected: ${a.expected_answer}
User Transcript: "${a.user_transcript}"
`).join("\n")}

Provide an overall score out of 100, and short feedback in Indonesian for each question.
Respond ONLY with valid JSON in this format:
{
  "score": 85,
  "feedback": "Overall good job. You misunderstood question 2 slightly.",
  "evaluations": [
    {
      "question_number": 1,
      "is_correct": true,
      "feedback": "Jawaban Anda sudah tepat dan mencakup poin utama."
    }
  ]
}`;

    const completion = await runAI("evaluate-listening", {
      messages: [
        { role: "system", content: "You are a helpful JSON-only API. Only output valid JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 1500,
    }, { userId: user?.id });

    const raw = completion.content || "{}";
    let parsed;
    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    // Save to DB
    const transcriptText = answers.map(a => a.user_transcript).join(" | ");
    const { error } = await supabase.from('listening_quizzes').insert({
      user_id: user.id,
      text_id: textId || null,
      chapter: chapter || 1,
      score: parsed.score || 0,
      transcript: transcriptText
    });

    if (error) {
       console.error("Listening DB error", error);
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("Listening Evaluate Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
