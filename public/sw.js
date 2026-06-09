const CACHE_NAME = 'literary-lab-v1';

self.addEventListener('install', (event) => {
  // Activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // A simple pass-through fetch handler is enough to trigger PWA install prompt in Chrome
  event.respondWith(fetch(event.request));
});
