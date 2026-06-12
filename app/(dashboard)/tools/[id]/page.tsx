"use client";

import Swal from 'sweetalert2';
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Play, Copy, Volume2, VolumeX, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { TOOLS } from "@/lib/tools-config";
import GraphViewer from "@/components/GraphViewer";
import PronunciationLab from "@/components/PronunciationLab";

export default function ToolExecutionPage() {
  const { id } = useParams();
  const router = useRouter();
  const tool = TOOLS.find(t => t.id === id);

  const [text, setText] = useState("");
  const [configValue, setConfigValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (tool?.options?.length) {
      setConfigValue(tool.options[0]);
    }
  }, [tool]);

  if (!tool) {
    return <div className="p-8 text-center text-red-500">Tool not found</div>;
  }

  const handleExecute = async () => {
    if (!text.trim()) {
      Swal.fire({ title: "Perhatian", text: "Masukkan teks terlebih dahulu!", icon: "info", confirmButtonColor: "#2fa16b" });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/tools/dynamic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId: tool.id, text, configValue }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResult(data.result);
    } catch (error: any) {
      Swal.fire({ title: "Informasi", text: String(error.message), icon: "warning", confirmButtonColor: "#2fa16b" });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      Swal.fire({ title: "Perhatian", text: "Teks disalin ke clipboard!", icon: "info", confirmButtonColor: "#2fa16b" });
    }
  };

  const handleTTS = () => {
    if (!result) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      // Remove markdown chars for better TTS reading
      const cleanText = result.replace(/[#*_`]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = "id-ID";
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleExportPDF = async () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto min-h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button onClick={() => router.push("/tools")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Toolkits
      </button>

      <div className="mb-10 border-b border-border pb-6">
        <h1 className="text-4xl font-serif font-bold text-foreground">{tool.title}</h1>
        <p className="text-muted-foreground mt-2 text-lg">{tool.description}</p>
      </div>

      {tool.id === "pronunciation-clinic" ? (
        <PronunciationLab />
      ) : (
        <div className="grid grid-cols-1 gap-8">
        <div className="bg-card shadow-sm backdrop-blur-md border border-border rounded-3xl p-5 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand/0 via-brand to-brand/0 opacity-50" />
          
          {tool.type === "dropdown" && tool.options && (
            <div className="mb-6">
              <label className="block text-sm font-bold text-brand uppercase tracking-wider mb-3">Pilih Mode Analisis / Target</label>
              <select 
                value={configValue}
                onChange={(e) => setConfigValue(e.target.value)}
                className="w-full bg-background border border-foreground/20 rounded-xl p-4 text-foreground focus:ring-2 focus:ring-brand focus:border-transparent outline-none cursor-pointer shadow-sm"
              >
                {tool.options.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-bold text-foreground uppercase tracking-wider mb-3">Input Text (English)</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the target text here..."
              className="w-full h-48 bg-background border border-border rounded-2xl p-3 sm:p-4 text-foreground font-serif focus:ring-1 focus:ring-brand focus:border-brand focus:outline-none resize-none"
            ></textarea>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleExecute}
              disabled={loading}
              className="px-8 py-4 bg-brand text-background font-bold rounded-xl hover:shadow-[0_0_20px_rgba(62,207,142,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
              Eksekusi {tool.title}
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-card shadow-sm backdrop-blur-2xl border border-border rounded-3xl p-5 sm:p-8 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center justify-between mb-6 border-b border-border pb-4">
              <h2 className="text-2xl font-serif font-bold text-brand">Analysis Result</h2>
              <div className="flex items-center gap-2">
                <button onClick={handleTTS} className="p-2 rounded-xl bg-muted hover:bg-muted hover:bg-muted/80 text-foreground transition-colors" title="Read Aloud">
                  {isSpeaking ? <VolumeX className="w-4 h-4 text-brand" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button onClick={handleCopy} className="p-2 rounded-xl bg-muted hover:bg-muted hover:bg-muted/80 text-foreground transition-colors" title="Copy Text">
                  <Copy className="w-4 h-4" />
                </button>
                <button onClick={handleExportPDF} className="p-2 rounded-xl bg-muted hover:bg-brand/20 text-foreground hover:text-brand transition-colors" title="Export PDF">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div id="result-content" className="prose dark:prose-invert prose-brand max-w-none prose-p:leading-relaxed prose-headings:font-serif p-4">
              <div className="mb-4 text-center pb-4 border-b border-border opacity-0 print:opacity-100 hidden print:block">
                <h1 className="text-3xl font-serif text-brand">{tool.title}</h1>
                <p className="text-muted-foreground">Generated by Literary Language Lab</p>
              </div>
              {tool.id === "semantic-map" ? (
                <GraphViewer data={result} />
              ) : (
                <ReactMarkdown>{result}</ReactMarkdown>
              )}
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
