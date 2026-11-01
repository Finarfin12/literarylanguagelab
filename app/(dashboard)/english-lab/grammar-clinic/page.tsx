"use client";

import Markdown from "@/components/ui/Markdown";
import { useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle, Loader2, Mic, MicOff, Sparkles, ArrowRight, Lightbulb, Copy, Check, BarChart3, Brain, Play } from "lucide-react";
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
  "Tense": "bg-muted text-foreground border-border",
  "Subject-Verb Agreement": "bg-muted text-foreground border-border",
  "Article": "bg-muted text-foreground border-border",
  "Preposition": "bg-muted text-foreground border-border",
  "Spelling": "bg-muted text-foreground border-border",
  "Punctuation": "bg-muted text-foreground border-border",
  "Word Choice": "bg-muted text-foreground border-border",
  "Plural/Singular": "bg-muted text-foreground border-border",
  "Run-on Sentence": "bg-muted text-foreground border-border",
  "Fragment": "bg-muted text-foreground border-border",
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
        <span className="text-2xl md:text-4xl font-bold text-foreground">{score}</span>
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

  // Stats State
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Mini Lesson State
  const [miniLessonLoading, setMiniLessonLoading] = useState(false);
  const [miniLessonData, setMiniLessonData] = useState<any>(null);
  const [showMiniLesson, setShowMiniLesson] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizChecked, setQuizChecked] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const res = await fetch("/api/grammar-clinic/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setStatsLoading(false);
    }
  };

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
      // Refresh stats after analysis
      fetchStats();
    } catch (err: any) {
      Swal.fire({ title: "Gagal", text: err.message, icon: "error", confirmButtonColor: "#2fa16b" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMiniLesson = async (weakness: any) => {
    setMiniLessonLoading(true);
    setShowMiniLesson(true);
    setMiniLessonData(null);
    setQuizAnswers({});
    setQuizChecked(false);

    try {
      const res = await fetch("/api/grammar-clinic/mini-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: weakness.category,
          percentage: weakness.percentage,
          examples: weakness.examples
        })
      });
      if (!res.ok) throw new Error("Gagal mengambil materi");
      const data = await res.json();
      setMiniLessonData(data);
    } catch (e: any) {
      setShowMiniLesson(false);
      Swal.fire("Gagal", e.message, "error");
    } finally {
      setMiniLessonLoading(false);
    }
  };

  const checkQuiz = () => {
    setQuizChecked(true);
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
                  ? "bg-danger text-on-brand animate-pulse"
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
            className="w-full mt-4 py-3.5 bg-brand text-background font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
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
          <div className="absolute top-0 left-0 right-0 h-1 bg-muted opacity-50" />

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
                    <AlertTriangle className="w-4 h-4 text-warning-ink" />
                    {result.corrections.length} Koreksi Ditemukan
                  </h3>
                  <div className="space-y-2">
                    {result.corrections.map((c, i) => (
                      <div key={i} className="border border-border rounded-xl overflow-hidden">
                        <button
                          onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                          className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
                        >
                          <XCircle className="w-4 h-4 text-danger shrink-0" />
                          <span className="text-sm text-danger line-through flex-1">{c.original}</span>
                          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span className="text-sm text-brand-ink font-medium flex-1">{c.corrected}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${CATEGORY_COLORS[c.category] || "bg-muted text-muted-foreground border-border"}`}>
                            {c.category}
                          </span>
                        </button>
                        {expandedIdx === i && (
                          <div className="px-4 pb-3 pt-1 bg-muted/30 border-t border-border animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="text-sm text-foreground/90 leading-relaxed"><Markdown>{c.explanation_id}</Markdown></div>
                            <div className="text-xs text-muted-foreground italic mt-1"><Markdown>{c.explanation_en}</Markdown></div>
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
                <div className="bg-warning-tint border border-warning-ink/30 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-warning-ink uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" /> Tips Peningkatan
                  </h3>
                  <ul className="space-y-1">
                    {result.tips.map((tip, i) => (
                      <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                        <span className="text-warning-ink mt-1">•</span> <span><Markdown inline>{tip}</Markdown></span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Grammar Pattern Dashboard */}
      <div className="mt-8 border-t border-border pt-8">
        <h2 className="text-2xl font-serif font-bold text-foreground mb-6 flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-brand" /> Grammar Error Pattern
        </h2>
        
        {statsLoading ? (
          <div className="flex items-center justify-center p-4 sm:p-8"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div>
        ) : stats && stats.totalErrors > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm col-span-1 md:col-span-1 flex flex-col justify-center text-center">
              <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold mb-2">Total Sesi</p>
              <p className="text-3xl md:text-5xl font-serif font-bold text-foreground">{stats.totalSessions}</p>
              <p className="text-sm text-muted-foreground mt-4">Total Kesalahan: <strong>{stats.totalErrors}</strong></p>
              <p className="text-sm text-muted-foreground mt-1">Skor Rata-rata: <strong>{stats.averageScore}</strong></p>
            </div>

            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm col-span-1 md:col-span-2">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning-ink" /> Top 3 Kelemahan Anda
              </h3>
              <div className="space-y-4">
                {stats.topWeaknesses.map((weakness: any, i: number) => (
                  <div key={i} className="bg-muted/50 border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[weakness.category] || "bg-muted text-muted-foreground border-border"}`}>
                          {weakness.category}
                        </span>
                        <span className="text-sm font-bold text-foreground">{weakness.percentage}%</span>
                      </div>
                      <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                        <div className="h-full bg-brand rounded-full" style={{ width: `${weakness.percentage}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 italic">Contoh salah: "{weakness.examples[0]?.original}"</p>
                    </div>
                    <button 
                      onClick={() => handleOpenMiniLesson(weakness)}
                      className="shrink-0 px-4 py-2 bg-brand/10 text-brand font-bold rounded-lg hover:bg-brand/20 transition-colors flex items-center justify-center gap-2"
                    >
                      <Brain className="w-4 h-4" /> Pelajari
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-3xl p-4 sm:p-8 text-center">
            <p className="text-muted-foreground">Belum ada cukup data. Terus gunakan Grammar Clinic untuk memetakan pola kesalahan Anda!</p>
          </div>
        )}
      </div>

      {/* Mini Lesson Modal */}
      {showMiniLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <div className="sticky top-0 bg-card/90 backdrop-blur-md p-4 border-b border-border flex justify-between items-center z-10">
              <h2 className="text-lg font-serif font-bold text-foreground flex items-center gap-2">
                <Brain className="w-5 h-5 text-brand" /> {miniLessonData?.title || "Mini-Lesson"}
              </h2>
              <button onClick={() => setShowMiniLesson(false)} className="p-2 hover:bg-muted rounded-full transition-colors"><XCircle className="w-5 h-5 text-muted-foreground" /></button>
            </div>

            <div className="p-6">
              {miniLessonLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-brand">
                  <Loader2 className="w-10 h-10 animate-spin mb-4" />
                  <p className="animate-pulse">AI sedang menyusun materi pelajaran khusus untuk Anda...</p>
                </div>
              ) : miniLessonData ? (
                <div className="space-y-6">
                  <div className="prose prose-sm dark:prose-invert prose-brand max-w-none">
                    <div className="text-foreground/90 leading-relaxed text-base"><Markdown>{miniLessonData.lesson_text}</Markdown></div>
                  </div>
                  
                  <div className="bg-brand/5 border border-brand/20 rounded-2xl p-6">
                    <h3 className="font-bold text-foreground mb-4 uppercase tracking-wider text-sm flex items-center gap-2"><Play className="w-4 h-4 text-brand" /> Latihan Isian Rumpang</h3>
                    <div className="space-y-6">
                      {miniLessonData.quiz.map((q: any, idx: number) => {
                        const parts = q.sentence.split("____");
                        const answered = quizAnswers[idx];
                        const isCorrect = answered === q.answer;
                        
                        return (
                          <div key={idx} className="space-y-2">
                            <p className="text-foreground font-serif text-lg">
                              {parts[0]}
                              <span className={`inline-block border-b-2 font-sans text-sm mx-2 min-w-[80px] text-center font-bold ${quizChecked ? (isCorrect ? 'border-brand/30 text-brand-ink' : 'border-danger/30 text-danger') : 'border-brand text-brand'}`}>
                                {answered || "____"}
                              </span>
                              {parts[1] || ""}
                            </p>
                            
                            <div className="flex gap-2 flex-wrap">
                              {q.options.map((opt: string, oIdx: number) => (
                                <button
                                  key={oIdx}
                                  onClick={() => !quizChecked && setQuizAnswers(prev => ({ ...prev, [idx]: opt }))}
                                  disabled={quizChecked}
                                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors border ${
                                    answered === opt 
                                      ? "bg-brand text-background border-brand" 
                                      : "bg-background text-foreground border-border hover:border-brand/50"
                                  } ${quizChecked && opt === q.answer && answered !== opt ? "ring-2 ring-brand/30 ring-offset-1 ring-offset-background" : ""}`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                            {quizChecked && !isCorrect && (
                              <p className="text-xs text-danger mt-1">Jawaban benar: <strong>{q.answer}</strong></p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-6 text-center">
                      {!quizChecked ? (
                        <button onClick={checkQuiz} disabled={Object.keys(quizAnswers).length < miniLessonData.quiz.length} className="px-6 py-2.5 bg-brand text-background font-bold rounded-xl disabled:opacity-50 transition-all">
                          Cek Jawaban
                        </button>
                      ) : (
                        <div className="flex items-center justify-center gap-2 text-brand-ink font-bold">
                          <CheckCircle className="w-5 h-5" /> Selesai! Tetap semangat berlatih.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
