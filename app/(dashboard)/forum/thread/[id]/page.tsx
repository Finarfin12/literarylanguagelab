"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { ArrowLeft, MessageSquare, Clock, User, Trash2, Send, Loader2 } from "lucide-react";
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

interface Comment {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  author_name?: string;
}

export default function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const threadId = unwrappedParams.id;
  const router = useRouter();
  const supabase = createClient();
  
  const [thread, setThread] = useState<Thread | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [threadAuthorName, setThreadAuthorName] = useState("Penulis");
  
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadThread() {
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

      // Load comments
      const { data: commentsData } = await supabase
        .from('forum_comments')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (commentsData) {
        // Collect all unique user IDs to fetch their names
        const userIds = [threadData.user_id, ...new Set(commentsData.map((c: any) => c.user_id))];
        
        // Fetch profiles, fallback if profiles table doesn't have them
        // Note: For now we'll just display User-[hash] if we can't find them, or try to load from `profiles`
        let userMap: Record<string, string> = {};
        const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', userIds);
        if (profiles) {
           profiles.forEach(p => {
             userMap[p.id] = p.full_name || 'Penulis Rahasia';
           });
        }

        setThreadAuthorName(userMap[threadData.user_id] || "Penulis");

        const formattedComments = commentsData.map((c: any) => ({
          ...c,
          author_name: userMap[c.user_id] || "Penulis"
        }));
        setComments(formattedComments);
      }

      // Increment view count
      await supabase.rpc('increment_view_count', { row_id: threadId });

      setLoading(false);
    }
    loadThread();
  }, [threadId, router]);

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
      const myProfileRes = await supabase.from('profiles').select('full_name').eq('id', currentUser.id).single();
      const myName = myProfileRes.data?.full_name || currentUser.user_metadata?.full_name || "Saya";

      setComments([...comments, { ...data, author_name: myName }]);
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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-brand animate-pulse">Memuat diskusi...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-screen">
      <Link href="/forum" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors w-max">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Forum
      </Link>

      {/* Original Thread Post */}
      <div className="bg-card/40 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-xl mb-8 relative">
        {currentUser?.id === thread?.user_id && (
           <button 
             onClick={handleDeleteThread}
             className="absolute top-6 right-6 p-2 text-muted-foreground hover:text-red-400 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
             title="Hapus Diskusi"
           >
             <Trash2 className="w-5 h-5" />
           </button>
        )}
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6 pr-12">{thread?.title}</h1>
        
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-white/10">
          <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center border border-brand/30">
            <User className="w-5 h-5 text-brand" />
          </div>
          <div>
            <p className="font-bold text-foreground text-sm">{threadAuthorName}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" />
              {new Date(thread?.created_at || '').toLocaleString('id-ID')}
            </p>
          </div>
        </div>

        <div className="prose dark:prose-invert max-w-none prose-p:leading-relaxed prose-lg text-foreground/90">
          <ReactMarkdown>{thread?.content || ''}</ReactMarkdown>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <MessageSquare className="w-6 h-6 text-brand" />
        <h2 className="text-2xl font-bold text-foreground">{comments.length} Komentar</h2>
      </div>

      {/* Comments List */}
      <div className="space-y-6 mb-8">
        {comments.map(comment => (
          <div key={comment.id} className="bg-card/30 border border-white/5 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30 shrink-0">
                <User className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm flex items-center gap-2">
                  {comment.author_name}
                  {comment.user_id === thread?.user_id && (
                    <span className="bg-brand/20 text-brand px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">Pembuat</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(comment.created_at).toLocaleString('id-ID')}
                </p>
              </div>
            </div>
            <div className="text-foreground/90 text-sm leading-relaxed whitespace-pre-wrap">
              {comment.content}
            </div>
          </div>
        ))}
      </div>

      {/* Add Comment Box */}
      <div className="bg-background/50 border border-white/10 rounded-3xl p-6 relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 blur-[50px] rounded-full pointer-events-none"></div>
        <h3 className="font-bold text-foreground mb-4">Tambahkan Komentar</h3>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Bagikan pemikiran atau balasan Anda..."
          className="w-full bg-black/20 border border-white/10 rounded-xl px-5 py-4 text-foreground focus:ring-2 focus:ring-brand outline-none transition-all placeholder:text-muted-foreground/50 resize-y min-h-[120px] mb-4 text-sm"
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
