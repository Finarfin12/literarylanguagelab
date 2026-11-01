"use client";

import TryExampleButton from "@/components/ui/TryExampleButton";
import { TONE_ANALYZER_EXAMPLE } from "@/lib/tool-examples";
import Swal from 'sweetalert2';
import { useState } from "react";
import { FileText, Loader2, Wand2, Search, Shuffle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ToneAnalyzerPage() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"detect" | "transform">("detect");
  const [targetTone, setTargetTone] = useState("Akademis Profesional");
  const [customTone, setCustomTone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const TONE_OPTIONS = [
    "Akademis Profesional",
    "Sastra Puitis",
    "Persuasif Marketing",
    "Penerjemahan",
    "Formal",
    "Casual",
    "Sarcastic",
    "Romantic",
    "Gothic",
    "Melancholic",
  ];
  const CUSTOM = "__custom__";
  const effectiveTone = targetTone === CUSTOM ? customTone.trim() : targetTone;

  const handleAnalyze = async () => {
    if (!text.trim()) {
      Swal.fire({ title: "Perhatian", text: "Masukkan teks terlebih dahulu!", icon: "info", confirmButtonColor: "#2fa16b" });
      return;
    }

    if (mode === "transform" && !effectiveTone) {
      Swal.fire({ title: "Perhatian", text: "Tulis nada tujuan terlebih dahulu.", icon: "info", confirmButtonColor: "#2fa16b" });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/tools/tone-analyzer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          mode,
          targetTone: mode === "transform" ? effectiveTone : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResult(data.result);
    } catch (error: any) {
      Swal.fire({ title: "Error", text: String(error.message), icon: "error", confirmButtonColor: "#2fa16b" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10">
        <h1 className="text-[28px] md:text-4xl leading-[1.15] font-serif font-medium text-foreground flex items-center gap-3">
          <FileText className="w-8 h-8 text-brand-ink" />
          Tone & Gaya
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Kenali nada sebuah teks beserta ciri bahasanya, atau ubah ke nada lain. Pilih mode di bawah.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-card border border-border rounded-card p-4 md:p-8 relative overflow-hidden">

          <div className="flex mb-6 bg-muted rounded-control p-1">
            <button
              onClick={() => setMode("detect")}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === "detect" ? "bg-brand-solid text-on-brand " : "text-muted-foreground hover:text-foreground"}`}
            >
              <Search className="w-4 h-4" /> Deteksi Nada
            </button>
            <button
              onClick={() => setMode("transform")}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${mode === "transform" ? "bg-brand-solid text-on-brand " : "text-muted-foreground hover:text-foreground"}`}
            >
              <Shuffle className="w-4 h-4" /> Analisis &amp; Ubah Nada
            </button>
          </div>

          {mode === "transform" && (
            <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-sm font-bold text-brand-ink uppercase tracking-wider mb-3">Nada tujuan</label>
              <select
                value={targetTone}
                onChange={(e) => setTargetTone(e.target.value)}
                className="w-full bg-background border border-foreground/20 rounded-control p-4 text-foreground focus:ring-2 focus:ring-brand focus:border-transparent outline-none cursor-pointer "
              >
                {TONE_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
                <option value={CUSTOM}>Tulis sendiri...</option>
              </select>
              {targetTone === CUSTOM && (
                <input
                  type="text"
                  value={customTone}
                  onChange={(e) => setCustomTone(e.target.value)}
                  maxLength={80}
                  placeholder="Contoh: lembut seperti surat dari sahabat lama"
                  aria-label="Nada tujuan buatan sendiri"
                  className="mt-3 w-full min-h-[44px] bg-background border border-foreground/20 rounded-control p-3 text-foreground focus:ring-2 focus:ring-brand outline-none"
                />
              )}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-bold text-foreground uppercase tracking-wider mb-3">
              Input Text (English)
              {mode === "detect" && <span className="text-muted-foreground font-normal ml-2">— nada dan ciri bahasanya dideteksi tanpa mengubah teks</span>}
            </label>
            <TryExampleButton example={TONE_ANALYZER_EXAMPLE} onFill={setText} className="mb-2" />
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste English text here..."
              className="w-full h-48 bg-background border border-border rounded-card p-4 text-foreground font-serif focus:ring-1 focus:ring-brand focus:border-brand focus:outline-none resize-none"
            ></textarea>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="px-4 md:px-8 py-4 bg-brand-solid text-on-brand font-bold rounded-control transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
              {mode === "detect" ? "Deteksi Nada" : "Analisis & Ubah Nada"}
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-card border border-border rounded-card p-4 md:p-8 relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h2 className="text-2xl font-serif font-medium text-brand-ink mb-6 border-b border-border pb-4">Hasil</h2>
            <div className="prose dark:prose-invert prose-brand max-w-none prose-p:leading-relaxed prose-headings:font-serif">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
