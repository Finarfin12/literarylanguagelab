"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export function useUnreadMessages() {
  const supabase = createClient();
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    let channel: any = null;

    async function initMessages() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count, error } = await supabase
        .from('direct_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      if (!error && count !== null) {
        setUnreadMessages(count);
      }

      const channelName = `direct_messages_hook_${Math.random().toString(36).substring(2)}`;
      
      channel = supabase.channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'direct_messages',
            filter: `receiver_id=eq.${user.id}`
          },
          () => {
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

  return unreadMessages;
}
