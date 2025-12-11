// public/sw.js

// Listener untuk push event
self.addEventListener('push', function (event) {
  console.log('[Service Worker] Push Received.');

  let notificationData = {};
  try {
    notificationData = event.data.json();
  } catch (e) {
    console.warn('[Service Worker] Push event data is not JSON, treating as text.');
    notificationData = {
      title: 'Msarch App Notification',
      body: event.data.text(),
      url: '/dashboard'
    };
  }

  const { title, body, url } = notificationData;

  const options = {
    body: body,
    icon: '/msarch-logo.png', // Path ke ikon notifikasi
    badge: '/msarch-logo.png', // Path ke badge notifikasi (untuk beberapa perangkat)
    data: {
      url: url || '/dashboard' // Menyimpan URL untuk digunakan saat notifikasi di-klik
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Listener untuk klik notifikasi
self.addEventListener('notificationclick', function (event) {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close(); // Tutup notifikasi

  const targetUrl = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({
      type: 'window'
    }).then(function (clientList) {
      // Cek apakah ada tab aplikasi yang sudah terbuka
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          // Jika ada, fokus ke tab tersebut dan navigasi ke URL target
          client.focus();
          return client.navigate(targetUrl);
        }
      }
      // Jika tidak ada tab yang terbuka, buka tab baru
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Skip waiting phase on activate to ensure the new service worker takes control immediately
self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});
