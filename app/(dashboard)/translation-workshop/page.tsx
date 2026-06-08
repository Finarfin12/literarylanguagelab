"use client";

import { useState } from "react";
import { Languages, ArrowRight, Loader2, Award, CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function TranslationWorkshopPage() {
  const [originalText, setOriginalText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleEvaluate = async () => {
    if (!originalText.trim() || !translatedText.trim()) {
      alert("Harap isi teks asli dan terjemahan Anda!");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/translation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalText, translatedText }),
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
    <div className="p-8 max-w-7xl mx-auto min-h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-4xl font-serif font-bold text-foreground flex items-center gap-3">
          <Languages className="w-8 h-8 text-brand" />
          Translation Workshop
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Ruang kerja penerjemahan sastra. Latih kepekaan Anda dalam mentransfer makna, nuansa, dan citraan dari bahasa Inggris ke bahasa Indonesia.</p>
      </div>

      {/* Split Screen Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Original Text */}
        <div className="bg-card/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/0 via-blue-500 to-blue-500/0 opacity-50" />
          <h2 className="text-sm font-bold text-blue-400 mb-4 uppercase tracking-wider">Original Text (English)</h2>
          <textarea
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
            placeholder="Paste teks sastra asli di sini..."
            className="w-full flex-1 min-h-[300px] bg-background/50 border border-white/10 rounded-2xl p-5 text-foreground font-serif text-lg leading-relaxed focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none resize-none"
          ></textarea>
        </div>

        {/* Translation Text */}
        <div className="bg-card/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand/0 via-brand to-brand/0 opacity-50" />
          <h2 className="text-sm font-bold text-brand mb-4 uppercase tracking-wider">Your Translation (Indonesian)</h2>
          <textarea
            value={translatedText}
            onChange={(e) => setTranslatedText(e.target.value)}
            placeholder="Ketik terjemahan Anda di sini..."
            className="w-full flex-1 min-h-[300px] bg-background/50 border border-white/10 rounded-2xl p-5 text-foreground font-serif text-lg leading-relaxed focus:ring-1 focus:ring-brand focus:border-brand focus:outline-none resize-none"
          ></textarea>
        </div>
      </div>

      <div className="flex justify-center mb-12">
        <button
          onClick={handleEvaluate}
          disabled={loading}
          className="px-10 py-4 bg-gradient-to-r from-brand to-brand-hover text-background font-bold text-lg rounded-2xl hover:shadow-[0_0_30px_rgba(62,207,142,0.4)] hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 flex items-center gap-3"
        >
          {loading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" /> Sedang Mengevaluasi Nuansa...
            </>
          ) : (
            <>
              Evaluasi Terjemahan <ArrowRight className="w-6 h-6" />
            </>
          )}
        </button>
      </div>

      {/* Output Panel */}
      {result && (
        <div className="bg-card/60 backdrop-blur-2xl border border-brand/30 rounded-3xl p-8 lg:p-12 shadow-2xl relative overflow-hidden mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Award className="w-64 h-64 text-brand" />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-2xl font-serif font-bold text-brand mb-8 flex items-center gap-3 border-b border-brand/20 pb-4">
              <CheckCircle2 className="w-8 h-8" /> Feedback & Grading
            </h2>
            <div className="prose dark:prose-invert prose-brand max-w-none prose-lg prose-headings:font-serif prose-headings:text-brand prose-p:leading-relaxed prose-li:text-foreground/90">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
