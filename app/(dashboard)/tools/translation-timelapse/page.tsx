"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Clock, GitCompare, Loader2, ChevronLeft, ChevronRight, Plus, Save } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import Swal from "sweetalert2";

interface Revision {
  id: string;
  version: number;
  content: string;
  changes_summary: string | null;
  created_at: string;
}
interface Translation {
  id: string;
  original_passage: string;
  user_translation: string;
  created_at: string;
  text_id: string;
  texts?: { title: string };
}

export default function TimelapsePage() {
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [selected, setSelected] = useState<Translation | null>(null);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [compareVersion, setCompareVersion] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [addContent, setAddContent] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => { loadTranslations(); }, []);

  async function loadTranslations() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("translations").select("*, texts(title)").eq("user_id", user.id).order("created_at", { ascending: false });
    setTranslations(data || []);
    setLoading(false);
  }

  async function loadRevisions(transId: string) {
    const { data } = await supabase.from("translation_revisions").select("*").eq("translation_id", transId).order("version", { ascending: true });
    setRevisions(data || []);
    setCompareVersion(data && data.length >= 2 ? data[data.length - 2].version : 0);
  }

  function selectTranslation(t: Translation) {
    setSelected(t);
    loadRevisions(t.id);
  }

  async function handleAddRevision() {
    if (!addContent.trim() || !selected) return;
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const nextVer = revisions.length > 0 ? Math.max(...revisions.map(r => r.version)) + 1 : 1;
    const { error } = await supabase.from("translation_revisions").insert({
      translation_id: selected.id, user_id: user?.id, version: nextVer, content: addContent,
    });
    if (!error) {
      setAddContent("");
      loadRevisions(selected.id);
      Swal.fire({ title: "Tersimpan!", icon: "success", timer: 1500, showConfirmButton: false });
    } else {
      Swal.fire({ title: "Gagal", text: error.message, icon: "error" });
    }
    setSaving(false);
  }

  const compareRev = revisions.find(r => r.version === compareVersion);
  const latestRev = revisions.length > 0 ? revisions[revisions.length - 1] : null;

  if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div>;

  return (
    <div className="p-4 md:p-8 min-h-full animate-in fade-in duration-300">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/tools" className="flex items-center gap-2 text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /></Link>
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground flex items-center gap-3"><Clock className="w-7 h-7 text-brand" />Translation Timelapse</h1>
      </div>

      {!selected ? (
        <div className="space-y-3 max-w-2xl">
          <h2 className="text-lg font-bold text-foreground mb-3">Your Translations</h2>
          {translations.length === 0 ? (
            <p className="text-muted-foreground text-sm">Belum ada terjemahan tersimpan. Translate di reader dulu.</p>
          ) : (
            translations.map((t) => (
              <button key={t.id} onClick={() => selectTranslation(t)} className="w-full text-left bg-card border border-border rounded-2xl p-4 hover:border-brand/30 hover:bg-muted transition-all group">
                <p className="text-sm font-bold text-foreground mb-1">{t.texts?.title || "Untitled"}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 italic mb-2">"{t.user_translation}"</p>
                <span className="text-[10px] text-muted-foreground">{new Date(t.created_at).toLocaleDateString("id-ID")}</span>
              </button>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-sm text-brand hover:underline"><ChevronLeft className="w-4 h-4" />Kembali ke list</button>
          <blockquote className="border-l-2 border-brand/30 pl-4 text-sm font-serif italic text-foreground/80">{selected.original_passage}</blockquote>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-4 md:p-6">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2"><GitCompare className="w-4 h-4 text-brand" />Evolution</h3>
              {revisions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada revision. Tambahkan versi pertama.</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span>Compare: V{compareVersion}</span>
                    <input type="range" min={1} max={Math.max(...revisions.map(r => r.version))} value={compareVersion} onChange={(e) => setCompareVersion(Number(e.target.value))} className="flex-1 accent-brand" />
                    <span>V{latestRev?.version}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted rounded-xl p-3">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">V{compareRev?.version || "-"}</span>
                      <p className="text-xs text-foreground mt-1">{compareRev?.content || "-"}</p>
                    </div>
                    <div className="bg-brand/5 rounded-xl p-3 border border-brand/10">
                      <span className="text-[10px] font-bold text-brand uppercase">V{latestRev?.version || "-"}</span>
                      <p className="text-xs text-foreground mt-1">{latestRev?.content || "-"}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-card border border-border rounded-2xl p-4 md:p-6 space-y-4">
              <h3 className="font-bold text-foreground flex items-center gap-2"><Plus className="w-4 h-4 text-brand" />Add Revision</h3>
              <textarea value={addContent} onChange={(e) => setAddContent(e.target.value)} rows={3} placeholder="New translation version..." className="w-full bg-background border border-border rounded-xl p-3 text-sm focus:ring-1 focus:ring-brand outline-none resize-none" />
              <button onClick={handleAddRevision} disabled={saving || !addContent.trim()} className="w-full py-2.5 bg-brand text-background font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Revision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
