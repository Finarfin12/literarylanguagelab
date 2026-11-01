"use client";

import Swal from 'sweetalert2';
import { useState, useRef, useEffect } from "react";
import { User, Bot, Send, Loader2, Sparkles, ArrowLeft, Plus, MessageSquare, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatSession {
  id: string;
  author_name: string;
  title: string;
  created_at: string;
}

const AUTHORS = [
  "William Shakespeare",
  "Jane Austen",
  "Edgar Allan Poe",
  "Ernest Hemingway",
  "Virginia Woolf",
  "Chinua Achebe",
  "Pramoedya Ananta Toer"
];

export default function AlterEgoChatPage() {
  const supabase = createClient();
  const [author, setAuthor] = useState(AUTHORS[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load Sessions
  const loadSessions = async () => {
    setLoadingSessions(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setSessions(data);
    setLoadingSessions(false);
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // Load Messages when activeSessionId changes
  useEffect(() => {
    async function loadMessages() {
      if (!activeSessionId) {
        setMessages([]);
        return;
      }
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', activeSessionId)
        .order('created_at', { ascending: true });
      
      if (data) {
        setMessages(data.map(d => ({ id: d.id, role: d.role as "user"|"assistant", content: d.content })));
      }
    }
    loadMessages();
  }, [activeSessionId]);

  const handleAuthorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAuthor(e.target.value);
    setActiveSessionId(null);
  };

  const handleNewSession = () => {
    setActiveSessionId(null);
    setMessages([]);
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const result = await Swal.fire({
      title: "Hapus Sesi?",
      text: "Riwayat obrolan ini akan dihapus secara permanen.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#3f3f46",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal"
    });
    
    if (!result.isConfirmed) return;
    
    await supabase.from('chat_sessions').delete().eq('id', id);
    if (activeSessionId === id) {
      setActiveSessionId(null);
      setMessages([]);
    }
    loadSessions();
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Swal.fire({ title: "Perhatian", text: "Anda harus login.", icon: "info", confirmButtonColor: "#2fa16b" });
      return;
    }

    const userMessageContent = input;
    setInput("");
    setLoading(true);

    let currentSessionId = activeSessionId;

    try {
      // Create session if it doesn't exist
      if (!currentSessionId) {
        const { data: newSession, error: sessionErr } = await supabase
          .from('chat_sessions')
          .insert({
            user_id: user.id,
            author_name: author,
            title: userMessageContent.substring(0, 30) + (userMessageContent.length > 30 ? "..." : "")
          })
          .select()
          .single();
        
        if (sessionErr) throw sessionErr;
        currentSessionId = newSession.id;
        setActiveSessionId(currentSessionId);
        // Add to sessions list
        setSessions([newSession, ...sessions]);
      }

      // Save user message
      await supabase.from('chat_messages').insert({
        session_id: currentSessionId,
        role: 'user',
        content: userMessageContent
      });

      const updatedMessages: Message[] = [...messages, { role: "user", content: userMessageContent }];
      setMessages(updatedMessages);

      // Call API
      const res = await fetch("/api/tools/alter-ego", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, messages: updatedMessages }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Save assistant message
      await supabase.from('chat_messages').insert({
        session_id: currentSessionId,
        role: 'assistant',
        content: data.result
      });

      setMessages([...updatedMessages, { role: "assistant", content: data.result }]);
      
      // Update session updated_at
      await supabase.from('chat_sessions').update({ updated_at: new Date().toISOString() }).eq('id', currentSessionId);
      
    } catch (error: any) {
      Swal.fire({ title: "Informasi", text: String("Error: " + error.message), icon: "warning", confirmButtonColor: "#2fa16b" });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-[calc(100vh-2rem)] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <Link href="/tools" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors w-max min-h-[44px] text-sm">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Toolkits
          </Link>
          <h1 className="text-[28px] md:text-4xl leading-[1.15] font-serif font-medium text-foreground flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-brand-ink" />
            Alter Ego Chat
          </h1>
          <p className="text-muted-foreground mt-2">Ngobrol langsung dengan penulis legendaris pilihan Anda.</p>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left Sidebar: Chat History */}
        <div className="w-72 flex flex-col border border-border rounded-card overflow-hidden bg-card shrink-0 hidden md:flex">
          <div className="p-4 border-b border-border">
            <button 
              onClick={handleNewSession}
              className="w-full py-3 px-4 bg-brand-tint hover:bg-brand-tint text-brand-ink rounded-control font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Chat Baru
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {loadingSessions ? (
              <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-brand-ink" /></div>
            ) : sessions.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground mt-4">Belum ada riwayat</p>
            ) : (
              sessions.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => {
                    setActiveSessionId(s.id);
                    setAuthor(s.author_name);
                  }}
                  className={`p-3 rounded-control cursor-pointer group flex items-start gap-3 transition-colors ${activeSessionId === s.id ? 'bg-muted  border border-border' : 'hover:bg-muted border border-transparent'}`}
                >
                  <MessageSquare className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{s.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{s.author_name}</p>
                  </div>
                  <button 
                    onClick={(e) => handleDeleteSession(e, s.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-danger transition-all shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Chat Area */}
        <div className="flex-1 bg-card border border-border rounded-card overflow-hidden flex flex-col relative">
          
          {/* Author Selection Top Bar */}
          <div className="p-4 border-b border-border bg-background flex items-center justify-between">
            <span className="text-sm font-bold text-muted-foreground hidden sm:inline-block">Penulis:</span>
            <select 
              value={author}
              onChange={handleAuthorChange}
              className="w-full sm:w-64 bg-background border border-border rounded-control p-2.5 text-foreground font-serif focus:ring-2 focus:ring-brand outline-none cursor-pointer text-sm"
            >
              {AUTHORS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                <Sparkles className="w-16 h-16 mb-4" />
                <p className="text-center text-sm px-4">Mulai percakapan dengan {author}.<br/>Riwayat obrolan Anda akan tersimpan di cloud.</p>
              </div>
            ) : (
              messages.map((m, i) => (
                <div key={m.id || i} className={`flex gap-4 max-w-[85%] ${m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${m.role === "user" ? "bg-muted text-brand-ink" : "bg-brand-tint text-brand-ink"}`}>
                    {m.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                  </div>
                  <div className={`p-5 rounded-card ${m.role === "user" ? "bg-muted border border-border text-foreground" : "bg-brand-tint border border-brand/20 text-foreground"}`}>
                    <div className="prose dark:prose-invert max-w-none prose-p:leading-relaxed text-sm">
                      {m.role === "user" ? m.content : <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>}
                    </div>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex gap-4 max-w-[85%] mr-auto">
                <div className="w-10 h-10 rounded-full bg-brand-tint text-brand-ink flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="p-5 rounded-card bg-brand-tint border border-brand/20 flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-ink" />
                  <span className="text-sm text-brand-ink animate-pulse">{author} sedang mengetik...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-4 border-t border-border bg-background ">
            <div className="flex items-end gap-3 max-w-4xl mx-auto">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ketik pesan untuk ${author}...`}
                className="flex-1 bg-background border border-border rounded-card p-4 max-h-32 min-h-[56px] resize-none focus:ring-1 focus:ring-brand focus:outline-none text-foreground"
                rows={1}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="w-14 h-14 bg-brand-solid text-on-brand rounded-card flex items-center justify-center disabled:opacity-50 transition-all shrink-0"
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
