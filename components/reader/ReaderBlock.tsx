"use client";

// Satu blok teks di reader (paragraf, bait, atau judul bab). Di-memo agar perubahan state
// reader (sidebar terbuka, kata dipilih, TTS paragraf lain) tidak me-render ulang semua blok.

import { memo } from "react";
import { Volume2, VolumeX, Search } from "lucide-react";
import InteractiveParagraph from "./InteractiveParagraph";
import type { CulturalReference } from "./CulturalTextRenderer";

export interface ReaderUnit {
  type: "heading" | "paragraph" | "verse";
  text: string;
}

interface ReaderBlockProps {
  index: number;
  block: ReaderUnit;
  culturalRefs: CulturalReference[];
  isBeginnerMode: boolean;
  beginnerLevel: string;
  beginnerLayout: "inline" | "below" | "split";
  isInspectMode: boolean;
  showSyntax: boolean;
  speaking: boolean;
  ttsEnabled: boolean;
  lineNumbers: boolean;
  screenReader: boolean;
  onInspect: (sentence: string) => void;
  onToggleSpeech: (text: string, index: number) => void;
  onToggleSyntax: (index: number) => void;
}

function ReaderBlock({
  index,
  block,
  culturalRefs,
  isBeginnerMode,
  beginnerLevel,
  beginnerLayout,
  isInspectMode,
  showSyntax,
  speaking,
  ttsEnabled,
  lineNumbers,
  screenReader,
  onInspect,
  onToggleSpeech,
  onToggleSyntax,
}: ReaderBlockProps) {
  const isHeading = block.type === "heading";
  const isVerse = block.type === "verse";

  return (
    <div id={`block-${index}`} className="flex gap-2 md:gap-4 group" data-block-idx={index}>
      {lineNumbers && !isHeading && (
        <span className="w-8 text-right text-xs opacity-30 select-none pt-2 group-hover:opacity-60" aria-hidden={screenReader ? "true" : "false"}>
          {index + 1}
        </span>
      )}
      <div
        className={`flex-1 min-w-0 ${
          isHeading
            ? "gutenberg-heading mt-10 mb-6 text-center text-2xl md:text-3xl font-bold"
            : isVerse
              ? "my-6 whitespace-pre-line text-center italic"
              : "my-5 text-left [text-indent:2rem] md:text-justify"
        }`}
        data-block-idx={index}
        role={isHeading ? "heading" : undefined}
        aria-level={isHeading ? 2 : undefined}
      >
        <InteractiveParagraph
          text={block.text}
          culturalRefs={culturalRefs}
          isBeginnerMode={isBeginnerMode}
          beginnerLevel={beginnerLevel}
          beginnerLayout={beginnerLayout}
          showSyntax={showSyntax}
          isInspectMode={isInspectMode}
          onSentenceInspect={onInspect}
        />
      </div>
      {!isHeading && (
        <div className="w-11 pt-1 shrink-0 flex flex-col gap-1 items-center justify-start">
          {ttsEnabled && (
            <button
              onClick={() => onToggleSpeech(block.text, index)}
              className={`w-11 h-11 flex items-center justify-center rounded-full ${speaking ? "opacity-100 bg-brand-tint text-brand-ink animate-pulse" : "opacity-40 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 bg-muted text-muted-foreground hover:bg-brand/10 hover:text-brand"}`}
              title={speaking ? "Stop Reading" : "Read Aloud"}
              aria-label={speaking ? "Hentikan suara" : "Bacakan paragraf"}
            >
              {speaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={() => onToggleSyntax(index)}
            className={`w-11 h-11 flex items-center justify-center rounded-full ${showSyntax ? "opacity-100 bg-blue-500/20 text-blue-500" : "opacity-40 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 bg-muted text-muted-foreground hover:bg-blue-500/10 hover:text-blue-500"}`}
            title={showSyntax ? "Tutup Bedah Sintaksis" : "Bedah Sintaksis"}
            aria-label={showSyntax ? "Tutup bedah sintaksis" : "Bedah sintaksis"}
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default memo(ReaderBlock);
