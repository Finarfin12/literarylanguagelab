"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function mapDifficulty(value: string): string {
  const n = parseInt(value) || 3;
  if (n <= 1) return "beginner";
  if (n <= 3) return "intermediate";
  return "advanced";
}

export async function addText(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authorized");

  const title = formData.get("title") as string;
  const author = formData.get("author") as string;
  const content = formData.get("content") as string;
  const era = formData.get("era") as string || null;
  const genre = formData.get("genre") as string || null;
  const difficultyRaw = formData.get("difficulty") as string || "3";
  const difficulty = mapDifficulty(difficultyRaw);
  const wordCount = content ? content.split(/\s+/).filter(Boolean).length : 0;

  if (!title || !author || !content) {
    throw new Error("Missing required fields");
  }

  const { error } = await supabase
    .from("texts")
    .insert([{ title, author, content, era, genre, difficulty, word_count: wordCount, is_public: true }]);

  if (error) {
    console.error("addText error:", error);
    throw new Error(error.message);
  }

  revalidatePath("/library");
  redirect("/library");
}

export async function deleteText(textId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authorized");

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') {
    throw new Error("Admin privileges required");
  }

  const { error } = await supabase.from("texts").delete().eq("id", textId);
  if (error) {
    console.error("deleteText error:", error);
    throw new Error(error.message);
  }

  revalidatePath("/library");
}
