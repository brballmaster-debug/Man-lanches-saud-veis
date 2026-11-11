const CACHE_NAME = 'mana-lanches-v6';

// Recursos essenciais para inicialização imediata da casca (App Shell)
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/logo.png',
  '/logo.png?v=5'
];

// 1. Instalação: baixa os arquivos estáticos básicos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Força o novo Service Worker a assumir sem esperar fechar todas as abas
  self.skipWaiting();
});

// 2. Ativação: apaga automaticamente caches de versões antigas após um novo deploy
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Interceptação de requisições (Fetch)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Não intercepta requisições não-GET
  if (request.method !== 'GET') {
    return;
  }

  // REGRA DE SEGURANÇA: ignora chamadas do Firebase, Firestore, Auth e Google APIs
  if (
    url.origin.includes('firestore.googleapis.com') ||
    url.origin.includes('firebase') ||
    url.origin.includes('identitytoolkit') ||
    url.origin.includes('securetoken.googleapis.com') ||
    url.origin.includes('googleapis.com')
  ) {
    return; // Deixa o SDK do Firebase gerenciar diretamente pela rede
  }

  // REGRA CRÍTICA PARA VITE / DESENVOLVIMENTO:
  // Nunca cacheia módulos dinâmicos do Vite para evitar conflitos de instâncias do React / hooks
  if (
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.includes('/node_modules/') ||
    url.search.includes('v=') ||
    url.search.includes('import') ||
    url.search.includes('t=') ||
    url.hostname === 'localhost' ||
    url.hostname.includes('ais-dev-')
  ) {
    return;
  }

  // Navegação (HTML principal): Network-First para garantir que scripts e hashes estejam sempre atualizados
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // Estratégia Stale-While-Revalidate para arquivos estáticos em produção (imagens, manifest, assets)
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(request).then((cachedResponse) => {
        // Dispara a busca na rede em segundo plano para atualizar o cache
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200 && (networkResponse.type === 'basic' || networkResponse.type === 'cors')) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => {
            // Em caso de falha de rede/offline durante navegação, retorna a raiz em cache
            if (request.mode === 'navigate') {
              return cache.match('/');
            }
          });

        // Retorna imediatamente o que estiver em cache ou aguarda a rede caso ainda não esteja salvo
        return cachedResponse || fetchPromise;
      });
    })
  );
});

// ==========================================
// 4. WEB PUSH & NOTIFICAÇÕES NATIVAS DO SISTEMA
// ==========================================

// 4.1 Evento de Push (Notificações enviadas pelo servidor / Web Push)
self.addEventListener('push', (event) => {
  let pushData = {
    title: '🔔 Novo Pedido Recebido! • Maná Lanches',
    body: 'Você recebeu um novo pedido na Maná Lanches Saudáveis.',
    icon: '/logo.png?v=5',
    badge: '/logo.png?v=5',
    tag: 'mana-order-notification',
    data: { url: '/' }
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      pushData = { ...pushData, ...parsed };
    } catch {
      pushData.body = event.data.text() || pushData.body;
    }
  }

  const notificationOptions = {
    body: pushData.body,
    icon: pushData.icon || '/logo.png?v=5',
    badge: pushData.badge || '/logo.png?v=5',
    tag: pushData.tag || 'mana-order-notification',
    vibrate: [250, 100, 250, 100, 450],
    renotify: true,
    requireInteraction: true,
    data: pushData.data || { url: '/' },
    actions: [
      { action: 'open_order', title: 'Ver Pedido 🚀' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(pushData.title, notificationOptions)
  );
});

// 4.2 Clique na Notificação Nativa (abre ou foca a janela do painel)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se já houver uma aba aberta, foca nela e envia evento para abrir o painel
      for (const client of clientList) {
        if (client.url && client.url.includes(self.location.origin) && 'focus' in client) {
          try {
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              action: event.action,
              data: event.notification.data
            });
          } catch (e) {
            // Ignora erro de postMessage
          }
          return client.focus();
        }
      }
      // Se não houver janela aberta, abre uma nova janela/aba
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// 4.3 Mensagens enviadas do cliente para o Service Worker
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    const finalOptions = {
      body: options?.body || '',
      icon: options?.icon || '/logo.png?v=5',
      badge: options?.badge || '/logo.png?v=5',
      vibrate: [250, 100, 250, 100, 450],
      tag: options?.tag || 'mana-notification',
      renotify: true,
      requireInteraction: true,
      data: options?.data || { url: '/' },
      actions: [
        { action: 'open_order', title: 'Ver Pedido 🚀' }
      ],
      ...options
    };

    event.waitUntil(
      self.registration.showNotification(title || '🔔 Maná Lanches', finalOptions)
    );
  }
});
