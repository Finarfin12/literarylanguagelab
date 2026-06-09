import Link from "next/link";
import { BookOpen, Sparkles, BrainCircuit, Globe2, BookMarked, ArrowRight } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background selection:bg-orange-500/30 selection:text-orange-600 relative overflow-hidden">
      {/* Dynamic Background Glow */}
      <div className="absolute top-0 inset-x-0 h-[500px] pointer-events-none overflow-hidden">
        <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-[800px] h-[800px] opacity-20 dark:opacity-30 blur-[100px] rounded-full bg-gradient-to-b from-orange-500/50 to-transparent mix-blend-screen" />
      </div>

      {/* Navigation (Optional minimalist header) */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-8 h-8 text-orange-500" />
          <span className="font-serif font-bold text-xl tracking-tight text-foreground">Literary Lab</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">Log in</Link>
          <Link href="/register" className="text-sm font-bold bg-foreground text-background px-4 py-2 rounded-full hover:bg-orange-500 hover:text-white transition-all">Sign up</Link>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        {/* HERO SECTION */}
        <div className="text-center max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 mb-32">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 font-semibold text-sm mb-4 backdrop-blur-sm shadow-inner">
            <Sparkles className="w-4 h-4" />
            <span>Cara Baru Menikmati Sastra Dunia</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-serif font-bold text-foreground tracking-tight leading-[1.1]">
            Kuasai Bahasa Melalui <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Karya Abadi.</span>
          </h1>
          
          <p className="text-lg md:text-2xl text-muted-foreground font-serif italic max-w-2xl mx-auto leading-relaxed">
            Pustaka raksasa, mesin penerjemah pintar, dan alat analisis sastra terdalam—semuanya dirancang untuk mengubah Anda menjadi seorang polyglot.
          </p>
          
          <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/register"
              className="group relative px-8 py-4 bg-orange-500 text-white font-bold text-lg rounded-full overflow-hidden shadow-[0_0_40px_rgba(249,115,22,0.3)] hover:shadow-[0_0_60px_rgba(249,115,22,0.5)] transition-all hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <span className="relative flex items-center gap-2">
                Mulai Petualangan <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </div>
        </div>

        {/* BENTO GRID SHOWCASE */}
        <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold font-serif mb-4">Fitur Kelas Dunia di Ujung Jari Anda</h2>
            <p className="text-muted-foreground">Eksplorasi ribuan buku, terjemahkan, dan pahami maknanya.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
            {/* Feature 1: Gutenberg (Span 2 cols on Desktop) */}
            <div className="md:col-span-2 relative overflow-hidden rounded-3xl bg-card border border-border shadow-xl hover:shadow-2xl transition-all group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500">
                <Globe2 className="w-48 h-48 text-blue-500" />
              </div>
              <div className="relative h-full p-8 flex flex-col justify-end">
                <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md border border-blue-500/20">
                  <Globe2 className="w-7 h-7 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold font-serif mb-2">Gutenberg Explorer</h3>
                <p className="text-muted-foreground max-w-sm">
                  Akses langsung dan baca lebih dari 70.000 mahakarya sastra klasik dari seluruh dunia secara gratis dan legal.
                </p>
              </div>
            </div>

            {/* Feature 2: LingoWise AI */}
            <div className="relative overflow-hidden rounded-3xl bg-card border border-border shadow-xl hover:shadow-2xl transition-all group">
              <div className="absolute -top-10 -right-10 p-8 opacity-10 group-hover:opacity-20 group-hover:rotate-12 transition-all duration-500">
                <BrainCircuit className="w-40 h-40 text-emerald-500" />
              </div>
              <div className="relative h-full p-8 flex flex-col justify-end">
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md border border-emerald-500/20">
                  <BrainCircuit className="w-7 h-7 text-emerald-500" />
                </div>
                <h3 className="text-2xl font-bold font-serif mb-2">LingoWise AI</h3>
                <p className="text-muted-foreground">
                  Asisten AI cerdas untuk membedah gaya bahasa, kiasan, dan tata bahasa paling rumit.
                </p>
              </div>
            </div>

            {/* Feature 3: Lexicon Bank */}
            <div className="relative overflow-hidden rounded-3xl bg-card border border-border shadow-xl hover:shadow-2xl transition-all group">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-125 transition-all duration-700">
                <BookMarked className="w-56 h-56 text-rose-500" />
              </div>
              <div className="relative h-full p-8 flex flex-col justify-end items-center text-center">
                <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md border border-rose-500/20">
                  <BookMarked className="w-7 h-7 text-rose-500" />
                </div>
                <h3 className="text-2xl font-bold font-serif mb-2">Lexicon & Spaced Repetition</h3>
                <p className="text-muted-foreground">
                  Simpan kosakata sulit dan pelajari ulang menggunakan sistem flashcard pintar yang terbukti secara ilmiah.
                </p>
              </div>
            </div>

            {/* Feature 4: Translation Memory (Span 2 cols on Desktop) */}
            <div className="md:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 shadow-xl hover:shadow-2xl transition-all group">
               <div className="absolute -bottom-10 right-10 opacity-20 group-hover:opacity-40 group-hover:-translate-y-4 transition-all duration-500">
                <div className="w-32 h-32 bg-orange-500 rounded-full blur-3xl" />
              </div>
              <div className="relative h-full p-8 flex flex-col justify-end">
                <div className="w-14 h-14 bg-orange-500/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md border border-orange-500/30 text-orange-500 font-bold text-xl">
                  A-Z
                </div>
                <h3 className="text-2xl font-bold font-serif mb-2">Translation Workshop</h3>
                <p className="text-muted-foreground max-w-sm">
                  Latih kemampuan Anda menerjemahkan karya klasik dan dapatkan penilaian komprehensif langsung dari sang AI ahli bahasa.
                </p>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <BookOpen className="w-6 h-6" />
            <span className="font-serif font-bold">Literary Lab</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Literary Language Lab. Dibuat dengan dedikasi untuk keindahan bahasa.
          </p>
        </div>
      </footer>
    </div>
  );
}
