"use client";

import { useState, useRef, useEffect } from "react";
import { Headphones, Loader2, Play, Pause, RotateCcw, Upload, FileAudio, CheckCircle, XCircle, Trophy, RefreshCw, Volume2 } from "lucide-react";
import Swal from "sweetalert2";

type Level = "A1" | "A2" | "B1" | "B2";
type Mode = "quiz" | "dictation";

interface Question {
  question: string;
  options: string[];
  correct: string;
}

interface TestData {
  title: string;
  passage: string;
  questions: Question[];
}

const LEVELS: { id: Level; label: string; color: string; bg: string; border: string }[] = [
  { id: "A1", label: "Beginner", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  { id: "A2", label: "Elementary", color: "text-brand", bg: "bg-brand/10", border: "border-brand/30" },
  { id: "B1", label: "Intermediate", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  { id: "B2", label: "Upper Int.", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
];

export default function ListeningTestPage() {
  const [level, setLevel] = useState<Level>("A2");
  const [mode, setMode] = useState<Mode>("quiz");
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState<TestData | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  // Audio Player State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [replayCount, setReplayCount] = useState(0);

  // Quiz State
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [dictationAnswer, setDictationAnswer] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  // Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  useEffect(() => {
    // Cleanup audio URL on unmount
    return () => {
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const changeSpeed = () => {
    if (!audioRef.current) return;
    const nextRate = playbackRate === 1 ? 0.75 : playbackRate === 0.75 ? 1.25 : 1;
    audioRef.current.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const replay = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play();
    setIsPlaying(true);
    setReplayCount(prev => prev + 1);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const fetchTTS = async (text: string) => {
    const ttsEngine = localStorage.getItem("tts_engine") || "browser";
    
    if (ttsEngine === "groq") {
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text })
        });
        
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
          return;
        }
      } catch (err) {
        console.error("Groq TTS failed, falling back to browser TTS", err);
      }
    }
    
    // Browser TTS Fallback (we synthesize it into a Blob via MediaRecorder if possible, 
    // but standard SpeechSynthesis doesn't support streaming to audio tag easily.
    // So if it's browser, we just use SpeechSynthesisUtterance directly when "playing")
    setAudioUrl("browser-tts");
  };

  const playBrowserTTS = () => {
    if (!testData) return;
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(testData.passage);
      u.lang = "en-US";
      u.rate = playbackRate;
      
      u.onstart = () => setIsPlaying(true);
      u.onend = () => setIsPlaying(false);
      u.onerror = () => setIsPlaying(false);
      
      window.speechSynthesis.speak(u);
    }
  };

  const stopBrowserTTS = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    }
  };

  const handleTogglePlay = () => {
    if (audioUrl === "browser-tts") {
      if (isPlaying) {
        stopBrowserTTS();
      } else {
        playBrowserTTS();
      }
    } else {
      togglePlay();
    }
  };

  const generateTest = async () => {
    setLoading(true);
    setTestData(null);
    setAudioUrl(null);
    setAnswers({});
    setDictationAnswer("");
    setShowResults(false);
    setReplayCount(0);
    setUploadedFileName(null);
    if (window.speechSynthesis) window.speechSynthesis.cancel();

    try {
      const res = await fetch("/api/listening-test/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setTestData(data);
      await fetchTTS(data.passage);
      
    } catch (err: any) {
      Swal.fire({ title: "Error", text: err.message, icon: "error", confirmButtonColor: "#2fa16b" });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      Swal.fire({ title: "Error", text: "Mohon unggah file audio (MP3, WAV, dsb).", icon: "error", confirmButtonColor: "#2fa16b" });
      return;
    }

    if (audioUrl && audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl);
    }

    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setUploadedFileName(file.name);
    
    // If no test data exists, create a dummy one for dictation mode since we can't generate questions from audio easily
    if (!testData) {
      setMode("dictation");
      setTestData({
        title: "Manual Audio Dictation",
        passage: "TRANSKRIP_TIDAK_TERSEDIA",
        questions: []
      });
    }
  };

  const submitQuiz = () => {
    if (!testData) return;
    
    if (mode === "quiz") {
      let correct = 0;
      testData.questions.forEach((q, i) => {
        if (answers[i]?.startsWith(q.correct)) correct++;
      });
      setScore(Math.round((correct / testData.questions.length) * 100));
    } else {
      if (testData.passage === "TRANSKRIP_TIDAK_TERSEDIA") {
        setScore(100); // Dummy score for manual audio without transcript
      } else {
        // Simple string comparison for dictation
        const cleanUser = dictationAnswer.toLowerCase().replace(/[^\w\s]/g, "").trim();
        const cleanTarget = testData.passage.toLowerCase().replace(/[^\w\s]/g, "").trim();
        
        // Very basic Levenshtein approximation could be here, but for now exact or includes
        if (cleanUser === cleanTarget) {
          setScore(100);
        } else if (cleanTarget.includes(cleanUser) && cleanUser.length > cleanTarget.length * 0.8) {
          setScore(80);
        } else {
          // Calculate word match percentage
          const targetWords = cleanTarget.split(" ");
          const userWords = cleanUser.split(" ");
          let matchCount = 0;
          userWords.forEach(w => { if (targetWords.includes(w)) matchCount++; });
          setScore(Math.round((matchCount / Math.max(targetWords.length, 1)) * 100));
        }
      }
    }
    
    setShowResults(true);
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto min-h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground flex items-center justify-center gap-3">
          <Headphones className="w-8 h-8 text-brand" />
          Listening Comprehension Test
        </h1>
        <p className="text-muted-foreground mt-2 text-base sm:text-lg">Latih pendengaran Anda dengan audio yang disesuaikan dengan tingkat CEFR.</p>
      </div>

      {/* Configuration Panel */}
      {!testData && !loading && (
        <div className="bg-card border border-border rounded-3xl p-8 shadow-sm relative overflow-hidden max-w-2xl mx-auto">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand/0 via-brand to-brand/0 opacity-50" />
          
          <div className="mb-6">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">Tingkat Kesulitan (CEFR)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {LEVELS.map(lvl => (
                <button
                  key={lvl.id}
                  onClick={() => setLevel(lvl.id)}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    level === lvl.id ? `${lvl.bg} ${lvl.border} ring-1 ring-${lvl.color.split('-')[1]}-500` : "border-border hover:border-foreground/30 bg-background"
                  }`}
                >
                  <p className={`font-bold text-lg ${level === lvl.id ? lvl.color : "text-foreground"}`}>{lvl.id}</p>
                  <p className="text-xs text-muted-foreground mt-1">{lvl.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">Mode Latihan</h3>
            <div className="flex gap-3">
              <button
                onClick={() => setMode("quiz")}
                className={`flex-1 p-4 rounded-2xl border transition-all ${mode === "quiz" ? "bg-brand/10 border-brand/30 ring-1 ring-brand/50" : "bg-background border-border"}`}
              >
                <p className={`font-bold ${mode === "quiz" ? "text-brand" : "text-foreground"}`}>Quiz Pilihan Ganda</p>
                <p className="text-xs text-muted-foreground mt-1">Jawab pertanyaan dari audio.</p>
              </button>
              <button
                onClick={() => setMode("dictation")}
                className={`flex-1 p-4 rounded-2xl border transition-all ${mode === "dictation" ? "bg-brand/10 border-brand/30 ring-1 ring-brand/50" : "bg-background border-border"}`}
              >
                <p className={`font-bold ${mode === "dictation" ? "text-brand" : "text-foreground"}`}>Dikte (Dictation)</p>
                <p className="text-xs text-muted-foreground mt-1">Ketik apa yang Anda dengar.</p>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={generateTest}
              className="w-full py-4 bg-brand text-background font-bold rounded-xl text-lg hover:shadow-[0_0_20px_rgba(62,207,142,0.3)] transition-all flex items-center justify-center gap-2"
            >
              <Headphones className="w-5 h-5" /> Generate Test Baru
            </button>
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-border"></div>
              <span className="flex-shrink-0 mx-4 text-muted-foreground text-sm font-medium">ATAU</span>
              <div className="flex-grow border-t border-border"></div>
            </div>

            <div>
              <input 
                type="file" 
                accept="audio/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 bg-muted hover:bg-muted/80 text-foreground font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-border"
              >
                <Upload className="w-4 h-4" /> Unggah Audio Manual (Mode Dikte)
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-brand">
          <Loader2 className="w-12 h-12 animate-spin mb-4" />
          <p className="animate-pulse font-medium">Membangun skenario listening test...</p>
        </div>
      )}

      {/* Active Test Area */}
      {testData && !loading && (
        <div className="space-y-6">
          {/* Audio Player Card */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-lg flex flex-col md:flex-row items-center gap-6">
            <div className="w-full md:w-auto shrink-0 flex flex-col items-center justify-center bg-brand/5 border border-brand/20 rounded-2xl p-6">
              <div className="relative">
                <div className={`absolute inset-0 bg-brand/20 rounded-full blur-xl transition-all duration-1000 ${isPlaying ? 'scale-150 opacity-100' : 'scale-100 opacity-0'}`} />
                <button
                  onClick={handleTogglePlay}
                  className="relative w-20 h-20 bg-brand text-background rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-lg"
                >
                  {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                </button>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <button onClick={replay} className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted" title="Ulangi (Replay)">
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button onClick={changeSpeed} className="px-3 py-1 bg-muted rounded-lg text-xs font-bold font-mono hover:bg-muted/80 transition-colors">
                  {playbackRate}x
                </button>
              </div>
            </div>

            <div className="flex-1 w-full space-y-4">
              <div>
                <h2 className="text-xl font-bold text-foreground">{testData.title}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-muted border border-border uppercase tracking-wider">{mode}</span>
                  {!uploadedFileName && <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20 uppercase tracking-wider">Level {level}</span>}
                  {uploadedFileName && <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1"><FileAudio className="w-3 h-3" /> {uploadedFileName}</span>}
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">Diputar {replayCount}x</span>
                  {audioUrl === "browser-tts" && <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wider flex items-center gap-1"><Volume2 className="w-3 h-3"/> Browser TTS</span>}
                </div>
              </div>

              {audioUrl && audioUrl !== "browser-tts" && (
                <audio 
                  ref={audioRef} 
                  src={audioUrl} 
                  onEnded={handleAudioEnded} 
                  className="w-full h-10 outline-none" 
                  controls 
                  controlsList="nodownload noplaybackrate"
                />
              )}
            </div>
          </div>

          {/* Quiz Mode */}
          {mode === "quiz" && !showResults && (
            <div className="space-y-6">
              {testData.questions.map((q, qIdx) => (
                <div key={qIdx} className="bg-card border border-border rounded-2xl p-6">
                  <p className="font-bold text-foreground mb-4">
                    <span className="text-brand mr-2">{qIdx + 1}.</span> {q.question}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {q.options.map((opt, oIdx) => {
                      const isSelected = answers[qIdx] === opt;
                      return (
                        <button
                          key={oIdx}
                          onClick={() => setAnswers(prev => ({ ...prev, [qIdx]: opt }))}
                          className={`p-4 rounded-xl border text-left text-sm transition-all ${
                            isSelected ? "bg-brand/10 border-brand ring-1 ring-brand/50" : "bg-background border-border hover:border-brand/50 hover:bg-muted"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Dictation Mode */}
          {mode === "dictation" && !showResults && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="font-bold text-foreground mb-4">Ketik Transkrip Audio:</h3>
              <textarea
                value={dictationAnswer}
                onChange={(e) => setDictationAnswer(e.target.value)}
                placeholder="Tulis persis seperti apa yang Anda dengar..."
                className="w-full h-40 bg-background border border-border rounded-xl p-4 text-foreground focus:ring-1 focus:ring-brand focus:outline-none resize-none"
              />
            </div>
          )}

          {/* Submit Button */}
          {!showResults && (
            <div className="flex justify-end pt-4">
              <button
                onClick={submitQuiz}
                disabled={(mode === "quiz" && Object.keys(answers).length < testData.questions.length) || (mode === "dictation" && !dictationAnswer.trim())}
                className="px-8 py-4 bg-brand text-background font-bold rounded-xl disabled:opacity-50 transition-all hover:shadow-lg flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" /> Kumpulkan Jawaban
              </button>
            </div>
          )}

          {/* Results Area */}
          {showResults && (
            <div className="bg-card border border-border rounded-3xl p-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="text-center mb-8">
                <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 ${score >= 80 ? "bg-emerald-500/20 text-emerald-500" : score >= 60 ? "bg-amber-500/20 text-amber-500" : "bg-red-500/20 text-red-500"}`}>
                  <Trophy className="w-12 h-12" />
                </div>
                <h2 className="text-3xl font-serif font-bold text-foreground">Skor: {score} / 100</h2>
                <p className="text-muted-foreground mt-2">Anda memutar audio sebanyak {replayCount} kali.</p>
              </div>

              {/* Transcript */}
              {testData.passage !== "TRANSKRIP_TIDAK_TERSEDIA" && (
                <div className="mb-8 p-6 bg-brand/5 border border-brand/20 rounded-2xl">
                  <h3 className="text-sm font-bold text-brand uppercase tracking-wider mb-3">Transkrip Lengkap</h3>
                  <p className="text-foreground leading-relaxed text-lg">{testData.passage}</p>
                </div>
              )}

              {/* Quiz Results Review */}
              {mode === "quiz" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-foreground mb-4">Ulasan Jawaban:</h3>
                  {testData.questions.map((q, qIdx) => {
                    const userAnswer = answers[qIdx];
                    const isCorrect = userAnswer?.startsWith(q.correct);
                    return (
                      <div key={qIdx} className={`p-4 rounded-xl border ${isCorrect ? "bg-emerald-500/5 border-emerald-500/30" : "bg-red-500/5 border-red-500/30"}`}>
                        <p className="font-bold text-foreground mb-2">{qIdx + 1}. {q.question}</p>
                        <div className="flex items-center gap-2 text-sm">
                          {isCorrect ? (
                            <><CheckCircle className="w-4 h-4 text-emerald-500" /> <span className="text-emerald-500 font-medium">{userAnswer}</span></>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-500" /> <span className="text-red-500 line-through">{userAnswer || "Tidak dijawab"}</span></div>
                              <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> <span className="text-emerald-500 font-medium">Jawaban Benar: {q.options.find(o => o.startsWith(q.correct))}</span></div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => { setTestData(null); setShowResults(false); }}
                  className="px-6 py-3 bg-muted hover:bg-muted/80 text-foreground font-bold rounded-xl transition-all flex items-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" /> Latihan Lagi
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
