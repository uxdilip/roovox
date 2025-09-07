// Firebase Cloud Messaging Service Worker - Enterprise Edition v2.0.0
// Handles background notifications with enterprise multi-user support

importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

console.log('🏢 [Enterprise FCM SW] v2.0.0 - Loading enterprise service worker...');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCF_hn_33xTJaO-zwXGNxhVc9yJqjXfXD0",
  authDomain: "sniket-d2766.firebaseapp.com",
  projectId: "sniket-d2766",
  storageBucket: "sniket-d2766.firebasestorage.app",
  messagingSenderId: "968429297305",
  appId: "1:968429297305:web:7425601aff7e7d08b52208"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const messaging = firebase.messaging();

// Enterprise User Management
class EnterpriseServiceWorkerManager {
  constructor() {
    this.activeUsers = new Map();
    this.loadActiveUsers();
  }

  async loadActiveUsers() {
    try {
      // Access localStorage through clients
      const clients = await self.clients.matchAll();
      if (clients.length > 0) {
        const storageData = await this.getStorageData('enterprise_active_users');
        if (storageData) {
          const usersData = JSON.parse(storageData);
          this.activeUsers = new Map(usersData);
          console.log('🏢 [Enterprise FCM SW] Loaded active users:', this.activeUsers.size);
        }
      }
    } catch (error) {
      console.warn('⚠️ [Enterprise FCM SW] Failed to load active users:', error);
    }
  }

  async getStorageData(key) {
    try {
      const clients = await self.clients.matchAll();
      if (clients.length > 0) {
        return new Promise((resolve) => {
          const channel = new MessageChannel();
          channel.port1.onmessage = (event) => {
            resolve(event.data.value);
          };
          
          // Timeout after 1 second
          setTimeout(() => resolve(null), 1000);
          
          clients[0].postMessage({
            type: 'GET_STORAGE',
            key: key
          }, [channel.port2]);
        });
      }
    } catch (error) {
      console.warn('⚠️ [Enterprise FCM SW] Storage access failed:', error);
    }
    return null;
  }

  shouldShowNotification(payload) {
    const targetUserId = payload.data?.userId;
    const targetUserType = payload.data?.userType;
    const source = payload.data?.source;

    console.log('🎯 [Enterprise FCM SW] Checking notification target:', {
      targetUserId,
      targetUserType,
      source,
      activeUsers: this.activeUsers.size
    });

    // Always show enterprise FCM messages
    if (source === 'enterprise-fcm') {
      console.log('✅ [Enterprise FCM SW] Enterprise message - showing notification');
      return true;
    }

    // If no target specified, it's a broadcast - show to anyone
    if (!targetUserId && !targetUserType) {
      console.log('📢 [Enterprise FCM SW] Broadcast message - showing notification');
      return true;
    }

    // If no active users, still show (for initial registration)
    if (this.activeUsers.size === 0) {
      console.log('⚠️ [Enterprise FCM SW] No active users, but showing notification');
      return true;
    }

    // Specific user targeting
    if (targetUserId) {
      const shouldShow = this.activeUsers.has(targetUserId);
      console.log(`${shouldShow ? '✅' : '🚫'} [Enterprise FCM SW] User ${targetUserId} ${shouldShow ? 'is' : 'not'} active`);
      return shouldShow;
    }

    // User type targeting
    if (targetUserType) {
      for (const [userId, user] of this.activeUsers) {
        if (user.userType === targetUserType) {
          console.log(`✅ [Enterprise FCM SW] Found active ${targetUserType} user: ${userId}`);
          return true;
        }
      }
      console.log(`🚫 [Enterprise FCM SW] No active ${targetUserType} users`);
      return false;
    }

    return true;
  }

  getNotificationOptions(payload) {
    const title = payload.notification?.title || payload.data?.notificationTitle || 'New Notification';
    const body = payload.notification?.body || payload.data?.notificationBody || 'You have a new message';
    const icon = payload.notification?.icon || '/assets/logo.png';
    const badge = '/assets/badge.png';
    const clickAction = payload.data?.clickAction || payload.fcmOptions?.link || '/';
    
    return {
      title,
      options: {
        body,
        icon,
        badge,
        tag: payload.data?.type || 'default',
        requireInteraction: false,
        silent: false,
        data: {
          ...payload.data,
          clickAction,
          timestamp: Date.now()
        },
        actions: [
          {
            action: 'view',
            title: 'View',
            icon: '/assets/view-icon.png'
          },
          {
            action: 'dismiss',
            title: 'Dismiss',
            icon: '/assets/dismiss-icon.png'
          }
        ]
      }
    };
  }
}

// Initialize enterprise manager
const enterpriseManager = new EnterpriseServiceWorkerManager();

// Handle background messages with enterprise logic
messaging.onBackgroundMessage(function(payload) {
  console.log('🏢 [Enterprise FCM SW] Background message received:', payload);

  try {
    // Check if this notification should be shown
    if (!enterpriseManager.shouldShowNotification(payload)) {
      console.log('🚫 [Enterprise FCM SW] Notification suppressed for current user context');
      return;
    }

    // Get notification configuration
    const { title, options } = enterpriseManager.getNotificationOptions(payload);

    console.log('📱 [Enterprise FCM SW] Showing notification:', { title, body: options.body });

    // Show the notification
    return self.registration.showNotification(title, options);

  } catch (error) {
    console.error('❌ [Enterprise FCM SW] Error handling background message:', error);
    
    // Fallback notification
    self.registration.showNotification('New Notification', {
      body: 'You have a new message',
      icon: '/assets/logo.png',
      badge: '/assets/badge.png',
      tag: 'fallback'
    });
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('🖱️ [Enterprise FCM SW] Notification clicked:', event.notification);

  event.notification.close();

  const clickAction = event.notification.data?.clickAction || '/';
  const action = event.action;

  if (action === 'dismiss') {
    console.log('🗑️ [Enterprise FCM SW] Notification dismissed');
    return;
  }

  // Handle notification click
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      console.log('🔍 [Enterprise FCM SW] Found clients:', clientList.length);

      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          console.log('📱 [Enterprise FCM SW] Focusing existing window');
          return client.focus().then(() => {
            // Send message to the client about the notification click
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              data: event.notification.data,
              action: action || 'view'
            });
          });
        }
      }

      // No window found, open new one
      console.log('🆕 [Enterprise FCM SW] Opening new window:', clickAction);
      return clients.openWindow(clickAction);
    })
  );
});

// Handle service worker messages
self.addEventListener('message', function(event) {
  console.log('📨 [Enterprise FCM SW] Message received:', event.data);

  if (event.data?.type === 'GET_STORAGE') {
    // This is handled by the client side - we can't access localStorage directly
    // The client will handle this through a different mechanism
    return;
  }

  if (event.data?.type === 'UPDATE_ACTIVE_USERS') {
    enterpriseManager.loadActiveUsers();
    console.log('🔄 [Enterprise FCM SW] Updated active users');
    return;
  }

  if (event.data?.type === 'TEST_MESSAGE') {
    console.log('🧪 [Enterprise FCM SW] Test message received:', event.data);
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({
        type: 'SW_RESPONSE',
        message: 'Enterprise service worker is working!'
      });
    }
    return;
  }

  if (event.data?.type === 'FCM_DEBUG') {
    console.log('🔍 [Enterprise FCM SW] Debug request');
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({
        type: 'FCM_DEBUG_RESPONSE',
        data: {
          messagingExists: !!messaging,
          onBackgroundMessageRegistered: true,
          activeUsers: enterpriseManager.activeUsers.size,
          swVersion: '2.0.0',
          timestamp: Date.now()
        }
      });
    }
    return;
  }
});

// Service worker activation
self.addEventListener('activate', function(event) {
  console.log('🏢 [Enterprise FCM SW] v2.0.0 activated');
  event.waitUntil(self.clients.claim());
});

// Service worker installation
self.addEventListener('install', function(event) {
  console.log('🏢 [Enterprise FCM SW] v2.0.0 installing...');
  self.skipWaiting();
});

console.log('✅ [Enterprise FCM SW] v2.0.0 loaded successfully');
