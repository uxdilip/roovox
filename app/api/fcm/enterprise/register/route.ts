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

    const db = adminFirestore;
    const batch = db.batch();

    // 1. Store/update device token
    const deviceRef = db.collection('fcm_devices').doc(deviceToken.deviceId);
    batch.set(deviceRef, {
      ...deviceToken,
      updatedAt: new Date().toISOString(),
      status: 'active'
    }, { merge: true });

    // 2. Store user subscription on this device
    const subscriptionRef = db.collection('fcm_user_subscriptions').doc(`${deviceToken.deviceId}_${userSubscription.userId}`);
    batch.set(subscriptionRef, {
      ...userSubscription,
      deviceId: deviceToken.deviceId,
      deviceToken: deviceToken.token,
      subscribedAt: new Date().toISOString(),
      status: 'active'
    }, { merge: true });

    // 3. Subscribe to topics
    if (topics.length > 0) {
      try {
        for (const topic of topics) {
          await adminMessaging.subscribeToTopic([deviceToken.token], topic);
        }
        console.log(`✅ [Enterprise FCM] Subscribed to topics: ${topics.join(', ')}`);
      } catch (topicError) {
        console.warn('⚠️ [Enterprise FCM] Topic subscription failed:', topicError);
        // Don't fail the entire registration for topic errors
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
        sessionId: userSubscription.activeSessionId
      }),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    await batch.commit();

    console.log(`✅ [Enterprise FCM] User ${userSubscription.userType} ${userSubscription.userId} registered on device ${deviceToken.deviceId}`);

    return NextResponse.json({
      success: true,
      deviceId: deviceToken.deviceId,
      subscriptions: topics,
      message: 'Enterprise FCM registration successful'
    });

  } catch (error: any) {
    console.error('❌ [Enterprise FCM] Registration failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Enterprise FCM registration failed' 
      },
      { status: 500 }
    );
  }
}
