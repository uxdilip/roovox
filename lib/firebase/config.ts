import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';
import { FIREBASE_CONFIG } from './constants';

// Initialize Firebase app only once
export const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApps()[0];

// Get messaging instance only in browser environment
export const getMessagingInstance = async () => {
  if (typeof window === 'undefined') {
    console.log('🚫 [Firebase Config] Server-side environment, skipping messaging');
    return null;
  }
  
  try {
    console.log('🔍 [Firebase Config] Checking browser support...');
    const supported = await isSupported();
    console.log('🔍 [Firebase Config] Browser support result:', supported);
    
    if (supported) {
      const messaging = getMessaging(app);
      console.log('✅ [Firebase Config] Messaging instance created successfully');
      return messaging;
    } else {
      console.warn('❌ [Firebase Config] Browser does not support messaging');
      return null;
    }
  } catch (error) {
    console.error('❌ [Firebase Config] Error getting messaging instance:', error);
    return null;
  }
};

export default app;
