const CACHE_NAME = 'logifast-v6';
const STATIC_ASSETS = [
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Instalar y omitir espera para activar inmediatamente
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('Error cacheando assets iniciales:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activar y forzar la limpieza inmediata de todos los cachés antiguos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Interceptor de Fetch
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Ignorar peticiones no HTTP
  if (!url.protocol.startsWith('http')) return;

  // Estrategia: Network First estricto para:
  // 1. Rutas de navegación (para cargar siempre el HTML index.html más reciente del servidor)
  // 2. Chunks de Next.js (/_next/...) para evitar errores de hashes antiguos y discrepancias de compilación
  // 3. Peticiones de API (/api/...)
  const esNavegacion = event.request.mode === 'navigate';
  const esNextAsset = url.pathname.startsWith('/_next/');
  const esApi = url.pathname.startsWith('/api/');

  if (esNavegacion || esNextAsset || esApi) {
    event.respondWith(
      fetch(event.request).then(response => {
        // En navegación o chunks Next, si todo está bien y no es dinámico, podemos cachearlo si queremos,
        // pero para evitar bloqueos es mejor retornarlo directamente sin cachear la navegación principal
        return response;
      }).catch(() => {
        // Fallback al caché si no hay internet
        return caches.match(event.request);
      })
    );
  } else {
    // Para otros assets estáticos del directorio /public (imágenes, iconos, manifiestos) usamos Cache First:
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });
          return response;
        });
      })
    );
  }
});

// Push notifications
self.addEventListener('push', event => {
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch (e) {
    data = { title: 'LOGIFAST', body: event.data?.text() || 'Tienes una nueva notificación' };
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'LOGIFAST', {
      body: data.body || 'Tienes una nueva notificación',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      vibrate: [100, 50, 100],
      data: data.url || '/',
      actions: data.actions || []
    })
  );
});

// Click en notificacion
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === event.notification.data && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data);
      }
    })
  );
});
