"use client";

import { useState, useEffect, useRef } from "react";
import { X, BookOpen, BookmarkPlus, Loader2, Globe, Wind, Sparkles, Languages, Music, Quote, PenTool, GitMerge, Hourglass, Network, Volume2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Swal from "sweetalert2";
import dynamic from "next/dynamic";

const SemanticMapViewer = dynamic(() => import("./SemanticMapViewer"), { ssr: false, loading: () => <div className="h-[350px] flex items-center justify-center bg-foreground/5 rounded-2xl animate-pulse"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div> });

interface WordLookupSidebarProps {
  word: string | null;
  contextSentence: string | null;
  textId: string;
  title: string;
  author: string;
  dictionaryPrefs?: any;
  learningPrefs?: any;
  onClose: () => void;
}

const MODES = [
  { id: "literary-focus", label: "Literary Focus", icon: BookOpen },
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
  { id: "grammar", label: "Grammar", icon: BookOpen },
  { id: "phonetics", label: "Phonetics", icon: Volume2 },
  { id: "rhyme", label: "Rhyme", icon: Music },
  { id: "semantic-map", label: "Semantic Map", icon: Network },
  { id: "collocations", label: "Collocations", icon: BookmarkPlus }
];

export default function WordLookupSidebar({ word, contextSentence, textId, title, author, dictionaryPrefs, learningPrefs, onClose }: WordLookupSidebarProps) {
  const [activeMode, setActiveMode] = useState("literary-focus");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [emoji, setEmoji] = useState<string | null>(null);

  const [cache, setCache] = useState<Record<string, string>>({});

  const fetchEmoji = async (targetWord: string) => {
    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: targetWord, mode: "pictionary", contextSentence, title, author }),
      });
      const data = await res.json();
      if (res.ok && data.result) {
        setEmoji(data.result);
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    if (word) {
      setCache({});
      setResult(null);
      setSaved(false);
      setEmoji(null);
      fetchAnalysis(word, "literary-focus", true);
      fetchEmoji(word);
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
        body: JSON.stringify({ 
          word: targetWord, 
          contextSentence, 
          title, 
          author, 
          mode,
          dictionaryPrefs 
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Simple parsing if it's semantic map or collocations
      let finalResult = data.result;
      let parsedMapData = null;
      if (mode === "semantic-map") {
        try {
          const start = finalResult.indexOf('{');
          const end = finalResult.lastIndexOf('}');
          if (start !== -1 && end !== -1) {
            parsedMapData = JSON.parse(finalResult.substring(start, end + 1));
            finalResult = JSON.stringify(parsedMapData);
          }
        } catch (e) {
          console.error("Failed to parse map data", e);
        }
      } else if (mode === "collocations") {
        try {
          const start = finalResult.indexOf('[');
          const end = finalResult.lastIndexOf(']');
          if (start !== -1 && end !== -1) {
            const parsedArray = JSON.parse(finalResult.substring(start, end + 1));
            finalResult = JSON.stringify(parsedArray);
          }
        } catch (e) {
          console.error("Failed to parse collocations data", e);
        }
      }

      setResult(finalResult);
      setCache(prev => ({ ...prev, [mode]: finalResult }));

      // Auto-add to vocab if enabled, only when initially loading literary-focus or dictionary
      if (initialLoad && learningPrefs?.auto_add_vocab && !saved && !saving) {
        // Wait a small tick then save
        setTimeout(() => {
          handleSaveToVocab(finalResult);
        }, 500);
      }
    } catch (error) {
      setResult("Terjadi kesalahan saat menganalisis kata.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToVocab = async (overrideResult?: string) => {
    const finalDefinition = overrideResult || cache["literary-focus"] || cache["dictionary"] || result;
    if (!word || !finalDefinition) return;
    
    setSaving(true);
    try {
      // Handle bulk saving for collocations
      if (activeMode === "collocations") {
        let cols = [];
        try { cols = JSON.parse(result || "[]"); } catch(e) {}
        if (cols.length === 0) throw new Error("No collocations to save");

        const res = await fetch("/api/vocabulary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            word,
            collocations: cols,
            contextSentence,
            contextSource: `${title} by ${author}`,
            masteryLevel: learningPrefs?.default_mastery || 0
          })
        });
        if (res.ok) setSaved(true);
      } else {
        const res = await fetch("/api/vocabulary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            word,
            definition: finalDefinition,
            contextSentence,
            contextSource: `${title} by ${author}`,
            masteryLevel: learningPrefs?.default_mastery || 0
          })
        });
        if (res.ok) setSaved(true);
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Gagal", "Failed to save vocabulary", "error");
    } finally {
      setSaving(false);
    }
  };

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const speakWord = async () => {
    if (!word || typeof window === "undefined") return;
    
    let ttsProvider = "browser";
    try {
      const saved = localStorage.getItem("user_preferences");
      if (saved) {
        const p = JSON.parse(saved);
        if (p.reading?.tts_provider) ttsProvider = p.reading.tts_provider;
      }
    } catch(e) {}

    window.speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (ttsProvider === "groq") {
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: word })
        });
        if (!res.ok) throw new Error("TTS failed");
        
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        
        audio.onended = () => URL.revokeObjectURL(url);
        audio.onerror = () => URL.revokeObjectURL(url);
        
        await audio.play();
      } catch (err) {
        console.error("Groq TTS Error:", err);
        if (window.speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance(word);
          utterance.lang = "en-US";
          utterance.rate = 0.9;
          window.speechSynthesis.speak(utterance);
        }
      }
    } else {
      if (window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = "en-US";
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  if (!word) return null;

  return (
    <div className="flex flex-col h-full bg-background backdrop-blur-xl relative overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-serif font-bold text-foreground truncate max-w-[150px] flex items-center gap-2">
            {word}
            {emoji && <span className="text-2xl ml-1">{emoji}</span>}
          </h2>
          <button 
            onClick={speakWord} 
            className="p-1.5 bg-brand/10 text-brand rounded-full hover:bg-brand/20 transition-colors"
            title="Listen to pronunciation"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-muted hover:bg-muted/80 rounded-full text-muted-foreground transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 12 Modes Grid */}
      <div className="p-4 grid grid-cols-3 gap-2 border-b border-border z-10 relative overflow-y-auto max-h-[30vh]">
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
                  : "bg-muted text-muted-foreground hover:bg-muted hover:bg-muted/80 border border-transparent"
              } ${(loading && !isActive) ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Icon className="w-4 h-4 mb-1" />
              <span className="leading-tight">{m.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-6 z-10 relative">
        <div className="bg-card shadow-sm border border-border rounded-2xl p-4 mb-6">
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-bold">Konteks Kalimat</p>
          <p className="text-sm italic text-foreground/80 leading-relaxed">"{contextSentence}"</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-brand">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="text-sm font-medium animate-pulse">Menjalankan {MODES.find(m => m.id === activeMode)?.label}...</p>
          </div>
        ) : (
          <>
            {activeMode === "semantic-map" ? (
              <div className="mt-4">
                <SemanticMapViewer data={result ? JSON.parse(result) : null} />
                <p className="text-xs text-center text-muted-foreground mt-4 italic">Bisa di-*drag*, *zoom*, dan digeser.</p>
              </div>
            ) : activeMode === "collocations" ? (
              <div className="space-y-3 mt-4">
                <p className="text-sm font-medium text-foreground mb-4">Literary Collocations for <strong>{word}</strong>:</p>
                {result && JSON.parse(result).map((col: string, idx: number) => (
                  <div key={idx} className="p-3 bg-brand/5 border border-brand/20 rounded-xl text-brand font-serif text-lg text-center">
                    {col}
                  </div>
                ))}
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert prose-brand max-w-none prose-p:leading-relaxed prose-headings:text-brand prose-headings:font-serif">
                {result && <ReactMarkdown>{result}</ReactMarkdown>}
              </div>
            )}
          </>
        )}
      </div>

      <div className="p-4 border-t border-border bg-background z-10 relative">
        <button 
          onClick={() => handleSaveToVocab()}
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
