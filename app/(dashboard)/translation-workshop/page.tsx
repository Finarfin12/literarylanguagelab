"use client";

import { useState } from "react";
import { Languages, ArrowRight, Loader2, Award, CheckCircle2, ArrowLeftRight, FileType2, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Swal from 'sweetalert2';

export default function TranslationWorkshopPage() {
  const [originalText, setOriginalText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [mode, setMode] = useState("general");

  const handleEvaluate = async () => {
    if (!originalText.trim() || !translatedText.trim()) {
      Swal.fire({ title: "Oops!", text: "Harap isi teks asli dan terjemahan Anda!", icon: "warning", confirmButtonColor: "#2fa16b" });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/translation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalText, translatedText, mode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResult(data.result);
    } catch (error: any) {
      console.error(error);
      Swal.fire({ title: "Error", text: error.message, icon: "error", confirmButtonColor: "#2fa16b" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-2xl md:text-4xl font-serif font-bold text-foreground flex items-center gap-3">
          <Languages className="w-8 h-8 text-brand" />
          Translation Workshop
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Ruang kerja penerjemahan sastra. Latih kepekaan Anda dalam mentransfer makna, nuansa, dan citraan dari bahasa Inggris ke bahasa Indonesia.</p>
      </div>

      {/* Mode Selection */}
      <div className="flex flex-wrap items-center gap-4 mb-8 bg-card shadow-sm border border-border p-2 rounded-2xl">
        <button 
          onClick={() => setMode("general")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${mode === "general" ? "bg-brand text-background shadow-md" : "text-muted-foreground hover:bg-muted"}`}
        >
          <CheckCircle2 className="w-4 h-4" /> Feedback Umum
        </button>
        <button 
          onClick={() => setMode("equivalence")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${mode === "equivalence" ? "bg-blue-500 text-white shadow-md" : "text-muted-foreground hover:bg-muted"}`}
        >
          <ArrowLeftRight className="w-4 h-4" /> Equivalence Checker
        </button>
        <button 
          onClick={() => setMode("register")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${mode === "register" ? "bg-amber-500 text-white shadow-md" : "text-muted-foreground hover:bg-muted"}`}
        >
          <FileType2 className="w-4 h-4" /> Register Matcher
        </button>
        <button 
          onClick={() => setMode("back_translation")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all ${mode === "back_translation" ? "bg-purple-500 text-white shadow-md" : "text-muted-foreground hover:bg-muted"}`}
        >
          <RotateCcw className="w-4 h-4" /> Back-Translation
        </button>
      </div>

      {/* Split Screen Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Original Text */}
        <div className="bg-card shadow-sm backdrop-blur-md border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/0 via-blue-500 to-blue-500/0 opacity-50" />
          <h2 className="text-sm font-bold text-blue-400 mb-4 uppercase tracking-wider">Original Text (English)</h2>
          <textarea
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
            placeholder="Paste teks sastra asli di sini..."
            className="w-full flex-1 min-h-[300px] bg-background border border-border rounded-2xl p-5 text-foreground font-serif text-lg leading-relaxed focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-none resize-none"
          ></textarea>
        </div>

        {/* Translation Text */}
        <div className="bg-card shadow-sm backdrop-blur-md border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand/0 via-brand to-brand/0 opacity-50" />
          <h2 className="text-sm font-bold text-brand mb-4 uppercase tracking-wider">Your Translation (Indonesian)</h2>
          <textarea
            value={translatedText}
            onChange={(e) => setTranslatedText(e.target.value)}
            placeholder="Ketik terjemahan Anda di sini..."
            className="w-full flex-1 min-h-[300px] bg-background border border-border rounded-2xl p-5 text-foreground font-serif text-lg leading-relaxed focus:ring-1 focus:ring-brand focus:border-brand focus:outline-none resize-none"
          ></textarea>
        </div>
      </div>

      <div className="flex justify-center mb-12">
        <button
          onClick={handleEvaluate}
          disabled={loading}
          className="px-5 md:px-10 py-4 bg-gradient-to-r from-brand to-brand-hover text-background font-bold text-lg rounded-2xl hover:shadow-[0_0_30px_rgba(62,207,142,0.4)] hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 flex items-center gap-3"
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
        <div className="bg-card shadow-sm backdrop-blur-2xl border border-brand/30 rounded-3xl p-4 md:p-8 lg:p-12 shadow-2xl relative overflow-hidden mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="absolute top-0 right-0 p-4 md:p-8 opacity-5">
            <Award className="w-64 h-64 text-brand" />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-2xl font-serif font-bold text-brand mb-8 flex items-center gap-3 border-b border-brand/20 pb-4">
              <CheckCircle2 className="w-8 h-8" /> Feedback & Grading
            </h2>
            <div className="prose dark:prose-invert prose-brand max-w-none prose-lg prose-headings:font-serif prose-headings:text-brand prose-p:leading-relaxed prose-li:text-foreground/90">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
