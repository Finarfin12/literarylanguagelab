"use client";

import { useState, useEffect, use, useRef, useCallback } from "react";
import { Loader2, ArrowLeft, Book, BookmarkPlus, Highlighter, Download, Check } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { saveBookToCache, getCachedBook } from "@/utils/indexeddb";
import BookmarkSidebar from "@/components/reader/BookmarkSidebar";

type BookBlock = {
  type: "heading" | "paragraph" | "verse";
  text: string;
};

type BookMeta = {
  title: string;
  author: string;
};

type LocalBookmark = {
  id: string;
  position: number;
  quoteText?: string;
  note?: string;
  color?: string;
  type: "highlight" | "bookmark";
  label?: string;
};

export default function GutenbergReaderPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();
  const gutenbergId = resolvedParams.id;
  const containerRef = useRef<HTMLDivElement>(null);

  const [bookMeta, setBookMeta] = useState<BookMeta>({
    title: searchParams.get("title") || "Loading...",
    author: searchParams.get("author") || "Project Gutenberg",
  });
  const [bookBlocks, setBookBlocks] = useState<BookBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookmarkOpen, setBookmarkOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState<LocalBookmark[]>([]);
  const [cached, setCached] = useState(false);
  const [selection, setSelection] = useState<{ text: string; position: number } | null>(null);
  const [selectionCoords, setSelectionCoords] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(`gutenberg-progress-${gutenbergId}`);
    if (saved) {
      const { bookmarks: savedBookmarks } = JSON.parse(saved);
      if (savedBookmarks) setBookmarks(savedBookmarks);
    }
  }, [gutenbergId]);

  useEffect(() => { localStorage.setItem(`gutenberg-progress-${gutenbergId}`, JSON.stringify({ bookmarks })); }, [bookmarks, gutenbergId]);

  const saveProgress = useCallback(() => {
    if (!containerRef.current) return;
    const scroll = containerRef.current.scrollTop;
    const max = containerRef.current.scrollHeight - containerRef.current.clientHeight;
    const pct = max > 0 ? Math.round((scroll / max) * 100) : 0;
    localStorage.setItem(`gutenberg-position-${gutenbergId}`, String(pct));
  }, [gutenbergId]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const timer = setInterval(saveProgress, 5000);
    el.addEventListener("scroll", saveProgress, { passive: true });
    return () => { clearInterval(timer); el.removeEventListener("scroll", saveProgress); };
  }, [saveProgress]);

  useEffect(() => {
    async function loadBook() {
      try {
        const cachedData = await getCachedBook(gutenbergId);
        if (cachedData) {
          setBookMeta({ title: cachedData.title, author: cachedData.author });
          setBookBlocks(cachedData.blocks as BookBlock[]);
          setCached(true);
          setLoading(false);
          const saved = localStorage.getItem(`gutenberg-position-${gutenbergId}`);
          if (saved && containerRef.current) {
            const pct = parseInt(saved);
            const max = containerRef.current.scrollHeight - containerRef.current.clientHeight;
            containerRef.current.scrollTop = (pct / 100) * max;
          }
          return;
        }

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

        const txtUrl = `https://www.gutenberg.org/cache/epub/${gutenbergId}/pg${gutenbergId}.txt`;
        const textRes = await fetch(`/api/gutenberg/text?url=${encodeURIComponent(txtUrl)}`);
        if (!textRes.ok) throw new Error("Gagal memuat teks buku dari Project Gutenberg.");
        const data = await textRes.json();
        setBookBlocks(data.blocks);

        saveBookToCache({
          id: gutenbergId,
          title: bookMeta.title !== "Loading..." ? bookMeta.title : data.title || "Unknown",
          author: bookMeta.author !== "Project Gutenberg" ? bookMeta.author : "Unknown",
          blocks: data.blocks,
          cachedAt: Date.now(),
        });
      } catch (err: unknown) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Gagal memuat buku.");
      } finally {
        setLoading(false);
      }
    }
    loadBook();
  }, [gutenbergId]);

  useEffect(() => {
    if (!loading && bookBlocks.length > 0 && containerRef.current) {
      const saved = localStorage.getItem(`gutenberg-position-${gutenbergId}`);
      if (saved) {
        const pct = parseInt(saved);
        const max = containerRef.current.scrollHeight - containerRef.current.clientHeight;
        containerRef.current.scrollTop = Math.min((pct / 100) * max, max);
      }
    }
  }, [loading, bookBlocks, gutenbergId]);

  const handleTextSelect = () => {
    const sel = window.getSelection();
    if (!sel || !sel.toString().trim() || !containerRef.current) {
      setSelection(null);
      setSelectionCoords(null);
      return;
    }
    const text = sel.toString().trim();
    if (text.length < 2) { setSelection(null); setSelectionCoords(null); return; }
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    setSelection({ text, position: Math.round(containerRef.current.scrollTop) });
    setSelectionCoords({ x: rect.left + rect.width / 2 - containerRect.left, y: rect.top - containerRect.top - 10 });
  };

  const addHighlight = () => {
    if (!selection) return;
    const id = crypto.randomUUID();
    setBookmarks((prev) => [...prev, { id, position: selection.position, quoteText: selection.text, type: "highlight", color: "#FFEB3B" }]);
    setSelection(null);
    setSelectionCoords(null);
    window.getSelection()?.removeAllRanges();
  };

  const addBookmark = () => {
    if (!selection) return;
    const id = crypto.randomUUID();
    setBookmarks((prev) => [...prev, { id, position: selection.position, quoteText: selection.text, type: "bookmark", label: selection.text.slice(0, 40) }]);
    setSelection(null);
    setSelectionCoords(null);
    window.getSelection()?.removeAllRanges();
  };

  const goToPosition = (position: number) => {
    if (!containerRef.current) return;
    containerRef.current.scrollTop = position;
    setBookmarkOpen(false);
  };

  const deleteBookmark = (id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

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
      <div className="sticky top-0 bg-card/90 backdrop-blur-md border-b border-border p-4 flex items-center justify-between z-10 shadow-sm">
        <Link href="/gutenberg" className="p-2 bg-muted hover:bg-orange-500 hover:text-white rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 text-center truncate px-4">
          <h1 className="font-serif font-bold text-lg truncate">{bookMeta.title}</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest truncate">{bookMeta.author}</p>
        </div>
        <div className="flex items-center gap-1">
          {cached && <Check className="w-4 h-4 text-brand" />}
          <button onClick={() => setBookmarkOpen(!bookmarkOpen)} className="p-2 bg-muted rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-brand">
            <BookmarkPlus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div ref={containerRef} className="p-8 md:p-16 lg:px-24 max-w-none font-serif text-lg leading-loose relative h-[calc(100vh-73px)] overflow-y-auto" onMouseUp={handleTextSelect}>
        {selection && selectionCoords && (
          <div className="absolute z-20 bg-card border border-border rounded-xl shadow-lg p-1 flex gap-1" style={{ left: selectionCoords.x, top: selectionCoords.y, transform: "translate(-50%, -100%)" }}>
            <button onClick={addHighlight} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-yellow-400/20 text-yellow-600 hover:bg-yellow-400/40 flex items-center gap-1">
              <Highlighter className="w-3 h-3" /> Highlight
            </button>
            <button onClick={addBookmark} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-brand/20 text-brand hover:bg-brand/40 flex items-center gap-1">
              <BookmarkPlus className="w-3 h-3" /> Bookmark
            </button>
          </div>
        )}

        <div className="mb-16 text-center border-b border-border pb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 font-serif">{bookMeta.title}</h1>
          <h2 className="text-2xl text-muted-foreground font-serif italic">{bookMeta.author}</h2>
        </div>

        <div className="font-serif text-foreground/90">
          {bookBlocks.map((block, index) => {
            if (block.type === "heading") {
              return <h3 key={index} className="mt-14 mb-8 text-center text-3xl font-bold font-serif">{block.text}</h3>;
            }
            if (block.type === "verse") {
              return <p key={index} className="my-8 whitespace-pre-line text-center italic leading-9">{block.text}</p>;
            }
            return <p key={index} className="my-6 text-left leading-9 [text-indent:2rem] md:text-justify">{block.text}</p>;
          })}
        </div>
      </div>

      {bookmarkOpen && (
        <BookmarkSidebar bookmarks={bookmarks} onGoTo={goToPosition} onDelete={deleteBookmark} onClose={() => setBookmarkOpen(false)} />
      )}
    </div>
  );
}
