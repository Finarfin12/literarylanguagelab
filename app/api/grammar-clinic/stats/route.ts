import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch last 50 sessions
    const { data: sessions, error } = await supabase
      .from("grammar_sessions")
      .select("score, corrections, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({
        totalSessions: 0,
        averageScore: 0,
        topWeaknesses: [],
        recentScores: [],
        totalErrors: 0
      });
    }

    // Process stats
    let totalScore = 0;
    let totalErrorsCount = 0;
    const categoryCounts: Record<string, { count: number, examples: any[] }> = {};
    const recentScores = [...sessions].reverse().map(s => ({
      date: new Date(s.created_at).toLocaleDateString(),
      score: s.score
    }));

    for (const session of sessions) {
      totalScore += session.score;
      if (session.corrections && Array.isArray(session.corrections)) {
        totalErrorsCount += session.corrections.length;
        for (const corr of session.corrections) {
          if (!corr.category) continue;
          
          // Clean category name if it has multiple separated by |
          const cats = corr.category.split("|");
          const mainCat = cats[0].trim();
          
          if (!categoryCounts[mainCat]) {
            categoryCounts[mainCat] = { count: 0, examples: [] };
          }
          categoryCounts[mainCat].count += 1;
          
          // Store an example if we don't have many
          if (categoryCounts[mainCat].examples.length < 5) {
            categoryCounts[mainCat].examples.push(corr);
          }
        }
      }
    }

    // Sort top weaknesses
    const sortedCategories = Object.keys(categoryCounts)
      .map(key => ({
        category: key,
        count: categoryCounts[key].count,
        percentage: totalErrorsCount > 0 ? Math.round((categoryCounts[key].count / totalErrorsCount) * 100) : 0,
        examples: categoryCounts[key].examples
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      totalSessions: sessions.length,
      averageScore: Math.round(totalScore / sessions.length),
      topWeaknesses: sortedCategories.slice(0, 3), // Top 3
      recentScores,
      totalErrors: totalErrorsCount
    });

  } catch (error: any) {
    console.error("Grammar Stats Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
