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
    <div className="p-8 max-w-6xl mx-auto min-h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-serif font-bold text-foreground">Vocabulary Bank</h1>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-8">
            {vocab.map((item) => (
              <div key={item.id} className="bg-card/40 backdrop-blur-md border border-white/10 rounded-3xl p-8 hover:bg-card/60 hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand/10 transition-all duration-500 group relative overflow-hidden flex flex-col h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-brand">{item.word}</h2>
                    <p className="text-xs text-muted-foreground mt-1">Sumber: {item.context_source}</p>
                  </div>
                  <div className="bg-brand/10 border border-brand/20 px-3 py-1 rounded-full text-xs font-medium text-brand">
                    Level {item.mastery_level}
                  </div>
                </div>

                <div className="mb-4 flex-1">
                  <div className="prose prose-sm prose-invert text-foreground/90 max-w-none line-clamp-3">
                    <div className="whitespace-pre-wrap">{item.definition}</div>
                  </div>
                </div>
                
                <div className="mt-auto pt-6 border-t border-white/5">
                  <p className="text-sm text-muted-foreground italic font-serif leading-relaxed">"{item.context_sentence}"</p>
                </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
