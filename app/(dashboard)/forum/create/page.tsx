"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { ArrowLeft, Send, Loader2, Book, PenTool, Coffee, HelpCircle, Gamepad2 } from "lucide-react";
import Swal from 'sweetalert2';

interface Category {
  id: string;
  name: string;
  icon: string;
}

const iconMap: Record<string, any> = {
  'book': Book,
  'pen-tool': PenTool,
  'coffee': Coffee,
  'help-circle': HelpCircle,
  'gamepad-2': Gamepad2
};

export default function CreateThreadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultCategoryId = searchParams.get('category');
  
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase.from('forum_categories').select('*').order('created_at', { ascending: true });
      if (data && data.length > 0) {
        setCategories(data);
        if (defaultCategoryId && data.some(c => c.id === defaultCategoryId)) {
          setCategoryId(defaultCategoryId);
        } else {
          setCategoryId(data[0].id);
        }
      }
    }
    loadCategories();
  }, [defaultCategoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !categoryId) {
      Swal.fire({ title: "Perhatian", text: "Judul dan isi diskusi harus diisi!", icon: "warning", confirmButtonColor: "#2fa16b" });
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      Swal.fire({ title: "Oops!", text: "Anda harus login untuk membuat diskusi.", icon: "error", confirmButtonColor: "#2fa16b" });
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('forum_threads')
      .insert({
        title,
        content,
        category_id: categoryId,
        user_id: user.id
      })
      .select()
      .single();

    if (error) {
      Swal.fire({ title: "Gagal", text: error.message, icon: "error", confirmButtonColor: "#2fa16b" });
      setLoading(false);
    } else if (data) {
      Swal.fire({ 
        title: "Berhasil!", 
        text: "Diskusi Anda telah diterbitkan.", 
        icon: "success", 
        confirmButtonColor: "#2fa16b",
        timer: 2000,
        showConfirmButton: false
      });
      router.push(`/forum/thread/${data.id}`);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-[calc(100vh-2rem)] flex flex-col">
      <Link href="/forum" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors w-max">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Forum
      </Link>

      <div className="mb-8">
        <h1 className="text-4xl font-serif font-bold text-foreground">Mulai Diskusi Baru</h1>
        <p className="text-muted-foreground mt-2">Pilih kategori yang tepat agar diskusi Anda mudah ditemukan oleh penulis lain.</p>
      </div>

      <div className="bg-card/40 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-xl flex-1">
        <form onSubmit={handleSubmit} className="space-y-6 flex flex-col h-full">
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">Pilih Kategori</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map(cat => {
                const Icon = iconMap[cat.icon] || Book;
                const isSelected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={`p-4 rounded-2xl flex items-center gap-3 transition-all border text-left ${
                      isSelected 
                        ? 'bg-brand/10 border-brand text-brand shadow-[0_0_15px_rgba(62,207,142,0.15)]' 
                        : 'bg-background/50 border-white/10 text-muted-foreground hover:bg-white/5 hover:border-white/20 hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className={`font-bold text-sm ${isSelected ? 'text-brand' : 'text-foreground'}`}>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground mb-2">Judul Diskusi</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Bagaimana cara mengatasi writer's block?"
              className="w-full bg-background/50 border border-white/10 rounded-xl px-5 py-4 text-foreground focus:ring-2 focus:ring-brand outline-none transition-all placeholder:text-muted-foreground/50 font-serif text-lg"
              maxLength={150}
            />
          </div>

          <div className="flex-1 flex flex-col min-h-[300px]">
            <label className="block text-sm font-bold text-foreground mb-2">Isi Pesan</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tuliskan gagasan, pertanyaan, atau karya Anda di sini..."
              className="w-full flex-1 bg-background/50 border border-white/10 rounded-xl px-5 py-4 text-foreground focus:ring-2 focus:ring-brand outline-none transition-all placeholder:text-muted-foreground/50 resize-y min-h-[300px] leading-relaxed"
            />
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button
              type="submit"
              disabled={loading || !title.trim() || !content.trim() || !categoryId}
              className="bg-brand text-background px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-brand-hover hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Menerbitkan...</>
              ) : (
                <><Send className="w-5 h-5" /> Terbitkan Diskusi</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
