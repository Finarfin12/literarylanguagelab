"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { 
  ChevronDown, ChevronRight, LogOut, 
  BrainCircuit, Palette, BookMarked, 
  GraduationCap, Library, Briefcase, History, Sun, Moon, Sparkles, User, Settings,
  Menu, PanelLeftClose, BookOpen, MessageSquare
} from "lucide-react";

interface SidebarProps {
  userEmail?: string;
  userName?: string;
  userAvatar?: string;
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

export default function Sidebar({ userEmail, userName, userAvatar }: SidebarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "LingoWise": true, // open first one by default
  });

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const [mounted, setMounted] = useState(false);
  // Ensure we only render the random word on client to avoid hydration mismatch
  useState(() => setMounted(true));

  const words = [
    { word: "Mellifluous", def: "Sweet or musical; pleasant to hear." },
    { word: "Serendipity", def: "The occurrence of events by chance in a happy or beneficial way." },
    { word: "Epiphany", def: "A moment of sudden revelation or insight." },
    { word: "Petrichor", def: "A pleasant smell that frequently accompanies the first rain after a long period of warm, dry weather." },
    { word: "Luminous", def: "Full of or shedding light; bright or shining, especially in the dark." },
    { word: "Eloquence", def: "Fluent or persuasive speaking or writing." },
    { word: "Ineffable", def: "Too great or extreme to be expressed or described in words." }
  ];
  const today = new Date().getDate();
  const WOTD = words[today % words.length];

  return (
    <>
      {!isSidebarOpen && (
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="fixed top-6 left-6 z-50 p-2.5 bg-card/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-lg hover:bg-white/10 transition-colors group"
          title="Buka Menu"
        >
          <Menu className="w-5 h-5 text-foreground group-hover:text-brand transition-colors" />
        </button>
      )}

      <aside className={`transition-all duration-300 ease-in-out border-r border-white/5 bg-background/50 backdrop-blur-2xl flex flex-col shadow-2xl relative z-40 h-full ${
        isSidebarOpen ? "w-80 translate-x-0" : "w-0 -translate-x-full opacity-0 overflow-hidden border-none"
      }`}>
        <div className="p-6 shrink-0 flex items-center justify-between">
          <h2 className="text-2xl font-serif font-bold text-brand flex items-center gap-2 whitespace-nowrap">
            <BrainCircuit className="w-6 h-6" />
            Literary Lab
          </h2>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-muted-foreground hover:text-red-400"
              title="Tutup Menu"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-muted-foreground hover:text-brand"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

      <div className="px-6 mb-4" suppressHydrationWarning>
        <div className="bg-brand/10 border border-brand/20 p-4 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-2 opacity-20"><Sparkles className="w-12 h-12 text-brand" /></div>
          <p className="text-xs font-bold text-brand uppercase tracking-wider mb-1">Word of the Day</p>
          <p className="text-lg font-serif font-bold text-foreground">{WOTD.word}</p>
          <p className="text-sm text-muted-foreground italic mt-1 relative z-10">"{WOTD.def}"</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
        <div className="space-y-4 pb-8">
          
          {/* Standalone A-Z Browser Link */}
          <Link 
            href="/tools/a-z-dictionary"
            className={`w-full flex items-center p-4 rounded-2xl transition-all border ${
              pathname === '/tools/a-z-dictionary' 
                ? 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                : 'bg-white/5 border-white/5 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <BookOpen className={`w-5 h-5 ${pathname === '/tools/a-z-dictionary' ? 'text-emerald-400' : 'text-emerald-500'}`} />
              <span className={`font-bold ${pathname === '/tools/a-z-dictionary' ? 'text-foreground' : 'text-muted-foreground'}`}>
                A-Z Browser
              </span>
            </div>
          </Link>

          {/* Standalone Forum Link */}
          <Link 
            href="/forum"
            className={`w-full flex items-center p-4 rounded-2xl transition-all border ${
              pathname.startsWith('/forum') 
                ? 'bg-brand/10 border-brand/20 shadow-[0_0_15px_rgba(62,207,142,0.15)]' 
                : 'bg-white/5 border-white/5 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <MessageSquare className={`w-5 h-5 ${pathname.startsWith('/forum') ? 'text-brand' : 'text-brand/70'}`} />
              <span className={`font-bold ${pathname.startsWith('/forum') ? 'text-foreground' : 'text-muted-foreground'}`}>
                Forum Komunitas
              </span>
            </div>
          </Link>

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

      <div className="p-4 border-t border-white/10 shrink-0 bg-background flex items-center justify-between gap-2">
        <Link href="/profile" className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-xl transition-colors flex-1 overflow-hidden group">
          {userAvatar ? (
            <img src={userAvatar} className="w-9 h-9 rounded-full object-cover shrink-0 border border-white/10 group-hover:border-brand/50 transition-colors" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-brand/20 flex items-center justify-center shrink-0 border border-brand/30">
              <User className="w-4 h-4 text-brand" />
            </div>
          )}
          <div className="flex flex-col truncate">
            <span className="text-sm font-bold text-foreground truncate">{userName || userEmail?.split('@')[0] || "Guest"}</span>
            <span className="text-xs text-muted-foreground truncate">{userEmail || "Not logged in"}</span>
          </div>
        </Link>
        <form action="/auth/signout" method="post" className="shrink-0 flex items-center">
          <Link href="/settings" className="p-2 rounded-xl text-muted-foreground hover:text-brand hover:bg-brand/10 transition-colors" title="Settings">
            <Settings className="w-4 h-4" />
          </Link>
          <button className="p-2 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors" title="Sign Out">
            <LogOut className="w-4 h-4" />
          </button>
        </form>
      </div>
    </aside>
    </>
  );
}
