// ╔══════════════════════════════════════╗
// ║  Service Worker - PWA Offline      ║
// ║  Cache-first strategy              ║
// ╚══════════════════════════════════════╝

const CACHE_NAME = 'caipu-guide-v1.0.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/variables.css',
  '/css/reset.css',
  '/css/pixel.css',
  '/css/layout.css',
  '/css/components.css',
  '/js/config.js',
  '/js/utils/storage.js',
  '/js/utils/dom.js',
  '/js/utils/format.js',
  '/js/store.js',
  '/js/router.js',
  '/js/app.js',
  '/js/data/nutrition-base.js',
  '/js/data/ingredient-synonyms.js',
  '/js/data/recipes-zhongcan.js',
  '/js/data/recipes-xican.js',
  '/js/matching/classic-pairings.js',
  '/js/matching/scorer.js',
  '/js/matching/matcher.js',
  '/js/modules/home.js',
  '/js/modules/smart-match.js',
  '/js/modules/browse.js',
  '/js/modules/recipe-detail.js',
  '/js/modules/cooking-mode.js',
  '/js/modules/nutrition.js',
  '/js/modules/diary.js',
  '/js/modules/favorites.js',
  '/js/modules/shopping-list.js',
  '/js/modules/settings.js',
  '/assets/icons/favicon.svg',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
];

// ── Install: Precache app shell ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching app shell...');
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[SW] Some assets failed to precache:', err);
        // Don't fail the install if some assets are missing
      });
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// ── Activate: Clean old caches ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => {
          console.log('[SW] Deleting old cache:', key);
          return caches.delete(key);
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// ── Fetch: Cache-first for static, stale-while-revalidate for external ──
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) return;

  // For Google Fonts and CDN resources: stale-while-revalidate
  if (url.hostname === 'fonts.googleapis.com' ||
      url.hostname === 'fonts.gstatic.com' ||
      url.hostname === 'cdn.jsdelivr.net') {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  // For Chart.js CDN (lazy loaded)
  if (url.hostname === 'cdn.jsdelivr.net' && url.pathname.includes('chart.js')) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }

  // For app assets: cache-first
  event.respondWith(cacheFirst(event.request));
});

// ── Cache-first strategy ──
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Offline fallback for HTML requests
    if (request.headers.get('Accept')?.includes('text/html')) {
      const cached = await caches.match('/index.html');
      if (cached) return cached;
    }
    throw err;
  }
}

// ── Stale-while-revalidate strategy ──
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);

  return cached || fetchPromise;
}

// ── Message handling ──
self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') {
    self.skipWaiting();
  }
  if (event.data === 'clear-cache') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[SW] Cache cleared');
    });
  }
});
