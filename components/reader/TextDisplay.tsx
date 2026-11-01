"use client";

import Markdown from "@/components/ui/Markdown";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { MessageSquareQuote, Clock, Keyboard, BrainCircuit, Loader2, CheckCircle2, XCircle, BookOpen, Mic, Square, Play, Headphones, Wand2, X, ChevronLeft, ChevronRight, Volume2 } from "lucide-react";
import WordLookupSidebar from "./WordLookupSidebar";
import ResponsivePanel from "@/components/ui/ResponsivePanel";
import ReadingCompanionSidebar from "./ReadingCompanionSidebar";
import { createClient } from "@/utils/supabase/client";
import CulturalTextRenderer, { CulturalReference, type IdiomMark } from "./CulturalTextRenderer";
import ReaderBlock, { type ReaderUnit } from "./ReaderBlock";
import InteractiveParagraph from "./InteractiveParagraph";
import MagicWandButton from "./MagicWandButton";
import ToneAnalysis from "@/components/tone/ToneAnalysis";
import { paginate, pageOfBlock, chapterMarks } from "@/lib/reader-pages";
import { beginnerModeLevel } from "@/lib/cefr";
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
  /** Dipanggil (debounce) saat blok teratas yang terlihat berubah */
  onPositionChange?: (blockIndex: number) => void;
  /** Minta reader melompat ke blok tertentu; ganti `nonce` untuk lompatan berulang ke blok yang sama */
  jumpTo?: { block: number; nonce: number } | null;
}

const POSITION_KEY = (textId: string) => `reader-pos:${textId}`;

// Kalimat yang memuat kata terpilih, untuk disimpan sebagai konteks kosa kata (F-03)
function sentenceAround(paragraph: string, word: string) {
  const sentences = paragraph.split(/(?<=[.!?]["'”’]?)\s+/);
  const lower = word.toLowerCase();
  return (sentences.find((sentence) => sentence.toLowerCase().includes(lower)) || paragraph).trim().slice(0, 500);
}

export default function TextDisplay({ textId, title, author, content, blocks, onTextSelect, onPositionChange, jumpTo }: TextDisplayProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [contextSentence, setContextSentence] = useState<string | null>(null);
  const [positionOffset, setPositionOffset] = useState<number | null>(null);
  const [activeSidebar, setActiveSidebar] = useState<"lookup" | null>(null);
  const closeLookup = useCallback(() => {
    setActiveSidebar(null);
    window.getSelection()?.removeAllRanges();
  }, []);
  const [showCompanion, setShowCompanion] = useState(false);
  const [culturalRefs, setCulturalRefs] = useState<CulturalReference[]>([]);
  const [prefs, setPrefs] = useState<any>(null);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Inspect Mode State
  const [isInspectMode, setIsInspectMode] = useState(false);
  const [inspectedSentence, setInspectedSentence] = useState<string | null>(null);
  const [inspectModalSpeechActive, setInspectModalSpeechActive] = useState(false);

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

  // Satu daftar unit untuk teks Library (string) maupun buku Gutenberg (blok)
  const units: ReaderUnit[] = useMemo(
    () => blocks ?? (content ? content.split("\n").filter((p) => p.trim() !== "").map((text) => ({ type: "paragraph" as const, text })) : []),
    [blocks, content]
  );
  const pages = useMemo(() => paginate(units), [units]);
  const chapters = useMemo(() => chapterMarks(units, pages), [units, pages]);
  const [pageIndex, setPageIndex] = useState(0);
  const [remoteBlock, setRemoteBlock] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentBlockRef = useRef(0);
  const pendingScrollBlock = useRef<number | null>(null);
  const restoredRef = useRef(false);
  const page = pages[Math.min(pageIndex, pages.length - 1)];

  // Penanda idiom (Fase 14f): satu panggilan /api/detect-idioms per halaman (bukan per paragraf), hasil di-cache per halaman.
  // Daftar idiom per blok dikirim sebagai prop ke ReaderBlock (memo) sehingga blok lain tidak ikut di-render ulang.
  const [idiomsByBlock, setIdiomsByBlock] = useState<Record<number, IdiomMark[]>>({});
  const idiomCache = useRef<Map<number, Record<number, IdiomMark[]>>>(new Map());
  const highlightIdioms = prefs?.reading?.highlight_idioms !== false;
  useEffect(() => {
    if (!highlightIdioms || !page) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mematikan penanda saat preferensi dimatikan
      setIdiomsByBlock({});
      return;
    }
    const cached = idiomCache.current.get(pageIndex);
    if (cached) {
      setIdiomsByBlock(cached);
      return;
    }
    // Gabungkan blok halaman dengan pemisah tetap; offset tiap blok dipakai untuk memetakan hasil kembali ke blok
    const SEP = "\n\n";
    const offsets: { block: number; start: number; end: number }[] = [];
    let text = "";
    for (let i = page.start; i < page.end; i++) {
      const t = units[i]?.text ?? "";
      offsets.push({ block: i, start: text.length, end: text.length + t.length });
      text += t + SEP;
    }
    if (!text.trim() || text.length > 20000) return;
    let cancelled = false;
    fetch("/api/detect-idioms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data || !Array.isArray(data.idioms)) return;
        const byBlock: Record<number, IdiomMark[]> = {};
        for (const m of data.idioms as (IdiomMark & { length: number })[]) {
          const o = offsets.find((x) => m.index >= x.start && m.index + m.length <= x.end);
          if (!o) continue; // idiom yang melintasi batas blok diabaikan
          (byBlock[o.block] ||= []).push({ ...m, index: m.index - o.start });
        }
        idiomCache.current.set(pageIndex, byBlock);
        setIdiomsByBlock(byBlock);
      })
      .catch(() => {
        // fitur tambahan: abaikan jika gagal (teks tetap terbaca tanpa penanda)
      });
    return () => {
      cancelled = true;
    };
  }, [pageIndex, page, units, highlightIdioms]);

  const scrollToPendingBlock = useCallback((smooth: boolean) => {
    const target = pendingScrollBlock.current;
    if (target === null) return;
    const el = document.getElementById(`block-${target}`);
    if (el) {
      el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
      pendingScrollBlock.current = null;
    }
  }, []);

  const goToBlock = useCallback((blockIndex: number, smooth = false) => {
    const target = Math.max(0, Math.min(blockIndex, Math.max(units.length - 1, 0)));
    pendingScrollBlock.current = target;
    setPageIndex(pageOfBlock(pages, target));
    // Jika halamannya sama, efek pageIndex tidak jalan; gulir setelah frame berikutnya
    requestAnimationFrame(() => scrollToPendingBlock(smooth));
  }, [pages, units.length, scrollToPendingBlock]);

  const goToPage = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(next, pages.length - 1));
    pendingScrollBlock.current = null;
    setPageIndex(clamped);
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pages.length]);

  // Setelah halaman berganti, gulir ke blok yang diminta (jika ada)
  useEffect(() => {
    scrollToPendingBlock(false);
  }, [pageIndex, scrollToPendingBlock]);

  // Lompatan dari luar (bookmark, dsb.)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- posisi dari URL/localStorage hanya tersedia di browser setelah mount
    if (jumpTo) goToBlock(jumpTo.block, true);
  }, [jumpTo, goToBlock]);

  // Pulihkan posisi: #block-N (dari review kosa kata) > localStorage > database (di initData)
  useEffect(() => {
    if (restoredRef.current || units.length === 0) return;
    restoredRef.current = true;
    const hash = window.location.hash.match(/^#block-(\d+)$/);
    if (hash) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- posisi dari URL/localStorage hanya tersedia di browser setelah mount
      goToBlock(Number(hash[1]));
      return;
    }
    try {
      const saved = Number(localStorage.getItem(POSITION_KEY(textId)));
      if (saved > 0) goToBlock(saved);
    } catch {
      // localStorage tidak tersedia
    }
  }, [units.length, textId, goToBlock]);

  useEffect(() => {
    if (remoteBlock !== null && currentBlockRef.current === 0) goToBlock(remoteBlock);
  }, [remoteBlock, goToBlock]);

  // #block-N yang berubah tanpa memuat ulang halaman
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.match(/^#block-(\d+)$/);
      if (hash) goToBlock(Number(hash[1]), true);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [goToBlock]);

  // Lacak blok teratas yang terlihat (hanya blok di halaman ini, jadi murah)
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const top = scroller.getBoundingClientRect().top + 80;
        const els = scroller.querySelectorAll<HTMLElement>("[id^='block-']");
        let current = page?.start ?? 0;
        for (const el of els) {
          if (el.getBoundingClientRect().bottom > top) {
            current = Number(el.id.slice(6));
            break;
          }
        }
        currentBlockRef.current = current;
        try {
          localStorage.setItem(POSITION_KEY(textId), String(current));
        } catch {
          // abaikan
        }
        onPositionChange?.(current);
      }, 300);
    };
    update();
    scroller.addEventListener("scroll", update, { passive: true });
    return () => {
      clearTimeout(timer);
      scroller.removeEventListener("scroll", update);
    };
  }, [page, textId, onPositionChange]);

  // Nilai terbaru untuk heartbeat tanpa memasang ulang interval
  const unitCountRef = useRef(0);
  const titleRef = useRef(title);
  const authorRef = useRef(author);
  useEffect(() => {
    unitCountRef.current = units.length;
    titleRef.current = title;
    authorRef.current = author;
  }, [units.length, title, author]);

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
        const { data: profile } = await supabase.from("profiles").select("preferences, cefr_level").eq("id", authRes.data.user.id).single();
        if (profile?.preferences) {
          setPrefs(profile.preferences);
        }
        // Beginner Mode default = satu level di bawah level pengguna (minimal A2)
        if (profile?.cefr_level) setBeginnerLevel(beginnerModeLevel(profile.cefr_level));

        // Posisi dari perangkat lain (F-02), dipakai jika perangkat ini belum punya posisi
        let hasLocal = false;
        try {
          hasLocal = Number(localStorage.getItem(POSITION_KEY(textId))) > 0;
        } catch {
          // abaikan
        }
        if (!hasLocal && !window.location.hash) {
          const isGutenberg = textId.startsWith("gutenberg_");
          const { data: session, error } = await supabase
            .from("reading_sessions")
            .select("last_paragraph_index")
            .eq("user_id", authRes.data.user.id)
            .eq(isGutenberg ? "source_key" : "text_id", textId)
            .order("last_active_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (!error && session?.last_paragraph_index) {
            setRemoteBlock(session.last_paragraph_index);
          }
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
            time_spent_seconds: intervalSeconds,
            block_index: currentBlockRef.current,
            total_blocks: unitCountRef.current,
            title: titleRef.current,
            author: authorRef.current,
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

      // Konteks: kalimat yang memuat kata, diambil dari teks blok (bukan hanya node terdekat)
      const anchorNode = selection.anchorNode;
      const blockEl = anchorNode?.parentElement?.closest("[data-block-idx]");
      const sentence = sentenceAround(blockEl?.textContent || anchorNode?.parentElement?.textContent || text, text);

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
    setShowListeningModal(false);
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

  // Jawaban kuis bab dicatat sebagai bukti keterampilan membaca (level teks diambil server dari texts.cefr_level)
  const answerQuiz = (index: number, correct: boolean) => {
    setQuizAnswered(index);
    if (!textId) return;
    fetch("/api/reading/quiz-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ textId, correct }),
    }).catch(() => {
      // pencatatan bukti bersifat tambahan; abaikan jika gagal
    });
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

  let themeClass = readPrefs.theme === "dark" ? "bg-[#17150f] text-[#ede6d6]" :
                   readPrefs.theme === "sepia" ? "bg-[#f4ecd8] text-[#43352a]" : 
                   "bg-paper text-ink"; // Terang: kertas hangat (DESIGN.md §3.3); mengikuti tema gelap global lewat token

  if (displayPrefs.high_contrast) {
    if (readPrefs.theme === "dark") {
      themeClass = "bg-[#000000] text-[#FFFF00] font-bold"; // Black bg, yellow text is highest contrast for low-vision
    } else {
      themeClass = "bg-[#FFFFFF] text-[#000000] font-bold"; // Pure white bg, pure black text
    }
  }

  const wordCount = useMemo(() => units.reduce((acc, unit) => acc + unit.text.split(/\s+/).length, 0), [units]);

  const readingTimeMinutes = Math.ceil(wordCount / 200);

  const customStyle = {
    ...dyslexicStyle,
    fontSize: readPrefs.font_size ? `${readPrefs.font_size}px` : undefined,
    lineHeight: readPrefs.line_height ? readPrefs.line_height : undefined,
  };

  const handleSentenceInspect = useCallback((sentence: string) => {
    setInspectedSentence(sentence);
  }, []);

  // Callback stabil untuk ReaderBlock (memo) agar blok lain tidak ikut di-render ulang
  const toggleSpeechRef = useRef(toggleSpeech);
  useEffect(() => {
    toggleSpeechRef.current = toggleSpeech;
  });
  const handleToggleSpeech = useCallback((text: string, index: number) => toggleSpeechRef.current(text, index), []);
  const handleToggleSyntax = useCallback((index: number) => setActiveSyntaxIndex((cur) => (cur === index ? null : index)), []);

  const playInspectAudio = async (text: string) => {
    const provider = prefs?.reading?.tts_provider || "browser";
    setInspectModalSpeechActive(true);
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
          audio.onended = () => {
            URL.revokeObjectURL(url);
            setInspectModalSpeechActive(false);
          };
          await audio.play();
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    // Fallback or Browser provider
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.onend = () => setInspectModalSpeechActive(false);
    utterance.onerror = () => setInspectModalSpeechActive(false);
    window.speechSynthesis.speak(utterance);
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
        ref={scrollRef}
        className={`flex-1 overflow-y-auto overscroll-contain relative ${activeSidebar ? 'lg:pr-[400px]' : ''}`}
        onMouseUp={() => onTextSelect?.()}
        onTouchEnd={() => onTextSelect?.()}
      >
        {/* Header baca: latar solid (tanpa blur) agar ringan saat menggulir di HP */}
        <div className="sticky top-0 bg-background z-30 px-3 md:px-4 py-2 border-b border-border flex justify-between items-center gap-2">
          <div className="flex-1 min-w-0 truncate flex items-center gap-3 md:gap-4 text-sm text-muted-foreground font-medium">
            {pages.length > 1 && (
              <span className="shrink-0 tabular-nums">Hal {pageIndex + 1}/{pages.length}</span>
            )}
            {chapters.length > 1 && (
              <select
                aria-label="Lompat ke bab"
                value={[...chapters].reverse().find((c) => c.page <= pageIndex)?.index ?? ""}
                onChange={(e) => goToBlock(Number(e.target.value))}
                className="min-w-0 max-w-[45vw] md:max-w-xs min-h-[44px] bg-muted border border-border rounded-control px-2 py-1.5 text-sm text-foreground truncate"
              >
                <option value="" disabled>Bab…</option>
                {chapters.map((c) => (
                  <option key={c.index} value={c.index}>{c.title}</option>
                ))}
              </select>
            )}
            {displayPrefs.show_reading_time !== false && (
              <span className="hidden sm:flex items-center gap-1 shrink-0"><Clock className="w-4 h-4" /> Est: {readingTimeMinutes} mnt</span>
            )}
            {displayPrefs.keyboard_shortcuts !== false && (
              <span className="hidden md:flex items-center gap-1 opacity-50"><Keyboard className="w-4 h-4" /> Ctrl+1: AI, Esc: Tutup</span>
            )}
          </div>
          <button 
            onClick={() => setShowCompanion(true)} 
            className="shrink-0 min-h-[44px] px-4 py-2 bg-brand-solid hover:bg-brand-hover text-on-brand rounded-full font-medium flex items-center gap-2 text-sm"
          >
            <MessageSquareQuote className="w-4 h-4" />
            <span className="hidden md:inline">Ask AI Companion</span>
            <span className="md:hidden">AI</span>
          </button>
        </div>

        {pages.length > 1 && (
          <div className="sticky top-[53px] z-20 h-[3px] bg-rule" aria-hidden="true">
            <div className="h-full bg-brand" style={{ width: `${((pageIndex + 1) / pages.length) * 100}%` }} />
          </div>
        )}

        {/* Global Controls for Beginner Mode */}
        <div className="bg-muted/30 border-b border-border px-4 md:px-6 py-2 md:py-3 flex flex-wrap items-center justify-center gap-3 md:gap-4 text-sm z-10 relative">
          <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
            <input type="checkbox" checked={isBeginnerMode} onChange={e => setIsBeginnerMode(e.target.checked)} className="w-4 h-4 accent-brand" />
            <span className="font-bold">Beginner Mode</span>
          </label>
          
          {isBeginnerMode && (
            <div className="flex items-center gap-4 animate-in fade-in slide-in-from-left-4">
              <select value={beginnerLevel} onChange={e => setBeginnerLevel(e.target.value)} className="bg-card border border-border rounded-control px-2 py-1 min-h-[44px] text-sm focus:outline-none focus:border-brand-solid">
                <option value="A2">Level A2 (Dasar)</option>
                <option value="B1">Level B1 (Menengah)</option>
                <option value="B2">Level B2 (Menengah atas)</option>
              </select>
              <select value={beginnerLayout} onChange={e => setBeginnerLayout(e.target.value as any)} className="bg-card border border-border rounded-control px-2 py-1 min-h-[44px] text-sm focus:outline-none focus:border-brand-solid">
                <option value="inline">Ganti Teks (Inline)</option>
                <option value="below">Berdampingan (Bawah)</option>
                <option value="split">Layar Belah (Split)</option>
              </select>
            </div>
          )}
        </div>

        {/* Legend Bedah Sintaksis */}
        {activeSyntaxIndex !== null && (
          <div className="bg-muted border-b border-border px-6 py-2 flex flex-wrap items-center justify-center gap-6 text-sm z-20 relative animate-in fade-in slide-in-from-top-2">
            <span className="font-bold flex items-center gap-2"><Search className="w-4 h-4 text-brand-ink" /> Legenda Sintaksis:</span>
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-muted border border-border rounded-sm"></span> Subjek</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-danger-tint border border-danger/30 rounded-sm"></span> Verba / Predikat</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-warning-tint border border-warning-ink/30 rounded-sm"></span> Objek</div>
          </div>
        )}

        <div className={`${widthClass} mx-auto px-4 md:px-8 py-8 md:py-12`}>
          {pageIndex === 0 && (
          <header className="mb-8 md:mb-12 text-center">
            <h1 className={`text-[28px] md:text-4xl font-medium leading-[1.15] mb-4 ${readPrefs.font_family === "sans-serif" ? "font-sans font-bold" : "font-serif"}`} style={dyslexicStyle.fontFamily ? { fontFamily: dyslexicStyle.fontFamily } : undefined}>{title}</h1>
            <p className="text-lg md:text-xl italic opacity-80">by {author}</p>
          </header>
          )}

          <div 
            ref={contentRef}
            className={`prose-literature ${fontClass}`}
            style={customStyle}
            role={displayPrefs.screen_reader ? "article" : undefined}
            aria-label={displayPrefs.screen_reader ? `Buku: ${title} oleh ${author}` : undefined}
          >
            {units.slice(page.start, page.end).map((block, offset) => {
              const index = page.start + offset;
              return (
                <ReaderBlock
                  key={index}
                  index={index}
                  block={block}
                  culturalRefs={culturalRefs}
                  idioms={idiomsByBlock[index]}
                  isBeginnerMode={isBeginnerMode}
                  beginnerLevel={beginnerLevel}
                  beginnerLayout={beginnerLayout}
                  isInspectMode={isInspectMode}
                  showSyntax={activeSyntaxIndex === index}
                  speaking={speakingIndex === index}
                  ttsEnabled={readPrefs.tts_enabled !== false}
                  lineNumbers={!!readPrefs.line_numbers}
                  screenReader={!!displayPrefs.screen_reader}
                  onInspect={handleSentenceInspect}
                  onToggleSpeech={handleToggleSpeech}
                  onToggleSyntax={handleToggleSyntax}
                />
              );
            })}
          </div>

          {pages.length > 1 && (
            <nav aria-label="Navigasi halaman" className="mt-10 mb-24 lg:mb-8 flex items-center justify-between gap-3 font-sans not-prose">
              <button
                onClick={() => goToPage(pageIndex - 1)}
                disabled={pageIndex === 0}
                className="flex-1 sm:flex-none min-h-[48px] px-4 rounded-control border border-border bg-card hover:bg-muted disabled:opacity-40 flex items-center justify-center gap-2 text-sm font-bold"
              >
                <ChevronLeft className="w-4 h-4" /> Sebelumnya
              </button>
              <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                {pageIndex + 1} / {pages.length}
              </span>
              <button
                onClick={() => goToPage(pageIndex + 1)}
                disabled={pageIndex >= pages.length - 1}
                className="flex-1 sm:flex-none min-h-[48px] px-4 rounded-control bg-brand-solid text-on-brand hover:bg-brand-hover disabled:opacity-40 flex items-center justify-center gap-2 text-sm font-bold"
              >
                Berikutnya <ChevronRight className="w-4 h-4" />
              </button>
            </nav>
          )}
        </div>
      </div>

      {/* Sidebar Area for Word Lookup: panel samping di ≥ lg, bottom sheet di HP */}
      <ResponsivePanel
        open={activeSidebar !== null}
        onClose={closeLookup}
        label="Word Lookup"
        width="400px"
        desktop="absolute"
      >
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
            onClose={closeLookup} 
          />
        )}
      </ResponsivePanel>

      {/* Quiz Modal Overlay */}
      {showQuizModal && (
        <div className="absolute inset-0 z-[100] bg-black/40 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-card border border-border shadow-[0_8px_32px_rgba(31,36,32,0.18)] rounded-card max-w-lg w-full overflow-hidden">
            <div className="bg-brand-solid p-6 text-on-brand text-center relative overflow-hidden">
              <BrainCircuit className="w-24 h-24 absolute -right-4 -top-4 opacity-20" />
              <h3 className="text-2xl font-bold font-serif relative z-10">Comprehension Checkpoint</h3>
              <p className="text-foreground mt-1 relative z-10 text-sm">Mari pastikan Anda memahami bab sebelumnya!</p>
            </div>
            
            <div className="p-4 md:p-8">
              {quizLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="w-10 h-10 animate-spin text-foreground mb-4" />
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
                        if (isCorrect) btnClass = "bg-muted border-border text-foreground ";
                        else if (isSelected) btnClass = "bg-muted border-border text-foreground ";
                        else btnClass = "bg-muted opacity-50 border-transparent";
                      }

                      return (
                        <button 
                          key={i}
                          disabled={showResult}
                          onClick={() => answerQuiz(i, quizData.correct_index === i)}
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
                      <div className="text-sm text-muted-foreground mb-4"><Markdown>{quizData.explanation}</Markdown></div>
                      <button 
                        onClick={handleCloseQuiz}
                        className="w-full py-3 bg-brand-solid hover:bg-brand-hover text-on-brand rounded-xl font-bold shadow-md transition-all active:scale-95"
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
        <div className="absolute inset-0 z-[100] bg-black/40 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-card border border-border shadow-[0_8px_32px_rgba(31,36,32,0.18)] rounded-card max-w-lg w-full overflow-hidden">
            <div className="bg-brand p-6 text-white text-center relative overflow-hidden">
              <Headphones className="w-24 h-24 absolute -right-4 -top-4 opacity-20" />
              <h3 className="text-2xl font-bold font-serif relative z-10">Listening Challenge</h3>
              <p className="text-brand-100 mt-1 relative z-10 text-sm">Dengarkan pertanyaan dan jawab secara lisan.</p>
            </div>
            
            <div className="p-4 md:p-8">
              {listeningLoading && !listeningResult ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="w-10 h-10 animate-spin text-brand mb-4" />
                  <p className="text-muted-foreground animate-pulse">{listeningAnswers.length === listeningQuestions.length ? "Mengevaluasi jawaban..." : "Menyiapkan audio..."}</p>
                </div>
              ) : listeningResult ? (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <p className="text-3xl md:text-5xl font-bold text-brand">{listeningResult.score}</p>
                    <p className="text-xs uppercase text-muted-foreground font-bold">Skor Listening</p>
                  </div>
                  <div className="bg-muted/30 p-4 rounded-xl border border-border">
                    <p className="text-sm font-bold text-foreground mb-2">Feedback AI:</p>
                    <div className="text-sm text-muted-foreground"><Markdown>{listeningResult.feedback}</Markdown></div>
                  </div>
                  <div className="space-y-4 mt-4 max-h-40 overflow-y-auto pr-2">
                    {listeningResult.evaluations?.map((ev: any, i: number) => (
                      <div key={i} className={`p-3 rounded-xl border text-sm ${ev.is_correct ? 'bg-brand-tint border-brand/30' : 'bg-danger-tint border-danger/30'}`}>
                        <p className="font-bold flex items-center gap-2">Q{ev.question_number} {ev.is_correct ? <CheckCircle2 className="w-4 h-4 text-brand-ink"/> : <XCircle className="w-4 h-4 text-danger"/>}</p>
                        <div className="text-muted-foreground mt-1"><Markdown>{ev.feedback}</Markdown></div>
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
                      <button onClick={() => { setIsRecording(true); recognitionRef.current?.start(); }} className="w-full py-3 bg-danger hover:bg-danger/90 text-on-brand rounded-xl font-bold flex items-center justify-center gap-2 transition-all">
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
        <div className="absolute inset-0 z-[100] bg-black/40 flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-card border border-border shadow-[0_8px_32px_rgba(31,36,32,0.18)] rounded-card max-w-2xl w-full overflow-hidden">
            <div className="bg-brand-solid p-6 text-on-brand text-center relative overflow-hidden">
              <BookOpen className="w-24 h-24 absolute -right-4 -top-4 opacity-20" />
              <h3 className="text-2xl font-bold font-serif relative z-10">Latihan Menulis</h3>
              <p className="text-brand-ink mt-1 relative z-10 text-sm">Rangkum bab ini dalam 3-5 kalimat!</p>
            </div>
            
            <div className="p-4 md:p-8">
              {!writingResult ? (
                <div className="space-y-6">
                  <p className="text-muted-foreground text-sm mb-4">Gunakan kata-kata berikut yang telah Anda pelajari dari bab ini:</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {writingPromptVocab.map(word => (
                      <span key={word} className={`px-3 py-1 rounded-full text-xs font-bold border ${writingResponse.toLowerCase().includes(word.toLowerCase()) ? 'bg-brand-tint text-brand-ink border-brand/30' : 'bg-muted text-muted-foreground border-border'}`}>
                        {word} {writingResponse.toLowerCase().includes(word.toLowerCase()) && '✓'}
                      </span>
                    ))}
                  </div>
                  
                  <textarea 
                    value={writingResponse}
                    onChange={(e) => setWritingResponse(e.target.value)}
                    placeholder="Contoh: The melancholy atmosphere settled over the house..."
                    className="w-full h-32 bg-background border border-border rounded-xl p-4 text-foreground focus:ring-2 focus:ring-border outline-none resize-none"
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
                    className="w-full py-3 bg-brand-solid hover:bg-brand-hover disabled:opacity-50 text-on-brand rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {writingEvaluating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Kirim Tulisan'}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-center gap-6 mb-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-brand-ink">{writingResult.grammar}</p>
                      <p className="text-xs uppercase text-muted-foreground font-bold">Grammar</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-brand-ink">{writingResult.vocabulary}</p>
                      <p className="text-xs uppercase text-muted-foreground font-bold">Vocab</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-foreground">{writingResult.coherence}</p>
                      <p className="text-xs uppercase text-muted-foreground font-bold">Kohesi</p>
                    </div>
                  </div>
                  
                  <div className="bg-muted/30 p-4 rounded-xl border border-border">
                    <p className="text-sm font-bold text-foreground mb-2">Feedback AI:</p>
                    <div className="text-sm text-muted-foreground"><Markdown>{writingResult.feedback}</Markdown></div>
                  </div>
                  
                  {writingResult.corrected_text && writingResult.corrected_text !== writingResponse && (
                     <div className="bg-brand-tint p-4 rounded-xl border border-brand/30 mt-4">
                       <p className="text-sm font-bold text-brand-ink mb-2">Koreksi:</p>
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

      {/* Tongkat Ajaib (Inspect Mode): bisa digeser, menempel ke tepi; disembunyikan saat panel Word Lookup terbuka */}
      <MagicWandButton
        active={isInspectMode}
        hidden={activeSidebar !== null}
        onToggle={() => {
          setIsInspectMode(!isInspectMode);
          if (isInspectMode) setInspectedSentence(null);
        }}
      />

      {/* Inspect Mode Bottom Sheet */}
      {isInspectMode && inspectedSentence && (
        <div className="fixed inset-x-0 bottom-0 md:inset-auto md:bottom-8 md:left-1/2 md:-translate-x-1/2 z-[100] bg-card border-t md:border border-border rounded-t-[20px] md:rounded-card shadow-[0_-8px_32px_rgba(31,36,32,0.18)] p-6 md:w-[600px] animate-in slide-in-from-bottom-8">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-brand" />
              Mode Inspeksi
            </h3>
            <button onClick={() => setInspectedSentence(null)} className="p-2 bg-muted rounded-full text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="bg-muted p-4 rounded-card mb-6">
            <p className="text-lg font-serif italic text-foreground leading-relaxed">
              "{inspectedSentence}"
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={() => playInspectAudio(inspectedSentence)}
              disabled={inspectModalSpeechActive}
              className="w-full py-3 bg-brand/10 hover:bg-brand/20 text-brand rounded-xl font-bold transition-all flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {inspectModalSpeechActive ? <Loader2 className="w-5 h-5 animate-spin" /> : <Volume2 className="w-5 h-5" />}
              {inspectModalSpeechActive ? "Memutar..." : "Read Aloud"}
            </button>

            <div className="border border-border rounded-xl p-4">
              <h4 className="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-2">
                <Search className="w-4 h-4" />
                Bedah Sintaksis
              </h4>
              <InteractiveParagraph 
                text={inspectedSentence}
                culturalRefs={culturalRefs}
                isBeginnerMode={false}
                beginnerLevel="B1"
                beginnerLayout="inline"
                showSyntax={true}
              />
            </div>

            <ToneAnalysis
              text={inspectedSentence}
              context={units.slice(page.start, page.end).find((u) => u.text.includes(inspectedSentence))?.text ?? ""}
            />
          </div>
        </div>
      )}
    </div>
  );
}
