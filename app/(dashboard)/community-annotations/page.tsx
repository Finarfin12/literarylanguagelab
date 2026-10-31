import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { addAnnotation, voteAnnotation } from "./actions";
import { MessageSquare, ArrowBigUp, ArrowBigDown, ThumbsUp } from "lucide-react";
import Image from "next/image";

export default async function CommunityAnnotationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch annotations with user profiles
  const { data: annotations } = await supabase
    .from("community_annotations")
    .select(`
      *,
      profiles:user_id (username, avatar_url)
    `)
    .order("upvotes", { ascending: false });

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 border-b border-border pb-6">
        <div className="p-4 bg-orange-500/10 rounded-2xl">
          <MessageSquare className="w-8 h-8 text-orange-500" />
        </div>
        <div>
          <h1 className="text-3xl font-serif font-bold">Shared Annotations</h1>
          <p className="text-muted-foreground">Kamus dan catatan kolaboratif dari komunitas Literary Lab.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Form to add */}
        <div className="md:col-span-1">
          <div className="bg-card border border-border p-6 rounded-3xl sticky top-6">
            <h2 className="font-bold font-serif mb-4 flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-orange-500" />
              Bagikan Catatan
            </h2>
            <form action={addAnnotation} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Kata / Frasa</label>
                <input 
                  name="term" 
                  required 
                  placeholder="Misal: 'In vain have I struggled...'"
                  className="w-full mt-1 bg-muted border border-border rounded-xl px-4 py-2 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-muted-foreground">Penjelasan / Makna</label>
                <textarea 
                  name="explanation" 
                  required 
                  rows={4}
                  placeholder="Jelaskan makna atau konteks kutipan tersebut..."
                  className="w-full mt-1 bg-muted border border-border rounded-xl px-4 py-2 focus:border-orange-500 focus:outline-none resize-none"
                />
              </div>
              <button 
                type="submit" 
                className="w-full py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors"
              >
                + Tambahkan
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: List of annotations */}
        <div className="md:col-span-2 space-y-4">
          {annotations?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-3xl">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Belum ada catatan komunitas. Jadilah yang pertama membagikan ilmu!</p>
            </div>
          ) : (
            annotations?.map((ann: any) => (
              <div key={ann.id} className="bg-card border border-border p-6 rounded-3xl flex gap-6 hover:shadow-md transition-all">
                {/* Voting column */}
                <div className="flex flex-col items-center gap-1">
                  <form action={voteAnnotation.bind(null, ann.id, "upvote")}>
                    <button type="submit" className="p-1 text-muted-foreground hover:text-orange-500 transition-colors hover:bg-orange-500/10 rounded">
                      <ArrowBigUp className="w-6 h-6" />
                    </button>
                  </form>
                  <span className="font-bold text-lg text-foreground">{ann.upvotes - ann.downvotes}</span>
                  <form action={voteAnnotation.bind(null, ann.id, "downvote")}>
                    <button type="submit" className="p-1 text-muted-foreground hover:text-rose-500 transition-colors hover:bg-rose-500/10 rounded">
                      <ArrowBigDown className="w-6 h-6" />
                    </button>
                  </form>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="font-serif font-bold text-xl text-foreground mb-2">{ann.term}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-4 whitespace-pre-wrap">{ann.explanation}</p>
                  
                  {/* Author Meta */}
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-muted">
                      {ann.profiles?.avatar_url ? (
                        <Image src={ann.profiles.avatar_url} alt="Avatar" width={32} height={32} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full bg-orange-500/20 text-orange-600 flex items-center justify-center font-bold text-xs uppercase">
                          {ann.profiles?.username?.[0] || "?"}
                        </div>
                      )}
                    </div>
                    <div className="text-sm">
                      <span className="font-semibold text-foreground">@{ann.profiles?.username || "Unknown"}</span>
                      <span className="text-muted-foreground ml-2">
                        {new Date(ann.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
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
