// public/sw.js

self.addEventListener('push', function(event) {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/msarch-logo.png?v=5',
    badge: '/msarch-logo.png?v=5',
    data: {
      url: data.url
    }
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      // If a window for this origin is already open, focus it.
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        // Check if the client's URL is the one we want to navigate to.
        // You might need more complex logic here if your URLs have query params etc.
        if (client.url === self.origin + urlToOpen && 'focus' in client) {
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
