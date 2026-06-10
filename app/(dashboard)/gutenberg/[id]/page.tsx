"use client";

import { useState, useEffect, use, useRef, useCallback } from "react";
import { Loader2, ArrowLeft, Book, BookmarkPlus, Highlighter, Download, Check } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { saveBookToCache, getCachedBook } from "@/utils/indexeddb";
import BookmarkSidebar from "@/components/reader/BookmarkSidebar";
import TextDisplay from "@/components/reader/TextDisplay";

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

      <div className="flex-1 relative overflow-hidden flex flex-col h-[calc(100vh-73px)]">
        <TextDisplay 
          textId={`gutenberg_${gutenbergId}`}
          title={bookMeta.title}
          author={bookMeta.author}
          blocks={bookBlocks}
          onTextSelect={handleTextSelect}
        />
      </div>

      {bookmarkOpen && (
        <BookmarkSidebar bookmarks={bookmarks} onGoTo={goToPosition} onDelete={deleteBookmark} onClose={() => setBookmarkOpen(false)} />
      )}
    </div>
  );
}
