import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { BookOpen, Plus, Sparkles } from "lucide-react";

export default async function LibraryPage() {
  const supabase = await createClient();
  
  // Fetch all public texts
  const { data: texts, error } = await supabase
    .from("texts")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  return (
    <div className="p-8 max-w-5xl mx-auto h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-serif font-bold text-foreground">Text Library</h1>
          <p className="text-muted-foreground mt-2">Pilih teks sastra untuk mulai membaca dan belajar.</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/library/add"
            className="flex items-center gap-2 px-6 py-3 bg-brand text-background font-bold rounded-xl hover:bg-brand-hover hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-brand/20"
          >
            <Sparkles className="w-5 h-5" />
            <span>Generate & Add Text</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 mb-8">
          Failed to load texts. Please check database connection.
        </div>
      )}

      {texts?.length === 0 ? (
        <div className="text-center p-12 border border-dashed border-border rounded-xl">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-serif font-bold text-foreground mb-2">Belum ada teks tersedia</h3>
          <p className="text-muted-foreground">Klik tombol "Generate & Add Text" di atas untuk membuat teks karya sastra secara otomatis dengan AI.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {texts?.map((text) => (
            <Link key={text.id} href={`/read/${text.id}`} className="group block">
              <div className="bg-card border border-border rounded-xl p-6 h-full transition-all duration-300 hover:shadow-lg hover:shadow-brand/5 hover:border-brand/50 flex flex-col">
                <div className="mb-4">
                  <span className="inline-block px-2 py-1 text-xs font-medium bg-brand/10 text-brand rounded-full mb-3">
                    {text.difficulty}
                  </span>
                  <h2 className="text-xl font-serif font-bold text-foreground group-hover:text-brand transition-colors line-clamp-2">
                    {text.title}
                  </h2>
                  <p className="text-muted-foreground mt-1">by {text.author}</p>
                </div>
                
                <div className="mt-auto pt-4 flex items-center justify-between text-sm text-muted-foreground border-t border-border/50">
                  <span>{text.era} • {text.genre}</span>
                  <span>{text.word_count || 0} words</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
