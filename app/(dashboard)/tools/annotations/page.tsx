"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Plus, MessageSquare, Globe, Lock, Trash2, Loader2, Tag, Download, FileText } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import Swal from "sweetalert2";

interface Annotation {
  id: string;
  highlighted_text: string;
  note: string;
  tags: string[];
  is_public: boolean;
  text_id: string;
  start_position: number;
  end_position: number;
  created_at: string;
}

export default function AnnotationsPage() {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [newText, setNewText] = useState("");
  const [newTags, setNewTags] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [selectedTextId, setSelectedTextId] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");
  const [texts, setTexts] = useState<{ id: string; title: string }[]>([]);
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: anns } = await supabase.from("annotations").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    const { data: txts } = await supabase.from("texts").select("id, title").eq("is_public", true);
    setAnnotations(anns || []);
    setTexts(txts || []);
    setLoading(false);
  }

  async function handleAdd() {
    if (!newText.trim() || !selectedTextId) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("annotations").insert({
      user_id: user?.id,
      text_id: selectedTextId,
      highlighted_text: newText,
      note: newNote,
      tags: newTags ? newTags.split(",").map((t: string) => t.trim()) : [],
      is_public: isPublic,
      start_position: 0,
      end_position: newText.length,
    });
    if (!error) {
      setNewText(""); setNewNote(""); setNewTags(""); setIsPublic(false);
      loadData();
      Swal.fire({ title: "Tersimpan!", icon: "success", timer: 1500, showConfirmButton: false });
    } else {
      Swal.fire({ title: "Gagal", text: error.message, icon: "error" });
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("annotations").delete().eq("id", id);
    if (!error) loadData();
  }

  const filtered = filter ? annotations.filter(a => a.tags?.some(t => t.toLowerCase().includes(filter.toLowerCase())) || a.highlighted_text.toLowerCase().includes(filter.toLowerCase())) : annotations;

  function exportAnnotations() {
    const md = filtered.map(a => `## ${a.highlighted_text}\n- **Tags:** ${(a.tags || []).join(", ") || "-"}\n- **Note:** ${a.note || "-"}\n- **Visibility:** ${a.is_public ? "Public" : "Private"}\n`).join("\n---\n\n");
    const blob = new Blob([`# My Annotations\n\n${md}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "annotations.md"; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="p-4 md:p-8 min-h-full animate-in fade-in duration-300">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/tools" className="flex items-center gap-2 min-h-[44px] text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /> Kembali</Link>
        <h1 className="text-[28px] md:text-4xl leading-[1.15] font-serif font-medium text-foreground flex items-center gap-3"><MessageSquare className="w-7 h-7 text-brand-ink" />My Annotations</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-card p-4 md:p-6 lg:col-span-1 space-y-4 h-max">
          <h3 className="font-bold text-foreground">Add Annotation</h3>
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Text</label>
            <select value={selectedTextId} onChange={(e) => setSelectedTextId(e.target.value)} className="w-full min-h-[44px] bg-background border border-border rounded-control p-2.5 text-sm focus:ring-1 focus:ring-brand-solid outline-none">
              <option value="">Pilih teks...</option>
              {texts.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Highlighted Text</label>
            <textarea value={newText} onChange={(e) => setNewText(e.target.value)} rows={3} placeholder="Paste highlighted text..." className="w-full bg-background border border-border rounded-control p-2.5 text-sm focus:ring-1 focus:ring-brand outline-none resize-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Note</label>
            <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} rows={2} placeholder="Your insight..." className="w-full bg-background border border-border rounded-control p-2.5 text-sm focus:ring-1 focus:ring-brand outline-none resize-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Tags (comma-separated)</label>
            <input value={newTags} onChange={(e) => setNewTags(e.target.value)} placeholder="grammar, idiom, style" className="w-full min-h-[44px] bg-background border border-border rounded-control p-2.5 text-sm focus:ring-1 focus:ring-brand-solid outline-none" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="accent-brand" />
            <span className="text-xs text-muted-foreground">{isPublic ? <Globe className="w-3.5 h-3.5 inline mr-1 text-brand-ink" /> : <Lock className="w-3.5 h-3.5 inline mr-1" />}{isPublic ? "Public" : "Private"}</span>
          </label>
          <button onClick={handleAdd} disabled={saving || !newText || !selectedTextId} className="w-full py-2.5 bg-brand-solid text-on-brand font-bold rounded-control disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Simpan
          </button>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by tag or text..." className="w-full sm:w-64 min-h-[44px] bg-background border border-border rounded-control px-3 py-2 text-sm focus:ring-1 focus:ring-brand-solid outline-none" />
            <button onClick={exportAnnotations} disabled={filtered.length === 0} className="flex items-center gap-2 px-4 py-2 min-h-[44px] bg-muted border border-border rounded-control text-sm text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50">
              <Download className="w-4 h-4" /> Export Markdown
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-brand-ink" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-50" /><p>Belum ada anotasi.</p></div>
          ) : (
            filtered.map((ann) => (
              <div key={ann.id} className="bg-card border border-border rounded-card p-4 group relative hover:border-brand/30 transition-colors">
                <button onClick={() => handleDelete(ann.id)} className="absolute top-3 right-3 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                <blockquote className="border-l-2 border-brand/40 pl-3 mb-3 text-sm font-serif italic text-foreground/80">"{ann.highlighted_text}"</blockquote>
                {ann.note && <p className="text-sm text-muted-foreground mb-3">{ann.note}</p>}
                <div className="flex flex-wrap gap-2 items-center">
                  {ann.tags?.map((t) => (<span key={t} className="px-2 py-0.5 bg-muted border border-border rounded-md text-[10px] font-bold text-muted-foreground uppercase">{t}</span>))}
                  <span className="ml-auto text-[10px] text-muted-foreground flex items-center gap-1">{ann.is_public ? <Globe className="w-3 h-3 text-brand-ink" /> : <Lock className="w-3 h-3" />}{new Date(ann.created_at).toLocaleDateString("id-ID")}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
