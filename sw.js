const CACHE_STATIC = 'numeros-static-v2';
const CACHE_DYNAMIC = 'numeros-dynamic-v2';

// ELIMINA la variable BASE - usa rutas relativas
const FILES = [
  './',
  './index.html',
  './home.html',
  './leccion.html',
  './General.html',       
  './operaciones.html',   
  './problemas.html',
  './manifest.json',
  './styles.css',
  './script.js',
  './sw.js',
  './data/problemas.json',
  './assets/logo1.png',
  './assets/logo2.png'
];

self.addEventListener('install', e => {
  console.log('🔄 Service Worker: Instalando...');
  e.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => {
        console.log('📦 Cacheando archivos estáticos');
        return cache.addAll(FILES);
      })
      .then(() => {
        console.log('✅ Todos los archivos cacheados');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Error cacheando:', error);
      })
  );
});

self.addEventListener('activate', e => {
  console.log('🎯 Service Worker: Activado');
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_STATIC && key !== CACHE_DYNAMIC) {
            console.log('🗑️ Eliminando cache viejo:', key);
            return caches.delete(key);
          }
        })
      )
    ).then(() => {
      console.log('🚀 Service Worker listo');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', e => {
  // NO cachear recursos externos como Google Fonts
  if (e.request.url.includes('fonts.googleapis.com') || 
      e.request.url.includes('fonts.gstatic.com')) {
    e.respondWith(fetch(e.request));
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cacheRes => {
      // Si está en cache, devolverlo
      if (cacheRes) {
        console.log('📂 Desde cache:', e.request.url);
        return cacheRes;
      }
      
      // Si no está en cache, hacer fetch
      return fetch(e.request).then(fetchRes => {
        // Solo cachear requests GET exitosas de recursos locales
        if (fetchRes.status === 200 && e.request.method === 'GET' &&
            e.request.url.startsWith('http')) {
          return caches.open(CACHE_DYNAMIC).then(cache => {
            cache.put(e.request, fetchRes.clone());
            console.log('💾 Cacheado:', e.request.url);
            return fetchRes;
          });
        }
        return fetchRes;
      }).catch(error => {
        console.log('🌐 Error de red:', e.request.url);
        
        // Fallback para páginas HTML
        if (e.request.destination === 'document' || 
            e.request.headers.get('accept').includes('text/html')) {
          return caches.match('./home.html');
        }
        
        return null;
      });
    })
  );
});