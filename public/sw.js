// public/sw.js

self.addEventListener('push', function (event) {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error('Error parsing push data:', e);
      // Fallback if data is just text
      data = { title: 'New Notification', body: event.data.text() };
    }
  }

  const title = data.title || 'Msarch App Notification';
  const options = {
    body: data.body || 'You have a new update.',
    icon: '/msarch-logo.png', // Main app icon
    badge: '/msarch-logo.png', // Icon for notification bar on Android
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/dashboard' // Default URL if none provided
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const targetUrl = event.notification.data.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function (clientList) {
      // Check if a window for this app is already open
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url && 'focus' in client) {
            // Post a message to the client to handle navigation and data refresh
            client.postMessage({
              type: 'navigate',
              url: targetUrl
            });
            return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
