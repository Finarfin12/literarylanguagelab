"use client";

import { useState, useEffect } from "react";
import { X, Languages, BookOpen, Search, GitMerge } from "lucide-react";
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
      if (mode === "sentence-grammar") {
        const res = await fetch("/api/parse-sentence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: targetSentence }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        
        setResult(data as any); // Storing the JSON object
        setCache(prev => ({ ...prev, [mode]: data }));
      } else {
        const res = await fetch("/api/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            word: targetSentence,
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
      }
    } catch (err) {
      console.error(err);
      setResult("Terjadi kesalahan saat memproses permintaan. Silakan coba lagi." as any);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeColor = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes("subject")) return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    if (t.includes("verb")) return "bg-red-500/10 text-red-500 border-red-500/20";
    if (t.includes("object")) return "bg-green-500/10 text-green-500 border-green-500/20";
    if (t.includes("modifier")) return "bg-purple-500/10 text-purple-500 border-purple-500/20";
    if (t.includes("conjunction")) return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    return "bg-brand/10 text-brand border-brand/20";
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
        ) : activeMode === "sentence-grammar" && result && typeof result === "object" ? (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-2">
              <GitMerge className="w-5 h-5 text-brand" /> Dependency Tree
            </h3>
            <div className="space-y-4">
              {(result as any).tree?.map((clause: any, idx: number) => (
                <div key={idx} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                  {/* Clause Header */}
                  <div className="bg-muted p-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-bold text-sm text-foreground inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-brand"></span>
                      {clause.type}
                    </span>
                    <span className="text-xs text-muted-foreground italic truncate max-w-[200px]">"{clause.text}"</span>
                  </div>
                  
                  {/* Clause Children (Nested Cards) */}
                  <div className="p-3 pl-6 sm:pl-8 flex flex-col gap-2">
                    {clause.children?.map((child: any, cIdx: number) => {
                      const isLast = cIdx === clause.children.length - 1;
                      const isFirst = cIdx === 0;
                      
                      return (
                        <div key={cIdx} className="relative flex items-center gap-3">
                          {/* Vertical line piece for this child */}
                          <div className={`absolute left-[-1.2rem] sm:left-[-1.5rem] w-px bg-border ${
                            isLast 
                              ? (isFirst ? '-top-3 bottom-1/2' : '-top-2 bottom-1/2')
                              : (isFirst ? '-top-3 -bottom-2' : '-top-2 -bottom-2')
                          }`}></div>
                          
                          {/* Horizontal branch line */}
                          <div className="absolute top-1/2 left-[-1.2rem] sm:left-[-1.5rem] w-3 sm:w-4 h-px bg-border"></div>
                          
                          <div className="bg-background border border-border rounded-xl p-2 flex-1 flex flex-col sm:flex-row sm:items-center gap-2 hover:bg-muted/50 transition-colors z-10">
                            <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md border shrink-0 ${getBadgeColor(child.type)}`}>
                              {child.type}
                            </span>
                            <span className="text-sm text-foreground">{child.text}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            
            <h3 className="text-lg font-bold text-foreground mt-8 mb-4 border-b border-border pb-2">Penjelasan Tata Bahasa</h3>
            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
              <p>Kalimat ini dipecah ke dalam berbagai klausa utama dan klausa pelengkap seperti yang divisualisasikan di atas. Anda bisa mengklik tombol translasi jika ingin memahami terjemahannya per kata atau dalam konteks.</p>
            </div>
          </div>
        ) : typeof result === "string" ? (
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
