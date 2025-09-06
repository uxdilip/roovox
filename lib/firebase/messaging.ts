import { getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { getMessagingInstance } from './config';

export interface NotificationPermissionResult {
  granted: boolean;
  token?: string;
  error?: string;
}

/**
 * Request notification permission and get FCM token
 */
export const requestNotificationPermission = async (): Promise<NotificationPermissionResult> => {
  try {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      return {
        granted: false,
        error: 'This browser does not support notifications'
      };
    }

    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
      return {
        granted: false,
        error: 'This browser does not support service workers'
      };
    }

    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      return {
        granted: false,
        error: 'Notification permission denied'
      };
    }

    return { granted: true };
  } catch (error: any) {
    console.error('Error requesting notification permission:', error);
    return {
      granted: false,
      error: error.message
    };
  }
};

/**
 * Register FCM token for push notifications
 */
export const registerFCMToken = async (userId: string, userType: 'customer' | 'provider' | 'admin'): Promise<{ success: boolean; token?: string; error?: string }> => {
  try {
    // Check existing permission to avoid extra prompt
    let permissionState: NotificationPermission = 'default';
    if (typeof window !== 'undefined' && 'Notification' in window) {
      permissionState = Notification.permission;
    }

    if (permissionState !== 'granted') {
      const permissionResult = await requestNotificationPermission();
      if (!permissionResult.granted) {
        return {
          success: false,
          error: permissionResult.error
        };
      }
    }

    // Register service worker (let it use default scope)
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    console.log('Service Worker registered successfully:', registration);

    // Get messaging instance
    const messaging = await getMessagingInstance();
    if (!messaging) {
      return {
        success: false,
        error: 'Firebase messaging not supported'
      };
    }

    // Get FCM token
  const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (!token) {
      return {
        success: false,
        error: 'Failed to get FCM token'
      };
    }

    // Save token to database
    const response = await fetch('/api/fcm/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        userType,
        token,
        deviceInfo: {
          platform: navigator.platform,
          browser: getBrowserInfo(),
          userAgent: navigator.userAgent
        }
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to register token');
    }

    console.log('✅ FCM token registered successfully:', token.substring(0, 20) + '...');
    
    return {
      success: true,
      token
    };

  } catch (error: any) {
  console.error('❌ Error registering FCM token:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Setup foreground message listener
 */
export const setupForegroundMessageListener = (
  onMessageReceived: (payload: MessagePayload) => void
) => {
  return new Promise<() => void>(async (resolve) => {
    try {
      const messaging = await getMessagingInstance();
      if (!messaging) {
        console.warn('Firebase messaging not supported');
        resolve(() => {});
        return;
      }

      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('📱 Foreground message received:', payload);
        onMessageReceived(payload);
      });

      resolve(unsubscribe);
    } catch (error) {
      console.error('Error setting up foreground message listener:', error);
      resolve(() => {});
    }
  });
};

/**
 * Unregister FCM token
 */
export const unregisterFCMToken = async (token: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch('/api/fcm/unregister', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to unregister token');
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error unregistering FCM token:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get browser information
 */
const getBrowserInfo = (): string => {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  
  return 'Unknown';
};

/**
 * Test service worker communication
 */
export const testServiceWorkerCommunication = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!('serviceWorker' in navigator)) {
      return { success: false, error: 'Service Worker not supported' };
    }

    const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    if (!registration) {
      return { success: false, error: 'Service Worker not registered' };
    }

    // Check if service worker is active
    if (!registration.active) {
      return { success: false, error: 'Service Worker not active' };
    }

    const activeServiceWorker = registration.active;

    // Test message communication
    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        console.log('📨 Response from SW:', event.data);
        if (event.data?.type === 'SW_RESPONSE') {
          resolve({ success: true });
        } else {
          resolve({ success: false, error: 'Unexpected response from SW' });
        }
      };

      // Send test message to service worker
      activeServiceWorker.postMessage(
        { type: 'TEST_MESSAGE', timestamp: Date.now() },
        [messageChannel.port2]
      );

      // Timeout after 5 seconds
      setTimeout(() => {
        resolve({ success: false, error: 'Service Worker communication timeout' });
      }, 5000);
    });

  } catch (error: any) {
    console.error('Error testing service worker communication:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if FCM is supported
 */
export const isFCMSupported = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  
  try {
    const messaging = await getMessagingInstance();
    return messaging !== null;
  } catch {
    return false;
  }
};
