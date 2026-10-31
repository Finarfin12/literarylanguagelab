"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { BookOpen, RefreshCw, CheckCircle, XCircle } from "lucide-react";

export default function FlashcardReviewPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchVocab() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("vocabulary")
        .select("*")
        .eq("user_id", user.id);
      
      if (data) {
        // Shuffle the cards
        setCards(data.sort(() => Math.random() - 0.5));
      }
      setLoading(false);
    }
    fetchVocab();
  }, []);

  if (loading) return <div className="p-4 md:p-8 text-center text-muted-foreground animate-pulse">Memuat kartu flashcard...</div>;
  if (cards.length === 0) return <div className="p-4 md:p-8 text-center text-muted-foreground mt-20">Kamus Anda masih kosong. Simpan beberapa kata terlebih dahulu dari Text Library!</div>;

  const currentCard = cards[currentIndex];
  const isFinished = currentIndex >= cards.length;

  if (isFinished) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto text-center mt-20 animate-in fade-in slide-in-from-bottom-4">
        <div className="w-24 h-24 bg-brand/20 text-brand rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12" />
        </div>
        <h1 className="text-2xl md:text-4xl font-serif font-bold text-foreground mb-4">Selesai!</h1>
        <p className="text-xl text-muted-foreground mb-8">Anda telah mereview {cards.length} kata hari ini.</p>
        <button 
          onClick={() => { setCards([...cards].sort(() => Math.random() - 0.5)); setCurrentIndex(0); setShowAnswer(false); }}
          className="px-4 md:px-8 py-4 bg-muted hover:bg-muted/80 hover:bg-muted text-foreground font-bold rounded-xl transition-all flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-5 h-5" /> Ulangi Review
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto min-h-full flex flex-col items-center pt-20">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-serif font-bold text-foreground flex items-center justify-center gap-3">
          <BookOpen className="w-8 h-8 text-amber-400" />
          Flashcard Review
        </h1>
        <p className="text-muted-foreground mt-2 font-mono bg-muted px-4 py-1 rounded-full inline-block">Kartu {currentIndex + 1} dari {cards.length}</p>
      </div>

      <div 
        className="w-full max-w-2xl aspect-[3/2] cursor-pointer group"
        style={{ perspective: '1000px' }}
        onClick={() => setShowAnswer(!showAnswer)}
      >
        <div 
          className="relative w-full h-full transition-transform duration-700"
          style={{ transformStyle: 'preserve-3d', transform: showAnswer ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          {/* Front of card */}
          <div 
            className="absolute inset-0 bg-card shadow-sm backdrop-blur-xl border border-border rounded-3xl shadow-2xl flex flex-col items-center justify-center p-4 md:p-8 text-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-4xl md:text-6xl font-serif font-bold text-brand mb-4">{currentCard.word}</p>
            <p className="text-sm text-muted-foreground uppercase tracking-widest animate-pulse mt-12 opacity-50">Klik untuk membalik</p>
          </div>

          {/* Back of card */}
          <div 
            className="absolute inset-0 bg-brand/10 backdrop-blur-xl border border-brand/30 rounded-3xl shadow-2xl flex flex-col items-center justify-center p-4 md:p-8 text-center"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <p className="text-sm font-bold text-brand/80 mb-4 uppercase tracking-widest">Meaning</p>
            <p className="text-2xl md:text-4xl font-serif font-bold text-foreground mb-8">{currentCard.meaning}</p>
            {currentCard.context && (
              <div className="bg-black/30 p-6 rounded-2xl max-w-lg border border-border">
                <p className="text-lg text-muted-foreground italic">"{currentCard.context}"</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`mt-12 flex items-center gap-6 transition-all duration-500 ${showAnswer ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <button 
          onClick={(e) => { e.stopPropagation(); setShowAnswer(false); setTimeout(() => setCurrentIndex(c => c + 1), 150); }}
          className="px-4 md:px-8 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl transition-all flex items-center gap-2 border border-red-500/20"
        >
          <XCircle className="w-5 h-5" /> Lupa
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); setShowAnswer(false); setTimeout(() => setCurrentIndex(c => c + 1), 150); }}
          className="px-4 md:px-8 py-4 bg-brand text-background hover:shadow-[0_0_20px_rgba(62,207,142,0.4)] hover:-translate-y-1 font-bold rounded-xl transition-all flex items-center gap-2"
        >
          <CheckCircle className="w-5 h-5" /> Ingat
        </button>
      </div>
    </div>
  );
}
