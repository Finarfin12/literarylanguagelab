"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { MessageSquare, Plus, Clock, Users, Book, PenTool, Coffee, HelpCircle, Gamepad2, Search, ArrowLeft, Pin, Sparkles, Trash2, X, Save, Loader2 } from "lucide-react";
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
  author?: {
    full_name: string;
    avatar_url?: string;
  }
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
  
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("message-square");
  const [addingCat, setAddingCat] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      // Get current user and profile
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role, level').eq('id', user.id).single();
        setCurrentUserProfile(profile);
      }

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
        const userIds = [...new Set(ths.map((t: any) => t.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', userIds);

        const profileMap: Record<string, any> = {};
        if (profilesData) {
          profilesData.forEach(p => profileMap[p.id] = p);
        }

        const formattedThreads = ths.map(t => ({
          ...t,
          comments_count: t.forum_comments[0]?.count || 0,
          author: profileMap[t.user_id] || { full_name: "Penulis" }
        }));
        setThreads(formattedThreads);
      }

      setLoading(false);
    }
    loadData();
  }, []);

  const handleDeleteThread = async (e: React.MouseEvent, threadId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const result = await Swal.fire({
      title: 'Hapus Diskusi?',
      text: "Anda tidak akan bisa mengembalikannya!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#2fa16b',
      confirmButtonText: 'Ya, hapus!'
    });

    if (result.isConfirmed) {
      const { error } = await supabase.from('forum_threads').delete().eq('id', threadId);
      if (error) {
        Swal.fire({ title: "Gagal", text: error.message, icon: "error", confirmButtonColor: "#2fa16b" });
      } else {
        setThreads(threads.filter(t => t.id !== threadId));
        Swal.fire({ title: "Berhasil", text: "Diskusi telah dihapus.", icon: "success", timer: 1500, showConfirmButton: false });
      }
    }
  };

  // Filter threads for active category
  const filteredThreads = activeCategory 
    ? threads.filter(t => t.category_id === activeCategory.id)
    : [];

  const announcements = threads.filter((t: any) => t.is_announcement);
  const recentThreads = threads.filter((t: any) => !t.is_announcement).slice(0, 3);

  const isAdmin = currentUserProfile?.role === 'admin';

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingCat(true);
    const slug = newCatName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const { data, error } = await supabase.from('forum_categories').insert({
      name: newCatName,
      description: newCatDesc,
      icon: newCatIcon,
      slug
    }).select().single();

    if (error) {
      Swal.fire({ title: "Gagal", text: error.message, icon: "error" });
    } else if (data) {
      setCategories([...categories, data]);
      setShowCategoryModal(false);
      setNewCatName("");
      setNewCatDesc("");
      Swal.fire({ title: "Berhasil", text: "Kategori ditambahkan.", icon: "success", timer: 1500, showConfirmButton: false });
    }
    setAddingCat(false);
  };

  const ThreadCard = ({ thread, showCategory = false }: { thread: Thread, showCategory?: boolean }) => {
    const cat = categories.find(c => c.id === thread.category_id);
    const canDelete = currentUser && (currentUser.id === thread.user_id || currentUserProfile?.role === 'admin');

    return (
      <Link 
        href={`/forum/thread/${thread.id}`} 
        className="relative block bg-card border border-foreground/10 dark:border-border rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
      >
        {canDelete && (
          <button 
            onClick={(e) => handleDeleteThread(e, thread.id)}
            className="absolute top-4 right-4 z-10 p-2 text-muted-foreground hover:text-red-400 bg-foreground/5 hover:bg-foreground/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
            title="Hapus Diskusi"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3 pr-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-brand/10 border border-brand/20 shrink-0 flex items-center justify-center">
                {thread.author?.avatar_url ? (
                  <img src={thread.author.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-brand font-bold text-[10px] uppercase">{thread.author?.full_name?.charAt(0) || '?'}</span>
                )}
              </div>
              <span className="text-xs font-bold text-muted-foreground">{thread.author?.full_name}</span>
              {(thread as any).is_announcement && (
                <span className="flex items-center gap-1 bg-red-500/10 text-red-500 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ml-2">
                  <Pin className="w-3 h-3" /> PENGUMUMAN
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold text-foreground group-hover:text-brand transition-colors">
              {thread.title}
            </h3>
          </div>
          {showCategory && cat && (
            <span className="bg-brand/10 text-brand text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap mt-1">
              {cat.name}
            </span>
          )}
        </div>
        
        <p className="text-muted-foreground line-clamp-2 mb-4 text-sm leading-relaxed pr-10">
          {thread.content}
        </p>
        
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground font-medium">
          <div className="flex items-center gap-1.5 bg-foreground/5 dark:bg-muted px-3 py-1.5 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            {new Date(thread.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
          <div className="flex items-center gap-1.5 bg-foreground/5 dark:bg-muted px-3 py-1.5 rounded-full">
            <MessageSquare className="w-3.5 h-3.5" />
            {thread.comments_count} balasan
          </div>
          <div className="flex items-center gap-1.5 bg-foreground/5 dark:bg-muted px-3 py-1.5 rounded-full">
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
          
          {/* Announcements Section */}
          {announcements.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-6 border-b border-foreground/10 pb-4">
                <Pin className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-bold text-foreground font-serif">Pengumuman Admin</h2>
              </div>
              <div className="space-y-4">
                {announcements.map(thread => (
                  <ThreadCard key={thread.id} thread={thread} showCategory={true} />
                ))}
              </div>
            </section>
          )}

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
            <div className="flex items-center justify-between mb-6 border-b border-foreground/10 pb-4">
              <div className="flex items-center gap-2">
                <Book className="w-6 h-6 text-brand" />
                <h2 className="text-2xl font-bold text-foreground font-serif">Kategori Ruang</h2>
              </div>
              {isAdmin && (
                <button 
                  onClick={() => setShowCategoryModal(true)}
                  className="flex items-center gap-2 bg-brand/10 text-brand px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand/20 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Tambah Kategori
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categories.map(cat => {
                const Icon = iconMap[cat.icon] || MessageSquare;
                const catThreads = threads.filter(t => t.category_id === cat.id);
                
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat)}
                    className="flex items-start gap-5 p-6 bg-card border border-foreground/10 dark:border-border rounded-3xl hover:border-brand hover:shadow-lg transition-all text-left group"
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

      {/* Admin Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-foreground/10 shadow-2xl rounded-3xl p-8 max-w-md w-full animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-foreground font-serif">Tambah Kategori</h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-foreground mb-1">Nama Kategori</label>
                <input 
                  type="text" 
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-brand"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-foreground mb-1">Deskripsi Singkat</label>
                <textarea 
                  value={newCatDesc}
                  onChange={e => setNewCatDesc(e.target.value)}
                  className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-brand resize-none"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-foreground mb-1">Pilih Ikon</label>
                <select 
                  value={newCatIcon}
                  onChange={e => setNewCatIcon(e.target.value)}
                  className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-brand"
                >
                  <option value="book">Book</option>
                  <option value="pen-tool">Pen Tool</option>
                  <option value="coffee">Coffee</option>
                  <option value="help-circle">Help/Q&A</option>
                  <option value="gamepad-2">Games</option>
                  <option value="message-square">Chat</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCategoryModal(false)} className="px-6 py-2.5 rounded-xl font-bold text-muted-foreground hover:bg-foreground/5 transition-colors">
                  Batal
                </button>
                <button type="submit" disabled={addingCat} className="px-6 py-2.5 bg-brand text-background rounded-xl font-bold hover:bg-brand/90 transition-colors disabled:opacity-50 flex items-center gap-2">
                  {addingCat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
