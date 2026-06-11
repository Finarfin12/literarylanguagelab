"use client";

import { useState } from "react";
import { Sparkles, Glasses, FileText, Wind, Wand2, FlaskConical, Hourglass, Hammer, Search, Loader2, Mic, MicOff } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Swal from "sweetalert2";
import { useSpeechToText } from "@/hooks/useSpeechToText";

const TOOLS = [
  { id: "dialect-diver", name: "The Dialect Diver", icon: Glasses, desc: "Pecahkan dialek, aksen, atau slang kuno karakter novel." },
  { id: "tone-analyzer", name: "Tone & Grammar", icon: FileText, desc: "Analisis tone, mood, dan struktur tata bahasa teks." },
  { id: "vibe-translator", name: "Vibe Translator", icon: Wind, desc: "Terjemahkan nuansa/vibe yang tak terucap dari teks." },
  { id: "mood-transformer", name: "Mood Transformer", icon: Wand2, desc: "Ubah total suasana teks (misal: romantis jadi horor)." },
  { id: "diction-lab", name: "Diction Lab", icon: FlaskConical, desc: "Eksperimen dengan diksi: ganti kata biasa menjadi puitis." },
  { id: "era-translator", name: "Era Translator", icon: Hourglass, desc: "Terjemahkan teks ke era sastra lain (Victorian, Noir, dll)." },
  { id: "sentence-architect", name: "Sentence Architect", icon: Hammer, desc: "Bedah arsitektur, sintaksis, dan ritme kalimat." },
  { id: "rhetorical-spotter", name: "Rhetorical Spotter", icon: Search, desc: "Temukan majas dan perangkat retorika tersembunyi." }
];

export default function LingoWiseClient() {
  const [text, setText] = useState("");
  const [activeMode, setActiveMode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const { isRecording, isProcessing, transcript, startRecording, stopRecording } = useSpeechToText({
    onComplete: (speechText) => {
      setText((prev) => prev + (prev.trim() ? " " : "") + speechText);
    }
  });

  const handleProcess = async (modeId: string) => {
    if (!text.trim()) {
      Swal.fire("Perhatian", "Masukkan teks terlebih dahulu!", "warning");
      return;
    }
    
    setActiveMode(modeId);
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/lingowise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mode: modeId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses");

      setResult(data.result);
    } catch (error: any) {
      Swal.fire("Gagal", error.message, "error");
      setActiveMode(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Input & Tools */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-card shadow-sm backdrop-blur-md border border-border rounded-3xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand/0 via-brand to-brand/0 opacity-50" />
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-serif font-bold text-foreground">Input Teks Sastra</h2>
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing}
              title="Dikte Teks (Voice to Text)"
              className={`p-2 rounded-xl transition-all ${
                isRecording 
                  ? "bg-red-500 text-white animate-pulse" 
                  : "bg-muted text-muted-foreground hover:bg-brand/10 hover:text-brand"
              }`}
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          </div>
          <textarea
            value={text + (isRecording ? (text.trim() ? " " : "") + transcript : "")}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste teks bahasa Inggris (kutipan novel, puisi, dll) di sini, atau tekan ikon Mic untuk mendikte..."
            className="w-full h-48 bg-background border border-border rounded-2xl p-4 text-foreground focus:ring-1 focus:ring-brand focus:border-brand focus:outline-none resize-none"
          ></textarea>
        </div>

        <div>
          <h2 className="text-xl font-serif font-bold text-foreground mb-4 px-2">Pilih LingoWise Tool</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TOOLS.map((tool) => {
              const Icon = tool.icon;
              const isActive = activeMode === tool.id;
              
              return (
                <button
                  key={tool.id}
                  onClick={() => handleProcess(tool.id)}
                  disabled={loading && !isActive}
                  className={`flex flex-col items-start p-5 rounded-2xl border transition-all duration-300 text-left relative overflow-hidden group
                    ${isActive 
                      ? "bg-brand/10 border-brand/50 shadow-[0_0_20px_rgba(62,207,142,0.2)]" 
                      : "bg-card shadow-sm backdrop-blur-md border-border hover:bg-card shadow-sm hover:-translate-y-1 hover:shadow-xl hover:border-border"}
                    ${loading && !isActive ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  <div className={`p-2 rounded-lg mb-3 ${isActive ? "bg-brand text-background" : "bg-muted text-brand group-hover:bg-brand/20 transition-colors"}`}>
                    {loading && isActive ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <h3 className={`font-bold mb-1 ${isActive ? "text-brand" : "text-foreground"}`}>{tool.name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{tool.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: Output */}
      <div className="lg:col-span-7">
        <div className="bg-card shadow-sm backdrop-blur-md border border-border rounded-3xl p-8 shadow-xl min-h-[600px] h-full flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Sparkles className="w-64 h-64" />
          </div>
          
          <div className="relative z-10 flex-1 flex flex-col">
            <h2 className="text-2xl font-serif font-bold text-foreground mb-6 flex items-center gap-3 border-b border-border pb-4">
              <Sparkles className="w-6 h-6 text-brand" /> 
              Laboratory Result
            </h2>
            
            {!activeMode && !result && !loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground">
                <FlaskConical className="w-16 h-16 mb-4 opacity-20" />
                <p>Pilih salah satu tool di samping untuk memulai eksperimen AI.</p>
              </div>
            ) : loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-brand">
                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                <p className="animate-pulse">AI sedang menganalisis teks Anda di laboratorium...</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-4 prose dark:prose-invert prose-brand max-w-none prose-headings:font-serif prose-headings:text-brand prose-p:leading-relaxed prose-p:text-foreground/90">
                {result && <ReactMarkdown>{result}</ReactMarkdown>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
