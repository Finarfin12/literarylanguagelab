"use client";

import { useState } from "react";
import Link from "next/link";
import { TOOLS } from "@/lib/tools-config";
import { 
  Wrench, Sparkles, Wand2, Hourglass, Eye, Ear, Search, FlaskConical, 
  Building2, Palette, Image as ImageIcon, PenTool, ListOrdered, CheckSquare, 
  Shuffle, Swords, BarChart3, Quote, Mic, Landmark, Globe, BookOpen, Filter
} from "lucide-react";

const iconMap: Record<string, any> = {
  Wand2, Hourglass, Eye, Ear, Search, Sparkles, FlaskConical, Building2, Palette, 
  Image: ImageIcon, PenTool, ListOrdered, CheckSquare, Shuffle, Swords, BarChart3, 
  Quote, Mic, Landmark, Globe, BookOpen
};

const CATEGORIES = [
  "All",
  "Targeted Transformers",
  "Analysis Extractors",
  "Interactive & Gamification",
  "Lexicon & Databases"
];

export default function ToolsDashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const dropdownTools = TOOLS.filter(t => t.type === "dropdown");
  const textareaTools = TOOLS.filter(t => t.type === "textarea");

  const allTools = [
    ...dropdownTools.map(t => ({ 
      ...t, 
      path: `/tools/${t.id}`, 
      category: "Targeted Transformers", 
      colorClass: "text-brand", 
      bgClass: "bg-brand/10", 
      borderClass: "hover:border-brand/30" 
    })),
    ...textareaTools.map(t => ({ 
      ...t, 
      path: `/tools/${t.id}`, 
      category: "Analysis Extractors", 
      colorClass: "text-blue-400", 
      bgClass: "bg-blue-500/10", 
      borderClass: "hover:border-blue-400/30" 
    })),
    { 
      id: "paraphrase", title: "Paraphrase Challenge", description: "Latih kemampuan menulis ulang tanpa kehilangan esensi sastra.", 
      icon: "PenTool", path: "/tools/paraphrase", category: "Interactive & Gamification", 
      colorClass: "text-amber-400", bgClass: "bg-amber-500/10", borderClass: "hover:border-amber-400/30" 
    },
    { 
      id: "alter-ego", title: "Alter Ego Chat", description: "Ngobrol langsung dengan penulis legendaris secara interaktif.", 
      icon: "Sparkles", path: "/tools/alter-ego", category: "Interactive & Gamification", 
      colorClass: "text-purple-400", bgClass: "bg-purple-500/10", borderClass: "hover:border-purple-400/30" 
    },
    { 
      id: "story-quiz", title: "Story Mode Quiz", description: "Kuis berbasis cerpen menggunakan koleksi kosa kata Anda.", 
      icon: "CheckSquare", path: "/tools/story-quiz", category: "Interactive & Gamification", 
      colorClass: "text-green-400", bgClass: "bg-green-500/10", borderClass: "hover:border-green-400/30" 
    },
    { 
      id: "cultural-context", title: "Cultural Context Library", description: "Editor untuk menambah & mengelola referensi mitologi atau sejarah.", 
      icon: "Landmark", path: "/tools/cultural-context", category: "Lexicon & Databases", 
      colorClass: "text-amber-500", bgClass: "bg-amber-500/10", borderClass: "hover:border-amber-500/30" 
    },
    { 
      id: "idioms", title: "Idiom Library", description: "Direktori idiom bahasa Inggris beserta penjelasan & terjemahannya.", 
      icon: "Quote", path: "/idioms", category: "Lexicon & Databases", 
      colorClass: "text-emerald-500", bgClass: "bg-emerald-500/10", borderClass: "hover:border-emerald-500/30" 
    },
    { 
      id: "glossary", title: "Glossary Builder", description: "Buat glosarium kosa kata khusus per buku dengan mudah.", 
      icon: "BookOpen", path: "/glossary", category: "Lexicon & Databases", 
      colorClass: "text-blue-500", bgClass: "bg-blue-500/10", borderClass: "hover:border-blue-500/30" 
    }
  ];

  const filteredTools = allTools.filter(tool => {
    const matchesSearch = tool.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group filtered tools by category
  const groupedTools = CATEGORIES.slice(1).reduce((acc, cat) => {
    acc[cat] = filteredTools.filter(t => t.category === cat);
    return acc;
  }, {} as Record<string, typeof allTools>);

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-full animate-in fade-in duration-500">
      <div className="mb-10">
        <h1 className="text-4xl font-serif font-bold text-foreground flex items-center gap-3">
          <Wrench className="w-8 h-8 text-brand" />
          Literary Toolkits
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Kumpulan alat spesifik untuk membedah, menganalisis, dan merombak karya sastra.</p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-10">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Cari alat (contoh: 'Translator', 'Quiz', 'Idiom')..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-2xl text-foreground focus:outline-none focus:ring-2 focus:ring-brand shadow-sm transition-all"
          />
        </div>
        <div className="relative shrink-0 w-full md:w-64">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand pointer-events-none" />
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-12 pr-10 py-3 bg-card border border-border rounded-2xl text-foreground font-bold text-sm focus:outline-none focus:ring-2 focus:ring-brand shadow-sm appearance-none cursor-pointer transition-all hover:border-brand/50"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat === "All" ? "Semua Kategori" : cat}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {filteredTools.length === 0 ? (
        <div className="text-center py-20 bg-muted/50 rounded-3xl border border-dashed border-border">
          <Search className="w-12 h-12 text-muted-foreground opacity-50 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground">Tidak Ditemukan</h3>
          <p className="text-muted-foreground mt-2">Tidak ada alat yang cocok dengan pencarian "{searchQuery}".</p>
        </div>
      ) : (
        <div className="space-y-12">
          {CATEGORIES.slice(1).map(category => {
            const items = groupedTools[category];
            if (items.length === 0) return null;

            return (
              <div key={category}>
                <h2 className="text-xl font-bold text-foreground mb-6 uppercase tracking-wider border-b border-border pb-2">
                  {category}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map(tool => {
                    const Icon = iconMap[tool.icon] || Sparkles;
                    return (
                      <Link 
                        key={tool.id} 
                        href={tool.path} 
                        className={`bg-card shadow-sm backdrop-blur-md border border-border rounded-2xl p-6 hover:bg-muted transition-all group ${tool.borderClass}`}
                      >
                        <div className={`${tool.bgClass} w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                          <Icon className={`w-6 h-6 ${tool.colorClass}`} />
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-2">{tool.title}</h3>
                        <p className="text-sm text-muted-foreground">{tool.description}</p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
