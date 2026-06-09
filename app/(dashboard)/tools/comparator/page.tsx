"use client";

import { useState } from "react";
import { GitCompare, ArrowRight, Loader2, BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function ComparatorPage() {
  const [originalText, setOriginalText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleCompare = async () => {
    if (!originalText.trim() || !translatedText.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/comparator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalText, translatedText }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResult(data.result);
    } catch (error: any) {
      console.error(error);
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10">
        <h1 className="text-4xl font-serif font-bold text-foreground flex items-center gap-3">
          <GitCompare className="w-8 h-8 text-rose-500" />
          Side-by-Side Comparator
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Pelajari strategi dari para ahli. Bandingkan teks asli dengan terjemahan profesional untuk membedah keputusan penerjemahnya secara mendalam.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Original Text */}
        <div className="bg-card shadow-sm border border-border rounded-3xl p-6 shadow-xl flex flex-col">
          <h2 className="text-sm font-bold text-rose-400 mb-4 uppercase tracking-wider">Original Text (English)</h2>
          <textarea
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
            placeholder='Contoh: "It is a truth universally acknowledged..."'
            className="w-full flex-1 min-h-[250px] bg-background border border-border rounded-2xl p-5 text-foreground font-serif text-lg leading-relaxed focus:ring-1 focus:ring-rose-500 focus:outline-none resize-none"
          ></textarea>
        </div>

        {/* Professional Translation */}
        <div className="bg-card shadow-sm border border-border rounded-3xl p-6 shadow-xl flex flex-col">
          <h2 className="text-sm font-bold text-brand mb-4 uppercase tracking-wider">Professional Translation (Indonesian)</h2>
          <textarea
            value={translatedText}
            onChange={(e) => setTranslatedText(e.target.value)}
            placeholder='Contoh: "Adalah kebenaran yang diakui secara universal..."'
            className="w-full flex-1 min-h-[250px] bg-background border border-border rounded-2xl p-5 text-foreground font-serif text-lg leading-relaxed focus:ring-1 focus:ring-brand focus:outline-none resize-none"
          ></textarea>
        </div>
      </div>

      <div className="flex justify-center mb-12">
        <button
          onClick={handleCompare}
          disabled={loading || !originalText || !translatedText}
          className="px-10 py-4 bg-rose-500 text-white font-bold text-lg rounded-2xl hover:bg-rose-600 transition-all duration-300 disabled:opacity-50 flex items-center gap-3 shadow-lg hover:shadow-rose-500/20"
        >
          {loading ? (
            <><Loader2 className="w-6 h-6 animate-spin" /> Menganotasi Strategi...</>
          ) : (
            <><GitCompare className="w-6 h-6" /> Bandingkan & Analisis</>
          )}
        </button>
      </div>

      {result && (
        <div className="bg-card shadow-sm border border-rose-500/30 rounded-3xl p-8 lg:p-12 shadow-2xl relative overflow-hidden mb-12 animate-in fade-in slide-in-from-bottom-8">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <BookOpen className="w-64 h-64 text-rose-500" />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-2xl font-serif font-bold text-rose-500 mb-8 border-b border-border pb-4">
              Annotated Analysis
            </h2>
            <div className="prose dark:prose-invert prose-rose max-w-none prose-lg prose-headings:font-serif prose-headings:text-rose-500">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
