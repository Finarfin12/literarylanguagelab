import { createClient } from "@/utils/supabase/server";
import { addGlossary, deleteGlossary } from "./actions";
import SubmitButton from "@/components/ui/SubmitButton";
import { BookOpen, Plus, Trash2, Library } from "lucide-react";

export default async function GlossaryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: glossaries } = await supabase
    .from("glossaries")
    .select("*")
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10">
         <h1 className="text-2xl md:text-4xl font-serif font-bold text-foreground flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-warning-ink" />
          Glossary Builder
        </h1>
        <p className="text-muted-foreground mt-2">Bangun kamus spesifik per buku atau penulis untuk menjaga konsistensi istilah teknis/sastra.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-card shadow-sm border border-border p-6 rounded-3xl sticky top-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-warning-ink" /> Add Term</h2>
            <form action={addGlossary} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Term / Istilah</label>
                <input type="text" name="term" required className="w-full mt-1 bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-warning-ink/30" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Preferred Translation</label>
                <input type="text" name="preferred_translation" required className="w-full mt-1 bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-warning-ink/30" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Buku (Opsional)</label>
                  <input type="text" name="book_title" className="w-full mt-1 bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-warning-ink/30" />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Penulis (Opsional)</label>
                  <input type="text" name="author" className="w-full mt-1 bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-warning-ink/30" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Notes (Opsional)</label>
                <textarea name="notes" className="w-full mt-1 bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:border-warning-ink/30" rows={2}></textarea>
              </div>
              <SubmitButton className="w-full py-3 bg-warning-ink text-on-brand font-bold rounded-xl hover:bg-warning-ink/90 transition-colors">
                Save to Glossary
              </SubmitButton>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          {glossaries?.length === 0 ? (
            <div className="bg-card shadow-sm border border-dashed border-border rounded-3xl p-6 md:p-12 text-center text-muted-foreground">
              <Library className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada istilah glosarium yang ditambahkan.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {glossaries?.map(g => (
                <div key={g.id} className="bg-card shadow-sm border border-border rounded-2xl p-5 flex flex-col md:flex-row gap-4 justify-between group">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-serif text-xl font-bold text-warning-ink">{g.term}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-serif text-xl font-bold text-foreground">{g.preferred_translation}</span>
                    </div>
                    {(g.book_title || g.author) && (
                      <div className="flex gap-2 mb-2">
                        {g.book_title && <span className="text-xs px-2 py-1 bg-muted rounded-md border border-border text-muted-foreground">Buku: {g.book_title}</span>}
                        {g.author && <span className="text-xs px-2 py-1 bg-muted rounded-md border border-border text-muted-foreground">Penulis: {g.author}</span>}
                      </div>
                    )}
                    {g.notes && <p className="text-sm text-muted-foreground">Catatan: {g.notes}</p>}
                  </div>
                  <form action={async () => { "use server"; await deleteGlossary(g.id); }} className="shrink-0">
                    <button className="p-2 text-muted-foreground hover:text-danger bg-muted rounded-xl hover:bg-danger-tint transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
