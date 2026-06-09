"use client";

import { useState, useEffect, use } from "react";
import { Loader2, ArrowLeft, Book } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type BookBlock = {
  type: "heading" | "paragraph" | "verse";
  text: string;
};

type BookMeta = {
  title: string;
  author: string;
};

export default function GutenbergReaderPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const gutenbergId = resolvedParams.id;
  const [bookMeta, setBookMeta] = useState<BookMeta>({
    title: searchParams.get("title") || "Loading...",
    author: searchParams.get("author") || "Project Gutenberg",
  });
  const [bookBlocks, setBookBlocks] = useState<BookBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBook() {
      try {
        if (!searchParams.get("title")) {
          const metaRes = await fetch(`/api/gutenberg/${gutenbergId}`);
          if (metaRes.ok) {
            const meta = await metaRes.json();
            setBookMeta({
              title: meta.title || "Unknown Title",
              author: meta.authors?.map((a: { name: string }) => a.name.split(",").reverse().join(" ")).join(", ") || "Unknown Author",
            });
          }
        }

        const txtUrl = `https://www.gutenberg.org/ebooks/${gutenbergId}.txt.utf8`;
        const textRes = await fetch(`/api/gutenberg/text?url=${encodeURIComponent(txtUrl)}`);
        if (!textRes.ok) throw new Error("Gagal memuat teks buku dari Project Gutenberg.");
        const data = await textRes.json();
        setBookBlocks(data.blocks);
      } catch (err: unknown) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Gagal memuat buku.");
      } finally {
        setLoading(false);
      }
    }

    loadBook();
  }, [gutenbergId, searchParams]);

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
          <h1 className="font-serif font-bold text-lg truncate">{bookMeta.title}</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest truncate">{bookMeta.author}</p>
        </div>
        <div className="p-2 text-muted-foreground" title="Buku Lengkap">
          <Book className="w-5 h-5" />
        </div>
      </div>

      {/* Reader Content */}
      <div className="p-8 md:p-16 lg:px-24 prose prose-lg dark:prose-invert max-w-none font-serif text-lg leading-loose">
        <div className="mb-16 text-center border-b border-border pb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 font-serif">{bookMeta.title}</h1>
          <h2 className="text-2xl text-muted-foreground font-serif italic">{bookMeta.author}</h2>
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
