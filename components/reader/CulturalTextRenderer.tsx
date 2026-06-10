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

export default function CulturalTextRenderer({ text, references }: CulturalTextRendererProps) {
  if (!references || references.length === 0) {
    return <>{text}</>;
  }

  // Create an array of parts: some are text, some are cultural reference nodes
  const parts: React.ReactNode[] = [];
  
  // To avoid overlapping matches, we need a robust approach.
  // We'll sort references by length (longest first) to match greedy.
  const sortedRefs = [...references].sort((a, b) => b.phrase.length - a.phrase.length);
  
  let currentText = text;
  
  while (currentText.length > 0) {
    let earliestMatchIndex = -1;
    let matchedRef: CulturalReference | null = null;
    let matchLength = 0;

    // Find the earliest occurrence of ANY reference in currentText
    for (const ref of sortedRefs) {
      // Case-insensitive search, whole word matching roughly
      const regex = new RegExp(`\\b${escapeRegExp(ref.phrase)}\\b`, "i");
      const match = currentText.match(regex);
      
      if (match && match.index !== undefined) {
        if (earliestMatchIndex === -1 || match.index < earliestMatchIndex) {
          earliestMatchIndex = match.index;
          matchedRef = ref;
          matchLength = match[0].length;
        }
      }
    }

    if (earliestMatchIndex === -1 || !matchedRef) {
      // No more matches found
      parts.push(currentText);
      break;
    }

    // Push the text before the match
    if (earliestMatchIndex > 0) {
      parts.push(currentText.substring(0, earliestMatchIndex));
    }

    // Push the interactive reference node
    const matchedText = currentText.substring(earliestMatchIndex, earliestMatchIndex + matchLength);
    parts.push(
      <CulturalTooltip key={`${matchedRef.id}-${parts.length}`} reference={matchedRef} text={matchedText} />
    );

    // Update currentText to be the remainder
    currentText = currentText.substring(earliestMatchIndex + matchLength);
  }

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
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 z-50 animate-in fade-in zoom-in-95 duration-200">
          <span className="block bg-card text-foreground text-sm border border-border shadow-xl rounded-2xl p-4 text-left leading-relaxed font-sans">
            <span className="flex items-center gap-2 mb-2 text-amber-600 font-bold">
              <BookOpen className="w-4 h-4" /> Cultural Context
            </span>
            <span className="block mb-2 font-serif text-base">{reference.explanation}</span>
            {reference.indonesian_equivalent && (
              <span className="block pt-2 mt-2 border-t border-border">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Padanan Indonesia</span>
                <span className="font-medium text-emerald-600">"{reference.indonesian_equivalent}"</span>
              </span>
            )}
            <span className="block mt-2 text-xs text-muted-foreground italic">Origin: {reference.origin}</span>
          </span>
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-8 border-transparent border-t-border border-b-0" />
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-[2px] border-8 border-transparent border-t-card border-b-0" />
        </span>
      )}
    </span>
  );
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
