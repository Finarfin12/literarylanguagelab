"use client";

import { useState } from "react";
import { Search, Sparkles, Loader2, BookmarkPlus, Mic, MicOff, Hash, BookOpen, Quote, TrendingUp, CheckCircle } from "lucide-react";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { TRENDING_SLANG } from "@/lib/trending-slang";
import { createClient } from "@/utils/supabase/client";
import Swal from "sweetalert2";

interface DecodedPhrase {
  phrase: string;
  type: string;
  meaning_id: string;
  meaning_en: string;
  formality: number;
  origin: string;
  formal_equivalent: string;
  example: string;
}

interface SlangResult {
  phrases: DecodedPhrase[];
  overall_meaning_id?: string;
}

const TYPE_COLORS: Record<string, string> = {
  "Slang": "bg-purple-500/15 text-purple-400 border-purple-500/30",
  "Abbreviation": "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "Internet Lingo": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "Pop Culture": "bg-pink-500/15 text-pink-400 border-pink-500/30",
  "Idiom": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "Business Jargon": "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

export default function SlangDecoderPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SlangResult | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const supabase = createClient();

  const { isRecording, isProcessing, transcript, startRecording, stopRecording } = useSpeechToText({
    onComplete: (speechText) => {
      setText((prev) => prev + (prev.trim() ? " " : "") + speechText);
    }
  });

  const handleDecode = async (inputToDecode = text) => {
    const input = inputToDecode.trim();
    if (!input) return;

    setLoading(true);
    setResult(null);
    setText(input);

    try {
      const res = await fetch("/api/slang-decoder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      Swal.fire({ title: "Error", text: err.message, icon: "error", confirmButtonColor: "#2fa16b" });
    } finally {
      setLoading(false);
    }
  };

  const saveToDictionary = async (phrase: DecodedPhrase) => {
    setSaving(phrase.phrase);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Swal.fire({ title: "Gagal", text: "Anda harus login untuk menyimpan idiom.", icon: "error" });
      setSaving(null);
      return;
    }

    try {
      const { error } = await supabase.from('idioms').insert({
        user_id: user.id,
        idiom: phrase.phrase,
        meaning: phrase.meaning_en,
        context: phrase.origin,
        indonesian_translation: phrase.meaning_id,
        example_sentence: phrase.example
      });

      if (error) {
        if (error.code === '23505') throw new Error("Frasa ini sudah ada di kamus Anda!");
        throw error;
      }
      
      Swal.fire({
        title: "Tersimpan!",
        text: `"${phrase.phrase}" berhasil disimpan ke kamus idiom.`,
        icon: "success",
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err: any) {
      Swal.fire({ title: "Info", text: err.message, icon: "info", confirmButtonColor: "#2fa16b" });
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto min-h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground flex items-center gap-3">
          <Hash className="w-8 h-8 text-brand" /> Modern Slang Decoder
        </h1>
        <p className="text-muted-foreground mt-2 text-base sm:text-lg">Kamus gaul bertenaga AI. Pahami bahasa gaul internet, singkatan, dan referensi budaya pop dalam bahasa Indonesia santai.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Content Area (Col Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Input Panel */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand/0 via-purple-500 to-brand/0 opacity-50" />
            
            <div className="flex gap-3 items-start">
              <div className="flex-1 relative">
                <textarea
                  value={text + (isRecording ? (text.trim() ? " " : "") + transcript : "")}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleDecode(); } }}
                  placeholder="Ketik kalimat atau frasa gaul (misal: 'That movie was lowkey mid, no cap')..."
                  className="w-full h-32 bg-background border border-border rounded-2xl p-4 pr-12 text-foreground focus:ring-1 focus:ring-purple-500 focus:border-purple-500 focus:outline-none resize-none text-lg leading-relaxed shadow-inner"
                  disabled={loading}
                />
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing || loading}
                  className={`absolute right-3 top-3 p-2 rounded-xl transition-all ${isRecording ? "bg-red-500 text-white animate-pulse" : "text-muted-foreground hover:bg-purple-500/10 hover:text-purple-400"}`}
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <button
              onClick={() => handleDecode()}
              disabled={loading || !text.trim()}
              className="w-full mt-4 py-4 bg-purple-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-purple-600 hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all disabled:opacity-50"
            >
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Mendecode...</> : <><Sparkles className="w-5 h-5" /> Decode Slang</>}
            </button>
          </div>

          {/* Results Area */}
          {result && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              {result.overall_meaning_id && result.phrases.length > 0 && (
                <div className="bg-brand/10 border border-brand/20 rounded-2xl p-5">
                  <h3 className="text-xs font-bold text-brand uppercase tracking-wider mb-2 flex items-center gap-2"><Quote className="w-4 h-4" /> Terjemahan Kalimat</h3>
                  <p className="text-foreground text-lg italic">"{result.overall_meaning_id}"</p>
                </div>
              )}

              {result.phrases.map((phrase, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-black text-foreground">{phrase.phrase}</h2>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${TYPE_COLORS[phrase.type] || "bg-muted text-muted-foreground border-border"}`}>
                          {phrase.type}
                        </span>
                      </div>
                      <p className="text-lg text-purple-400 font-medium">{phrase.meaning_id}</p>
                    </div>
                    <button
                      onClick={() => saveToDictionary(phrase)}
                      disabled={saving === phrase.phrase}
                      className="shrink-0 flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 border border-border rounded-xl text-sm font-bold text-foreground transition-colors"
                    >
                      {saving === phrase.phrase ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookmarkPlus className="w-4 h-4" />} Simpan
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="bg-background rounded-xl p-4 border border-border/50">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Makna Asli (Inggris)</p>
                      <p className="text-sm text-foreground/90">{phrase.meaning_en}</p>
                    </div>
                    <div className="bg-background rounded-xl p-4 border border-border/50">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Asal Usul / Konteks</p>
                      <p className="text-sm text-foreground/90">{phrase.origin}</p>
                    </div>
                  </div>

                  <div className="mt-4 bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
                    <p className="text-xs text-purple-400 uppercase tracking-wider font-bold mb-2 flex items-center gap-2"><Quote className="w-3 h-3" /> Contoh Penggunaan</p>
                    <p className="text-foreground italic">{phrase.example}</p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-bold">Formalitas:</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(level => (
                          <div key={level} className={`w-6 h-2 rounded-full ${level <= phrase.formality ? (phrase.formality <= 2 ? "bg-red-400" : phrase.formality <= 3 ? "bg-amber-400" : "bg-emerald-400") : "bg-muted"}`} />
                        ))}
                      </div>
                      <span className="text-xs font-bold ml-1">{phrase.formality <= 2 ? "Sangat Kasual" : phrase.formality <= 3 ? "Biasa" : "Formal"}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground font-bold">Padanan Formal:</p>
                      <p className="text-sm text-foreground">{phrase.formal_equivalent}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!result && !loading && (
             <div className="bg-card border border-border rounded-3xl p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
                <Search className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-medium">Ketik frasa gaul atau singkatan internet di atas.</p>
                <p className="text-sm mt-2">AI akan menganalisis maknanya dalam konteks budaya pop.</p>
             </div>
          )}
        </div>

        {/* Sidebar: Trending Slang */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-3xl p-6 sticky top-6 shadow-sm">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand" /> Trending Slang
            </h3>
            <div className="flex flex-wrap gap-2">
              {TRENDING_SLANG.map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleDecode(item.phrase)}
                  className="text-left px-3 py-2 bg-muted hover:bg-purple-500/10 hover:text-purple-400 hover:border-purple-500/30 border border-transparent rounded-xl text-sm transition-all flex flex-col group"
                >
                  <span className="font-bold text-foreground group-hover:text-purple-400 transition-colors">{item.phrase}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">{item.category}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
