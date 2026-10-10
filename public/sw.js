const CACHE_NAME = 'milad-mahfil-v4';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/logo.png',
  '/logo.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('Caching assets individually...');
      const cachePromises = ASSETS_TO_CACHE.map(async (asset) => {
        try {
          // Fetch and cache each asset individually so a single 404/failure doesn't break everything
          const response = await fetch(asset);
          if (response && response.status === 200) {
            await cache.put(asset, response);
          }
        } catch (err) {
          console.warn(`Failed to cache asset: ${asset}`, err);
        }
      });
      await Promise.all(cachePromises);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests and exclude external / third-party / non-http requests
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Network-First with Cache-Fallback Strategy:
  // This satisfies Chrome PWA requirements of having an offline-ready fetch handler,
  // while ensuring dev/preview environments always get fresh content when online.
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If the request was successful, cache it and return it
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // If network request fails (offline mode), attempt to serve from cache with ignoreSearch to handle query params (like ?source=pwa)
        return caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }

          // If navigate mode and nothing is in cache, fallback to index.html
          if (event.request.mode === 'navigate') {
            return caches.open(CACHE_NAME).then((cache) => {
              return cache.match('/index.html', { ignoreSearch: true });
            });
          }
        });
      })
  );
});
