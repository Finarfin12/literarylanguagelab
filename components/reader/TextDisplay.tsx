"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { MessageSquareQuote, Clock, Keyboard, Volume2, VolumeX, BrainCircuit, Loader2, CheckCircle2, XCircle, BookOpen, Mic, Square, Play, Headphones } from "lucide-react";
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
  const [positionOffset, setPositionOffset] = useState<number | null>(null);
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

  // Writing Prompt State
  const [showWritingPrompt, setShowWritingPrompt] = useState(false);
  const [writingPromptVocab, setWritingPromptVocab] = useState<string[]>([]);
  const [writingResponse, setWritingResponse] = useState("");
  const [writingEvaluating, setWritingEvaluating] = useState(false);
  const [writingResult, setWritingResult] = useState<any>(null);

  // Listening Challenge State
  const [showListeningModal, setShowListeningModal] = useState(false);
  const [listeningLoading, setListeningLoading] = useState(false);
  const [listeningQuestions, setListeningQuestions] = useState<any[]>([]);
  const [currentListeningIdx, setCurrentListeningIdx] = useState(0);
  const [listeningAnswers, setListeningAnswers] = useState<{question: string, expected_answer: string, user_transcript: string}[]>([]);
  const [listeningResult, setListeningResult] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTranscript, setRecordingTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

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

  // Handle hash scrolling for contextual review
  useEffect(() => {
    if (window.location.hash && (blocks?.length || content)) {
      const id = window.location.hash.substring(1);
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Highlight it temporarily
          el.classList.add('bg-brand/10', 'transition-colors', 'duration-1000', 'rounded-lg', 'p-2');
          setTimeout(() => {
            el.classList.remove('bg-brand/10', 'p-2');
          }, 3000);
        }
      }, 300); // small delay to allow DOM to paint
    }
  }, [blocks, content]);

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

      let offset = null;
      let el = anchorNode?.parentElement;
      while (el && el !== document.body) {
        if (el.hasAttribute('data-block-idx')) {
          offset = parseInt(el.getAttribute('data-block-idx') || "-1");
          break;
        }
        el = el.parentElement;
      }

      setSelectedWord(text);
      setContextSentence(sentence);
      setPositionOffset(offset);
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

  const handleCloseQuiz = async () => {
    setShowQuizModal(false);
    if (prefs?.reading?.enable_writing_prompts) {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: vocab } = await supabase.from('vocabulary')
            .select('word')
            .eq('user_id', user.id)
            .eq('text_id', textId)
            .limit(10);
            
          if (vocab && vocab.length >= 3) {
            const words = vocab.map(v => v.word).sort(() => Math.random() - 0.5).slice(0, 5);
            setWritingPromptVocab(words);
            setWritingResponse("");
            setWritingResult(null);
            setShowWritingPrompt(true);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const initSpeechRecognition = () => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.interimResults = true;
        recognition.continuous = true;
        recognition.onresult = (event: any) => {
          let finalTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setRecordingTranscript((prev) => prev + " " + finalTranscript);
          }
        };
        recognition.onerror = () => setIsRecording(false);
        recognition.onend = () => setIsRecording(false);
        recognitionRef.current = recognition;
      }
    }
  };

  useEffect(() => {
    initSpeechRecognition();
  }, []);

  const triggerListeningChallenge = async (headingIdx: number) => {
    setShowQuizModal(false);
    setListeningLoading(true);
    setShowListeningModal(true);
    setListeningQuestions([]);
    setCurrentListeningIdx(0);
    setListeningAnswers([]);
    setListeningResult(null);

    const contextBlocks = blocks ? blocks.slice(Math.max(0, headingIdx - 8), headingIdx) : [];
    const contextText = contextBlocks.map(b => b.text).join("\n\n");

    try {
      const res = await fetch("/api/generate-listening-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: contextText, title, author })
      });
      const data = await res.json();
      if (res.ok && data.questions) {
        setListeningQuestions(data.questions);
      } else {
        setShowListeningModal(false);
      }
    } catch (e) {
      setShowListeningModal(false);
    } finally {
      setListeningLoading(false);
    }
  };

  const playListeningAudio = async (text: string) => {
    const provider = prefs?.reading?.tts_provider || "browser";
    if (provider === "groq") {
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text })
        });
        if (res.ok) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audio.onended = () => URL.revokeObjectURL(url);
          await audio.play();
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  };

  const submitListeningAnswer = async () => {
    if (!recordingTranscript.trim()) return;
    
    const newAnswers = [...listeningAnswers, {
      question: listeningQuestions[currentListeningIdx].question,
      expected_answer: listeningQuestions[currentListeningIdx].expected_answer,
      user_transcript: recordingTranscript.trim()
    }];
    setListeningAnswers(newAnswers);
    setRecordingTranscript("");
    
    if (currentListeningIdx < listeningQuestions.length - 1) {
      setCurrentListeningIdx(c => c + 1);
    } else {
      // Evaluate
      setListeningLoading(true);
      try {
        const res = await fetch("/api/evaluate-listening", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: newAnswers, textId, chapter: 1 })
        });
        const data = await res.json();
        if (res.ok) {
          setListeningResult(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setListeningLoading(false);
      }
    }
  };

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
                  <div key={index} id={`block-${index}`} className="flex gap-4 group" data-block-idx={index}>
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
                <div key={idx} id={`block-${idx}`} className="flex gap-4 group">
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
      <div className={`fixed inset-x-0 bottom-0 h-[85vh] rounded-t-3xl md:absolute md:inset-auto md:top-0 md:right-0 md:w-[400px] md:h-full md:rounded-none bg-background backdrop-blur-3xl md:border-l border-t md:border-t-0 border-border transform transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-[0_-10px_50px_rgba(0,0,0,0.5)] md:shadow-[0_0_50px_rgba(0,0,0,0.5)] z-50 ${activeSidebar ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 md:translate-x-full'}`}>
        {activeSidebar === "lookup" && (
          <WordLookupSidebar 
            word={selectedWord} 
            contextSentence={contextSentence}
            title={title}
            author={author}
            textId={textId}
            positionOffset={positionOffset}
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
                        onClick={handleCloseQuiz}
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
              <div className="flex flex-col border-t border-border">
                {prefs?.reading?.enable_listening_challenge !== false && (
                  <button onClick={() => triggerListeningChallenge(lastQuizHeadingIdx)} className="p-4 text-sm text-foreground hover:bg-muted font-medium flex items-center justify-center gap-2 border-b border-border">
                    <Headphones className="w-4 h-4 text-brand" /> Atau ikuti Listening Challenge (Lisan)
                  </button>
                )}
                <button onClick={handleCloseQuiz} className="p-4 text-sm text-muted-foreground hover:text-foreground underline bg-muted/30 text-center">
                  Lewati Kuis (Skip)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Listening Modal Overlay */}
      {showListeningModal && (
        <div className="absolute inset-0 z-[100] bg-background/80 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="bg-card border border-border shadow-2xl rounded-3xl max-w-lg w-full overflow-hidden">
            <div className="bg-brand p-6 text-white text-center relative overflow-hidden">
              <Headphones className="w-24 h-24 absolute -right-4 -top-4 opacity-20" />
              <h3 className="text-2xl font-bold font-serif relative z-10">Listening Challenge</h3>
              <p className="text-brand-100 mt-1 relative z-10 text-sm">Dengarkan pertanyaan dan jawab secara lisan.</p>
            </div>
            
            <div className="p-8">
              {listeningLoading && !listeningResult ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="w-10 h-10 animate-spin text-brand mb-4" />
                  <p className="text-muted-foreground animate-pulse">{listeningAnswers.length === listeningQuestions.length ? "Mengevaluasi jawaban..." : "Menyiapkan audio..."}</p>
                </div>
              ) : listeningResult ? (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <p className="text-5xl font-bold text-brand">{listeningResult.score}</p>
                    <p className="text-xs uppercase text-muted-foreground font-bold">Skor Listening</p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-xl border border-border">
                    <p className="text-sm font-bold text-foreground mb-2">Feedback AI:</p>
                    <p className="text-sm text-muted-foreground">{listeningResult.feedback}</p>
                  </div>
                  <div className="space-y-4 mt-4 max-h-40 overflow-y-auto pr-2">
                    {listeningResult.evaluations?.map((ev: any, i: number) => (
                      <div key={i} className={`p-3 rounded-xl border text-sm ${ev.is_correct ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                        <p className="font-bold flex items-center gap-2">Q{ev.question_number} {ev.is_correct ? <CheckCircle2 className="w-4 h-4 text-green-500"/> : <XCircle className="w-4 h-4 text-red-500"/>}</p>
                        <p className="text-muted-foreground mt-1">{ev.feedback}</p>
                      </div>
                    ))}
                  </div>
                  <button onClick={handleCloseQuiz} className="w-full py-3 bg-brand hover:bg-brand/90 text-white rounded-xl font-bold transition-all mt-4">Selesai & Lanjutkan</button>
                </div>
              ) : listeningQuestions.length > 0 ? (
                <div className="space-y-6 text-center">
                  <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider">Pertanyaan {currentListeningIdx + 1} dari {listeningQuestions.length}</p>
                  <button onClick={() => playListeningAudio(listeningQuestions[currentListeningIdx].question)} className="mx-auto w-16 h-16 rounded-full bg-brand/10 text-brand flex items-center justify-center hover:bg-brand/20 transition-all shadow-lg border border-brand/20 animate-bounce">
                    <Volume2 className="w-8 h-8 ml-1" />
                  </button>
                  <p className="text-sm text-foreground">Klik ikon speaker untuk mendengarkan pertanyaan.</p>
                  
                  <div className="pt-6 border-t border-border">
                    <div className="min-h-16 mb-4 p-4 rounded-xl border border-border bg-muted/30 text-sm italic text-muted-foreground">
                      {recordingTranscript || "Jawaban lisan Anda akan muncul di sini..."}
                    </div>
                    
                    {!isRecording ? (
                      <button onClick={() => { setIsRecording(true); recognitionRef.current?.start(); }} className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                        <Mic className="w-5 h-5" /> Mulai Merekam Jawaban
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => { setIsRecording(false); recognitionRef.current?.stop(); }} className="flex-1 py-3 bg-muted text-foreground hover:bg-border rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                          <Square className="w-5 h-5" /> Stop
                        </button>
                        <button onClick={submitListeningAnswer} className="flex-1 py-3 bg-brand hover:bg-brand/90 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
                          <CheckCircle2 className="w-5 h-5" /> Kirim
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Gagal memuat kuis listening.</p>
                  <button onClick={() => setShowListeningModal(false)} className="px-6 py-2 mt-4 bg-muted hover:bg-muted/80 rounded-full font-medium">Batal</button>
                </div>
              )}
            </div>
            
            {listeningAnswers.length < listeningQuestions.length && !listeningResult && (
              <div className="p-4 bg-muted/30 border-t border-border text-center">
                <button onClick={handleCloseQuiz} className="text-sm text-muted-foreground hover:text-foreground underline">Keluar</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Writing Prompt Overlay */}
      {showWritingPrompt && (
        <div className="absolute inset-0 z-[100] bg-background/80 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="bg-card border border-border shadow-2xl rounded-3xl max-w-2xl w-full overflow-hidden">
            <div className="bg-blue-600 p-6 text-white text-center relative overflow-hidden">
              <BookOpen className="w-24 h-24 absolute -right-4 -top-4 opacity-20" />
              <h3 className="text-2xl font-bold font-serif relative z-10">Writing Challenge</h3>
              <p className="text-blue-100 mt-1 relative z-10 text-sm">Rangkum bab ini dalam 3-5 kalimat!</p>
            </div>
            
            <div className="p-8">
              {!writingResult ? (
                <div className="space-y-6">
                  <p className="text-muted-foreground text-sm mb-4">Gunakan kata-kata berikut yang telah Anda pelajari dari bab ini:</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {writingPromptVocab.map(word => (
                      <span key={word} className={`px-3 py-1 rounded-full text-xs font-bold border ${writingResponse.toLowerCase().includes(word.toLowerCase()) ? 'bg-green-500/20 text-green-600 border-green-500' : 'bg-muted text-muted-foreground border-border'}`}>
                        {word} {writingResponse.toLowerCase().includes(word.toLowerCase()) && '✓'}
                      </span>
                    ))}
                  </div>
                  
                  <textarea 
                    value={writingResponse}
                    onChange={(e) => setWritingResponse(e.target.value)}
                    placeholder="Contoh: The melancholy atmosphere settled over the house..."
                    className="w-full h-32 bg-background border border-border rounded-xl p-4 text-foreground focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    disabled={writingEvaluating}
                  />

                  <button 
                    onClick={async () => {
                      setWritingEvaluating(true);
                      try {
                        const res = await fetch("/api/writing-challenge/evaluate", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            textId,
                            textTitle: title,
                            prompt: "Rangkum bab ini dalam 3-5 kalimat.",
                            response: writingResponse,
                            requiredVocab: writingPromptVocab
                          })
                        });
                        const data = await res.json();
                        if (res.ok) setWritingResult(data.scores);
                      } catch (e) {
                        console.error(e);
                      } finally {
                        setWritingEvaluating(false);
                      }
                    }}
                    disabled={writingResponse.trim().length < 10 || writingEvaluating}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {writingEvaluating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Kirim Tulisan'}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-center gap-6 mb-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-500">{writingResult.grammar}</p>
                      <p className="text-xs uppercase text-muted-foreground font-bold">Grammar</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-500">{writingResult.vocabulary}</p>
                      <p className="text-xs uppercase text-muted-foreground font-bold">Vocab</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-purple-500">{writingResult.coherence}</p>
                      <p className="text-xs uppercase text-muted-foreground font-bold">Kohesi</p>
                    </div>
                  </div>
                  
                  <div className="bg-muted/30 p-4 rounded-xl border border-border">
                    <p className="text-sm font-bold text-foreground mb-2">Feedback AI:</p>
                    <p className="text-sm text-muted-foreground">{writingResult.feedback}</p>
                  </div>
                  
                  {writingResult.corrected_text && writingResult.corrected_text !== writingResponse && (
                     <div className="bg-green-500/10 p-4 rounded-xl border border-green-500/30 mt-4">
                       <p className="text-sm font-bold text-green-600 mb-2">Koreksi:</p>
                       <p className="text-sm text-foreground italic">"{writingResult.corrected_text}"</p>
                     </div>
                  )}

                  <button 
                    onClick={() => setShowWritingPrompt(false)}
                    className="w-full py-3 bg-muted hover:bg-muted/80 text-foreground rounded-xl font-bold transition-all"
                  >
                    Selesai & Lanjutkan
                  </button>
                </div>
              )}
            </div>

            {!writingEvaluating && !writingResult && (
              <div className="p-4 bg-muted/30 border-t border-border text-center">
                <button onClick={() => setShowWritingPrompt(false)} className="text-sm text-muted-foreground hover:text-foreground underline">
                  Lewati Tantangan
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
