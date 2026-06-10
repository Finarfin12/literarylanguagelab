"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useSearchParams } from "next/navigation";
import { Send, Loader2, MessageSquare, Search, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Swal from 'sweetalert2';

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

export default function MessagesPage() {
  const supabase = createClient();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [contacts, setContacts] = useState<Profile[]>([]);
  const [activeContact, setActiveContact] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const initialUserId = searchParams.get("user_id");

  useEffect(() => {
    async function loadInitialData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);

      // Load people you follow or who follow you to chat with
      const { data: follows } = await supabase
        .from('user_follows')
        .select('follower_id, following_id')
        .or(`follower_id.eq.${user.id},following_id.eq.${user.id}`);

      if (follows) {
        const contactIds = new Set<string>();
        follows.forEach(f => {
          if (f.follower_id !== user.id) contactIds.add(f.follower_id);
          if (f.following_id !== user.id) contactIds.add(f.following_id);
        });

        if (contactIds.size > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', Array.from(contactIds));
            
          let finalContacts = profilesData || [];
          
          if (initialUserId) {
            const exists = finalContacts.find((p: any) => p.id === initialUserId);
            if (exists) {
              setActiveContact(exists);
            } else {
              const { data: newContact } = await supabase.from('profiles').select('id, full_name, avatar_url').eq('id', initialUserId).single();
              if (newContact) {
                finalContacts = [newContact, ...finalContacts];
                setActiveContact(newContact);
              }
            }
          }
          setContacts(finalContacts);
        } else if (initialUserId) {
          // No contacts at all, but we have a user_id
          const { data: newContact } = await supabase.from('profiles').select('id, full_name, avatar_url').eq('id', initialUserId).single();
          if (newContact) {
            setContacts([newContact]);
            setActiveContact(newContact);
          }
        }
      }
      setLoadingContacts(false);
    }
    loadInitialData();
  }, [initialUserId]);

  useEffect(() => {
    if (activeContact && currentUser) {
      setLoadingMessages(true);
      const fetchMessages = async () => {
        const { data } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${activeContact.id}),and(sender_id.eq.${activeContact.id},receiver_id.eq.${currentUser.id})`)
          .order('created_at', { ascending: true });
        
        if (data) setMessages(data);
        setLoadingMessages(false);
        scrollToBottom();
      };
      
      fetchMessages();

      // Realtime subscription
      const channel = supabase.channel(`messages_${activeContact.id}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `receiver_id=eq.${currentUser.id}` // only listen to incoming from them, wait, listen to all to update UI or just rely on optimistic UI for self
        }, payload => {
          if (payload.new.sender_id === activeContact.id || payload.new.receiver_id === activeContact.id) {
            setMessages(prev => [...prev, payload.new as Message]);
            scrollToBottom();
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeContact, currentUser]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeContact || !currentUser) return;

    const msgText = newMessage.trim();
    setNewMessage(""); // Optimistic clear

    // Optimistic UI
    const tempMsg: Message = {
      id: Math.random().toString(),
      sender_id: currentUser.id,
      receiver_id: activeContact.id,
      content: msgText,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);
    scrollToBottom();

    const { error } = await supabase.from('messages').insert({
      sender_id: currentUser.id,
      receiver_id: activeContact.id,
      content: msgText
    });

    if (error) {
      Swal.fire({ title: "Gagal Mengirim", text: error.message, icon: "error" });
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] max-w-6xl mx-auto overflow-hidden bg-card border-x border-foreground/10 shadow-2xl">
      
      {/* Sidebar Contacts */}
      <div className={`w-full md:w-80 border-r border-foreground/10 flex flex-col bg-card/50 ${activeContact ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-foreground/10 bg-card">
          <h2 className="text-2xl font-bold font-serif text-foreground flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-brand" /> Pesan
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loadingContacts ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>
          ) : contacts.length > 0 ? (
            contacts.map(contact => (
              <button 
                key={contact.id} 
                onClick={() => setActiveContact(contact)}
                className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all ${activeContact?.id === contact.id ? 'bg-brand/10 border border-brand/30' : 'hover:bg-foreground/5 border border-transparent'}`}
              >
                <div className="w-12 h-12 rounded-full overflow-hidden bg-brand/10 shrink-0 flex items-center justify-center">
                  {contact.avatar_url ? (
                    <img src={contact.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold text-brand">{contact.full_name?.charAt(0) || '?'}</span>
                  )}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="font-bold text-foreground truncate">{contact.full_name}</p>
                </div>
              </button>
            ))
          ) : (
            <div className="text-center p-6 bg-foreground/5 rounded-2xl border border-dashed border-foreground/10">
              <p className="text-sm text-muted-foreground mb-4">Anda belum memiliki kontak.</p>
              <Link href="/community" className="text-sm text-brand font-bold hover:underline">Cari Teman</Link>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col bg-background ${!activeContact ? 'hidden md:flex' : 'flex'}`}>
        {activeContact ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-foreground/10 bg-card flex items-center gap-4 shadow-sm z-10">
              <button className="md:hidden p-2 bg-foreground/5 rounded-full" onClick={() => setActiveContact(null)}>
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 rounded-full overflow-hidden bg-brand/10 shrink-0 flex items-center justify-center">
                {activeContact.avatar_url ? (
                  <img src={activeContact.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-brand">{activeContact.full_name?.charAt(0) || '?'}</span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-foreground text-lg leading-none">{activeContact.full_name}</h3>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-foreground/[0.02]">
              {loadingMessages ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>
              ) : messages.length > 0 ? (
                messages.map((msg, i) => {
                  const isMine = msg.sender_id === currentUser?.id;
                  return (
                    <div key={msg.id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] p-4 rounded-3xl ${
                        isMine 
                          ? 'bg-brand text-background rounded-br-sm' 
                          : 'bg-card border border-foreground/10 text-foreground rounded-bl-sm'
                      }`}>
                        <p className="leading-relaxed">{msg.content}</p>
                        <span className={`text-[10px] mt-2 block ${isMine ? 'text-background/70' : 'text-muted-foreground'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <p>Mulai percakapan dengan {activeContact.full_name}</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-card border-t border-foreground/10">
              <form onSubmit={handleSendMessage} className="flex items-center gap-3 bg-foreground/5 p-2 rounded-full border border-foreground/10 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand transition-all">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Ketik pesan..."
                  className="flex-1 bg-transparent border-none px-4 py-2 focus:outline-none text-foreground"
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="w-10 h-10 bg-brand text-background rounded-full flex items-center justify-center hover:bg-brand-hover transition-colors disabled:opacity-50 shrink-0"
                >
                  <Send className="w-4 h-4 ml-[-2px]" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-foreground/[0.02]">
            <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-xl font-bold">Pesan Langsung</p>
            <p>Pilih kontak untuk mulai mengobrol.</p>
          </div>
        )}
      </div>
    </div>
  );
}
