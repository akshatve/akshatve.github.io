// Nutvique app – keeps the app files on the phone so it opens at once; a newer version is fetched in the background.
const CACHE = 'nutvique-d776c82732';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'zxing.min.js', 'qrcode.min.js', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'favicon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;   // the Google back end is never cached
  // open at once from the phone's copy; fetch the newest copy in the background (used from the next opening)
  const net = fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); } return r; });
  e.respondWith(caches.match(e.request).then(hit => { if (hit) { e.waitUntil(net.catch(() => { })); return hit; }
    return net.catch(() => caches.match('index.html')); }));
});
