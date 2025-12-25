// Service Worker for caching media files
const CACHE_NAME = 'christmas-tree-v1';
const MEDIA_CACHE = 'christmas-media-v1';

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/music/jingle-bells.mp3',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== MEDIA_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - cache-first for media, network-first for others
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Cache media files (ornaments, music)
  if (url.pathname.startsWith('/ornaments/') || url.pathname.startsWith('/music/')) {
    event.respondWith(
      caches.open(MEDIA_CACHE).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            // Return cached version, but also update cache in background
            fetch(event.request).then((networkResponse) => {
              if (networkResponse.ok) {
                cache.put(event.request, networkResponse);
              }
            }).catch(() => {});
            return cachedResponse;
          }

          // Not in cache, fetch and cache
          return fetch(event.request).then((networkResponse) => {
            if (networkResponse.ok) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // For other requests, try network first, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.ok && event.request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
