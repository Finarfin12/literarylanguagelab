"use client";

import { useState, useEffect, useCallback } from "react";
import { BookOpen, PenLine, BookMarked, Headphones, ChevronRight, Trophy, Loader2, RotateCcw, Volume2, CheckCircle2, XCircle, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

type Section = 'reading' | 'grammar' | 'vocabulary' | 'listening';

interface Question {
  passage?: string;
  audio_text?: string;
  question: string;
  options: string[];
}

interface SectionScore {
  correct: number;
  total: number;
  lastLevel: string;
}

const SECTIONS: { id: Section; label: string; icon: typeof BookOpen; color: string; questions: number }[] = [
  { id: 'reading', label: 'Reading', icon: BookOpen, color: 'text-blue-400', questions: 3 },
  { id: 'grammar', label: 'Grammar', icon: PenLine, color: 'text-emerald-400', questions: 3 },
  { id: 'vocabulary', label: 'Vocabulary', icon: BookMarked, color: 'text-purple-400', questions: 2 },
  { id: 'listening', label: 'Listening', icon: Headphones, color: 'text-amber-400', questions: 2 },
];

const CEFR_DESCRIPTIONS: Record<string, { title: string; desc: string }> = {
  A1: { title: "Beginner", desc: "Anda baru memulai perjalanan bahasa Inggris. Fokus pada kosakata dasar dan kalimat sederhana!" },
  A2: { title: "Elementary", desc: "Anda sudah memahami frasa dan ekspresi yang sering digunakan. Terus tingkatkan!" },
  B1: { title: "Intermediate", desc: "Anda bisa berkomunikasi dalam situasi sehari-hari. Saatnya menjelajahi sastra!" },
  B2: { title: "Upper Intermediate", desc: "Anda memahami teks kompleks. Mulai dalami keindahan bahasa sastra klasik." },
  C1: { title: "Advanced", desc: "Kemampuan bahasa Inggris Anda sudah sangat baik. Siap untuk analisis sastra mendalam!" },
  C2: { title: "Mastery", desc: "Anda menguasai bahasa Inggris di level tertinggi. Anda adalah penjaga kata-kata sejati!" },
};

const LEVEL_COLORS: Record<string, string> = {
  A1: "from-sky-500 to-blue-600",
  A2: "from-emerald-500 to-teal-600",
  B1: "from-amber-500 to-orange-600",
  B2: "from-purple-500 to-violet-600",
  C1: "from-rose-500 to-pink-600",
  C2: "from-yellow-400 to-amber-500",
};

export default function PlacementTestPage() {
  const [phase, setPhase] = useState<'intro' | 'testing' | 'result'>('intro');
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [currentEstimate, setCurrentEstimate] = useState('B1');
  const [question, setQuestion] = useState<Question | null>(null);
  const [serverData, setServerData] = useState<{ correct: string; explanation_id: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [scores, setScores] = useState<Record<Section, SectionScore>>({
    reading: { correct: 0, total: 0, lastLevel: 'B1' },
    grammar: { correct: 0, total: 0, lastLevel: 'B1' },
    vocabulary: { correct: 0, total: 0, lastLevel: 'B1' },
    listening: { correct: 0, total: 0, lastLevel: 'B1' },
  });
  const [finalResult, setFinalResult] = useState<{
    finalLevel: string;
    scores: { reading: number; grammar: number; vocabulary: number; listening: number; total: number };
  } | null>(null);
  const [manualLevel, setManualLevel] = useState('B1');
  const [speaking, setSpeaking] = useState(false);

  const currentSection = SECTIONS[currentSectionIdx];
  const totalQuestions = SECTIONS.reduce((sum, s) => sum + s.questions, 0);
  const answeredQuestions = SECTIONS.slice(0, currentSectionIdx).reduce((sum, s) => sum + s.questions, 0) + currentQuestionIdx;

  const fetchQuestion = async () => {
    setLoading(true);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setServerData(null);
    try {
      const res = await fetch('/api/placement-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', section: SECTIONS[currentSectionIdx].id, currentEstimate }),
      });
      const data = await res.json();
      if (data.question) {
        setQuestion(data.question);
        setServerData(data._server);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (phase === 'testing' && SECTIONS[currentSectionIdx]) {
      fetchQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentSectionIdx, currentQuestionIdx]);

  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.9;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(u);
  };

  const handleAnswer = (optionLetter: string) => {
    if (showFeedback || !serverData) return;
    setSelectedAnswer(optionLetter);
    setShowFeedback(true);

    const isCorrect = optionLetter === serverData.correct;
    const section = currentSection.id;

    setScores(prev => ({
      ...prev,
      [section]: {
        correct: prev[section].correct + (isCorrect ? 1 : 0),
        total: prev[section].total + 1,
        lastLevel: currentEstimate,
      }
    }));

    // Adaptive: adjust estimate
    const idx = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].indexOf(currentEstimate);
    if (isCorrect && idx < 5) setCurrentEstimate(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'][idx + 1]);
    else if (!isCorrect && idx > 0) setCurrentEstimate(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'][idx - 1]);
  };

  const handleNext = async () => {
    const section = SECTIONS[currentSectionIdx];
    if (currentQuestionIdx + 1 < section.questions) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else if (currentSectionIdx + 1 < SECTIONS.length) {
      setCurrentSectionIdx(prev => prev + 1);
      setCurrentQuestionIdx(0);
    } else {
      // All done — finalize
      setLoading(true);
      try {
        const res = await fetch('/api/placement-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'finalize', scores }),
        });
        const data = await res.json();
        setFinalResult(data);
        setPhase('result');
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSetManual = async () => {
    setLoading(true);
    try {
      await fetch('/api/placement-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_level', level: manualLevel }),
      });
      setFinalResult({
        finalLevel: manualLevel,
        scores: { reading: 0, grammar: 0, vocabulary: 0, listening: 0, total: 0 },
      });
      setPhase('result');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ========== INTRO SCREEN ==========
  if (phase === 'intro') {
    return (
      <div className="min-h-full p-4 md:p-8 flex items-center justify-center">
        <div className="max-w-lg w-full">
          <div className="bg-card border border-border rounded-3xl p-6 md:p-10 shadow-xl text-center">
            <div className="inline-flex p-5 bg-gradient-to-br from-brand/20 to-emerald-500/10 rounded-full mb-6">
              <Sparkles className="w-10 h-10 text-brand" />
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-3">Placement Test</h1>
            <p className="text-muted-foreground mb-8 text-sm md:text-base leading-relaxed">
              Temukan level bahasa Inggris Anda dalam <strong>5-8 menit</strong>. Tes ini bersifat adaptif — soal akan menyesuaikan dengan kemampuan Anda secara otomatis.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-8">
              {SECTIONS.map(s => (
                <div key={s.id} className="bg-muted rounded-2xl p-3 flex items-center gap-3">
                  <s.icon className={`w-5 h-5 ${s.color} shrink-0`} />
                  <div className="text-left">
                    <p className="text-xs font-bold text-foreground">{s.label}</p>
                    <p className="text-[10px] text-muted-foreground">{s.questions} soal</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setPhase('testing')}
              className="w-full py-3.5 bg-brand text-white font-bold rounded-2xl hover:shadow-[0_0_20px_rgba(62,207,142,0.4)] transition-all mb-3 flex items-center justify-center gap-2"
            >
              Mulai Test <ArrowRight className="w-4 h-4" />
            </button>

            <div className="border-t border-border pt-4 mt-4">
              <p className="text-xs text-muted-foreground mb-3">Atau pilih level manual:</p>
              <div className="flex gap-2 items-center justify-center">
                <select
                  value={manualLevel}
                  onChange={e => setManualLevel(e.target.value)}
                  className="bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand"
                >
                  {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(l => (
                    <option key={l} value={l}>{l} — {CEFR_DESCRIPTIONS[l].title}</option>
                  ))}
                </select>
                <button
                  onClick={handleSetManual}
                  disabled={loading}
                  className="px-4 py-2 bg-muted border border-border rounded-xl text-sm font-bold text-foreground hover:bg-muted/80 transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Pilih'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========== TESTING SCREEN ==========
  if (phase === 'testing') {
    const optionLetter = (idx: number) => ['A', 'B', 'C', 'D'][idx];

    return (
      <div className="min-h-full p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {currentSection && <currentSection.icon className={`w-5 h-5 ${currentSection.color}`} />}
                <span className="text-sm font-bold text-foreground">{currentSection?.label}</span>
                <span className="text-xs text-muted-foreground">({currentQuestionIdx + 1}/{currentSection?.questions})</span>
              </div>
              <span className="text-xs text-muted-foreground">Soal {answeredQuestions + 1} dari {totalQuestions}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${((answeredQuestions + 1) / totalQuestions) * 100}%` }}
              />
            </div>
            {/* Section tabs */}
            <div className="flex gap-1 mt-3">
              {SECTIONS.map((s, i) => (
                <div
                  key={s.id}
                  className={`flex-1 h-1.5 rounded-full transition-colors ${
                    i < currentSectionIdx ? 'bg-brand' : i === currentSectionIdx ? 'bg-brand/50' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-card border border-border rounded-3xl p-6 md:p-8 shadow-lg">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-brand mb-4" />
                <p className="text-sm text-muted-foreground">Menyiapkan soal...</p>
              </div>
            ) : question ? (
              <div className="space-y-6">
                {/* Passage (for reading) */}
                {question.passage && (
                  <div className="bg-muted/50 border border-border rounded-2xl p-4 md:p-5">
                    <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mb-2">Bacaan:</p>
                    <p className="text-sm md:text-base text-foreground leading-relaxed italic font-serif">{question.passage}</p>
                  </div>
                )}

                {/* Audio (for listening) */}
                {question.audio_text && (
                  <div className="bg-muted/50 border border-border rounded-2xl p-4 md:p-5 text-center">
                    <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mb-3">Dengarkan Audio:</p>
                    <button
                      onClick={() => speakText(question.audio_text!)}
                      className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold transition-all ${
                        speaking
                          ? 'bg-brand text-white animate-pulse'
                          : 'bg-brand/10 text-brand hover:bg-brand/20'
                      }`}
                    >
                      <Volume2 className="w-5 h-5" />
                      {speaking ? 'Sedang Memutar...' : 'Putar Audio'}
                    </button>
                    {!showFeedback && (
                      <p className="text-xs text-muted-foreground mt-2">Klik tombol di atas untuk mendengarkan, lalu jawab pertanyaan.</p>
                    )}
                  </div>
                )}

                {/* Question */}
                <h2 className="text-base md:text-lg font-bold text-foreground">{question.question}</h2>

                {/* Options */}
                <div className="space-y-3">
                  {question.options.map((opt, i) => {
                    const letter = optionLetter(i);
                    const isSelected = selectedAnswer === letter;
                    const isCorrect = serverData?.correct === letter;
                    let optClass = 'bg-muted border-border hover:border-brand/50 hover:bg-muted/80 cursor-pointer';

                    if (showFeedback) {
                      if (isCorrect) optClass = 'bg-emerald-500/10 border-emerald-500/50 ring-2 ring-emerald-500/30';
                      else if (isSelected && !isCorrect) optClass = 'bg-red-500/10 border-red-500/50 ring-2 ring-red-500/30';
                      else optClass = 'bg-muted border-border opacity-50';
                    } else if (isSelected) {
                      optClass = 'bg-brand/10 border-brand/50 ring-2 ring-brand/30';
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => handleAnswer(letter)}
                        disabled={showFeedback}
                        className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-3 ${optClass}`}
                      >
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                          showFeedback && isCorrect ? 'bg-emerald-500 text-white'
                          : showFeedback && isSelected && !isCorrect ? 'bg-red-500 text-white'
                          : 'bg-background border border-border text-muted-foreground'
                        }`}>
                          {showFeedback && isCorrect ? <CheckCircle2 className="w-4 h-4" />
                          : showFeedback && isSelected && !isCorrect ? <XCircle className="w-4 h-4" />
                          : letter}
                        </span>
                        <span className="text-sm text-foreground">{opt.replace(/^[A-D]\.\s*/, '')}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Feedback */}
                {showFeedback && serverData && (
                  <div className={`rounded-2xl p-4 border ${
                    selectedAnswer === serverData.correct
                      ? 'bg-emerald-500/5 border-emerald-500/20'
                      : 'bg-red-500/5 border-red-500/20'
                  }`}>
                    <p className={`text-sm font-bold mb-1 ${
                      selectedAnswer === serverData.correct ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                      {selectedAnswer === serverData.correct ? '✅ Benar!' : '❌ Kurang Tepat'}
                    </p>
                    <p className="text-xs text-muted-foreground">{serverData.explanation_id}</p>
                  </div>
                )}

                {/* Next Button */}
                {showFeedback && (
                  <button
                    onClick={handleNext}
                    disabled={loading}
                    className="w-full py-3.5 bg-brand text-white font-bold rounded-2xl hover:shadow-[0_0_20px_rgba(62,207,142,0.4)] transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> :
                      currentSectionIdx === SECTIONS.length - 1 && currentQuestionIdx + 1 === currentSection.questions
                        ? <>Lihat Hasil <Trophy className="w-4 h-4" /></>
                        : <>Soal Berikutnya <ChevronRight className="w-4 h-4" /></>
                    }
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground">Gagal memuat soal.</p>
                <button onClick={fetchQuestion} className="mt-4 px-4 py-2 bg-brand text-white rounded-xl text-sm">
                  <RotateCcw className="w-4 h-4 inline mr-1" /> Coba Lagi
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ========== RESULT SCREEN ==========
  if (phase === 'result' && finalResult) {
    const level = finalResult.finalLevel;
    const desc = CEFR_DESCRIPTIONS[level] || CEFR_DESCRIPTIONS.A1;
    const gradient = LEVEL_COLORS[level] || LEVEL_COLORS.A1;
    const hasScores = finalResult.scores.total > 0;

    return (
      <div className="min-h-full p-4 md:p-8 flex items-center justify-center">
        <div className="max-w-lg w-full">
          <div className="bg-card border border-border rounded-3xl p-6 md:p-10 shadow-xl text-center">
            <div className="mb-6">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br ${gradient} shadow-lg mb-4`}>
                <span className="text-3xl font-serif font-bold text-white">{level}</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">{desc.title}</h1>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{desc.desc}</p>
            </div>

            {hasScores && (
              <div className="space-y-3 mb-8">
                {[
                  { label: '📖 Reading', score: finalResult.scores.reading, color: 'bg-blue-500' },
                  { label: '📝 Grammar', score: finalResult.scores.grammar, color: 'bg-emerald-500' },
                  { label: '📚 Vocabulary', score: finalResult.scores.vocabulary, color: 'bg-purple-500' },
                  { label: '🎧 Listening', score: finalResult.scores.listening, color: 'bg-amber-500' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-28 text-left">{item.label}</span>
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full transition-all duration-1000`} style={{ width: `${item.score}%` }} />
                    </div>
                    <span className="text-xs font-bold text-foreground w-10 text-right">{item.score}%</span>
                  </div>
                ))}
              </div>
            )}

            <Link
              href="/dashboard"
              className="block w-full py-3.5 bg-brand text-white font-bold rounded-2xl hover:shadow-[0_0_20px_rgba(62,207,142,0.4)] transition-all mb-3"
            >
              Kembali ke Dashboard
            </Link>

            <button
              onClick={() => { setPhase('intro'); setScores({ reading: { correct: 0, total: 0, lastLevel: 'B1' }, grammar: { correct: 0, total: 0, lastLevel: 'B1' }, vocabulary: { correct: 0, total: 0, lastLevel: 'B1' }, listening: { correct: 0, total: 0, lastLevel: 'B1' } }); setCurrentSectionIdx(0); setCurrentQuestionIdx(0); setCurrentEstimate('B1'); }}
              className="w-full py-3 bg-muted border border-border text-foreground font-bold rounded-2xl hover:bg-muted/80 transition-colors text-sm"
            >
              <RotateCcw className="w-4 h-4 inline mr-2" />
              Ulang Tes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
