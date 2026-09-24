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
