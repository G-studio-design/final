// public/sw.js

// This is a basic service worker for a Progressive Web App (PWA).

const CACHE_NAME = 'msarch-app-cache-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/msarch-logo.png',
  '/dashboard',
  // Add other important assets and pages you want to cache
];

// Install a service worker
self.addEventListener('install', event => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Cache and return requests
self.addEventListener('fetch', event => {
  // Let the browser handle requests for scripts, etc.
  if (event.request.url.includes('/_next/')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Update a service worker
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


// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('Push event but no data');
    return;
  }
  
  try {
    const data = event.data.json();
    const title = data.title || 'Msarch App';
    const options = {
      body: data.body,
      icon: '/msarch-logo.png',
      badge: '/msarch-logo.png',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/dashboard' 
      }
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    console.error('Error processing push data', e);
    // Fallback for plain text
     const title = 'Msarch App';
     const options = {
        body: event.data.text(),
        icon: '/msarch-logo.png',
        badge: '/msarch-logo.png',
     };
     event.waitUntil(self.registration.showNotification(title, options));
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // If a window for the app is already open, focus it.
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
