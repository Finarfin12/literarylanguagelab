import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text_id, time_spent_seconds } = await req.json();

    if (!text_id || !time_spent_seconds) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get active reading session
    const { data: session } = await supabase
      .from("reading_sessions")
      .select("id, time_spent_seconds")
      .eq("user_id", user.id)
      .eq("text_id", text_id)
      .single();

    if (session) {
      // Update session
      await supabase
        .from("reading_sessions")
        .update({ 
          time_spent_seconds: (session.time_spent_seconds || 0) + time_spent_seconds,
          last_active_at: new Date().toISOString()
        })
        .eq("id", session.id);
    } else {
      // Create session if it doesn't exist (though it should)
      await supabase.from("reading_sessions").insert({
        user_id: user.id,
        text_id,
        time_spent_seconds,
        last_active_at: new Date().toISOString(),
        started_at: new Date().toISOString()
      });
    }

    // Auto-complete Reading Quests if time spent > 15s
    const totalTime = (session?.time_spent_seconds || 0) + time_spent_seconds;
    if (totalTime > 15) {
      const { data: profile } = await supabase.from('profiles').select('journey_level').eq('id', user.id).single();
      const level = profile?.journey_level || 1;
      
      const readingQuestIds: Record<number, string> = {
        1: 'a1_read',
        2: 'a2_read',
        3: 'b1_read',
        4: 'b2_read',
        5: 'c1_read',
        6: 'c2_read'
      };
      
      const questId = readingQuestIds[level];
      if (questId) {
        await supabase.from('journey_progress').upsert({
          user_id: user.id,
          quest_id: questId,
          journey_level: level,
          completed: true,
          completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id,quest_id' });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Heartbeat Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
