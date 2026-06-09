"use client";

import { useState, useEffect } from "react";
import { Loader2, ArrowLeft, Book } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default function GutenbergReaderPage({ params }: { params: { id: string } }) {
  const [bookMeta, setBookMeta] = useState<any>(null);
  const [bookText, setBookText] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBook() {
      try {
        // Fetch Metadata
        const metaRes = await fetch(`https://gutendex.com/books/${params.id}`);
        if (!metaRes.ok) throw new Error("Buku tidak ditemukan di Gutenberg.");
        const meta = await metaRes.json();
        setBookMeta(meta);

        // Cari URL text
        const txtKey = Object.keys(meta.formats).find(key => key.startsWith("text/plain"));
        const txtUrl = txtKey ? meta.formats[txtKey] : null;
        if (!txtUrl) throw new Error("Format teks murni tidak tersedia untuk buku ini.");

        // Karena Gutenberg API CORS issues jika di-fetch langsung di browser, kita akan fetch via proxy sederhana (next.js rewrite atau cors proxy)
        // Disini kita gunakan corsproxy.io atau allorigins sebagai solusi gratis untuk demo front-end
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(txtUrl)}`;
        const textRes = await fetch(proxyUrl);
        let rawText = await textRes.text();

        // Standard Gutenberg Header/Footer stripping (Approximate)
        const startMarker = "*** START OF THE PROJECT GUTENBERG EBOOK";
        const endMarker = "*** END OF THE PROJECT GUTENBERG EBOOK";
        
        const startIndex = rawText.indexOf(startMarker);
        if (startIndex !== -1) {
            // Find the end of the line containing the start marker
            const lineEndIndex = rawText.indexOf("\\n", startIndex);
            if (lineEndIndex !== -1) rawText = rawText.substring(lineEndIndex + 1);
            else rawText = rawText.substring(startIndex + startMarker.length);
        }

        const endIndex = rawText.indexOf(endMarker);
        if (endIndex !== -1) {
            rawText = rawText.substring(0, endIndex);
        }

        setBookText(rawText.trim());

      } catch (err: any) {
        console.error(err);
        setError(err.message || "Gagal memuat buku.");
      } finally {
        setLoading(false);
      }
    }

    loadBook();
  }, [params.id]);

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
              {bookMeta?.authors.map((a: any) => a.name.split(',').reverse().join(' ')).join(', ')}
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
             {bookMeta?.authors.map((a: any) => a.name.split(',').reverse().join(' ')).join(', ')}
           </h2>
        </div>
        
        {/* Render text directly using whitespace-pre-wrap to maintain paragraphs */}
        <div className="whitespace-pre-wrap font-serif text-foreground/90">
            {bookText}
        </div>
      </div>

    </div>
  );
}
