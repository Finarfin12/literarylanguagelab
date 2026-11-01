"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { ArrowLeft, Send, Loader2, Book, PenTool, Coffee, HelpCircle, Gamepad2, Bold, Italic, Link as LinkIcon, Image as ImageIcon, Heading, Strikethrough, Code, Quote, List, ListOrdered, Mic, MicOff } from "lucide-react";
import Swal from 'sweetalert2';
import { useSpeechToText } from "@/hooks/useSpeechToText";

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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  const { isRecording, isProcessing, transcript, startRecording, stopRecording } = useSpeechToText({
    onComplete: (speechText) => {
      setContent((prev) => prev + (prev.trim() ? " " : "") + speechText);
    }
  });

  useEffect(() => {
    async function loadCategories() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        setCurrentUserProfile(profile);
      }

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
        user_id: user.id,
        is_announcement: isAnnouncement
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

  const insertFormatting = (syntaxStart: string, syntaxEnd: string = '', isWrap = true) => {
    const textarea = document.getElementById('content-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let newContent = content;
    const endMarker = isWrap ? (syntaxEnd || syntaxStart) : '';
    
    if (isWrap) {
      newContent = content.substring(0, start) + syntaxStart + selectedText + endMarker + content.substring(end);
    } else {
      newContent = content.substring(0, start) + syntaxStart + content.substring(end);
    }
    
    setContent(newContent);
    
    // Reset focus and cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = isWrap ? start + syntaxStart.length + selectedText.length + endMarker.length : start + syntaxStart.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({ title: "Perhatian", text: "Ukuran gambar maksimal 5MB.", icon: "warning", confirmButtonColor: "#2fa16b" });
      return;
    }

    setUploadingImage(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('forum_images')
      .upload(`posts/${fileName}`, file);

    if (error) {
      Swal.fire({ title: "Gagal", text: "Gagal mengunggah gambar: " + error.message, icon: "error", confirmButtonColor: "#2fa16b" });
      setUploadingImage(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('forum_images')
      .getPublicUrl(`posts/${fileName}`);

    insertFormatting(`\n![gambar](${publicUrl})\n`, '', false);
    setUploadingImage(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-[calc(100vh-2rem)] flex flex-col">
      <Link href="/forum" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors w-max">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Forum
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl md:text-4xl font-serif font-bold text-foreground">Mulai Diskusi Baru</h1>
        <p className="text-muted-foreground mt-2">Pilih kategori yang tepat agar diskusi Anda mudah ditemukan oleh penulis lain.</p>
      </div>

      <div className="bg-card shadow-sm border border-border rounded-3xl p-4 md:p-8 shadow-xl flex-1">
        <form onSubmit={handleSubmit} className="space-y-6 flex flex-col h-full">
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">Kategori Diskusi</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-3.5 text-foreground focus:ring-2 focus:ring-brand outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="" disabled>-- Pilih Kategori --</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground mb-2">Judul Diskusi</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Bagaimana cara mengatasi writer's block?"
              className="w-full bg-background border border-border rounded-xl px-5 py-4 text-foreground focus:ring-2 focus:ring-brand outline-none transition-all placeholder:text-muted-foreground/50 font-serif text-lg"
              maxLength={150}
            />
          </div>

          {currentUserProfile?.role === 'admin' && (
            <div>
              <label className="flex items-center gap-2 cursor-pointer bg-danger-tint p-4 rounded-xl border border-danger/30 w-max">
                <input 
                  type="checkbox" 
                  checked={isAnnouncement}
                  onChange={e => setIsAnnouncement(e.target.checked)}
                  className="w-5 h-5 accent-danger"
                />
                <span className="text-sm font-bold text-danger">Jadikan Pengumuman Admin (Pin di Atas)</span>
              </label>
            </div>
          )}

          <div className="flex-1 flex flex-col min-h-[300px]">
            <label className="block text-sm font-bold text-foreground mb-2">Isi Pesan</label>
            <div className="border border-border rounded-xl overflow-hidden bg-background flex-1 flex flex-col focus-within:ring-2 focus-within:ring-brand transition-all">
              {/* Toolbar */}
              <div className="flex items-center gap-1 p-2 bg-muted border-b border-border overflow-x-auto">
                <button type="button" onClick={() => insertFormatting('**')} className="p-2 hover:bg-muted hover:bg-muted/80 rounded-lg text-muted-foreground hover:text-foreground transition-colors" title="Bold"><Bold className="w-4 h-4" /></button>
                <button type="button" onClick={() => insertFormatting('*')} className="p-2 hover:bg-muted hover:bg-muted/80 rounded-lg text-muted-foreground hover:text-foreground transition-colors" title="Italic"><Italic className="w-4 h-4" /></button>
                <button type="button" onClick={() => insertFormatting('~~')} className="p-2 hover:bg-muted hover:bg-muted/80 rounded-lg text-muted-foreground hover:text-foreground transition-colors" title="Strikethrough"><Strikethrough className="w-4 h-4" /></button>
                <div className="w-px h-5 bg-muted-foreground/20 mx-1"></div>
                
                <button type="button" onClick={() => insertFormatting('### ', '', false)} className="p-2 hover:bg-muted hover:bg-muted/80 rounded-lg text-muted-foreground hover:text-foreground transition-colors" title="Heading"><Heading className="w-4 h-4" /></button>
                <button type="button" onClick={() => insertFormatting('> ', '', false)} className="p-2 hover:bg-muted hover:bg-muted/80 rounded-lg text-muted-foreground hover:text-foreground transition-colors" title="Quote"><Quote className="w-4 h-4" /></button>
                <button type="button" onClick={() => insertFormatting('```\n', '\n```', true)} className="p-2 hover:bg-muted hover:bg-muted/80 rounded-lg text-muted-foreground hover:text-foreground transition-colors" title="Code Block"><Code className="w-4 h-4" /></button>
                <div className="w-px h-5 bg-muted-foreground/20 mx-1"></div>

                <button type="button" onClick={() => insertFormatting('- ', '', false)} className="p-2 hover:bg-muted hover:bg-muted/80 rounded-lg text-muted-foreground hover:text-foreground transition-colors" title="Bulleted List"><List className="w-4 h-4" /></button>
                <button type="button" onClick={() => insertFormatting('1. ', '', false)} className="p-2 hover:bg-muted hover:bg-muted/80 rounded-lg text-muted-foreground hover:text-foreground transition-colors" title="Numbered List"><ListOrdered className="w-4 h-4" /></button>
                <div className="w-px h-5 bg-muted-foreground/20 mx-1"></div>

                <button type="button" onClick={() => insertFormatting('[text](url)', '', false)} className="p-2 hover:bg-muted hover:bg-muted/80 rounded-lg text-muted-foreground hover:text-foreground transition-colors" title="Link"><LinkIcon className="w-4 h-4" /></button>
                
                <label className={`p-2 hover:bg-muted hover:bg-muted/80 rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-2 ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`} title="Upload Gambar">
                  {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>

                <div className="flex-1"></div>

                <button 
                  type="button" 
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing}
                  title="Dikte Suara (Voice to Text)"
                  className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${
                    isRecording 
                      ? "bg-danger-tint text-danger hover:bg-danger-tint" 
                      : "text-muted-foreground hover:bg-muted hover:bg-brand/10 hover:text-brand"
                  }`}
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : isRecording ? <MicOff className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
                  <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">{isRecording ? "Merekam..." : "Dikte"}</span>
                </button>
              </div>
              
              <textarea
                id="content-textarea"
                value={content + (isRecording ? (content.trim() ? " " : "") + transcript : "")}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Tuliskan gagasan, pertanyaan, atau karya Anda di sini... (Mendukung Markdown)"
                className="w-full flex-1 bg-transparent px-5 py-4 text-foreground outline-none placeholder:text-muted-foreground/50 resize-y min-h-[250px] leading-relaxed"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <button
              type="submit"
              disabled={loading || !title.trim() || !content.trim() || !categoryId}
              className="bg-brand text-background px-4 md:px-8 py-3.5 rounded-xl font-bold flex items-center gap-2 hover:bg-brand-hover hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
