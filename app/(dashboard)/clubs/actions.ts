"use server";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createClub(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authorized");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const is_public = formData.get("is_public") === "true";

  const { data: club, error } = await supabase.from("study_groups").insert({
    name,
    description,
    creator_id: user.id,
    is_public,
    max_members: 10
  }).select("id").single();

  if (error || !club) {
    console.error(error);
    throw new Error("Gagal membuat klub membaca.");
  }

  // Add as admin/creator member
  await supabase.from("group_members").insert({
    group_id: club.id,
    user_id: user.id,
    role: "admin"
  });

  revalidatePath("/clubs");
  redirect(`/clubs/${club.id}`);
}

export async function joinClub(clubId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authorized");

  const { error } = await supabase.from("group_members").insert({
    group_id: clubId,
    user_id: user.id,
    role: "member"
  });

  if (error) {
    console.error(error);
    throw new Error("Gagal bergabung ke klub.");
  }

  revalidatePath("/clubs");
  redirect(`/clubs/${clubId}`);
}

export async function postDiscussion(clubId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authorized");

  const chapter_or_paragraph = formData.get("chapter_or_paragraph") as string;
  const message = formData.get("message") as string;

  const { error } = await supabase.from("group_discussions").insert({
    group_id: clubId,
    user_id: user.id,
    chapter_or_paragraph,
    message
  });

  if (error) {
    console.error("Post discussion error:", error);
    throw new Error("Gagal mengirim pesan.");
  }

  revalidatePath(`/clubs/${clubId}`);
}
