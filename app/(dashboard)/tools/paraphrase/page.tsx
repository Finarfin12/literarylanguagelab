"use client";

import { useState, useEffect } from "react";
import { Edit3, RefreshCw, Loader2, Award, ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
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
      alert("Gagal memuat tantangan.");
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
      alert(error.message);
    } finally {
      setLoadingEval(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/tools" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors w-max">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Toolkits
      </Link>

      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-4xl font-serif font-bold text-foreground flex items-center gap-3">
            <Edit3 className="w-8 h-8 text-brand" />
            Paraphrase Challenge
          </h1>
          <p className="text-muted-foreground mt-2">Latih kemampuan menulis ulang tanpa kehilangan esensi makna dan nuansa.</p>
        </div>
        
        <div className="w-full md:w-48">
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Tingkat Kesulitan CEFR</label>
          <select 
            value={level}
            onChange={handleLevelChange}
            className="w-full bg-background border border-white/20 rounded-xl p-3 text-foreground font-bold focus:ring-2 focus:ring-brand outline-none cursor-pointer"
          >
            <option value="B1">B1 (Intermediate)</option>
            <option value="B2">B2 (Upper Intermediate)</option>
            <option value="C1">C1 (Advanced Literary)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="bg-card/40 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/0 via-blue-500 to-blue-500/0 opacity-50" />
          
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider">Tantangan Saat Ini</h2>
            <button onClick={() => generateChallenge()} disabled={loadingChallenge} className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground bg-white/5 px-3 py-2 rounded-lg transition-colors">
              <RefreshCw className={`w-4 h-4 ${loadingChallenge ? "animate-spin" : ""}`} /> Ganti Teks
            </button>
          </div>

          <div className="bg-background/40 border border-white/5 rounded-2xl p-8 mb-8 min-h-[150px] flex flex-col justify-center">
            {loadingChallenge || !challenge ? (
              <div className="flex justify-center items-center gap-3 text-brand">
                <Loader2 className="w-6 h-6 animate-spin" /> Meracik tantangan sastra...
              </div>
            ) : (
              <>
                <p className="text-2xl font-serif text-foreground/90 italic leading-relaxed text-center mb-6">"{challenge.quote}"</p>
                <div className="text-center text-sm font-bold text-muted-foreground uppercase tracking-widest">
                  — {challenge.author}, <span className="text-brand">{challenge.book}</span>
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
              className="w-full h-32 bg-background/50 border border-white/10 rounded-2xl p-4 text-foreground font-serif focus:ring-1 focus:ring-brand focus:border-brand focus:outline-none resize-none"
            ></textarea>
          </div>

          <button
            onClick={handleEvaluate}
            disabled={loadingEval || !paraphrase.trim() || !challenge}
            className="w-full py-4 bg-gradient-to-r from-brand to-brand-hover text-background font-bold text-lg rounded-xl hover:shadow-[0_0_30px_rgba(62,207,142,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loadingEval ? <Loader2 className="w-6 h-6 animate-spin" /> : <Award className="w-6 h-6" />}
            Evaluasi Parafrase Saya
          </button>
        </div>

        {result && (
          <div className="bg-card/60 backdrop-blur-2xl border border-brand/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h2 className="text-2xl font-serif font-bold text-brand mb-6 border-b border-brand/20 pb-4">Feedback Evaluator</h2>
            <div className="prose dark:prose-invert prose-brand max-w-none prose-p:leading-relaxed prose-headings:font-serif">
              <ReactMarkdown>{result}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
