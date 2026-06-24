// sw.js — Pune Nirmalya Finder service worker
const CACHE = 'nirmalya-v6';   // bump this number whenever you change index.html or sw.js
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;                  // never intercept writes (POST/DELETE/etc.)

  const url = new URL(req.url);

  // IMPORTANT: only ever cache OUR OWN files.
  // Everything cross-origin — Supabase API + realtime, OpenStreetMap tiles,
  // and CDN scripts — must always go straight to the network so data is never stale.
  if (url.origin !== self.location.origin) return;

  // Same-origin app shell: serve from cache, fall back to network, then to index.html.
  e.respondWith(
    caches.match(req).then((cached) =>
      cached || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match('./index.html'))
    )
  );
});
