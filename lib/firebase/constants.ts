/**
 * Firebase Constants - Deployment-Safe Configuration
 * Client-side configs are safe to hardcode, server-side uses env vars
 */

// ✅ SAFE: Client-side Firebase config (these are meant to be public)
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCF_hn_33xTJaO-zwXGNxhVc9yJqjXfXD0",
  authDomain: "sniket-d2766.firebaseapp.com",
  projectId: "sniket-d2766",
  storageBucket: "sniket-d2766.firebasestorage.app",
  messagingSenderId: "968429297305",
  appId: "1:968429297305:web:7425601aff7e7d08b52208",
  measurementId: "G-V3D17BJYZ9"
} as const;

// ✅ SAFE: VAPID key (meant to be public for client-side token generation)
export const FIREBASE_VAPID_KEY = "BPvZrQ45V7X76Nne0Rg8NPT6qZddSBuBIyiUMz5kWbESCsjFscomEmC5cs2StnCdSpu8Y5AKnyrpDwKEqvSOnz0";

// 🔒 SECURE: Server-side admin config (uses environment variables)
export const getFirebaseAdminConfig = () => {
  // Only available on server-side
  if (typeof window !== 'undefined') {
    throw new Error('Firebase Admin config should only be accessed on server-side');
  }
  
  return {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
  };
};

// Collections (safe to expose)
export const FIREBASE_COLLECTIONS = {
  FCM_USER_SUBSCRIPTIONS: 'fcm_user_subscriptions',
  FCM_DEVICES: 'fcm_devices',
  FCM_DELIVERY_LOGS: 'fcm_delivery_logs',
  FCM_USER_PREFERENCES: 'fcm_user_preferences'
} as const;

// Client-side VAPID key alias
export const FCM_VAPID_KEY = FIREBASE_VAPID_KEY;
