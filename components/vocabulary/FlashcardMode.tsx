"use client";

import { useState } from "react";
import { VocabItem } from "./VocabularyBankClient";
import { X, RotateCw, CheckCircle2, XCircle, BrainCircuit } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface FlashcardModeProps {
  vocab: VocabItem[];
  onExit: () => void;
}

export default function FlashcardMode({ vocab, onExit }: FlashcardModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [finished, setFinished] = useState(false);

  // In a real SM-2 system, we would filter by next_review_at. 
  // For this prototype, we just shuffle or take all.
  const cards = vocab;

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <p className="text-xl text-muted-foreground mb-4">Tidak ada kartu untuk dipelajari.</p>
        <button onClick={onExit} className="px-6 py-2 bg-brand text-background rounded-full font-bold">Kembali</button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center animate-in fade-in duration-1000">
        <div className="bg-brand/10 p-6 rounded-full mb-6">
          <CheckCircle2 className="w-16 h-16 text-brand" />
        </div>
        <h2 className="text-3xl font-serif font-bold text-foreground mb-4">Selesai untuk Hari Ini!</h2>
        <p className="text-muted-foreground mb-8 max-w-md">Anda telah mereview {cards.length} kata hari ini. Otak Anda sedang memperkuat ingatan tersebut.</p>
        <button onClick={onExit} className="px-6 py-3 bg-brand text-background rounded-xl font-bold hover:shadow-lg transition-all">
          Kembali ke Kamus
        </button>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  const handleResponse = async (remembered: boolean) => {
    if (updating) return;
    setUpdating(true);
    
    try {
      // Optimistic update
      const masteryChange = remembered ? 1 : (currentCard.mastery_level > 0 ? -1 : 0);
      const newMastery = Math.min(5, Math.max(0, currentCard.mastery_level + masteryChange));
      
      await fetch(`/api/vocabulary/${currentCard.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mastery_level: newMastery })
      });
      
      // Update local state if needed (mutating parent state might require a callback, but for now we just proceed)
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(c => c + 1);
        setShowAnswer(false);
      } else {
        setFinished(true);
      }
    } catch (e) {
      console.error(e);
      alert("Gagal menyimpan progress.");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full animate-in fade-in zoom-in-95 duration-500">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-brand" /> Mode Flashcard
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Kartu {currentIndex + 1} dari {cards.length}</p>
        </div>
        <button onClick={onExit} className="p-2 bg-muted hover:bg-muted/80 rounded-full transition-colors text-muted-foreground">
          <X className="w-5 h-5" />
        </button>
      </header>

      <div className="w-full bg-muted rounded-full h-2 mb-8 overflow-hidden">
        <div className="bg-brand h-full transition-all duration-500" style={{ width: \`\${(currentIndex / cards.length) * 100}%\` }}></div>
      </div>

      <div className="perspective-1000 w-full min-h-[400px] relative">
        <div className={\`w-full h-full transition-all duration-700 transform-style-3d \${showAnswer ? 'rotate-y-180' : ''}\`}>
          
          {/* Front (Word) */}
          <div className={\`absolute inset-0 bg-card border-2 border-border shadow-xl rounded-3xl p-10 flex flex-col justify-center items-center text-center backface-hidden \${showAnswer ? 'invisible' : 'visible'}\`}>
            <h2 className="text-5xl font-serif font-bold text-foreground capitalize mb-8">{currentCard.word}</h2>
            {currentCard.context_sentence && (
              <div className="bg-muted/50 p-6 rounded-xl text-left border-l-4 border-brand max-w-md w-full opacity-80">
                <p className="text-sm italic font-serif leading-relaxed text-foreground/80">"{currentCard.context_sentence}"</p>
                {currentCard.context_source && <p className="text-xs text-muted-foreground mt-3 font-bold uppercase tracking-wider">— {currentCard.context_source}</p>}
              </div>
            )}
            
            <button 
              onClick={() => setShowAnswer(true)}
              className="mt-12 px-8 py-4 bg-brand text-background rounded-full font-bold shadow-md hover:scale-105 transition-all flex items-center gap-2 text-lg"
            >
              <RotateCw className="w-5 h-5" /> Tampilkan Jawaban
            </button>
          </div>

          {/* Back (Definition) */}
          <div className={\`absolute inset-0 bg-card border-2 border-brand/30 shadow-2xl shadow-brand/10 rounded-3xl p-8 flex flex-col justify-between backface-hidden transform rotate-y-180 \${showAnswer ? 'visible' : 'invisible'}\`}>
            <div className="overflow-y-auto max-h-[250px] prose prose-sm dark:prose-invert prose-brand flex-1 flex flex-col items-center justify-center text-center mx-auto w-full">
              <h2 className="text-4xl font-serif font-bold text-brand capitalize mb-6">{currentCard.word}</h2>
              <ReactMarkdown>{currentCard.definition || ""}</ReactMarkdown>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-border w-full">
              <button 
                disabled={updating}
                onClick={() => handleResponse(false)}
                className="py-4 flex flex-col items-center justify-center gap-2 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 rounded-2xl hover:bg-red-500/20 transition-all active:scale-95"
              >
                <XCircle className="w-8 h-8" />
                <span className="font-bold text-lg">Lupa</span>
              </button>
              <button 
                disabled={updating}
                onClick={() => handleResponse(true)}
                className="py-4 flex flex-col items-center justify-center gap-2 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/30 rounded-2xl hover:bg-green-500/20 transition-all active:scale-95"
              >
                <CheckCircle2 className="w-8 h-8" />
                <span className="font-bold text-lg">Ingat</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
