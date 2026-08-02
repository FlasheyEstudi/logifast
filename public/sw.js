const CACHE_NAME = 'logifast-pwa-v7';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/logo.png',
  '/logo.svg'
];

// Instalar y precachear assets estáticos principales
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Error precacheando assets PWA:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activar y limpiar cachés antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Interceptor de peticiones HTTP
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (!url.protocol.startsWith('http')) return;

  const esNavegacion = event.request.mode === 'navigate';
  const esNextAsset = url.pathname.startsWith('/_next/');
  const esApi = url.pathname.startsWith('/api/');

  if (esApi) {
    // NetworkOnly para endpoints /api/* (evitar cachear respuestas dinámicas)
    event.respondWith(fetch(event.request));
    return;
  }

  if (esNavegacion || esNextAsset) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (esNavegacion) return caches.match('/');
          return new Response('Red no disponible', { status: 503, statusText: 'Service Unavailable' });
        });
      })
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return (
          cached ||
          fetch(event.request).then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, clone);
            });
            return response;
          })
        );
      })
    );
  }
});

// Notificaciones Push
self.addEventListener('push', (event) => {
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
    })
  );
});

// Click en notificación push
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
