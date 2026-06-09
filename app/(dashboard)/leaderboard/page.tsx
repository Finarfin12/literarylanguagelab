import { createClient } from "@/utils/supabase/server";
import { Trophy, Star, Zap, Library, User } from "lucide-react";
import Link from "next/link";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: topUsers } = await supabase
    .from("profiles")
    .select("id, full_name, username, avatar_url, xp, streak, vocab_count")
    .order("xp", { ascending: false })
    .limit(50);

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center p-4 bg-amber-500/10 rounded-full mb-6">
          <Trophy className="w-12 h-12 text-amber-500" />
        </div>
        <h1 className="text-4xl font-serif font-bold text-foreground">Global Leaderboard</h1>
        <p className="text-muted-foreground mt-4 text-lg">Peringkat para maestro penerjemahan. Terus selesaikan tantangan dan koleksi kosakata untuk mendaki puncak klasemen!</p>
      </div>

      <div className="bg-card shadow-sm border border-border rounded-3xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-6 bg-muted/50 border-b border-border font-bold text-sm text-muted-foreground uppercase tracking-wider">
          <div className="col-span-1 text-center">Rank</div>
          <div className="col-span-5">Translator</div>
          <div className="col-span-2 text-center flex items-center justify-center gap-2"><Star className="w-4 h-4"/> XP</div>
          <div className="col-span-2 text-center flex items-center justify-center gap-2"><Zap className="w-4 h-4 text-amber-500"/> Streak</div>
          <div className="col-span-2 text-center flex items-center justify-center gap-2"><Library className="w-4 h-4"/> Vocab</div>
        </div>

        <div className="divide-y divide-border">
          {topUsers?.map((u, index) => (
            <Link key={u.id} href={`/p/${u.username}`} className="grid grid-cols-12 gap-4 p-6 items-center hover:bg-muted/30 transition-colors group">
              <div className="col-span-1 text-center">
                <span className={`text-xl font-bold ${index === 0 ? 'text-amber-500' : index === 1 ? 'text-slate-400' : index === 2 ? 'text-amber-700' : 'text-muted-foreground'}`}>
                  #{index + 1}
                </span>
              </div>
              <div className="col-span-5 flex items-center gap-4">
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt={u.full_name || "User"} className="w-12 h-12 rounded-full object-cover border border-border group-hover:border-amber-500/50 transition-colors" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center border border-brand/20">
                    <User className="w-6 h-6 text-brand" />
                  </div>
                )}
                <div>
                  <p className="font-bold text-foreground group-hover:text-amber-500 transition-colors">{u.full_name || "Anon Translator"}</p>
                  <p className="text-sm text-muted-foreground">@{u.username}</p>
                </div>
              </div>
              <div className="col-span-2 text-center font-bold text-lg">{u.xp}</div>
              <div className="col-span-2 text-center font-bold text-amber-500">{u.streak} <span className="text-xs text-muted-foreground">days</span></div>
              <div className="col-span-2 text-center font-bold text-blue-500">{u.vocab_count} <span className="text-xs text-muted-foreground">words</span></div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
