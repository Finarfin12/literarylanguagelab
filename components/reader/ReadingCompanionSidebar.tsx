"use client";

import { useState, useRef, useEffect } from "react";
import { User, Bot, Send, Loader2, X, MessageSquareQuote, Minimize2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Swal from "sweetalert2";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface CompanionProps {
  title: string;
  author: string;
  content: string;
  onClose: () => void;
}

export default function ReadingCompanionSidebar({ title, author, content, onClose }: CompanionProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isMinimized]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/tools/reading-companion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, author, content, messages: newMessages }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessages([...newMessages, { role: "assistant", content: data.result }]);
    } catch (error: any) {
      Swal.fire("Gagal", "Error: " + error.message, "error");
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

  if (isMinimized) {
    return (
      <button 
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-[100] bg-purple-500 hover:bg-purple-600 text-white p-4 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all hover:scale-110 flex items-center justify-center group animate-in slide-in-from-bottom-8"
        title="Open Reading Companion"
      >
        <MessageSquareQuote className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 left-4 md:left-auto md:bottom-8 md:right-8 md:w-[450px] h-[75vh] max-h-[800px] bg-background/95 backdrop-blur-3xl border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden z-[100] animate-in slide-in-from-bottom-8 zoom-in-95">
      {/* Header */}
      <div className="p-4 md:p-5 border-b border-border flex items-center justify-between z-10 bg-background/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <MessageSquareQuote className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg md:text-xl font-serif font-bold text-foreground truncate">Reading Companion</h2>
            <p className="text-xs text-muted-foreground truncate w-full">Discussing: {title}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setIsMinimized(true)} className="p-2 hover:bg-muted rounded-full text-muted-foreground transition-colors" title="Minimize">
            <Minimize2 className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-2 hover:bg-rose-500/10 hover:text-rose-500 rounded-full text-muted-foreground transition-colors" title="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 z-10">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-4">
            <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-purple-500" />
            </div>
            <h3 className="text-foreground font-medium mb-2">Hello there!</h3>
            <p className="text-sm">Tanyakan apa saja tentang makna, tema, atau tokoh di teks ini. I will explain it deeply in English!</p>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex gap-3 max-w-[90%] ${m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${m.role === "user" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"}`}>
                {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`p-4 rounded-2xl ${m.role === "user" ? "bg-blue-500/10 border border-blue-500/20 text-foreground" : "bg-purple-500/10 border border-purple-500/20 text-foreground"}`}>
                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed">
                  {m.role === "user" ? m.content : <ReactMarkdown>{m.content}</ReactMarkdown>}
                </div>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex gap-3 max-w-[90%] mr-auto">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-1">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              <span className="text-xs text-purple-400 animate-pulse">Analyzing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 md:p-4 border-t border-border bg-background z-10">
        <div className="flex items-end gap-2 bg-muted/50 rounded-2xl p-1 border border-border focus-within:ring-1 focus-within:ring-purple-500 transition-shadow">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            className="flex-1 bg-transparent border-none rounded-xl p-3 max-h-32 min-h-[44px] resize-none focus:ring-0 focus:outline-none text-foreground text-sm"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="w-11 h-11 bg-purple-500 text-white rounded-xl flex items-center justify-center hover:bg-purple-600 disabled:opacity-50 transition-all shrink-0 mb-0.5 mr-0.5"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
