// public/sw.js

self.addEventListener('push', event => {
  console.log('[Service Worker] Push Received.');
  let data;
  try {
    data = event.data.json();
  } catch (e) {
    console.error('[Service Worker] Push event but no data');
    data = {
        title: 'Pemberitahuan Baru',
        body: 'Anda memiliki pembaruan baru.',
        url: '/dashboard'
    };
  }

  const title = data.title || 'Msarch App';
  const options = {
    body: data.body || 'Anda memiliki pesan baru.',
    icon: '/msarch-logo.png',
    badge: '/msarch-logo.png',
    data: {
      url: data.url || '/dashboard'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      // If a window for this origin is already open, focus it.
      for (const client of clientList) {
        // You might want to check for a specific URL here
        if (client.url === '/' && 'focus' in client) {
          client.navigate(urlToOpen);
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
