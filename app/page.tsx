import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-brand/10 rounded-full">
            <BookOpen className="w-16 h-16 text-brand" />
          </div>
        </div>
        <h1 className="text-5xl md:text-7xl font-serif font-bold text-foreground tracking-tight">
          Literary Language Lab
        </h1>
        <p className="text-xl text-muted-foreground font-serif italic">
          Belajar bahasa Inggris melalui keindahan sastra.
        </p>
        <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/login"
            className="px-8 py-4 bg-brand text-background font-semibold rounded-full hover:bg-brand-hover transition-all hover:scale-105 active:scale-95 shadow-lg shadow-brand/20"
          >
            Mulai Membaca
          </Link>
          <Link 
            href="/register"
            className="px-8 py-4 bg-white/5 border border-border text-foreground font-semibold rounded-full hover:bg-white/10 transition-all"
          >
            Buat Akun Baru
          </Link>
        </div>
      </div>
    </div>
  );
}
