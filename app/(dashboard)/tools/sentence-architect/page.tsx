"use client";

import TryExampleButton from "@/components/ui/TryExampleButton";
import { TOOL_EXAMPLES } from "@/lib/tool-examples";
import { useState } from "react";
import { Building2, Loader2, ArrowRight, BookOpen, Layers, GitMerge, Type } from "lucide-react";

interface ClauseChild {
  type: string;
  text: string;
}

interface Clause {
  type: string;
  text: string;
  children: ClauseChild[];
}

interface Strategy {
  name: string;
  indonesian: string;
  explanation: string;
}

interface ParsedResult {
  sentence: string;
  tree: Clause[];
  translation_strategies: Strategy[];
}

export default function SentenceArchitectPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParsedResult | null>(null);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/parse-sentence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal menganalisis kalimat");
      
      setResult(data);
    } catch (err: any) {
      setError(err.message);
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

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex items-center gap-4">
        <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center shrink-0">
          <Building2 className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl md:text-4xl font-serif font-bold text-foreground">Sentence Architect</h1>
          <p className="text-muted-foreground mt-2 text-lg">Bedah struktur anatomi kalimat kompleks dan temukan strategi penerjemahan terbaik.</p>
        </div>
      </div>

      <div className="bg-card shadow-sm backdrop-blur-md border border-border rounded-3xl p-6 shadow-xl mb-8">
        <label className="block text-sm font-bold text-foreground mb-3">Masukkan Kalimat Bahasa Inggris:</label>
        <TryExampleButton example={TOOL_EXAMPLES["sentence-architect"]} onFill={setText} className="mb-2" />
        <textarea 
          className="w-full bg-background border border-border rounded-xl p-4 text-foreground focus:ring-2 focus:ring-brand focus:border-transparent transition-all outline-none resize-none custom-scrollbar"
          rows={5}
          placeholder="Contoh: The woman, who had been waiting for hours in the rain without an umbrella, finally decided to leave."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        
        <div className="mt-4 flex justify-end">
          <button 
            onClick={handleAnalyze}
            disabled={loading || !text.trim()}
            className="bg-brand hover:bg-brand/90 text-brand-foreground px-4 md:px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Layers className="w-5 h-5" />}
            Bedah Struktur
          </button>
        </div>
        {error && <p className="text-red-500 mt-4 text-sm font-medium">{error}</p>}
      </div>

      {result && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Nested Cards Visualizer */}
          <div>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-4 flex items-center gap-2">
              <GitMerge className="w-6 h-6 text-brand" /> Dependency Tree
            </h2>
            <div className="space-y-4">
              {result.tree.map((clause, idx) => (
                <div key={idx} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                  {/* Clause Header */}
                  <div className="bg-muted p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-bold text-foreground inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-brand"></span>
                      {clause.type}
                    </span>
                    <span className="text-sm text-muted-foreground italic truncate max-w-lg">"{clause.text}"</span>
                  </div>
                  
                  {/* Clause Children (Nested Cards) */}
                  <div className="p-4 pl-8 sm:pl-12 flex flex-col gap-3">
                    {clause.children.map((child, cIdx) => {
                      const isLast = cIdx === clause.children.length - 1;
                      const isFirst = cIdx === 0;
                      
                      return (
                        <div key={cIdx} className="relative flex items-center gap-4">
                          {/* Vertical line piece for this child */}
                          <div className={`absolute left-[-1.5rem] sm:left-[-2rem] w-px bg-border ${
                            isLast 
                              ? (isFirst ? '-top-4 bottom-1/2' : '-top-3 bottom-1/2')
                              : (isFirst ? '-top-4 -bottom-3' : '-top-3 -bottom-3')
                          }`}></div>
                          
                          {/* Horizontal branch line */}
                          <div className="absolute top-1/2 left-[-1.5rem] sm:left-[-2rem] w-4 sm:w-6 h-px bg-border"></div>
                          
                          <div className="bg-background border border-border rounded-xl p-3 flex-1 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-muted/50 transition-colors z-10">
                            <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg border shrink-0 ${getBadgeColor(child.type)}`}>
                              {child.type}
                            </span>
                            <span className="text-foreground">{child.text}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Translation Strategies */}
          <div>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-4 flex items-center gap-2">
              <Type className="w-6 h-6 text-blue-500" /> Translation Strategies
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.translation_strategies.map((strategy, idx) => (
                <div key={idx} className="bg-card shadow-sm border border-border rounded-2xl p-6 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <BookOpen className="w-24 h-24 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2 relative z-10">
                    <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center text-xs">
                      {idx + 1}
                    </span>
                    {strategy.name}
                  </h3>
                  <div className="bg-muted rounded-xl p-4 mb-4 relative z-10 border border-border/50">
                    <p className="text-foreground font-serif text-lg leading-relaxed">{strategy.indonesian}</p>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground relative z-10">
                    <ArrowRight className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
                    <p>{strategy.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
