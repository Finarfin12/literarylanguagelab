import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getAIClient, getAIConfig } from "@/lib/ai-config";

// helper to get the start of the week (Monday)
function getStartOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
  return new Date(d.setDate(diff)).toISOString().split('T')[0];
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    const currentWeekStart = getStartOfWeek(today);

    // Get current prompt
    const { data: prompt } = await supabase.from('weekly_prompts').select('*').eq('week_start_date', currentWeekStart).single();
    
    let activePrompt = prompt;
    if (!prompt) {
      // Fallback prompt if nothing is in DB for this week
      activePrompt = {
        id: 'fallback',
        week_start_date: currentWeekStart,
        prompt_text: "Tulis ringkasan singkat tentang buku terakhir yang Anda baca atau film terakhir yang Anda tonton, menggunakan setidaknya 3 kata sifat (adjectives) tingkat lanjut."
      };
    }

    // Get user's submission for this prompt
    const { data: submission } = await supabase.from('writing_submissions')
      .select('*')
      .eq('user_id', user.id)
      .eq('prompt', activePrompt.prompt_text)
      .single();

    // Get streak
    // Simple streak: count submissions in the last 7 days grouped by day
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    const { data: recentSubmissions } = await supabase.from('writing_submissions')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    // Calculate streak
    let streak = 0;
    if (recentSubmissions && recentSubmissions.length > 0) {
      let currentCheckDate = new Date();
      currentCheckDate.setHours(0, 0, 0, 0);

      const subDates = new Set(recentSubmissions.map(s => {
        const d = new Date(s.created_at);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      }));

      // if they submitted today, streak starts from today, otherwise from yesterday
      if (subDates.has(currentCheckDate.getTime())) {
        streak++;
        currentCheckDate.setDate(currentCheckDate.getDate() - 1);
      } else {
        currentCheckDate.setDate(currentCheckDate.getDate() - 1);
        if (subDates.has(currentCheckDate.getTime())) {
          streak++;
          currentCheckDate.setDate(currentCheckDate.getDate() - 1);
        } else {
          // No streak
          streak = 0;
        }
      }

      while(streak > 0 && subDates.has(currentCheckDate.getTime())) {
        streak++;
        currentCheckDate.setDate(currentCheckDate.getDate() - 1);
      }
    }

    return NextResponse.json({
      prompt: activePrompt,
      submission,
      streak
    });
  } catch (error: any) {
    console.error("Writing Challenge GET Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { responseText, promptText } = await req.json();

    if (!responseText || responseText.trim() === "") {
      return NextResponse.json({ error: "Response is empty" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Evaluate using Groq
    const config = await getAIConfig("tools");
    const groq = await getAIClient("tools");

    const prompt = `You are an expert English writing tutor. The user is writing an answer to this prompt: "${promptText}".
Evaluate the user's response:
"${responseText}"

Respond ONLY with valid JSON format:
{
  "score": 85, // 0-100 overall score
  "feedback": "A short overall feedback paragraph in Indonesian.",
  "grammar_issues": ["Issue 1 in Indonesian", "Issue 2 in Indonesian"],
  "vocabulary_praise": ["Good word 1", "Good phrase 2"]
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful JSON-only API. Only output valid JSON." },
        { role: "user", content: prompt }
      ],
      model: config.model,
      temperature: 0.2,
      max_tokens: 1000,
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    let parsedScores;
    try {
      const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsedScores = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    // Save submission
    const { data: savedSubmission, error } = await supabase.from('writing_submissions').insert({
      user_id: user.id,
      prompt: promptText,
      response: responseText,
      scores: parsedScores
    }).select().single();

    if (error) {
       console.error("DB Save Error:", error);
       return NextResponse.json({ error: "Failed to save to database" }, { status: 500 });
    }

    // Award XP
    const { data: profile } = await supabase.from('profiles').select('xp').eq('id', user.id).single();
    if (profile) {
      await supabase.from('profiles').update({ xp: profile.xp + 15 }).eq('id', user.id);
    }

    // Auto-track Quests
    try {
      const { count } = await supabase.from('writing_submissions').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      const writingCount = count || 0;

      if (writingCount >= 1) {
        await supabase.from('journey_progress').upsert({
          user_id: user.id, quest_id: 'a2_writing', journey_level: 2, completed: true, completed_at: new Date().toISOString()
        }, { onConflict: 'user_id,quest_id' });
      }
      if (writingCount >= 3) {
        await supabase.from('journey_progress').upsert({
          user_id: user.id, quest_id: 'b1_writing', journey_level: 3, completed: true, completed_at: new Date().toISOString()
        }, { onConflict: 'user_id,quest_id' });
      }
    } catch (e) {
      console.error("Auto track quest error", e);
    }

    return NextResponse.json({ submission: savedSubmission });
  } catch (error: any) {
    console.error("Writing Challenge POST Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
