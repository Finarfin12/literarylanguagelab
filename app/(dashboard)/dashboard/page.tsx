import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { BookOpen, BookMarked, RefreshCcw } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get total vocab count
  const { count: vocabCount } = await supabase
    .from("vocabulary")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user?.id);

  // Get due reviews count
  const now = new Date().toISOString();
  const { count: dueCount } = await supabase
    .from("vocabulary")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user?.id)
    .lte("next_review_at", now);

  return (
    <div className="p-8 max-w-6xl mx-auto h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-4xl font-serif font-bold text-foreground">
          Welcome back, {user?.user_metadata?.full_name || "Scholar"}
        </h1>
        <p className="text-muted-foreground mt-2">
          Teruskan perjalanan Anda menguasai bahasa Inggris lewat sastra.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-brand/10 text-brand rounded-lg">
              <BookMarked className="w-6 h-6" />
            </div>
            <h3 className="font-medium text-foreground">Vocabulary Bank</h3>
          </div>
          <p className="text-4xl font-serif font-bold text-foreground">{vocabCount || 0}</p>
          <p className="text-sm text-muted-foreground mt-1">Kata tersimpan</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
              <RefreshCcw className="w-6 h-6" />
            </div>
            <h3 className="font-medium text-foreground">Review Queue</h3>
          </div>
          <p className="text-4xl font-serif font-bold text-foreground">{dueCount || 0}</p>
          <p className="text-sm text-muted-foreground mt-1">Menunggu review hari ini</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link 
          href="/library"
          className="group block bg-card border border-border rounded-2xl p-8 hover:border-brand/50 hover:shadow-lg transition-all"
        >
          <BookOpen className="w-8 h-8 text-brand mb-4" />
          <h2 className="text-2xl font-serif font-bold text-foreground group-hover:text-brand transition-colors mb-2">
            Text Library
          </h2>
          <p className="text-muted-foreground">Jelajahi karya sastra publik dan mulai membaca untuk memperluas kosa kata Anda.</p>
        </Link>
        
        <Link 
          href="/review"
          className="group block bg-card border border-border rounded-2xl p-8 hover:border-blue-500/50 hover:shadow-lg transition-all"
        >
          <RefreshCcw className="w-8 h-8 text-blue-400 mb-4" />
          <h2 className="text-2xl font-serif font-bold text-foreground group-hover:text-blue-400 transition-colors mb-2">
            Spaced Repetition
          </h2>
          <p className="text-muted-foreground">Uji ingatan Anda terhadap kata-kata yang sudah disimpan agar masuk ke memori jangka panjang.</p>
        </Link>
      </div>
    </div>
  );
}
