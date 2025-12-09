// public/sw.js

self.addEventListener('push', function(event) {
  const data = event.data?.json() ?? {};
  const title = data.title || "Msarch App Notification";
  const options = {
    body: data.body || "You have a new update.",
    icon: "/msarch-logo.png",
    badge: "/msarch-logo-badge.png", // A monochrome badge icon
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/dashboard' // URL to navigate to on click
    }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  const notificationData = event.notification.data;
  const urlToOpen = new URL(notificationData.url, self.location.origin).href;

  event.notification.close();

  // This looks for an existing window and focuses it.
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        // Force a navigation and focus on the existing client
        client.navigate(urlToOpen);
        return client.focus();
      }
      return clients.openWindow(urlToOpen);
    }).then(() => {
        // Send a message to the client(s) to let them know data has updated
        clients.matchAll({ type: 'window' }).then(allClients => {
            allClients.forEach(client => {
                client.postMessage({ type: 'data-updated' });
            });
        });
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
