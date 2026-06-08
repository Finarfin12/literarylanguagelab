"use client";

import { useState, useEffect } from "react";
import { X, BookOpen, BookmarkPlus, Loader2, Globe, Wind, Sparkles, Languages, Music, Quote, PenTool, GitMerge, Hourglass, Network } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface WordLookupSidebarProps {
  word: string | null;
  contextSentence: string | null;
  textId: string;
  title: string;
  author: string;
  onClose: () => void;
}

const MODES = [
  { id: "dictionary", label: "Dictionary", icon: BookOpen },
  { id: "translate", label: "Translate", icon: Languages },
  { id: "nuance", label: "Nuance", icon: Wind },
  { id: "synonyms", label: "Synonyms", icon: Sparkles },
  { id: "cultural", label: "Culture", icon: Globe },
  { id: "etymology", label: "Etymology", icon: GitMerge },
  { id: "lyricism", label: "Lyricism", icon: Music },
  { id: "metaphors", label: "Metaphors", icon: PenTool },
  { id: "quote", label: "Quote", icon: Quote },
  { id: "time-traveler", label: "Time Travel", icon: Hourglass },
  { id: "rhyme", label: "Rhyme", icon: Music },
  { id: "semantic-map", label: "Semantic Map", icon: Network }
];

export default function WordLookupSidebar({ word, contextSentence, textId, title, author, onClose }: WordLookupSidebarProps) {
  const [activeMode, setActiveMode] = useState("dictionary");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [cache, setCache] = useState<Record<string, string>>({});

  useEffect(() => {
    if (word) {
      setCache({});
      setResult(null);
      setSaved(false);
      fetchAnalysis(word, "dictionary", true);
    }
  }, [word]);

  const fetchAnalysis = async (targetWord: string, mode: string, initialLoad: boolean = false) => {
    setActiveMode(mode);
    
    if (cache[mode] && !initialLoad) {
      setResult(cache[mode]);
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: targetWord, contextSentence, mode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Simple parsing if it's semantic map to render the JSON (for now just format it as code)
      // In a real implementation we would render a graph here using react-force-graph.
      let finalResult = data.result;
      if (mode === "semantic-map") {
        try {
          const start = finalResult.indexOf('{');
          const end = finalResult.lastIndexOf('}');
          if (start !== -1 && end !== -1) {
            const parsed = JSON.parse(finalResult.substring(start, end + 1));
            finalResult = "```json\n" + JSON.stringify(parsed, null, 2) + "\n```\n*Visual rendering coming soon.*";
          }
        } catch (e) {
          finalResult = "Gagal memproses data visual. Berikut adalah raw datanya:\n\n```json\n" + finalResult + "\n```";
        }
      }

      setResult(finalResult);
      setCache(prev => ({ ...prev, [mode]: finalResult }));
    } catch (error) {
      setResult("Terjadi kesalahan saat menganalisis kata.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToVocab = async () => {
    if (!word || !result) return;
    
    setSaving(true);
    try {
      const res = await fetch("/api/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word,
          definition: cache["dictionary"] || result,
          contextSentence,
          contextSource: `${title} by ${author}`,
          masteryLevel: 0
        })
      });
      
      if (res.ok) {
        setSaved(true);
      }
    } catch (error) {
      alert("Failed to save vocabulary");
    } finally {
      setSaving(false);
    }
  };

  if (!word) return null;

  return (
    <div className="flex flex-col h-full bg-background/80 backdrop-blur-xl relative overflow-hidden">
      <div className="p-4 border-b border-white/10 flex items-center justify-between z-10 relative">
        <h2 className="text-xl font-serif font-bold text-foreground truncate max-w-[200px]">{word}</h2>
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-muted-foreground transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 12 Modes Grid */}
      <div className="p-4 grid grid-cols-3 gap-2 border-b border-white/10 z-10 relative overflow-y-auto max-h-[30vh]">
        {MODES.map((m) => {
          const Icon = m.icon;
          const isActive = activeMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => fetchAnalysis(word, m.id)}
              disabled={loading && !isActive}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-medium transition-all text-center ${
                isActive 
                  ? "bg-brand/20 text-brand border border-brand/30 shadow-inner" 
                  : "bg-white/5 text-muted-foreground hover:bg-white/10 border border-transparent"
              } ${(loading && !isActive) ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Icon className="w-4 h-4 mb-1" />
              <span className="leading-tight">{m.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-6 z-10 relative">
        <div className="bg-card/50 border border-white/5 rounded-2xl p-4 mb-6">
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-bold">Konteks Kalimat</p>
          <p className="text-sm italic text-foreground/80 leading-relaxed">"{contextSentence}"</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-brand">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="text-sm font-medium animate-pulse">Menjalankan {MODES.find(m => m.id === activeMode)?.label}...</p>
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert prose-brand max-w-none prose-p:leading-relaxed prose-headings:text-brand prose-headings:font-serif">
            {result && <ReactMarkdown>{result}</ReactMarkdown>}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-white/10 bg-background/50 z-10 relative">
        <button 
          onClick={handleSaveToVocab}
          disabled={saving || saved || loading}
          className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all ${
            saved 
              ? "bg-green-500/20 text-green-400 border border-green-500/30" 
              : "bg-brand text-background hover:shadow-[0_0_20px_rgba(62,207,142,0.4)]"
          } disabled:opacity-50`}
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <BookmarkPlus className="w-5 h-5" />}
          {saved ? "Tersimpan di Kamus!" : "Simpan Kata"}
        </button>
      </div>
    </div>
  );
}
