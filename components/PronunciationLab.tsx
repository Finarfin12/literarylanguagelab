"use client";

import React, { useState, useEffect } from 'react';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { Mic, MicOff, Loader2, Volume2, ArrowRight } from 'lucide-react';

// Levenshtein distance logic
function levenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1].toLowerCase() === b[j - 1].toLowerCase()) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[a.length][b.length];
}

function calculateSimilarity(target: string, spoken: string): number {
  if (!target || !spoken) return 0;
  
  // Clean punctuation
  const cleanTarget = target.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim().toLowerCase();
  const cleanSpoken = spoken.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim().toLowerCase();
  
  if (cleanTarget === cleanSpoken) return 100;
  
  const distance = levenshteinDistance(cleanTarget, cleanSpoken);
  const maxLength = Math.max(cleanTarget.length, cleanSpoken.length);
  
  const sim = ((maxLength - distance) / maxLength) * 100;
  return Math.max(0, Math.round(sim));
}

export default function PronunciationLab() {
  const [targetText, setTargetText] = useState("");
  const { isRecording, isProcessing, transcript, error, startRecording, stopRecording } = useSpeechToText();
  const [score, setScore] = useState<number | null>(null);

  useEffect(() => {
    if (transcript && targetText && !isRecording && !isProcessing) {
      setScore(calculateSimilarity(targetText, transcript));
    }
  }, [transcript, isRecording, isProcessing]);

  const handleTTS = () => {
    if (!targetText) return;
    const utterance = new SpeechSynthesisUtterance(targetText);
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 70) return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
    return "text-red-500 bg-red-500/10 border-red-500/20";
  };

  const getScoreMessage = (score: number) => {
    if (score >= 90) return "Sempurna! Pelafalan Anda sangat tepat.";
    if (score >= 70) return "Hampir tepat! Perhatikan artikulasi beberapa suku kata.";
    return "Kurang tepat. Coba dengarkan contoh audionya dan ulangi.";
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-card border border-border rounded-3xl p-5 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="mb-6">
          <label className="block text-sm font-bold text-foreground uppercase tracking-wider mb-3">Teks Target (English)</label>
          <textarea
            value={targetText}
            onChange={(e) => {
              setTargetText(e.target.value);
              setScore(null);
            }}
            placeholder="Masukkan kata atau kalimat bahasa Inggris yang ingin Anda latih pelafalannya..."
            className="w-full h-32 bg-background border border-border rounded-2xl p-4 text-foreground font-serif text-lg focus:ring-1 focus:ring-brand focus:border-brand focus:outline-none resize-none"
          ></textarea>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
          <button
            onClick={handleTTS}
            disabled={!targetText}
            className="px-6 py-3 bg-muted hover:bg-muted/80 text-foreground font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Volume2 className="w-5 h-5" /> Dengarkan Contoh
          </button>

          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!targetText || isProcessing}
            className={`px-4 md:px-8 py-3 font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center gap-2 ${ isRecording ? "bg-red-500 text-white animate-pulse" : "bg-brand text-background hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(62,207,142,0.4)]" }`}
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isRecording ? (
              <>
                <MicOff className="w-5 h-5" /> Hentikan Rekaman
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" /> Mulai Bicara
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 text-sm">
            {error}
          </div>
        )}
      </div>

      {(transcript || isProcessing) && (
        <div className="bg-card border border-border rounded-3xl p-5 sm:p-8 shadow-xl relative overflow-hidden">
          <h2 className="text-xl font-bold mb-6 border-b border-border pb-4">Hasil Evaluasi</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Target</p>
                <p className="text-xl font-serif text-foreground">{targetText}</p>
              </div>
              
              <div className="flex justify-center md:justify-start">
                <ArrowRight className="w-6 h-6 text-muted-foreground rotate-90 md:rotate-0" />
              </div>

              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Yang Terdeteksi</p>
                <div className="min-h-[2rem]">
                  {isProcessing ? (
                    <div className="flex items-center gap-2 text-brand">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Memproses audio...</span>
                    </div>
                  ) : (
                    <p className="text-xl font-serif text-foreground">{transcript || "-"}</p>
                  )}
                </div>
              </div>
            </div>

            {score !== null && !isProcessing && (
              <div className={`p-6 sm:p-8 rounded-2xl border flex flex-col items-center justify-center text-center ${getScoreColor(score)}`}>
                <div className="text-4xl md:text-6xl font-bold mb-4">{score}%</div>
                <p className="font-medium">{getScoreMessage(score)}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
