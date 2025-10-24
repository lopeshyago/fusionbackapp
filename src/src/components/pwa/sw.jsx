const CACHE_NAME = 'fusion-fitness-cache-v1';
// Adicione aqui os recursos que você quer que funcionem offline.
// O service worker irá pré-carregar e salvar esses arquivos.
const URLS_TO_CACHE = [
  '/',
  '/components/pwa/manifest_v13.webmanifest',
  '/components/icons/icon-192.png',
  '/components/icons/icon-512.png',
  '/components/icons/icon-maskable-512.png',
  '/components/icons/icon-monochrome-512.png'
  // Você pode adicionar mais caminhos para CSS, JS, ou páginas principais aqui.
];

// Evento de Instalação: Salva os recursos em cache.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// Evento de Ativação: Limpa caches antigos.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Evento de Fetch: Intercepta as requisições.
// Tenta primeiro buscar do cache. Se não encontrar, busca da rede.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se o recurso está no cache, retorna ele.
        if (response) {
          return response;
        }
        // Senão, busca da rede.
        return fetch(event.request);
      }
    )
  );
});