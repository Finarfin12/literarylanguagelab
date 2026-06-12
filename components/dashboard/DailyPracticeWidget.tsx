"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Lightbulb, BookOpen, Clock, Loader2, PartyPopper } from "lucide-react";
import Link from "next/link";
import Swal from "sweetalert2";

export default function DailyPracticeWidget() {
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<any>(null);
  
  // Modal states
  const [wotdData, setWotdData] = useState<any>(null);
  const [wotdLoading, setWotdLoading] = useState(false);
  const [showWotd, setShowWotd] = useState(false);
  const [wotdAnswered, setWotdAnswered] = useState<number | null>(null);

  const [grammarData, setGrammarData] = useState<any>(null);
  const [grammarLoading, setGrammarLoading] = useState(false);
  const [showGrammar, setShowGrammar] = useState(false);
  const [grammarAnswered, setGrammarAnswered] = useState<number | null>(null);

  useEffect(() => {
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/daily-practice");
      const data = await res.json();
      if (data.success) {
        setActivity(data.activity);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const markCompleted = async (type: "wotd" | "grammar" | "review") => {
    try {
      const res = await fetch("/api/daily-practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type })
      });
      const data = await res.json();
      if (data.success) {
        setActivity(data.activity);
        if (data.allCompleted) {
          Swal.fire({
            title: "Daily Streak Complete!",
            text: "Anda mendapatkan +25 XP hari ini!",
            icon: "success",
            confirmButtonText: "Awesome",
            confirmButtonColor: "#3ECF8E"
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartWotd = async () => {
    if (activity?.wotd_completed) return;
    setWotdLoading(true);
    setShowWotd(true);
    try {
      const res = await fetch("/api/wotd");
      const data = await res.json();
      setWotdData(data);
    } catch (e) {
      console.error(e);
      setShowWotd(false);
    } finally {
      setWotdLoading(false);
    }
  };

  const handleStartGrammar = async () => {
    if (activity?.grammar_completed) return;
    setGrammarLoading(true);
    setShowGrammar(true);
    try {
      // First, get top weakness
      const statsRes = await fetch("/api/grammar-clinic/stats");
      const statsData = await statsRes.json();
      
      let category = "General Grammar";
      let percentage = 100;
      let examples = [];

      if (statsData.success && statsData.stats.topWeaknesses?.length > 0) {
        const top = statsData.stats.topWeaknesses[0];
        category = top.category;
        percentage = Math.round((top.count / statsData.stats.totalErrors) * 100);
        
        // Find examples from history
        if (statsData.stats.recentHistory?.length > 0) {
          for (const session of statsData.stats.recentHistory) {
            const errs = session.corrections?.filter((c:any) => c.category === category);
            if (errs && errs.length > 0) {
              examples.push({ original: errs[0].original, corrected: errs[0].corrected });
              if (examples.length >= 3) break;
            }
          }
        }
      }

      if (examples.length === 0) {
         examples = [{ original: "He go to school", corrected: "He goes to school" }];
      }

      const lessonRes = await fetch("/api/grammar-clinic/mini-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, percentage, examples })
      });
      const data = await lessonRes.json();
      setGrammarData(data);
    } catch (e) {
      console.error(e);
      setShowGrammar(false);
    } finally {
      setGrammarLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  const allDone = activity?.wotd_completed && activity?.grammar_completed && activity?.review_completed;

  return (
    <>
      <div className="bg-gradient-to-br from-brand/10 to-transparent border border-brand/20 rounded-3xl p-6 shadow-sm relative overflow-hidden hover:-translate-y-1 hover:shadow-brand/20 transition-all duration-300">
        {allDone && (
          <div className="absolute -top-10 -right-10 opacity-20 rotate-12">
            <PartyPopper className="w-48 h-48 text-brand" />
          </div>
        )}
        
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div>
            <h2 className="text-2xl font-serif font-bold text-foreground">Today's Practice</h2>
            <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
              <Clock className="w-4 h-4" /> ~8 menit • Latih habit setiap hari
            </p>
          </div>
          <div className="bg-background rounded-full px-4 py-2 border border-border font-bold text-brand shadow-sm flex items-center gap-2">
            {allDone ? <><CheckCircle2 className="w-5 h-5" /> Selesai!</> : "3 Misi Tersisa"}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
          {/* Activity 1: WOTD */}
          <button 
            onClick={handleStartWotd}
            disabled={activity?.wotd_completed}
            className={`p-5 rounded-2xl border text-left transition-all duration-300 ${activity?.wotd_completed ? 'bg-muted/50 border-transparent opacity-70' : 'bg-background border-border hover:border-brand/50 hover:shadow-md hover:-translate-y-1 cursor-pointer active:scale-[0.98]'}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${activity?.wotd_completed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                <Lightbulb className="w-5 h-5" />
              </div>
              {activity?.wotd_completed ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
            </div>
            <h3 className="font-bold text-foreground">Word of the Day</h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">Pelajari satu kata baru secara mendalam (2 menit).</p>
          </button>

          {/* Activity 2: Grammar Byte */}
          <button 
            onClick={handleStartGrammar}
            disabled={activity?.grammar_completed}
            className={`p-5 rounded-2xl border text-left transition-all duration-300 ${activity?.grammar_completed ? 'bg-muted/50 border-transparent opacity-70' : 'bg-background border-border hover:border-brand/50 hover:shadow-md hover:-translate-y-1 cursor-pointer active:scale-[0.98]'}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${activity?.grammar_completed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'}`}>
                <BookOpen className="w-5 h-5" />
              </div>
              {activity?.grammar_completed ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
            </div>
            <h3 className="font-bold text-foreground">Grammar Byte</h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">Evaluasi 1 menit berdasarkan kelemahan grammar Anda.</p>
          </button>

          {/* Activity 3: Review Nudge */}
          <Link 
            href="/english-lab/flashcard"
            className={`p-5 rounded-2xl border text-left transition-all duration-300 block ${activity?.review_completed ? 'bg-muted/50 border-transparent opacity-70' : 'bg-background border-border hover:border-brand/50 hover:shadow-md hover:-translate-y-1 active:scale-[0.98]'}`}
            onClick={() => {
              if (!activity?.review_completed) {
                // We mark it completed optimistically when they click it
                markCompleted("review");
              }
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${activity?.review_completed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-purple-500/10 text-purple-500'}`}>
                <Clock className="w-5 h-5" />
              </div>
              {activity?.review_completed ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
            </div>
            <h3 className="font-bold text-foreground">Review Nudge</h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">Lakukan sesi review Spaced Repetition (5 menit).</p>
          </Link>
        </div>
      </div>

      {/* WOTD Modal */}
      {showWotd && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border shadow-2xl rounded-3xl w-full max-w-md overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="p-6 overflow-y-auto flex-1">
              {wotdLoading ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
                  <p className="text-muted-foreground animate-pulse">Menyiapkan Word of the Day...</p>
                </div>
              ) : wotdData ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-sm font-bold text-blue-500 uppercase tracking-widest mb-2">Word of the Day</p>
                    <h2 className="text-4xl font-serif font-bold text-foreground capitalize">{wotdData.word}</h2>
                  </div>
                  
                  <div className="bg-muted/30 p-4 rounded-xl border border-border">
                    <p className="text-sm text-foreground leading-relaxed">{wotdData.lesson}</p>
                  </div>

                  {wotdData.collocations?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Sering Dipasangkan:</p>
                      <div className="flex flex-wrap gap-2">
                        {wotdData.collocations.map((col: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-background border border-border rounded-full text-xs">{col}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-border pt-6">
                    <p className="font-bold text-sm mb-3">Quiz: {wotdData.quiz?.question}</p>
                    <div className="space-y-2">
                      {wotdData.quiz?.options?.map((opt: string, i: number) => {
                        const isCorrect = i === wotdData.quiz.answer;
                        const isSelected = wotdAnswered === i;
                        const showResult = wotdAnswered !== null;
                        
                        let btnClass = "border-border hover:bg-muted";
                        if (showResult) {
                          if (isCorrect) btnClass = "border-emerald-500 bg-emerald-500/10 text-emerald-600";
                          else if (isSelected) btnClass = "border-red-500 bg-red-500/10 text-red-600";
                          else btnClass = "border-border opacity-50";
                        }
                        
                        return (
                          <button
                            key={i}
                            disabled={showResult}
                            onClick={() => {
                              setWotdAnswered(i);
                              if (i === wotdData.quiz.answer) {
                                setTimeout(() => {
                                  markCompleted("wotd");
                                  setShowWotd(false);
                                  setWotdAnswered(null);
                                }, 1500);
                              } else {
                                setTimeout(() => setWotdAnswered(null), 2000); // Reset after wrong
                              }
                            }}
                            className={`w-full p-3 rounded-xl border text-left text-sm transition-all flex items-center justify-between ${btnClass}`}
                          >
                            <span>{opt}</span>
                            {showResult && isCorrect && <CheckCircle2 className="w-4 h-4" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <p>Failed to load.</p>
              )}
            </div>
            <div className="p-4 border-t border-border flex justify-end bg-muted/30">
              <button onClick={() => setShowWotd(false)} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground">Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Grammar Byte Modal */}
      {showGrammar && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border shadow-2xl rounded-3xl w-full max-w-md overflow-hidden animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="p-6 overflow-y-auto flex-1">
              {grammarLoading ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-4" />
                  <p className="text-muted-foreground animate-pulse">Menyiapkan Grammar Byte...</p>
                </div>
              ) : grammarData ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-2">Grammar Byte</p>
                    <h2 className="text-2xl font-serif font-bold text-foreground">{grammarData.title}</h2>
                  </div>
                  
                  <div className="bg-muted/30 p-4 rounded-xl border border-border">
                    <p className="text-sm text-foreground leading-relaxed">{grammarData.lesson_text}</p>
                  </div>

                  <div className="border-t border-border pt-6">
                    <p className="font-bold text-sm mb-3">Quiz: {grammarData.quiz?.[0]?.sentence}</p>
                    <div className="space-y-2">
                      {grammarData.quiz?.[0]?.options?.map((opt: string, i: number) => {
                        const isCorrect = opt === grammarData.quiz[0].answer;
                        const isSelected = grammarAnswered === i;
                        const showResult = grammarAnswered !== null;
                        
                        let btnClass = "border-border hover:bg-muted";
                        if (showResult) {
                          if (isCorrect) btnClass = "border-emerald-500 bg-emerald-500/10 text-emerald-600";
                          else if (isSelected) btnClass = "border-red-500 bg-red-500/10 text-red-600";
                          else btnClass = "border-border opacity-50";
                        }
                        
                        return (
                          <button
                            key={i}
                            disabled={showResult}
                            onClick={() => {
                              setGrammarAnswered(i);
                              if (isCorrect) {
                                setTimeout(() => {
                                  markCompleted("grammar");
                                  setShowGrammar(false);
                                  setGrammarAnswered(null);
                                }, 1500);
                              } else {
                                setTimeout(() => setGrammarAnswered(null), 2000);
                              }
                            }}
                            className={`w-full p-3 rounded-xl border text-left text-sm transition-all flex items-center justify-between ${btnClass}`}
                          >
                            <span>{opt}</span>
                            {showResult && isCorrect && <CheckCircle2 className="w-4 h-4" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <p>Failed to load.</p>
              )}
            </div>
            <div className="p-4 border-t border-border flex justify-end bg-muted/30">
              <button onClick={() => setShowGrammar(false)} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
