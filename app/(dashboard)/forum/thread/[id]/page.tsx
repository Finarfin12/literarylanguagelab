"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { ArrowLeft, MessageSquare, Clock, User, Trash2, Edit, Send, Loader2, Save, X, Bold, Italic, Link as LinkIcon, Image as ImageIcon, ShieldAlert } from "lucide-react";
import Swal from 'sweetalert2';
import ReactMarkdown from "react-markdown";

interface Thread {
  id: string;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  category_id: string;
}

interface UserProfile {
  full_name: string;
  role: string;
  level: string;
  avatar_url?: string;
  xp: number;
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  author: UserProfile;
}

export default function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const threadId = unwrappedParams.id;
  const router = useRouter();
  const supabase = createClient();
  
  const [thread, setThread] = useState<Thread | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [threadAuthor, setThreadAuthor] = useState<UserProfile>({ full_name: "Penulis", role: "user", level: "intermediate", xp: 0 });
  
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Load thread
      const { data: threadData, error: threadErr } = await supabase
        .from('forum_threads')
        .select('*')
        .eq('id', threadId)
        .single();
      
      if (threadErr) {
        Swal.fire({ title: "Error", text: "Thread tidak ditemukan.", icon: "error", confirmButtonColor: "#2fa16b" });
        router.push('/forum');
        return;
      }
      setThread(threadData);
      setEditTitle(threadData.title);
      setEditContent(threadData.content);
      setEditCategoryId(threadData.category_id);

      // Load categories for edit mode
      const { data: catData } = await supabase.from('forum_categories').select('*').order('created_at', { ascending: true });
      if (catData) setCategories(catData);

      // Load comments
      const { data: commentsData } = await supabase
        .from('forum_comments')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      // Fetch profiles
      let userMap: Record<string, UserProfile> = {};
      const userIdsToFetch = [threadData.user_id];
      if (commentsData) {
        commentsData.forEach(c => userIdsToFetch.push(c.user_id));
      }
      if (user) userIdsToFetch.push(user.id);
      
      const uniqueUserIds = [...new Set(userIdsToFetch)];
      
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, role, level, avatar_url, xp').in('id', uniqueUserIds);
      if (profiles) {
         profiles.forEach(p => {
           userMap[p.id] = {
             full_name: p.full_name || 'Penulis Rahasia',
             role: p.role || 'user',
             level: p.level || 'intermediate',
             avatar_url: p.avatar_url,
             xp: p.xp || 0
           };
         });
      }

      if (user && userMap[user.id]) {
        setCurrentUserProfile(userMap[user.id]);
      }

      setThreadAuthor(userMap[threadData.user_id] || { full_name: "Penulis", role: "user", level: "intermediate", xp: 0 });

      if (commentsData) {
        const formattedComments = commentsData.map((c: any) => ({
          ...c,
          author: userMap[c.user_id] || { full_name: "Penulis", role: "user", level: "intermediate", xp: 0 }
        }));
        setComments(formattedComments);
      }

      // Increment view count
      await supabase.rpc('increment_view_count', { row_id: threadId });

      setLoading(false);
    }
    loadData();
  }, [threadId, router]);

  const canEditOrDelete = (ownerId: string) => {
    if (!currentUser) return false;
    if (currentUser.id === ownerId) return true;
    if (currentUserProfile?.role === 'admin') return true;
    return false;
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    if (!currentUser) {
      Swal.fire({ title: "Perhatian", text: "Anda harus login untuk berkomentar.", icon: "warning", confirmButtonColor: "#2fa16b" });
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase
      .from('forum_comments')
      .insert({
        thread_id: threadId,
        user_id: currentUser.id,
        content: newComment
      })
      .select()
      .single();

    if (error) {
      Swal.fire({ title: "Gagal", text: error.message, icon: "error", confirmButtonColor: "#2fa16b" });
    } else if (data) {
      const myProfile = currentUserProfile || { full_name: currentUser.user_metadata?.full_name || "Saya", role: "user", level: "intermediate", avatar_url: currentUser.user_metadata?.avatar_url, xp: 0 };
      setComments([...comments, { ...data, author: myProfile }]);
      setNewComment("");
    }
    setSubmitting(false);
  };

  const handleDeleteThread = async () => {
    if (!thread) return;
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
      const { error } = await supabase.from('forum_threads').delete().eq('id', thread.id);
      if (error) {
        Swal.fire({ title: "Gagal", text: error.message, icon: "error", confirmButtonColor: "#2fa16b" });
      } else {
        router.push('/forum');
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !editContent.trim() || !editCategoryId) return;
    setSavingEdit(true);

    const { error } = await supabase
      .from('forum_threads')
      .update({
        title: editTitle,
        content: editContent,
        category_id: editCategoryId
      })
      .eq('id', threadId);

    if (error) {
      Swal.fire({ title: "Gagal", text: error.message, icon: "error", confirmButtonColor: "#2fa16b" });
    } else {
      setThread({ ...thread!, title: editTitle, content: editContent, category_id: editCategoryId });
      setIsEditing(false);
      Swal.fire({ title: "Berhasil", text: "Diskusi diperbarui.", icon: "success", timer: 1500, showConfirmButton: false });
    }
    setSavingEdit(false);
  };

  const insertFormatting = (syntax: string, isWrap = true) => {
    const textarea = document.getElementById('edit-content-textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editContent.substring(start, end);
    
    let newContent = editContent;
    if (isWrap) {
      newContent = editContent.substring(0, start) + syntax + selectedText + syntax + editContent.substring(end);
    } else {
      newContent = editContent.substring(0, start) + syntax + editContent.substring(end);
    }
    
    setEditContent(newContent);
    
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = isWrap ? start + syntax.length + selectedText.length + syntax.length : start + syntax.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

    insertFormatting(`\n![gambar](${publicUrl})\n`, false);
    setUploadingImage(false);
  };

  const renderRoleBadge = (role: string) => {
    if (role === 'admin') return <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold">Librarian (Admin)</span>;
    if (role === 'moderator') return <span className="bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold">Archivist (Mod)</span>;
    if (role === 'curator') return <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold">Curator</span>;
    return null;
  };

  const renderTierBadge = (xp: number) => {
    let title = "Novice Reader (A1)";
    let color = "bg-gray-500/20 text-gray-400";
    
    if (xp >= 10000) { title = "Master of Linguistics (C1/C2)"; color = "bg-purple-500/20 text-purple-400"; }
    else if (xp >= 5000) { title = "Literary Scholar (B2)"; color = "bg-blue-500/20 text-blue-400"; }
    else if (xp >= 2000) { title = "Wordsmith (B1)"; color = "bg-cyan-500/20 text-cyan-400"; }
    else if (xp >= 500) { title = "Bibliophile (A2)"; color = "bg-green-500/20 text-green-400"; }

    return <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold ${color}`}>{title}</span>;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-brand animate-pulse">Memuat diskusi...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-screen">
      <Link href="/forum" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors w-max">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Forum
      </Link>

      {/* Original Thread Post */}
      <div className="bg-card shadow-sm backdrop-blur-md border border-border rounded-3xl p-8 shadow-xl mb-8 relative">
        {canEditOrDelete(thread?.user_id || '') && !isEditing && (
           <div className="absolute top-6 right-6 flex items-center gap-2">
             <button 
               onClick={() => setIsEditing(true)}
               className="p-2 text-muted-foreground hover:text-brand bg-muted hover:bg-muted hover:bg-muted/80 rounded-xl transition-all"
               title="Edit Diskusi"
             >
               <Edit className="w-5 h-5" />
             </button>
             <button 
               onClick={handleDeleteThread}
               className="p-2 text-muted-foreground hover:text-red-400 bg-muted hover:bg-muted hover:bg-muted/80 rounded-xl transition-all"
               title="Hapus Diskusi"
             >
               <Trash2 className="w-5 h-5" />
             </button>
           </div>
        )}

        {isEditing ? (
          <div className="space-y-4 mb-6">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-brand outline-none transition-all font-serif text-2xl font-bold"
              placeholder="Judul Diskusi"
            />
            <select
              value={editCategoryId}
              onChange={(e) => setEditCategoryId(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:ring-2 focus:ring-brand outline-none transition-all appearance-none cursor-pointer"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            
            <div className="border border-border rounded-xl overflow-hidden bg-background flex flex-col focus-within:ring-2 focus-within:ring-brand transition-all">
              <div className="flex items-center gap-1 p-2 bg-muted border-b border-border overflow-x-auto">
                <button onClick={() => insertFormatting('**')} className="p-2 hover:bg-muted hover:bg-muted/80 rounded-lg text-muted-foreground hover:text-foreground transition-colors" title="Bold"><Bold className="w-4 h-4" /></button>
                <button onClick={() => insertFormatting('*')} className="p-2 hover:bg-muted hover:bg-muted/80 rounded-lg text-muted-foreground hover:text-foreground transition-colors" title="Italic"><Italic className="w-4 h-4" /></button>
                <button onClick={() => insertFormatting('[text](url)', false)} className="p-2 hover:bg-muted hover:bg-muted/80 rounded-lg text-muted-foreground hover:text-foreground transition-colors" title="Link"><LinkIcon className="w-4 h-4" /></button>
                <div className="w-px h-5 bg-muted hover:bg-muted/80 mx-1"></div>
                
                <label className={`p-2 hover:bg-muted hover:bg-muted/80 rounded-lg text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex items-center gap-2 ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`} title="Upload Gambar">
                  {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
              <textarea
                id="edit-content-textarea"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-transparent px-5 py-4 text-foreground outline-none resize-y min-h-[250px] leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => {
                  setIsEditing(false);
                  setEditTitle(thread?.title || '');
                  setEditContent(thread?.content || '');
                  setEditCategoryId(thread?.category_id || '');
                }}
                className="px-5 py-2.5 rounded-xl font-bold text-muted-foreground hover:bg-muted transition-all"
              >
                Batal
              </button>
              <button 
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="bg-brand text-background px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-brand-hover transition-all disabled:opacity-50"
              >
                {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Simpan Perubahan
              </button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6 pr-24">{thread?.title}</h1>
            
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-border">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border ${threadAuthor.role === 'admin' ? 'bg-red-500/20 border-red-500/40 text-red-400' : 'bg-brand/20 border-brand/30 text-brand'} overflow-hidden`}>
                {threadAuthor.avatar_url ? (
                  <img src={threadAuthor.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  threadAuthor.role === 'admin' ? <ShieldAlert className="w-6 h-6" /> : <User className="w-6 h-6" />
                )}
              </div>
              <div>
                <p className="font-bold text-foreground text-sm flex items-center gap-2 flex-wrap">
                  {threadAuthor.full_name}
                  {renderRoleBadge(threadAuthor.role)}
                  {renderTierBadge(threadAuthor.xp)}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  {new Date(thread?.created_at || '').toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <div className="prose dark:prose-invert max-w-none prose-p:leading-relaxed prose-lg text-foreground/90 prose-img:rounded-2xl prose-img:border prose-img:border-border prose-img:shadow-lg">
              <ReactMarkdown>{thread?.content || ''}</ReactMarkdown>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="w-6 h-6 text-brand" />
        <h2 className="text-2xl font-bold text-foreground">{comments.length} Komentar</h2>
      </div>

      {/* Comments List */}
      <div className="space-y-6 mb-8">
        {comments.map(comment => (
          <div key={comment.id} className="bg-card shadow-sm border border-border rounded-2xl p-6 shadow-sm relative group">
            {canEditOrDelete(comment.user_id) && (
              <button 
                onClick={async () => {
                   const result = await Swal.fire({ title: 'Hapus Komentar?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Hapus' });
                   if (result.isConfirmed) {
                     await supabase.from('forum_comments').delete().eq('id', comment.id);
                     setComments(comments.filter(c => c.id !== comment.id));
                   }
                }}
                className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-red-400 bg-muted hover:bg-muted hover:bg-muted/80 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                title="Hapus Komentar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${comment.author.role === 'admin' ? 'bg-red-500/20 border-red-500/30 text-red-400' : 'bg-blue-500/20 border-blue-500/30 text-blue-400'} overflow-hidden`}>
                {comment.author.avatar_url ? (
                  <img src={comment.author.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  comment.author.role === 'admin' ? <ShieldAlert className="w-5 h-5" /> : <User className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="font-bold text-foreground text-sm flex items-center gap-2 flex-wrap pr-10">
                  {comment.author.full_name}
                  {renderRoleBadge(comment.author.role)}
                  {renderTierBadge(comment.author.xp)}
                  {comment.user_id === thread?.user_id && (
                    <span className="bg-brand/20 text-brand px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold">Pembuat</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(comment.created_at).toLocaleString('id-ID')}
                </p>
              </div>
            </div>
            <div className="prose dark:prose-invert max-w-none text-foreground/90 text-sm leading-relaxed prose-img:rounded-xl prose-img:max-h-96">
              <ReactMarkdown>{comment.content}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>

      {/* Add Comment Box */}
      <div className="bg-background border border-border rounded-3xl p-6 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 blur-[50px] rounded-full pointer-events-none"></div>
        <h3 className="font-bold text-foreground mb-4">Tambahkan Komentar</h3>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Bagikan pemikiran atau balasan Anda..."
          className="w-full bg-black/20 border border-border rounded-xl px-5 py-4 text-foreground focus:ring-2 focus:ring-brand outline-none transition-all placeholder:text-muted-foreground/50 resize-y min-h-[120px] mb-4 text-sm"
        />
        <div className="flex justify-end">
          <button
            onClick={handlePostComment}
            disabled={submitting || !newComment.trim()}
            className="bg-brand text-background px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-brand-hover transition-all disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Kirim Balasan
          </button>
        </div>
      </div>
    </div>
  );
}
