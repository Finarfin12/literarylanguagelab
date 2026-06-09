"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { MessageSquare, Plus, Clock, Users, Book, PenTool, Coffee, HelpCircle, Gamepad2, Search } from "lucide-react";
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
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
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
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
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

      // Load all threads with author profile and comment count
      // Note: we can join profiles if they exist, but user metadata is in auth.users
      // Since we can't join auth.users directly via JS client securely, we will just show the name later, or fetch it.
      // Wait, Supabase doesn't allow joining auth.users easily from client.
      // We will just fetch threads.
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

  const filteredThreads = activeCategory 
    ? threads.filter(t => t.category_id === activeCategory)
    : threads;

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <button
            onClick={() => setActiveCategory(null)}
            className={`w-full text-left px-5 py-4 rounded-2xl transition-all flex items-center gap-3 ${
              activeCategory === null 
                ? 'bg-brand/10 border border-brand/20 text-brand font-bold shadow-sm' 
                : 'hover:bg-white/5 border border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            Semua Diskusi
          </button>

          {categories.map(cat => {
            const Icon = iconMap[cat.icon] || MessageSquare;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full text-left px-5 py-4 rounded-2xl transition-all flex flex-col gap-1 ${
                  isActive 
                    ? 'bg-card border border-white/10 text-foreground font-bold shadow-md' 
                    : 'hover:bg-white/5 border border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-brand' : ''}`} />
                  {cat.name}
                </div>
              </button>
            );
          })}
        </div>

        {/* Threads List */}
        <div className="lg:col-span-3 space-y-4">
          {loading ? (
            <div className="text-center py-20 text-muted-foreground animate-pulse">Memuat diskusi...</div>
          ) : filteredThreads.length === 0 ? (
            <div className="text-center py-20 bg-card/30 border border-white/5 rounded-3xl">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-bold text-foreground">Belum ada diskusi di kategori ini.</p>
              <p className="text-muted-foreground mt-1 mb-6">Jadilah yang pertama untuk memulai percakapan!</p>
              <Link 
                href={`/forum/create${activeCategory ? `?category=${activeCategory}` : ''}`}
                className="bg-brand/10 text-brand px-6 py-2.5 rounded-xl font-bold hover:bg-brand/20 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" /> Mulai Diskusi
              </Link>
            </div>
          ) : (
            filteredThreads.map(thread => (
              <Link 
                href={`/forum/thread/${thread.id}`} 
                key={thread.id}
                className="block bg-card/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-card hover:shadow-xl transition-all group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                  <h3 className="text-xl font-bold text-foreground group-hover:text-brand transition-colors">
                    {thread.title}
                  </h3>
                </div>
                
                <p className="text-muted-foreground line-clamp-2 mb-4 text-sm leading-relaxed">
                  {thread.content}
                </p>
                
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground font-medium">
                  <div className="flex items-center gap-1.5 bg-background/50 px-3 py-1.5 rounded-full border border-white/5">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(thread.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-1.5 bg-background/50 px-3 py-1.5 rounded-full border border-white/5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {thread.comments_count} balasan
                  </div>
                  <div className="flex items-center gap-1.5 bg-background/50 px-3 py-1.5 rounded-full border border-white/5">
                    <Users className="w-3.5 h-3.5" />
                    {thread.view_count} tayangan
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
