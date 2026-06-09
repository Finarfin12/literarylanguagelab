"use server";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function addGlossary(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authorized");

  const term = formData.get("term") as string;
  const preferred_translation = formData.get("preferred_translation") as string;
  const book_title = formData.get("book_title") as string;
  const author = formData.get("author") as string;
  const notes = formData.get("notes") as string;

  const { error } = await supabase.from("glossaries").insert({
    user_id: user.id,
    term,
    preferred_translation,
    book_title,
    author,
    notes
  });

  if (error) throw error;
  revalidatePath("/glossary");
}

export async function deleteGlossary(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authorized");

  const { error } = await supabase.from("glossaries").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw error;
  revalidatePath("/glossary");
}
