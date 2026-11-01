"use client";

import Markdown from "@/components/ui/Markdown";
import { useState } from "react";
import { CheckCircle2, RotateCcw, Brain, RefreshCcw, Loader2, BookOpen } from "lucide-react";
import Link from "next/link";
import Swal from "sweetalert2";

interface ReviewClientProps {
  dueVocab: any[];
  learningPrefs?: any;
}

// Tautan ke posisi kata di teks sumber (F-03): /read/<uuid>#block-N atau /gutenberg/<id>#block-N
function sourceHref(item: { text_id?: string | null; position_offset?: number | null }) {
  if (!item.text_id) return null;
  const hash = typeof item.position_offset === "number" && item.position_offset >= 0 ? `#block-${item.position_offset}` : "";
  const gutenberg = item.text_id.match(/^gutenberg[_-](\d+)$/);
  if (gutenberg) return `/gutenberg/${gutenberg[1]}${hash}`;
  return /^[0-9a-f-]{36}$/i.test(item.text_id) ? `/read/${item.text_id}${hash}` : null;
}

export default function ReviewClient({ dueVocab, learningPrefs }: ReviewClientProps) {
  const [items, setItems] = useState(dueVocab);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [submitting, setSubmitting] = useState<number | null>(null);

  const currentItem = items[currentIndex];

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
        <div className="w-24 h-24 bg-brand-tint rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-brand-ink" />
        </div>
        <h2 className="text-2xl font-serif font-medium text-foreground mb-2">Anda sudah hafal semua!</h2>
        <p className="text-muted-foreground mb-8">Tidak ada kata yang perlu di-review saat ini. Kembalilah besok atau tambahkan kata baru dari Library.</p>
      </div>
    );
  }

  const handleScore = async (quality: number) => {
    setSubmitting(quality);
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
      Swal.fire("Gagal", "Error submitting review", "error");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto h-full flex flex-col">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between text-sm font-medium text-muted-foreground gap-3">
        <span>Kata {currentIndex + 1} dari {items.length}</span>
        <div className="flex gap-1 flex-wrap">
          {items.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 w-4 sm:w-6 rounded-full ${idx < currentIndex ? 'bg-brand' : idx === currentIndex ? 'bg-brand/50' : 'bg-border'}`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 bg-card border border-border rounded-card flex flex-col items-center justify-start sm:justify-center p-6 md:p-12 text-center transition-all relative overflow-y-auto">
        <div className="absolute inset-0 bg-muted opacity-50 pointer-events-none" />
        <div className="relative z-10 w-full flex flex-col items-center pt-4 sm:pt-0">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-medium text-brand-ink mb-6 sm:mb-8 drop-shadow-md break-all">{currentItem.word}</h2>
        
        {!showAnswer ? (
          <button 
            onClick={() => setShowAnswer(true)}
            className="px-4 md:px-8 py-3 rounded-full bg-muted hover:bg-muted text-foreground border border-border transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Tampilkan Jawaban
          </button>
        ) : (
          <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 bg-background rounded-control border border-border text-left">
              <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90">
                <div><Markdown>{currentItem.definition}</Markdown></div>
              </div>
            </div>
            
            {learningPrefs?.show_context !== false && (
              <div className="text-left">
                <p className="text-sm font-medium text-muted-foreground mb-1">Konteks:</p>
                <p className="text-foreground italic">"{currentItem.context_sentence}"</p>
                {currentItem.context_source && <p className="text-xs text-muted-foreground mt-1">{currentItem.context_source}</p>}
                {sourceHref(currentItem) && (
                  <Link href={sourceHref(currentItem)!} className="inline-flex items-center gap-1.5 mt-2 min-h-[44px] text-sm font-bold text-brand-ink">
                    <BookOpen className="w-4 h-4" /> Lihat di teks
                  </Link>
                )}
              </div>
            )}
            
            <div className="pt-8 border-t border-border">
              <p className="text-sm font-medium text-muted-foreground mb-4">Seberapa baik Anda mengingat ini?</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button 
                  onClick={() => handleScore(0)}
                  disabled={submitting !== null}
                  className="py-3 px-2 rounded-lg bg-danger-tint text-danger border border-danger/30 hover:bg-danger-tint transition-colors text-xs sm:text-sm font-medium disabled:opacity-50 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2"
                >
                  {submitting === 0 && <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />} Lupa Total
                </button>
                <button 
                  onClick={() => handleScore(2)}
                  disabled={submitting !== null}
                  className="py-3 px-2 rounded-lg bg-muted text-foreground border border-border hover:bg-muted transition-colors text-xs sm:text-sm font-medium disabled:opacity-50 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2"
                >
                  {submitting === 2 && <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />} Hampir Lupa
                </button>
                <button 
                  onClick={() => handleScore(4)}
                  disabled={submitting !== null}
                  className="py-3 px-2 rounded-lg bg-muted text-brand-ink border border-border hover:bg-muted transition-colors text-xs sm:text-sm font-medium disabled:opacity-50 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2"
                >
                  {submitting === 4 && <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />} Ingat Ragu
                </button>
                <button 
                  onClick={() => handleScore(5)}
                  disabled={submitting !== null}
                  className="py-3 px-2 rounded-lg bg-brand-tint text-brand-ink border border-brand/30 hover:bg-brand-tint transition-colors text-xs sm:text-sm font-medium disabled:opacity-50 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2"
                >
                  {submitting === 5 && <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />} Sangat Mudah
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
