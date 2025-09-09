import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getFirebaseAdminConfig } from './constants';

let adminApp: App;
let adminMessaging: Messaging;
let adminFirestore: Firestore;

const initializeFirebaseAdmin = () => {
  // Skip initialization if we're in browser environment
  if (typeof window !== 'undefined') {
    return { adminApp: null, adminMessaging: null, adminFirestore: null };
  }

  if (getApps().length > 0) {
    adminApp = getApps()[0];
  } else {
    try {
      const adminConfig = getFirebaseAdminConfig();
      
      if (!adminConfig.projectId || !adminConfig.clientEmail || !adminConfig.privateKey) {
        throw new Error('Missing Firebase Admin environment variables. Please check FIREBASE_ADMIN_* variables in .env.local');
      }
      
      adminApp = initializeApp({
        credential: cert(adminConfig),
        projectId: adminConfig.projectId,
      });
      console.log('🔥 Firebase Admin initialized successfully');
    } catch (error) {
      console.error('🔥 Failed to initialize Firebase admin:', error);
      return { adminApp: null, adminMessaging: null, adminFirestore: null };
    }
  }

  try {
    adminMessaging = getMessaging(adminApp);
    adminFirestore = getFirestore(adminApp);
  } catch (error) {
    console.error('🔥 Failed to get Firebase services:', error);
    return { adminApp: null, adminMessaging: null, adminFirestore: null };
  }

  return { adminApp, adminMessaging, adminFirestore };
};

// Initialize once
const firebaseAdmin = initializeFirebaseAdmin();
const { adminApp: app, adminMessaging: messaging, adminFirestore: firestore } = firebaseAdmin;

export { app as adminApp, messaging as adminMessaging, firestore as adminFirestore };
export default { adminApp: app, adminMessaging: messaging, adminFirestore: firestore };
