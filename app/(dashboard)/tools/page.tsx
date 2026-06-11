"use client";

import Link from "next/link";
import { TOOLS } from "@/lib/tools-config";
import { Wrench, Sparkles, Wand2, Hourglass, Eye, Ear, Search, FlaskConical, Building2, Palette, Image as ImageIcon, PenTool, ListOrdered, CheckSquare, Shuffle, Swords, BarChart3, Quote, Mic, Landmark, Globe } from "lucide-react";

const iconMap: Record<string, any> = {
  Wand2, Hourglass, Eye, Ear, Search, Sparkles, FlaskConical, Building2, Palette, Image: ImageIcon, PenTool, ListOrdered, CheckSquare, Shuffle, Swords, BarChart3, Quote, Mic
};

export default function ToolsDashboardPage() {
  const dropdownTools = TOOLS.filter(t => t.type === "dropdown");
  const textareaTools = TOOLS.filter(t => t.type === "textarea");

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-full animate-in fade-in duration-500">
      <div className="mb-10">
        <h1 className="text-4xl font-serif font-bold text-foreground flex items-center gap-3">
          <Wrench className="w-8 h-8 text-brand" />
          Literary Toolkits
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Kumpulan alat spesifik untuk membedah, menganalisis, dan merombak karya sastra.</p>
      </div>

      <h2 className="text-xl font-bold text-foreground mb-6 uppercase tracking-wider border-b border-border pb-2">Targeted Transformers (Dropdown)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {dropdownTools.map(tool => {
          const Icon = iconMap[tool.icon] || Sparkles;
          return (
            <Link key={tool.id} href={`/tools/${tool.id}`} className="bg-card shadow-sm backdrop-blur-md border border-border rounded-2xl p-6 hover:bg-muted hover:border-brand/30 transition-all group">
              <div className="bg-brand/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Icon className="w-6 h-6 text-brand" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{tool.title}</h3>
              <p className="text-sm text-muted-foreground">{tool.description}</p>
            </Link>
          );
        })}
      </div>

      <h2 className="text-xl font-bold text-foreground mb-6 uppercase tracking-wider border-b border-border pb-2">Analysis Extractors (Textarea)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {textareaTools.map(tool => {
          const Icon = iconMap[tool.icon] || Sparkles;
          return (
            <Link key={tool.id} href={`/tools/${tool.id}`} className="bg-card shadow-sm backdrop-blur-md border border-border rounded-2xl p-6 hover:bg-muted hover:border-blue-400/30 transition-all group">
              <div className="bg-blue-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Icon className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">{tool.title}</h3>
              <p className="text-sm text-muted-foreground">{tool.description}</p>
            </Link>
          );
        })}
      </div>

      <h2 className="text-xl font-bold text-foreground mb-6 uppercase tracking-wider border-b border-border pb-2">Interactive & Gamification</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href={`/tools/paraphrase`} className="bg-card shadow-sm backdrop-blur-md border border-border rounded-2xl p-6 hover:bg-muted hover:border-amber-400/30 transition-all group">
          <div className="bg-amber-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <PenTool className="w-6 h-6 text-amber-400" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">Paraphrase Challenge</h3>
          <p className="text-sm text-muted-foreground">Latih kemampuan menulis ulang tanpa kehilangan esensi sastra.</p>
        </Link>
        
        <Link href={`/tools/alter-ego`} className="bg-card shadow-sm backdrop-blur-md border border-border rounded-2xl p-6 hover:bg-muted hover:border-purple-400/30 transition-all group">
          <div className="bg-purple-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6 text-purple-400" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">Alter Ego Chat</h3>
          <p className="text-sm text-muted-foreground">Ngobrol langsung dengan penulis legendaris secara interaktif.</p>
        </Link>

        <Link href={`/tools/story-quiz`} className="bg-card shadow-sm backdrop-blur-md border border-border rounded-2xl p-6 hover:bg-muted hover:border-green-400/30 transition-all group">
          <div className="bg-green-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <CheckSquare className="w-6 h-6 text-green-400" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">Story Mode Quiz</h3>
          <p className="text-sm text-muted-foreground">Kuis berbasis cerpen menggunakan koleksi kosa kata Anda.</p>
        </Link>
      </div>

      <h2 className="text-xl font-bold text-foreground mb-6 mt-12 uppercase tracking-wider border-b border-border pb-2">Lexicon & Databases</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href={`/tools/cultural-context`} className="bg-card shadow-sm backdrop-blur-md border border-border rounded-2xl p-6 hover:bg-muted hover:border-amber-400/30 transition-all group">
          <div className="bg-amber-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Landmark className="w-6 h-6 text-amber-500" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">Cultural Context Library</h3>
          <p className="text-sm text-muted-foreground">Editor untuk menambah & mengelola referensi mitologi atau sejarah.</p>
        </Link>
      </div>
    </div>
  );
}
