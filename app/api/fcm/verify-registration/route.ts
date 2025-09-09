import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { userId, userType } = await request.json();

    if (!userId || !userType) {
      return NextResponse.json(
        { error: 'Missing userId or userType' },
        { status: 400 }
      );
    }

    console.log(`🔍 [FCM Verify] Starting verification for ${userType} ${userId}`);

    // Ensure Firebase admin is available
    if (!adminFirestore) {
      console.error('🔥 [FCM Verify] Firebase admin not initialized - this is a critical error in production');
      return NextResponse.json({
        error: 'Firebase services not available',
        code: 'FIREBASE_UNAVAILABLE'
      }, { status: 503 }); // Service Unavailable
    }

    console.log(`🔍 [FCM Verify] Firebase admin available, checking database for ${userType} ${userId}`);

    // Query the user subscriptions collection - this is where active registrations are stored
    const subscriptionsQuery = adminFirestore
      .collection('fcm_user_subscriptions')
      .where('userId', '==', userId)
      .where('userType', '==', userType)
      .where('status', '==', 'active')
      .limit(5); // Get up to 5 active subscriptions

    const subscriptionsSnapshot = await subscriptionsQuery.get();
    const hasActiveSubscriptions = !subscriptionsSnapshot.empty;

    // Also verify devices are still active by checking a few subscription docs
    let hasValidDevices = false;
    if (hasActiveSubscriptions) {
      const subscriptions = subscriptionsSnapshot.docs.map(doc => doc.data());
      const deviceIds = subscriptions.map(sub => sub.deviceId).slice(0, 3); // Check first 3 devices
      
      if (deviceIds.length > 0) {
        const deviceChecks = await Promise.all(
          deviceIds.map(async (deviceId) => {
            try {
              const deviceDoc = await adminFirestore!.collection('fcm_devices').doc(deviceId).get();
              return deviceDoc.exists && deviceDoc.data()?.status === 'active';
            } catch (error) {
              console.warn(`⚠️ [FCM Verify] Could not check device ${deviceId}:`, error);
              return false;
            }
          })
        );
        hasValidDevices = deviceChecks.some(isValid => isValid);
      }
    }

    const registrationExists = hasActiveSubscriptions && hasValidDevices;

    console.log(`✅ [FCM Verify] Database check completed for ${userType} ${userId}:`, {
      hasActiveSubscriptions,
      hasValidDevices,
      registrationExists
    });

    return NextResponse.json({
      exists: registrationExists,
      hasActiveSubscriptions,
      hasValidDevices,
      shouldReRegister: !registrationExists,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ [FCM Verify] Database verification failed:', {
      error: error.message,
      stack: error.stack,
      code: error.code
    });
    
    // Check for specific Firestore errors
    if (error.code === 5 || error.message.includes('Cloud Firestore API has not been used')) {
      return NextResponse.json({
        error: 'Firestore API is not properly enabled',
        code: 'FIRESTORE_API_DISABLED',
        helpUrl: 'https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=sniket-d2766'
      }, { status: 503 });
    }
    
    // For other errors, return 500
    return NextResponse.json({
      error: 'Database verification failed',
      code: 'DATABASE_ERROR',
      details: error.message
    }, { status: 500 });
  }
}
