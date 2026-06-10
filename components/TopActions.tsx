"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { HelpCircle, MessageSquare } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function TopActions() {
  const supabase = createClient();
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    let channel: any = null;

    async function initMessages() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch initial unread count
      const { count, error } = await supabase
        .from('direct_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      if (!error && count !== null) {
        setUnreadMessages(count);
      }

      // Subscribe to real-time changes
      channel = supabase.channel('direct_messages_topactions')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'direct_messages',
            filter: `receiver_id=eq.${user.id}`
          },
          (payload) => {
            // Re-fetch count on any change (insert/update)
            supabase
              .from('direct_messages')
              .select('*', { count: 'exact', head: true })
              .eq('receiver_id', user.id)
              .eq('is_read', false)
              .then(({ count }) => {
                if (count !== null) setUnreadMessages(count);
              });
          }
        )
        .subscribe();
    }

    initMessages();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="absolute top-4 right-4 z-30 flex items-center gap-3">
      {/* Messages Inbox Button */}
      <Link
        href="/messages"
        className="relative flex items-center justify-center w-10 h-10 bg-card border border-border rounded-full text-muted-foreground hover:text-foreground hover:border-brand/50 hover:bg-muted transition-all shadow-sm"
        title="Inbox Pesan"
      >
        <MessageSquare className="w-5 h-5" />
        {unreadMessages > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-card animate-in zoom-in">
            {unreadMessages > 99 ? '99+' : unreadMessages}
          </span>
        )}
      </Link>

      {/* Help Button */}
      <Link
        href="/help"
        className="flex items-center justify-center w-10 h-10 sm:w-auto sm:px-4 sm:gap-2 bg-card border border-border rounded-full sm:rounded-xl text-muted-foreground hover:text-foreground hover:border-brand/50 hover:bg-muted transition-all shadow-sm"
        title="Pusat Bantuan"
      >
        <HelpCircle className="w-5 h-5 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline font-medium text-sm">Bantuan</span>
      </Link>
    </div>
  );
}
