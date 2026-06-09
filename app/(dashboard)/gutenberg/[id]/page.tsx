"use client";

import { useState, useEffect } from "react";
import { Loader2, ArrowLeft, Book } from "lucide-react";
import Link from "next/link";
import { use } from "react";

type GutenbergAuthor = {
  name: string;
};

type GutenbergBook = {
  title: string;
  authors: GutenbergAuthor[];
  formats: Record<string, string>;
};

type BookBlock = {
  type: "heading" | "paragraph" | "verse";
  text: string;
};

const romanNumeralPattern = /^[IVXLCDM]+\.?$/i;
const chapterHeadingPattern =
  /^(chapter|book|part)\s+([ivxlcdm]+|\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/i;

function stripProjectGutenbergWrapper(text: string) {
  const normalized = text.replace(/\r\n?/g, "\n");
  const startMatch = normalized.match(/\*\*\*\s*START OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[\s\S]*?\*\*\*/i);
  const withoutHeader = startMatch
    ? normalized.slice((startMatch.index || 0) + startMatch[0].length)
    : normalized;
  const endMatch = withoutHeader.match(/\*\*\*\s*END OF (?:THE|THIS) PROJECT GUTENBERG EBOOK[\s\S]*?\*\*\*/i);

  return (endMatch ? withoutHeader.slice(0, endMatch.index) : withoutHeader).trim();
}

function isChapterHeading(line: string) {
  const cleaned = line.trim();
  return romanNumeralPattern.test(cleaned) || chapterHeadingPattern.test(cleaned);
}

function trimFrontMatter(text: string) {
  const lines = text.split("\n");
  const nonEmptyIndexes = lines
    .map((line, index) => ({ line: line.trim(), index }))
    .filter(({ line }) => line.length > 0);

  const firstChapter = nonEmptyIndexes.find(({ line }, position) => {
    const previous = nonEmptyIndexes[position - 1]?.line.toLowerCase() || "";
    const next = nonEmptyIndexes[position + 1]?.line || "";

    return (
      isChapterHeading(line) &&
      !previous.includes("table of contents") &&
      !romanNumeralPattern.test(previous.trim()) &&
      !romanNumeralPattern.test(next.trim())
    );
  });

  return firstChapter ? lines.slice(firstChapter.index).join("\n").trim() : text;
}

function getBlockType(block: string) {
  const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
  const joined = lines.join(" ");
  const averageLineLength =
    lines.reduce((total, line) => total + line.length, 0) / Math.max(lines.length, 1);

  if (lines.length === 1 && isChapterHeading(joined)) {
    return "heading";
  }

  if (lines.length > 1 && averageLineLength < 54) {
    return "verse";
  }

  return "paragraph";
}

function buildReadableBlocks(text: string): BookBlock[] {
  const readableText = trimFrontMatter(stripProjectGutenbergWrapper(text));

  return readableText
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const type = getBlockType(block);
      const cleanText =
        type === "paragraph"
          ? block.split("\n").map((line) => line.trim()).join(" ")
          : block.split("\n").map((line) => line.trim()).join("\n");

      return { type, text: cleanText };
    });
}

export default function GutenbergReaderPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [bookMeta, setBookMeta] = useState<GutenbergBook | null>(null);
  const [bookBlocks, setBookBlocks] = useState<BookBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBook() {
      try {
        const txtUrl = `https://www.gutenberg.org/ebooks/${resolvedParams.id}.txt.utf8`;

        const [metaRes, textRes] = await Promise.all([
          fetch(`/api/gutenberg/${resolvedParams.id}`),
          fetch(`/api/gutenberg/text?url=${encodeURIComponent(txtUrl)}`),
        ]);

        if (!metaRes.ok) throw new Error("Buku tidak ditemukan di Gutenberg.");
        const meta = (await metaRes.json()) as GutenbergBook;
        setBookMeta(meta);

        if (!textRes.ok) throw new Error("Gagal memuat teks buku dari Project Gutenberg.");
        const rawText = await textRes.text();
        setBookBlocks(buildReadableBlocks(rawText));

      } catch (err: unknown) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Gagal memuat buku.");
      } finally {
        setLoading(false);
      }
    }

    loadBook();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col justify-center items-center gap-4">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
        <p className="text-muted-foreground animate-pulse font-serif">Mengambil buku raksasa dari arsip Gutenberg...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center py-20">
        <h2 className="text-2xl font-bold text-rose-500 mb-2">Error</h2>
        <p className="text-muted-foreground">{error}</p>
        <Link href="/gutenberg" className="mt-6 inline-flex items-center gap-2 text-orange-500 hover:underline">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Pencarian
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-card min-h-screen border-x border-border shadow-2xl relative animate-in fade-in duration-1000">
      
      {/* Sticky Top Navigation */}
      <div className="sticky top-0 bg-card/90 backdrop-blur-md border-b border-border p-4 flex items-center justify-between z-10 shadow-sm">
        <Link href="/gutenberg" className="p-2 bg-muted hover:bg-orange-500 hover:text-white rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 text-center truncate px-4">
            <h1 className="font-serif font-bold text-lg truncate">{bookMeta?.title}</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest truncate">
              {bookMeta?.authors.map((a) => a.name.split(',').reverse().join(' ')).join(', ')}
            </p>
        </div>
        <div className="p-2 text-muted-foreground" title="Buku Lengkap">
          <Book className="w-5 h-5" />
        </div>
      </div>

      {/* Reader Content */}
      <div className="p-8 md:p-16 lg:px-24 prose prose-lg dark:prose-invert max-w-none font-serif text-lg leading-loose">
        <div className="mb-16 text-center border-b border-border pb-10">
           <h1 className="text-4xl md:text-5xl font-bold mb-6 font-serif">{bookMeta?.title}</h1>
           <h2 className="text-2xl text-muted-foreground font-serif italic">
             {bookMeta?.authors.map((a) => a.name.split(',').reverse().join(' ')).join(', ')}
           </h2>
        </div>
        
        <div className="font-serif text-foreground/90">
          {bookBlocks.map((block, index) => {
            if (block.type === "heading") {
              return (
                <h3 key={`${block.type}-${index}`} className="mt-14 mb-8 text-center text-3xl font-bold font-serif">
                  {block.text}
                </h3>
              );
            }

            if (block.type === "verse") {
              return (
                <p key={`${block.type}-${index}`} className="my-8 whitespace-pre-line text-center italic leading-9">
                  {block.text}
                </p>
              );
            }

            return (
              <p key={`${block.type}-${index}`} className="my-6 text-left leading-9 [text-indent:2rem] md:text-justify">
                {block.text}
              </p>
            );
          })}
        </div>
      </div>

    </div>
  );
}
