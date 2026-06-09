"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function addText(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authorized");

  const title = formData.get("title") as string;
  const author = formData.get("author") as string;
  const content = formData.get("content") as string;
  const era = formData.get("era") as string || null;
  const genre = formData.get("genre") as string || null;
  const difficulty = formData.get("difficulty") as string || "intermediate";

  if (!title || !author || !content) {
    throw new Error("Missing required fields");
  }

  const { error } = await supabase
    .from("texts")
    .insert([{ title, author, content, era, genre, difficulty, is_public: true }]);

  if (error) {
    console.error("addText error:", error);
    throw new Error(error.message);
  }

  revalidatePath("/library");
  redirect("/library");
}
