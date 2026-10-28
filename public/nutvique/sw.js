// Nutvique app – loads the newest app when online (phone's copy when offline); other files come from the phone's copy.
const CACHE = 'nutvique-a42c0df70c';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'zxing.min.js', 'qrcode.min.js', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'favicon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;   // the Google back end is never cached
  const net = fetch(e.request, { cache: 'no-cache' }).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); } return r; });
  if (e.request.mode === 'navigate' || /\/(index\.html)?$/.test(u.pathname)) {
    // the app page: newest copy when online (so updates show on the first opening); the phone's copy if offline or slow (5 s)
    const slow = new Promise(res => setTimeout(res, 5000)).then(() => caches.match(e.request).then(h => h || caches.match('index.html')));
    e.respondWith(Promise.race([net.catch(() => caches.match(e.request).then(h => h || caches.match('index.html'))), slow]).then(r => r || net));
    return;
  }
  // other files (icons, scanner library): open from the phone's copy; refresh in the background
  e.respondWith(caches.match(e.request).then(hit => { if (hit) { e.waitUntil(net.catch(() => { })); return hit; }
    return net.catch(() => caches.match('index.html')); }));
});
