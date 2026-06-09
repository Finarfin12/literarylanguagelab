import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { BookOpen, Send, User } from "lucide-react";
import SubmitButton from "@/components/ui/SubmitButton";
import { postDiscussion } from "../actions";

export default async function ClubRoomPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!club) return notFound();

  const { data: discussions } = await supabase
    .from("club_discussions")
    .select(`
      *,
      profiles:user_id ( full_name, username, avatar_url )
    `)
    .eq("club_id", club.id)
    .order("created_at", { ascending: true });

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 border-b border-border pb-6">
        <h1 className="text-3xl font-serif font-bold text-foreground flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-emerald-500" />
          {club.name}
        </h1>
        <p className="text-muted-foreground mt-2">{club.description}</p>
      </div>

      <div className="flex-1 bg-card shadow-sm border border-border rounded-3xl p-6 flex flex-col mb-6">
        <div className="flex-1 overflow-y-auto space-y-6 mb-6">
          {discussions?.length === 0 ? (
            <p className="text-center text-muted-foreground italic mt-10">Belum ada diskusi di klub ini. Mulai percakapan sekarang!</p>
          ) : (
            discussions?.map((msg: any) => (
              <div key={msg.id} className="flex gap-4">
                <img src={msg.profiles?.avatar_url || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-full object-cover shrink-0 border border-border" />
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-bold text-foreground">{msg.profiles?.full_name}</span>
                    {msg.chapter && <span className="text-xs bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-bold">Bab: {msg.chapter}</span>}
                  </div>
                  <div className="bg-muted p-4 rounded-2xl rounded-tl-none border border-border text-foreground">
                    {msg.message}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <form action={async (fd) => { "use server"; await postDiscussion(club.id, fd); }} className="flex flex-col gap-3 pt-4 border-t border-border">
          <input type="text" name="chapter" placeholder="Bab / Topik (Opsional)" className="bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500 w-1/3" />
          <div className="flex gap-3">
            <textarea name="message" required placeholder="Tuliskan interpretasi terjemahan Anda..." className="flex-1 bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500 resize-none h-14"></textarea>
            <SubmitButton className="px-6 py-2 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center">
              <Send className="w-5 h-5" />
            </SubmitButton>
          </div>
        </form>
      </div>
    </div>
  );
}
