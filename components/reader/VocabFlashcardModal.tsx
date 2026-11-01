"use client";

import Markdown from "@/components/ui/Markdown";
import { useState, useEffect } from "react";
import { BrainCircuit, X, Loader2, Save, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";
import Swal from "sweetalert2";

interface PreviewVocab {
  word: string;
  definition: string;
  example: string;
}

interface VocabFlashcardModalProps {
  textContext: string;
  textId: string; // Used for saving to DB
  onClose: () => void;
}

export default function VocabFlashcardModal({ textContext, textId, onClose }: VocabFlashcardModalProps) {
  const [loading, setLoading] = useState(true);
  const [vocabList, setVocabList] = useState<PreviewVocab[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
  const [savingWord, setSavingWord] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVocab() {
      try {
        const res = await fetch("/api/analyze-text/vocab-raw", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: textContext, maxWords: 10 }),
        });
        const data = await res.json();
        if (data.vocab && data.vocab.length > 0) {
          setVocabList(data.vocab);
        } else {
          Swal.fire("Gagal", "Tidak dapat mengekstrak kosa kata dari bab ini.", "error");
          onClose();
        }
      } catch (e) {
        console.error(e);
        Swal.fire("Gagal", "Terjadi kesalahan server.", "error");
        onClose();
      } finally {
        setLoading(false);
      }
    }
    fetchVocab();
  }, [textContext, onClose]);

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
          textId: textId, // Usually the gutenberg ID
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
        text: "Anda sudah meninjau semua kosa kata kunci di bab ini.",
        icon: "success",
        confirmButtonText: "Kembali Membaca",
        confirmButtonColor: "#3ECF8E"
      }).then(() => {
        onClose();
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
      <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
        <Loader2 className="w-12 h-12 animate-spin text-brand mb-6" />
        <h2 className="text-2xl font-serif font-bold animate-pulse text-foreground text-center px-4">Extracting Chapter Vocabulary...</h2>
        <p className="text-muted-foreground mt-2 text-center max-w-md px-4">
          AI sedang menganalisis bagian buku ini untuk menemukan kata-kata penting secara on-demand.
        </p>
      </div>
    );
  }

  if (vocabList.length === 0) return null;

  const currentWord = vocabList[cardIndex];
  const isSaved = savedWords.has(currentWord.word);

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300">
      
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 p-2 bg-muted text-muted-foreground hover:bg-brand-hover hover:text-white rounded-full transition-colors z-10"
        title="Tutup & Kembali Membaca"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="text-center mb-6 mt-10">
        <div className="w-12 h-12 bg-brand/10 text-brand rounded-full flex items-center justify-center mx-auto mb-4">
          <BrainCircuit className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-foreground mb-1">Chapter Vocabulary</h2>
        <p className="text-sm font-bold text-muted-foreground tracking-widest uppercase mb-4">Pre-Learn Flashcard</p>
        <p className="text-foreground font-medium">Kata {cardIndex + 1} dari {vocabList.length}</p>
        <div className="flex gap-1 justify-center mt-3 max-w-xs mx-auto flex-wrap">
          {vocabList.map((_, i) => (
            <div key={i} className={`h-1.5 w-4 sm:w-6 rounded-full ${i === cardIndex ? 'bg-brand' : i < cardIndex ? 'bg-brand/30' : 'bg-muted'}`} />
          ))}
        </div>
      </div>

      <div 
        className="w-full max-w-xl aspect-[3/2] [perspective:1000px] cursor-pointer group"
        onClick={() => setShowAnswer(!showAnswer)}
      >
        <div className={`relative w-full h-full transition-all duration-500 [transform-style:preserve-3d] ${showAnswer ? "[transform:rotateY(180deg)]" : ""}`}>
          
          {/* Front */}
          <div className="absolute inset-0 [backface-visibility:hidden] bg-card border border-border shadow-2xl rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center text-center">
            <h2 className="text-4xl sm:text-5xl font-serif font-bold text-foreground mb-6">{currentWord.word}</h2>
            <p className="text-muted-foreground flex items-center gap-2 text-sm"><BrainCircuit className="w-4 h-4" /> Klik untuk melihat arti</p>
          </div>

          {/* Back */}
          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-card border-2 border-brand/50 rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center text-center">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-3 sm:mb-4">{currentWord.word}</h2>
            <div className="text-lg sm:text-xl text-brand font-medium mb-4 sm:mb-6"><Markdown>{currentWord.definition}</Markdown></div>
            <div className="bg-muted/50 p-3 sm:p-4 rounded-xl text-sm italic text-muted-foreground border-l-4 border-l-brand w-full">
              "{currentWord.example}"
            </div>

            <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
              <button 
                onClick={(e) => { e.stopPropagation(); handleSaveToVocab(currentWord); }}
                disabled={isSaved || savingWord === currentWord.word}
                className={`p-2 rounded-full border transition-all flex items-center gap-2 text-xs font-bold px-3 sm:px-4 ${isSaved ? 'bg-brand-tint border-brand/30 text-brand-ink' : 'bg-background border-border hover:bg-muted text-muted-foreground'}`}
              >
                {savingWord === currentWord.word ? <Loader2 className="w-4 h-4 animate-spin" /> : isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                <span className="hidden sm:inline">{isSaved ? "Tersimpan" : "Save to Vocab Bank"}</span>
                <span className="sm:hidden">{isSaved ? "Saved" : "Save"}</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 mt-8 w-full max-w-xl">
        <button 
          onClick={handlePrevCard}
          disabled={cardIndex === 0}
          className="p-3 sm:p-4 rounded-2xl bg-card border border-border text-foreground hover:bg-muted disabled:opacity-50 transition-all flex-1 flex justify-center"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <button 
          onClick={handleNextCard}
          className="p-3 sm:p-4 rounded-2xl bg-brand text-background shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-95 transition-all flex-[2] flex items-center justify-center gap-2 font-bold text-base sm:text-lg"
        >
          {cardIndex === vocabList.length - 1 ? "Selesai" : "Selanjutnya"} <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

    </div>
  );
}
