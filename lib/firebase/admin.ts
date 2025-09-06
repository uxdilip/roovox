import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';

let adminApp: App;
let adminMessaging: Messaging;

const initializeFirebaseAdmin = () => {
  if (getApps().length > 0) {
    adminApp = getApps()[0];
  } else {
    const firebaseAdminConfig = {
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')!,
      }),
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID!,
    };

    adminApp = initializeApp(firebaseAdminConfig);
  }

  adminMessaging = getMessaging(adminApp);
  return { adminApp, adminMessaging };
};

// Initialize once
const { adminApp: app, adminMessaging: messaging } = initializeFirebaseAdmin();

export { app as adminApp, messaging as adminMessaging };
export default { adminApp: app, adminMessaging: messaging };
