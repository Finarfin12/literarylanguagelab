"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { BookOpen, BrainCircuit, ArrowRight, Save, CheckCircle2, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import Swal from "sweetalert2";

interface PreviewVocab {
  word: string;
  definition: string;
  example: string;
}

export default function PreviewPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [vocabList, setVocabList] = useState<PreviewVocab[]>([]);
  const [mode, setMode] = useState<"intro" | "flashcard">("intro");
  const [cardIndex, setCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
  const [savingWord, setSavingWord] = useState<string | null>(null);

  useEffect(() => {
    fetchVocab();
  }, [id]);

  const fetchVocab = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analyze-text/vocab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textId: id })
      });
      const data = await res.json();
      if (data.vocab) {
        setVocabList(data.vocab);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartReading = () => {
    router.push(`/read/${id}`);
  };

  const handleSaveToVocab = async (wordObj: PreviewVocab) => {
    if (savedWords.has(wordObj.word)) return;
    setSavingWord(wordObj.word);
    try {
      const res = await fetch("/api/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: wordObj.word,
          definition: wordObj.definition,
          contextSentence: wordObj.example,
          textId: id,
          positionOffset: null
        })
      });
      if (res.ok) {
        setSavedWords(new Set([...savedWords, wordObj.word]));
        (Swal as any).fire({
          title: "Tersimpan",
          icon: "success",
          toast: true,
          position: "bottom-end",
          showConfirmButton: false,
          timer: 1500
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingWord(null);
    }
  };

  const handleNextCard = () => {
    if (cardIndex < vocabList.length - 1) {
      setCardIndex(c => c + 1);
      setShowAnswer(false);
    } else {
      Swal.fire({
        title: "Selesai!",
        text: "Anda sudah mempelajari semua kata kunci. Siap membaca?",
        icon: "success",
        confirmButtonText: "Mulai Membaca",
        confirmButtonColor: "#3ECF8E"
      }).then((res) => {
        if (res.isConfirmed) handleStartReading();
      });
    }
  };

  const handlePrevCard = () => {
    if (cardIndex > 0) {
      setCardIndex(c => c - 1);
      setShowAnswer(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background min-h-[600px]">
        <Loader2 className="w-12 h-12 animate-spin text-brand mb-6" />
        <h2 className="text-2xl font-serif font-bold animate-pulse text-foreground">Extracting Key Vocabulary...</h2>
        <p className="text-muted-foreground mt-2 text-center max-w-md">
          AI sedang menganalisis buku untuk menemukan kata-kata penting (skema kosakata) agar Anda lebih mudah memahami bacaan.
        </p>
      </div>
    );
  }

  if (vocabList.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
        <p>Gagal mengekstraksi kosa kata.</p>
        <button onClick={handleStartReading} className="mt-4 px-6 py-2 bg-brand text-white rounded-lg font-bold">Langsung Membaca Saja</button>
      </div>
    );
  }

  if (mode === "intro") {
    return (
      <div className="flex-1 overflow-y-auto bg-background p-8 lg:p-12 animate-in fade-in zoom-in-95 duration-500">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-brand/10 text-brand rounded-full flex items-center justify-center mx-auto mb-6">
              <BrainCircuit className="w-10 h-10" />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">Vocabulary Preview</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Kami menemukan <span className="font-bold text-brand">{vocabList.length} kata kunci</span> penting dalam teks ini. Mempelajarinya sebelum membaca akan mengurangi beban kognitif dan melatih <em>schema activation</em> Anda.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
            {vocabList.map((v, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 shadow-sm text-center">
                <p className="font-bold text-lg text-foreground">{v.word}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => setMode("flashcard")}
              className="w-full sm:w-auto px-8 py-4 bg-brand text-background font-bold rounded-2xl hover:scale-105 transition-all shadow-xl shadow-brand/20 flex items-center justify-center gap-2 text-lg"
            >
              <BrainCircuit className="w-5 h-5" /> Pelajari Dulu (Pre-learn)
            </button>
            <button 
              onClick={handleStartReading}
              className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-border text-foreground font-bold rounded-2xl hover:bg-muted transition-all flex items-center justify-center gap-2 text-lg"
            >
              <BookOpen className="w-5 h-5" /> Skip & Mulai Membaca
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pre-learn Flashcard Mode
  const currentWord = vocabList[cardIndex];
  const isSaved = savedWords.has(currentWord.word);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 bg-background relative animate-in fade-in">
      <button 
        onClick={handleStartReading}
        className="absolute top-4 right-4 sm:top-8 sm:right-8 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold bg-muted text-muted-foreground rounded-full hover:bg-border transition-colors flex items-center gap-2 z-50"
      >
        Keluar ke Reader <ArrowRight className="w-4 h-4" />
      </button>

      <div className="text-center mb-6 sm:mb-8 mt-12 sm:mt-0">
        <p className="text-xs sm:text-sm font-bold text-muted-foreground tracking-widest uppercase mb-1 sm:mb-2">Pre-Learn Flashcard</p>
        <p className="text-foreground font-bold text-sm sm:text-base">Kata {cardIndex + 1} dari {vocabList.length}</p>
        <div className="flex gap-1 justify-center mt-2 sm:mt-3">
          {vocabList.map((_, i) => (
            <div key={i} className={`h-1 sm:h-1.5 w-4 sm:w-6 rounded-full ${i === cardIndex ? 'bg-brand' : i < cardIndex ? 'bg-brand/30' : 'bg-muted'}`} />
          ))}
        </div>
      </div>

      <div 
        className="w-full max-w-2xl min-h-[300px] sm:min-h-0 sm:aspect-[3/2] [perspective:1000px] cursor-pointer group"
        onClick={() => setShowAnswer(!showAnswer)}
      >
        <div className={`relative w-full h-full transition-all duration-500 [transform-style:preserve-3d] ${showAnswer ? "[transform:rotateY(180deg)]" : ""}`}>
          
          {/* Front */}
          <div className="absolute inset-0 [backface-visibility:hidden] bg-card border border-border shadow-xl rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center text-center">
            <h2 className="text-4xl sm:text-5xl font-serif font-bold text-foreground mb-4 sm:mb-6 break-all">{currentWord.word}</h2>
            <p className="text-muted-foreground flex items-center gap-2 text-xs sm:text-sm"><BrainCircuit className="w-4 h-4" /> Klik untuk melihat arti</p>
          </div>

          {/* Back */}
          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-card border-2 border-brand/50 shadow-[0_0_30px_rgba(62,207,142,0.15)] rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center text-center overflow-y-auto">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-2 sm:mb-4 pt-8 sm:pt-0">{currentWord.word}</h2>
            <p className="text-lg sm:text-xl text-brand font-medium mb-4 sm:mb-6">{currentWord.definition}</p>
            <div className="bg-muted/50 p-3 sm:p-4 rounded-xl text-xs sm:text-sm italic text-muted-foreground border-l-4 border-l-brand w-full overflow-hidden">
              "{currentWord.example}"
            </div>

            <div className="absolute top-4 sm:top-6 right-4 sm:right-6">
              <button 
                onClick={(e) => { e.stopPropagation(); handleSaveToVocab(currentWord); }}
                disabled={isSaved || savingWord === currentWord.word}
                className={`p-1.5 sm:p-2 rounded-full border transition-all flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs font-bold px-2 sm:px-4 ${isSaved ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' : 'bg-background border-border hover:bg-muted text-muted-foreground'}`}
              >
                {savingWord === currentWord.word ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /> : isSaved ? <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" /> : <Save className="w-3 h-3 sm:w-4 sm:h-4" />}
                <span className="hidden sm:inline">{isSaved ? "Tersimpan" : "Save to Vocab Bank"}</span>
                <span className="sm:hidden">{isSaved ? "Saved" : "Save"}</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      <div className="flex items-center gap-4 mt-12 w-full max-w-2xl">
        <button 
          onClick={handlePrevCard}
          disabled={cardIndex === 0}
          className="p-4 rounded-2xl bg-card border border-border text-foreground hover:bg-muted disabled:opacity-50 transition-all flex-1 flex justify-center"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button 
          onClick={handleNextCard}
          className="p-4 rounded-2xl bg-brand text-background shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all flex-[2] flex items-center justify-center gap-2 font-bold text-lg"
        >
          {cardIndex === vocabList.length - 1 ? "Selesai" : "Selanjutnya"} <ChevronRight className="w-6 h-6" />
        </button>
      </div>

    </div>
  );
}
