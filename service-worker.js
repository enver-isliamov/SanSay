const CACHE_NAME = 'bubnovsky-coach-v3';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching URLs');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  // Игнорируем запросы, которые не являются GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Для запросов к Firebase и Google API всегда обращаемся к сети, не кэшируем их.
  if (event.request.url.includes("firebase") || event.request.url.includes("googleapis.com")) {
      return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Если ресурс есть в кэше, возвращаем его
        if (cachedResponse) {
          return cachedResponse;
        }

        // Если ресурса нет в кэше, запрашиваем его из сети
        return fetch(event.request).then(
          networkResponse => {
            // Проверяем, что получили корректный ответ
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            // Клонируем ответ, чтобы положить его в кэш и вернуть браузеру
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return networkResponse;
          }
        ).catch(error => {
            console.error('Fetch failed; user is likely offline.', error);
            // Можно вернуть запасную офлайн-страницу, если она есть
        });
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});
