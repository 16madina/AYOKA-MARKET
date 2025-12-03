// Firebase Messaging Service Worker for AYOKA MARKET
// This service worker handles background push notifications

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCDYHY9hcv_45bkzs4d6qe7PklCb1vV-48",
  authDomain: "ayoka-market.firebaseapp.com",
  projectId: "ayoka-market",
  storageBucket: "ayoka-market.firebasestorage.app",
  messagingSenderId: "198878757338",
  appId: "1:198878757338:android:92852e251472f7acd3c0e3"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Messaging
const messaging = firebase.messaging();

// Notification type icons and colors
const notificationConfig = {
  message: {
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'ayoka-message'
  },
  offer: {
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'ayoka-offer'
  },
  promo: {
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'ayoka-promo'
  },
  like: {
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'ayoka-like'
  },
  payment: {
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'ayoka-payment'
  },
  default: {
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'ayoka-notification'
  }
};

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationType = payload.data?.type || 'default';
  const config = notificationConfig[notificationType] || notificationConfig.default;

  const notificationTitle = payload.notification?.title || payload.data?.title || 'AYOKA MARKET';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || '',
    icon: config.icon,
    badge: config.badge,
    tag: config.tag,
    data: payload.data || {},
    vibrate: [200, 100, 200],
    requireInteraction: notificationType === 'payment' || notificationType === 'offer',
    actions: getNotificationActions(notificationType)
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Get actions based on notification type
function getNotificationActions(type) {
  switch (type) {
    case 'message':
      return [
        { action: 'reply', title: 'Répondre' },
        { action: 'view', title: 'Voir' }
      ];
    case 'offer':
      return [
        { action: 'accept', title: 'Accepter' },
        { action: 'decline', title: 'Refuser' }
      ];
    case 'payment':
      return [
        { action: 'view', title: 'Voir détails' }
      ];
    default:
      return [
        { action: 'view', title: 'Ouvrir' }
      ];
  }
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click:', event);
  
  event.notification.close();

  const data = event.notification.data || {};
  let url = '/';

  // Route based on notification type
  switch (data.type) {
    case 'message':
      url = data.conversationId ? `/messages?conversation=${data.conversationId}` : '/messages';
      break;
    case 'offer':
      url = data.listingId ? `/listing/${data.listingId}` : '/messages';
      break;
    case 'promo':
      url = data.listingId ? `/listing/${data.listingId}` : '/';
      break;
    case 'like':
      url = data.listingId ? `/listing/${data.listingId}` : '/favorites';
      break;
    case 'payment':
      url = '/transactions';
      break;
    default:
      url = data.route || '/';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({ type: 'NOTIFICATION_CLICK', data });
          return client.focus();
        }
      }
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Handle push subscription change
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[firebase-messaging-sw.js] Push subscription changed');
  
  event.waitUntil(
    self.registration.pushManager.subscribe({ userVisibleOnly: true })
      .then((subscription) => {
        console.log('[firebase-messaging-sw.js] New subscription:', subscription);
      })
  );
});
