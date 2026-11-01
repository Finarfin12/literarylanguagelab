"use client";

// Menampakkan pengguna sebagai "online" selama aplikasi terbuka (kecuali ia menyembunyikannya di Pengaturan → Privasi).
// Dipasang sekali di layout dashboard; tidak merender apa pun.

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { startPresence, stopPresence } from "@/lib/presence";

export default function PresenceTracker() {
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      const { data: profile } = await supabase.from("profiles").select("preferences").eq("id", user.id).maybeSingle();
      const hidden = profile?.preferences?.privacy?.show_online_status === false;
      if (!cancelled) startPresence(supabase, user.id, !hidden);
    })();
    return () => {
      cancelled = true;
      stopPresence(supabase);
    };
  }, []);

  return null;
}
