"use client";

import Swal from 'sweetalert2';
import { useState, useEffect } from "react";
import { Edit3, RefreshCw, Loader2, Award, ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";

interface Challenge {
  quote: string;
  author: string;
  book: string;
}

export default function ParaphraseChallengePage() {
  const [level, setLevel] = useState("B2");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loadingChallenge, setLoadingChallenge] = useState(false);
  
  const [paraphrase, setParaphrase] = useState("");
  const [loadingEval, setLoadingEval] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const generateChallenge = async (targetLevel = level) => {
    setLoadingChallenge(true);
    setResult(null);
    setParaphrase("");
    try {
      const res = await fetch(`/api/tools/paraphrase/generate?level=${targetLevel}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setChallenge(data);
    } catch (error) {
      Swal.fire({ title: "Perhatian", text: "Gagal memuat tantangan.", icon: "info", confirmButtonColor: "#2fa16b" });
    } finally {
      setLoadingChallenge(false);
    }
  };

  useEffect(() => {
    generateChallenge();
  }, []);

  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLvl = e.target.value;
    setLevel(newLvl);
    generateChallenge(newLvl);
  };

  const handleEvaluate = async () => {
    if (!paraphrase.trim() || !challenge) return;
    setLoadingEval(true);
    try {
      const res = await fetch("/api/tools/paraphrase/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote: challenge.quote, paraphrase }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data.result);
    } catch (error: any) {
      Swal.fire({ title: "Informasi", text: String(error.message), icon: "warning", confirmButtonColor: "#2fa16b" });
    } finally {
      setLoadingEval(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto min-h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/tools" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors w-max min-h-[44px]">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Toolkits
      </Link>

      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-[28px] md:text-4xl leading-[1.15] font-serif font-medium text-foreground flex items-center gap-3">
            <Edit3 className="w-8 h-8 text-brand-ink" />
            Paraphrase Challenge
          </h1>
          <p className="text-muted-foreground mt-2">Latih kemampuan menulis ulang tanpa kehilangan esensi makna dan nuansa.</p>
        </div>
        
        <div className="w-full md:w-48">
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Tingkat Kesulitan CEFR</label>
          <select 
            value={level}
            onChange={handleLevelChange}
            className="w-full bg-background border border-border rounded-control p-3 text-foreground font-bold focus:ring-2 focus:ring-brand outline-none cursor-pointer"
          >
            <option value="B1">B1 (Intermediate)</option>
            <option value="B2">B2 (Upper Intermediate)</option>
            <option value="C1">C1 (Advanced Literary)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-card border border-border rounded-card p-4 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-muted opacity-50" />
          
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold text-brand-ink uppercase tracking-wider">Tantangan Saat Ini</h2>
            <button onClick={() => generateChallenge()} disabled={loadingChallenge} className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground bg-muted px-3 py-2 min-h-[44px] rounded-control transition-colors">
              <RefreshCw className={`w-4 h-4 ${loadingChallenge ? "animate-spin" : ""}`} /> Ganti Teks
            </button>
          </div>

          <div className="bg-background border border-border rounded-card p-4 md:p-8 mb-8 min-h-[150px] flex flex-col justify-center">
            {loadingChallenge || !challenge ? (
              <div className="flex justify-center items-center gap-3 text-brand-ink">
                <Loader2 className="w-6 h-6 animate-spin" /> Meracik tantangan sastra...
              </div>
            ) : (
              <>
                <p className="text-2xl font-serif text-foreground/90 italic leading-relaxed text-center mb-6">"{challenge.quote}"</p>
                <div className="text-center text-sm font-bold text-muted-foreground uppercase tracking-widest">
                  — {challenge.author}, <span className="text-brand-ink">{challenge.book}</span>
                </div>
              </>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-foreground uppercase tracking-wider mb-3">Versi Parafrase Anda (English)</label>
            <textarea
              value={paraphrase}
              onChange={(e) => setParaphrase(e.target.value)}
              disabled={loadingChallenge || !challenge}
              placeholder="Tulis ulang kalimat di atas dengan struktur dan kosa kata yang berbeda, namun pertahankan makna dan 'rasa' alaminya..."
              className="w-full h-32 bg-background border border-border rounded-card p-4 text-foreground font-serif focus:ring-1 focus:ring-brand focus:border-brand focus:outline-none resize-none"
            ></textarea>
          </div>

          <button
            onClick={handleEvaluate}
            disabled={loadingEval || !paraphrase.trim() || !challenge}
            className="w-full py-4 bg-brand-solid hover:bg-brand-hover text-on-brand font-bold text-lg rounded-control transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loadingEval ? <Loader2 className="w-6 h-6 animate-spin" /> : <Award className="w-6 h-6" />}
            Evaluasi Parafrase Saya
          </button>
        </div>

        {result && (
          <div className="bg-card border border-brand/30 rounded-card p-4 md:p-8 relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h2 className="text-2xl font-serif font-medium text-brand-ink mb-6 border-b border-brand/20 pb-4">Feedback Evaluator</h2>
            <div className="prose dark:prose-invert prose-brand max-w-none prose-p:leading-relaxed prose-headings:font-serif">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
