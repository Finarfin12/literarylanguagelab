"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function addText(formData: FormData) {
  const supabase = await createClient();
  
  const title = formData.get("title") as string;
  const author = formData.get("author") as string;
  const content = formData.get("content") as string;
  const difficulty = parseInt(formData.get("difficulty") as string) || 1;

  if (!title || !author || !content) {
    throw new Error("Missing required fields");
  }

  const { error } = await supabase
    .from("texts")
    .insert([{ title, author, content, difficulty_level: difficulty }]);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/library");
  redirect("/library");
}
