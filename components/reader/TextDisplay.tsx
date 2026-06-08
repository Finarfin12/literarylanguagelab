"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquareQuote } from "lucide-react";
import WordLookupSidebar from "./WordLookupSidebar";
import ReadingCompanionSidebar from "./ReadingCompanionSidebar";

interface TextDisplayProps {
  textId: string;
  title: string;
  author: string;
  content: string;
}

export default function TextDisplay({ textId, title, author, content }: TextDisplayProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [contextSentence, setContextSentence] = useState<string | null>(null);
  const [activeSidebar, setActiveSidebar] = useState<"lookup" | "companion" | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Parse paragraphs
  const paragraphs = content.split("\n").filter((p) => p.trim() !== "");

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

      const text = selection.toString().trim();
      if (!text || text.includes("\n") || text.split(" ").length > 5) return; // Only allow words or short phrases

      // Get context sentence (simple approximation: get the parent node text)
      let sentence = "";
      const anchorNode = selection.anchorNode;
      if (anchorNode && anchorNode.parentElement) {
        sentence = anchorNode.parentElement.textContent || text;
      }

      setSelectedWord(text);
      setContextSentence(sentence);
      setActiveSidebar("lookup");
    };

    document.addEventListener("mouseup", handleSelection);
    return () => document.removeEventListener("mouseup", handleSelection);
  }, []);

  return (
    <div className="flex h-full relative overflow-hidden">
      {/* Main Reading Area */}
      <div 
        className={`flex-1 overflow-y-auto transition-all duration-300 relative ${activeSidebar ? 'pr-[400px]' : ''}`}
      >
        <div className="max-w-3xl mx-auto px-8 py-12">
          <header className="mb-12 text-center">
            <h1 className="text-4xl font-serif font-bold text-foreground mb-4">{title}</h1>
            <p className="text-xl font-serif italic text-muted-foreground">by {author}</p>
          </header>

          <div 
            ref={contentRef}
            className="prose-literature"
          >
            {paragraphs.map((p, idx) => (
              <p key={idx}>{p}</p>
            ))}
          </div>
        </div>
        
        {/* FAB for Reading Companion */}
        <button
          onClick={() => setActiveSidebar(activeSidebar === "companion" ? null : "companion")}
          className="fixed bottom-8 right-8 z-40 bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all hover:scale-110 flex items-center justify-center group"
          title="Ask Reading Companion"
        >
          <MessageSquareQuote className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar Area */}
      <div className={`absolute top-0 right-0 w-[400px] h-full bg-background/80 backdrop-blur-3xl border-l border-white/10 transform transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-[0_0_50px_rgba(0,0,0,0.5)] z-50 ${activeSidebar ? 'translate-x-0' : 'translate-x-full'}`}>
        {activeSidebar === "lookup" && (
          <WordLookupSidebar 
            word={selectedWord} 
            contextSentence={contextSentence}
            title={title}
            author={author}
            textId={textId}
            onClose={() => {
              setActiveSidebar(null);
              window.getSelection()?.removeAllRanges();
            }} 
          />
        )}
        
        {activeSidebar === "companion" && (
          <ReadingCompanionSidebar
            title={title}
            author={author}
            content={content}
            onClose={() => setActiveSidebar(null)}
          />
        )}
      </div>
    </div>
  );
}
