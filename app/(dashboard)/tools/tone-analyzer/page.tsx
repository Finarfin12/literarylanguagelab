"use client";

import { useState } from "react";
import { FileText, Loader2, Wand2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function ToneAnalyzerPage() {
  const [text, setText] = useState("");
  const [targetTone, setTargetTone] = useState("Akademis Profesional");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const OPTIONS = [
    "Akademis Profesional",
    "Sastra Puitis",
    "Persuasif Marketing",
    "Penerjemahan"
  ];

  const handleAnalyze = async () => {
    if (!text.trim()) {
      alert("Masukkan teks terlebih dahulu!");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/tools/tone-analyzer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetTone }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResult(data.result);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10">
        <h1 className="text-4xl font-serif font-bold text-foreground flex items-center gap-3">
          <FileText className="w-8 h-8 text-brand" />
          Tone & Grammar Analyzer
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Analisis struktur grammar, perkirakan level CEFR, dan rombak *tone* teks ke berbagai gaya bahasa.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-card/40 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand/0 via-brand to-brand/0 opacity-50" />
          
          <div className="mb-6">
            <label className="block text-sm font-bold text-brand uppercase tracking-wider mb-3">Target Tone</label>
            <select 
              value={targetTone}
              onChange={(e) => setTargetTone(e.target.value)}
              className="w-full bg-background border border-white/10 rounded-xl p-4 text-foreground focus:ring-2 focus:ring-brand focus:border-transparent outline-none appearance-none cursor-pointer"
            >
              {OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-foreground uppercase tracking-wider mb-3">Input Text (English)</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste text here..."
              className="w-full h-48 bg-background/50 border border-white/10 rounded-2xl p-4 text-foreground font-serif focus:ring-1 focus:ring-brand focus:border-brand focus:outline-none resize-none"
            ></textarea>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="px-8 py-4 bg-brand text-background font-bold rounded-xl hover:shadow-[0_0_20px_rgba(62,207,142,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
              Analyze & Transform
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-card/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h2 className="text-2xl font-serif font-bold text-brand mb-6 border-b border-white/10 pb-4">Analysis Result</h2>
            <div className="prose dark:prose-invert prose-brand max-w-none prose-p:leading-relaxed prose-headings:font-serif">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
