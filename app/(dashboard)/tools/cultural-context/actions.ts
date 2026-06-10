"use server";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function addCulturalReference(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authorized");

  // Optional: check if user is admin, for MVP anyone logged in can add
  const phrase = formData.get("phrase") as string;
  const origin = formData.get("origin") as string;
  const explanation = formData.get("explanation") as string;
  const indonesian_equivalent = formData.get("indonesian_equivalent") as string;

  const { error } = await supabase.from("cultural_references").insert({
    phrase: phrase.trim(),
    origin: origin.trim(),
    explanation: explanation.trim(),
    indonesian_equivalent: indonesian_equivalent.trim() || null
  });

  if (error) {
    if (error.code === '23505') { // Unique violation
      throw new Error("Frasa ini sudah ada di database.");
    }
    console.error(error);
    throw new Error("Gagal menyimpan referensi budaya.");
  }

  revalidatePath("/tools/cultural-context");
}
