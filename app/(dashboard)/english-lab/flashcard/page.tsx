"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { BookOpen, RefreshCw, CheckCircle, XCircle, Loader2, Volume2, Trophy, ArrowRight, Brain, Zap, Mic, MicOff } from "lucide-react";
import Swal from "sweetalert2";
import { useSpeechToText } from "@/hooks/useSpeechToText";

interface VocabCard {
  id: string;
  word: string;
  definition: string;
  context_sentence: string | null;
  repetition_count: number;
  next_review_at: string;
  interval: number;
  efactor: number;
  is_collocation: boolean;
  text_id: string | null;
  position_offset: number | null;
}

type QuizMode = "guess-meaning" | "guess-word" | "dictation" | "collocation";

const BOX_INTERVALS = [1, 2, 4, 7, 14]; // days
const BOX_LABELS = ["Baru", "Familiar", "Belajar", "Review", "Mahir"];
const BOX_COLORS = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-emerald-500"];

export default function FlashcardSRSPage() {
  const [allCards, setAllCards] = useState<VocabCard[]>([]);
  const [dueCards, setDueCards] = useState<VocabCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<QuizMode>("guess-meaning");
  const [showResult, setShowResult] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [stats, setStats] = useState({ correct: 0, wrong: 0 });
  const [updating, setUpdating] = useState(false);
  const [showContext, setShowContext] = useState(false);

  const supabase = createClient();

  const { isRecording, isProcessing, transcript, startRecording, stopRecording } = useSpeechToText({
    onComplete: (speechText) => {
      setUserAnswer(speechText);
    }
  });

  const fetchCards = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: allVocab } = await supabase
      .from("vocabulary")
      .select("id, word, definition, context_sentence, repetition_count, next_review_at, interval, efactor, is_collocation, text_id, position_offset")
      .eq("user_id", user.id);

    if (allVocab) {
      const mapped = allVocab.map(v => ({
        ...v,
        repetition_count: v.repetition_count ?? 0,
        next_review_at: v.next_review_at ?? new Date().toISOString(),
        interval: v.interval ?? 0,
        efactor: v.efactor ?? 2.5,
      }));
      setAllCards(mapped);

      const now = new Date();
      const due = mapped.filter(c => new Date(c.next_review_at) <= now)
        .sort((a, b) => a.repetition_count - b.repetition_count)
        .slice(0, 15);
      setDueCards(due);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  // Generate multiple choice options when card changes
  useEffect(() => {
    if (dueCards.length === 0 || currentIndex >= dueCards.length) return;
    const current = dueCards[currentIndex];

    // Auto switch mode if it's a collocation
    if (current.is_collocation) {
      setMode("collocation");
      setShowResult(false);
      setSelectedOption(null);
      setUserAnswer("");
      return;
    } else if (mode === "collocation") {
      setMode("guess-meaning"); // Fallback if next card is not collocation
    }

    if (mode === "guess-meaning") {
      const wrongOptions = allCards
        .filter(c => c.id !== current.id && c.definition && !c.is_collocation)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(c => c.definition);
      const allOpts = [...wrongOptions, current.definition].sort(() => Math.random() - 0.5);
      setOptions(allOpts.length >= 2 ? allOpts : [current.definition]);
    } else if (mode === "guess-word") {
      const wrongOptions = allCards
        .filter(c => c.id !== current.id && !c.is_collocation)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(c => c.word);
      const allOpts = [...wrongOptions, current.word].sort(() => Math.random() - 0.5);
      setOptions(allOpts.length >= 2 ? allOpts : [current.word]);
    }
    setShowResult(false);
    setSelectedOption(null);
    setUserAnswer("");
    setShowContext(false); // Reset context mode for new card
  }, [currentIndex, mode, dueCards, allCards]);

  const playAudio = (word: string) => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAnswer = async (answer: string) => {
    if (showResult || updating) return;
    const current = dueCards[currentIndex];
    let correct = false;

    if (mode === "guess-meaning") {
      correct = answer === current.definition;
      setSelectedOption(answer);
    } else if (mode === "guess-word") {
      correct = answer === current.word;
      setSelectedOption(answer);
    } else if (mode === "collocation") {
      const targetWordMatch = current.definition.match(/Collocation for: (.*)/);
      const targetWord = targetWordMatch ? targetWordMatch[1].toLowerCase().trim() : current.word.toLowerCase().trim();
      correct = answer.toLowerCase().trim() === targetWord;
    } else {
      // Dictation: compare lowercased
      correct = answer.toLowerCase().trim() === current.word.toLowerCase().trim();
    }

    setIsCorrect(correct);
    setShowResult(true);
    setStats(prev => correct ? { ...prev, correct: prev.correct + 1 } : { ...prev, wrong: prev.wrong + 1 });

    // Update SRS via API
    setUpdating(true);
    let quality = 0;
    if (correct) {
      // Dikte mode harder => higher quality if correct
      if (mode === "dictation" || mode === "guess-meaning") quality = 4;
      else if (mode === "guess-word" || mode === "collocation") quality = 5;
      else quality = 3;
    } else {
      quality = 1;
    }

    try {
      await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vocabId: current.id,
          quality,
          lastInterval: current.interval,
          lastRepetition: current.repetition_count,
          lastEaseFactor: current.efactor
        })
      });
    } catch (e) {
      console.error(e);
    }
    setUpdating(false);
  };

  const handleNext = () => {
    setCurrentIndex(prev => prev + 1);
  };

  const isFinished = currentIndex >= dueCards.length;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  if (allCards.length === 0) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center mt-20 animate-in fade-in slide-in-from-bottom-4">
        <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
        <h1 className="text-3xl font-serif font-bold text-foreground mb-4">Kamus Anda Masih Kosong</h1>
        <p className="text-muted-foreground text-lg mb-6">Simpan beberapa kata terlebih dahulu dari <strong>Lexicon Search</strong> atau <strong>Text Library</strong> untuk memulai latihan flashcard!</p>
      </div>
    );
  }

  if (dueCards.length === 0) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center mt-20 animate-in fade-in slide-in-from-bottom-4">
        <div className="w-24 h-24 bg-brand/20 text-brand rounded-full flex items-center justify-center mx-auto mb-6">
          <Trophy className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-foreground mb-4">Semua Kata Sudah Direview!</h1>
        <p className="text-muted-foreground text-lg mb-8">Tidak ada kata yang perlu direview saat ini. Kembali lagi nanti!</p>

        {/* Box Distribution */}
        <div className="bg-card border border-border rounded-2xl p-6 text-left max-w-md mx-auto">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2"><Brain className="w-4 h-4" /> Distribusi Kata</h3>
          {BOX_LABELS.map((label, i) => {
            const count = allCards.filter(c => Math.min(c.repetition_count, 4) === i).length;
            const pct = allCards.length > 0 ? (count / allCards.length) * 100 : 0;
            return (
              <div key={i} className="flex items-center gap-3 mb-2">
                <span className="text-xs text-muted-foreground w-16 shrink-0">{label}</span>
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${BOX_COLORS[i]} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-bold text-foreground w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Finished session
  if (isFinished) {
    const total = stats.correct + stats.wrong;
    const scorePct = total > 0 ? Math.round((stats.correct / total) * 100) : 0;
    return (
      <div className="p-8 max-w-2xl mx-auto text-center mt-12 animate-in fade-in slide-in-from-bottom-4">
        <div className="w-24 h-24 bg-brand/20 text-brand rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Sesi Selesai!</h1>
        <p className="text-xl text-muted-foreground mb-8">Anda telah mereview {total} kata hari ini.</p>

        <div className="grid grid-cols-3 gap-4 mb-8 max-w-sm mx-auto">
          <div className="bg-brand/10 border border-brand/20 rounded-2xl p-4">
            <p className="text-3xl font-bold text-brand">{stats.correct}</p>
            <p className="text-xs text-muted-foreground font-bold uppercase">Benar</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
            <p className="text-3xl font-bold text-red-400">{stats.wrong}</p>
            <p className="text-xs text-muted-foreground font-bold uppercase">Salah</p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
            <p className="text-3xl font-bold text-amber-400">{scorePct}%</p>
            <p className="text-xs text-muted-foreground font-bold uppercase">Akurasi</p>
          </div>
        </div>

        <button
          onClick={() => { fetchCards(); setCurrentIndex(0); setStats({ correct: 0, wrong: 0 }); }}
          className="px-8 py-4 bg-muted hover:bg-muted/80 text-foreground font-bold rounded-xl transition-all flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-5 h-5" /> Ulangi Sesi
        </button>
      </div>
    );
  }

  const currentCard = dueCards[currentIndex];

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto min-h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground flex items-center justify-center gap-3">
          <Zap className="w-7 h-7 text-amber-400" />
          Flashcard SRS
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Spaced Repetition System — Latihan kosakata harian Anda</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-brand rounded-full transition-all duration-500" style={{ width: `${((currentIndex) / dueCards.length) * 100}%` }} />
        </div>
        <span className="text-sm font-bold text-muted-foreground font-mono">{currentIndex + 1}/{dueCards.length}</span>
      </div>

      {/* Mode Selector */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {([
          { id: "guess-meaning" as QuizMode, label: "Tebak Arti", hideIfCollocation: true },
          { id: "guess-word" as QuizMode, label: "Tebak Kata", hideIfCollocation: true },
          { id: "dictation" as QuizMode, label: "Dengar & Tulis", hideIfCollocation: true },
        ]).filter(m => !(currentCard?.is_collocation && m.hideIfCollocation)).map(m => (
          <button
            key={m.id}
            onClick={() => { setMode(m.id); setShowResult(false); setSelectedOption(null); setUserAnswer(""); }}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${mode === m.id ? "bg-brand text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            {m.label}
          </button>
        ))}
        {currentCard?.is_collocation && (
          <span className="px-4 py-2 rounded-full text-sm font-bold bg-brand text-white">Fill-in-the-blank (Collocation)</span>
        )}
      </div>

      {/* Card */}
      <div className="bg-card border border-border rounded-3xl p-8 shadow-lg relative overflow-hidden mb-6">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400/0 via-amber-400 to-amber-400/0 opacity-50" />

        {/* Box indicator */}
        <div className="flex items-center justify-between mb-6">
          <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${BOX_COLORS[currentCard.srs_box]} text-white uppercase tracking-wider`}>
            Box {currentCard.srs_box} — {BOX_LABELS[currentCard.srs_box]}
          </span>
          <div className="flex items-center gap-2">
            {currentCard.context_sentence && (
              <button onClick={() => setShowContext(!showContext)} className={`px-3 py-1 text-xs font-bold rounded-full transition-colors border ${showContext ? 'bg-brand text-white border-brand' : 'bg-transparent text-muted-foreground border-border hover:bg-muted'}`} title="Tampilkan Konteks Asli">
                Context Mode
              </button>
            )}
            <button onClick={() => playAudio(currentCard.word)} className="p-2 hover:bg-muted rounded-full transition-colors text-brand" title="Dengarkan">
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Context Mode Display */}
        {showContext && currentCard.context_sentence && (
          <div className="mb-6 p-4 bg-muted/30 rounded-xl border border-border border-l-4 border-l-brand animate-in fade-in slide-in-from-top-2">
            <p className="text-sm font-serif leading-relaxed text-foreground">
              {currentCard.context_sentence.split(new RegExp(`(${currentCard.word})`, 'gi')).map((part, i) => 
                part.toLowerCase() === currentCard.word.toLowerCase() ? <span key={i} className="bg-brand/20 text-brand font-bold px-1 rounded">{part}</span> : part
              )}
            </p>
            {currentCard.text_id && (
              <a href={`/read/${currentCard.text_id}${currentCard.position_offset !== null ? `#block-${currentCard.position_offset}` : ''}`} target="_blank" className="inline-flex items-center gap-1 mt-3 text-xs font-bold text-brand hover:underline">
                <BookOpen className="w-3 h-3" /> Re-read Chapter
              </a>
            )}
          </div>
        )}

        {/* Question */}
        {mode === "guess-meaning" && (
          <div className="text-center mb-8">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Apa arti dari kata ini?</p>
            <p className="text-5xl font-serif font-bold text-brand">{currentCard.word}</p>
          </div>
        )}

        {mode === "guess-word" && (
          <div className="text-center mb-8">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Kata apa yang cocok dengan definisi ini?</p>
            <p className="text-xl font-serif text-foreground">{currentCard.definition}</p>
          </div>
        )}

        {mode === "dictation" && (
          <div className="text-center mb-8">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-4">Dengarkan dan tuliskan kata yang Anda dengar</p>
            <button
              onClick={() => playAudio(currentCard.word)}
              className="px-8 py-4 bg-brand/10 border border-brand/30 text-brand font-bold rounded-2xl hover:bg-brand/20 transition-all flex items-center gap-3 mx-auto text-lg"
            >
              <Volume2 className="w-6 h-6" /> Putar Audio
            </button>
          </div>
        )}

        {mode === "collocation" && (
          <div className="text-center mb-8">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Lengkapi frasa kolokasi berikut:</p>
            {(() => {
              const targetWordMatch = currentCard.definition.match(/Collocation for: (.*)/);
              const targetWord = targetWordMatch ? targetWordMatch[1] : currentCard.word;
              // replace targetWord in currentCard.word with blanks, case insensitive
              const displayWord = currentCard.word.replace(new RegExp(targetWord, 'gi'), "____");
              return <p className="text-4xl font-serif font-bold text-foreground">{displayWord}</p>;
            })()}
          </div>
        )}

        {/* Answers Area */}
        {(mode === "guess-meaning" || mode === "guess-word") && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {options.map((opt, i) => {
              const isSelected = selectedOption === opt;
              const isAnswer = mode === "guess-meaning" ? opt === currentCard.definition : opt === currentCard.word;

              let borderClass = "border-border hover:border-brand/50 hover:bg-brand/5";
              if (showResult) {
                if (isAnswer) borderClass = "border-emerald-500 bg-emerald-500/10";
                else if (isSelected && !isAnswer) borderClass = "border-red-500 bg-red-500/10";
                else borderClass = "border-border opacity-50";
              }

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(opt)}
                  disabled={showResult}
                  className={`p-4 rounded-xl border text-left transition-all text-sm ${borderClass} ${showResult ? "cursor-default" : "cursor-pointer"}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        {(mode === "dictation" || mode === "collocation") && !showResult && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && userAnswer.trim()) handleAnswer(userAnswer); }}
              placeholder={mode === "dictation" ? "Ketik kata yang Anda dengar..." : "Isi kata yang rumpang..."}
              className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:ring-1 focus:ring-brand outline-none"
            />
            {mode === "dictation" && (
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`p-3 rounded-xl transition-all ${isRecording ? "bg-red-500 text-white animate-pulse" : "bg-muted text-muted-foreground hover:bg-brand/10 hover:text-brand"}`}
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}
            <button
              onClick={() => { if (userAnswer.trim()) handleAnswer(userAnswer); }}
              disabled={!userAnswer.trim()}
              className="px-5 py-3 bg-brand text-background font-bold rounded-xl disabled:opacity-50 transition-all"
            >
              Cek
            </button>
          </div>
        )}

        {(mode === "dictation" || mode === "collocation") && showResult && (
          <div className={`p-4 rounded-xl border text-center ${isCorrect ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30"}`}>
            <p className="text-sm text-muted-foreground mb-1">Jawaban Anda: <span className="font-bold text-foreground">{userAnswer}</span></p>
            <p className="text-sm text-muted-foreground">
              Jawaban benar: <span className="font-bold text-brand">
                {mode === "collocation" 
                  ? (() => {
                      const targetWordMatch = currentCard.definition.match(/Collocation for: (.*)/);
                      return targetWordMatch ? targetWordMatch[1] : currentCard.word;
                    })()
                  : currentCard.word}
              </span>
            </p>
          </div>
        )}

        {/* Feedback */}
        {showResult && (
          <div className={`mt-4 text-center animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            {isCorrect ? (
              <p className="text-emerald-400 font-bold flex items-center justify-center gap-2"><CheckCircle className="w-5 h-5" /> Benar!</p>
            ) : (
              <p className="text-red-400 font-bold flex items-center justify-center gap-2"><XCircle className="w-5 h-5" /> Salah — kata ini akan diulang lebih sering.</p>
            )}
            <button
              onClick={handleNext}
              className="mt-4 px-8 py-3 bg-brand text-background font-bold rounded-xl flex items-center gap-2 mx-auto hover:shadow-[0_0_20px_rgba(62,207,142,0.3)] transition-all"
            >
              Selanjutnya <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Box Distribution */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2"><Brain className="w-3 h-3" /> Distribusi Kata Anda</h3>
        <div className="flex items-center gap-1">
          {BOX_LABELS.map((label, i) => {
            const count = allCards.filter(c => c.srs_box === i).length;
            const pct = allCards.length > 0 ? Math.max((count / allCards.length) * 100, 2) : 0;
            return (
              <div key={i} className="flex-1 text-center group relative" title={`${label}: ${count} kata`}>
                <div className={`h-6 ${BOX_COLORS[i]} rounded-lg transition-all opacity-70 group-hover:opacity-100`} style={{ height: `${Math.max(pct * 0.5, 6)}px` }} />
                <p className="text-[10px] text-muted-foreground mt-1 font-bold">{count}</p>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-1 mt-1">
          {BOX_LABELS.map((label, i) => (
            <p key={i} className="flex-1 text-center text-[9px] text-muted-foreground">{label}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
