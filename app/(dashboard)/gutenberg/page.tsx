"use client";

import { useState, useRef, useEffect } from "react";
import { BookOpen, Search, Loader2, ArrowRight, Sparkles, Database } from "lucide-react";
import Link from "next/link";

type SearchProvider = "openlibrary" | "gutendex";

type BookResult = {
  id: string;
  title: string;
  author: string;
  subjects: string[];
  coverUrl?: string;
  provider: SearchProvider;
};

type GutenbergBook = {
  id: number;
  title: string;
  authors: { name: string }[];
  subjects: string[];
  formats: Record<string, string>;
};

type GutendexSearchResponse = {
  results?: GutenbergBook[];
};

type OpenLibraryDoc = {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  subject?: string[];
  id_project_gutenberg?: string[];
  has_fulltext?: boolean;
  language?: string[];
};

type OpenLibrarySearchResponse = {
  numFound: number;
  docs: OpenLibraryDoc[];
};

function mapGutendex(book: GutenbergBook): BookResult {
  return {
    id: String(book.id),
    title: book.title,
    author: book.authors.map((a) => a.name.split(",").reverse().join(" ")).join(", "),
    subjects: book.subjects,
    coverUrl: book.formats["image/jpeg"],
    provider: "gutendex",
  };
}

function mapOpenLibrary(doc: OpenLibraryDoc): BookResult {
  return {
    id: doc.id_project_gutenberg?.[0] || "",
    title: doc.title,
    author: doc.author_name?.join(", ") || "Unknown",
    subjects: doc.subject?.slice(0, 5) || [],
    coverUrl: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
      : undefined,
    provider: "openlibrary",
  };
}

export default function GutenbergSearchPage() {
  const [provider, setProvider] = useState<SearchProvider>("openlibrary");
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<BookResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("gutenberg-provider") as SearchProvider | null;
    if (saved === "openlibrary" || saved === "gutendex") setProvider(saved);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) localStorage.setItem("gutenberg-provider", provider);
  }, [provider, mounted]);

  const searchBooks = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setHasSearched(true);
    setError("");
    setBooks([]);
    setPage(1);

    try {
      if (provider === "openlibrary") {
        const res = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&has_fulltext=true&fields=key,title,author_name,cover_i,first_publish_year,subject,id_project_gutenberg,has_fulltext,language&limit=20&page=1`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("OpenLibrary gagal merespons. Coba lagi sebentar.");
        const data = (await res.json()) as OpenLibrarySearchResponse;
        const results = (data.docs || [])
          .filter((d) => d.id_project_gutenberg && d.id_project_gutenberg.length > 0 && d.has_fulltext)
          .map(mapOpenLibrary);
        setBooks(results);
        setHasMore(data.numFound > 20);
      } else {
        const res = await fetch(
          `https://gutendex.com/books/?search=${encodeURIComponent(query)}&page=1`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("Gutendex gagal merespons. Coba ganti ke OpenLibrary.");
        const data = (await res.json()) as GutendexSearchResponse;
        const results = (data.results || [])
          .filter((book) => Object.keys(book.formats).some((k) => k.startsWith("text/plain")))
          .map(mapGutendex);
        setBooks(results);
        setHasMore(!!data.results?.length && data.results.length >= 32);
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error(err);
      setError(err instanceof Error ? err.message : "Gagal mencari buku.");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    const controller = new AbortController();

    setLoadingMore(true);
    try {
      if (provider === "openlibrary") {
        const res = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&has_fulltext=true&fields=key,title,author_name,cover_i,first_publish_year,subject,id_project_gutenberg,has_fulltext,language&limit=20&page=${nextPage}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("Gagal memuat lebih banyak.");
        const data = (await res.json()) as OpenLibrarySearchResponse;
        const results = (data.docs || [])
          .filter((d) => d.id_project_gutenberg && d.id_project_gutenberg.length > 0 && d.has_fulltext)
          .map(mapOpenLibrary);
        setBooks((prev) => [...prev, ...results]);
        setHasMore(data.numFound > nextPage * 20);
      } else {
        const res = await fetch(
          `https://gutendex.com/books/?search=${encodeURIComponent(query)}&page=${nextPage}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("Gagal memuat lebih banyak.");
        const data = (await res.json()) as GutendexSearchResponse;
        const results = (data.results || [])
          .filter((book) => Object.keys(book.formats).some((k) => k.startsWith("text/plain")))
          .map(mapGutendex);
        setBooks((prev) => [...prev, ...results]);
        setHasMore(!!data.results?.length && data.results.length >= 32);
      }
      setPage(nextPage);
    } catch {
      // silently fail for load more
    } finally {
      setLoadingMore(false);
    }
  };

  const getBookUrl = (book: BookResult) => {
    const params = new URLSearchParams();
    params.set("title", book.title);
    params.set("author", book.author);
    return `/gutenberg/${book.id}?${params.toString()}`;
  };

  if (!mounted) return null;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center p-4 bg-muted rounded-full mb-6">
          <BookOpen className="w-12 h-12 text-foreground" />
        </div>
        <h1 className="text-2xl md:text-4xl font-serif font-bold text-foreground">Public Domain Books</h1>
        <p className="text-muted-foreground mt-4 text-lg max-w-2xl mx-auto">
          Cari dan baca lebih dari 70.000+ buku sastra klasik secara gratis langsung dari arsip Project Gutenberg. Baca secara utuh, tanpa gangguan.
        </p>
      </div>

      {/* Provider Selector */}
      <div className="flex justify-center mb-6">
        <div className="bg-muted rounded-full p-1 flex gap-1">
          <button
            onClick={() => setProvider("openlibrary")}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-1.5 ${
              provider === "openlibrary"
                ? "bg-brand-solid text-on-brand shadow-lg"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            OpenLibrary
          </button>
          <button
            onClick={() => setProvider("gutendex")}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-1.5 ${
              provider === "gutendex"
                ? "bg-brand-solid text-on-brand shadow-lg"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Gutendex
          </button>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground -mt-4 mb-6">
        {provider === "openlibrary"
          ? "OpenLibrary: lebih cepat · jutaan buku · cover HD"
          : "Gutendex: ringan · 70.000+ buku klasik"}
      </p>

      <form onSubmit={searchBooks} className="mb-12 max-w-3xl mx-auto w-full relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={provider === "openlibrary"
            ? "Cari judul buku atau nama penulis via OpenLibrary..."
            : "Cari judul buku atau nama penulis via Gutendex..."}
          className="w-full bg-card border-2 border-border rounded-full py-4 pl-14 pr-32 text-lg focus:outline-none focus:border-border transition-colors shadow-sm"
        />
        <Search className="w-6 h-6 text-muted-foreground absolute left-5 top-1/2 -translate-y-1/2" />
        <button
          type="submit"
          disabled={loading}
          className="absolute right-2 top-2 bottom-2 px-4 md:px-8 bg-brand-solid text-on-brand font-bold rounded-full hover:bg-brand-hover transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search"}
        </button>
      </form>

      {loading && (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-12 h-12 text-foreground animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-xl font-serif text-foreground">{error}</p>
          <button
            onClick={() => { setProvider(provider === "gutendex" ? "openlibrary" : "gutendex"); setError(""); }}
            className="mt-4 px-6 py-2 bg-brand text-white font-bold rounded-full hover:bg-brand-hover transition-colors"
          >
            Coba lewat {provider === "gutendex" ? "OpenLibrary" : "Gutendex"} →
          </button>
        </div>
      )}

      {!loading && !error && hasSearched && books.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-xl font-serif">Tidak menemukan buku sastra yang cocok dengan pencarian Anda.</p>
        </div>
      )}

      {!loading && !error && books.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <div
                key={book.id}
                className="bg-card border border-border rounded-3xl p-6 flex flex-col justify-between hover:shadow-lg transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    {book.coverUrl ? (
                      <img src={book.coverUrl} alt="Cover" className="w-20 h-28 object-cover rounded-md shadow-md shrink-0" />
                    ) : (
                      <div className="w-20 h-28 bg-muted rounded-md border border-border flex items-center justify-center shrink-0">
                        <BookOpen className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-serif font-bold text-lg leading-tight mb-2 line-clamp-3">{book.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{book.author}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {book.subjects.slice(0, 2).map((sub, i) => (
                      <span
                        key={i}
                        className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-muted text-foreground rounded-full truncate max-w-full"
                      >
                        {sub.split("--")[0]}
                      </span>
                    ))}
                    {book.provider === "openlibrary" && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-muted text-brand-ink rounded-full">OL</span>
                    )}
                  </div>
                </div>

                <Link
                  href={getBookUrl(book)}
                  className="w-full py-3 bg-muted border border-border text-foreground font-bold rounded-xl flex justify-center items-center gap-2 hover:bg-brand-hover hover:border-border hover:text-white transition-colors"
                >
                  Baca Buku Full <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-4 md:px-8 py-3 bg-muted border border-border text-foreground font-bold rounded-full hover:bg-brand-hover hover:border-border hover:text-white transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                {loadingMore ? "Memuat..." : "Muat Lebih Banyak"}
              </button>
            </div>
          )}
        </>
      )}

      {!hasSearched && (
        <div className="text-center py-10 opacity-50">
          <p className="text-muted-foreground font-serif text-lg">Pustaka lebih dari 70.000 mahakarya sastra dunia berada di ujung jari Anda.</p>
        </div>
      )}
    </div>
  );
}
