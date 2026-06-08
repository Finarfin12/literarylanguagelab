import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export default async function LibraryPage() {
  const supabase = await createClient();
  
  // Fetch all public texts
  const { data: texts, error } = await supabase
    .from("texts")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-foreground">Text Library</h1>
        <p className="text-muted-foreground mt-2">Pilih teks sastra untuk mulai membaca dan belajar.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 mb-8">
          Failed to load texts. Please check database connection.
        </div>
      )}

      {texts?.length === 0 ? (
        <div className="text-center p-12 border border-dashed border-border rounded-xl">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-medium text-foreground">Belum ada teks tersedia</h3>
          <p className="text-muted-foreground mt-2">Tambahkan teks melalui Supabase Dashboard untuk memunculkannya di sini.</p>
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
