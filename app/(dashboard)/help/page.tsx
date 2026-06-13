"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, MessageCircle, BookOpen, Sparkles, BrainCircuit, GraduationCap, Globe, Gamepad2, HelpCircle, ArrowRight, X, MessageSquare } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

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
    "/english-lab/grammar-clinic": { label: "Grammar Clinic", href: "/english-lab/grammar-clinic" },
    "/english-lab/flashcard": { label: "English Lab Flashcard", href: "/english-lab/flashcard" },
    "/english-lab/dialogue-simulator": { label: "Dialogue Simulator", href: "/english-lab/dialogue-simulator" },
    "/english-lab/listening-test": { label: "Listening Test", href: "/english-lab/listening-test" },
    "/english-lab/slang-decoder": { label: "Slang Decoder", href: "/english-lab/slang-decoder" },
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
  { q: "Bagaimana cara menyimpan kosa kata baru?", a: "Arahkan ke Text Library atau Public Domain Books. Klik kata yang ingin Anda pelajari di dalam teks, pilih mode analisis yang diinginkan, dan klik 'Simpan Kata'. Kosa kata tersebut akan otomatis tersimpan di Vocabulary Bank Anda." },
  { q: "Apakah yang dimaksud dengan Spaced Repetition?", a: "Ini adalah metode pengulangan memori menggunakan algoritma cerdas (SM-2). Kata yang hampir Anda lupakan akan lebih sering muncul untuk direview, sedangkan kata yang sudah Anda kuasai akan ditunda. Kunjungi menu Spaced Repetition untuk mengevaluasi ingatan Anda dengan memilih: Lupa Total, Hampir Lupa, Ingat Ragu, atau Sangat Mudah." },
  { q: "Bagaimana cara mencari dan membaca buku gratis?", a: "Buka menu Public Domain Books, pilih penyedia layanan (OpenLibrary untuk kecepatan optimal, atau Gutendex sebagai alternatif). Ketik judul atau nama penulis, lalu klik 'Baca Buku Full'. Buku yang telah dibuka akan tersimpan untuk akses offline, lengkap dengan posisi baca terakhir Anda." },
  { q: "Apakah aplikasi ini sepenuhnya gratis?", a: "Benar, 100% gratis! Anda bebas menikmati akses penuh ke 70.000+ buku, puluhan fitur AI, Spaced Repetition, forum diskusi, klub baca, dan duel terjemahan tanpa adanya biaya berlangganan." },
  { q: "Bagaimana sistem XP dan peringkat (Tier) bekerja?", a: "Anda mengumpulkan XP melalui berbagai aktivitas: mereview kosa kata, menyelesaikan bacaan, dan berpartisipasi di forum. Peringkat Anda akan naik seiring dengan XP yang dikumpulkan, mulai dari Novice Reader (A1) hingga Master of Linguistics (C2). Peringkat ini (Gamification Tier) akan digabungkan secara visual dengan Tingkat Kemahiran Bahasa (CEFR Level) Anda dan ditampilkan di Profil serta Forum." },
  { q: "Apa saja peran (Role) yang ada di komunitas?", a: "Terdapat 4 tingkatan peran: User/Scholar (pembaca biasa), Curator (berhak memverifikasi teks dan terjemahan), Moderator/Archivist (menjaga ketertiban forum), dan Admin/Librarian (memiliki kendali penuh termasuk User Management)." },
  { q: "Apa perbedaan antara OpenLibrary dan Gutendex?", a: "Keduanya mengambil data dari Project Gutenberg. OpenLibrary (pilihan utama) berjalan jauh lebih cepat dan menampilkan Cover buku berkualitas tinggi. Gutendex berfokus eksklusif pada 70.000 koleksi Gutenberg klasik dan lebih lengkap." },
  { q: "Bagaimana alur kerja di Translation Workshop?", a: "Di halaman Translation Workshop, Anda akan melihat layar terbelah: teks asli berbahasa Inggris di sebelah kiri, dan ruang mengetik terjemahan Anda di sebelah kanan. Setelah menerjemahkan, mintalah AI mengevaluasi hasilnya melalui mode General Feedback, Equivalence Checker, Register Matcher, atau Back-Translation." },
  { q: "Apa saja kemampuan 8 mode LingoWise AI?", a: "LingoWise memiliki 8 fungsi bedah sastra: Dialect Diver (menganalisis dialek), Tone & Grammar (struktur tata bahasa & level CEFR), Vibe Translator (terjemahan bernuansa), Mood Transformer (menggubah suasana hati), Diction Lab (membedah pilihan kata), Era Translator (adaptasi bahasa lintas zaman), Sentence Architect (struktur kalimat), dan Rhetorical Spotter (gaya bahasa/majas)." },
  { q: "Di mana saya bisa menemukan seluruh alat AI mini tambahan (seperti Tone Analyzer atau Paraphrase Challenge)?", a: "Silakan buka menu All Toolkits Hub. Halaman ini bertindak seperti etalase aplikasi (App Drawer) yang dilengkapi kotak pencarian dan dropdown filter kategori (Transformers, Extractors, Gamification, Lexicon) untuk membantu Anda menemukan 30+ alat analisis dengan cepat." },
  { q: "Apa perbedaan Idiom Library, Glossary Builder, dan Cultural Context Library?", a: "Ketiganya berada dalam kelompok Lexicon & Databases. Idiom Library menyimpan kumpulan frasa idiom beserta konteksnya, Glossary Builder membantu Anda membuat daftar istilah khusus per buku, dan Cultural Context Library adalah ensiklopedia untuk mengelola referensi mitologi/sejarah yang akan dilacak otomatis saat membaca teks sastra." },
  { q: "Apa fungsi dari fitur Alter Ego Chat?", a: "Ini adalah ruang interaktif di mana Anda dapat berdialog langsung dengan persona penulis legendaris seperti Shakespeare, Jane Austen, Edgar Allan Poe, atau Pramoedya Ananta Toer. AI akan merespons pertanyaan Anda menggunakan gaya bahasa dan sudut pandang khas penulis tersebut." },
  { q: "Bagaimana cara mengelola Reading Club?", a: "Buka menu Reading Clubs dan pilih 'Buat Klub Baru'. Masukkan nama dan deskripsi klub untuk menjadi pendiri (owner). Undang pengguna lain untuk bergabung, dan mulailah diskusi buku per bab melalui kolom obrolan (chat) yang terintegrasi." },
  { q: "Di mana saya bisa mengubah tema layar (Gelap/Terang)?", a: "Anda dapat mengatur pencahayaan layar dengan mengklik ikon matahari atau bulan di sudut kiri atas (dekat logo Literary Lab). Pengaturan tema Anda akan disimpan secara otomatis." },
  { q: "Dapatkah saya mengekspor data pembelajaran saya?", a: "Tentu! Melalui menu Pengaturan (Settings), Anda dapat mengunduh daftar kosa kata (Vocabulary Bank), Riwayat Bacaan (Reading History), maupun Hasil Terjemahan (Translation Submissions) ke dalam format CSV. File ini siap dibuka di Excel atau diimpor ke aplikasi flashcard seperti Anki." },
  { q: "Bagaimana cara kerja fitur OCR Lens?", a: "OCR Lens memungkinkan Anda memindai halaman buku fisik. Unggah foto halaman tersebut, dan AI akan mengekstrak teksnya. Hasil teks kemudian dapat langsung diimpor ke Text Library untuk Anda baca dan analisis lebih lanjut." },
  { q: "Apa yang membuat Story Quiz menarik?", a: "Story Quiz adalah permainan interaktif di mana AI menyusun sebuah cerita pendek (misteri, fiksi ilmiah, roman, dll.) menggunakan kosa kata yang sedang Anda pelajari di Vocabulary Bank. Di akhir cerita, Anda akan menjawab 5 pertanyaan untuk menguji pemahaman teks tersebut." },
  { q: "Bagaimana cara memulihkan kata sandi (reset password)?", a: "Jika Anda kesulitan masuk, silakan gunakan fitur 'Lupa Password' pada halaman login. Kami akan mengirimkan tautan pemulihan ke email Anda yang terdaftar." },
  { q: "Apakah saya bisa menghapus akun secara permanen?", a: "Ya. Jika Anda ingin menghapus akun beserta seluruh data Anda secara permanen, buka menu Pengaturan (Settings), masuk ke tab 'Privacy & Data', lalu klik 'Delete All My Data & Account'." },
  { q: "Bagaimana cara menganalisis kalimat panjang secara instan saat membaca?", a: "Cukup sorot atau blok kalimat yang ingin Anda pelajari saat membaca di Public Domain Books. Akan muncul menu popup kecil, klik ikon ✨ Analisis. Sebuah sidebar akan terbuka menampilkan Terjemahan, visualisasi pohon Tata Bahasa (Dependency Tree), penjelasan idiom, dan mode Simplify (B1) untuk menyederhanakan teks kuno menjadi bahasa Inggris modern." },
  { q: "Bagaimana cara menggunakan Flashcard interaktif?", a: "Buka menu Vocabulary Bank, lalu klik tombol 'Mulai Belajar (Flashcard)'. Sistem akan menguji ingatan Anda melalui mode kartu 3D yang bisa dibolak-balik (Ingat/Lupa). Hasil dari Flashcard ini akan langsung memengaruhi jadwal Spaced Repetition Anda." },
  { q: "Apakah ada fitur pembaca suara (Text-to-Speech)?", a: "Ya! Saat Anda membaca buku di Public Domain Books, Anda akan melihat ikon speaker (Volume) di sebelah kanan setiap paragraf. Klik ikon tersebut untuk mendengarkan teks dibacakan secara otomatis dengan suara natural." },
  { q: "Apa itu fitur Kuis Pemahaman (Comprehension Checkpoint)?", a: "Untuk memastikan Anda tidak sekadar membaca tanpa memahami, sistem akan memunculkan sebuah popup Kuis Pemahaman setiap kali Anda selesai membaca suatu bab. Kuis ini digenerate secara otomatis oleh AI berdasarkan isi bab yang baru saja Anda selesaikan." },
  { q: "Bagaimana cara menggunakan Beginner Mode?", a: "Di bagian atas halaman teks bacaan, Anda dapat mencentang 'Beginner Mode'. Mode ini akan menerjemahkan/menyederhanakan paragraf bahasa Inggris sastra kuno menjadi bahasa Inggris tingkat menengah (B1) secara otomatis. Anda bisa memilih agar teks sederhananya muncul berdampingan di bawah, langsung menggantikan teks asli, atau selang-seling." },
  { q: "Apa fungsi tombol kaca pembesar (🔍) di samping paragraf?", a: "Itu adalah fitur Bedah Sintaksis (Training Wheels). Jika diklik, AI akan mewarnai paragraf tersebut untuk memisahkan Subjek (Biru), Verba/Predikat (Merah), dan Objek (Kuning), sangat berguna bagi pemula untuk mengenali struktur kalimat." },
  { q: "Apa fungsi dari Pictionary Mode?", a: "Saat Anda menekan lama atau memilih suatu kata di dalam teks, tab Word Lookup akan terbuka. Pilih menu bergambar palet lukis (Pictionary Mode) untuk melihat terjemahan kata tersebut ke dalam bentuk ikon atau emoji visual yang universal." },
  { q: "Apakah Literary Language Lab tersedia di ponsel?", a: "Sangat mendukung! Aplikasi ini berjalan sebagai Progressive Web App (PWA). Cukup buka melalui browser ponsel Anda, lalu pilih opsi 'Add to Home Screen'. Aplikasi akan muncul di layar utama Anda selayaknya aplikasi bawaan, lengkap dengan dukungan mode offline." },
  { q: "Apa saja topik diskusi yang tersedia di Forum?", a: "Forum komunitas terbagi menjadi 5 kategori: Literary Interpretation (diskusi makna sastra), Creative Writing & Translation (kepenulisan dan terjemahan), AI & Tech in Literature (teknologi dalam sastra), Games & Challenges (tantangan komunitas), dan General Discussion (obrolan santai)." },
  { q: "Bagaimana sistem kompetisi di Translation Duels?", a: "Dalam arena Translation Duels, sistem akan memberikan sebuah kutipan teks asli. Peserta wajib mengirimkan versi terjemahan mereka, lalu komunitas akan memberikan suara (vote). Anda mendapat +15 XP setiap kali berpartisipasi, dan pemenang voting berhak atas bonus XP tambahan." },
  { q: "Apa dampaknya jika saya tidak rutin melakukan Spaced Repetition?", a: "Kosa kata Anda tidak akan hilang dari Vocabulary Bank, namun tanpa pengulangan terstruktur, Anda berisiko melupakannya. Sistem SM-2 dirancang untuk memastikan Anda mereview kata tepat sebelum Anda lupa. Konsistensi dalam mereview adalah kunci utama menguasai bahasa baru." },
  { q: "Bagaimana cara menemukan pengguna lain?", a: "Gunakan menu Jejaring Pembaca (Community) untuk mencari, melihat profil, dan mengikuti (follow) pembaca lain. Anda juga dapat melihat level dan XP mereka." },
  { q: "Apakah ada fitur pesan antar pengguna?", a: "Ya! Melalui menu Pesan Langsung (Direct Messaging), Anda dapat mengirim pesan ke pengguna yang Anda ikuti atau yang mengikuti Anda secara real-time." },
  { q: "Apa itu fitur Waktu Membaca (Time Spent)?", a: "Sistem secara otomatis melacak durasi membaca Anda di LingoWise. Anda dapat melihat total waktu belajar Anda di halaman Archive & Insights (History)." },
  { q: "Bagaimana cara menguji pelafalan bahasa Inggris saya?", a: "Buka menu All Toolkits Hub dan cari Pronunciation Clinic. Ketik kalimat yang ingin dilatih, lalu rekam suara Anda. Sistem akan memberikan skor persentase kecocokan. Anda juga dapat mengatur mesin suara Anda (Browser Native atau Groq Whisper) di halaman /settings." },
  { q: "Apa itu fitur English Lab?", a: "English Lab adalah kumpulan fitur baru untuk melatih bahasa Inggris sehari-hari (General English) tanpa elemen sastra berat. Ini mencakup Grammar Clinic, Flashcard SRS interaktif, Dialogue Simulator, Listening Test, dan Modern Slang Decoder." },
  { q: "Bagaimana cara menggunakan Dialogue Simulator?", a: "Buka menu /english-lab/dialogue-simulator , pilih skenario (misalnya: wawancara kerja), lalu berbicaralah menggunakan mikrofon Anda. AI akan merespons secara lisan. Di akhir sesi, klik 'Akhiri & Feedback' untuk mendapatkan penilaian kelancaran dan tata bahasa Anda." },
  { q: "Bisakah saya mengunggah audio sendiri di Listening Test?", a: "Ya! Di halaman /english-lab/listening-test , Anda bisa menekan tombol 'Unggah Audio Manual' untuk mengunggah file MP3/WAV milik Anda sendiri dan melatih pendengaran di mode Dikte." },
  { q: "Apa itu Reading Journey dan Placement Test?", a: "Reading Journey adalah panduan belajar langkah-demi-langkah dari level A1 hingga C2 yang menggabungkan seluruh fitur Literary Lab. Anda bisa mengikuti Placement Test di /english-lab/placement-test untuk mengetahui level awal Anda (CEFR), atau memilih level secara manual. Fitur ini bersifat opsional (non-blocking) dan progres Anda akan terlacak otomatis saat Anda beraktivitas." },
  { q: "Bagaimana cara melakukan pratinjau kosa kata sebelum membaca?", a: "Anda bisa mengaktifkan opsi 'Pre-Reading Vocab Preview' di menu Pengaturan (Settings). Setelah aktif, setiap kali Anda memilih buku di Text Library, sistem akan secara otomatis mengekstrak 8-12 kata kunci untuk Anda pelajari terlebih dahulu melalui mode flashcard temporer." },
  { q: "Apa itu Weekly Writing Challenge?", a: "Weekly Writing Challenge adalah tantangan mingguan di English Lab untuk membentuk kebiasaan berlatih output dalam bahasa Inggris. Anda diminta menulis respons ~100 kata terhadap prompt mingguan. AI akan mengevaluasi tulisan Anda dan memberikan skor serta saran perbaikan. Konsistensi Anda akan terekam dalam Streak Tracker." }
];

const SAMPLE_QUESTIONS = [
  "Bagaimana cara menggunakan fitur Translation Workshop?",
  "Apa saja kemampuan LingoWise AI?",
  "Bagaimana prosedur bergabung dengan Reading Club?",
  "Apakah daftar kosa kata bisa diekspor ke aplikasi Anki?",
  "Bagaimana cara mengaktifkan tema gelap (Dark Mode)?",
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
      <div className="fixed inset-0 z-50 md:bottom-24 md:right-8 md:w-[450px] md:h-[600px] md:top-auto md:left-auto flex flex-col bg-card md:rounded-2xl md:shadow-2xl md:border md:border-border overflow-hidden">
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
            <div key={i} className={`flex gap-2 items-start ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`p-1.5 rounded-lg shrink-0 ${msg.role === "assistant" ? "bg-brand/10" : "bg-muted"}`}>
                {msg.role === "assistant" ? <Bot className="w-3.5 h-3.5 text-brand" /> : <User className="w-3.5 h-3.5 text-muted-foreground" />}
              </div>
              <div className={`rounded-2xl px-4 py-3 max-w-[85%] text-sm leading-relaxed overflow-x-auto ${msg.role === "assistant" ? "bg-muted text-foreground prose-p:my-1 prose-strong:text-brand prose-strong:font-bold prose-ul:pl-4 prose-ul:list-disc prose-ol:pl-4 prose-ol:list-decimal" : "bg-brand text-white"}`}>
                {msg.role === "assistant" ? (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2 items-start">
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
            <li className="flex gap-2"><span className="text-brand font-bold shrink-0">1.</span> Klik kata di mana saja pada teks bacaan untuk mengakses 13 mode analisis AI dan menyimpannya ke Vocabulary Bank.</li>
            <li className="flex gap-2"><span className="text-brand font-bold shrink-0">2.</span> Sorot (select) teks pada halaman pembaca Gutenberg untuk menggunakan fitur Bookmark dan Highlight, atau gunakan tombol "Ask AI Companion" di bagian atas untuk mendiskusikan isi buku secara langsung.</li>
            <li className="flex gap-2"><span className="text-brand font-bold shrink-0">3.</span> Semua buku yang telah Anda buka dapat diakses kembali secara luring (offline)—baca kapan saja, di mana saja.</li>
            <li className="flex gap-2"><span className="text-brand font-bold shrink-0">4.</span> Luangkan waktu di menu /review secara rutin untuk mengoptimalkan retensi memori jangka panjang Anda.</li>
            <li className="flex gap-2"><span className="text-brand font-bold shrink-0">5.</span> Sesuaikan pencahayaan antarmuka (gelap/terang) melalui ikon tema di bagian navigasi.</li>
          </ul>
        </section>
      </div>

      {/* Floating Liter AI button (only on help page) */}
      {!showChat && (
        <button onClick={() => setShowChat(true)} className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-40 p-3.5 md:p-4 bg-brand text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center gap-2 group">
          <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-[80px] transition-all duration-300 whitespace-nowrap text-xs md:text-sm font-bold">Liter AI</span>
        </button>
      )}

      {/* Liter AI Chat Overlay */}
      {showChat && <LiterAIChat onClose={() => setShowChat(false)} />}
    </div>
  );
}
