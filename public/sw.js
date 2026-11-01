// Service worker Literary Language Lab (PWA). Ditulis manual karena build Turbopack tidak membuat sw.js (temuan K9).
// Aturan: hanya /offline, ikon, dan aset statis /_next/static/* yang disimpan. Halaman yang butuh login, /api/*, dan
// respons Supabase TIDAK pernah disimpan. Saat offline, navigasi diarahkan ke /offline (bukan halaman dari cache).
// Naikkan CACHE saat isi PRECACHE berubah; cache lama dihapus saat activate.

const CACHE = "lll-v1";
const PRECACHE = ["/offline", "/icon.png", "/icon.svg", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await Promise.allSettled(PRECACHE.map((url) => cache.add(url)));
      // Halaman /offline perlu CSS/JS-nya sendiri agar tampil benar tanpa jaringan
      try {
        const res = await fetch("/offline");
        const html = await res.text();
        const assets = Array.from(new Set(html.match(/\/_next\/static\/[^"'\\\s)]+/g) || []));
        await Promise.allSettled(assets.map((url) => cache.add(url)));
      } catch {
        // offline saat instalasi: /offline tetap akan dicoba lagi pada pembaruan berikutnya
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase, API pihak ketiga, dll.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;

  // Navigasi: selalu jaringan; hanya jika gagal tampilkan /offline
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(async () => (await caches.match("/offline")) || Response.error())
    );
    return;
  }

  // Aset statis build: cache-first (nama berkas ber-hash, aman disimpan)
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          })
      )
    );
  }
});
