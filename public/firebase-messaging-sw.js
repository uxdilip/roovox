// Import Firebase scripts for compatibility version
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCF_hn_33xTJaO-zwXGNxhVc9yJqjXfXD0",
  authDomain: "sniket-d2766.firebaseapp.com",
  projectId: "sniket-d2766",
  storageBucket: "sniket-d2766.firebasestorage.app",
  messagingSenderId: "968429297305",
  appId: "1:968429297305:web:7425601aff7e7d08b52208",
  measurementId: "G-V3D17BJYZ9"
};

// Initialize Firebase app
firebase.initializeApp(firebaseConfig);

// Get messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('🔔 [SW] Background message received:', {
    notif: payload.notification,
    data: payload.data,
    receivedAt: Date.now()
  });

  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/assets/logo.png',
    badge: '/assets/badge.png',
    tag: payload.data?.type + '_' + payload.data?.id,
    requireInteraction: payload.data?.priority === 'high',
    data: {
      clickAction: payload.data?.clickAction || '/',
      type: payload.data?.type || 'system',
      id: payload.data?.id || '',
      userId: payload.data?.userId || '',
      userType: payload.data?.userType || ''
    },
    actions: getNotificationActions(payload.data?.type),
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
    silent: false
  };

  // Add image if available
  if (payload.notification?.image) {
    notificationOptions.image = payload.notification.image;
  }

  const showPromise = self.registration.showNotification(notificationTitle, notificationOptions);
  showPromise.then(() => {
    console.log('✅ [SW] showNotification displayed', notificationOptions.tag);
  }).catch(err => {
    console.error('❌ [SW] showNotification failed', err);
  });
  return showPromise;
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification clicked:', event.notification);

  event.notification.close();

  const clickAction = event.notification.data?.clickAction || '/';
  const action = event.action;

  if (action === 'dismiss') {
    return;
  }

  // Handle different actions
  let targetUrl = clickAction;
  
  if (action === 'reply' && event.notification.data?.type === 'message') {
    targetUrl = `/chat/${event.notification.data.id}`;
  } else if (action === 'view') {
    targetUrl = clickAction;
  }

  // Open or focus window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      const existingClient = clientList.find(client => 
        client.url.includes(targetUrl.split('/').pop() || '')
      );

      if (existingClient) {
        return existingClient.focus();
      }

      // Check if any window/tab is open
      if (clientList.length > 0) {
        const client = clientList[0];
        return client.navigate(targetUrl).then(() => client.focus());
      }

      // Open new window/tab
      return clients.openWindow(targetUrl);
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('🚫 Notification closed:', event.notification);
  
  // Track notification dismissal if needed
  // You can send analytics here
});

// Service worker install/activate events
self.addEventListener('install', (event) => {
  console.log('📦 Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activated');
  event.waitUntil(clients.claim());
});

/**
 * Get notification actions based on type
 */
function getNotificationActions(type) {
  switch (type) {
    case 'booking':
      return [
        { action: 'view', title: '👀 View Booking' },
        { action: 'dismiss', title: '❌ Dismiss' }
      ];
    case 'message':
      return [
        { action: 'reply', title: '💬 Reply' },
        { action: 'view', title: '👀 View Chat' },
        { action: 'dismiss', title: '❌ Dismiss' }
      ];
    case 'payment':
      return [
        { action: 'view', title: '💳 View Payment' },
        { action: 'dismiss', title: '❌ Dismiss' }
      ];
    default:
      return [
        { action: 'view', title: '👀 View' },
        { action: 'dismiss', title: '❌ Dismiss' }
      ];
  }
}
