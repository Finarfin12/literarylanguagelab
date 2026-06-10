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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Heartbeat Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
