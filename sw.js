const CACHE_STATIC = 'isaac-static-v1';
const CACHE_DYNAMIC = 'isaac-dynamic-v1';

// Necesario para GitHub Pages
const BASE = '/pwa_nueva_mate';

const FILES = [
  `${BASE}/`,
  `${BASE}/index.html`,
  `${BASE}/home.html`,
  `${BASE}/leccion.html`,
  `${BASE}/problemas.html`,
  `${BASE}/manifest.json`,
  `${BASE}/styles.css`,
  `${BASE}/script.js`,
  `${BASE}/data/problemas.json`,
  `${BASE}/assets/logo1.png`,
  `${BASE}/assets/logo2.png`
];

// -------------------------------
// INSTALL - Cache estático
// -------------------------------
self.addEventListener('install', e => {
  console.log('[SW] Instalando...');
  e.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => cache.addAll(FILES))
      .then(() => self.skipWaiting())
  );
});

// -------------------------------
// ACTIVATE - Limpieza de cachés viejas
// -------------------------------
self.addEventListener('activate', e => {
  console.log('[SW] Activado');

  const whitelist = [CACHE_STATIC, CACHE_DYNAMIC];

  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (!whitelist.includes(key)) {
            console.log('[SW] Eliminando cache vieja:', key);
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// -------------------------------
// FETCH - Cache dinámico + Offline
// -------------------------------
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cacheRes => {
      // Devuelve desde cache o hace fetch
      return (
        cacheRes ||
        fetch(e.request)
          .then(fetchRes => {
            return caches.open(CACHE_DYNAMIC).then(cache => {
              cache.put(e.request, fetchRes.clone());
              return fetchRes;
            });
          })
          .catch(() => {
            // Si se pide una página HTML y no hay internet → fallback offline
            if (e.request.headers.get('accept').includes('text/html')) {
              return caches.match(`${BASE}/index.html`);
            }
          })
      );
    })
  );
});
