"use client";

import { useState, useEffect } from "react";
import { X, Save, Check, Loader2, BookA, Info, Quote } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface WordLookupSidebarProps {
  word: string | null;
  contextSentence: string | null;
  title: string;
  author: string;
  textId: string;
  onClose: () => void;
}

export default function WordLookupSidebar({ word, contextSentence, title, author, textId, onClose }: WordLookupSidebarProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
    if (!word) return;
    
    const fetchDefinition = async () => {
      setLoading(true);
      setError(null);
      setResult(null);
      setSaved(false);
      
      try {
        const res = await fetch("/api/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            word,
            contextSentence,
            title,
            author,
          }),
        });
        
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || "Failed to analyze word");
        
        setResult(data.result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDefinition();
  }, [word, contextSentence, title, author]);

  const handleSave = async () => {
    if (!word || !result) return;
    setSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await supabase.from("vocabulary").insert({
        user_id: user.id,
        word: word,
        definition: result, // For MVP we save the raw Groq response
        context_sentence: contextSentence,
        context_source: title,
        register: "Extracted by AI", // Will parse properly in Phase 2
      });
      
      if (error) throw error;
      setSaved(true);
    } catch (err: any) {
      alert("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between bg-card z-10">
        <h3 className="font-serif font-bold text-lg text-foreground flex items-center gap-2">
          <BookA className="w-5 h-5 text-brand" /> Word Analysis
        </h3>
        <button onClick={onClose} className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-white/5 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        {!word ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center">
            <Info className="w-12 h-12 mb-4 opacity-20" />
            <p>Highlight any word or phrase in the text to see its meaning and context.</p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center h-full text-brand space-y-4">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm text-muted-foreground animate-pulse">Consulting the literature...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            <p className="font-semibold mb-1">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <h2 className="text-3xl font-serif font-bold text-brand mb-2">{word}</h2>
              <div className="p-3 bg-white/5 border border-border rounded-lg relative">
                <Quote className="w-4 h-4 text-brand absolute top-3 left-3 opacity-50" />
                <p className="text-sm text-muted-foreground pl-6 italic">"{contextSentence}"</p>
              </div>
            </div>
            
            <div className="prose prose-sm prose-invert prose-p:leading-relaxed prose-headings:text-foreground max-w-none text-foreground">
              <div className="whitespace-pre-wrap">{result}</div>
            </div>
          </div>
        )}
      </div>
      
      {result && (
        <div className="p-4 border-t border-border bg-card">
          <button
            onClick={handleSave}
            disabled={saved || saving}
            className={`w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
              saved 
                ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                : 'bg-brand text-background hover:bg-brand-hover hover:scale-[1.02] active:scale-95'
            }`}
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
            ) : saved ? (
              <><Check className="w-4 h-4" /> Saved to Vocabulary</>
            ) : (
              <><Save className="w-4 h-4" /> Save to Vocabulary Bank</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
