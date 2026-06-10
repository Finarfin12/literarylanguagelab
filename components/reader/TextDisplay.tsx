"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquareQuote } from "lucide-react";
import WordLookupSidebar from "./WordLookupSidebar";
import ReadingCompanionSidebar from "./ReadingCompanionSidebar";
import { createClient } from "@/utils/supabase/client";
import CulturalTextRenderer, { CulturalReference } from "./CulturalTextRenderer";

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
  const [culturalRefs, setCulturalRefs] = useState<CulturalReference[]>([]);
  const [prefs, setPrefs] = useState<any>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Parse paragraphs (only if content is provided as string)
  const paragraphs = content ? content.split("\n").filter((p) => p.trim() !== "") : [];

  // Heartbeat to track time spent
  useEffect(() => {
    if (!textId) return;

    // Fetch Cultural References and Preferences
    async function initData() {
      const supabase = createClient();
      
      const [refsRes, authRes] = await Promise.all([
        supabase.from("cultural_references").select("*"),
        supabase.auth.getUser()
      ]);

      if (refsRes.data) setCulturalRefs(refsRes.data);

      if (authRes.data.user) {
        const { data: profile } = await supabase.from("profiles").select("preferences").eq("id", authRes.data.user.id).single();
        if (profile?.preferences) {
          setPrefs(profile.preferences);
        }
      }
    }
    initData();

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

  // Determine dynamic styles based on preferences
  const readPrefs = prefs?.reading || {};
  
  const fontClass = readPrefs.font_family === "sans-serif" ? "font-sans" : 
                    readPrefs.font_family === "dyslexic" ? "" : "font-serif";
  const dyslexicStyle = readPrefs.font_family === "dyslexic" ? { fontFamily: '"OpenDyslexic", "Comic Sans MS", sans-serif' } : {};
  
  const widthClass = readPrefs.text_width === "narrow" ? "max-w-xl" : 
                     readPrefs.text_width === "wide" ? "max-w-5xl" : "max-w-3xl";

  const themeClass = readPrefs.theme === "dark" ? "bg-gray-900 text-gray-100" :
                     readPrefs.theme === "sepia" ? "bg-[#f4ecd8] text-[#5b4636]" : 
                     "bg-background text-foreground"; // Default to global theme for 'light'

  const customStyle = {
    ...dyslexicStyle,
    fontSize: readPrefs.font_size ? `${readPrefs.font_size}px` : undefined,
    lineHeight: readPrefs.line_height ? readPrefs.line_height : undefined,
  };

  return (
    <div className={`flex h-full relative overflow-hidden ${themeClass}`}>
      {readPrefs.highlight_color && (
        <style dangerouslySetInnerHTML={{__html: `
          .prose-literature ::selection {
            background-color: ${readPrefs.highlight_color}80; /* 50% opacity */
            color: inherit;
          }
        `}} />
      )}
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

        <div className={`${widthClass} mx-auto px-6 md:px-8 py-12 transition-all duration-500`}>
          <header className="mb-12 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: dyslexicStyle.fontFamily ? dyslexicStyle.fontFamily : 'inherit' }}>{title}</h1>
            <p className="text-lg md:text-xl italic opacity-80">by {author}</p>
          </header>

          <div 
            ref={contentRef}
            className={`prose-literature ${fontClass} leading-loose opacity-90 transition-all duration-300`}
            style={customStyle}
          >
            {blocks ? (
              blocks.map((block, index) => {
                const isHeading = block.type === "heading";
                const isVerse = block.type === "verse";
                return (
                  <div key={index} className="flex gap-4 group">
                    {readPrefs.line_numbers && !isHeading && (
                      <span className="w-8 text-right text-xs opacity-30 select-none pt-2 group-hover:opacity-60">{index + 1}</span>
                    )}
                    <p className={`flex-1 ${isHeading ? 'mt-14 mb-8 text-center text-3xl font-bold' : isVerse ? 'my-8 whitespace-pre-line text-center italic' : 'my-6 text-left [text-indent:2rem] md:text-justify'}`}>
                      <CulturalTextRenderer text={block.text} references={culturalRefs} />
                    </p>
                  </div>
                );
              })
            ) : (
              paragraphs.map((p, idx) => (
                <div key={idx} className="flex gap-4 group">
                  {readPrefs.line_numbers && (
                    <span className="w-8 text-right text-xs opacity-30 select-none pt-2 group-hover:opacity-60">{idx + 1}</span>
                  )}
                  <p className="flex-1 my-6 text-left [text-indent:2rem] md:text-justify">
                    <CulturalTextRenderer text={p} references={culturalRefs} />
                  </p>
                </div>
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
            dictionaryPrefs={prefs?.dictionary}
            learningPrefs={prefs?.learning}
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
