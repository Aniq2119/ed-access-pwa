const CACHE_NAME = 'ed-access-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/drugs.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@700&family=Roboto:wght@400;500;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Bangers&display=swap',
  'https://fonts.googleapis.com/css2?family=Luckiest+Guy&display=swap',
  '/UiTM-Logo.png',
  '/syringe-icon.png',
  '/heart-icon.png',
  '/stethoscope-icon.png',
  '/drug-dose-icon.png',
  '/fluid-regimen-icon.png',
  '/medical-equipment-icon.png',
  '/resuscitation-icon.png',
  'https://i.pinimg.com/originals/9b/6e/b6/9b6eb6d70f1917b08a991b6e492f3a6a.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

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
