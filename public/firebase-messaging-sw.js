// Import Firebase scripts for compatibility version
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

// Service worker for Firebase messaging
const SW_VERSION = '1.0.5';

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
  try {
    // Check if this message should be shown (multi-user routing)
    const targetUserId = payload.data?.userId;
    const targetUserType = payload.data?.userType;
    
    if (targetUserId && targetUserType) {
      // Get stored multi-user registrations
      let shouldShow = false;
      try {
        const registrationsData = self.localStorage?.getItem('fcm_multi_user_registrations');
        if (registrationsData) {
          const registrations = JSON.parse(registrationsData);
          shouldShow = registrations.some(r => 
            r.userId === targetUserId && r.userType === targetUserType
          );
        }
      } catch (e) {
        shouldShow = true; // Default to showing if can't check
      }
      
      if (!shouldShow) {
        return Promise.resolve(); // Don't show notification
      }
    }
    
    // For data-only messages, notification data is in the data field
    const notificationTitle = payload.data?.notificationTitle || payload.notification?.title || 'New Notification';
    const notificationBody = payload.data?.notificationBody || payload.notification?.body || 'You have a new notification';
    
    // Debug logging to see what we're actually receiving
    console.log('🔍 [SW] Notification payload:', {
      title: notificationTitle,
      body: notificationBody,
      payloadNotification: payload.notification,
      payloadData: payload.data
    });
    
    const notificationOptions = {
      body: notificationBody,
      icon: payload.data?.notificationIcon || '/assets/logo.png',
      badge: payload.data?.notificationBadge || '/assets/badge.png',
      tag: payload.data?.notificationTag || payload.data?.type + '_' + payload.data?.id + '_' + (targetUserId || 'unknown'),
      requireInteraction: payload.data?.notificationRequireInteraction === 'true' || payload.data?.priority === 'high',
      // Add branding to make notifications look more professional
      dir: 'ltr',
      lang: 'en',
      renotify: true,
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
    const imageUrl = payload.data?.notificationImage || payload.notification?.image;
    if (imageUrl) {
      notificationOptions.image = imageUrl;
    }

    const showPromise = self.registration.showNotification(notificationTitle, notificationOptions);
    showPromise.catch(err => {
      console.error('❌ [SW] showNotification failed:', err);
    });
    
    return showPromise;
  } catch (error) {
    console.error('❌ [SW] Error in onBackgroundMessage:', error);
    // Still try to show a basic notification
    return self.registration.showNotification('New Message', {
      body: 'You have a new message',
      icon: '/assets/logo.png'
    });
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
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

// Service worker install/activate events
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
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
