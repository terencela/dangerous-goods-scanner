/**
 * ZRH Baggage Checker — Service Worker
 *
 * Strategy:
 * - App shell (HTML, JS, CSS, icons): Cache-first → ensures instant load and offline use
 * - OpenAI API calls: Network-only (cannot be cached — contain real-time AI responses)
 * - Everything else: Network-first with cache fallback
 *
 * This enables the app to:
 * - Load instantly even with spotty airport Wi-Fi
 * - Work offline for the manual category selection + wizard flows
 * - Require a connection only for AI vision/chatbot features
 */

const CACHE_NAME = 'zrh-bagcheck-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install: cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: routing strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // OpenAI API: always network-only
  if (url.hostname === 'api.openai.com') {
    event.respondWith(fetch(request));
    return;
  }

  // App shell & static assets: cache-first
  if (
    request.method === 'GET' &&
    (url.origin === self.location.origin || STATIC_ASSETS.includes(url.pathname))
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          // Only cache successful GET responses from our own origin
          if (response.ok && request.method === 'GET' && url.origin === self.location.origin) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Default: network-first with cache fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
