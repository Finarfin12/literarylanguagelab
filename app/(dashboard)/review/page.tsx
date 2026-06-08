import { createClient } from "@/utils/supabase/server";
import ReviewClient from "@/components/vocabulary/ReviewClient";

export default async function ReviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch words due for review (next_review_at <= now)
  const now = new Date().toISOString();
  
  const { data: dueVocab, error } = await supabase
    .from("vocabulary")
    .select("*")
    .eq("user_id", user?.id)
    .lte("next_review_at", now)
    .order("next_review_at", { ascending: true })
    .limit(20);

  return (
    <div className="h-full bg-background flex flex-col">
      <div className="p-8 pb-4">
        <h1 className="text-3xl font-serif font-bold text-foreground">Spaced Repetition Review</h1>
        <p className="text-muted-foreground mt-2">Waktunya me-review kosakata sastra Anda.</p>
      </div>

      <div className="flex-1 overflow-auto p-8">
        <ReviewClient dueVocab={dueVocab || []} />
      </div>
    </div>
  );
}
