import { createClient } from "@/utils/supabase/server";
import { BookOpen, Plus, Landmark, Globe } from "lucide-react";
import SubmitButton from "@/components/ui/SubmitButton";
import { addCulturalReference } from "./actions";

export const metadata = {
  title: "Cultural Context Library - Literary Language Lab",
};

export default async function CulturalContextPage() {
  const supabase = await createClient();
  const { data: references } = await supabase
    .from("cultural_references")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-warning-tint text-warning-ink rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
            <Landmark className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-4xl font-serif font-bold text-foreground">Cultural Context Library</h1>
            <p className="text-muted-foreground mt-2 text-lg">Ensiklopedia frasa mitologi, sejarah, dan literatur klasik.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Add Form */}
        <div className="lg:col-span-1">
          <div className="bg-card shadow-sm border border-border p-6 rounded-3xl sticky top-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-warning-ink" /> Tambah Referensi
            </h2>
            <p className="text-sm text-muted-foreground mb-6">Berkontribusi memperkaya kamus budaya agar dapat dideteksi otomatis di teks buku.</p>
            
            <form action={addCulturalReference} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Frasa (Phrase)</label>
                <input type="text" name="phrase" required placeholder="Cth: Pandora's box" className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-warning-ink/30" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Asal (Origin)</label>
                <input type="text" name="origin" placeholder="Cth: Greek Mythology" className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-warning-ink/30" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Penjelasan</label>
                <textarea name="explanation" required placeholder="Menjelaskan asal-usul atau makna mitologinya..." className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-warning-ink/30 min-h-[100px] resize-none"></textarea>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-2">Padanan Bahasa Indonesia</label>
                <input type="text" name="indonesian_equivalent" placeholder="Cth: Membuka kotak pandora" className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-warning-ink/30" />
              </div>
              
              <div className="pt-2">
                <SubmitButton className="w-full py-3 bg-warning-ink text-on-brand font-bold rounded-xl hover:bg-warning-ink/90 transition-colors shadow-lg">
                  Simpan Referensi
                </SubmitButton>
              </div>
            </form>
          </div>
        </div>

        {/* Directory List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-warning-ink" /> Direktori Kamus ({references?.length || 0})
          </h2>
          
          {references?.length === 0 ? (
            <div className="bg-muted/50 rounded-3xl p-6 md:p-12 border border-border border-dashed text-center">
              <Landmark className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-lg text-muted-foreground font-medium">Belum ada data referensi budaya.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {references?.map((item) => (
                <div key={item.id} className="bg-card shadow-sm border border-border rounded-2xl p-5 hover:border-warning-ink/30 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-serif font-bold text-xl text-foreground">{item.phrase}</h3>
                    {item.origin && (
                      <span className="px-2 py-1 bg-warning-tint text-warning-ink text-[10px] font-bold uppercase tracking-wider rounded border border-warning-ink/30">
                        {item.origin}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{item.explanation}</p>
                  
                  {item.indonesian_equivalent && (
                    <div className="bg-muted rounded-xl p-3 flex items-start gap-2 border border-border">
                      <Globe className="w-4 h-4 text-brand-ink shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Padanan Indonesia</p>
                        <p className="text-sm font-medium text-foreground">{item.indonesian_equivalent}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
