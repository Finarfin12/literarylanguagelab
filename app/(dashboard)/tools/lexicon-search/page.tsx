"use client";

import { useState, useEffect, Suspense } from "react";
import { Search, Volume2, BookMarked, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useSearchParams } from "next/navigation";
import Swal from "sweetalert2";

function SearchParamHandler({ onSearch }: { onSearch: (w: string) => void }) {
  const params = useSearchParams();
  useEffect(() => {
    const w = params.get("word");
    if (w) {
      onSearch(w);
    }
  }, [params]);
  return null;
}

export default function LexiconSearchPage() {
  const [word, setWord] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const performSearch = async (targetWord: string) => {
    if (!targetWord.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/lexicon-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: targetWord })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResult(data);
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: err.message || 'Gagal mencari kata tersebut.',
        background: '#1a1a1a',
        color: '#fff'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(word);
  };

  const autoSearch = (w: string) => {
    setWord(w);
    performSearch(w);
  };

  const playAudio = (url: string, fallbackText: string) => {
    if (url) {
      const fullUrl = url.startsWith("//") ? `https:${url}` : url;
      const audio = new Audio(fullUrl);
      audio.play().catch(e => {
        console.error("Audio play failed, falling back to TTS", e);
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(fallbackText);
          utterance.lang = "en-US";
          window.speechSynthesis.speak(utterance);
        }
      });
    } else if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(fallbackText);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSaveToLexicon = async () => {
    if (!result || !result.dictionary || result.dictionary.length === 0) return;
    setSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Anda harus login untuk menyimpan kata.");

      const dictData = result.dictionary[0];
      const meaning = dictData.meanings[0]?.definitions[0]?.definition || "Tidak ada definisi";
      
      // Ensure profile exists to satisfy foreign key constraints
      await supabase.from("profiles").upsert({ id: user.id }, { onConflict: 'id' }).select();

      const { error } = await supabase.from("vocabulary").insert({
        user_id: user.id,
        word: dictData.word,
        definition: meaning,
        context_sentence: result.translation ? `Terjemahan: ${result.translation}` : null,
      });

      if (error) throw error;

      Swal.fire({
        icon: 'success',
        title: 'Tersimpan!',
        text: `'${dictData.word}' berhasil ditambahkan ke Lexicon Anda.`,
        background: '#1a1a1a',
        color: '#fff',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: err.message,
        background: '#1a1a1a',
        color: '#fff'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Suspense fallback={null}>
        <SearchParamHandler onSearch={autoSearch} />
      </Suspense>
      
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-serif font-bold text-foreground flex items-center justify-center gap-3">
          <BookMarked className="w-8 h-8 text-brand" />
          Lexicon Search Engine
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Cari definisi, pelafalan, sinonim, rima, dan terjemahan secara instan.</p>
      </div>

      <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-12 group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="h-6 w-6 text-muted-foreground group-focus-within:text-brand transition-colors" />
        </div>
        <input
          type="text"
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="Ketik kata bahasa Inggris di sini..."
          className="w-full pl-14 pr-32 py-5 bg-card border border-foreground/20 rounded-2xl text-foreground text-xl shadow-md focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={loading || !word.trim()}
          className="absolute inset-y-2 right-2 px-6 bg-brand hover:bg-brand/90 text-background font-bold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Cari"}
        </button>
      </form>

      {result && result.dictionary && result.dictionary.length > 0 && (
        <div className="bg-card shadow-sm backdrop-blur-md border border-border rounded-3xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-border pb-8">
            <div>
              <h2 className="text-5xl font-serif font-bold text-brand mb-2">{result.dictionary[0].word}</h2>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="font-mono text-lg">{result.dictionary[0].phonetic}</span>
                
                {result.dictionary[0].phonetics?.find((p:any) => p.audio)?.audio ? (
                  <button 
                    onClick={() => playAudio(result.dictionary[0].phonetics.find((p:any) => p.audio).audio, result.dictionary[0].word)}
                    className="p-2 hover:bg-muted hover:bg-muted/80 rounded-full transition-colors text-brand"
                    title="Dengarkan Pelafalan"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                ) : (
                  <button 
                    onClick={() => playAudio("", result.dictionary[0].word)}
                    className="p-2 hover:bg-muted hover:bg-muted/80 rounded-full transition-colors text-brand"
                    title="Dengarkan Pelafalan"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            
            <button
              onClick={handleSaveToLexicon}
              disabled={saving}
              className="px-6 py-3 bg-muted hover:bg-muted hover:bg-muted/80 border border-border rounded-xl transition-all flex items-center gap-2 font-medium"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <BookMarked className="w-5 h-5 text-brand" />}
              Simpan ke Lexicon
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left Column: Dictionary Definitions */}
            <div className="lg:col-span-2 space-y-8">
              {result.dictionary[0].meanings.map((meaning: any, idx: number) => (
                <div key={idx} className="space-y-4">
                  <h3 className="text-xl font-bold text-foreground flex items-center gap-2 italic">
                    <div className="w-2 h-2 rounded-full bg-brand/50"></div>
                    {meaning.partOfSpeech}
                  </h3>
                  <ul className="space-y-4 pl-6">
                    {meaning.definitions.slice(0, 3).map((def: any, i: number) => (
                      <li key={i} className="list-disc text-muted-foreground text-lg leading-relaxed marker:text-muted-foreground">
                        {def.definition}
                        {def.example && (
                          <div className="mt-2 text-brand/80 italic text-base border-l-2 border-brand/20 pl-4 py-1">
                            "{def.example}"
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Right Column: API Integrations */}
            <div className="space-y-6">
              
              {/* LibreTranslate */}
              <div className="bg-muted border border-border rounded-2xl p-6">
                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Terjemahan
                </h4>
                {result.translation ? (
                  <p className="text-xl font-serif text-foreground">{result.translation}</p>
                ) : (
                  <p className="text-muted-foreground italic text-sm">Gagal memuat terjemahan.</p>
                )}
              </div>

              {/* Datamuse: Synonyms */}
              <div className="bg-muted border border-border rounded-2xl p-6">
                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  Sinonim
                </h4>
                {result.synonyms && result.synonyms.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {result.synonyms.map((syn: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-blue-500/10 text-blue-400 text-sm rounded-lg border border-blue-500/20">
                        {syn}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic text-sm">Tidak ada sinonim.</p>
                )}
              </div>

              {/* Datamuse: Rhymes */}
              <div className="bg-muted border border-border rounded-2xl p-6">
                <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Rima (Rhymes)
                </h4>
                {result.rhymes && result.rhymes.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {result.rhymes.map((rhy: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-purple-500/10 text-purple-400 text-sm rounded-lg border border-purple-500/20">
                        {rhy}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic text-sm">Tidak ada rima.</p>
                )}
              </div>

            </div>
          </div>

        </div>
      )}

      {result && (!result.dictionary || result.dictionary.length === 0) && (
        <div className="text-center py-20 bg-card shadow-sm backdrop-blur-md border border-border rounded-3xl mt-8">
          <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-serif text-muted-foreground">Kata tidak ditemukan di kamus.</h2>
          <p className="text-white/40 mt-2">Coba periksa kembali ejaan kata yang Anda masukkan.</p>
        </div>
      )}
    </div>
  );
}
