"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquareQuote } from "lucide-react";
import WordLookupSidebar from "./WordLookupSidebar";
import ReadingCompanionSidebar from "./ReadingCompanionSidebar";

export interface BookBlock {
  type: "heading" | "paragraph" | "verse";
  text: string;
}

interface TextDisplayProps {
  textId: string;
  title: string;
  author: string;
  content?: string;
  blocks?: BookBlock[];
  onTextSelect?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export default function TextDisplay({ textId, title, author, content, blocks, onTextSelect }: TextDisplayProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [contextSentence, setContextSentence] = useState<string | null>(null);
  const [activeSidebar, setActiveSidebar] = useState<"lookup" | null>(null);
  const [showCompanion, setShowCompanion] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Parse paragraphs (only if content is provided as string)
  const paragraphs = content ? content.split("\n").filter((p) => p.trim() !== "") : [];

  // Heartbeat to track time spent
  useEffect(() => {
    if (!textId) return;

    const intervalSeconds = 10;
    const interval = setInterval(() => {
      // Check if document is visible (user is actually reading)
      if (document.visibilityState === 'visible') {
        fetch('/api/reading/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text_id: textId,
            time_spent_seconds: intervalSeconds
          })
        }).catch(err => console.error("Heartbeat failed", err));
      }
    }, intervalSeconds * 1000);

    return () => clearInterval(interval);
  }, [textId]);

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
    document.addEventListener("touchend", handleSelection);
    return () => {
      document.removeEventListener("mouseup", handleSelection);
      document.removeEventListener("touchend", handleSelection);
    };
  }, []);

  return (
    <div className="flex h-full relative overflow-hidden">
      {/* Main Reading Area */}
      <div 
        className={`flex-1 overflow-y-auto transition-all duration-300 relative ${activeSidebar ? 'md:pr-[400px]' : ''}`}
        onMouseUp={onTextSelect}
      >
        <div className="sticky top-0 bg-background/80 backdrop-blur-md z-30 p-4 border-b border-border flex justify-between items-center shadow-sm">
          <div className="flex-1 truncate">
            {/* Can add breadcrumb or back button here if needed */}
          </div>
          <button 
            onClick={() => setShowCompanion(true)} 
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-full font-medium flex items-center gap-2 text-sm shadow-md transition-all hover:scale-105 active:scale-95"
          >
            <MessageSquareQuote className="w-4 h-4" />
            <span className="hidden md:inline">Ask AI Companion</span>
            <span className="md:hidden">AI</span>
          </button>
        </div>

        <div className="max-w-3xl mx-auto px-6 md:px-8 py-12">
          <header className="mb-12 text-center">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">{title}</h1>
            <p className="text-lg md:text-xl font-serif italic text-muted-foreground">by {author}</p>
          </header>

          <div 
            ref={contentRef}
            className="prose-literature font-serif text-lg leading-loose text-foreground/90"
          >
            {blocks ? (
              blocks.map((block, index) => {
                if (block.type === "heading") {
                  return <h3 key={index} className="mt-14 mb-8 text-center text-3xl font-bold font-serif">{block.text}</h3>;
                }
                if (block.type === "verse") {
                  return <p key={index} className="my-8 whitespace-pre-line text-center italic leading-9">{block.text}</p>;
                }
                return <p key={index} className="my-6 text-left leading-9 [text-indent:2rem] md:text-justify">{block.text}</p>;
              })
            ) : (
              paragraphs.map((p, idx) => (
                <p key={idx} className="my-6 text-left leading-9 [text-indent:2rem] md:text-justify">{p}</p>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Area for Word Lookup */}
      <div className={`absolute top-0 right-0 w-full sm:w-[400px] h-full bg-background backdrop-blur-3xl border-l border-border transform transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-[0_0_50px_rgba(0,0,0,0.5)] z-50 ${activeSidebar ? 'translate-x-0' : 'translate-x-full'}`}>
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
      </div>

      {/* Pop-up Area for Reading Companion */}
      {showCompanion && (
        <ReadingCompanionSidebar
          title={title}
          author={author}
          content={content || blocks?.map(b => b.text).join("\n") || ""}
          onClose={() => setShowCompanion(false)}
        />
      )}
    </div>
  );
}
