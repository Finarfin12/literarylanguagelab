"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, ArrowRight, Library, Hash } from "lucide-react";
import { useRouter } from "next/navigation";

const ALPHABETS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function AZDictionaryPage() {
  const [activeLetter, setActiveLetter] = useState("A");
  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchWords() {
      setLoading(true);
      try {
        // Fetch up to 300 words starting with the letter. Include definitions (md=d)
        const res = await fetch(`https://api.datamuse.com/words?sp=${activeLetter.toLowerCase()}*&max=200&md=d`);
        const data = await res.json();
        
        // Filter out words with spaces or hyphens to keep it strictly single words
        const filtered = data.filter((item: any) => /^[a-zA-Z]+$/.test(item.word));
        setWords(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchWords();
  }, [activeLetter]);

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-full flex flex-col">
      <div className="mb-10 text-center animate-in fade-in slide-in-from-bottom-4">
        <h1 className="text-4xl font-serif font-bold text-foreground flex items-center justify-center gap-3">
          <Library className="w-8 h-8 text-blue-400" />
          A-Z Dictionary Browser
        </h1>
        <p className="text-muted-foreground mt-2 text-lg max-w-2xl mx-auto">
          Jelajahi ribuan kata bahasa Inggris secara alfabetis. Klik kata untuk melihat definisinya secara lengkap.
        </p>
      </div>

      {/* A-Z Sticky Nav */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-y border-white/10 py-4 mb-8">
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mx-auto">
          {ALPHABETS.map((letter) => (
            <button
              key={letter}
              onClick={() => setActiveLetter(letter)}
              className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center transition-all ${
                activeLetter === letter
                  ? "bg-brand text-background shadow-[0_0_15px_rgba(62,207,142,0.4)] scale-110"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
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
            className="w-full bg-background/50 border border-white/10 focus:border-brand/50 rounded-2xl py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand/50 transition-all"
          />
        </div>
      </div>

      <div className="flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-10 h-10 animate-spin text-brand mb-4" />
            <p className="animate-pulse">Mengambil daftar kata berawalan {activeLetter}...</p>
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
                  className="bg-card/40 backdrop-blur-md border border-white/5 hover:border-brand/30 p-5 rounded-2xl cursor-pointer group hover:bg-card/80 transition-all hover:-translate-y-1 hover:shadow-xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-4 h-4 text-brand" />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-brand group-hover:text-brand-hover mb-2 capitalize">{item.word}</h3>
                  {defSnippet ? (
                    <p className="text-xs text-muted-foreground line-clamp-2 italic">{defSnippet}</p>
                  ) : (
                    <p className="text-xs text-white/20 italic">Klik untuk melihat definisi</p>
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
