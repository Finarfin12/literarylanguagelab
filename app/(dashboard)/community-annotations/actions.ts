"use server";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function addAnnotation(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authorized");

  const term = formData.get("term") as string;
  const explanation = formData.get("explanation") as string;

  const { error } = await supabase.from("community_annotations").insert({
    user_id: user.id,
    term,
    explanation
  });

  if (error) throw error;
  
  // Award 5 XP for contributing
  const { data: profile } = await supabase.from("profiles").select("xp").eq("id", user.id).single();
  if (profile) {
     await supabase.from("profiles").update({ xp: profile.xp + 5 }).eq("id", user.id);
  }

  revalidatePath("/community-annotations");
}

export async function voteAnnotation(annotationId: string, voteType: 'upvote' | 'downvote') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authorized");

  // Check if already voted
  const { data: existingVote } = await supabase
    .from("annotation_votes")
    .select("vote_type")
    .eq("annotation_id", annotationId)
    .eq("user_id", user.id)
    .single();

  if (existingVote) {
    if (existingVote.vote_type === voteType) return; // Already voted this way

    // Change vote
    await supabase.from("annotation_votes").update({ vote_type: voteType }).eq("annotation_id", annotationId).eq("user_id", user.id);
    
    // Get current annotation counts
    const { data: ann } = await supabase.from("community_annotations").select("upvotes, downvotes").eq("id", annotationId).single();
    if (ann) {
        const newUpvotes = voteType === 'upvote' ? ann.upvotes + 1 : Math.max(0, ann.upvotes - 1);
        const newDownvotes = voteType === 'downvote' ? ann.downvotes + 1 : Math.max(0, ann.downvotes - 1);
        await supabase.from("community_annotations").update({ upvotes: newUpvotes, downvotes: newDownvotes }).eq("id", annotationId);
    }
  } else {
    // New vote
    await supabase.from("annotation_votes").insert({ annotation_id: annotationId, user_id: user.id, vote_type: voteType });
    
    // Increment counts
    const { data: ann } = await supabase.from("community_annotations").select("upvotes, downvotes").eq("id", annotationId).single();
    if (ann) {
        if (voteType === 'upvote') {
            await supabase.from("community_annotations").update({ upvotes: ann.upvotes + 1 }).eq("id", annotationId);
        } else {
            await supabase.from("community_annotations").update({ downvotes: ann.downvotes + 1 }).eq("id", annotationId);
        }
    }
  }

  revalidatePath("/community-annotations");
}
