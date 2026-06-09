"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { MessageSquare, Plus, Clock, Users, Book, PenTool, Coffee, HelpCircle, Gamepad2, Search, ArrowLeft, Pin, Sparkles } from "lucide-react";
import Swal from 'sweetalert2';

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface Thread {
  id: string;
  title: string;
  content: string;
  view_count: number;
  created_at: string;
  user_id: string;
  category_id: string;
  comments_count?: number;
}

const iconMap: Record<string, any> = {
  'book': Book,
  'pen-tool': PenTool,
  'coffee': Coffee,
  'help-circle': HelpCircle,
  'gamepad-2': Gamepad2
};

export default function ForumPage() {
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      // Load categories
      const { data: cats, error: catError } = await supabase
        .from('forum_categories')
        .select('*')
        .order('created_at', { ascending: true });
        
      if (catError) {
        Swal.fire({ title: "Error", text: catError.message, icon: "error", confirmButtonColor: "#2fa16b" });
      } else if (cats) {
        setCategories(cats);
      }

      // Load all threads with comment count
      const { data: ths, error: thError } = await supabase
        .from('forum_threads')
        .select(`
          *,
          forum_comments(count)
        `)
        .order('created_at', { ascending: false });

      if (thError) {
         console.error(thError);
      } else if (ths) {
        const formattedThreads = ths.map(t => ({
          ...t,
          comments_count: t.forum_comments[0]?.count || 0
        }));
        setThreads(formattedThreads);
      }

      setLoading(false);
    }
    loadData();
  }, []);

  // Filter threads for active category
  const filteredThreads = activeCategory 
    ? threads.filter(t => t.category_id === activeCategory.id)
    : [];

  // Recent threads for home page (max 3)
  const recentThreads = threads.slice(0, 3);

  const ThreadCard = ({ thread, showCategory = false }: { thread: Thread, showCategory?: boolean }) => {
    const cat = categories.find(c => c.id === thread.category_id);
    return (
      <Link 
        href={`/forum/thread/${thread.id}`} 
        className="block bg-card border border-foreground/10 dark:border-white/10 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <h3 className="text-xl font-bold text-foreground group-hover:text-brand transition-colors">
            {thread.title}
          </h3>
          {showCategory && cat && (
            <span className="bg-brand/10 text-brand text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
              {cat.name}
            </span>
          )}
        </div>
        
        <p className="text-muted-foreground line-clamp-2 mb-4 text-sm leading-relaxed">
          {thread.content}
        </p>
        
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground font-medium">
          <div className="flex items-center gap-1.5 bg-foreground/5 dark:bg-white/5 px-3 py-1.5 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            {new Date(thread.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
          <div className="flex items-center gap-1.5 bg-foreground/5 dark:bg-white/5 px-3 py-1.5 rounded-full">
            <MessageSquare className="w-3.5 h-3.5" />
            {thread.comments_count} balasan
          </div>
          <div className="flex items-center gap-1.5 bg-foreground/5 dark:bg-white/5 px-3 py-1.5 rounded-full">
            <Users className="w-3.5 h-3.5" />
            {thread.view_count} tayangan
          </div>
        </div>
      </Link>
    );
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-brand animate-pulse">Memuat forum...</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-serif font-bold text-foreground flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-brand" />
            Forum Diskusi
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Tempat bertukar pikiran, berbagi karya, dan berkolaborasi dengan penulis lain.</p>
        </div>
        
        <Link 
          href="/forum/create" 
          className="flex items-center gap-2 bg-brand text-background px-6 py-3 rounded-xl font-bold hover:bg-brand-hover hover:scale-105 transition-all shadow-lg shadow-brand/20 shrink-0"
        >
          <Plus className="w-5 h-5" /> Buat Diskusi Baru
        </Link>
      </div>

      {!activeCategory ? (
        /* --- FORUM HOME --- */
        <div className="space-y-12">
          
          {/* Recent Posts Section */}
          <section>
            <div className="flex items-center gap-2 mb-6 border-b border-foreground/10 pb-4">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl font-bold text-foreground font-serif">Diskusi Terbaru</h2>
            </div>
            
            {recentThreads.length > 0 ? (
              <div className="space-y-4">
                {recentThreads.map(thread => (
                  <ThreadCard key={thread.id} thread={thread} showCategory={true} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card border border-foreground/5 rounded-3xl">
                <p className="text-muted-foreground">Belum ada diskusi sama sekali.</p>
              </div>
            )}
          </section>

          {/* Categories Section (Forum Board Layout) */}
          <section>
            <div className="flex items-center gap-2 mb-6 border-b border-foreground/10 pb-4">
              <Book className="w-6 h-6 text-brand" />
              <h2 className="text-2xl font-bold text-foreground font-serif">Kategori Ruang</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categories.map(cat => {
                const Icon = iconMap[cat.icon] || MessageSquare;
                const catThreads = threads.filter(t => t.category_id === cat.id);
                
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat)}
                    className="flex items-start gap-5 p-6 bg-card border border-foreground/10 dark:border-white/10 rounded-3xl hover:border-brand hover:shadow-lg transition-all text-left group"
                  >
                    <div className="p-4 bg-brand/10 rounded-2xl shrink-0 group-hover:scale-110 transition-transform">
                      <Icon className="w-8 h-8 text-brand" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground group-hover:text-brand transition-colors mb-2">{cat.name}</h3>
                      <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">{cat.description}</p>
                      <div className="mt-4 flex items-center gap-3 text-xs font-bold text-muted-foreground">
                        <span className="bg-foreground/5 px-2 py-1 rounded-md">{catThreads.length} Diskusi</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

        </div>
      ) : (
        /* --- CATEGORY THREADS VIEW --- */
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button 
            onClick={() => setActiveCategory(null)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Kategori Utama
          </button>

          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-brand/10 rounded-2xl shrink-0">
              {(() => {
                const Icon = iconMap[activeCategory.icon] || MessageSquare;
                return <Icon className="w-8 h-8 text-brand" />;
              })()}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground font-serif mb-2">{activeCategory.name}</h2>
              <p className="text-muted-foreground">{activeCategory.description}</p>
            </div>
          </div>

          <div className="space-y-4">
            {filteredThreads.length === 0 ? (
              <div className="text-center py-20 bg-card border border-foreground/5 rounded-3xl">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-bold text-foreground">Belum ada diskusi di kategori ini.</p>
                <p className="text-muted-foreground mt-1 mb-6">Jadilah yang pertama untuk memulai percakapan!</p>
                <Link 
                  href={`/forum/create?category=${activeCategory.id}`}
                  className="bg-brand/10 text-brand px-6 py-2.5 rounded-xl font-bold hover:bg-brand/20 transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" /> Mulai Diskusi
                </Link>
              </div>
            ) : (
              filteredThreads.map(thread => (
                <ThreadCard key={thread.id} thread={thread} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
