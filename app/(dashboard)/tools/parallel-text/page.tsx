"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ArrowLeft, Columns2 } from "lucide-react";
import Link from "next/link";

export default function ParallelTextPage() {
  const [english, setEnglish] = useState("");
  const [indonesian, setIndonesian] = useState("");

  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const [syncedSentence, setSyncedSentence] = useState<number | null>(null);

  // Sync delete: kalau English kosong, kosongkan Indonesian juga, dan sebaliknya
  useEffect(() => {
    if (english === "" && indonesian !== "") setIndonesian("");
  }, [english]);

  useEffect(() => {
    if (indonesian === "" && english !== "") setEnglish("");
  }, [indonesian]);

  const handleScroll = useCallback((source: "left" | "right") => {
    if (leftRef.current && rightRef.current) {
      const sourceEl = source === "left" ? leftRef.current : rightRef.current;
      const targetEl = source === "left" ? rightRef.current : leftRef.current;
      const ratio = sourceEl.scrollTop / (sourceEl.scrollHeight - sourceEl.clientHeight);
      targetEl.scrollTop = ratio * (targetEl.scrollHeight - targetEl.clientHeight);
    }
  }, []);

  const enSentences = english ? english.split(/(?<=[.!?])\s+/) : [];
  const idSentences = indonesian ? indonesian.split(/(?<=[.!?])\s+/) : [];

  return (
    <div className="p-4 md:p-8 min-h-full animate-in fade-in duration-300">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/tools" className="flex items-center gap-2 min-h-[44px] text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </Link>
        <h1 className="text-[28px] md:text-4xl leading-[1.15] font-serif font-medium text-foreground flex items-center gap-3">
          <Columns2 className="w-7 h-7 text-brand-ink" />
          Parallel Text Mode
        </h1>
      </div>
      <p className="text-muted-foreground mb-6">Baca dua bahasa berdampingan dengan scroll tersinkronisasi. Paste teks English dan terjemahan Indonesian, lalu bandingkan.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-220px)]">
        <div className="flex flex-col bg-card border border-border rounded-card overflow-hidden">
          <div className="p-3 border-b border-border bg-muted/50 shrink-0">
            <span className="text-xs font-bold text-brand-ink uppercase tracking-wider">English</span>
          </div>
          <textarea
            value={english}
            onChange={(e) => setEnglish(e.target.value)}
            placeholder="Paste English text here..."
            className="flex-1 p-4 bg-transparent text-foreground font-serif leading-relaxed resize-none focus:outline-none text-sm md:text-base"
          />
        </div>

        <div className="flex flex-col bg-card border border-border rounded-card overflow-hidden">
          <div className="p-3 border-b border-border bg-muted/50 shrink-0">
            <span className="text-xs font-bold text-brand-ink uppercase tracking-wider">Indonesian</span>
          </div>
          <textarea
            value={indonesian}
            onChange={(e) => setIndonesian(e.target.value)}
            placeholder="Paste Indonesia text here..."
            className="flex-1 p-4 bg-transparent text-foreground leading-relaxed resize-none focus:outline-none text-sm md:text-base"
          />
        </div>
      </div>

      {/* Sync-scroll preview */}
      {english && indonesian && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div ref={leftRef} onScroll={() => handleScroll("left")} className="bg-card border border-border rounded-card p-4 max-h-80 overflow-y-auto">
            <h3 className="text-sm font-bold text-brand-ink mb-3 uppercase tracking-wider">Preview (English)</h3>
            {enSentences.map((s, i) => (
              <p
                key={i}
                onMouseEnter={() => setSyncedSentence(i)}
                onMouseLeave={() => setSyncedSentence(null)}
                className={`p-2 rounded-lg transition-colors text-sm leading-relaxed mb-1 ${syncedSentence === i ? "bg-muted border border-border" : ""}`}
              >
                {s}
              </p>
            ))}
          </div>
          <div ref={rightRef} onScroll={() => handleScroll("right")} className="bg-card border border-border rounded-card p-4 max-h-80 overflow-y-auto">
            <h3 className="text-sm font-bold text-brand-ink mb-3 uppercase tracking-wider">Preview (Indonesian)</h3>
            {idSentences.map((s, i) => (
              <p
                key={i}
                onMouseEnter={() => setSyncedSentence(i)}
                onMouseLeave={() => setSyncedSentence(null)}
                className={`p-2 rounded-lg transition-colors text-sm leading-relaxed mb-1 ${syncedSentence === i ? "bg-brand-tint border border-brand/20" : ""}`}
              >
                {s}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
