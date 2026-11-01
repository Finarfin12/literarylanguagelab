// Status "Online" sungguhan lewat Supabase Realtime Presence (menggantikan label "Online" yang dulu selalu tampil).
// Satu channel bersama untuk seluruh aplikasi: PresenceTracker (di layout dashboard) mulai melacak pengguna yang sedang
// membuka aplikasi; halaman Pesan membaca daftar id yang online lewat subscribeOnline(). Hanya di browser.
// Pengguna bisa menyembunyikan statusnya (Pengaturan → Privasi → show_online_status): ia tidak dilacak, jadi tampil offline.

import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

const CHANNEL_NAME = "presence:online-users";

let channel: RealtimeChannel | null = null;
let trackedUserId: string | null = null;
let online = new Set<string>();
const listeners = new Set<(ids: Set<string>) => void>();

function emit() {
  listeners.forEach((cb) => cb(new Set(online)));
}

function readState(ch: RealtimeChannel) {
  const state = ch.presenceState() as Record<string, unknown>;
  online = new Set(Object.keys(state));
  emit();
}

/** Mulai (atau lanjutkan) channel. `track=false` hanya membaca daftar, tanpa menampakkan diri. */
export function startPresence(supabase: SupabaseClient, userId: string, track: boolean) {
  if (!channel) {
    // presence key = id pengguna, sehingga Object.keys(presenceState()) adalah daftar pengguna online
    channel = supabase.channel(CHANNEL_NAME, { config: { presence: { key: userId } } });
    const ch = channel;
    ch.on("presence", { event: "sync" }, () => readState(ch));
    ch.subscribe(async (status) => {
      if (status === "SUBSCRIBED" && track) {
        trackedUserId = userId;
        await ch.track({ at: new Date().toISOString() });
      }
    });
    return;
  }
  // channel sudah ada: sesuaikan pelacakan bila pilihan privasi berubah
  if (track && trackedUserId !== userId) {
    trackedUserId = userId;
    void channel.track({ at: new Date().toISOString() });
  } else if (!track && trackedUserId) {
    trackedUserId = null;
    void channel.untrack();
  }
}

export function stopPresence(supabase: SupabaseClient) {
  if (channel) {
    void supabase.removeChannel(channel);
    channel = null;
    trackedUserId = null;
    online = new Set();
    emit();
  }
}

export function subscribeOnline(cb: (ids: Set<string>) => void): () => void {
  listeners.add(cb);
  cb(new Set(online));
  return () => {
    listeners.delete(cb);
  };
}
