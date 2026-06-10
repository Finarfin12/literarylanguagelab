"use server";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function submitDuel(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authorized");

  const duelId = formData.get("duel_id") as string;
  const translatedText = formData.get("translated_text") as string;

  const aiFeedback = "Struktur kalimat sangat mengalir dan bernada puitis yang tepat. Pemilihan kata cukup kuat.";

  await supabase.from("duel_submissions").insert({
    duel_id: duelId,
    user_id: user.id,
    translated_text: translatedText,
    ai_feedback: aiFeedback
  });

  const { data: profile } = await supabase.from("profiles").select("xp").eq("id", user.id).single();
  if (profile) {
     await supabase.from("profiles").update({ xp: profile.xp + 15 }).eq("id", user.id);
  }

  revalidatePath("/duels");
}

export async function voteDuelSubmission(submissionId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authorized");

  const { data: sub } = await supabase.from("duel_submissions").select("votes").eq("id", submissionId).single();
  if (sub) {
     await supabase.from("duel_submissions").update({ votes: sub.votes + 1 }).eq("id", submissionId);
  }
  revalidatePath("/duels");
}
