"use client";

import React, { useState } from "react";
import { BookOpen } from "lucide-react";

export interface CulturalReference {
  id: string;
  phrase: string;
  origin: string;
  explanation: string;
  indonesian_equivalent?: string;
}

interface CulturalTextRendererProps {
  text: string;
  references: CulturalReference[];
}

// Satu regex gabungan per daftar referensi, dikompilasi sekali lalu dipakai ulang oleh
// semua paragraf. Sebelumnya setiap paragraf membuat satu regex per referensi di setiap render.
type CompiledRefs = { regex: RegExp; byPhrase: Map<string, CulturalReference> };
const compiledCache = new WeakMap<CulturalReference[], CompiledRefs | null>();

function compileReferences(references: CulturalReference[]): CompiledRefs | null {
  if (compiledCache.has(references)) return compiledCache.get(references)!;
  const usable = references.filter((r) => r.phrase && r.phrase.trim());
  let compiled: CompiledRefs | null = null;
  if (usable.length > 0) {
    // Frasa terpanjang lebih dulu agar kecocokan paling panjang yang menang
    const sorted = [...usable].sort((a, b) => b.phrase.length - a.phrase.length);
    compiled = {
      regex: new RegExp(`\\b(?:${sorted.map((r) => escapeRegExp(r.phrase)).join("|")})\\b`, "gi"),
      byPhrase: new Map(sorted.map((r) => [r.phrase.toLowerCase(), r])),
    };
  }
  compiledCache.set(references, compiled);
  return compiled;
}

export default function CulturalTextRenderer({ text, references }: CulturalTextRendererProps) {
  if (!references || references.length === 0) {
    return <>{text}</>;
  }

  const compiled = compileReferences(references);
  if (!compiled) return <>{text}</>;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(compiled.regex)) {
    const ref = compiled.byPhrase.get(match[0].toLowerCase());
    if (!ref || match.index === undefined) continue;
    if (match.index > lastIndex) parts.push(text.substring(lastIndex, match.index));
    parts.push(<CulturalTooltip key={`${ref.id}-${match.index}`} reference={ref} text={match[0]} />);
    lastIndex = match.index + match[0].length;
  }

  if (parts.length === 0) return <>{text}</>;
  if (lastIndex < text.length) parts.push(text.substring(lastIndex));
  return <>{parts}</>;
}

function CulturalTooltip({ reference, text }: { reference: CulturalReference, text: string }) {
  const [show, setShow] = useState(false);

  return (
    <span 
      className="relative inline-block cursor-help"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={() => setShow(!show)}
    >
      <span className="text-amber-600 dark:text-amber-500 font-medium border-b-2 border-dashed border-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors">
        {text}
      </span>
      
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 max-w-[85vw] z-[100] animate-in fade-in zoom-in-95 duration-200">
          <span className="block bg-background dark:bg-zinc-900 text-foreground text-sm border border-border shadow-2xl rounded-2xl p-5 text-left leading-relaxed font-sans">
            <span className="flex items-center gap-2 mb-2 text-amber-600 font-bold">
              <BookOpen className="w-4 h-4" /> Cultural Context
            </span>
            <span className="block mb-2 font-serif text-base">{reference.explanation}</span>
            {reference.indonesian_equivalent && (
              <span className="block pt-3 mt-3 border-t border-border">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Padanan Indonesia</span>
                <span className="font-medium text-emerald-600">"{reference.indonesian_equivalent}"</span>
              </span>
            )}
            <span className="block mt-3 text-xs text-muted-foreground italic">Origin: {reference.origin}</span>
          </span>
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-[10px] border-transparent border-t-border border-b-0" />
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-[2px] border-[10px] border-transparent border-t-background dark:border-t-zinc-900 border-b-0" />
        </span>
      )}
    </span>
  );
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
