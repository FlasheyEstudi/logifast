const CACHE_NAME = 'logifast-v1';
const STATIC_ASSETS = [
  '/',
  '/repartidor',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Instalar y cachear assets estaticos
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

// Activar y limpiar caches viejos
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

// Estrategia: Network First para API, Cache First para assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Ignorar peticiones que no sean http/https (como chrome-extension o websocket)
  if (!url.protocol.startsWith('http')) return;

  if (url.pathname.startsWith('/api/')) {
    // API: Network First (siempre intentar red primero)
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
  } else {
    // Assets: Cache First
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
