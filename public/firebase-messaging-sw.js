// Import Firebase scripts for compatibility version
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');


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

    // Enhanced notification content
    const notificationType = payload.data?.type || 'system';
    const notificationTitle = getEnhancedTitle(payload.data);
    const notificationBody = getEnhancedBody(payload.data);

    // Debug logging to see what we're actually receiving
    console.log('[SW] Enhanced notification payload:', {
      type: notificationType,
      title: notificationTitle,
      body: notificationBody,
      originalData: payload.data
    });

    const notificationOptions = {
      body: notificationBody,
      icon: getNotificationIcon(notificationType),
      badge: '/assets/badge.png',
      tag: `${notificationType}_${payload.data?.id || 'unknown'}_${targetUserId || 'unknown'}`,
      requireInteraction: payload.data?.priority === 'high',
      dir: 'ltr',
      lang: 'en',
      renotify: true,
      data: {
        clickAction: getClickAction(payload.data),
        type: notificationType,
        id: payload.data?.id || '',
        userId: payload.data?.userId || '',
        userType: payload.data?.userType || '',
        conversationId: payload.data?.relatedId || ''
      },
      actions: getNotificationActions(notificationType),
      vibrate: getVibrationPattern(notificationType),
      timestamp: Date.now(),
      silent: false
    };

    // Add image if available
    const imageUrl = getNotificationImage(payload.data);
    if (imageUrl) {
      notificationOptions.image = imageUrl;
    }

    const showPromise = self.registration.showNotification(notificationTitle, notificationOptions);
    showPromise.catch(err => {
      console.error('[SW] showNotification failed:', err);
    });

    return showPromise;
  } catch (error) {
    console.error('[SW] Error in onBackgroundMessage:', error);
    // Still try to show a basic notification
    return self.registration.showNotification('Sniket', {
      body: 'You have a new notification',
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
        { action: 'view', title: 'View Booking' },
        { action: 'dismiss', title: 'Dismiss' }
      ];
    case 'message':
      return [
        { action: 'reply', title: 'Reply' },
        { action: 'view', title: 'View Chat' },
        { action: 'dismiss', title: 'Dismiss' }
      ];
    case 'payment':
      return [
        { action: 'view', title: 'View Payment' },
        { action: 'dismiss', title: 'Dismiss' }
      ];
    default:
      return [
        { action: 'view', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' }
      ];
  }
}

// Enhanced title generation based on notification type
function getEnhancedTitle(data) {
  const type = data?.type || 'system';

  switch (type) {
    case 'chat':
    case 'message':
      const senderName = data?.senderName || 'Someone';
      return `Message from ${senderName}`;

    case 'booking':
      return 'Booking Update';

    case 'payment':
      return 'Payment Notification';

    case 'provider_verification':
      return 'Provider Verification';

    case 'quote_request':
      return 'Quote Request';

    case 'service_update':
      return 'Service Update';

    case 'system':
    default:
      return 'Sniket Notification';
  }
}

// Enhanced body generation with rich content
function getEnhancedBody(data) {
  const type = data?.type || 'system';

  switch (type) {
    case 'chat':
    case 'message':
      const messageContent = data?.messageContent || data?.notificationBody || 'New message received';
      const isLongMessage = messageContent.length > 50;
      return isLongMessage ? messageContent.substring(0, 50) + '...' : messageContent;

    case 'booking':
      const bookingStatus = data?.bookingStatus || 'updated';
      return `Your booking has been ${bookingStatus}. Tap to view details.`;

    case 'payment':
      const amount = data?.amount || 'amount';
      return `Payment of ₹${amount} processed successfully.`;

    case 'provider_verification':
      return 'Your provider application has been reviewed. Check status.';

    case 'quote_request':
      const deviceType = data?.deviceType || 'device';
      return `New quote request for ${deviceType} repair.`;

    case 'service_update':
      const serviceStatus = data?.serviceStatus || 'updated';
      return `Service status: ${serviceStatus}. View progress.`;

    case 'system':
    default:
      return data?.notificationBody || 'You have a new notification from Sniket.';
  }
}

// Get notification icon based on type
function getNotificationIcon(type) {
  switch (type) {
    case 'chat':
    case 'message':
      return '/assets/chat-icon.png';
    case 'booking':
      return '/assets/booking-icon.png';
    case 'payment':
      return '/assets/payment-icon.png';
    case 'provider_verification':
      return '/assets/verification-icon.png';
    case 'quote_request':
      return '/assets/quote-icon.png';
    case 'service_update':
      return '/assets/service-icon.png';
    default:
      return '/assets/logo.png';
  }
}

// Get notification image for rich display
function getNotificationImage(data) {
  if (data?.notificationImage) return data.notificationImage;
  if (data?.userAvatar) return data.userAvatar;
  return null;
}

// Get click action URL based on notification type
function getClickAction(data) {
  const type = data?.type || 'system';

  switch (type) {
    case 'chat':
    case 'message':
      const conversationId = data?.relatedId || data?.conversationId;
      return conversationId ? `/chat/${conversationId}` : '/chat';

    case 'booking':
      const bookingId = data?.relatedId || data?.bookingId;
      return bookingId ? `/booking/${bookingId}` : '/bookings';

    case 'payment':
      return '/payments';

    case 'provider_verification':
      return '/provider/profile';

    case 'quote_request':
      const quoteId = data?.relatedId || data?.quoteId;
      return quoteId ? `/quotes/${quoteId}` : '/quotes';

    case 'service_update':
      const serviceId = data?.relatedId || data?.serviceId;
      return serviceId ? `/service/${serviceId}` : '/services';

    default:
      return '/';
  }
}

// Get vibration pattern based on type
function getVibrationPattern(type) {
  switch (type) {
    case 'chat':
    case 'message':
      return [100, 50, 100]; // Quick double tap

    case 'booking':
    case 'payment':
      return [200, 100, 200, 100, 200]; // Triple tap for important

    case 'provider_verification':
    case 'quote_request':
      return [300, 200, 300]; // Longer for business notifications

    default:
      return [200, 100, 200]; // Standard pattern
  }
}
