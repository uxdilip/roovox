import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { oldToken, deviceId, userId } = await request.json();

    if (!oldToken) {
      return NextResponse.json(
        { error: 'Missing oldToken' },
        { status: 400 }
      );
    }

    console.log('🧹 [FCM Cleanup] Processing token cleanup request:', {
      tokenPrefix: oldToken.substring(0, 20) + '...',
      deviceId,
      userId
    });

    // Ensure Firebase admin is available
    if (!adminFirestore) {
      console.error('🔥 [FCM Cleanup] Firebase admin not initialized');
      return NextResponse.json({
        error: 'Firebase services not available',
        code: 'FIREBASE_UNAVAILABLE'
      }, { status: 503 });
    }

    const db = adminFirestore;
    const batch = db.batch();

    // 1. Find and deactivate tokens matching the old token
    const tokensQuery = db.collection('fcm_devices')
      .where('token', '==', oldToken);
    
    const tokensSnapshot = await tokensQuery.get();
    
    tokensSnapshot.forEach(doc => {
      const tokenRef = db.collection('fcm_devices').doc(doc.id);
      batch.update(tokenRef, {
        status: 'inactive',
        deactivatedAt: new Date().toISOString(),
        reason: 'token_refresh'
      });
    });

    // 2. Update user subscriptions that reference this token
    if (deviceId && userId) {
      const subscriptionRef = db.collection('fcm_user_subscriptions').doc(`${deviceId}_${userId}`);
      batch.update(subscriptionRef, {
        status: 'token_refreshed',
        oldToken: oldToken,
        updatedAt: new Date().toISOString()
      });
    }

    // 3. Log the cleanup for analytics
    const cleanupLogRef = db.collection('fcm_cleanup_logs').doc();
    batch.set(cleanupLogRef, {
      oldToken: oldToken.substring(0, 20) + '...', // Store partial token for privacy
      deviceId: deviceId || 'unknown',
      userId: userId || 'unknown',
      cleanedAt: new Date().toISOString(),
      reason: 'token_refresh'
    });

    await batch.commit();

    console.log('✅ [FCM Cleanup] Token cleanup completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Token cleanup completed',
      deactivatedTokens: tokensSnapshot.size,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ [FCM Cleanup] Token cleanup failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Token cleanup failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
