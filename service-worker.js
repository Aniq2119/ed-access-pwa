const CACHE_NAME = 'ed-access-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/drugs.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@700&family=Roboto:wght@400;500;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Bangers&display=swap',
  'https://fonts.googleapis.com/css2?family=Luckiest+Guy&display=swap',
  'https://upload.wikimedia.org/wikipedia/en/thumb/6/6f/Universiti_Teknologi_MARA_logo.svg/1200px-Universiti_Teknologi_MARA_logo.svg.png',
  'https://www.svgrepo.com/show/2038/syringe.svg',
  'https://www.svgrepo.com/show/22919/cardiogram.svg',
  'https://www.svgrepo.com/show/38743/stethoscope.svg',
  'https://www.svgrepo.com/show/2854/pills.svg',
  'https://www.svgrepo.com/show/2807/iv-bag.svg',
  'https://www.svgrepo.com/show/36187/first-aid-kit.svg',
  'https://www.svgrepo.com/show/3028/defibrillator.svg',
  'https://www.svgrepo.com/show/4526/medicine.svg',
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
