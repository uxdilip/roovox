import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore, adminMessaging } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

interface EnterpriseRegistrationRequest {
  deviceToken: {
    token: string;
    deviceId: string;
    browser: string;
    platform: string;
    userAgent: string;
    registeredAt: string;
  };
  userSubscription: {
    userId: string;
    userType: 'customer' | 'provider' | 'admin';
    email?: string;
    name?: string;
    activeSessionId: string;
    lastActive: string;
  };
  topics: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: EnterpriseRegistrationRequest = await request.json();
    const { deviceToken, userSubscription, topics } = body;

    console.log('🏢 [Enterprise FCM] Registration request:', {
      deviceId: deviceToken.deviceId,
      userId: userSubscription.userId,
      userType: userSubscription.userType,
      topics: topics.length
    });

    // Ensure Firebase admin is available - critical for production
    if (!adminFirestore || !adminMessaging) {
      console.error('🔥 [Enterprise FCM] Firebase admin not initialized - this is a critical error in production');
      return NextResponse.json({
        success: false,
        error: 'Firebase services not available',
        code: 'FIREBASE_UNAVAILABLE'
      }, { status: 503 }); // Service Unavailable
    }

    const db = adminFirestore;
    const messaging = adminMessaging;

    // Start a batch operation for atomic writes
    const batch = db.batch();

    // 1. Store/update device token with enhanced metadata
    const deviceRef = db.collection('fcm_devices').doc(deviceToken.deviceId);
    batch.set(deviceRef, {
      ...deviceToken,
      updatedAt: new Date().toISOString(),
      status: 'active',
      lastValidated: new Date().toISOString()
    }, { merge: true });

    // 2. Store user subscription on this device
    const subscriptionRef = db.collection('fcm_user_subscriptions').doc(`${deviceToken.deviceId}_${userSubscription.userId}`);
    batch.set(subscriptionRef, {
      ...userSubscription,
      deviceId: deviceToken.deviceId,
      deviceToken: deviceToken.token,
      subscribedAt: new Date().toISOString(),
      status: 'active',
      lastActivity: new Date().toISOString()
    }, { merge: true });

    // 3. Subscribe to topics with error handling
    const topicResults: { topic: string; success: boolean; error?: string }[] = [];
    
    if (topics.length > 0) {
      for (const topic of topics) {
        try {
          await messaging.subscribeToTopic([deviceToken.token], topic);
          topicResults.push({ topic, success: true });
          console.log(`✅ [Enterprise FCM] Subscribed to topic: ${topic}`);
        } catch (topicError: any) {
          console.warn(`⚠️ [Enterprise FCM] Topic subscription failed for ${topic}:`, topicError.message);
          topicResults.push({ topic, success: false, error: topicError.message });
        }
      }
    }

    // 4. Store user-device mapping for quick lookups
    const userDeviceRef = db.collection('fcm_user_devices').doc(userSubscription.userId);
    batch.set(userDeviceRef, {
      userId: userSubscription.userId,
      userType: userSubscription.userType,
      devices: FieldValue.arrayUnion({
        deviceId: deviceToken.deviceId,
        token: deviceToken.token,
        browser: deviceToken.browser,
        platform: deviceToken.platform,
        lastActive: userSubscription.lastActive,
        sessionId: userSubscription.activeSessionId,
        registeredAt: new Date().toISOString()
      }),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // Commit the batch operation
    await batch.commit();

    console.log(`✅ [Enterprise FCM] User ${userSubscription.userType} ${userSubscription.userId} registered on device ${deviceToken.deviceId}`);

    return NextResponse.json({
      success: true,
      deviceId: deviceToken.deviceId,
      subscriptions: topicResults,
      method: 'firebase_production',
      message: 'Enterprise FCM registration successful',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ [Enterprise FCM] Registration failed:', error);
    
    // Handle specific Firebase errors
    if (error.code === 5 || error.message.includes('Cloud Firestore API has not been used')) {
      return NextResponse.json({
        success: false,
        error: 'Firestore API is not properly enabled',
        code: 'FIRESTORE_API_DISABLED',
        helpUrl: 'https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=sniket-d2766'
      }, { status: 503 });
    }

    // Handle messaging API errors
    if (error.message.includes('messaging')) {
      return NextResponse.json({
        success: false,
        error: 'Firebase Cloud Messaging error',
        code: 'FCM_ERROR',
        details: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: false, 
      error: error.message || 'Enterprise FCM registration failed',
      code: error.code || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
