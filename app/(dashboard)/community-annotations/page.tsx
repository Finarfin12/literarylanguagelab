import { createClient } from "@/utils/supabase/server";
import { addAnnotation, voteAnnotation } from "./actions";
import SubmitButton from "@/components/ui/SubmitButton";
import { Users, ThumbsUp, ThumbsDown, MessageCircle, PenTool } from "lucide-react";
import Link from "next/link";

export default async function CommunityAnnotationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Fetch annotations joined with user profiles (using a trick since profiles is public)
  const { data: annotations } = await supabase
    .from("community_annotations")
    .select(`
      *,
      profiles:user_id ( full_name, username, avatar_url )
    `)
    .order("upvotes", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div className="p-8 max-w-6xl mx-auto h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-6">
         <div>
             <h1 className="text-4xl font-serif font-bold text-foreground flex items-center justify-center md:justify-start gap-3">
              <Users className="w-8 h-8 text-rose-500" />
              Shared Annotations
            </h1>
            <p className="text-muted-foreground mt-2 text-lg max-w-2xl">Ensiklopedia terjemahan sastra yang dibangun oleh komunitas. Berikan interpretasi Anda pada frasa sulit dan dapatkan upvote!</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-1">
          <div className="bg-card shadow-sm border border-border p-6 rounded-3xl sticky top-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><PenTool className="w-5 h-5 text-rose-500" /> Submit Annotation</h2>
            <p className="text-sm text-muted-foreground mb-6">Bagikan interpretasi Anda untuk sebuah kata sastra. Mendapatkan upvote akan menaikkan XP Anda!</p>
            <form action={addAnnotation} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Target Word / Phrase</label>
                <input type="text" name="term" required placeholder="Contoh: Ephemeral" className="w-full mt-1 bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-rose-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Your Literary Explanation</label>
                <textarea name="explanation" required placeholder="Jelaskan nuansa maknanya dalam sastra..." className="w-full mt-1 bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-rose-500 min-h-[150px] resize-none"></textarea>
              </div>
              <SubmitButton className="w-full py-3 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-colors">
                Share with Community
              </SubmitButton>
            </form>
          </div>
        </div>

        {/* Feed Column */}
        <div className="lg:col-span-2 space-y-6">
          {annotations?.length === 0 ? (
            <div className="bg-card shadow-sm border border-dashed border-border rounded-3xl p-12 text-center text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50 text-rose-500" />
              <p>Belum ada anotasi komunitas. Jadilah yang pertama!</p>
            </div>
          ) : (
            annotations?.map((ann: any) => (
              <div key={ann.id} className="bg-card shadow-sm border border-border rounded-3xl p-6 flex gap-4 transition-transform hover:-translate-y-1 hover:shadow-md">
                
                {/* Voting Column */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <form action={async () => { "use server"; await voteAnnotation(ann.id, 'upvote'); }}>
                    <button className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-full transition-colors" title="Upvote">
                      <ThumbsUp className="w-5 h-5" />
                    </button>
                  </form>
                  <span className={`font-bold ${ann.upvotes - ann.downvotes > 0 ? 'text-rose-500' : 'text-muted-foreground'}`}>
                    {ann.upvotes - ann.downvotes}
                  </span>
                  <form action={async () => { "use server"; await voteAnnotation(ann.id, 'downvote'); }}>
                    <button className="p-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-full transition-colors" title="Downvote">
                      <ThumbsDown className="w-5 h-5" />
                    </button>
                  </form>
                </div>

                {/* Content Column */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-serif font-bold text-2xl text-foreground">{ann.term}</h3>
                  </div>
                  <p className="text-foreground/90 leading-relaxed mb-6 bg-muted/50 p-4 rounded-2xl border border-border/50">
                    "{ann.explanation}"
                  </p>
                  
                  {/* Author Meta */}
                  <div className="flex items-center gap-3">
                    {ann.profiles?.avatar_url ? (
                        <img src={ann.profiles.avatar_url} className="w-8 h-8 rounded-full border border-border object-cover" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center">
                            <Users className="w-4 h-4 text-brand" />
                        </div>
                    )}
                    <div className="text-sm">
                        <Link href={`/p/${ann.profiles?.username}`} className="font-bold text-foreground hover:text-rose-500 transition-colors">
                            {ann.profiles?.full_name || "Anon Translator"}
                        </Link>
                        <span className="text-muted-foreground ml-2">@{ann.profiles?.username}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
