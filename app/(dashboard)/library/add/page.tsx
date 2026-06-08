"use client";

import { useState } from "react";
import { addText } from "../actions";
import SubmitButton from "@/components/ui/SubmitButton";
import { Sparkles, PenTool, BookOpen, Loader2 } from "lucide-react";
import Swal from "sweetalert2";

export default function AddTextPage() {
  const [mode, setMode] = useState<"manual" | "ai">("ai");
  const [generating, setGenerating] = useState(false);
  
  // Form states
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [difficulty, setDifficulty] = useState("3");
  const [prompt, setPrompt] = useState("");

  const handleGenerate = async () => {
    if (!prompt) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Generation failed");
      
      setTitle(data.title);
      setAuthor(data.author);
      setContent(data.content);
      setDifficulty(data.difficulty.toString());
      
      Swal.fire({
        title: "Magic Complete!",
        text: "Karya sastra berhasil dibuat. Silakan tinjau dan simpan.",
        icon: "success",
        background: "#1c1c1c",
        color: "#ededed",
        confirmButtonColor: "#3ecf8e",
      });
    } catch (error: any) {
      Swal.fire({
        title: "Generation Error",
        text: error.message,
        icon: "error",
        background: "#1c1c1c",
        color: "#ededed",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-10">
        <h1 className="text-4xl font-serif font-bold text-foreground">Add New Text</h1>
        <p className="text-muted-foreground mt-2">Tambahkan teks sastra ke Library, baik dengan menulis sendiri atau meminta bantuan AI.</p>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden mb-10">
        <div className="flex border-b border-border">
          <button 
            onClick={() => setMode("ai")}
            className={`flex-1 py-4 px-6 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${mode === "ai" ? "bg-brand/10 text-brand border-b-2 border-brand" : "text-muted-foreground hover:bg-white/5"}`}
          >
            <Sparkles className="w-4 h-4" /> AI Generator
          </button>
          <button 
            onClick={() => setMode("manual")}
            className={`flex-1 py-4 px-6 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${mode === "manual" ? "bg-blue-500/10 text-blue-400 border-b-2 border-blue-400" : "text-muted-foreground hover:bg-white/5"}`}
          >
            <PenTool className="w-4 h-4" /> Manual Entry
          </button>
        </div>

        <div className="p-8">
          {mode === "ai" && (
            <div className="mb-10 bg-brand/5 border border-brand/20 rounded-xl p-6">
              <label className="block text-sm font-medium text-brand mb-2">Prompt (Ide Cerita)</label>
              <div className="flex flex-col md:flex-row gap-4">
                <input 
                  type="text" 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Contoh: Sebuah puisi gelap tentang kastil tua di Skotlandia bergaya Edgar Allan Poe..."
                  className="flex-1 rounded-xl border border-white/10 bg-background/50 px-4 py-3 text-foreground focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
                <button 
                  onClick={handleGenerate}
                  disabled={generating || !prompt}
                  className="px-6 py-3 rounded-xl bg-brand text-background font-bold hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                >
                  {generating ? <><Loader2 className="w-4 h-4 animate-spin"/> Generating...</> : <><Sparkles className="w-4 h-4"/> Generate</>}
                </button>
              </div>
            </div>
          )}

          <form action={addText} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Judul</label>
                <input 
                  name="title"
                  type="text" 
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-background/50 px-4 py-3 text-foreground focus:border-brand focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Penulis</label>
                <input 
                  name="author"
                  type="text" 
                  required
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-background/50 px-4 py-3 text-foreground focus:border-brand focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2 flex justify-between">
                <span>Tingkat Kesulitan Kosakata</span>
                <span className="text-brand">Level {difficulty}</span>
              </label>
              <input 
                name="difficulty"
                type="range" 
                min="1" max="5"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full accent-brand"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1 (Mudah)</span>
                <span>5 (Sangat Sulit)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Isi Teks / Cerita</label>
              <textarea 
                name="content"
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                className="w-full rounded-xl border border-white/10 bg-background/50 px-4 py-3 text-foreground font-serif leading-relaxed focus:border-brand focus:outline-none resize-y"
              ></textarea>
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <SubmitButton className="px-8 py-3 rounded-xl bg-foreground text-background font-bold hover:bg-muted transition-all shadow-lg">
                Simpan ke Library
              </SubmitButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
