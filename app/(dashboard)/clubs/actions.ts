"use server";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createClub(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authorized");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;

  const { data: club, error } = await supabase.from("clubs").insert({
    name,
    description,
    owner_id: user.id
  }).select("id").single();

  if (error || !club) throw error;

  // Add as owner member
  await supabase.from("club_members").insert({
    club_id: club.id,
    user_id: user.id,
    role: "owner"
  });

  revalidatePath("/clubs");
}

export async function joinClub(clubId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authorized");

  await supabase.from("club_members").insert({
    club_id: clubId,
    user_id: user.id,
    role: "member"
  });

  revalidatePath("/clubs");
}

export async function postDiscussion(clubId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authorized");

  const chapter = formData.get("chapter") as string;
  const message = formData.get("message") as string;

  await supabase.from("club_discussions").insert({
    club_id: clubId,
    user_id: user.id,
    chapter,
    message
  });

  revalidatePath(`/clubs/${clubId}`);
}
