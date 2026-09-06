// Bump with each shipped app revision so installed clients receive the update
// message and stale shell responses cannot mask a repaired release offline.
const CACHE_VERSION = 'pantry-meal-gap-v3';
const ASSET_CACHE = `${CACHE_VERSION}-assets`;
const INSTALLING_AS_UPDATE = Boolean(self.registration.active);
const APP_SHELL = [
  '/',
  '/index.html',
  '/demo/',
  '/demo/index.html',
  '/privacy/',
  '/terms/',
  '/404.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/assets/icon.svg',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/assets/icon-maskable-512.png',
  '/assets/pantry-meal-gap-social.jpg',
  '/assets/pantry-map-768.avif',
  '/assets/pantry-map-1536.avif',
  '/assets/pantry-map-768.webp',
  '/assets/pantry-map-1536.webp'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    await cache.addAll(APP_SHELL);
    // The Vite bundle filename is content-hashed. Fetch the current documents
    // during installation, then cache every linked JS and CSS file by name.
    const documents = await Promise.all(['/index.html', '/demo/', '/privacy/', '/terms/'].map(async (path) => {
      const response = await fetch(path, { cache: 'reload' });
      if (response.ok) await cache.put(path, response.clone());
      return response.text();
    }));
    const linkedAssets = [...new Set(documents.flatMap((document) => [...document.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)[^" ]*"/g)].map((match) => match[1])))];
    await cache.addAll(linkedAssets);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => ![CACHE_VERSION, ASSET_CACHE].includes(key)).map((key) => caches.delete(key)));
    await self.clients.claim();
    if (INSTALLING_AS_UPDATE) {
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((client) => client.postMessage({ type: 'UPDATE_AVAILABLE' }));
    }
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        const cache = await caches.open(CACHE_VERSION);
        cache.put(request, response.clone());
        return response;
      } catch {
        const demoPage = url.pathname === '/demo' || url.pathname.startsWith('/demo/');
        if (demoPage) {
          const demo = (await caches.match(request)) || (await caches.match('/demo/')) || (await caches.match('/demo/index.html'));
          // Some static preview servers report a directory index with the root
          // document URL. A fresh response preserves the requested /demo URL.
          if (demo) return new Response(await demo.arrayBuffer(), { status: demo.status, statusText: demo.statusText, headers: demo.headers });
        }
        const exact = (await caches.match(request)) || (await caches.match(url.pathname));
        if (exact) return exact;
        return (await caches.match('/index.html')) || (await caches.match('/offline.html'));
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = (await caches.match(request)) || (await caches.match(url.pathname));
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok) {
        const cache = await caches.open(ASSET_CACHE);
        cache.put(request, response.clone());
      }
      return response;
    } catch {
      return new Response('', { status: 503, statusText: 'Offline' });
    }
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
