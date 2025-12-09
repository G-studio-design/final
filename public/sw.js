// public/sw.js

self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  // Optional: Caching assets for offline use
  // event.waitUntil(
  //   caches.open('msarch-app-cache').then((cache) => {
  //     return cache.addAll([
  //       '/',
  //       // Add other important assets here
  //     ]);
  //   })
  // );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  // Optional: Clean up old caches
  // event.waitUntil(
  //   caches.keys().then((cacheNames) => {
  //     return Promise.all(
  //       cacheNames.map((cacheName) => {
  //         if (cacheName !== 'msarch-app-cache') {
  //           return caches.delete(cacheName);
  //         }
  //       })
  //     );
  //   })
  // );
  return self.clients.claim();
});

self.addEventListener('push', (event) => {
  if (!event.data) {
    console.error('Push event but no data');
    return;
  }

  let notificationData = {
    title: 'Msarch App Notification',
    body: 'You have a new update.',
    icon: '/msarch-logo.png', // Default icon
    badge: '/msarch-logo.png', // Default badge
    url: '/dashboard' // Default fallback URL
  };

  try {
    const data = event.data.json();
    notificationData.title = data.title || notificationData.title;
    notificationData.body = data.body || notificationData.body;
    notificationData.url = data.url || notificationData.url;
  } catch (e) {
    console.error('Failed to parse push data as JSON', e);
    // Use the raw text as body if JSON parsing fails
    notificationData.body = event.data.text();
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
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
      // Check if a window for this app is already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        // If the client's URL is the one we want to navigate to and it's focused, do nothing.
        // If it's open but not focused, focus it.
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
