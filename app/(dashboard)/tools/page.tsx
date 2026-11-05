"use client";

import { useState } from "react";
import Link from "next/link";
import { TOOLS } from "@/lib/tools-config";
import { ALL_CATEGORY, TOOL_CATEGORIES, categoryOf, filterTools, groupToolsByCategory } from "@/lib/tool-categories";
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

import AnimatedPage from "@/components/AnimatedPage";

export default function ToolsDashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORY);

  const dropdownTools = TOOLS.filter(t => t.type === "dropdown");
  const textareaTools = TOOLS.filter(t => t.type === "textarea");

  const rawTools = [
    ...dropdownTools.map(t => ({ 
      ...t, 
      path: `/tools/${t.id}`, 
      colorClass: "text-brand-ink", 
      bgClass: "bg-brand-tint", 
      borderClass: "hover:border-brand/30" 
    })),
    ...textareaTools.map(t => ({ 
      ...t, 
      path: `/tools/${t.id}`, 
      colorClass: "text-foreground", 
      bgClass: "bg-muted", 
      borderClass: "hover:border-border" 
    })),
    { 
      id: "paraphrase", title: "Paraphrase Challenge", description: "Latih kemampuan menulis ulang tanpa kehilangan esensi sastra.", 
      icon: "PenTool", path: "/tools/paraphrase", 
      colorClass: "text-foreground", bgClass: "bg-muted", borderClass: "hover:border-border" 
    },
    { 
      id: "alter-ego", title: "Alter Ego Chat", description: "Ngobrol langsung dengan penulis legendaris secara interaktif.", 
      icon: "Sparkles", path: "/tools/alter-ego", 
      colorClass: "text-foreground", bgClass: "bg-muted", borderClass: "hover:border-border" 
    },
    { 
      id: "story-quiz", title: "Story Mode Quiz", description: "Kuis berbasis cerpen menggunakan koleksi kosa kata Anda.", 
      icon: "CheckSquare", path: "/tools/story-quiz", 
      colorClass: "text-foreground", bgClass: "bg-muted", borderClass: "hover:border-border" 
    },
    { 
      id: "cultural-context", title: "Cultural Context Library", description: "Editor untuk menambah & mengelola referensi mitologi atau sejarah.", 
      icon: "Landmark", path: "/tools/cultural-context", 
      colorClass: "text-foreground", bgClass: "bg-muted", borderClass: "hover:border-border" 
    },
    { 
      id: "idioms", title: "Idiom Library", description: "Direktori idiom bahasa Inggris beserta penjelasan & terjemahannya.", 
      icon: "Quote", path: "/idioms", 
      colorClass: "text-foreground", bgClass: "bg-muted", borderClass: "hover:border-border" 
    },
    { 
      id: "glossary", title: "Glossary Builder", description: "Buat glosarium kosa kata khusus per buku dengan mudah.", 
      icon: "BookOpen", path: "/glossary", 
      colorClass: "text-foreground", bgClass: "bg-muted", borderClass: "hover:border-border" 
    }
  ];

  // Kategori ada di lib/tool-categories.ts (diuji: setiap alat punya kategori)
  const allTools = rawTools.map((t) => ({ ...t, category: categoryOf(t.id) }));

  const filteredTools = filterTools(allTools, { query: searchQuery, category: selectedCategory });
  const groups = groupToolsByCategory(filteredTools);

  return (
    <AnimatedPage className="p-4 lg:p-8 max-w-7xl mx-auto pb-24">
      <div className="mb-10">
        <h1 className="text-[28px] md:text-4xl leading-[1.15] font-serif font-medium text-foreground flex items-center gap-3">
          <Wrench className="w-8 h-8 text-brand-ink" />
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
            className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-card text-foreground focus:outline-none focus:ring-2 focus:ring-brand transition-all"
          />
        </div>
        <div className="relative shrink-0 w-full md:w-64">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-ink pointer-events-none" />
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full pl-12 pr-10 py-3 bg-card border border-border rounded-card text-foreground font-bold text-sm focus:outline-none focus:ring-2 focus:ring-brand appearance-none cursor-pointer transition-all hover:border-brand/50"
          >
            <option value={ALL_CATEGORY}>Semua Alat</option>
            {TOOL_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
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
        <div className="text-center py-20 bg-muted/50 rounded-card border border-dashed border-border">
          <Search className="w-12 h-12 text-muted-foreground opacity-50 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-foreground">Tidak Ditemukan</h3>
          <p className="text-muted-foreground mt-2">Tidak ada alat yang cocok dengan pencarian "{searchQuery}".</p>
        </div>
      ) : (
        <div className="space-y-12">
          {groups.map((group) => {
            const items = group.tools;

            return (
              <div key={group.id}>
                <h2 className="text-xl font-bold text-foreground uppercase tracking-wider border-b border-border pb-2">
                  {group.label}
                </h2>
                <p className="text-sm text-muted-foreground mt-2 mb-6">{group.blurb}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map(tool => {
                    const Icon = iconMap[tool.icon] || Sparkles;
                    return (
                      <Link 
                        key={tool.id} 
                        href={tool.path} 
                        className={`bg-card  border border-border rounded-card p-6 hover:bg-muted transition-all duration-300  active:scale-[0.98] group ${tool.borderClass}`}
                      >
                        <div className={`${tool.bgClass} w-12 h-12 rounded-control flex items-center justify-center mb-4  transition-transform`}>
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
    </AnimatedPage>
  );
}
