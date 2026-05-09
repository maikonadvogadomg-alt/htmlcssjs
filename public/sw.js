/* APK Builder â Service Worker v2.0 */
const CACHE = 'apk-builder-v2';
const BASE  = '/apk-builder/';

/* Arquivos que ficam em cache imediatamente */
const PRECACHE = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json',
  BASE + 'icon-192.svg',
  BASE + 'icon-512.svg',
];

/* ââ Install: prÃ©-cache do shell ââ */
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.addAll(PRECACHE).catch(() => {/* ignora falhas individuais */});
    })
  );
  self.skipWaiting();
});

/* ââ Activate: limpa caches antigos ââ */
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* ââ Fetch: stale-while-revalidate ââ */
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  /* Ignora requisiÃ§Ãµes nÃ£o-GET */
  if (e.request.method !== 'GET') return;

  /* Ignora chamadas de API (proxy GitHub, healthz, etc.) */
  if (url.pathname.startsWith('/api/')) return;

  /* Ignora recursos externos (Google Fonts, GitHub API, etc.) */
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(e.request);

      const fetchPromise = fetch(e.request)
        .then((response) => {
          /* Salva no cache sÃ³ respostas vÃ¡lidas */
          if (response && response.ok && response.type === 'basic') {
            cache.put(e.request, response.clone());
          }
          return response;
        })
        .catch(() => cached); /* Se offline, usa cache */

      /* Retorna cache imediatamente se existir, atualiza em background */
      return cached || fetchPromise;
    })
  );
});

/* ââ Mensagens do app ââ */
self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
