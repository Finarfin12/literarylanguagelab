import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const authResult = await requireUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { supabase, user } = authResult;

    const { text_id, time_spent_seconds } = await req.json();

    if (!text_id || typeof time_spent_seconds === "undefined") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // B-05: Batasi time_spent_seconds ke rentang 1–60 detik per panggilan
    const parsedSeconds = Number(time_spent_seconds);
    if (isNaN(parsedSeconds) || parsedSeconds <= 0) {
      return NextResponse.json({ error: "Invalid time_spent_seconds" }, { status: 400 });
    }
    const safeTimeSpent = Math.min(Math.max(Math.floor(parsedSeconds), 1), 60);

    // B-05: Hindari kegagalan saat ada sesi ganda dengan order & maybeSingle
    const { data: session } = await supabase
      .from("reading_sessions")
      .select("id, time_spent_seconds")
      .eq("user_id", user.id)
      .eq("text_id", text_id)
      .order("last_active_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (session) {
      await supabase
        .from("reading_sessions")
        .update({
          time_spent_seconds: (session.time_spent_seconds || 0) + safeTimeSpent,
          last_active_at: new Date().toISOString(),
        })
        .eq("id", session.id);
    } else {
      await supabase.from("reading_sessions").insert({
        user_id: user.id,
        text_id,
        time_spent_seconds: safeTimeSpent,
        last_active_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, recorded_seconds: safeTimeSpent });
  } catch (error: unknown) {
    console.error("Heartbeat Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
