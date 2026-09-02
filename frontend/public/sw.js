/* Nest service worker — minimal, conservative.
 * (redeploy trigger 2026-09-02)
 *
 * Goals: make the app installable + resilient to a dropped connection, WITHOUT
 * ever serving stale app code or caching private/dynamic data.
 *
 * - Never touch /api or /ws (auth + live data must always hit the network).
 * - HTML navigations: network-first, fall back to the cached shell offline.
 * - Static assets (hashed JS/CSS/img/fonts): cache-first (safe: filenames are
 *   content-hashed by Vite, so a new deploy = new URLs).
 */
// Bump this on every deploy that must purge old caches. The activate handler
// deletes any cache not starting with VERSION, so a stale shell (which points
// at old, now-deleted chunk filenames) can't survive across the bump.
const VERSION = 'nest-v2';
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

  // Hashed static assets (js/css/fonts/images) → cache-first; content-hashed
  // filenames make that safe. BUT if a chunk is missing (a stale shell points at
  // an old, deleted filename after a deploy) and it's not cached, we must NOT let
  // the fetch reject unhandled — that leaves the app permanently broken. Instead
  // return a valid (empty) response and tell the page to reload for fresh code.
  if (/\.(?:js|css|woff2?|ttf|png|jpe?g|svg|webp|ico|json)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(req).then((hit) => {
        if (hit) return hit;
        return fetch(req)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(ASSETS).then((c) => c.put(req, copy)).catch(() => {});
            }
            return res;
          })
          .catch(async () => {
            // Missing chunk from a stale deploy. Drop the cached shell so the
            // next navigation fetches the fresh index (with correct chunks),
            // and ask open pages to reload once.
            await caches.delete(SHELL).catch(() => {});
            const clientsArr = await self.clients.matchAll({ type: 'window' }).catch(() => []);
            clientsArr.forEach((c) => c.postMessage({ type: 'NEST_SW_STALE_RELOAD' }));
            return new Response('', { status: 503, statusText: 'stale-chunk' });
          });
      })
    );
  }
});
