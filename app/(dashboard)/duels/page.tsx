import { createClient } from "@/utils/supabase/server";
import { submitDuel, voteDuelSubmission } from "./actions";
import SubmitButton from "@/components/ui/SubmitButton";
import { Swords, ThumbsUp, Medal, Sparkles, User } from "lucide-react";
import Link from "next/link";

export default async function DuelsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get active duel
  const { data: duel } = await supabase
    .from("translation_duels")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Get submissions
  const { data: submissions } = await supabase
    .from("duel_submissions")
    .select(`
      *,
      profiles:user_id ( full_name, username, avatar_url )
    `)
    .eq("duel_id", duel?.id)
    .order("votes", { ascending: false });

  const hasSubmitted = submissions?.some((s: any) => s.user_id === user?.id);

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center p-4 bg-purple-500/10 rounded-full mb-6">
          <Swords className="w-12 h-12 text-purple-500" />
        </div>
        <h1 className="text-4xl font-serif font-bold text-foreground">Translation Duels</h1>
        <p className="text-muted-foreground mt-4 text-lg">Adu kemampuan menerjemahkan Anda melawan ratusan penerjemah lain. Siapa yang bisa menghasilkan terjemahan paling puitis?</p>
      </div>

      {duel && (
        <div className="bg-card shadow-xl border-2 border-purple-500/20 rounded-3xl p-8 mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-purple-500 text-white px-4 py-1 rounded-bl-2xl font-bold text-sm tracking-wider uppercase">
            {duel.difficulty}
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">{duel.title}</h2>
          <div className="bg-muted p-6 rounded-2xl font-serif text-xl leading-relaxed text-foreground border border-border">
            "{duel.original_text}"
          </div>

          {!hasSubmitted ? (
            <form action={submitDuel} className="mt-6">
              <input type="hidden" name="duel_id" value={duel.id} />
              <textarea 
                name="translated_text" 
                required 
                placeholder="Tuliskan terjemahan terbaik Anda di sini..."
                className="w-full bg-background border border-border rounded-xl p-4 min-h-[150px] font-serif text-lg focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none"
              ></textarea>
              <div className="mt-4 flex justify-end">
                <SubmitButton className="px-8 py-3 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 transition-colors flex items-center gap-2">
                  <Swords className="w-5 h-5" /> Submit Translation (+15 XP)
                </SubmitButton>
              </div>
            </form>
          ) : (
            <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 text-purple-600 rounded-xl flex items-center gap-3 font-bold">
              <Sparkles className="w-5 h-5" />
              Anda telah berpartisipasi dalam duel ini! Gulir ke bawah untuk melihat peringkat Anda.
            </div>
          )}
        </div>
      )}

      <h3 className="text-2xl font-serif font-bold mb-6 flex items-center gap-3">
        <Medal className="w-6 h-6 text-amber-500" /> Leaderboard Duel Ini
      </h3>

      <div className="space-y-4 mb-12">
        {submissions?.map((sub: any, index: number) => (
          <div key={sub.id} className={`bg-card shadow-sm border ${sub.user_id === user?.id ? 'border-purple-500 shadow-purple-500/10' : 'border-border'} rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-center`}>
            <div className="text-3xl font-bold text-muted-foreground w-12 text-center shrink-0">
              {index + 1}
            </div>
            
            <div className="flex-1 w-full">
              <p className="font-serif text-xl text-foreground mb-4 leading-relaxed">{sub.translated_text}</p>
              
              <div className="flex flex-wrap items-center justify-between gap-4">
                <Link href={`/p/${sub.profiles?.username}`} className="flex items-center gap-3 group hover:opacity-80 transition-opacity">
                  {sub.profiles?.avatar_url ? (
                    <img src={sub.profiles.avatar_url} className="w-8 h-8 rounded-full object-cover border border-border" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-brand" />
                    </div>
                  )}
                  <span className="text-sm font-bold text-foreground group-hover:text-purple-500 transition-colors">{sub.profiles?.full_name || "Anon"}</span>
                </Link>
                
                {sub.ai_feedback && (
                  <div className="text-xs text-brand bg-brand/10 px-3 py-1.5 rounded-full border border-brand/20 max-w-sm truncate">
                    ✨ AI Feedback: {sub.ai_feedback}
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 flex flex-row md:flex-col items-center justify-center md:border-l border-t md:border-t-0 border-border md:pl-6 pt-4 md:pt-0 w-full md:w-auto">
              <form action={async () => { "use server"; await voteDuelSubmission(sub.id); }}>
                <button className="p-3 text-muted-foreground hover:text-purple-500 hover:bg-purple-500/10 rounded-full transition-colors mb-1" title="Vote">
                  <ThumbsUp className="w-6 h-6" />
                </button>
              </form>
              <div className="text-center">
                <span className="font-bold text-xl block">{sub.votes}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-wider block -mt-1">Votes</span>
              </div>
            </div>
          </div>
        ))}
        {submissions?.length === 0 && (
          <p className="text-muted-foreground italic text-center py-8">Belum ada penantang. Jadilah yang pertama!</p>
        )}
      </div>
    </div>
  );
}
