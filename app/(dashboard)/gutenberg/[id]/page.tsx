"use client";

import { useState, useEffect, use, useRef, useCallback } from "react";
import { Loader2, ArrowLeft, Book, BookmarkPlus, Highlighter, Download, Check, Sparkles, BrainCircuit } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { saveBookToCache, getCachedBook } from "@/utils/indexeddb";
import BookmarkSidebar from "@/components/reader/BookmarkSidebar";
import TextDisplay from "@/components/reader/TextDisplay";
import ResponsivePanel from "@/components/ui/ResponsivePanel";
import SentenceAnalysisSidebar from "@/components/reader/SentenceAnalysisSidebar";
import TopActions from "@/components/TopActions";
import VocabFlashcardModal from "@/components/reader/VocabFlashcardModal";

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
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const closeAnalysis = useCallback(() => setAnalysisOpen(false), []);
  const closeBookmarks = useCallback(() => setBookmarkOpen(false), []);
  const [analysisSentence, setAnalysisSentence] = useState<string | null>(null);
  const [vocabContextText, setVocabContextText] = useState<string | null>(null);
  const [jumpTo, setJumpTo] = useState<{ block: number; nonce: number } | null>(null);
  const currentBlockRef = useRef(0);
  const handlePositionChange = useCallback((blockIndex: number) => {
    currentBlockRef.current = blockIndex;
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(`gutenberg-progress-${gutenbergId}`);
    if (saved) {
      const { bookmarks: savedBookmarks } = JSON.parse(saved);
      if (savedBookmarks) setBookmarks(savedBookmarks);
    }
  }, [gutenbergId]);

  useEffect(() => { localStorage.setItem(`gutenberg-progress-${gutenbergId}`, JSON.stringify({ bookmarks })); }, [bookmarks, gutenbergId]);

  useEffect(() => {
    async function loadBook() {
      try {
        const cachedData = await getCachedBook(gutenbergId);
        if (cachedData) {
          setBookMeta({ title: cachedData.title, author: cachedData.author });
          setBookBlocks(cachedData.blocks as BookBlock[]);
          setCached(true);
          setLoading(false);
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
    const blockEl = sel.anchorNode?.parentElement?.closest("[data-block-idx]");
    const position = blockEl ? Number(blockEl.getAttribute("data-block-idx")) : currentBlockRef.current;
    setSelection({ text, position });
    setSelectionCoords({ x: rect.left + rect.width / 2 - containerRect.left, y: rect.top - containerRect.top - 10 });
  };

  // Listener seleksi dipasang sekali; ref memastikan versi handler terbaru yang dipanggil
  const handleTextSelectRef = useRef(handleTextSelect);
  useEffect(() => {
    handleTextSelectRef.current = handleTextSelect;
  });
  const onTextSelect = useCallback(() => handleTextSelectRef.current(), []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    const handleSelectionChange = () => {
      clearTimeout(timer);
      timer = setTimeout(onTextSelect, 500); // 500ms debounce
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      clearTimeout(timer);
    };
  }, [onTextSelect]);

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

  const openAnalysis = () => {
    if (!selection) return;
    setAnalysisSentence(selection.text);
    setAnalysisOpen(true);
    setSelection(null);
    setSelectionCoords(null);
    window.getSelection()?.removeAllRanges();
  };

  const goToPosition = (position: number) => {
    setJumpTo({ block: position, nonce: Date.now() });
    setBookmarkOpen(false);
  };

  const deleteBookmark = (id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleGenerateVocab = () => {
    if (bookBlocks.length === 0) return;

    // Ambil ~50 blok di sekitar posisi baca saat ini
    const approxIndex = currentBlockRef.current;
    const startIndex = Math.max(0, approxIndex - 5);
    const endIndex = Math.min(bookBlocks.length, startIndex + 50);
    
    // Join text and truncate to avoid overwhelming API limits
    const textSample = bookBlocks.slice(startIndex, endIndex).map(b => b.text).join('\n').substring(0, 10000);
    setVocabContextText(textSample);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col justify-center items-center gap-4">
        <Loader2 className="w-12 h-12 text-foreground animate-spin" />
        <p className="text-muted-foreground animate-pulse font-serif">Mengambil buku raksasa dari arsip Gutenberg...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto text-center py-20">
        <h2 className="text-2xl font-bold text-foreground mb-2">Error</h2>
        <p className="text-muted-foreground">{error}</p>
        <Link href="/gutenberg" className="mt-6 inline-flex items-center gap-2 text-foreground hover:underline">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Pencarian
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-card min-h-screen lg:border-x border-border relative">
      <div className="sticky top-0 bg-card border-b border-border px-3 py-2 md:p-4 pr-24 sm:pr-32 flex items-center justify-between z-10">
        <Link href="/gutenberg" aria-label="Kembali ke pencarian" className="p-2.5 bg-muted hover:bg-brand-solid hover:text-on-brand rounded-full transition-colors shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 text-center truncate px-4">
          <h1 className="font-serif font-bold text-base md:text-lg truncate">{bookMeta.title}</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest truncate">{bookMeta.author}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <TopActions className="hidden sm:flex items-center gap-1 mr-2" />
          {cached && <Check className="w-4 h-4 text-brand-ink" />}
          <button onClick={handleGenerateVocab} className="p-2.5 bg-brand-tint text-brand-ink rounded-control hover:bg-brand-tint/70 transition-colors" title="Generate Chapter Vocab" aria-label="Kosa kata bab ini">
            <BrainCircuit className="w-4 h-4" />
          </button>
          <button onClick={() => setBookmarkOpen(!bookmarkOpen)} className="p-2.5 bg-muted rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-brand-ink" aria-label="Bookmark">
            <BookmarkPlus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden flex flex-col h-[calc(100dvh-57px-4rem)] md:h-[calc(100dvh-73px-4rem)] lg:h-[calc(100dvh-73px)]" ref={containerRef}>
        <TextDisplay 
          textId={`gutenberg_${gutenbergId}`}
          title={bookMeta.title}
          author={bookMeta.author}
          blocks={bookBlocks}
          onTextSelect={onTextSelect}
          onPositionChange={handlePositionChange}
          jumpTo={jumpTo}
        />
        
        {selectionCoords && selection && (
          <div 
            className="absolute z-50 flex items-center gap-1 bg-card border border-border shadow-[0_4px_16px_rgba(31,36,32,0.18)] rounded-control p-1 animate-in zoom-in-95 duration-200"
            style={{ 
              left: Math.max(10, selectionCoords.x - 60), 
              top: Math.max(10, selectionCoords.y - 50) 
            }}
          >
            <button onClick={addHighlight} className="p-2 hover:bg-muted text-warning-ink rounded-lg flex items-center gap-2 text-sm font-medium transition-colors" title="Highlight">
              <Highlighter className="w-4 h-4" /> <span className="hidden sm:inline">Sorot</span>
            </button>
            <div className="w-px h-6 bg-border mx-1"></div>
            <button onClick={addBookmark} className="p-2 hover:bg-muted text-brand-ink rounded-lg flex items-center gap-2 text-sm font-medium transition-colors" title="Bookmark">
              <BookmarkPlus className="w-4 h-4" /> <span className="hidden sm:inline">Tandai</span>
            </button>
            <div className="w-px h-6 bg-border mx-1"></div>
            <button onClick={openAnalysis} className="p-2 hover:bg-muted text-brand-ink rounded-lg flex items-center gap-2 text-sm font-medium transition-colors" title="Analisis">
              <Sparkles className="w-4 h-4" /> <span className="hidden sm:inline">Analisis</span>
            </button>
          </div>
        )}
      </div>

      {/* Sidebar Overlay: panel samping di ≥ lg, bottom sheet di HP */}
      <ResponsivePanel open={analysisOpen} onClose={closeAnalysis} label="Analisis Kalimat" width="450px" desktop="absolute">
        <SentenceAnalysisSidebar
          sentence={analysisSentence}
          title={bookMeta.title}
          author={bookMeta.author}
          onClose={closeAnalysis}
        />
      </ResponsivePanel>

      <BookmarkSidebar
        open={bookmarkOpen}
        onClose={closeBookmarks}
        bookmarks={bookmarks}
        onGoTo={goToPosition}
        onDelete={deleteBookmark}
      />

      {vocabContextText && (
        <VocabFlashcardModal 
          textContext={vocabContextText} 
          textId={`gutenberg-${gutenbergId}`} 
          onClose={() => setVocabContextText(null)} 
        />
      )}
    </div>
  );
}
