// Trove service worker: makes the site installable and keeps it working offline.
// When you bump ?v= on the script tags, bump VERSION here too so phones pick up the new files.
const VERSION = 'v12';
const CACHE = 'trove-' + VERSION;
const FONTS = 'trove-fonts';
const CORE = [
  './', 'index.html', 'app.html', 'welcome.html', 'manifest.webmanifest',
  'logic.js?v=12', 'samples.js?v=12', 'store.js?v=12', 'i18n.js?v=12', 'pulse.js?v=12', 'app.js?v=12', 'tour.js?v=12', 'pwa.js?v=12',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('trove-') && k !== CACHE && k !== FONTS).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Google Fonts: keep a copy so the app looks right offline.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONTS).then(c => c.match(req).then(hit => hit || fetch(req).then(res => { c.put(req, res.clone()); return res; }))));
    return;
  }
  if (url.origin !== location.origin) return;   // anything else from elsewhere (later: Supabase, Stripe) always goes to the network

  // Pages: try the network first so people always get the latest; fall back to the saved copy offline.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('app.html'))));
    return;
  }

  // Scripts, icons, manifest: answer from the saved copy at once, and refresh it in the background.
  e.respondWith(caches.open(CACHE).then(c => c.match(req).then(hit => {
    const net = fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  })));
});
