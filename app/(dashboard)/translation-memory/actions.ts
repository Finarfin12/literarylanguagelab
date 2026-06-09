"use server";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function addTranslationMemory(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authorized");

  const source_phrase = formData.get("source_phrase") as string;
  const translated_phrase = formData.get("translated_phrase") as string;
  const context = formData.get("context") as string;

  const { error } = await supabase.from("translation_memory").insert({
    user_id: user.id,
    source_phrase,
    translated_phrase,
    context
  });

  if (error) throw error;
  revalidatePath("/translation-memory");
}

export async function deleteTranslationMemory(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authorized");

  const { error } = await supabase.from("translation_memory").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw error;
  revalidatePath("/translation-memory");
}
