// Initialize Firestore Collections for FCM
// Run this once after creating the database

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Initialize Firebase Admin if not already initialized
if (getApps().length === 0) {
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
    private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_ADMIN_CLIENT_EMAIL}`
  };

  initializeApp({
    credential: cert(serviceAccount as any),
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  });
}

const db = getFirestore();

async function initializeCollections() {
  try {
    console.log('🚀 Initializing Firestore collections...');

    // Initialize fcm_devices collection
    const devicesRef = db.collection('fcm_devices');
    await devicesRef.doc('_init').set({
      initialized: true,
      createdAt: new Date(),
      description: 'Collection for FCM device tokens and metadata'
    });
    console.log('✅ fcm_devices collection initialized');

    // Initialize fcm_user_subscriptions collection
    const subscriptionsRef = db.collection('fcm_user_subscriptions');
    await subscriptionsRef.doc('_init').set({
      initialized: true,
      createdAt: new Date(),
      description: 'Collection for user subscription preferences'
    });
    console.log('✅ fcm_user_subscriptions collection initialized');

    // Initialize fcm_topics collection
    const topicsRef = db.collection('fcm_topics');
    await topicsRef.doc('_init').set({
      initialized: true,
      createdAt: new Date(),
      description: 'Collection for FCM topic management'
    });
    console.log('✅ fcm_topics collection initialized');

    // Initialize fcm_analytics collection
    const analyticsRef = db.collection('fcm_analytics');
    await analyticsRef.doc('_init').set({
      initialized: true,
      createdAt: new Date(),
      description: 'Collection for FCM analytics and metrics'
    });
    console.log('✅ fcm_analytics collection initialized');

    // Initialize fcm_health collection
    const healthRef = db.collection('fcm_health');
    await healthRef.doc('_init').set({
      initialized: true,
      createdAt: new Date(),
      description: 'Collection for FCM health monitoring'
    });
    console.log('✅ fcm_health collection initialized');

    console.log('🎉 All Firestore collections initialized successfully!');
    
    // Test a simple query to verify everything works
    const testDoc = await devicesRef.doc('_init').get();
    if (testDoc.exists) {
      console.log('✅ Database connectivity verified');
    }

  } catch (error) {
    console.error('❌ Error initializing collections:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeCollections()
  .then(() => {
    console.log('✅ Initialization complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  });
