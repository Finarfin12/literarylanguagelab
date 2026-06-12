"use client";

import { useState, useEffect } from "react";
import { PenTool, Flame, Send, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

export default function WritingChallengePage() {
  const [loading, setLoading] = useState(true);
  const [promptData, setPromptData] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [streak, setStreak] = useState(0);
  
  const [response, setResponse] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchChallenge();
  }, []);

  const fetchChallenge = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/writing-challenge");
      const data = await res.json();
      if (!data.error) {
        setPromptData(data.prompt);
        setSubmission(data.submission);
        setStreak(data.streak);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (response.split(" ").length < 20) {
      alert("Tulis setidaknya 20 kata agar AI bisa mengevaluasi dengan baik.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/writing-challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptText: promptData.prompt_text,
          responseText: response
        })
      });
      const data = await res.json();
      if (data.submission) {
        setSubmission(data.submission);
        setStreak(s => s + 1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background min-h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background p-8 lg:p-12 animate-in fade-in zoom-in-95 duration-500">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4 flex items-center gap-4">
              <PenTool className="w-10 h-10 text-brand" /> Writing Streak
            </h1>
            <p className="text-lg text-muted-foreground">Latih habit menulis Anda setiap minggu. Selesaikan tantangan untuk mendapatkan XP.</p>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-3xl p-6 text-center shadow-inner flex flex-col items-center justify-center min-w-[150px]">
            <Flame className="w-8 h-8 text-orange-500 mb-2" />
            <p className="text-3xl font-black text-orange-500">{streak}</p>
            <p className="text-xs font-bold text-orange-500/80 uppercase tracking-widest mt-1">Day Streak</p>
          </div>
        </div>

        {/* Prompt Card */}
        <div className="bg-card border-2 border-brand/20 shadow-lg rounded-3xl p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand/0 via-brand to-brand/0" />
          <p className="text-sm font-bold text-brand uppercase tracking-widest mb-4">Prompt Minggu Ini</p>
          <p className="text-2xl font-serif text-foreground leading-relaxed">
            "{promptData?.prompt_text}"
          </p>
        </div>

        {/* Submission Area */}
        {submission ? (
          <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              <div>
                <h3 className="text-2xl font-serif font-bold text-foreground">Selesai!</h3>
                <p className="text-muted-foreground">Anda sudah menyelesaikan prompt minggu ini.</p>
              </div>
            </div>

            <div className="bg-muted/30 p-6 rounded-2xl border border-border mb-8">
              <p className="text-foreground whitespace-pre-wrap font-serif italic text-lg leading-relaxed">
                {submission.response}
              </p>
            </div>

            <h4 className="font-bold text-lg mb-4 flex items-center gap-2">AI Feedback <span className="bg-brand/10 text-brand px-3 py-1 rounded-full text-sm">Skor: {submission.scores?.score}/100</span></h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6">
                <p className="text-emerald-600 font-bold mb-2">Pujian Kosakata</p>
                <ul className="list-disc pl-5 text-sm text-emerald-600/80 space-y-1">
                  {submission.scores?.vocabulary_praise?.map((v: string, i: number) => <li key={i}>{v}</li>)}
                </ul>
              </div>
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
                <p className="text-red-600 font-bold mb-2">Masalah Grammar</p>
                <ul className="list-disc pl-5 text-sm text-red-600/80 space-y-1">
                  {submission.scores?.grammar_issues?.map((g: string, i: number) => <li key={i}>{g}</li>)}
                </ul>
              </div>
            </div>
            <div className="mt-6 bg-brand/5 p-6 rounded-2xl border border-brand/20">
              <p className="font-bold mb-2 text-brand">Kesimpulan AI</p>
              <p className="text-sm text-foreground">{submission.scores?.feedback}</p>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
            <h3 className="text-xl font-bold text-foreground mb-4">Tulis Respon Anda</h3>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Mulai menulis di sini... (Target: ~100 kata)"
              rows={8}
              className="w-full bg-background border border-foreground/20 rounded-2xl p-6 text-foreground text-lg focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 resize-none font-serif leading-relaxed shadow-inner"
            />
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground font-bold">
                Kata: <span className={response.split(/\s+/).filter(w => w.length > 0).length < 20 ? 'text-red-400' : 'text-emerald-500'}>{response.split(/\s+/).filter(w => w.length > 0).length}</span>
              </p>
              <button
                onClick={handleSubmit}
                disabled={submitting || response.split(/\s+/).filter(w => w.length > 0).length < 20}
                className="px-8 py-3 bg-brand text-white font-bold rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand/20 disabled:opacity-50 disabled:hover:scale-100 flex items-center gap-2"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {submitting ? "Mengevaluasi..." : "Submit Tulisan"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
