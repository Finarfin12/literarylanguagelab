import { NextResponse } from "next/server";
import { getAIClient, getAIConfig } from "@/lib/ai-config";

const SYSTEM_PROMPT = `You are an English listening test generator for Indonesian learners. Generate a short English passage and comprehension questions based on the requested CEFR level and mode.

IMPORTANT: Respond with ONLY valid JSON. No markdown, no code fences.

For "quiz" mode, generate:
{
  "passage": "A short English passage (3-6 sentences). Use vocabulary appropriate for the CEFR level.",
  "title": "A short title for the passage",
  "questions": [
    {
      "question": "Question about the passage content",
      "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
      "correct": "B"
    }
  ]
}

For "dictation" mode, generate:
{
  "passage": "A single clear English sentence appropriate for the CEFR level. Keep it 8-15 words.",
  "title": "Dictation"
}

CEFR Level Guidelines:
- A1: Very simple sentences, basic vocabulary (animals, food, family, colors)
- A2: Simple daily conversations, common phrases
- B1: Everyday situations, simple opinions, some complex sentences
- B2: More abstract topics, news-like passages, varied sentence structure

Generate 4 questions for quiz mode. Make questions progressively harder.`;

export async function POST(req: Request) {
  try {
    const { level, mode } = await req.json();

    if (!level || !mode) {
      return NextResponse.json({ error: "Level dan mode diperlukan." }, { status: 400 });
    }

    const config = await getAIConfig("tools");
    const groq = await getAIClient("tools");

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Generate a ${mode} listening test for CEFR level ${level}. Topic: ${getRandomTopic()}.` },
      ],
      model: config.model,
      temperature: 0.8,
      max_tokens: 1500,
    });

    const raw = completion.choices[0]?.message?.content || "{}";

    let parsed;
    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        passage: "The system could not generate a passage. Please try again.",
        title: "Error",
        questions: [],
      };
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("Listening Test Generate Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function getRandomTopic(): string {
  const topics = [
    "A trip to the supermarket",
    "A phone call with a friend",
    "A news report about weather",
    "A school announcement",
    "A conversation at a restaurant",
    "A travel blog post",
    "A recipe description",
    "A story about a weekend adventure",
    "An email to a colleague",
    "A museum tour guide speaking",
  ];
  return topics[Math.floor(Math.random() * topics.length)];
}
