"use client";

import { useState, useRef } from "react";
import { BookOpen, Search, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

type GutenbergAuthor = {
  name: string;
};

type GutenbergBook = {
  id: number;
  title: string;
  authors: GutenbergAuthor[];
  subjects: string[];
  formats: Record<string, string>;
};

type GutendexSearchResponse = {
  results?: GutenbergBook[];
};

export default function GutenbergSearchPage() {
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<GutenbergBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const searchBooks = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setHasSearched(true);
    setError("");
    try {
      const res = await fetch(`/api/gutenberg/search?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("Gagal menghubungi Gutendex. Coba lagi sebentar.");
      const data = (await res.json()) as GutendexSearchResponse;
      // Filter out books without text/plain format
      const results = Array.isArray(data.results) ? data.results : [];
      const validBooks = results.filter((book) =>
        Object.keys(book.formats).some(key => key.startsWith("text/plain"))
      );
      setBooks(validBooks.slice(0, 20));
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error(err);
      setBooks([]);
      setError(err instanceof Error ? err.message : "Gagal mencari buku.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center p-4 bg-orange-500/10 rounded-full mb-6">
          <BookOpen className="w-12 h-12 text-orange-500" />
        </div>
        <h1 className="text-4xl font-serif font-bold text-foreground">Public Domain Books</h1>
        <p className="text-muted-foreground mt-4 text-lg max-w-2xl mx-auto">
          Cari dan baca lebih dari 70.000+ buku sastra klasik secara gratis langsung dari arsip Project Gutenberg. Baca secara utuh, tanpa gangguan.
        </p>
      </div>

      <form onSubmit={searchBooks} className="mb-12 max-w-3xl mx-auto w-full relative">
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari judul buku atau nama penulis (misal: Shakespeare, Austen, Moby Dick)..."
          className="w-full bg-card border-2 border-border rounded-full py-4 pl-14 pr-32 text-lg focus:outline-none focus:border-orange-500 transition-colors shadow-sm"
        />
        <Search className="w-6 h-6 text-muted-foreground absolute left-5 top-1/2 -translate-y-1/2" />
        <button 
          type="submit" 
          disabled={loading}
          className="absolute right-2 top-2 bottom-2 px-8 bg-orange-500 text-white font-bold rounded-full hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search"}
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-xl font-serif text-rose-500">{error}</p>
        </div>
      ) : hasSearched && books.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-xl font-serif">Tidak menemukan buku sastra yang cocok dengan pencarian Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => {
            // Extract the Gutenberg ID
            const bookId = book.id;
            
            return (
              <div key={book.id} className="bg-card border border-border rounded-3xl p-6 flex flex-col justify-between hover:shadow-lg transition-all hover:-translate-y-1">
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    {book.formats["image/jpeg"] ? (
                      <img src={book.formats["image/jpeg"]} alt="Cover" className="w-20 h-28 object-cover rounded-md shadow-md shrink-0" />
                    ) : (
                      <div className="w-20 h-28 bg-muted rounded-md border border-border flex items-center justify-center shrink-0">
                        <BookOpen className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-serif font-bold text-lg leading-tight mb-2 line-clamp-3">{book.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {book.authors.map((a) => a.name.split(',').reverse().join(' ')).join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {book.subjects.slice(0, 2).map((sub: string, i: number) => (
                      <span key={i} className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-orange-500/10 text-orange-600 rounded-full truncate max-w-full">
                        {sub.split('--')[0]}
                      </span>
                    ))}
                  </div>
                </div>
                
                <Link 
                  href={`/gutenberg/${bookId}`}
                  className="w-full py-3 bg-muted border border-border text-foreground font-bold rounded-xl flex justify-center items-center gap-2 hover:bg-orange-500 hover:border-orange-500 hover:text-white transition-colors"
                >
                  Baca Buku Full <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
      
      {!hasSearched && (
        <div className="text-center py-10 opacity-50">
          <p className="text-muted-foreground font-serif text-lg">Pustaka lebih dari 70.000 mahakarya sastra dunia berada di ujung jari Anda.</p>
        </div>
      )}
    </div>
  );
}
