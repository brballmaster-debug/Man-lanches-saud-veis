const CACHE_NAME = 'mana-lanches-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // O Chrome exige um fetch handler para habilitar a instalação.
  // Pode ser vazio ou fazer o cache, mas precisa existir.
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
