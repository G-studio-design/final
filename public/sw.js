// public/sw.js

const CACHE_NAME = 'msarch-app-cache-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/msarch-logo.png',
  // Add other critical static assets here
];

self.addEventListener('install', (event) => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('push', (event) => {
    if (!event.data) {
        console.log("Push event received with no data.");
        return;
    }
    
    let notificationData = {
        title: 'Msarch App',
        body: 'You have a new notification.',
        icon: '/msarch-logo.png',
        url: '/dashboard'
    };

    try {
        const data = event.data.json();
        notificationData.title = data.title || notificationData.title;
        notificationData.body = data.body || notificationData.body;
        notificationData.url = data.url || notificationData.url;
    } catch(e) {
        console.error("Failed to parse push notification data:", e);
        notificationData.body = event.data.text();
    }

    const options = {
        body: notificationData.body,
        icon: notificationData.icon,
        badge: '/msarch-logo.png',
        data: {
            url: notificationData.url
        }
    };

    event.waitUntil(
        self.registration.showNotification(notificationData.title, options)
    );
});


self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data.url || '/';

    event.waitUntil(
        clients.matchAll({
            type: 'window'
        }).then((clientList) => {
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    // If a window with the same URL is already open, focus it.
                    return client.focus().then(client => {
                        // Notify the client to refresh its data
                        client.postMessage({ type: 'navigate', url: urlToOpen });
                    });
                }
            }
            // If no window is open, open a new one.
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
