"use client";

import Swal from 'sweetalert2';
import { useState, useEffect } from "react";
import { BookOpen, Plus, Trash2, Loader2, Quote } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface Idiom {
  id: string;
  idiom: string;
  meaning: string;
  origin: string;
  example_sentence: string;
}

export default function IdiomLibraryPage() {
  const [idioms, setIdioms] = useState<Idiom[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newIdiom, setNewIdiom] = useState("");
  const [newMeaning, setNewMeaning] = useState("");
  const [newOrigin, setNewOrigin] = useState("");
  const [newExample, setNewExample] = useState("");
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchIdioms();
  }, []);

  const fetchIdioms = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('idioms')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (!error && data) {
      setIdioms(data);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newIdiom || !newMeaning) return;
    setSaving(true);
    
    // Using a hardcoded user_id for demo if auth is not strictly required
    const { error } = await supabase.from('idioms').insert({
      idiom: newIdiom,
      meaning: newMeaning,
      origin: newOrigin,
      example_sentence: newExample
    });

    if (!error) {
      setNewIdiom("");
      setNewMeaning("");
      setNewOrigin("");
      setNewExample("");
      fetchIdioms();
    } else {
      Swal.fire({ title: "Informasi", text: String("Gagal menyimpan idiom: " + error.message), icon: "warning", confirmButtonColor: "#2fa16b" });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('idioms').delete().eq('id', id);
    if (!error) {
      setIdioms(idioms.filter(i => i.id !== id));
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10">
        <h1 className="text-[28px] md:text-4xl leading-[1.15] font-serif font-medium text-foreground flex items-center gap-3">
          <Quote className="w-8 h-8 text-brand-ink" />
          Idiom Library
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Koleksi idiom sastra dan sejarah ungkapan unik.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Add */}
        <div className="lg:col-span-1 bg-card border border-border rounded-card p-6 h-max ">
          <h2 className="text-lg font-bold text-brand-ink mb-4 uppercase tracking-wider">Tambah Idiom Baru</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Idiom</label>
              <input value={newIdiom} onChange={e => setNewIdiom(e.target.value)} placeholder="e.g. Bite the bullet" className="w-full bg-background border border-border rounded-control p-3 focus:ring-1 focus:ring-brand outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Makna</label>
              <textarea value={newMeaning} onChange={e => setNewMeaning(e.target.value)} placeholder="To endure a painful experience..." className="w-full bg-background border border-border rounded-control p-3 focus:ring-1 focus:ring-brand outline-none resize-none" rows={2} />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Asal Usul (Etimologi)</label>
              <input value={newOrigin} onChange={e => setNewOrigin(e.target.value)} placeholder="Military origin..." className="w-full bg-background border border-border rounded-control p-3 focus:ring-1 focus:ring-brand outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Contoh Kalimat</label>
              <textarea value={newExample} onChange={e => setNewExample(e.target.value)} placeholder="I had to bite the bullet..." className="w-full bg-background border border-border rounded-control p-3 focus:ring-1 focus:ring-brand outline-none resize-none" rows={2} />
            </div>
            <button onClick={handleAdd} disabled={saving || !newIdiom || !newMeaning} className="w-full py-3 bg-brand-solid text-on-brand font-bold rounded-control flex justify-center items-center gap-2 transition-all disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Simpan Idiom
            </button>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-brand-ink" /></div>
          ) : idioms.length === 0 ? (
            <div className="bg-muted border border-border rounded-card p-6 md:p-12 text-center text-muted-foreground">
              <Quote className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada idiom yang disimpan.</p>
            </div>
          ) : (
            idioms.map((idiom) => (
              <div key={idiom.id} className="bg-card border border-border hover:border-brand/30 rounded-card p-6 transition-colors group relative">
                <button onClick={() => handleDelete(idiom.id)} className="absolute top-4 right-4 text-muted-foreground hover:text-danger opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
                <h3 className="text-xl font-serif font-medium text-brand-ink mb-2">"{idiom.idiom}"</h3>
                <p className="text-foreground/90 mb-4">{idiom.meaning}</p>
                {idiom.origin && (
                  <div className="mb-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase mr-2">Origin:</span>
                    <span className="text-sm text-foreground/70">{idiom.origin}</span>
                  </div>
                )}
                {idiom.example_sentence && (
                  <div className="bg-muted p-3 rounded-control italic font-serif text-foreground/80 border-l-2 border-brand/50">
                    "{idiom.example_sentence}"
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
