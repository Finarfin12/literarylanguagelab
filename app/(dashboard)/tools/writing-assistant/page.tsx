"use client";

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
        <div className="w-16 h-16 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
          <PenTool className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl md:text-4xl font-serif font-bold text-foreground">AI Writing Assistant</h1>
          <p className="text-muted-foreground mt-2 text-lg">Evaluasi grammar, gaya bahasa (register), dan variasi kalimat esai Anda secara instan.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Editor Section */}
        <div className="flex flex-col h-full">
          <div className="bg-card shadow-sm border border-border rounded-3xl p-6 flex flex-col flex-1 relative overflow-hidden">
            <label className="block text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Type className="w-4 h-4 text-blue-500" /> Teks Esai / Karya Tulis
            </label>
            <textarea 
              className="w-full flex-1 min-h-[400px] bg-background border border-border rounded-xl p-6 text-foreground text-lg leading-relaxed font-serif focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none custom-scrollbar"
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
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 md:px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 shadow-md"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                Analisis Tulisan
              </button>
            </div>
            {error && <p className="text-red-500 mt-4 text-sm font-medium text-right">{error}</p>}
          </div>
        </div>

        {/* Feedback Section */}
        <div className="h-full">
          {loading && (
            <div className="h-full min-h-[400px] bg-card border border-border rounded-3xl flex flex-col items-center justify-center p-4 md:p-8 text-center">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              <h3 className="text-xl font-bold font-serif text-foreground">AI Sedang Membaca...</h3>
              <p className="text-muted-foreground mt-2">Menganalisis tata bahasa, diksi, dan alur kalimat Anda.</p>
            </div>
          )}

          {!loading && !result && (
            <div className="h-full min-h-[400px] bg-muted/30 border border-border border-dashed rounded-3xl flex flex-col items-center justify-center p-4 md:p-8 text-center">
              <Sparkles className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-lg text-muted-foreground font-medium">Panel Feedback AI</p>
              <p className="text-muted-foreground mt-1 max-w-sm">Feedback terstruktur akan muncul di sini setelah Anda mengklik tombol analisis.</p>
            </div>
          )}

          {!loading && result && (
            <div className="space-y-6 h-full overflow-y-auto pr-2 custom-scrollbar pb-10">
              
              {/* Score Card */}
              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-3xl p-6 flex items-center justify-between shadow-sm">
                <div>
                  <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-1">Overall Writing Score</h3>
                  <p className="text-muted-foreground text-sm">Berdasarkan kejelasan, grammar, dan gaya bahasa.</p>
                </div>
                <div className="w-20 h-20 shrink-0 rounded-full bg-background border-4 border-blue-500 flex items-center justify-center shadow-inner">
                  <span className="text-3xl font-bold font-serif text-blue-600">{result.overall_score}</span>
                </div>
              </div>

              {/* Grammar Corrections */}
              {result.grammar_corrections.length > 0 && (
                <div className="bg-card shadow-sm border border-border rounded-3xl p-6">
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" /> Grammar Issues
                  </h3>
                  <div className="space-y-4">
                    {result.grammar_corrections.map((item, idx) => (
                      <div key={idx} className="bg-muted/50 rounded-2xl p-4 border border-border">
                        <div className="flex flex-col sm:flex-row gap-3 mb-3 text-sm">
                          <div className="flex-1 bg-red-500/10 text-red-600 border border-red-500/20 rounded-xl p-3 line-through decoration-red-500/50">
                            {item.original}
                          </div>
                          <div className="flex-1 bg-green-500/10 text-green-600 border border-green-500/20 rounded-xl p-3 font-medium">
                            {item.correction}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          {item.explanation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Register Suggestions */}
              {result.register_analysis.length > 0 && (
                <div className="bg-card shadow-sm border border-border rounded-3xl p-6">
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Register (Gaya Bahasa)
                  </h3>
                  <div className="space-y-4">
                    {result.register_analysis.map((item, idx) => (
                      <div key={idx} className="bg-muted/50 rounded-2xl p-4 border border-border">
                        <p className="text-sm text-muted-foreground mb-2">Alih-alih menggunakan:</p>
                        <p className="text-foreground bg-background border border-border rounded-xl p-3 text-sm mb-3">"{item.original}"</p>
                        <p className="text-sm text-muted-foreground mb-2">Coba alternatif akademis ini:</p>
                        <p className="text-emerald-600 font-medium bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-sm mb-3">"{item.suggestion}"</p>
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
                <div className="bg-card shadow-sm border border-border rounded-3xl p-6">
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" /> Vocabulary Upgrades
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {result.synonym_upgrades.map((item, idx) => (
                      <div key={idx} className="bg-background border border-border rounded-xl p-4 flex-1 min-w-[250px] shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-muted-foreground line-through decoration-muted-foreground/50">{item.word}</span>
                          <span className="text-purple-500 font-bold">→</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {item.better_words.map((w, i) => (
                            <span key={i} className="px-2 py-1 bg-purple-500/10 text-purple-600 border border-purple-500/20 rounded-lg text-sm font-medium">
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
                <div className="bg-card shadow-sm border border-border rounded-3xl p-6">
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <PenTool className="w-5 h-5 text-amber-500" /> Sentence Variety
                  </h3>
                  <div className="space-y-4">
                    {result.sentence_variety.map((item, idx) => (
                      <div key={idx} className="bg-muted/50 rounded-2xl p-4 border border-border">
                        <p className="text-sm font-bold text-foreground mb-2">Masalah:</p>
                        <p className="text-sm text-muted-foreground mb-4">{item.feedback}</p>
                        
                        <p className="text-sm font-bold text-foreground mb-2">Contoh Revisi:</p>
                        <p className="text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-sm italic">
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
