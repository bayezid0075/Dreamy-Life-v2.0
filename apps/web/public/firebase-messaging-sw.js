// Firebase Messaging Service Worker
// This file runs in the background and handles push notifications

import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: self.__FIREBASE_CONFIG?.apiKey,
  authDomain: self.__FIREBASE_CONFIG?.authDomain,
  projectId: self.__FIREBASE_CONFIG?.projectId,
  storageBucket: self.__FIREBASE_CONFIG?.storageBucket,
  messagingSenderId: self.__FIREBASE_CONFIG?.messagingSenderId,
  appId: self.__FIREBASE_CONFIG?.appId,
};

let app;
let messaging;

if (firebaseConfig.apiKey) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  messaging = getMessaging(app);
}

// Handle background messages
if (messaging) {
  onBackgroundMessage(messaging, (payload) => {
    console.log('[firebase-messaging-sw.js] Background message:', payload);

    const notificationTitle = payload.notification?.title || 'Dreamy Life';
    const notificationOptions = {
      body: payload.notification?.body || '',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: payload.data,
      tag: payload.data?.notificationId || 'general',
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click:', event);
  event.notification.close();

  const urlToOpen = event.notification?.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    }),
  );
});
