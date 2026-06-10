"use client";

import { useState } from "react";
import { CheckCircle2, RotateCcw, Brain, RefreshCcw, Loader2 } from "lucide-react";

interface ReviewClientProps {
  dueVocab: any[];
  learningPrefs?: any;
}

export default function ReviewClient({ dueVocab, learningPrefs }: ReviewClientProps) {
  const [items, setItems] = useState(dueVocab);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentItem = items[currentIndex];

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
        <div className="w-24 h-24 bg-brand/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-brand" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-foreground mb-2">Anda sudah hafal semua!</h2>
        <p className="text-muted-foreground mb-8">Tidak ada kata yang perlu di-review saat ini. Kembalilah besok atau tambahkan kata baru dari Library.</p>
      </div>
    );
  }

  const handleScore = async (quality: number) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vocabId: currentItem.id,
          quality,
          lastInterval: currentItem.interval || 0,
          lastRepetition: currentItem.repetition_count || 0,
          lastEaseFactor: currentItem.efactor || 2.5
        }),
      });

      if (!res.ok) throw new Error("Failed to update review status");

      // Move to next item
      if (currentIndex < items.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setShowAnswer(false);
      } else {
        // Finished all items
        setItems([]);
      }
    } catch (error) {
      alert("Error submitting review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto h-full flex flex-col">
      <div className="mb-4 flex items-center justify-between text-sm font-medium text-muted-foreground">
        <span>Kata {currentIndex + 1} dari {items.length}</span>
        <div className="flex gap-1">
          {items.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 w-6 rounded-full ${idx < currentIndex ? 'bg-brand' : idx === currentIndex ? 'bg-brand/50' : 'bg-border'}`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 bg-card shadow-sm backdrop-blur-xl border border-border rounded-3xl shadow-2xl flex flex-col items-center justify-center p-8 md:p-12 text-center transition-all relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-50" />
        <div className="relative z-10 w-full flex flex-col items-center">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-brand mb-8 drop-shadow-md">{currentItem.word}</h2>
        
        {!showAnswer ? (
          <button 
            onClick={() => setShowAnswer(true)}
            className="px-8 py-3 rounded-full bg-muted hover:bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Tampilkan Jawaban
          </button>
        ) : (
          <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 bg-background rounded-xl border border-border text-left">
              <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90">
                <div className="whitespace-pre-wrap">{currentItem.definition}</div>
              </div>
            </div>
            
            {learningPrefs?.show_context !== false && (
              <div className="text-left">
                <p className="text-sm font-medium text-muted-foreground mb-1">Konteks:</p>
                <p className="text-foreground italic">"{currentItem.context_sentence}"</p>
              </div>
            )}
            
            <div className="pt-8 border-t border-border">
              <p className="text-sm font-medium text-muted-foreground mb-4">Seberapa baik Anda mengingat ini?</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button 
                  onClick={() => handleScore(0)}
                  disabled={submitting}
                  className="py-3 px-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  Lupa Total
                </button>
                <button 
                  onClick={() => handleScore(2)}
                  disabled={submitting}
                  className="py-3 px-2 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/20 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  Hampir Lupa
                </button>
                <button 
                  onClick={() => handleScore(4)}
                  disabled={submitting}
                  className="py-3 px-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  Ingat Ragu
                </button>
                <button 
                  onClick={() => handleScore(5)}
                  disabled={submitting}
                  className="py-3 px-2 rounded-lg bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Sangat Mudah
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
