"use client";

import { useState, useRef, useEffect } from "react";
import { User, Bot, Send, Loader2, Sparkles, ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
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
  const [author, setAuthor] = useState(AUTHORS[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleAuthorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newAuthor = e.target.value;
    setAuthor(newAuthor);
    
    // Load history
    const history = localStorage.getItem(`alter_ego_${newAuthor}`);
    if (history) {
      try {
        setMessages(JSON.parse(history));
      } catch (e) {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  };

  useEffect(() => {
    // Initial load
    const history = localStorage.getItem(`alter_ego_${author}`);
    if (history) {
      try {
        setMessages(JSON.parse(history));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Save to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`alter_ego_${author}`, JSON.stringify(messages));
    }
  }, [messages, author]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/tools/alter-ego", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, messages: newMessages }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessages([...newMessages, { role: "assistant", content: data.result }]);
    } catch (error: any) {
      alert("Error: " + error.message);
      // Remove the user message if failed
      setMessages(messages);
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
    <div className="p-8 max-w-5xl mx-auto h-[calc(100vh-2rem)] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/tools" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors w-max">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Toolkits
      </Link>

      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-4xl font-serif font-bold text-foreground flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-brand" />
            Alter Ego Chat
          </h1>
          <p className="text-muted-foreground mt-2">Ngobrol langsung dengan penulis legendaris pilihan Anda.</p>
        </div>
        
        <div className="w-full md:w-64">
          <select 
            value={author}
            onChange={handleAuthorChange}
            className="w-full bg-background border border-white/20 rounded-xl p-3 text-foreground font-serif focus:ring-2 focus:ring-brand outline-none cursor-pointer"
          >
            {AUTHORS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <div className="flex-1 bg-card/40 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-xl">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
              <Sparkles className="w-16 h-16 mb-4" />
              <p className="text-center text-sm px-4">Mulai percakapan dengan {author}.<br/>Riwayat obrolan Anda akan tersimpan otomatis.</p>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex gap-4 max-w-[80%] ${m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${m.role === "user" ? "bg-blue-500/20 text-blue-400" : "bg-brand/20 text-brand"}`}>
                  {m.role === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className={`p-5 rounded-2xl ${m.role === "user" ? "bg-blue-500/10 border border-blue-500/20 text-foreground" : "bg-brand/10 border border-brand/20 text-foreground"}`}>
                  <div className="prose dark:prose-invert max-w-none prose-p:leading-relaxed text-sm">
                    {m.role === "user" ? m.content : <ReactMarkdown>{m.content}</ReactMarkdown>}
                  </div>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex gap-4 max-w-[80%] mr-auto">
              <div className="w-10 h-10 rounded-full bg-brand/20 text-brand flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="p-5 rounded-2xl bg-brand/10 border border-brand/20 flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-brand" />
                <span className="text-sm text-brand animate-pulse">{author} sedang mengetik...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Box */}
        <div className="p-4 border-t border-white/10 bg-background/50 backdrop-blur-xl">
          <div className="flex items-end gap-3 max-w-4xl mx-auto">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ketik pesan untuk ${author}...`}
              className="flex-1 bg-background border border-white/10 rounded-2xl p-4 max-h-32 min-h-[56px] resize-none focus:ring-1 focus:ring-brand focus:outline-none text-foreground"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="w-14 h-14 bg-brand text-background rounded-2xl flex items-center justify-center hover:shadow-[0_0_15px_rgba(62,207,142,0.4)] disabled:opacity-50 transition-all shrink-0"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
