"use client";

import { useState } from "react";
import { BookMarked, Search, Filter, Trash2, Edit3, Save, X } from "lucide-react";
import { deleteVocab, updateNotes } from "@/app/(dashboard)/vocabulary/actions";

interface VocabularyBankClientProps {
  initialVocab: any[];
}

export default function VocabularyBankClient({ initialVocab }: VocabularyBankClientProps) {
  const [vocab, setVocab] = useState(initialVocab);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");

  const filteredVocab = vocab.filter(item => {
    const matchesSearch = item.word.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.context_source && item.context_source.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLevel = levelFilter === "all" || item.mastery_level.toString() === levelFilter;
    return matchesSearch && matchesLevel;
  });

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus kata ini dari kamus?")) {
      try {
        await deleteVocab(id);
        setVocab(vocab.filter(v => v.id !== id));
      } catch (e) {
        alert("Gagal menghapus kata.");
      }
    }
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setEditNotes(item.notes || "");
  };

  const saveNotes = async (id: string) => {
    try {
      await updateNotes(id, editNotes);
      setVocab(vocab.map(v => v.id === id ? { ...v, notes: editNotes } : v));
      setEditingId(null);
    } catch (e) {
      alert("Gagal menyimpan catatan.");
    }
  };

  return (
    <>
      <div className="mb-8 flex flex-col md:flex-row items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-serif font-bold text-foreground">Vocabulary Bank</h1>
          <p className="text-muted-foreground mt-2">Kelola kata-kata yang telah Anda simpan dari teks sastra.</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari kata atau sumber..."
              className="w-full bg-card border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-brand"
            />
          </div>
          <select 
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="bg-card border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand appearance-none min-w-[120px]"
          >
            <option value="all">Semua Level</option>
            <option value="0">Level 0</option>
            <option value="1">Level 1</option>
            <option value="2">Level 2</option>
            <option value="3">Level 3</option>
            <option value="4">Level 4</option>
            <option value="5">Level 5</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {filteredVocab.length === 0 ? (
          <div className="text-center p-12 border border-dashed border-border rounded-xl">
            <BookMarked className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium text-foreground">Tidak ada kata ditemukan</h3>
            <p className="text-muted-foreground mt-2">Coba ubah kata kunci pencarian atau filter Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-8">
            {filteredVocab.map((item) => (
              <div key={item.id} className="bg-card/40 backdrop-blur-md border border-white/10 rounded-3xl p-8 hover:bg-card/60 transition-all duration-500 group relative flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-brand">{item.word}</h2>
                    <p className="text-xs text-muted-foreground mt-1">Sumber: {item.context_source}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="bg-brand/10 border border-brand/20 px-3 py-1 rounded-full text-xs font-medium text-brand">
                      Level {item.mastery_level}
                    </div>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-md hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-4 flex-1">
                  <div className="prose prose-sm dark:prose-invert text-foreground/90 max-w-none line-clamp-3">
                    <div className="whitespace-pre-wrap">{item.definition}</div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground italic font-serif leading-relaxed">"{item.context_sentence}"</p>
                  </div>

                  <div className="pt-2">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Catatan Personal</p>
                      {editingId !== item.id && (
                        <button onClick={() => startEdit(item)} className="text-xs text-brand hover:text-brand-hover flex items-center gap-1">
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                      )}
                    </div>
                    
                    {editingId === item.id ? (
                      <div className="space-y-2">
                        <textarea 
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          className="w-full bg-background border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-brand resize-none"
                          rows={3}
                          placeholder="Tambahkan catatan personal Anda di sini..."
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingId(null)} className="p-2 text-muted-foreground hover:bg-white/5 rounded-md">
                            <X className="w-4 h-4" />
                          </button>
                          <button onClick={() => saveNotes(item.id)} className="p-2 text-brand bg-brand/10 hover:bg-brand/20 rounded-md">
                            <Save className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-foreground/80 bg-white/5 p-3 rounded-lg min-h-[40px]">
                        {item.notes || <span className="text-muted-foreground italic">Tidak ada catatan.</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
