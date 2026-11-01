"use client";

import TryExampleButton from "@/components/ui/TryExampleButton";
import { UNTRANSLATABLES_EXAMPLE } from "@/lib/tool-examples";
import { useState } from "react";
import { Globe2, Search, ArrowRight, Loader2, Library, Info, Lightbulb, Sparkles } from "lucide-react";
import Swal from "sweetalert2";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function UntranslatablesPage() {
  const [word, setWord] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/untranslatables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResult(data.result);
    } catch (error: any) {
      console.error(error);
      Swal.fire("Gagal", "Error: " + error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center p-4 bg-muted rounded-full mb-6">
          <Globe2 className="w-12 h-12 text-foreground" />
        </div>
        <h1 className="text-[28px] md:text-4xl leading-[1.15] font-serif font-medium text-foreground">Untranslatables Explorer</h1>
        <p className="text-muted-foreground mt-4 text-lg">Eksplorasi strategi penerjemahan untuk kata-kata bahasa Inggris yang tidak memiliki padanan langsung dalam bahasa Indonesia.</p>
      </div>

      <div className="max-w-2xl mx-auto w-full mb-2">
        <TryExampleButton example={UNTRANSLATABLES_EXAMPLE} onFill={setWord} />
      </div>
      <form onSubmit={handleSearch} className="mb-12 relative max-w-2xl mx-auto w-full">
        <input 
          type="text" 
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="Contoh: wistful, serendipity, schadenfreude..." 
          className="w-full bg-background border border-border rounded-card py-4 pl-6 pr-32 text-lg focus:outline-none focus:border-border focus:ring-1 focus:ring-border "
        />
        <button 
          type="submit"
          disabled={loading || !word}
          className="absolute right-2 top-2 bottom-2 px-6 bg-brand-solid text-on-brand font-bold rounded-control hover:bg-brand-hover transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5"/> Explore</>}
        </button>
      </form>

      {result && (
        <div className="bg-card border border-border rounded-card p-4 md:p-8 animate-in fade-in slide-in-from-bottom-8">
          <h2 className="text-2xl font-serif font-medium text-foreground mb-6 border-b border-border pb-4">Strategy & Analysis</h2>
          <div className="prose dark:prose-invert prose-teal max-w-none prose-headings:font-serif prose-headings:text-foreground">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
