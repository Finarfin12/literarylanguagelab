import { createClient } from "@/utils/supabase/server";
import { addTranslationMemory, deleteTranslationMemory } from "./actions";
import SubmitButton from "@/components/ui/SubmitButton";
import { Database, Plus, Trash2, Library } from "lucide-react";

export default async function TranslationMemoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: memories } = await supabase
    .from("translation_memory")
    .select("*")
    .eq("user_id", user?.id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10">
         <h1 className="text-[28px] md:text-4xl leading-[1.15] font-serif font-medium text-foreground flex items-center gap-3">
          <Database className="w-8 h-8 text-brand-ink" />
          Translation Memory
        </h1>
        <p className="text-muted-foreground mt-2">Simpan frasa dan terjemahan favorit Anda agar konsisten di proyek berikutnya.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-card shadow-sm border border-border p-6 rounded-card sticky top-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-brand-ink" /> Add Phrase</h2>
            <form action={addTranslationMemory} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Source Phrase (English)</label>
                <textarea name="source_phrase" required className="w-full mt-1 bg-background border border-border rounded-control p-3 text-sm focus:outline-none focus:border-brand" rows={3}></textarea>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Translated Phrase</label>
                <textarea name="translated_phrase" required className="w-full mt-1 bg-background border border-border rounded-control p-3 text-sm focus:outline-none focus:border-brand" rows={3}></textarea>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Context (Optional)</label>
                <input type="text" name="context" className="w-full mt-1 bg-background border border-border rounded-control p-3 text-sm focus:outline-none focus:border-brand" />
              </div>
              <SubmitButton className="w-full py-3 bg-brand-solid text-on-brand font-bold rounded-control hover:bg-brand-hover transition-colors">
                Save Memory
              </SubmitButton>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          {memories?.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-card p-6 md:p-12 text-center text-muted-foreground">
              <Library className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada memori terjemahan yang disimpan.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {memories?.map(mem => (
                <div key={mem.id} className="bg-card border border-border rounded-card p-5 flex flex-col md:flex-row gap-4 justify-between group">
                  <div className="flex-1">
                    <p className="font-serif text-lg font-medium text-brand-ink mb-1">{mem.source_phrase}</p>
                    <p className="font-serif text-lg text-foreground mb-3">{mem.translated_phrase}</p>
                    {mem.context && <p className="text-xs text-muted-foreground italic">Konteks: {mem.context}</p>}
                  </div>
                  <form action={async () => { "use server"; await deleteTranslationMemory(mem.id); }} className="shrink-0">
                    <button className="p-2 text-muted-foreground hover:text-danger bg-muted rounded-control hover:bg-danger-tint transition-colors opacity-0 group-hover:opacity-100">
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
