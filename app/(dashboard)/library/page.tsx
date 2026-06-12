import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { BookOpen, Plus, Sparkles, Search, Library as LibraryIcon } from "lucide-react";
import TopActions from "@/components/TopActions";
import DeleteTextButton from "@/components/library/DeleteTextButton";

export default async function LibraryPage({ searchParams }: { searchParams: { q?: string } }) {
  const supabase = await createClient();
  const query = await searchParams;
  const searchTerm = query?.q || "";

  let queryBuilder = supabase
    .from("texts")
    .select("*", { count: "exact" })
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (searchTerm) {
    queryBuilder = queryBuilder.or(`title.ilike.%${searchTerm}%,author.ilike.%${searchTerm}%`);
  }

  const { data: texts, error, count } = await queryBuilder;

  let isAdmin = false;
  let enablePreview = true; // default to true
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role, preferences').eq('id', user.id).single();
    if (profile) {
      if (profile.role === 'admin') isAdmin = true;
      if (profile.preferences?.reading?.enable_vocab_preview === false) enablePreview = false;
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-serif font-bold text-foreground">Text Library</h1>
          <p className="text-muted-foreground mt-2">Pilih teks sastra untuk mulai membaca dan belajar. ({count ?? "?"} teks)</p>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <TopActions className="flex items-center gap-3 shrink-0 self-end sm:self-auto" />
            <form className="relative flex-1 w-full sm:min-w-[250px]">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              name="q"
              defaultValue={searchTerm}
              placeholder="Cari judul atau penulis..." 
              className="w-full bg-card border border-foreground/20 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all text-foreground shadow-sm"
            />
            </form>
          </div>
          <Link
            href="/library/add"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-brand text-background font-bold rounded-xl hover:bg-brand-hover hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-brand/20 whitespace-nowrap"
          >
            <Sparkles className="w-5 h-5" />
            <span>Generate & Add Text</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 mb-8">
          <p className="font-bold">Supabase Error:</p>
          <pre className="text-xs mt-2 whitespace-pre-wrap">{JSON.stringify(error, null, 2)}</pre>
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
            <div key={text.id} className="relative group">
              {isAdmin && <DeleteTextButton textId={text.id} title={text.title} />}
              <Link href={enablePreview ? `/preview/${text.id}` : `/read/${text.id}`} className="block h-full">
                <div className="bg-card shadow-sm backdrop-blur-md border border-border rounded-3xl p-6 hover:bg-card shadow-sm hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand/10 transition-all duration-500 relative overflow-hidden flex flex-col h-full">
                  <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10 flex-1 flex flex-col">
                    <h2 className="text-2xl font-serif font-bold text-foreground group-hover:text-brand transition-colors line-clamp-2 pr-10">{text.title}</h2>
                  <p className="text-muted-foreground mt-2 italic flex-1">{text.author}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    {text.era && <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 bg-muted border border-border rounded-md text-muted-foreground">{text.era}</span>}
                    {text.genre && <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 bg-muted border border-border rounded-md text-muted-foreground">{text.genre}</span>}
                  </div>

                  <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-xs font-medium px-3 py-1 bg-brand/10 text-brand rounded-full border border-brand/20">
                      Level {text.difficulty}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 group-hover:text-foreground transition-colors">
                      <BookOpen className="w-3 h-3" /> {enablePreview ? "Preview" : "Read"}
                    </span>
                  </div>
                </div>
              </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
