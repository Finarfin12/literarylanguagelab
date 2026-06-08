"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { 
  ChevronDown, ChevronRight, LogOut, 
  BrainCircuit, Palette, BookMarked, 
  GraduationCap, Library, Briefcase, History, Sun, Moon, Sparkles
} from "lucide-react";

interface SidebarProps {
  userEmail: string | undefined;
}

const MENU_GROUPS = [
  {
    title: "LingoWise",
    icon: BrainCircuit,
    color: "text-brand",
    items: [
      { name: "OCR Lens", path: "/library/add/ocr" },
      { name: "Dialect Diver", path: "/tools/dialect-diver" },
      { name: "Tone & Grammar", path: "/tools/tone-analyzer" }, // using the standalone one, or could use dynamic
      { name: "Vibe Translator", path: "/tools/vibe-translator" },
      { name: "Mood Transformer", path: "/tools/mood-transformer" },
      { name: "Diction Lab", path: "/tools/diction-lab" },
      { name: "Era Translator", path: "/tools/era-translator" },
      { name: "Sentence Architect", path: "/tools/sentence-architect" },
      { name: "Rhetorical Spotter", path: "/tools/rhetorical-spotter" },
      { name: "Alter Ego Chat", path: "/tools/alter-ego" },
    ]
  },
  {
    title: "LinguaVisual",
    icon: Palette,
    color: "text-purple-400",
    items: [
      { name: "Imagery Sketcher", path: "/tools/imagery-sketcher" },
      { name: "Semantic Visual", path: "/tools/semantic-visual" },
      { name: "Poem to Palette", path: "/tools/poem-to-palette" },
      { name: "Sentiment Spectrum", path: "/tools/sentiment-spectrum" },
      { name: "Semantic Map", path: "/tools/semantic-map" },
    ]
  },
  {
    title: "Lexicon",
    icon: BookMarked,
    color: "text-amber-400",
    items: [
      { name: "Literary Synonyms", path: "/tools/literary-synonyms" },
      { name: "Cultural Context", path: "/tools/cultural-context" },
      { name: "Nuance Detector", path: "/tools/nuance-detector" },
      { name: "Metaphor Generator", path: "/tools/metaphor-generator" },
      { name: "Time Traveler", path: "/tools/time-traveler" },
      { name: "Lexicon Search", path: "/tools/lexicon-search" },
      { name: "A-Z Browser", path: "/tools/a-z-dictionary" },
      { name: "Vocabulary Bank", path: "/vocabulary" },
      { name: "Idiom Library", path: "/idioms" },
      { name: "Flashcard Mode", path: "/vocabulary/review" },
    ]
  },
  {
    title: "Study",
    icon: GraduationCap,
    color: "text-blue-400",
    items: [
      { name: "Translation Workshop", path: "/translation-workshop" },
      { name: "Paraphrase Challenge", path: "/tools/paraphrase" },
      { name: "Imagery Grader", path: "/tools/imagery-grader" },
      { name: "Reading Companion", path: "/library" }, // Instruct them it's inside reader
      { name: "Character Monologue", path: "/tools/character-monologue" },
      { name: "Academic Outline", path: "/tools/academic-outline" },
      { name: "Essay Auditor", path: "/tools/essay-auditor" },
      { name: "Story Quiz", path: "/tools/story-quiz" },
      { name: "Plot Twist", path: "/tools/plot-twist" },
      { name: "Conflict Mapper", path: "/tools/conflict-mapper" },
      { name: "Critical Lens", path: "/tools/critical-lens" },
    ]
  },
  {
    title: "History",
    icon: History,
    color: "text-foreground",
    items: [
      { name: "Archive & Insights", path: "/history" },
    ]
  }
];

export default function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "LingoWise": true, // open first one by default
  });

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const WOTD = { word: "Mellifluous", def: "Sweet or musical; pleasant to hear." };

  return (
    <aside className="w-80 border-r border-white/5 bg-background/50 backdrop-blur-2xl flex flex-col shadow-2xl relative z-10 transition-all h-full">
      <div className="p-6 shrink-0 flex items-center justify-between">
        <h2 className="text-2xl font-serif font-bold text-brand flex items-center gap-2">
          <BrainCircuit className="w-6 h-6" />
          Literary Lab
        </h2>
        <button 
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-muted-foreground hover:text-brand"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      <div className="px-6 mb-4">
        <div className="bg-brand/10 border border-brand/20 p-4 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-20"><Sparkles className="w-12 h-12 text-brand" /></div>
          <p className="text-xs font-bold text-brand uppercase tracking-wider mb-1">Word of the Day</p>
          <p className="text-lg font-serif font-bold text-foreground">{WOTD.word}</p>
          <p className="text-sm text-muted-foreground italic mt-1 relative z-10">"{WOTD.def}"</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
        <div className="space-y-4 pb-8">
          {MENU_GROUPS.map((group) => {
            const Icon = group.icon;
            const isOpen = openGroups[group.title];
            
            // Check if any child is active
            const isChildActive = group.items.some(item => pathname === item.path);

            return (
              <div key={group.title} className="bg-white/5 rounded-2xl overflow-hidden border border-white/5">
                <button 
                  onClick={() => toggleGroup(group.title)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${group.color}`} />
                    <span className={`font-bold ${isChildActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {group.title}
                    </span>
                  </div>
                  {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </button>
                
                {isOpen && (
                  <div className="px-4 pb-4 space-y-1">
                    {group.items.map((item) => {
                      const isActive = pathname === item.path;
                      return (
                        <Link 
                          key={item.name} 
                          href={item.path}
                          className={`block px-4 py-2 text-sm rounded-xl transition-all ${
                            isActive 
                              ? `bg-white/10 ${group.color} font-bold` 
                              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                          }`}
                        >
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-white/10 shrink-0 bg-background">
        <div className="flex items-center justify-between">
          <span className="text-xs truncate text-muted-foreground max-w-[180px]">{userEmail || "guest"}</span>
          <form action="/auth/signout" method="post">
            <button className="p-2 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors" title="Sign Out">
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
