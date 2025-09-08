import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminApp: App;
let adminMessaging: Messaging;
let adminFirestore: Firestore;

const initializeFirebaseAdmin = () => {
  // Skip initialization during build time or if environment is not properly configured
  if (typeof window === 'undefined' && (
    !process.env.FIREBASE_ADMIN_PROJECT_ID || 
    !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || 
    !process.env.FIREBASE_ADMIN_PRIVATE_KEY ||
    process.env.NODE_ENV === 'development' && !process.env.FIREBASE_ADMIN_PROJECT_ID
  )) {
    console.log('🔥 Firebase admin initialization skipped - missing environment variables or build time');
    return { adminApp: null, adminMessaging: null, adminFirestore: null };
  }

  if (getApps().length > 0) {
    adminApp = getApps()[0];
  } else {
    try {
      const firebaseAdminConfig = {
        credential: cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')!,
        }),
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
      };

      adminApp = initializeApp(firebaseAdminConfig);
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

// Initialize once - with null check for build time
const firebaseAdmin = initializeFirebaseAdmin();
const { adminApp: app, adminMessaging: messaging, adminFirestore: firestore } = firebaseAdmin;

export { app as adminApp, messaging as adminMessaging, firestore as adminFirestore };
export default { adminApp: app, adminMessaging: messaging, adminFirestore: firestore };
