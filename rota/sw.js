// Nutvique Staff Rota – the app's own files are kept on the phone and opened from there at once;
// a newer version is fetched in the background and used from the next opening. The Google back end is never cached.
const CACHE = 'nvrota-v7';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'favicon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || !u.pathname.startsWith('/rota/')) return;
  const page = e.request.mode === 'navigate';
  const key = page ? 'index.html' : e.request;
  e.respondWith(caches.open(CACHE).then(c => c.match(key, { ignoreSearch: page }).then(hit => {
    const net = fetch(e.request).then(r => { if (r.ok) c.put(key, r.clone()); return r; });
    if (hit) { e.waitUntil(net.catch(() => { })); return hit; }
    return net.catch(() => c.match('index.html'));
  })));
});
