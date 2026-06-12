import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get today's date in YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    // Get or create today's record
    let { data: activity } = await supabase
      .from('daily_activities')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    if (!activity) {
      const { data: newActivity, error } = await supabase
        .from('daily_activities')
        .insert({ user_id: user.id, date: today })
        .select()
        .single();
        
      if (error && error.code !== '23505') { // Ignore unique violation if parallel request created it
        console.error("Error creating daily activity:", error);
      }
      activity = newActivity || { wotd_completed: false, grammar_completed: false, review_completed: false };
    }

    return NextResponse.json({ success: true, activity });
  } catch (error: any) {
    console.error("Daily Practice GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type } = await req.json(); // "wotd" | "grammar" | "review"
    if (!["wotd", "grammar", "review"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];
    const column = `${type}_completed`;

    const { data: updated, error } = await supabase
      .from('daily_activities')
      .update({ [column]: true })
      .eq('user_id', user.id)
      .eq('date', today)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Check if all completed
    if (updated.wotd_completed && updated.grammar_completed && updated.review_completed) {
      // Award 25 XP
      const { data: profile } = await supabase.from('profiles').select('xp').eq('id', user.id).single();
      if (profile) {
        await supabase.from('profiles').update({ xp: profile.xp + 25 }).eq('id', user.id);
      }
      
      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action_type: 'Completed Daily Practice'
      });
      
      return NextResponse.json({ success: true, activity: updated, allCompleted: true });
    }

    return NextResponse.json({ success: true, activity: updated, allCompleted: false });
  } catch (error: any) {
    console.error("Daily Practice POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
