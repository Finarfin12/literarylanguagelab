import { createClient } from "@/utils/supabase/server";
import { BookMarked, Search, Filter } from "lucide-react";

export default async function VocabularyPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: vocab, error } = await supabase
    .from("vocabulary")
    .select("*")
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-8 max-w-6xl mx-auto h-full flex flex-col">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Vocabulary Bank</h1>
          <p className="text-muted-foreground mt-2">Kelola kata-kata yang telah Anda simpan dari teks sastra.</p>
        </div>
        <div className="flex gap-2 text-sm text-brand font-medium bg-brand/10 px-4 py-2 rounded-lg">
          <BookMarked className="w-5 h-5" />
          <span>{vocab?.length || 0} Kata Disimpan</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {!vocab || vocab.length === 0 ? (
          <div className="text-center p-12 border border-dashed border-border rounded-xl">
            <BookMarked className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium text-foreground">Kamus Anda Masih Kosong</h3>
            <p className="text-muted-foreground mt-2">Mulailah membaca teks di Library dan simpan kata-kata baru.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
            {vocab.map((item) => (
              <div key={item.id} className="bg-card border border-border rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:border-brand/50 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-brand">{item.word}</h2>
                    <p className="text-xs text-muted-foreground mt-1">Sumber: {item.context_source}</p>
                  </div>
                  <div className="bg-white/5 border border-border px-2 py-1 rounded text-xs text-muted-foreground">
                    Level {item.mastery_level}
                  </div>
                </div>

                <div className="mb-4 flex-1">
                  <div className="prose prose-sm prose-invert text-foreground/90 max-w-none line-clamp-3">
                    <div className="whitespace-pre-wrap">{item.definition}</div>
                  </div>
                </div>
                
                <div className="mt-auto pt-4 border-t border-border/50">
                  <p className="text-sm text-muted-foreground italic">"{item.context_sentence}"</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
