"use client";

import { useState, useEffect } from "react";
import { X, Languages, BookOpen, Search } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface SentenceAnalysisSidebarProps {
  sentence: string | null;
  title: string;
  author: string;
  onClose: () => void;
}

const MODES = [
  { id: "sentence-translation", label: "Terjemahan", icon: Languages },
  { id: "sentence-grammar", label: "Tata Bahasa", icon: BookOpen },
  { id: "sentence-idioms", label: "Idiom & Kiasan", icon: Search },
];

export default function SentenceAnalysisSidebar({ sentence, title, author, onClose }: SentenceAnalysisSidebarProps) {
  const [activeMode, setActiveMode] = useState("sentence-translation");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [cache, setCache] = useState<Record<string, string>>({});

  useEffect(() => {
    if (sentence) {
      setCache({});
      setResult(null);
      fetchAnalysis(sentence, "sentence-translation", true);
    }
  }, [sentence]);

  const fetchAnalysis = async (targetSentence: string, mode: string, initialLoad: boolean = false) => {
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
          word: targetSentence, // We use 'word' to match the existing API payload structure
          contextSentence: targetSentence, 
          title, 
          author, 
          mode 
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResult(data.result);
      setCache(prev => ({ ...prev, [mode]: data.result }));
    } catch (err) {
      console.error(err);
      setResult("Terjadi kesalahan saat memproses permintaan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (!sentence) return null;

  return (
    <div className="flex flex-col h-full bg-card shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div>
          <h2 className="font-bold text-foreground font-serif">Analisis Kalimat</h2>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{title}</p>
        </div>
        <button onClick={onClose} className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Mode Selector */}
      <div className="flex p-3 gap-2 overflow-x-auto border-b border-border bg-muted/10 no-scrollbar">
        {MODES.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => fetchAnalysis(sentence, mode.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                isActive 
                  ? "bg-brand text-brand-foreground shadow-sm" 
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {mode.label}
            </button>
          );
        })}
      </div>

      {/* Target Sentence Display */}
      <div className="p-4 bg-brand/5 border-b border-brand/10">
        <p className="text-sm italic font-serif leading-relaxed text-foreground opacity-90 border-l-2 border-brand pl-3">
          "{sentence}"
        </p>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 space-y-4 text-brand">
            <div className="relative">
              <div className="absolute inset-0 bg-brand/20 blur-xl rounded-full"></div>
              <SparklesIcon className="w-8 h-8 animate-pulse relative z-10" />
            </div>
            <p className="text-sm font-medium animate-pulse text-muted-foreground">Menganalisis kalimat...</p>
          </div>
        ) : result ? (
          <div className="prose prose-sm dark:prose-invert prose-brand max-w-none">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function SparklesIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
    </svg>
  );
}
