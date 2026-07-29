/* Nest service worker — minimal, conservative.
 *
 * Goals: make the app installable + resilient to a dropped connection, WITHOUT
 * ever serving stale app code or caching private/dynamic data.
 *
 * - Never touch /api or /ws (auth + live data must always hit the network).
 * - HTML navigations: network-first, fall back to the cached shell offline.
 * - Static assets (hashed JS/CSS/img/fonts): cache-first (safe: filenames are
 *   content-hashed by Vite, so a new deploy = new URLs).
 */
const VERSION = 'nest-v1';
const SHELL = `${VERSION}-shell`;
const ASSETS = `${VERSION}-assets`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL).then((c) => c.addAll(['/', '/index.html'])).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Same-origin only. Never intercept API / websocket / cross-origin (fonts CDN etc).
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/ws')) return;

  // HTML navigations → network-first, cached shell as offline fallback.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put('/index.html', copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('/index.html').then((r) => r || caches.match('/')))
    );
    return;
  }

  // Static assets → cache-first (hashed URLs make this safe across deploys).
  if (/\.(?:js|css|woff2?|ttf|png|jpe?g|svg|webp|ico|json)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(ASSETS).then((c) => c.put(req, copy)).catch(() => {});
            }
            return res;
          })
      )
    );
  }
});
