"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, MessageCircle, BookOpen, Sparkles, BrainCircuit, GraduationCap, Globe, Gamepad2, HelpCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const FAQ_ITEMS = [
  { q: "Bagaimana cara menambah kosa kata baru?", a: "Buka reader (Library atau Gutenberg), klik kata yang ingin dipelajari, lalu pilih mode analisis dan klik 'Simpan Kata'. Kata akan masuk ke Vocabulary Bank." },
  { q: "Apa itu spaced repetition?", a: "Sistem review cerdas berbasis algoritma SM-2. Kata yang sering lupa akan muncul lebih sering, kata yang sudah dikuasai muncul lebih jarang. Buka /review untuk memulai." },
  { q: "Bagaimana cara cari buku gratis?", a: "Buka /gutenberg, pilih provider (OpenLibrary atau Gutendex), ketik judul/penulis, klik 'Baca Buku Full'. Buku bisa dibaca offline setelah pertama kali dibuka." },
  { q: "Apakah aplikasi ini gratis?", a: "100% gratis! Semua fitur — AI analysis, 70.000+ buku, spaced repetition, forum, klub baca — tidak dipungut biaya." },
  { q: "Bagaimana cara dapat XP dan naik level?", a: "XP didapat dari: review kosa kata, menyelesaikan bacaan, ikut Translation Duels (+15 XP), kontribusi Shared Annotations (+5 XP). Lihat leaderboard di /leaderboard." },
  { q: "Apa beda Gutendex dan OpenLibrary?", a: "OpenLibrary (default) lebih cepat, cover HD, jutaan buku. Gutendex lebih ringan, khusus 70.000 buku Gutenberg. Keduanya sumber buku yang sama — pilih yang lebih responsif." },
];

const SAMPLE_QUESTIONS = [
  "Bagaimana cara menggunakan Translation Workshop?",
  "Apa itu LingoWise AI?",
  "Bagaimana cara join Reading Club?",
  "Bisa export kosa kata ke Anki?",
  "Bagaimana cara mengubah tema gelap/terang?",
];

export default function HelpPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/liter-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });
      if (!res.ok) throw new Error("Gagal");
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Maaf, Liter AI sedang tidak tersedia. Silakan coba lagi sebentar." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex h-[calc(100vh-73px)]">
      {/* LEFT: Documentation */}
      <div className="w-1/2 border-r border-border overflow-y-auto p-8 bg-background">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-brand/10 rounded-2xl">
              <BookOpen className="w-8 h-8 text-brand" />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground">Pusat Bantuan</h1>
              <p className="text-muted-foreground text-sm">Panduan lengkap Literary Language Lab</p>
            </div>
          </div>

          {/* FAQ Section */}
          <section className="mb-10">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-brand" />
              Pertanyaan Umum
            </h2>
            <div className="space-y-3">
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full text-left p-4 font-bold text-foreground flex items-center justify-between hover:bg-muted transition-colors"
                  >
                    <span className="text-sm">{item.q}</span>
                    <span className={`transition-transform text-muted-foreground ${openFaq === i ? "rotate-180" : ""}`}>▼</span>
                  </button>
                  {openFaq === i && (
                    <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{item.a}</div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Feature Categories */}
          <section className="mb-10">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand" />
              Jelajahi Fitur
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {[
                { icon: BookOpen, label: "Public Domain Books", desc: "70.000+ buku klasik gratis dari Project Gutenberg", href: "/gutenberg", color: "text-orange-500" },
                { icon: BrainCircuit, label: "LingoWise AI", desc: "8 mode analisis teks sastra dengan kecerdasan buatan", href: "/lingowise", color: "text-brand" },
                { icon: MessageCircle, label: "Forum & Community", desc: "Diskusi, klub baca, duel terjemahan, leaderboard", href: "/forum", color: "text-rose-400" },
                { icon: GraduationCap, label: "Translation Workshop", desc: "Latihan terjemahan English→Indonesia dengan evaluasi AI", href: "/translation-workshop", color: "text-blue-400" },
                { icon: Globe, label: "Vocabulary & Review", desc: "Bank kosa kata + spaced repetition SM-2", href: "/vocabulary", color: "text-purple-400" },
                { icon: Gamepad2, label: "Tools & Games", desc: "25+ tools: Story Quiz, Paraphrase Challenge, Alter Ego Chat", href: "/tools", color: "text-amber-400" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="bg-card border border-border rounded-2xl p-4 hover:bg-muted transition-all group flex items-center gap-4"
                >
                  <item.icon className={`w-6 h-6 ${item.color} shrink-0`} />
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground text-sm">{item.label}</h3>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-bold text-foreground mb-4">Tips Cepat</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2"><span className="text-brand font-bold">1.</span> Klik kata di reader untuk analisis 13 mode + simpan ke Vocabulary Bank</li>
              <li className="flex gap-2"><span className="text-brand font-bold">2.</span> Bookmark & Highlight teks dengan select teks di Gutenberg reader</li>
              <li className="flex gap-2"><span className="text-brand font-bold">3.</span> Buku yang sudah dibaca bisa diakses offline — buka sekali, baca selamanya</li>
              <li className="flex gap-2"><span className="text-brand font-bold">4.</span> Review kosa kata rutin di /review untuk memaksimalkan retensi</li>
              <li className="flex gap-2"><span className="text-brand font-bold">5.</span> Ganti tema gelap/terang via ikon matahari/bulan di sidebar kiri</li>
            </ul>
          </section>
        </div>
      </div>

      {/* RIGHT: Liter AI Chat */}
      <div className="w-1/2 flex flex-col bg-card">
        <div className="p-4 border-b border-border shrink-0 flex items-center gap-3 bg-card/90 backdrop-blur-md">
          <div className="p-2 bg-brand/10 rounded-xl">
            <Bot className="w-5 h-5 text-brand" />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm">Liter AI</h3>
            <p className="text-xs text-muted-foreground">Asisten Literary Language Lab</p>
          </div>
        </div>

        <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-10">
              <div className="inline-flex p-4 bg-brand/10 rounded-full mb-4">
                <Bot className="w-10 h-10 text-brand" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Halo! Saya Liter AI 👋</h3>
              <p className="text-sm text-muted-foreground mb-6">Tanyakan apa saja tentang Literary Language Lab — fitur, cara pakai, tips, atau bantuan teknis.</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SAMPLE_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="px-3 py-1.5 bg-muted border border-border rounded-full text-xs text-muted-foreground hover:text-foreground hover:border-brand/50 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`p-2 rounded-xl shrink-0 ${msg.role === "assistant" ? "bg-brand/10" : "bg-muted"}`}>
                {msg.role === "assistant" ? <Bot className="w-4 h-4 text-brand" /> : <User className="w-4 h-4 text-muted-foreground" />}
              </div>
              <div className={`rounded-2xl px-4 py-3 max-w-[85%] text-sm leading-relaxed ${
                msg.role === "assistant" ? "bg-muted text-foreground" : "bg-brand text-white"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="p-2 rounded-xl bg-brand/10 shrink-0"><Bot className="w-4 h-4 text-brand" /></div>
              <div className="bg-muted rounded-2xl px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-brand" />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border shrink-0">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tanyakan tentang Literary Language Lab..."
              className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand transition-colors"
              disabled={loading}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className="px-4 py-3 bg-brand text-white rounded-xl hover:bg-brand-hover transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
