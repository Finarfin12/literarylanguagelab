"use client";

import { useState, useEffect, useRef } from "react";
import CulturalTextRenderer, { CulturalReference } from "./CulturalTextRenderer";
import { Loader2 } from "lucide-react";

interface SyntaxToken {
  word: string;
  role: "Subject" | "Verb" | "Object" | "Other";
}

interface InteractiveParagraphProps {
  text: string;
  culturalRefs: CulturalReference[];
  isBeginnerMode: boolean;
  beginnerLevel: string;
  beginnerLayout: "inline" | "below" | "split";
  showSyntax: boolean;
  isInspectMode?: boolean;
  onSentenceInspect?: (sentence: string) => void;
}

export default function InteractiveParagraph({
  text,
  culturalRefs,
  isBeginnerMode,
  beginnerLevel,
  beginnerLayout,
  showSyntax,
  isInspectMode = false,
  onSentenceInspect
}: InteractiveParagraphProps) {
  const [simplifiedText, setSimplifiedText] = useState<string | null>(null);
  const [syntaxTokens, setSyntaxTokens] = useState<SyntaxToken[] | null>(null);
  
  const [loadingSimplified, setLoadingSimplified] = useState(false);
  const [loadingSyntax, setLoadingSyntax] = useState(false);
  
  const [errorSimplified, setErrorSimplified] = useState<string | null>(null);
  const [errorSyntax, setErrorSyntax] = useState<string | null>(null);
  
  const simplifiedRef = useRef(false);
  const loadingSimplifiedRef = useRef(false);
  const syntaxTokensRef = useRef(false);
  const loadingSyntaxRef = useRef(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setIsVisible(true);
        // Only observe once until it becomes visible
        observer.disconnect();
      }
    }, { rootMargin: "200px" });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // Fetch Simplified Text
  useEffect(() => {
    if (!isBeginnerMode || !isVisible || simplifiedRef.current || loadingSimplifiedRef.current || text.split(" ").length < 5) return;
    
    let isMounted = true;
    const fetchSimplified = async () => {
      loadingSimplifiedRef.current = true;
      setLoadingSimplified(true);
      try {
        const res = await fetch("/api/simplify-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, level: beginnerLevel })
        });
        const data = await res.json();
        if (isMounted && data.simplifiedText) {
          simplifiedRef.current = true;
          setSimplifiedText(data.simplifiedText);
        } else if (isMounted) {
          setErrorSimplified("Gagal menyederhanakan teks. Server sibuk.");
        }
      } catch (e) {
        console.error("Failed to simplify text", e);
        if (isMounted) setErrorSimplified("Gagal menyederhanakan teks.");
      } finally {
        if (isMounted) setLoadingSimplified(false);
      }
    };
    fetchSimplified();
    return () => { isMounted = false; };
  }, [isBeginnerMode, isVisible, beginnerLevel, text]); // removed loadingSimplified and simplifiedText to prevent infinite loops

  // Fetch Syntax
  useEffect(() => {
    if (!showSyntax || syntaxTokensRef.current || loadingSyntaxRef.current || text.split(" ").length < 2) return;
    
    let isMounted = true;
    const fetchSyntax = async () => {
      loadingSyntaxRef.current = true;
      setLoadingSyntax(true);
      try {
        const res = await fetch("/api/highlight-syntax", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text })
        });
        const data = await res.json();
        if (isMounted && data.tokens) {
          syntaxTokensRef.current = true;
          setSyntaxTokens(data.tokens);
        } else if (isMounted) {
          setErrorSyntax("Gagal membedah sintaksis. Server sibuk.");
        }
      } catch (e) {
        console.error("Failed to fetch syntax", e);
        if (isMounted) setErrorSyntax("Gagal membedah sintaksis.");
      } finally {
        if (isMounted) {
          setLoadingSyntax(false);
          loadingSyntaxRef.current = false;
        }
      }
    };
    fetchSyntax();
    return () => { isMounted = false; };
  }, [showSyntax, text]); // removed loadingSyntax and syntaxTokens to prevent infinite loops

  // Render Syntax Mode
  if (showSyntax) {
    return (
      <div ref={containerRef} className="relative">
        {loadingSyntax ? (
          <div className="flex items-center gap-2 text-muted-foreground italic">
            <Loader2 className="w-4 h-4 animate-spin" /> Membedah sintaksis...
          </div>
        ) : errorSyntax ? (
          <div className="text-red-500 italic">
            {errorSyntax} <CulturalTextRenderer text={text} references={culturalRefs} />
          </div>
        ) : syntaxTokens ? (
          <div className="leading-loose">
            {syntaxTokens.map((token, i) => {
              let bgClass = "";
              if (token.role === "Subject") bgClass = "bg-blue-500/30 border-b-2 border-blue-500 rounded-sm px-0.5";
              else if (token.role === "Verb") bgClass = "bg-red-500/30 border-b-2 border-red-500 rounded-sm px-0.5";
              else if (token.role === "Object") bgClass = "bg-yellow-500/30 border-b-2 border-yellow-500 rounded-sm px-0.5";
              
              return (
                <span key={i} className={`mr-1 ${bgClass}`}>
                  {token.word}
                </span>
              );
            })}
          </div>
        ) : (
          <CulturalTextRenderer text={text} references={culturalRefs} />
        )}
      </div>
    );
  }

  // Render Beginner Mode
  if (isBeginnerMode) {
    if (loadingSimplified) {
      return (
        <div ref={containerRef} className="relative">
          {beginnerLayout !== "inline" && <CulturalTextRenderer text={text} references={culturalRefs} />}
          <div className="flex items-center gap-2 text-brand italic mt-2 text-sm bg-brand/5 p-2 rounded-lg">
            <Loader2 className="w-4 h-4 animate-spin" /> Menyederhanakan teks ({beginnerLevel})...
          </div>
        </div>
      );
    }
    
    if (errorSimplified) {
      return (
        <div ref={containerRef} className="relative">
          {beginnerLayout !== "inline" && <CulturalTextRenderer text={text} references={culturalRefs} />}
          <div className="text-red-500 italic mt-2 text-sm bg-red-500/5 p-2 rounded-lg">
            {errorSimplified}
          </div>
        </div>
      );
    }

    if (simplifiedText) {
      if (beginnerLayout === "inline") {
        return (
          <div ref={containerRef} className="text-brand dark:text-brand-hover">
            <CulturalTextRenderer text={simplifiedText} references={[]} />
          </div>
        );
      }
      
      if (beginnerLayout === "below") {
        return (
          <div ref={containerRef}>
            <CulturalTextRenderer text={text} references={culturalRefs} />
            <div className="mt-3 p-4 bg-brand/10 border-l-4 border-brand rounded-r-xl text-brand dark:text-brand-hover">
              <span className="text-xs font-bold uppercase tracking-wider block mb-1 opacity-70">Sederhana ({beginnerLevel})</span>
              <CulturalTextRenderer text={simplifiedText} references={[]} />
            </div>
          </div>
        );
      }

      if (beginnerLayout === "split") {
        return (
          <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="pr-4 border-r border-border/50">
              <CulturalTextRenderer text={text} references={culturalRefs} />
            </div>
            <div className="text-brand dark:text-brand-hover">
              <CulturalTextRenderer text={simplifiedText} references={[]} />
            </div>
          </div>
        );
      }
    }
  }

  // Render Inspect Mode
  if (isInspectMode && onSentenceInspect) {
    // Split text into sentences safely using lookbehind to avoid dropping text
    const sentences = text.split(/(?<=[.!?]["']?)\s+/).filter(Boolean);
    
    return (
      <div ref={containerRef}>
        {sentences.map((sentence, idx) => (
          <span key={idx}>
            <span 
              onClick={(e) => {
                e.stopPropagation();
                onSentenceInspect(sentence.trim());
              }}
              className="cursor-pointer hover:bg-brand/20 active:bg-brand/30 transition-colors rounded-md decoration-brand/30 underline decoration-dotted underline-offset-4"
              title="Inspect Sentence"
            >
              <CulturalTextRenderer text={sentence} references={culturalRefs} />
            </span>
            {idx < sentences.length - 1 ? ' ' : ''}
          </span>
        ))}
      </div>
    );
  }

  // Normal Render
  return (
    <div ref={containerRef}>
      <CulturalTextRenderer text={text} references={culturalRefs} />
    </div>
  );
}
