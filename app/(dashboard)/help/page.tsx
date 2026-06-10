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
  { q: "Bagaimana cara hamba menambah perbendaharaan kata baru?", a: "Silakan melangkah ke perpustakaan agung Text Library atau Public Domain Books. Sentuhlah kata yang memikat hati Anda, pilih mode analisisnya, lalu klik 'Simpan Kata'. Niscaya kata tersebut akan terukir abadi di dalam Vocabulary Bank Anda." },
  { q: "Apakah gerangan Spaced Repetition itu?", a: "Sebuah metode pengulangan memori berbantukan keajaiban algoritma SM-2. Kata yang kerap pudar dari ingatan akan dimunculkan kembali, sementara yang sudah Anda kuasai akan sesekali menyapa. Kunjungilah bilik Spaced Repetition untuk memulainya. Di setiap evaluasi, jujurlah pada ingatan Anda: Lupa Total, Hampir Lupa, Ingat Ragu, atau Sangat Mudah." },
  { q: "Bagaimana cara menyibak lembaran buku klasik di sini?", a: "Bukalah gerbang Public Domain Books, pilih sang pustakawan (OpenLibrary untuk kecepatan kilat, atau Gutendex sebagai alternatif), lalu ketikkan judul atau nama sang pujangga, dan klik 'Baca Buku Full'. Buku tersebut kelak akan setia menanti Anda meski tanpa sambungan internet. Pembatas buku ajaib kami pun senantiasa menyimpan halaman terakhir Anda." },
  { q: "Apakah ruang pusaka ini menuntut upeti?", a: "Tidak sama sekali! Tempat bernaung ini 100% tanpa pamrih. Ribuan mahakarya, sihir 25+ perkakas AI, ruang bedah terjemahan, hingga arena adu talenta—semuanya disajikan murni demi kecintaan kita terhadap literatur, tanpa sepeser pun biaya langganan." },
  { q: "Bagaimana cara menaikkan darjat dan mengumpulkan XP?", a: "Kumpulkanlah butiran XP dengan mengulas kosa kata, merampungkan bacaan, bertarung di Translation Duels (+15 XP), atau menyumbangkan Anotasi Komunitas (+5 XP). Konsistensi kunjungan harian Anda juga akan memanjangkan rentetan api (streak) demi mengangkat nama Anda di puncak Global Leaderboard." },
  { q: "Apa selisih antara OpenLibrary dan Gutendex?", a: "Keduanya merupakan mata air yang sama dari Project Gutenberg. OpenLibrary adalah sang primadona yang lebih gegas merengkuh data dari peramban Anda, berhias sampul kualitas tinggi. Adapun Gutendex adalah sang penjaga tua yang berfokus secara eksklusif pada 70.000 mahakarya Gutenberg sebagai pelabuhan cadangan." },
  { q: "Bagaimana cara menggunakan Translation Workshop?", a: "Masukilah ruang Translation Workshop. Anda akan mendapati layar yang terbelah: sisi kiri menyajikan teks asli sang pujangga, sisi kanan menanti ketikan terjemahan Anda. Setelah merampungkannya, mintalah petuah AI melalui empat kacamata kritik: General Feedback, Equivalence Checker, Register Matcher, atau Back-Translation." },
  { q: "Mantra apa saja yang dikuasai LingoWise AI?", a: "LingoWise mampu membedah sastra lewat 8 keahlian: Dialect Diver (menyelami dialek), Tone & Grammar (memindai tata bahasa), Vibe Translator (menerjemahkan tanpa merusak nuansa), Mood Transformer (menggubah suasana hati), Diction Lab (menimbang pilihan kata), Era Translator (membawa bahasa melintasi zaman), Sentence Architect (membedah kerangka kalimat), serta Rhetorical Spotter (melacak gaya bahasa)." },
  { q: "Siapakah para bayangan di Alter Ego Chat?", a: "Di sinilah letak keajaiban ruang ini. Anda dapat berbincang langsung dengan roh para maestro: Shakespeare, Jane Austen, Edgar Allan Poe, Hemingway, hingga Pramoedya. AI akan meminjam lisan dan pemikiran mereka untuk meladeni pertanyaan Anda." },
  { q: "Bagaimana cara mendirikan sebuah Reading Club?", a: "Masuklah ke Reading Clubs dan pilih 'Buat Klub Baru'. Sematkan nama dan tujuan mulia klub Anda. Anda akan dinobatkan sebagai sang pelopor. Undang kawan-kawan sejawat, lalu mulailah simposium sastra dengan menandai bab di setiap untaian pesan." },
  { q: "Bagaimana cara meredupkan atau menerangkan ruangan (Tema)?", a: "Sentuhlah lambang mentari atau bulan di pilar kiri (dekat lambang Literary Lab). Alam aplikasi akan menyesuaikan kehendak Anda, dan selera Anda ini akan selalu diingat meski Anda pergi dan kembali." },
  { q: "Bolehkah saya membawa pulang (export) kosa kata saya?", a: "Tentu! Di ruangan Vocabulary Bank, tersedia tombol Export yang akan menenun catatan Anda menjadi gulungan CSV. Gulungan ini kelak bisa dibentangkan di Excel, Google Sheets, atau aplikasi kartu memori lainnya seperti Anki." },
  { q: "Apa fungsi dari kaca pembesar OCR Lens?", a: "Bukalah OCR Lens dan perlihatkan foto lembaran buku fisik Anda. Secara gaib, AI akan mengenali dan menyalin aksara-aksara di dalamnya. Barisan kalimat tersebut kemudian dapat disemayamkan di Text Library untuk dibedah." },
  { q: "Apakah gerangan Story Quiz itu?", a: "Sebuah hiburan di Literary Toolkits. AI akan menenun sebuah cerita pendek (dengan genre misteri, romansa, hingga horor) yang sengaja dibumbui kosa kata dari Vocabulary Bank Anda. Setelah menuntaskan cerita, pemahaman Anda akan diuji lewat 5 teka-teki." },
  { q: "Bagaimana cara menyambung kunci ingatan (reset password)?", a: "Pintu gerbang kami dikawal oleh Supabase. Jika Anda kehilangan kunci masuk, hampiri halaman login dan pilih 'Lupa Password'. Burung merpati kami akan membawa pesan pemulihan ke alamat email Anda." },
  { q: "Bagaimana cara membumihanguskan akun saya?", a: "Bila Anda benar-benar berniat menghapus jejak, pergilah ke Pengaturan dan cari pusara 'Hapus Akun' di ujung bawah halaman. Ingatlah, tindakan ini bersifat abadi; seluruh kosa kata dan capaian Anda akan lenyap tak berbekas." },
  { q: "Dapatkah ruang baca ini diakses lewat peranti genggam?", a: "Sangat bisa! Literary Language Lab adalah Progressive Web App. Bukalah lewat peramban genggam Anda, lalu 'Add to Home Screen'. Ia akan menyatu layaknya aplikasi murni di layar utama Anda, dan sanggup menyajikan bacaan walau tanpa jaringan internet." },
  { q: "Topik apa saja yang bergema di Forum?", a: "Bilik Forum memiliki 5 arena: Literary Interpretation (mengupas makna), Creative Writing & Translation (seni mencipta & menerjemah), AI & Tech (perpaduan literatur & mesin), Games & Challenges (arena tanding), serta General Discussion (bincang santai)." },
  { q: "Bagaimana panggung Translation Duels berlangsung?", a: "Di arena ini, sebuah naskah asli dibentangkan untuk diterjemahkan. Setiap cendekiawan mengajukan terjemahan terbaik mereka, lalu saling memberikan suara (vote). Anda meraup +15 XP setiap kali maju gelanggang, dan pemenangnya akan diganjar XP ekstra. Terhormat dan mendidik!" },
  { q: "Apa malapetakanya jika saya mengabaikan ulasan kosa kata?", a: "Kosa kata itu takkan ke mana-mana, namun tanpa Spaced Repetition, ia perlahan pudar dari benak Anda. Metode SM-2 hadir memanggil kembali kata tersebut sesaat sebelum Anda melupakannya. Merawat taman Spaced Repetition adalah rahasia untuk ingatan abadi." },
];

const SAMPLE_QUESTIONS = [
  "Bagaimana cara hamba menggunakan Translation Workshop?",
  "Apakah keistimewaan dari sihir LingoWise AI?",
  "Bagaimana cara menautkan diri ke dalam Reading Club?",
  "Bisakah hamba memindahkan kosa kata ini ke Anki?",
  "Bagaimana cara meredupkan ruangan ini (Tema Gelap)?",
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
              <h3 className="text-base font-bold text-foreground mb-2">Salam Hangat! Saya Liter AI 👋</h3>
              <p className="text-xs text-muted-foreground mb-4">Tanyakanlah apa saja mengenai seluk-beluk Literary Language Lab.</p>
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
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Pusat Kebijaksanaan & Bantuan</h1>
            <p className="text-muted-foreground text-xs md:text-sm">Kitab panduan utuh untuk menavigasi lorong-lorong Literary Language Lab</p>
          </div>
        </div>

        {/* FAQ Section */}
        <section className="mb-8 md:mb-10">
          <h2 className="text-base md:text-lg font-bold text-foreground mb-3 md:mb-4 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 md:w-5 md:h-5 text-brand" />
            Titah & Pertanyaan Umum
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
            Jelajahi Ruang Pusaka
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
          <h2 className="text-base md:text-lg font-bold text-foreground mb-3 md:mb-4">Petuah Ringkas</h2>
          <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-muted-foreground">
            <li className="flex gap-2"><span className="text-brand font-bold shrink-0">1.</span> Sentuh setiap kata pada bacaan Anda untuk membedahnya dalam 13 mode, lalu abadikan ia ke dalam Vocabulary Bank.</li>
            <li className="flex gap-2"><span className="text-brand font-bold shrink-0">2.</span> Sorotlah untaian kalimat di ruang baca Gutenberg untuk menyematkan penanda (Bookmark) dan sorotan (Highlight).</li>
            <li className="flex gap-2"><span className="text-brand font-bold shrink-0">3.</span> Kitab yang usai Anda buka akan terpatri secara magis, mengizinkan Anda membacanya kembali walau dalam keterasingan tanpa internet.</li>
            <li className="flex gap-2"><span className="text-brand font-bold shrink-0">4.</span> Ziarahi bilik /review secara berkala untuk merawat kelanggengan kosa kata dalam relung ingatan Anda.</li>
            <li className="flex gap-2"><span className="text-brand font-bold shrink-0">5.</span> Perintahkan malam atau siang menaungi aplikasi ini lewat lambang mentari/bulan di pilar sebelah kiri.</li>
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
