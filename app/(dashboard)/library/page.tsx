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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {texts?.map((text) => (
            <Link href={`/read/${text.id}`} key={text.id}>
              <div className="bg-card/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 hover:bg-card/60 hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand/10 transition-all duration-500 group relative overflow-hidden flex flex-col h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 flex-1 flex flex-col">
                  <h2 className="text-2xl font-serif font-bold text-foreground group-hover:text-brand transition-colors line-clamp-2">{text.title}</h2>
                  <p className="text-muted-foreground mt-2 italic flex-1">{text.author}</p>
                  
                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs font-medium px-3 py-1 bg-brand/10 text-brand rounded-full border border-brand/20">
                      Level {text.difficulty_level}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 group-hover:text-foreground transition-colors">
                      <BookOpen className="w-3 h-3" /> Read
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
