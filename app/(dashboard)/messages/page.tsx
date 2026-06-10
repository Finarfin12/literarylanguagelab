"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { createClient } from "@/utils/supabase/client";
import { Search, Send, Loader2, MessageSquare, Check, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { useSearchParams } from "next/navigation";

type Profile = {
  id: string;
  full_name: string;
  avatar_url: string;
};

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
};

type Conversation = {
  other_user: Profile;
  last_message: Message;
  unread_count: number;
};

function MessagesContent() {
  const supabase = createClient();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get("user_id");

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);
      await fetchConversations(user.id);
      setLoading(false);

      if (initialUserId) {
        // Fetch profile and start chat
        const { data } = await supabase.from("profiles").select("*").eq("id", initialUserId).single();
        if (data) startChat(data);
      }
    }
    init();

    // Set up Realtime for ANY message involving this user
    const channel = supabase.channel('messages_page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_messages' }, async (payload) => {
        // Only refresh conversations if we are logged in
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          fetchConversations(user.id);
          
          // If a new message arrives for the active chat, fetch messages again
          if (activeUserId) {
            fetchMessages(user.id, activeUserId);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeUserId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchConversations(userId: string) {
    // Fetch all messages involving the user to determine contacts
    const { data: allMessages } = await supabase
      .from("direct_messages")
      .select("*")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (!allMessages) return;

    // Group by other user
    const contactIds = new Set<string>();
    const recentMsgs: Record<string, Message> = {};
    const unreadCounts: Record<string, number> = {};

    allMessages.forEach((msg) => {
      const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
      contactIds.add(otherId);
      
      if (!recentMsgs[otherId]) {
        recentMsgs[otherId] = msg;
      }

      if (msg.receiver_id === userId && !msg.is_read) {
        unreadCounts[otherId] = (unreadCounts[otherId] || 0) + 1;
      }
    });

    if (contactIds.size === 0) {
      setConversations([]);
      return;
    }

    // Fetch profiles of contacts
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", Array.from(contactIds));

    if (profiles) {
      const convos: Conversation[] = profiles.map(p => ({
        other_user: p,
        last_message: recentMsgs[p.id],
        unread_count: unreadCounts[p.id] || 0
      }));

      // Sort by last message time
      convos.sort((a, b) => new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime());
      setConversations(convos);
    }
  }

  async function fetchMessages(userId: string, otherUserId: string) {
    const { data } = await supabase
      .from("direct_messages")
      .select("*")
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data);
      
      // Mark as read
      const unreadIds = data.filter(m => m.receiver_id === userId && !m.is_read).map(m => m.id);
      if (unreadIds.length > 0) {
        await supabase.from("direct_messages").update({ is_read: true }).in("id", unreadIds);
      }
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim() || !currentUser) return;
    
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .ilike("full_name", `%${searchQuery}%`)
      .neq("id", currentUser.id)
      .limit(5);
      
    setSearchResults(data || []);
  }

  async function startChat(profile: Profile) {
    setSearchQuery("");
    setSearchResults([]);
    setActiveUserId(profile.id);
    setChatLoading(true);
    await fetchMessages(currentUser.id, profile.id);
    setChatLoading(false);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !activeUserId || !currentUser) return;

    const content = newMessage.trim();
    setNewMessage(""); // optimistic clear

    // Optimistic UI update
    const tempMsg: Message = {
      id: "temp-" + Date.now(),
      sender_id: currentUser.id,
      receiver_id: activeUserId,
      content,
      is_read: false,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    await supabase.from("direct_messages").insert({
      sender_id: currentUser.id,
      receiver_id: activeUserId,
      content
    });
  }

  const activeContact = conversations.find(c => c.other_user.id === activeUserId)?.other_user 
    || searchResults.find(r => r.id === activeUserId);

  if (loading) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-2rem)] py-4 px-4 flex gap-6">
      
      {/* LEFT PANEL: CONVERSATIONS */}
      <div className="w-1/3 bg-card border border-border rounded-3xl flex flex-col overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border">
          <h2 className="text-2xl font-serif font-bold mb-4 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-500" /> Pesan
          </h2>
          
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Cari pengguna baru..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-muted border-transparent rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-background transition-all"
            />
          </form>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {searchResults.length > 0 && (
            <div className="mb-4">
              <p className="px-4 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Hasil Pencarian</p>
              {searchResults.map(user => (
                <button 
                  key={user.id}
                  onClick={() => startChat(user)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 rounded-xl transition-colors text-left"
                >
                  <img src={user.avatar_url || "https://ui-avatars.com/api/?name=U"} alt="" className="w-10 h-10 rounded-full bg-muted" />
                  <span className="font-medium text-sm">{user.full_name}</span>
                </button>
              ))}
              <div className="px-4 py-2 border-b border-border"></div>
            </div>
          )}

          {conversations.length === 0 && searchResults.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Belum ada obrolan.</p>
              <p className="text-xs mt-1">Cari nama pengguna untuk memulai.</p>
            </div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.other_user.id}
                onClick={() => startChat(c.other_user)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left mb-1 ${activeUserId === c.other_user.id ? 'bg-blue-500/10' : 'hover:bg-muted/50'}`}
              >
                <div className="relative">
                  <img src={c.other_user.avatar_url || "https://ui-avatars.com/api/?name=U"} alt="" className="w-12 h-12 rounded-full bg-muted object-cover border border-border" />
                  {c.unread_count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-card">
                      {c.unread_count}
                    </span>
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-medium truncate ${c.unread_count > 0 ? 'text-foreground font-bold' : 'text-foreground'}`}>
                      {c.other_user.full_name}
                    </span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {format(new Date(c.last_message.created_at), 'HH:mm')}
                    </span>
                  </div>
                  <p className={`text-sm truncate ${c.unread_count > 0 ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                    {c.last_message.sender_id === currentUser?.id ? 'Anda: ' : ''}{c.last_message.content}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL: CHAT ROOM */}
      <div className="w-2/3 bg-card border border-border rounded-3xl flex flex-col overflow-hidden shadow-sm">
        {!activeUserId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">Pilih obrolan untuk mulai mengirim pesan</p>
          </div>
        ) : chatLoading ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center gap-3 bg-muted/20">
              <img src={activeContact?.avatar_url || "https://ui-avatars.com/api/?name=U"} alt="" className="w-10 h-10 rounded-full bg-muted object-cover" />
              <div>
                <h3 className="font-bold text-foreground">{activeContact?.full_name}</h3>
                <p className="text-xs text-emerald-500 font-medium">Online</p>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4 bg-muted/5">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Belum ada pesan. Sapa mereka sekarang!
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.sender_id === currentUser?.id;
                  const showDate = idx === 0 || new Date(messages[idx-1].created_at).toDateString() !== new Date(msg.created_at).toDateString();
                  
                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="flex justify-center my-4">
                          <span className="bg-muted px-3 py-1 rounded-full text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            {format(new Date(msg.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] rounded-2xl p-4 shadow-sm ${
                          isMe 
                            ? 'bg-blue-600 text-white rounded-br-none' 
                            : 'bg-card border border-border text-foreground rounded-bl-none'
                        }`}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          <div className={`flex items-center justify-end gap-1 mt-2 text-[10px] ${isMe ? 'text-blue-200' : 'text-muted-foreground'}`}>
                            {format(new Date(msg.created_at), 'HH:mm')}
                            {isMe && (
                              msg.is_read ? <CheckCheck className="w-3 h-3 text-blue-200" /> : <Check className="w-3 h-3" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-card border-t border-border">
              <form onSubmit={sendMessage} className="flex items-end gap-2">
                <textarea 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ketik pesan..."
                  className="flex-1 bg-muted border border-border rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-32 min-h-[56px] custom-scrollbar"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage(e);
                    }
                  }}
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white p-4 rounded-2xl transition-all shrink-0 flex items-center justify-center shadow-md shadow-blue-500/20 h-[56px] w-[56px]"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>

    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>}>
      <MessagesContent />
    </Suspense>
  );
}
