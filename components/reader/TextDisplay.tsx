"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { MessageSquareQuote, Clock, Keyboard, Volume2, VolumeX, BrainCircuit, Loader2, CheckCircle2, XCircle } from "lucide-react";
import WordLookupSidebar from "./WordLookupSidebar";
import ReadingCompanionSidebar from "./ReadingCompanionSidebar";
import { createClient } from "@/utils/supabase/client";
import CulturalTextRenderer, { CulturalReference } from "./CulturalTextRenderer";
import InteractiveParagraph from "./InteractiveParagraph";
import { Search } from "lucide-react";

export interface BookBlock {
  type: "heading" | "paragraph" | "verse";
  text: string;
}

interface TextDisplayProps {
  textId: string;
  title: string;
  author: string;
  content?: string;
  blocks?: BookBlock[];
  onTextSelect?: () => void;
}

export default function TextDisplay({ textId, title, author, content, blocks, onTextSelect }: TextDisplayProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [contextSentence, setContextSentence] = useState<string | null>(null);
  const [activeSidebar, setActiveSidebar] = useState<"lookup" | null>(null);
  const [showCompanion, setShowCompanion] = useState(false);
  const [culturalRefs, setCulturalRefs] = useState<CulturalReference[]>([]);
  const [prefs, setPrefs] = useState<any>(null);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Beginner Features State
  const [isBeginnerMode, setIsBeginnerMode] = useState(false);
  const [beginnerLevel, setBeginnerLevel] = useState("B1");
  const [beginnerLayout, setBeginnerLayout] = useState<"inline" | "below" | "split">("below");
  const [activeSyntaxIndex, setActiveSyntaxIndex] = useState<number | null>(null);

  // Quiz State
  const [quizData, setQuizData] = useState<any>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [lastQuizHeadingIdx, setLastQuizHeadingIdx] = useState<number>(-1);
  const [quizAnswered, setQuizAnswered] = useState<number | null>(null);

  // Parse paragraphs (only if content is provided as string)
  const paragraphs = content ? content.split("\n").filter((p) => p.trim() !== "") : [];

  // Heartbeat to track time spent
  useEffect(() => {
    if (!textId) return;

    // Fetch Cultural References and Preferences
    async function initData() {
      const supabase = createClient();
      
      const [refsRes, authRes] = await Promise.all([
        supabase.from("cultural_references").select("*"),
        supabase.auth.getUser()
      ]);

      if (refsRes.data) setCulturalRefs(refsRes.data);

      if (authRes.data.user) {
        const { data: profile } = await supabase.from("profiles").select("preferences").eq("id", authRes.data.user.id).single();
        if (profile?.preferences) {
          setPrefs(profile.preferences);
        }
      }
    }
    initData();

    const intervalSeconds = 10;
    const interval = setInterval(() => {
      // Check if document is visible (user is actually reading)
      if (document.visibilityState === 'visible') {
        fetch('/api/reading/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text_id: textId,
            time_spent_seconds: intervalSeconds
          })
        }).catch(err => console.error("Heartbeat failed", err));
      }
    }, intervalSeconds * 1000);

    return () => clearInterval(interval);
  }, [textId]);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

      const text = selection.toString().trim();
      if (!text || text.includes("\n") || text.split(" ").length > 5) return; // Only allow words or short phrases

      // Get context sentence (simple approximation: get the parent node text)
      let sentence = "";
      const anchorNode = selection.anchorNode;
      if (anchorNode && anchorNode.parentElement) {
        sentence = anchorNode.parentElement.textContent || text;
      }

      setSelectedWord(text);
      setContextSentence(sentence);
      setActiveSidebar("lookup");
    };

    document.addEventListener("mouseup", handleSelection);
    document.addEventListener("touchend", handleSelection);
    return () => {
      document.removeEventListener("mouseup", handleSelection);
      document.removeEventListener("touchend", handleSelection);
    };
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    if (prefs?.display?.keyboard_shortcuts !== false) {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Esc: close sidebars
        if (e.key === "Escape") {
          setActiveSidebar(null);
          setShowCompanion(false);
          window.getSelection()?.removeAllRanges();
        }
        
        // Ctrl + 1: Toggle AI Companion
        if (e.ctrlKey && e.key === "1") {
          e.preventDefault();
          setShowCompanion(prev => !prev);
        }
      };
      
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [prefs?.display?.keyboard_shortcuts]);

  // Text-to-Speech logic
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const toggleSpeech = async (text: string, index: number) => {
    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setSpeakingIndex(null);
      return;
    }
    
    window.speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSpeakingIndex(index);
    
    const provider = prefs?.reading?.tts_provider || "browser";

    if (provider === "groq") {
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text })
        });
        if (!res.ok) throw new Error("TTS failed");
        
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        
        audio.onended = () => {
          setSpeakingIndex(null);
          URL.revokeObjectURL(url);
        };
        audio.onerror = () => {
          setSpeakingIndex(null);
          URL.revokeObjectURL(url);
        };
        
        await audio.play();
      } catch (err) {
        console.error("Groq TTS Error:", err);
        setSpeakingIndex(null);
      }
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.85; // Slightly slower for beginners
      
      utterance.onend = () => setSpeakingIndex(null);
      utterance.onerror = () => setSpeakingIndex(null);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  // Quiz Intersection Observer (Detect Chapter Changes)
  useEffect(() => {
    if (prefs?.reading?.enable_quizzes === false) return; // Disabled in settings
    if (!blocks || blocks.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = parseInt(entry.target.getAttribute("data-block-idx") || "-1");
          // Ensure we actually scrolled to it (from bottom or top) and not just loaded the page
          if (idx > 10 && idx > lastQuizHeadingIdx && entry.intersectionRatio > 0) { 
             triggerQuiz(idx);
          }
        }
      });
    }, { root: null, rootMargin: "0px", threshold: 0.1 });

    const headingEls = document.querySelectorAll(".gutenberg-heading");
    headingEls.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [prefs, lastQuizHeadingIdx, blocks]);

  const triggerQuiz = async (headingIdx: number) => {
    setLastQuizHeadingIdx(headingIdx); // Prevent triggering again for this heading
    setQuizLoading(true);
    setShowQuizModal(true);
    setQuizData(null);
    setQuizAnswered(null);

    // Get the text context (last 5-8 blocks before heading)
    const contextBlocks = blocks ? blocks.slice(Math.max(0, headingIdx - 8), headingIdx) : [];
    const contextText = contextBlocks.map(b => b.text).join("\n\n");

    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contextText, title, author })
      });
      const data = await res.json();
      if (res.ok && data.question) {
        setQuizData(data);
      } else {
        setShowQuizModal(false); // Fail silently
      }
    } catch (e) {
      setShowQuizModal(false);
    } finally {
      setQuizLoading(false);
    }
  };

  // Determine dynamic styles based on preferences
  const readPrefs = prefs?.reading || {};
  const displayPrefs = prefs?.display || {};
  
  const fontClass = readPrefs.font_family === "sans-serif" ? "font-sans" : 
                    readPrefs.font_family === "dyslexic" ? "" : "font-serif";
  const dyslexicStyle = readPrefs.font_family === "dyslexic" ? { fontFamily: '"OpenDyslexic", "Comic Sans MS", sans-serif' } : {};
  
  const widthClass = readPrefs.text_width === "narrow" ? "max-w-xl" : 
                     readPrefs.text_width === "wide" ? "max-w-5xl" : "max-w-3xl";

  let themeClass = readPrefs.theme === "dark" ? "bg-gray-900 text-gray-100" :
                   readPrefs.theme === "sepia" ? "bg-[#f4ecd8] text-[#5b4636]" : 
                   "bg-background text-foreground"; // Default to global theme for 'light'

  if (displayPrefs.high_contrast) {
    if (readPrefs.theme === "dark") {
      themeClass = "bg-[#000000] text-[#FFFF00] font-bold"; // Black bg, yellow text is highest contrast for low-vision
    } else {
      themeClass = "bg-[#FFFFFF] text-[#000000] font-bold"; // Pure white bg, pure black text
    }
  }

  const wordCount = useMemo(() => {
    if (blocks) return blocks.reduce((acc, block) => acc + block.text.split(/\s+/).length, 0);
    if (paragraphs) return paragraphs.reduce((acc, p) => acc + p.split(/\s+/).length, 0);
    return 0;
  }, [blocks, paragraphs]);

  const readingTimeMinutes = Math.ceil(wordCount / 200);

  const customStyle = {
    ...dyslexicStyle,
    fontSize: readPrefs.font_size ? `${readPrefs.font_size}px` : undefined,
    lineHeight: readPrefs.line_height ? readPrefs.line_height : undefined,
  };

  return (
    <div className={`flex h-full relative overflow-hidden ${themeClass}`}>
      {readPrefs.highlight_color && (
        <style dangerouslySetInnerHTML={{__html: `
          .prose-literature ::selection {
            background-color: ${readPrefs.highlight_color}80; /* 50% opacity */
            color: inherit;
          }
        `}} />
      )}
      {/* Main Reading Area */}
      <div 
        className={`flex-1 overflow-y-auto transition-all duration-300 relative ${activeSidebar ? 'md:pr-[400px]' : ''}`}
        onMouseUp={() => onTextSelect?.()}
        onTouchEnd={() => onTextSelect?.()}
      >
        <div className="sticky top-0 bg-background/80 backdrop-blur-md z-30 p-4 border-b border-border flex justify-between items-center shadow-sm">
          <div className="flex-1 truncate flex items-center gap-4 text-sm text-muted-foreground font-medium">
            {displayPrefs.show_reading_time !== false && (
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> Est: {readingTimeMinutes} mnt</span>
            )}
            {displayPrefs.keyboard_shortcuts !== false && (
              <span className="hidden md:flex items-center gap-1 opacity-50"><Keyboard className="w-4 h-4" /> Ctrl+1: AI, Esc: Tutup</span>
            )}
          </div>
          <button 
            onClick={() => setShowCompanion(true)} 
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-full font-medium flex items-center gap-2 text-sm shadow-md transition-all hover:scale-105 active:scale-95"
          >
            <MessageSquareQuote className="w-4 h-4" />
            <span className="hidden md:inline">Ask AI Companion</span>
            <span className="md:hidden">AI</span>
          </button>
        </div>

        {/* Global Controls for Beginner Mode */}
        <div className="bg-muted/30 border-b border-border px-6 py-3 flex flex-wrap items-center justify-center gap-4 text-sm z-20 relative">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isBeginnerMode} onChange={e => setIsBeginnerMode(e.target.checked)} className="w-4 h-4 accent-brand" />
            <span className="font-bold">Beginner Mode</span>
          </label>
          
          {isBeginnerMode && (
            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4">
              <select value={beginnerLevel} onChange={e => setBeginnerLevel(e.target.value)} className="bg-background border border-border rounded-lg px-2 py-1 text-sm focus:outline-none">
                <option value="A2">Level A2 (Dasar)</option>
                <option value="B1">Level B1 (Menengah)</option>
              </select>
              <select value={beginnerLayout} onChange={e => setBeginnerLayout(e.target.value as any)} className="bg-background border border-border rounded-lg px-2 py-1 text-sm focus:outline-none">
                <option value="inline">Ganti Teks (Inline)</option>
                <option value="below">Berdampingan (Bawah)</option>
                <option value="split">Layar Belah (Split)</option>
              </select>
            </div>
          )}
        </div>

        {/* Legend Bedah Sintaksis */}
        {activeSyntaxIndex !== null && (
          <div className="bg-blue-500/10 border-b border-blue-500/20 px-6 py-2 flex flex-wrap items-center justify-center gap-6 text-sm z-20 relative animate-in fade-in slide-in-from-top-2">
            <span className="font-bold flex items-center gap-2"><Search className="w-4 h-4 text-blue-500" /> Legenda Sintaksis:</span>
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-500/50 border border-blue-500 rounded-sm"></span> Subjek</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-red-500/50 border border-red-500 rounded-sm"></span> Verba / Predikat</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-yellow-500/50 border border-yellow-500 rounded-sm"></span> Objek</div>
          </div>
        )}

        <div className={`${widthClass} mx-auto px-6 md:px-8 py-12 transition-all duration-500`}>
          <header className="mb-12 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: dyslexicStyle.fontFamily ? dyslexicStyle.fontFamily : 'inherit' }}>{title}</h1>
            <p className="text-lg md:text-xl italic opacity-80">by {author}</p>
          </header>

          <div 
            ref={contentRef}
            className={`prose-literature ${fontClass} leading-loose opacity-90 transition-all duration-300`}
            style={customStyle}
            role={displayPrefs.screen_reader ? "article" : undefined}
            aria-label={displayPrefs.screen_reader ? `Buku: ${title} oleh ${author}` : undefined}
          >
            {blocks ? (
              blocks.map((block, index) => {
                const isHeading = block.type === "heading";
                const isVerse = block.type === "verse";
                return (
                  <div key={index} className="flex gap-4 group" data-block-idx={index}>
                    {readPrefs.line_numbers && !isHeading && (
                      <span className="w-8 text-right text-xs opacity-30 select-none pt-2 group-hover:opacity-60" aria-hidden={displayPrefs.screen_reader ? "true" : "false"}>{index + 1}</span>
                    )}
                    <p 
                      className={`flex-1 ${isHeading ? 'gutenberg-heading mt-14 mb-8 text-center text-3xl font-bold' : isVerse ? 'my-8 whitespace-pre-line text-center italic' : 'my-6 text-left [text-indent:2rem] md:text-justify'}`}
                      data-block-idx={index}
                    >
                      <InteractiveParagraph 
                        text={block.text} 
                        culturalRefs={culturalRefs}
                        isBeginnerMode={isBeginnerMode}
                        beginnerLevel={beginnerLevel}
                        beginnerLayout={beginnerLayout}
                        showSyntax={activeSyntaxIndex === index}
                      />
                    </p>
                    {!isHeading && (
                      <div className="w-10 pt-2 shrink-0 flex flex-col gap-2 items-center justify-start">
                        {readPrefs.tts_enabled !== false && (
                          <button 
                            onClick={() => toggleSpeech(block.text, index)}
                            className={`p-2 rounded-full transition-all ${speakingIndex === index ? 'opacity-100 bg-brand/20 text-brand animate-pulse' : 'opacity-0 md:group-hover:opacity-100 bg-muted text-muted-foreground hover:bg-brand/10 hover:text-brand'}`}
                            title={speakingIndex === index ? "Stop Reading" : "Read Aloud"}
                          >
                            {speakingIndex === index ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                          </button>
                        )}
                        <button 
                          onClick={() => setActiveSyntaxIndex(activeSyntaxIndex === index ? null : index)}
                          className={`p-2 rounded-full transition-all ${activeSyntaxIndex === index ? 'opacity-100 bg-blue-500/20 text-blue-500' : 'opacity-0 md:group-hover:opacity-100 bg-muted text-muted-foreground hover:bg-blue-500/10 hover:text-blue-500'}`}
                          title={activeSyntaxIndex === index ? "Tutup Bedah Sintaksis" : "Bedah Sintaksis"}
                        >
                          <Search className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              paragraphs.map((p, idx) => (
                <div key={idx} className="flex gap-4 group">
                  {readPrefs.line_numbers && (
                    <span className="w-8 text-right text-xs opacity-30 select-none pt-2 group-hover:opacity-60" aria-hidden={displayPrefs.screen_reader ? "true" : "false"}>{idx + 1}</span>
                  )}
                  <p className="flex-1 my-6 text-left [text-indent:2rem] md:text-justify">
                    <InteractiveParagraph 
                        text={p} 
                        culturalRefs={culturalRefs}
                        isBeginnerMode={isBeginnerMode}
                        beginnerLevel={beginnerLevel}
                        beginnerLayout={beginnerLayout}
                        showSyntax={activeSyntaxIndex === idx}
                      />
                  </p>
                  <div className="w-10 pt-2 shrink-0 flex flex-col gap-2 items-center justify-start">
                    {readPrefs.tts_enabled !== false && (
                      <button 
                        onClick={() => toggleSpeech(p, idx)}
                        className={`p-2 rounded-full transition-all ${speakingIndex === idx ? 'opacity-100 bg-brand/20 text-brand animate-pulse' : 'opacity-0 md:group-hover:opacity-100 bg-muted text-muted-foreground hover:bg-brand/10 hover:text-brand'}`}
                        title={speakingIndex === idx ? "Stop Reading" : "Read Aloud"}
                      >
                        {speakingIndex === idx ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    )}
                    <button 
                      onClick={() => setActiveSyntaxIndex(activeSyntaxIndex === idx ? null : idx)}
                      className={`p-2 rounded-full transition-all ${activeSyntaxIndex === idx ? 'opacity-100 bg-blue-500/20 text-blue-500' : 'opacity-0 md:group-hover:opacity-100 bg-muted text-muted-foreground hover:bg-blue-500/10 hover:text-blue-500'}`}
                      title={activeSyntaxIndex === idx ? "Tutup Bedah Sintaksis" : "Bedah Sintaksis"}
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Area for Word Lookup */}
      <div className={`absolute top-0 right-0 w-full sm:w-[400px] h-full bg-background backdrop-blur-3xl border-l border-border transform transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-[0_0_50px_rgba(0,0,0,0.5)] z-50 ${activeSidebar ? 'translate-x-0' : 'translate-x-full'}`}>
        {activeSidebar === "lookup" && (
          <WordLookupSidebar 
            word={selectedWord} 
            contextSentence={contextSentence}
            title={title}
            author={author}
            textId={textId}
            dictionaryPrefs={prefs?.dictionary}
            learningPrefs={prefs?.learning}
            onClose={() => {
              setActiveSidebar(null);
              window.getSelection()?.removeAllRanges();
            }} 
          />
        )}
      </div>

      {/* Quiz Modal Overlay */}
      {showQuizModal && (
        <div className="absolute inset-0 z-[100] bg-background/80 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="bg-card border border-border shadow-2xl rounded-3xl max-w-lg w-full overflow-hidden">
            <div className="bg-orange-500 p-6 text-white text-center relative overflow-hidden">
              <BrainCircuit className="w-24 h-24 absolute -right-4 -top-4 opacity-20" />
              <h3 className="text-2xl font-bold font-serif relative z-10">Comprehension Checkpoint</h3>
              <p className="text-orange-100 mt-1 relative z-10 text-sm">Mari pastikan Anda memahami bab sebelumnya!</p>
            </div>
            
            <div className="p-8">
              {quizLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="w-10 h-10 animate-spin text-orange-500 mb-4" />
                  <p className="text-muted-foreground animate-pulse">Menyiapkan kuis pemahaman...</p>
                </div>
              ) : quizData ? (
                <div className="space-y-6">
                  <p className="text-lg font-medium text-foreground">{quizData.question}</p>
                  
                  <div className="space-y-3">
                    {quizData.options.map((opt: string, i: number) => {
                      const isSelected = quizAnswered === i;
                      const isCorrect = quizData.correct_index === i;
                      const showResult = quizAnswered !== null;
                      
                      let btnClass = "bg-muted hover:bg-muted/80 text-foreground border-transparent";
                      if (showResult) {
                        if (isCorrect) btnClass = "bg-green-500/10 border-green-500 text-green-600 dark:text-green-400";
                        else if (isSelected) btnClass = "bg-red-500/10 border-red-500 text-red-600 dark:text-red-400";
                        else btnClass = "bg-muted opacity-50 border-transparent";
                      }

                      return (
                        <button 
                          key={i}
                          disabled={showResult}
                          onClick={() => setQuizAnswered(i)}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between ${btnClass}`}
                        >
                          <span>{opt}</span>
                          {showResult && isCorrect && <CheckCircle2 className="w-5 h-5" />}
                          {showResult && isSelected && !isCorrect && <XCircle className="w-5 h-5" />}
                        </button>
                      );
                    })}
                  </div>

                  {quizAnswered !== null && (
                    <div className="pt-6 border-t border-border animate-in fade-in slide-in-from-bottom-2">
                      <p className="text-sm text-muted-foreground mb-4">{quizData.explanation}</p>
                      <button 
                        onClick={() => setShowQuizModal(false)}
                        className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold shadow-md transition-all active:scale-95"
                      >
                        Lanjutkan Membaca
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Gagal memuat kuis.</p>
                  <button onClick={() => setShowQuizModal(false)} className="px-6 py-2 bg-muted hover:bg-muted/80 rounded-full font-medium">Lanjutkan Membaca</button>
                </div>
              )}
            </div>
            
            {/* Close Button (if they want to skip without answering) */}
            {quizAnswered === null && (
              <div className="p-4 bg-muted/30 border-t border-border text-center">
                <button onClick={() => setShowQuizModal(false)} className="text-sm text-muted-foreground hover:text-foreground underline">
                  Lewati Kuis (Skip)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pop-up Area for Reading Companion */}
      {showCompanion && (
        <ReadingCompanionSidebar
          title={title}
          author={author}
          content={content || blocks?.map(b => b.text).join("\n") || ""}
          onClose={() => setShowCompanion(false)}
        />
      )}
    </div>
  );
}
