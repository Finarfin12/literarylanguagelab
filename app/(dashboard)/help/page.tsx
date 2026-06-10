"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, MessageCircle, BookOpen, Sparkles, BrainCircuit, GraduationCap, Globe, Gamepad2, HelpCircle, ArrowRight, X, MessageSquare } from "lucide-react";
import Link from "next/link";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function FaqAnswer({ text }: { text: string }) {
  const menuMap: Record<string, { label: string; href: string }> = {
    "/vocabulary": { label: "Vocabulary Bank", href: "/vocabulary" },
    "/review": { label: "Spaced Repetition", href: "/review" },
    "/gutenberg": { label: "Public Domain Books", href: "/gutenberg" },
    "/leaderboard": { label: "Global Leaderboard", href: "/leaderboard" },
    "/translation-workshop": { label: "Translation Workshop", href: "/translation-workshop" },
    "/lingowise": { label: "LingoWise AI", href: "/lingowise" },
    "/tools/alter-ego": { label: "Alter Ego Chat", href: "/tools/alter-ego" },
    "/clubs": { label: "Reading Clubs", href: "/clubs" },
    "/library/add/ocr": { label: "OCR Lens", href: "/library/add/ocr" },
    "/tools/story-quiz": { label: "Story Quiz", href: "/tools/story-quiz" },
    "/settings": { label: "Pengaturan", href: "/settings" },
    "/forum": { label: "Forum & Community", href: "/forum" },
    "/duels": { label: "Translation Duels", href: "/duels" },
  };

  const parts = text.split(/(\/[a-z/\-]+)/g);
  return (
    <>
      {parts.map((part, i) => {
        const match = menuMap[part];
        if (match) {
          return <Link key={i} href={match.href} className="text-brand underline hover:no-underline font-medium">{match.label}</Link>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

const FAQ_ITEMS = [
  { q: "Bagaimana cara menambah kosa kata baru?", a: "Buka Text Library atau Public Domain Books, klik kata yang ingin dipelajari, lalu pilih mode analisis dan klik 'Simpan Kata'. Kata akan masuk ke Vocabulary Bank." },
  { q: "Apa itu spaced repetition?", a: "Sistem review cerdas berbasis algoritma SM-2 (SuperMemo 2). Kata yang sering lupa akan muncul lebih sering, kata yang sudah dikuasai muncul lebih jarang. Buka menu Spaced Repetition untuk memulai. Setiap review, kamu menilai diri sendiri: Lupa Total, Hampir Lupa, Ingat Ragu, atau Sangat Mudah." },
  { q: "Bagaimana cara cari dan baca buku gratis?", a: "Buka menu Public Domain Books, pilih provider (OpenLibrary untuk lebih cepat, Gutendex untuk fallback), ketik judul/penulis, lalu klik 'Baca Buku Full'. Buku otomatis tersimpan offline setelah pertama kali dibuka. Posisi baca juga disimpan — lanjut kapan saja." },
  { q: "Apakah aplikasi ini gratis?", a: "Iya, 100% GRATIS! Semua fitur tanpa terkecuali: 70.000+ buku, analisis AI 25+ tools, spaced repetition, forum diskusi, klub baca, duel terjemahan, dan semua fitur AI — tidak ada biaya berlangganan sama sekali." },
  { q: "Bagaimana cara dapat XP dan naik peringkat?", a: "XP didapat dari: review kosa kata (tiap sesi), menyelesaikan bacaan, ikut Translation Duels (+15 XP per submission), dan kontribusi Anotasi Publik (+5 XP). Login harian juga penting — makin panjang streak, makin tinggi peringkat di Global Leaderboard." },
  { q: "Apa beda OpenLibrary dan Gutendex?", a: "Keduanya sumber buku Project Gutenberg yang sama. OpenLibrary (default) lebih cepat karena fetch langsung dari browser, cover HD, dan jutaan buku termasuk non-Gutenberg. Gutendex lebih ringan, khusus 70.000 buku Gutenberg klasik — tersedia sebagai fallback kalau OpenLibrary lambat." },
  { q: "Bagaimana cara menggunakan Translation Workshop?", a: "Buka menu Translation Workshop. Layout split-screen: kiri teks English asli, kanan tempat kamu mengetik terjemahan Indonesia. Setelah selesai, pilih mode evaluasi (General Feedback, Equivalence Checker, Register Matcher, atau Back-Translation) dan AI akan menilai terjemahanmu." },
  { q: "Apa saja 8 mode LingoWise AI?", a: "LingoWise menganalisis teks sastra dengan 8 mode: Dialect Diver (dialek), Tone & Grammar (struktur + level CEFR), Vibe Translator (terjemahan bernuansa), Mood Transformer (ubah mood), Diction Lab (pilihan kata), Era Translator (ubah ke era Victorian/dll), Sentence Architect (struktur kalimat), Rhetorical Spotter (metafora, simile, dll)." },
  { q: "Apa itu Alter Ego Chat?", a: "Fitur di mana kamu bisa ngobrol langsung dengan penulis legendaris: Shakespeare, Jane Austen, Edgar Allan Poe, Ernest Hemingway, Virginia Woolf, Chinua Achebe, dan Pramoedya Ananta Toer. AI akan merespons dengan persona penulis tersebut." },
  { q: "Bagaimana cara membuat Reading Club?", a: "Buka menu Reading Clubs, klik 'Buat Klub Baru', isi nama dan deskripsi klub. Kamu otomatis jadi owner. Undang anggota lain, lalu diskusi bisa dimulai dengan tag chapter di setiap pesan. Cocok untuk baca buku bareng dan diskusi sastra." },
  { q: "Bagaimana cara mengubah tema gelap/terang?", a: "Klik ikon matahari/bulan di sidebar kiri (dekat logo Literary Lab). Tema disimpan otomatis dan akan bertahan meskipun kamu refresh atau tutup browser." },
  { q: "Bisa export kosa kata ke aplikasi lain?", a: "Bisa! Di halaman Vocabulary Bank, ada tombol Export yang menghasilkan file CSV (bisa dibuka di Excel, Google Sheets, atau import ke Anki/Quizlet). Format: word, definition, context_sentence, register, mastery_level." },
  { q: "Bagaimana cara menggunakan OCR Lens?", a: "Buka menu OCR Lens, upload foto halaman buku fisik. AI akan men-scan dan mengekstrak teks dari gambar. Teks hasil scan bisa langsung disimpan ke Text Library untuk dibaca." },
  { q: "Apa itu Story Quiz?", a: "Game di Literary Toolkits. AI membuatkan cerita pendek (genre bisa dipilih: Mystery, Sci-Fi, Romance, Horror, Adventure, Historical) menggunakan kosa kata dari Vocabulary Bank-mu. Setelah baca, ada 5 pertanyaan pilihan ganda untuk menguji pemahaman." },
  { q: "Bagaimana cara reset password?", a: "Literary Language Lab menggunakan Supabase Auth. Saat ini reset password bisa dilakukan melalui halaman login — akan ada opsi 'Lupa Password' yang mengirim email reset ke alamat email terdaftar. Jika belum muncul, hubungi admin." },
  { q: "Bagaimana cara menghapus akun?", a: "Untuk menghapus akun dan semua data terkait (vocabulary, reading progress, forum posts, dll), buka menu Pengaturan dan cari opsi 'Hapus Akun' di bagian bawah halaman. Ini permanen dan tidak bisa dibatalkan." },
  { q: "Apakah aplikasi ini bisa dibuka di HP?", a: "Bisa! Literary Language Lab adalah PWA (Progressive Web App). Buka di browser HP, lalu pilih 'Add to Home Screen' dari menu browser. Aplikasi akan terpasang seperti app native dengan icon sendiri. Mode offline juga berfungsi — buku yang sudah dibaca tetap bisa diakses tanpa internet." },
  { q: "Apa saja kategori di Forum?", a: "Forum punya 5 kategori: Literary Interpretation (diskusi karya sastra), Creative Writing & Translation (tulis & terjemahan), AI & Technology in Literature, Games & Challenges (kuis & tantangan), dan General Discussion (ngobrol bebas)." },
  { q: "Bagaimana Translation Duels bekerja?", a: "Di Translation Duels, akan ada teks asli (English) yang harus diterjemahkan. Semua peserta submit terjemahan mereka. Peserta lain bisa vote terjemahan favorit. Setiap submission dapat +15 XP, dan pemenang (vote terbanyak) dapat XP bonus. Kompetitif dan edukatif!" },
  { q: "Apa yang terjadi kalau tidak review kosa kata?", a: "Kosa kata yang tidak direview akan tetap tersimpan di Vocabulary Bank, tapi tanpa spaced repetition kamu mungkin lupa kata-kata itu. Sistem SM-2 dirancang agar kamu review kata tepat sebelum lupa — jeda review makin panjang kalau kamu konsisten. Rutin review di Spaced Repetition adalah kunci retensi jangka panjang." },
];

const SAMPLE_QUESTIONS = [
  "Bagaimana cara menggunakan Translation Workshop?",
  "Apa itu LingoWise AI?",
  "Bagaimana cara join Reading Club?",
  "Bisa export kosa kata ke Anki?",
  "Bagaimana cara mengubah tema gelap/terang?",
];

function LiterAIChat({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
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
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={onClose} />

      {/* Chat panel */}
      <div className="fixed inset-0 z-50 md:relative md:inset-auto md:z-auto flex flex-col bg-card md:rounded-2xl md:border md:border-border">
        {/* Header */}
        <div className="p-4 border-b border-border shrink-0 flex items-center justify-between bg-card/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand/10 rounded-xl">
              <Bot className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-sm">Liter AI</h3>
              <p className="text-xs text-muted-foreground">Asisten Literary Language Lab</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Messages */}
        <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-6">
              <div className="inline-flex p-4 bg-brand/10 rounded-full mb-4">
                <Bot className="w-8 h-8 text-brand" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-2">Halo! Saya Liter AI 👋</h3>
              <p className="text-xs text-muted-foreground mb-4">Tanyakan apa saja tentang Literary Language Lab.</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SAMPLE_QUESTIONS.map((q) => (
                  <button key={q} onClick={() => sendMessage(q)} className="px-3 py-1.5 bg-muted border border-border rounded-full text-xs text-muted-foreground hover:text-foreground hover:border-brand/50 transition-colors text-left">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`p-1.5 rounded-lg shrink-0 ${msg.role === "assistant" ? "bg-brand/10" : "bg-muted"}`}>
                {msg.role === "assistant" ? <Bot className="w-3.5 h-3.5 text-brand" /> : <User className="w-3.5 h-3.5 text-muted-foreground" />}
              </div>
              <div className={`rounded-2xl px-3 py-2 max-w-[85%] text-xs leading-relaxed ${msg.role === "assistant" ? "bg-muted text-foreground" : "bg-brand text-white"}`}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2">
              <div className="p-1.5 rounded-lg bg-brand/10 shrink-0"><Bot className="w-3.5 h-3.5 text-brand" /></div>
              <div className="bg-muted rounded-2xl px-4 py-3"><Loader2 className="w-4 h-4 animate-spin text-brand" /></div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-border shrink-0">
          <div className="flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Tanyakan sesuatu..." className="flex-1 bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand transition-colors" disabled={loading} />
            <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()} className="px-3 py-2.5 bg-brand text-white rounded-xl hover:bg-brand-hover transition-colors disabled:opacity-50">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="min-h-full p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <div className="p-2.5 md:p-3 bg-brand/10 rounded-2xl">
            <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-brand" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Pusat Bantuan</h1>
            <p className="text-muted-foreground text-xs md:text-sm">Panduan lengkap Literary Language Lab</p>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="mb-8 md:mb-10">
          <h2 className="text-base md:text-lg font-bold text-foreground mb-3 md:mb-4 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-brand" />
            Pertanyaan Umum
          </h2>
          <div className="space-y-2 md:space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="bg-card border border-border rounded-xl md:rounded-2xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full text-left p-3 md:p-4 font-bold text-foreground flex items-center justify-between hover:bg-muted transition-colors">
                  <span className="text-xs md:text-sm pr-4">{item.q}</span>
                  <span className={`transition-transform text-muted-foreground shrink-0 text-xs ${openFaq === i ? "rotate-180" : ""}`}>▼</span>
                </button>
                {openFaq === i && (
                  <div className="px-3 md:px-4 pb-3 md:pb-4 text-xs md:text-sm text-muted-foreground leading-relaxed">{item.a}</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Feature Categories */}
        <section className="mb-8 md:mb-10">
          <h2 className="text-base md:text-lg font-bold text-foreground mb-3 md:mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-brand" />
            Jelajahi Fitur
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
            {[
              { icon: BookOpen, label: "Public Domain Books", desc: "70.000+ buku klasik gratis dari Project Gutenberg", href: "/gutenberg", color: "text-orange-500" },
              { icon: BrainCircuit, label: "LingoWise AI", desc: "8 mode analisis teks sastra dengan kecerdasan buatan", href: "/lingowise", color: "text-brand" },
              { icon: MessageCircle, label: "Forum & Community", desc: "Diskusi, klub baca, duel terjemahan, leaderboard", href: "/forum", color: "text-rose-400" },
              { icon: GraduationCap, label: "Translation Workshop", desc: "Latihan terjemahan English→Indonesia dengan evaluasi AI", href: "/translation-workshop", color: "text-blue-400" },
              { icon: Globe, label: "Vocabulary & Review", desc: "Bank kosa kata + spaced repetition SM-2", href: "/vocabulary", color: "text-purple-400" },
              { icon: Gamepad2, label: "Tools & Games", desc: "25+ tools: Story Quiz, Paraphrase Challenge, Alter Ego Chat", href: "/tools", color: "text-amber-400" },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="bg-card border border-border rounded-xl md:rounded-2xl p-3 md:p-4 hover:bg-muted transition-all group flex items-center gap-3 md:gap-4">
                <item.icon className={`w-5 h-5 md:w-6 md:h-6 ${item.color} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground text-xs md:text-sm">{item.label}</h3>
                  <p className="text-[10px] md:text-xs text-muted-foreground hidden sm:block">{item.desc}</p>
                </div>
                <ArrowRight className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </Link>
            ))}
          </div>
        </section>

        {/* Quick Tips */}
        <section>
          <h2 className="text-base md:text-lg font-bold text-foreground mb-3 md:mb-4">Tips Cepat</h2>
          <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-muted-foreground">
            <li className="flex gap-2"><span className="text-brand font-bold shrink-0">1.</span> Klik kata di reader untuk analisis 13 mode + simpan ke Vocabulary Bank</li>
            <li className="flex gap-2"><span className="text-brand font-bold shrink-0">2.</span> Bookmark & Highlight teks dengan select teks di Gutenberg reader</li>
            <li className="flex gap-2"><span className="text-brand font-bold shrink-0">3.</span> Buku yang sudah dibaca bisa diakses offline — buka sekali, baca selamanya</li>
            <li className="flex gap-2"><span className="text-brand font-bold shrink-0">4.</span> Review kosa kata rutin di /review untuk memaksimalkan retensi</li>
            <li className="flex gap-2"><span className="text-brand font-bold shrink-0">5.</span> Ganti tema gelap/terang via ikon matahari/bulan di sidebar kiri</li>
          </ul>
        </section>
      </div>

      {/* Floating Liter AI button (only on help page) */}
      {!showChat && (
        <button onClick={() => setShowChat(true)} className="fixed bottom-6 right-6 z-40 p-3.5 md:p-4 bg-brand text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center gap-2 group">
          <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-[80px] transition-all duration-300 whitespace-nowrap text-xs md:text-sm font-bold">Liter AI</span>
        </button>
      )}

      {/* Liter AI Chat Overlay */}
      {showChat && <LiterAIChat onClose={() => setShowChat(false)} />}
    </div>
  );
}
