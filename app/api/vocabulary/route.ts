import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { word, definition, contextSentence, contextSource, masteryLevel, collocations, text_id, position_offset } = await req.json();

    if (!word) {
      return NextResponse.json({ error: "Word is required" }, { status: 400 });
    }

    if (collocations && Array.isArray(collocations) && collocations.length > 0) {
      const groupId = crypto.randomUUID();
      const records = collocations.map(col => ({
        user_id: user.id,
        word: col.trim(),
        definition: `Collocation for: ${word}`, // We use definition field simply as reference
        context_sentence: contextSentence || null,
        context_source: contextSource || null,
        mastery_level: masteryLevel || 0,
        next_review_at: new Date().toISOString(),
        interval: 0,
        repetition_count: 0,
        efactor: 2.5,
        is_collocation: true,
        collocation_group_id: groupId,
        text_id: text_id || null,
        position_offset: position_offset !== undefined ? position_offset : null
      }));
      
      const { error } = await supabase.from("vocabulary").upsert(records, { onConflict: "user_id,word" });
      if (error) {
        console.error("Vocabulary save collocations error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      const { error } = await supabase.from("vocabulary").upsert({
        user_id: user.id,
        word: word.trim(),
        definition: definition || "",
        context_sentence: contextSentence || null,
        context_source: contextSource || null,
        mastery_level: masteryLevel || 0,
        next_review_at: new Date().toISOString(),
        interval: 0,
        repetition_count: 0,
        efactor: 2.5,
        is_collocation: false,
        text_id: text_id || null,
        position_offset: position_offset !== undefined ? position_offset : null
      }, { onConflict: "user_id,word" });

      if (error) {
        console.error("Vocabulary save error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Award XP + sync vocab_count
    const { data: profile } = await supabase.from("profiles").select("xp,vocab_count").eq("id", user.id).single();
    const { count: totalVocab } = await supabase.from("vocabulary").select("*", { count: "exact", head: true }).eq("user_id", user.id);

    await supabase.from("profiles").upsert({
      id: user.id,
      xp: (profile?.xp || 0) + 3,
      vocab_count: totalVocab || 1,
    }, { onConflict: "id" });

    // LOG ACTIVITY
    try {
      await supabase.from("activity_logs").insert({
        user_id: user.id,
        action_type: collocations ? `Saved collocations for: ${word.trim()}` : `Saved word: ${word.trim()}`,
      });
    } catch (logError) {
      console.error("Failed to log vocabulary activity:", logError);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Vocabulary API error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
