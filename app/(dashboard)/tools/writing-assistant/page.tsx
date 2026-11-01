"use client";

import Markdown from "@/components/ui/Markdown";
import TryExampleButton from "@/components/ui/TryExampleButton";
import { WRITING_ASSISTANT_EXAMPLE } from "@/lib/tool-examples";
import { useState } from "react";
import { PenTool, Loader2, CheckCircle2, AlertTriangle, Sparkles, Wand2, Type } from "lucide-react";

interface GrammarCorrection {
  original: string;
  correction: string;
  explanation: string;
}

interface RegisterSuggestion {
  original: string;
  suggestion: string;
  explanation: string;
}

interface SynonymUpgrade {
  word: string;
  better_words: string[];
  context: string;
}

interface SentenceVariety {
  feedback: string;
  example_revision: string;
}

interface FeedbackResult {
  overall_score: number;
  grammar_corrections: GrammarCorrection[];
  register_analysis: RegisterSuggestion[];
  synonym_upgrades: SynonymUpgrade[];
  sentence_variety: SentenceVariety[];
}

export default function WritingAssistantPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FeedbackResult | null>(null);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    if (!text.trim() || text.length < 20) {
      setError("Teks terlalu pendek. Masukkan minimal satu kalimat penuh.");
      return;
    }
    
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/writing-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Gagal menganalisis teks");
      
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex items-center gap-4">
        <div className="w-16 h-16 bg-muted text-brand-ink rounded-card flex items-center justify-center shrink-0 ">
          <PenTool className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-[28px] md:text-4xl leading-[1.15] font-serif font-medium text-foreground">AI Writing Assistant</h1>
          <p className="text-muted-foreground mt-2 text-lg">Evaluasi grammar, gaya bahasa (register), dan variasi kalimat esai Anda secara instan.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Editor Section */}
        <div className="flex flex-col h-full">
          <div className="bg-card border border-border rounded-card p-6 flex flex-col flex-1 relative overflow-hidden">
            <label className="block text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Type className="w-4 h-4 text-brand-ink" /> Teks Esai / Karya Tulis
            </label>
            <TryExampleButton example={WRITING_ASSISTANT_EXAMPLE} onFill={setText} className="mb-2 self-start" />
            <textarea 
              className="w-full flex-1 min-h-[400px] bg-background border border-border rounded-control p-6 text-foreground text-lg leading-relaxed font-serif focus:ring-2 focus:ring-border focus:border-transparent transition-all outline-none resize-none custom-scrollbar"
              placeholder="Paste tulisan berbahasa Inggris Anda di sini..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            
            <div className="mt-4 flex justify-between items-center">
              <span className="text-xs font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full">
                {text.trim() ? text.trim().split(/\s+/).length : 0} Words
              </span>
              <button 
                onClick={handleAnalyze}
                disabled={loading || !text.trim()}
                className="bg-brand-solid hover:bg-brand-hover text-on-brand px-4 md:px-8 py-3 rounded-control font-bold flex items-center gap-2 transition-all disabled:opacity-50 "
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                Analisis Tulisan
              </button>
            </div>
            {error && <p className="text-danger mt-4 text-sm font-medium text-right">{error}</p>}
          </div>
        </div>

        {/* Feedback Section */}
        <div className="h-full">
          {loading && (
            <div className="h-full min-h-[400px] bg-card border border-border rounded-card flex flex-col items-center justify-center p-4 md:p-8 text-center">
              <Loader2 className="w-12 h-12 text-brand-ink animate-spin mb-4" />
              <h3 className="text-xl font-medium font-serif text-foreground">AI Sedang Membaca...</h3>
              <p className="text-muted-foreground mt-2">Menganalisis tata bahasa, diksi, dan alur kalimat Anda.</p>
            </div>
          )}

          {!loading && !result && (
            <div className="h-full min-h-[400px] bg-muted/30 border border-border border-dashed rounded-card flex flex-col items-center justify-center p-4 md:p-8 text-center">
              <Sparkles className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-lg text-muted-foreground font-medium">Panel Feedback AI</p>
              <p className="text-muted-foreground mt-1 max-w-sm">Feedback terstruktur akan muncul di sini setelah Anda mengklik tombol analisis.</p>
            </div>
          )}

          {!loading && result && (
            <div className="space-y-6 h-full overflow-y-auto pr-2 custom-scrollbar pb-10">
              
              {/* Score Card */}
              <div className="bg-muted border border-border rounded-card p-6 flex items-center justify-between ">
                <div>
                  <h3 className="text-sm font-bold text-brand-ink uppercase tracking-wider mb-1">Overall Writing Score</h3>
                  <p className="text-muted-foreground text-sm">Berdasarkan kejelasan, grammar, dan gaya bahasa.</p>
                </div>
                <div className="w-20 h-20 shrink-0 rounded-full bg-background border-4 border-border flex items-center justify-center ">
                  <span className="text-3xl font-medium font-serif text-brand-ink">{result.overall_score}</span>
                </div>
              </div>

              {/* Grammar Corrections */}
              {result.grammar_corrections.length > 0 && (
                <div className="bg-card border border-border rounded-card p-6">
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-danger" /> Grammar Issues
                  </h3>
                  <div className="space-y-4">
                    {result.grammar_corrections.map((item, idx) => (
                      <div key={idx} className="bg-muted/50 rounded-card p-4 border border-border">
                        <div className="flex flex-col sm:flex-row gap-3 mb-3 text-sm">
                          <div className="flex-1 bg-danger-tint text-danger border border-danger/30 rounded-control p-3 line-through decoration-danger/50">
                            {item.original}
                          </div>
                          <div className="flex-1 bg-brand-tint text-brand-ink border border-brand/30 rounded-control p-3 font-medium">
                            {item.correction}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full bg-brand-solid"></span>
                          {item.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Register Suggestions */}
              {result.register_analysis.length > 0 && (
                <div className="bg-card border border-border rounded-card p-6">
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-brand-ink" /> Register (Gaya Bahasa)
                  </h3>
                  <div className="space-y-4">
                    {result.register_analysis.map((item, idx) => (
                      <div key={idx} className="bg-muted/50 rounded-card p-4 border border-border">
                        <p className="text-sm text-muted-foreground mb-2">Alih-alih menggunakan:</p>
                        <p className="text-foreground bg-background border border-border rounded-control p-3 text-sm mb-3">"{item.original}"</p>
                        <p className="text-sm text-muted-foreground mb-2">Coba alternatif akademis ini:</p>
                        <p className="text-brand-ink font-medium bg-brand-tint border border-brand/30 rounded-control p-3 text-sm mb-3">"{item.suggestion}"</p>
                        <p className="text-sm text-muted-foreground flex items-start gap-2 italic">
                          {item.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Synonym Upgrades */}
              {result.synonym_upgrades.length > 0 && (
                <div className="bg-card border border-border rounded-card p-6">
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-foreground" /> Vocabulary Upgrades
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {result.synonym_upgrades.map((item, idx) => (
                      <div key={idx} className="bg-background border border-border rounded-control p-4 flex-1 min-w-[250px] ">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-muted-foreground line-through decoration-muted-foreground/50">{item.word}</span>
                          <span className="text-foreground font-bold">→</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {item.better_words.map((w, i) => (
                            <span key={i} className="px-2 py-1 bg-muted text-foreground border border-border rounded-lg text-sm font-medium">
                              {w}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground italic">{item.context}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sentence Variety */}
              {result.sentence_variety.length > 0 && (
                <div className="bg-card border border-border rounded-card p-6">
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <PenTool className="w-5 h-5 text-warning-ink" /> Sentence Variety
                  </h3>
                  <div className="space-y-4">
                    {result.sentence_variety.map((item, idx) => (
                      <div key={idx} className="bg-muted/50 rounded-card p-4 border border-border">
                        <p className="text-sm font-bold text-foreground mb-2">Masalah:</p>
                        <div className="text-sm text-muted-foreground mb-4"><Markdown>{item.feedback}</Markdown></div>
                        
                        <p className="text-sm font-bold text-foreground mb-2">Contoh Revisi:</p>
                        <p className="text-warning-ink bg-warning-tint border border-warning-ink/30 rounded-control p-3 text-sm italic">
                          "{item.example_revision}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
