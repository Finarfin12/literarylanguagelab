"use client";

import Markdown from "@/components/ui/Markdown";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, Loader2, Mic, MicOff, Volume2, MessageSquare, Star, CheckCircle, XCircle, ArrowRight, Lightbulb, Trophy, Coffee, Briefcase, Plane, Building, Stethoscope, UtensilsCrossed, Users, Headphones } from "lucide-react";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { DIALOGUE_SCENARIOS, type DialogueScenario } from "@/lib/dialogue-scenarios";
import { helpFor, phraseMeaning, resolveBeginnerHelp } from "@/lib/dialogue-help";
import { createClient } from "@/utils/supabase/client";
import Swal from "sweetalert2";

const ICON_MAP: Record<string, any> = { Coffee, Briefcase, Plane, Building, Stethoscope, UtensilsCrossed, Users, Headphones };

interface ChatMessage { role: "user" | "assistant"; content: string; }

interface Feedback {
  fluency_score: number;
  grammar_score: number;
  vocabulary_score: number;
  overall_feedback_id: string;
  corrections: { original: string; corrected: string; explanation_id: string }[];
  vocabulary_suggestions: { used: string; better: string; context_id: string }[];
  cultural_tip: string;
  strengths: string[];
}

function ScoreBadge({ label, score }: { label: string; score: number }) {
  const color = score >= 80 ? "text-brand-ink bg-brand-tint border-brand/30" : score >= 60 ? "text-warning-ink bg-warning-tint border-warning-ink/30" : "text-danger bg-danger-tint border-danger/30";
  return (
    <div className={`rounded-card border p-4 text-center ${color}`}>
      <p className="text-3xl font-bold">{score}</p>
      <p className="text-xs font-bold uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}

export default function DialogueSimulatorPage() {
  const [activeScenario, setActiveScenario] = useState<DialogueScenario | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Bantuan pemula (Fase 22.3): bawaan menyala untuk A1, mati untuk lainnya; pilihan pengguna diingat di perangkat
  const [beginnerHelp, setBeginnerHelp] = useState(false);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translating, setTranslating] = useState<string | null>(null);
  const [translateError, setTranslateError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let stored: string | null = null;
      try { stored = localStorage.getItem("dialogue_beginner_help"); } catch { /* storage diblokir: pakai bawaan */ }
      let cefr: string | null = null;
      if (stored !== "on" && stored !== "off") {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from("profiles").select("cefr_level").eq("id", user.id).maybeSingle();
          cefr = (data?.cefr_level as string | null) ?? null;
        }
      }
      if (!cancelled) setBeginnerHelp(resolveBeginnerHelp(stored, cefr));
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dibaca sekali saat halaman dibuka
  }, []);

  const toggleBeginnerHelp = () => {
    const next = !beginnerHelp;
    setBeginnerHelp(next);
    try { localStorage.setItem("dialogue_beginner_help", next ? "on" : "off"); } catch { /* tidak diingat */ }
  };

  // Terjemahan balasan AI: dimuat saat diklik, disimpan selama sesi supaya tidak mengulang panggilan
  const translateReply = async (text: string) => {
    if (translations[text] || translating) return;
    setTranslating(text);
    setTranslateError(null);
    try {
      const res = await fetch("/api/dialogue-simulator/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Terjemahan gagal.");
      setTranslations((prev) => ({ ...prev, [text]: data.translation }));
    } catch (err: unknown) {
      setTranslateError(err instanceof Error ? err.message : "Terjemahan gagal. Coba lagi.");
    } finally {
      setTranslating(null);
    }
  };

  const { isRecording, isProcessing, transcript, startRecording, stopRecording } = useSpeechToText({
    onComplete: (speechText) => setInputText(speechText),
  });

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const playTTS = async (text: string) => {
    const ttsEngine = localStorage.getItem("tts_engine") || "browser";
    if (ttsEngine === "groq") {
      try {
        const res = await fetch("/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
        if (res.ok) { const blob = await res.blob(); new Audio(URL.createObjectURL(blob)).play(); return; }
      } catch { /* fallback */ }
    }
    if (window.speechSynthesis) { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = "en-US"; u.rate = 0.9; window.speechSynthesis.speak(u); }
  };

  const startScenario = (scenario: DialogueScenario) => {
    setActiveScenario(scenario);
    setMessages([{ role: "assistant", content: scenario.openingLine }]);
    setFeedback(null);
    playTTS(scenario.openingLine);
  };

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || !activeScenario || loading) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText("");
    setLoading(true);

    try {
      const res = await fetch("/api/dialogue-simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId: activeScenario.id, messages: updatedMessages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const aiMsg: ChatMessage = { role: "assistant", content: data.reply };
      setMessages(prev => [...prev, aiMsg]);
      playTTS(data.reply);
    } catch (err: any) {
      Swal.fire({ title: "Error", text: err.message, icon: "error", confirmButtonColor: "#2fa16b" });
    } finally { setLoading(false); }
  };

  const endAndGetFeedback = async () => {
    if (!activeScenario) return;
    const userMsgs = messages.filter(m => m.role === "user").map(m => m.content);
    if (userMsgs.length === 0) { Swal.fire({ title: "Perhatian", text: "Anda belum bicara sama sekali!", icon: "warning", confirmButtonColor: "#2fa16b" }); return; }

    setLoadingFeedback(true);
    try {
      const res = await fetch("/api/dialogue-simulator/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: activeScenario.title, userMessages: userMsgs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFeedback(data);

      // Save to Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("dialogue_sessions").insert({
          user_id: user.id,
          scenario_id: activeScenario.id,
          scenario_title: activeScenario.title,
          messages: messages,
          fluency_score: data.fluency_score,
          grammar_score: data.grammar_score,
          vocabulary_score: data.vocabulary_score,
          feedback: data,
        });
      }
    } catch (err: any) {
      Swal.fire({ title: "Error", text: err.message, icon: "error", confirmButtonColor: "#2fa16b" });
    } finally { setLoadingFeedback(false); }
  };

  // ── Scenario Picker ──
  if (!activeScenario) {
    const categories = [...new Set(DIALOGUE_SCENARIOS.map(s => s.category))];
    return (
      <div className="p-4 sm:p-8 max-w-6xl mx-auto min-h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-8">
          <h1 className="text-[28px] md:text-4xl leading-[1.15] font-serif font-medium text-foreground flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-brand-ink" /> Dialogue Simulator
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Pilih skenario kehidupan nyata dan latihan berbicara bahasa Inggris dengan AI.</p>
        </div>
        {categories.map(cat => (
          <div key={cat} className="mb-8">
            <h2 className="text-lg font-bold text-foreground mb-4 uppercase tracking-wider">{cat}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {DIALOGUE_SCENARIOS.filter(s => s.category === cat).map(scenario => {
                const Icon = ICON_MAP[scenario.icon] || MessageSquare;
                const diffColor = ["A1", "A2"].includes(scenario.difficulty) ? "bg-brand-tint text-brand-ink border-brand/30" : ["B1", "B2"].includes(scenario.difficulty) ? "bg-warning-tint text-warning-ink border-warning-ink/30" : "bg-danger-tint text-danger border-danger/30";
                return (
                  <button key={scenario.id} onClick={() => startScenario(scenario)} className="bg-card border border-border rounded-card p-6 text-left hover:border-brand/50 transition-all group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-brand-tint rounded-control"><Icon className="w-5 h-5 text-brand-ink" /></div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${diffColor} uppercase tracking-wider`}>{scenario.difficulty}</span>
                    </div>
                    <h3 className="font-bold text-foreground mb-1 group-hover:text-brand-ink transition-colors">{scenario.title}</h3>
                    <p className="text-xs text-muted-foreground">{scenario.descriptionId}</p>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Feedback View ──
  if (feedback) {
    return (
      <div className="p-4 sm:p-8 max-w-3xl mx-auto min-h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button onClick={() => { setActiveScenario(null); setMessages([]); setFeedback(null); }} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors font-bold">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Skenario
        </button>
        <div className="text-center mb-8">
          <Trophy className="w-12 h-12 text-warning-ink mx-auto mb-3" />
          <h1 className="text-[28px] md:text-4xl leading-[1.15] font-serif font-medium text-foreground">Feedback Percakapan</h1>
          <p className="text-muted-foreground mt-1">Skenario: {activeScenario.titleId}</p>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-8">
          <ScoreBadge label="Kelancaran" score={feedback.fluency_score} />
          <ScoreBadge label="Grammar" score={feedback.grammar_score} />
          <ScoreBadge label="Kosakata" score={feedback.vocabulary_score} />
        </div>
        <div className="bg-card border border-border rounded-card p-6 mb-6">
          <div className="text-foreground leading-relaxed"><Markdown>{feedback.overall_feedback_id}</Markdown></div>
        </div>
        {feedback.strengths.length > 0 && (
          <div className="bg-brand-tint border border-brand/30 rounded-card p-5 mb-6">
            <h3 className="text-sm font-bold text-brand-ink uppercase tracking-wider mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Hal Positif</h3>
            <ul className="space-y-1">{feedback.strengths.map((s, i) => <li key={i} className="text-sm text-foreground/80 flex gap-2"><span className="text-brand-ink">•</span><span><Markdown inline>{s}</Markdown></span></li>)}</ul>
          </div>
        )}
        {feedback.corrections.length > 0 && (
          <div className="bg-danger-tint border border-danger/30 rounded-card p-5 mb-6">
            <h3 className="text-sm font-bold text-danger uppercase tracking-wider mb-3 flex items-center gap-2"><XCircle className="w-4 h-4" /> Koreksi</h3>
            <div className="space-y-3">{feedback.corrections.map((c, i) => (
              <div key={i} className="bg-background/50 rounded-control p-3">
                <div className="flex items-center gap-2 text-sm mb-1"><span className="text-danger line-through">{c.original}</span><ArrowRight className="w-3 h-3 text-muted-foreground" /><span className="text-brand-ink font-medium">{c.corrected}</span></div>
                <div className="text-xs text-muted-foreground"><Markdown>{c.explanation_id}</Markdown></div>
              </div>
            ))}</div>
          </div>
        )}
        {feedback.vocabulary_suggestions.length > 0 && (
          <div className="bg-muted border border-border rounded-card p-5 mb-6">
            <h3 className="text-sm font-bold text-brand-ink uppercase tracking-wider mb-3 flex items-center gap-2"><Star className="w-4 h-4" /> Saran Kosakata</h3>
            <div className="space-y-2">{feedback.vocabulary_suggestions.map((v, i) => (
              <div key={i} className="text-sm"><span className="text-muted-foreground">Anda menggunakan "</span><span className="text-foreground font-bold">{v.used}</span><span className="text-muted-foreground">" → coba "</span><span className="text-blue-400 font-bold">{v.better}</span><span className="text-muted-foreground">"</span><div className="text-xs text-muted-foreground mt-0.5"><Markdown>{v.context_id}</Markdown></div></div>
            ))}</div>
          </div>
        )}
        {feedback.cultural_tip && (
          <div className="bg-warning-tint border border-warning-ink/30 rounded-card p-5 mb-6">
            <h3 className="text-sm font-bold text-warning-ink uppercase tracking-wider mb-2 flex items-center gap-2"><Lightbulb className="w-4 h-4" /> Tips Budaya</h3>
            <div className="text-sm text-foreground/80"><Markdown>{feedback.cultural_tip}</Markdown></div>
          </div>
        )}
        <button onClick={() => { setActiveScenario(null); setMessages([]); setFeedback(null); }} className="w-full py-3 bg-brand-solid text-on-brand font-bold rounded-control mt-4">Coba Skenario Lain</button>
      </div>
    );
  }

  // ── Chat View ──
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="p-4 border-b border-border flex flex-wrap items-center gap-3 shrink-0">
        <button onClick={() => { setActiveScenario(null); setMessages([]); }} className="p-2 hover:bg-muted rounded-control transition-colors"><ArrowLeft className="w-5 h-5 text-muted-foreground" /></button>
        <div className="flex-1 min-w-[160px]">
          <h2 className="font-bold text-foreground text-sm">{activeScenario.title}</h2>
          <p className="text-xs text-muted-foreground">{activeScenario.descriptionId}</p>
        </div>
        <button
          type="button"
          onClick={toggleBeginnerHelp}
          aria-pressed={beginnerHelp}
          className={`min-h-[44px] px-3 rounded-control border text-xs font-bold transition-colors ${beginnerHelp ? "bg-brand-tint text-brand-ink border-brand/40" : "bg-card text-muted-foreground border-border hover:bg-muted"}`}
        >
          Bantuan pemula: {beginnerHelp ? "Nyala" : "Mati"}
        </button>
        <button onClick={endAndGetFeedback} disabled={loadingFeedback || messages.filter(m => m.role === "user").length === 0} className="px-4 py-2 bg-warning-tint text-warning-ink border border-warning-ink/30 rounded-control text-xs font-bold hover:bg-warning-tint transition-colors disabled:opacity-50 flex items-center gap-1.5">
          {loadingFeedback ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trophy className="w-3 h-3" />} Akhiri & Feedback
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Hints */}
        {messages.length <= 1 && (
          <div className="bg-brand-tint border border-brand/20 rounded-control p-3 mb-2">
            <p className="text-xs text-muted-foreground font-bold mb-1.5">💡 Frasa bantuan:</p>
            <div className="flex flex-wrap gap-1.5">{activeScenario.hintPhrases.map((h, i) => (
              <button key={i} onClick={() => setInputText(h)} className="text-xs bg-brand-tint text-brand-ink px-2.5 py-1 rounded-lg hover:bg-brand-tint transition-colors border border-brand/20">
                {h}
                {beginnerHelp && phraseMeaning(activeScenario.id, h) && <span className="block text-[11px] font-normal text-muted-foreground">{phraseMeaning(activeScenario.id, h)}</span>}
              </button>
            ))}</div>
            {beginnerHelp && (helpFor(activeScenario.id)?.starters.length ?? 0) > 0 && (
              <>
                <p className="text-xs text-muted-foreground font-bold mt-3 mb-1.5">Mulai kalimatmu dengan:</p>
                <div className="flex flex-wrap gap-1.5">{helpFor(activeScenario.id)!.starters.map((s) => (
                  <button key={s} onClick={() => setInputText(s)} className="text-xs bg-card text-foreground px-2.5 py-1.5 rounded-lg hover:bg-muted transition-colors border border-border min-h-[36px]">{s.trim()}...</button>
                ))}</div>
              </>
            )}
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-card p-4 ${msg.role === "user" ? "bg-brand-solid text-on-brand rounded-br-md" : "bg-card border border-border text-foreground rounded-bl-md"}`}>
              <p className="text-sm leading-relaxed">{msg.content}</p>
              {msg.role === "assistant" && (
                <button onClick={() => playTTS(msg.content)} className="mt-2 text-xs text-muted-foreground hover:text-brand-ink flex items-center gap-1 transition-colors"><Volume2 className="w-3 h-3" /> Dengarkan</button>
              )}
              {msg.role === "assistant" && beginnerHelp && (
                <div className="mt-1">
                  {translations[msg.content] ? (
                    <p className="text-sm text-muted-foreground border-t border-border pt-2 mt-1">{translations[msg.content]}</p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => translateReply(msg.content)}
                      disabled={translating !== null}
                      className="min-h-[36px] text-xs text-muted-foreground hover:text-brand-ink flex items-center gap-1 transition-colors disabled:opacity-50"
                    >
                      {translating === msg.content ? <Loader2 className="w-3 h-3 animate-spin" /> : null} Lihat terjemahan
                    </button>
                  )}
                  {translateError && translating === null && !translations[msg.content] && i === messages.length - 1 && (
                    <p role="alert" className="text-xs text-danger mt-1">{translateError}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-card rounded-bl-md p-4">
              <div className="flex gap-1"><div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" /><div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} /><div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} /></div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={isRecording ? stopRecording : startRecording} disabled={isProcessing || loading} className={`p-3 rounded-control transition-all shrink-0 ${isRecording ? "bg-danger text-on-brand animate-pulse" : "bg-muted text-muted-foreground hover:bg-brand-tint hover:text-brand-ink"}`}>
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <input
            type="text"
            value={isRecording && transcript ? transcript : inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && inputText.trim()) sendMessage(); }}
            placeholder="Ketik atau tekan Mic untuk bicara..."
            className="flex-1 bg-background border border-border rounded-control px-4 py-3 text-foreground focus:ring-1 focus:ring-brand outline-none text-sm"
            disabled={loading}
          />
          <button onClick={sendMessage} disabled={loading || !inputText.trim()} className="p-3 bg-brand-solid text-on-brand rounded-control disabled:opacity-50 shrink-0 transition-all ">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
