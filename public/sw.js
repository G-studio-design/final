// public/sw.js

// Listen for the install event, which is fired when the service worker is installed.
self.addEventListener('install', (event) => {
  console.log('Service Worker: Fired event: install');
  // The skipWaiting() method allows this service worker to activate
  // as soon as it's finished installing.
  event.waitUntil(self.skipWaiting());
});

// Listen for the activate event, which is fired when the service worker is activated.
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Fired event: activate');
  // The clients.claim() method allows an active service worker to set itself as the
  // controller for all clients within its scope.
  event.waitUntil(self.clients.claim());
});

// Listen for the push event, which is fired when a push message is received.
self.addEventListener('push', (event) => {
  console.log('Service Worker: Fired event: push');
  if (!event.data) {
    console.error('Service Worker: Push event but no data');
    return;
  }

  const data = event.data.json();
  console.log('Service Worker: Push received with data:', data);

  const title = data.title || 'Msarch App Notification';
  const options = {
    body: data.body,
    icon: '/msarch-logo.png', // Main icon
    badge: '/msarch-logo-badge.png', // Icon for small areas (like Android status bar)
    vibrate: [200, 100, 200], // Vibration pattern
    data: {
      url: data.url || '/', // URL to open on click
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Listen for the notificationclick event, which is fired when a user clicks on a notification.
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Fired event: notificationclick');
  const notification = event.notification;
  const urlToOpen = notification.data.url || '/';

  // Close the notification
  notification.close();

  // This looks for an existing window/tab with the same URL.
  // If one is found, it focuses it. If not, it opens a new one.
  event.waitUntil(
    self.clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Check if there's a window open with the target URL
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            console.log('Service Worker: Found an existing client, focusing it.');
            client.postMessage({ type: 'navigate', url: urlToOpen });
            return client.focus();
          }
        }

        // If no client is found, open a new one
        if (self.clients.openWindow) {
          console.log('Service Worker: No existing client found, opening a new window.');
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});
