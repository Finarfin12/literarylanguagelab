import { createClient } from "@/utils/supabase/server";
import ReviewClient from "@/components/vocabulary/ReviewClient";

export default async function ReviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch user preferences
  const { data: profile } = await supabase.from('profiles').select('preferences').eq('id', user?.id).single();
  const learningPrefs = profile?.preferences?.learning || { cards_per_session: 20, show_context: true };
  const cardLimit = learningPrefs.cards_per_session || 20;

  // Fetch words due for review (next_review_at <= now)
  const now = new Date().toISOString();
  
  const { data: dueVocab, error } = await supabase
    .from("vocabulary")
    .select("*")
    .eq("user_id", user?.id)
    .lte("next_review_at", now)
    .order("next_review_at", { ascending: true })
    .limit(cardLimit);

  return (
    <div className="h-full bg-background flex flex-col">
      <div className="pt-20 px-6 pb-4 md:p-8 md:pb-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <h1 className="text-[28px] md:text-4xl leading-[1.15] font-serif font-medium text-foreground pr-10">Review Kosakata (Spaced Repetition)</h1>
        <p className="text-muted-foreground mt-2 text-base md:text-lg">Waktunya me-review kosakata sastra Anda.</p>
      </div>

      <div className="flex-1 overflow-auto px-4 pb-6 md:p-8">
        <ReviewClient dueVocab={dueVocab || []} learningPrefs={learningPrefs} />
      </div>
    </div>
  );
}
