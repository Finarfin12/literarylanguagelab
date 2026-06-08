"use client";

import { useState } from "react";
import { CheckSquare, Loader2, ArrowLeft, Trophy, AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

interface Question {
  word: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

interface QuizData {
  story: string;
  words: string[];
  questions: Question[];
}

export default function StoryQuizPage() {
  const [genre, setGenre] = useState("Mystery");
  const [loading, setLoading] = useState(false);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const GENRES = ["Mystery", "Sci-Fi", "Romance", "Gothic Horror", "High Fantasy", "Historical Drama"];

  const generateQuiz = async () => {
    setLoading(true);
    setQuizData(null);
    setAnswers({});
    setSubmitted(false);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/tools/story-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genre }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQuizData(data);
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (qIndex: number, optIndex: number) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qIndex]: optIndex }));
  };

  const handleSubmit = () => {
    if (!quizData) return;
    let newScore = 0;
    quizData.questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswerIndex) newScore++;
    });
    setScore(newScore);
    setSubmitted(true);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/tools" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors w-max">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Toolkits
      </Link>

      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-4xl font-serif font-bold text-foreground flex items-center gap-3">
            <CheckSquare className="w-8 h-8 text-brand" />
            Story Mode Quiz
          </h1>
          <p className="text-muted-foreground mt-2">Bermain dengan kosa kata Anda melalui cerita pendek AI.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            disabled={loading}
            className="bg-background border border-white/20 rounded-xl p-3 text-foreground font-serif focus:ring-2 focus:ring-brand outline-none cursor-pointer"
          >
            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <button 
            onClick={generateQuiz}
            disabled={loading}
            className="bg-brand text-background px-4 py-3 rounded-xl font-bold hover:shadow-[0_0_15px_rgba(62,207,142,0.4)] transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
            Mulai Main
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl flex items-center gap-4 mb-8">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}

      {loading && !quizData && (
        <div className="flex flex-col items-center justify-center py-20 text-brand gap-4">
          <Loader2 className="w-12 h-12 animate-spin" />
          <p className="font-medium animate-pulse">Menulis cerita untuk Anda...</p>
        </div>
      )}

      {quizData && (
        <div className="space-y-8 animate-in fade-in duration-700">
          <div className="bg-card/40 backdrop-blur-md border border-brand/20 rounded-3xl p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand/0 via-brand to-brand/0 opacity-50" />
            <h2 className="text-xl font-serif font-bold text-brand mb-6 border-b border-white/10 pb-4">The Story ({genre})</h2>
            <div className="prose dark:prose-invert prose-brand max-w-none prose-p:leading-relaxed prose-lg font-serif italic text-foreground/90">
              <ReactMarkdown>{quizData.story}</ReactMarkdown>
            </div>
            
            <div className="mt-8 pt-4 border-t border-white/10 flex flex-wrap gap-2">
              <span className="text-sm font-bold text-muted-foreground mr-2 my-auto">Vocab in story:</span>
              {quizData.words.map(w => (
                <span key={w} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-mono text-brand">{w}</span>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {quizData.questions.map((q, qIndex) => (
              <div key={qIndex} className="bg-background/50 border border-white/5 rounded-2xl p-6">
                <p className="font-bold text-foreground mb-4">{qIndex + 1}. {q.question}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {q.options.map((opt, optIndex) => {
                    const isSelected = answers[qIndex] === optIndex;
                    let btnClass = "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10";
                    
                    if (isSelected) {
                      btnClass = "bg-brand/20 border-brand/50 text-brand";
                    }
                    
                    if (submitted) {
                      const isCorrect = q.correctAnswerIndex === optIndex;
                      if (isCorrect) {
                        btnClass = "bg-green-500/20 border-green-500 text-green-400 font-bold";
                      } else if (isSelected && !isCorrect) {
                        btnClass = "bg-red-500/20 border-red-500 text-red-400 line-through opacity-70";
                      } else {
                        btnClass = "bg-white/5 border-white/10 text-muted-foreground opacity-50";
                      }
                    }

                    return (
                      <button
                        key={optIndex}
                        onClick={() => handleSelect(qIndex, optIndex)}
                        disabled={submitted}
                        className={`text-left p-4 rounded-xl border transition-all ${btnClass}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                
                {submitted && (
                  <div className={`mt-4 p-4 rounded-xl ${answers[qIndex] === q.correctAnswerIndex ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                    <p className="text-sm font-bold mb-1">{answers[qIndex] === q.correctAnswerIndex ? "Jawaban Benar!" : "Jawaban Salah."}</p>
                    <p className="text-sm opacity-90">{q.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={Object.keys(answers).length < 5}
              className="w-full py-5 bg-brand hover:bg-brand-hover text-background font-bold text-xl rounded-2xl hover:shadow-[0_0_30px_rgba(62,207,142,0.4)] transition-all disabled:opacity-50"
            >
              Kirim Jawaban
            </button>
          ) : (
            <div className="bg-brand/10 border border-brand/30 rounded-3xl p-8 flex flex-col items-center justify-center text-center">
              <Trophy className="w-16 h-16 text-brand mb-4" />
              <h3 className="text-3xl font-serif font-bold text-foreground mb-2">Skor Anda: {score}/5</h3>
              <p className="text-muted-foreground mb-6">Pengetahuan konteks sastra Anda luar biasa!</p>
              <button
                onClick={generateQuiz}
                className="px-6 py-3 bg-brand text-background font-bold rounded-xl hover:shadow-[0_0_15px_rgba(62,207,142,0.4)] transition-all flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Main Lagi
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
