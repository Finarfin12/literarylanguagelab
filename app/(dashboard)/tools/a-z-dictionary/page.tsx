"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, ArrowRight, Library, Hash } from "lucide-react";
import { useRouter } from "next/navigation";

const ALPHABETS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function AZDictionaryPage() {
  const [activeLetter, setActiveLetter] = useState("A");
  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    async function fetchWords() {
      setLoading(true);
      setLoadError("");
      try {
        // Lewat server (/api/dictionary/browse): daftar kata berawalan huruf, di-cache, dan tidak terhalang jaringan pengguna
        const res = await fetch(`/api/dictionary/browse?letter=${activeLetter.toLowerCase()}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Gagal memuat daftar kata.");
        if (!cancelled) setWords(data.words || []);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setWords([]);
          setLoadError(err instanceof Error ? err.message : "Gagal memuat daftar kata.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchWords();
    return () => {
      cancelled = true;
    };
  }, [activeLetter, reloadKey]);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-full flex flex-col">
      <div className="mb-10 text-center animate-in fade-in slide-in-from-bottom-4">
        <h1 className="text-[28px] md:text-4xl leading-[1.15] font-serif font-medium text-foreground flex items-center justify-center gap-3">
          <Library className="w-8 h-8 text-brand-ink" />
          A-Z Dictionary Browser
        </h1>
        <p className="text-muted-foreground mt-2 text-lg max-w-2xl mx-auto">
          Jelajahi ribuan kata bahasa Inggris secara alfabetis. Klik kata untuk melihat definisinya secara lengkap.
        </p>
      </div>

      {/* A-Z Sticky Nav */}
      <div className="sticky top-0 z-20 bg-background border-y border-border py-4 mb-8">
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
          {ALPHABETS.map((letter) => (
            <button
              key={letter}
              onClick={() => setActiveLetter(letter)}
              className={`w-11 h-11 rounded-control font-bold flex items-center justify-center transition-all ${
                activeLetter === letter
                  ? "bg-brand-solid text-on-brand scale-110"
                  : "bg-muted text-muted-foreground hover:bg-muted  hover:text-foreground"
              }`}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto mb-6 w-full px-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder={`Cari kata berawalan ${activeLetter}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-background border border-border focus:border-brand/50 rounded-card py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand/50 transition-all"
          />
        </div>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-10 h-10 animate-spin text-brand-ink mb-4" />
            <p className="animate-pulse">Mengambil daftar kata berawalan {activeLetter}...</p>
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
            <Hash className="w-12 h-12 opacity-30 mb-4" />
            <p className="font-bold text-foreground">Daftar kata tidak dapat dimuat.</p>
            <p className="text-sm mt-1">{loadError} Ini bukan berarti kamusnya kosong.</p>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="mt-6 min-h-[44px] px-6 bg-brand-solid text-on-brand font-bold rounded-control"
            >
              Coba lagi
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-8 duration-500 pb-8">
            {words.filter(w => w.word.toLowerCase().includes(searchTerm.toLowerCase())).map((item, idx) => {
              // Extract a short definition snippet if available
              let defSnippet = "";
              if (item.defs && item.defs.length > 0) {
                const rawDef = item.defs[0].split("\t")[1]; // Datamuse format: "n\tdefinition"
                defSnippet = rawDef ? rawDef : "";
              }

              return (
                <div 
                  key={item.word + idx} 
                  onClick={() => router.push(`/tools/lexicon-search?word=${item.word}`)}
                  className="bg-card border border-border hover:border-brand/30 p-5 rounded-card cursor-pointer group hover:bg-card transition-all relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-4 h-4 text-brand-ink" />
                  </div>
                  <h3 className="text-xl font-serif font-medium text-brand-ink group-hover:text-brand-hover mb-2 capitalize">{item.word}</h3>
                  {defSnippet ? (
                    <p className="text-xs text-muted-foreground line-clamp-2 italic">{defSnippet}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Klik untuk melihat definisi</p>
                  )}
                </div>
              );
            })}
            {words.filter(w => w.word.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
              <div className="col-span-full text-center py-20 text-muted-foreground">
                <Hash className="w-12 h-12 opacity-20 mx-auto mb-4" />
                <p>Tidak ada kata yang ditemukan untuk "{searchTerm || activeLetter}".</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
