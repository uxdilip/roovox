// Import Firebase scripts for compatibility version
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

// Service worker version for debugging
const SW_VERSION = '1.0.4';
console.log(`🚀 [SW v${SW_VERSION}] Firebase service worker loading...`);
console.log(`🚀 [SW v${SW_VERSION}] Timestamp: ${new Date().toISOString()}`);
console.log(`🚀 [SW v${SW_VERSION}] Location: ${self.location.href}`);

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
console.log(`🔧 [SW v${SW_VERSION}] Initializing Firebase...`);
firebase.initializeApp(firebaseConfig);

// Get messaging instance
console.log(`📱 [SW v${SW_VERSION}] Getting messaging instance...`);
const messaging = firebase.messaging();

// Debug: Log messaging instance details
console.log(`📱 [SW v${SW_VERSION}] Messaging instance created:`, !!messaging);
console.log(`📱 [SW v${SW_VERSION}] Messaging methods:`, Object.getOwnPropertyNames(Object.getPrototypeOf(messaging)));

// Handle background messages
console.log(`🎯 [SW v${SW_VERSION}] Setting up onBackgroundMessage handler...`);
messaging.onBackgroundMessage((payload) => {
  console.log('🔔 [SW] Background message received:', {
    notif: payload.notification,
    data: payload.data,
    receivedAt: Date.now(),
    fullPayload: payload
  });

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
        console.log('📱 [SW] Could not check multi-user registrations, defaulting to show');
        shouldShow = true; // Default to showing if can't check
      }
      
      if (!shouldShow) {
        console.log(`🚫 [SW] Message for ${targetUserType} ${targetUserId} not registered on this device - suppressing`);
        return Promise.resolve(); // Don't show notification
      } else {
        console.log(`✅ [SW] Message for ${targetUserType} ${targetUserId} - showing notification`);
      }
    }
    
    // For data-only messages, notification data is in the data field
    const notificationTitle = payload.data?.notificationTitle || payload.notification?.title || 'New Notification';
    const notificationBody = payload.data?.notificationBody || payload.notification?.body || 'You have a new notification';
    
    const notificationOptions = {
      body: notificationBody,
      icon: payload.data?.notificationIcon || '/assets/logo.png',
      badge: payload.data?.notificationBadge || '/assets/badge.png',
      tag: payload.data?.notificationTag || payload.data?.type + '_' + payload.data?.id + '_' + (targetUserId || 'unknown'),
      requireInteraction: payload.data?.notificationRequireInteraction === 'true' || payload.data?.priority === 'high',
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

    console.log('🔔 [SW] About to show notification:', {
      title: notificationTitle, 
      options: notificationOptions,
      isDataOnly: !payload.notification,
      targetUser: `${targetUserType} ${targetUserId}`
    });

    const showPromise = self.registration.showNotification(notificationTitle, notificationOptions);
    showPromise.then(() => {
      console.log('✅ [SW] showNotification displayed successfully', notificationOptions.tag);
    }).catch(err => {
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

console.log('✅ [SW] onBackgroundMessage handler registered');

// Additional debugging - listen for all message events
self.addEventListener('message', (event) => {
  console.log('📨 [SW] Received message from client:', event.data);
  
  if (event.data?.type === 'TEST_MESSAGE') {
    console.log('🧪 [SW] Handling test message');
    event.ports[0]?.postMessage({
      type: 'SW_RESPONSE',
      data: { received: true, timestamp: Date.now() }
    });
  }
  
  if (event.data?.type === 'FCM_DEBUG') {
    console.log('🔍 [SW] FCM Debug request received');
    event.ports[0]?.postMessage({
      type: 'FCM_DEBUG_RESPONSE',
      data: { 
        messagingExists: !!messaging,
        onBackgroundMessageRegistered: true,
        timestamp: Date.now() 
      }
    });
  }
});

// Debug: Log when service worker receives any push events
self.addEventListener('push', (event) => {
  console.log('🔄 [SW] Raw push event received:', {
    data: event.data ? event.data.text() : 'no data',
    tag: event.tag,
    timestamp: Date.now(),
    hasData: !!event.data
  });
  
  // Try to parse the data if available
  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('📦 [SW] Parsed push payload:', payload);
    } catch (e) {
      console.log('📦 [SW] Push data (raw text):', event.data.text());
    }
  }
});

// Debug: Log service worker state changes
self.addEventListener('activate', (event) => {
  console.log('🚀 [SW] Service Worker activated at:', new Date().toISOString());
  event.waitUntil(clients.claim());
});

// Debug: Test if messaging is working
setTimeout(() => {
  console.log('⏰ [SW] 5-second check - messaging still available:', !!messaging);
  if (messaging) {
    console.log('⏰ [SW] Messaging methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(messaging)));
  }
}, 5000);
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
  console.log('📦 [SW] Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('🚀 [SW] Service Worker activated');
  event.waitUntil(clients.claim());
});

// Test message handler for debugging
self.addEventListener('message', (event) => {
  console.log(`📨 [SW v${SW_VERSION}] Received message from client:`, event.data);
  
  if (event.data?.type === 'TEST_MESSAGE') {
    console.log(`🧪 [SW v${SW_VERSION}] Handling test message`);
    // Echo back to confirm SW is working
    event.ports[0]?.postMessage({
      type: 'SW_RESPONSE',
      data: { received: true, timestamp: Date.now(), version: SW_VERSION }
    });
  }
  
  if (event.data?.type === 'SKIP_WAITING') {
    console.log(`⏩ [SW v${SW_VERSION}] Skipping waiting state`);
    self.skipWaiting();
  }
  
  if (event.data?.type === 'FCM_DEBUG') {
    console.log(`🔍 [SW v${SW_VERSION}] FCM Debug request received`);
    event.ports[0]?.postMessage({
      type: 'FCM_DEBUG_RESPONSE',
      data: { 
        messagingExists: !!messaging,
        onBackgroundMessageRegistered: true,
        timestamp: Date.now(),
        version: SW_VERSION
      }
    });
  }
});

// Add additional Firebase event listeners for debugging
self.addEventListener('push', (event) => {
  console.log('🔄 [SW] Raw push event received:', {
    data: event.data ? event.data.text() : 'no data',
    tag: event.tag,
    timestamp: Date.now()
  });
});

console.log('🎉 [SW] Service Worker fully loaded and configured!');

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
