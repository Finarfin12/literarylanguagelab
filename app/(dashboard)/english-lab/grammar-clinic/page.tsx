"use client";

import { useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, Loader2, Mic, MicOff, Sparkles, ArrowRight, Lightbulb, Copy, Check } from "lucide-react";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import Swal from "sweetalert2";

interface Correction {
  original: string;
  corrected: string;
  category: string;
  explanation_id: string;
  explanation_en: string;
}

interface GrammarResult {
  score: number;
  corrections: Correction[];
  corrected_text: string;
  tips: string[];
}

const CATEGORY_COLORS: Record<string, string> = {
  "Tense": "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "Subject-Verb Agreement": "bg-purple-500/15 text-purple-400 border-purple-500/30",
  "Article": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "Preposition": "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
  "Spelling": "bg-red-500/15 text-red-400 border-red-500/30",
  "Punctuation": "bg-pink-500/15 text-pink-400 border-pink-500/30",
  "Word Choice": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "Plural/Singular": "bg-orange-500/15 text-orange-400 border-orange-500/30",
  "Run-on Sentence": "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  "Fragment": "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

function ScoreRing({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 90 ? "#22c55e" : score >= 70 ? "#eab308" : score >= 50 ? "#f97316" : "#ef4444";

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="currentColor" className="text-foreground/10" strokeWidth="8" />
        <circle
          cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-foreground">{score}</span>
        <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Skor</span>
      </div>
    </div>
  );
}

export default function GrammarClinicPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GrammarResult | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const { isRecording, isProcessing, transcript, startRecording, stopRecording } = useSpeechToText({
    onComplete: (speechText) => {
      setText((prev) => prev + (prev.trim() ? " " : "") + speechText);
    }
  });

  const handleAnalyze = async () => {
    const input = text.trim();
    if (!input) {
      Swal.fire({ title: "Perhatian", text: "Masukkan teks bahasa Inggris terlebih dahulu!", icon: "warning", confirmButtonColor: "#2fa16b" });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/grammar-clinic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menganalisis");
      setResult(data);
    } catch (err: any) {
      Swal.fire({ title: "Gagal", text: err.message, icon: "error", confirmButtonColor: "#2fa16b" });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCorrected = () => {
    if (result?.corrected_text) {
      navigator.clipboard.writeText(result.corrected_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto min-h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground flex items-center gap-3">
          <CheckCircle className="w-8 h-8 text-brand" />
          Grammar Clinic
        </h1>
        <p className="text-muted-foreground mt-2 text-base sm:text-lg">Tempel teks bahasa Inggris Anda (email, pesan, esai) dan AI akan mengoreksi grammar beserta penjelasan dalam bahasa Indonesia.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand/0 via-brand to-brand/0 opacity-50" />
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-foreground">Teks Asli (English)</h2>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              title="Dikte Teks"
              className={`p-2 rounded-xl transition-all ${
                isRecording
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-muted text-muted-foreground hover:bg-brand/10 hover:text-brand"
              }`}
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>
          <textarea
            value={text + (isRecording ? (text.trim() ? " " : "") + transcript : "")}
            onChange={(e) => setText(e.target.value)}
            placeholder="Contoh: I goed to the store yesterday and buyed some milks. Me and my friend was very happy..."
            className="w-full h-56 bg-background border border-border rounded-2xl p-4 text-foreground focus:ring-1 focus:ring-brand focus:border-brand focus:outline-none resize-none text-sm leading-relaxed"
          />
          <button
            onClick={handleAnalyze}
            disabled={loading || !text.trim()}
            className="w-full mt-4 py-3.5 bg-brand text-background font-bold rounded-xl flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(62,207,142,0.3)] transition-all disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Menganalisis Grammar...</>
            ) : (
              <><Sparkles className="w-5 h-5" /> Periksa Grammar</>
            )}
          </button>
        </div>

        {/* Result Panel */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden min-h-[400px] flex flex-col">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand/0 via-emerald-400 to-brand/0 opacity-50" />

          {!result && !loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground">
              <CheckCircle className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg">Hasil koreksi akan muncul di sini.</p>
              <p className="text-sm mt-1">Masukkan teks di sebelah kiri dan tekan "Periksa Grammar".</p>
            </div>
          ) : loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-brand">
              <Loader2 className="w-12 h-12 animate-spin mb-4" />
              <p className="animate-pulse">AI sedang memeriksa grammar Anda...</p>
            </div>
          ) : result ? (
            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Score */}
              <div className="text-center">
                <ScoreRing score={result.score} />
                <p className="mt-3 text-sm text-muted-foreground">
                  {result.score >= 90 ? "Luar biasa! Grammar Anda sangat baik!" :
                   result.score >= 70 ? "Cukup baik! Beberapa hal masih bisa diperbaiki." :
                   result.score >= 50 ? "Perlu perbaikan. Perhatikan koreksi di bawah." :
                   "Banyak kesalahan ditemukan. Mari perbaiki satu per satu!"}
                </p>
              </div>

              {/* Corrections */}
              {result.corrections.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    {result.corrections.length} Koreksi Ditemukan
                  </h3>
                  <div className="space-y-2">
                    {result.corrections.map((c, i) => (
                      <div key={i} className="border border-border rounded-xl overflow-hidden">
                        <button
                          onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                          className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
                        >
                          <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                          <span className="text-sm text-red-400 line-through flex-1">{c.original}</span>
                          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-sm text-emerald-400 font-medium flex-1">{c.corrected}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${CATEGORY_COLORS[c.category] || "bg-muted text-muted-foreground border-border"}`}>
                            {c.category}
                          </span>
                        </button>
                        {expandedIdx === i && (
                          <div className="px-4 pb-3 pt-1 bg-muted/30 border-t border-border animate-in fade-in slide-in-from-top-2 duration-200">
                            <p className="text-sm text-foreground/90 leading-relaxed">{c.explanation_id}</p>
                            <p className="text-xs text-muted-foreground italic mt-1">{c.explanation_en}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Corrected Text */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-brand" /> Teks yang Diperbaiki
                  </h3>
                  <button onClick={handleCopyCorrected} className="text-xs text-muted-foreground hover:text-brand flex items-center gap-1 transition-colors">
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Tersalin!" : "Salin"}
                  </button>
                </div>
                <div className="bg-brand/5 border border-brand/20 rounded-xl p-4 text-sm text-foreground leading-relaxed">
                  {result.corrected_text}
                </div>
              </div>

              {/* Tips */}
              {result.tips && result.tips.length > 0 && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" /> Tips Peningkatan
                  </h3>
                  <ul className="space-y-1">
                    {result.tips.map((tip, i) => (
                      <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                        <span className="text-amber-400 mt-1">•</span> {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
