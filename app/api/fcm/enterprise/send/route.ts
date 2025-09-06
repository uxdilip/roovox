import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore, adminMessaging } from '@/lib/firebase/admin';

interface EnterpriseSendRequest {
  targetUserId?: string;
  targetUserType?: 'customer' | 'provider' | 'admin';
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  clickAction?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: EnterpriseSendRequest = await request.json();
    const { targetUserId, targetUserType, title, body: messageBody, data = {}, imageUrl, clickAction } = body;

    console.log('🏢 [Enterprise FCM] Send notification request:', {
      targetUserId,
      targetUserType,
      title: title.substring(0, 50)
    });

    const db = adminFirestore;
    const results = {
      successCount: 0,
      failureCount: 0,
      failedTokens: [] as string[],
      sentTo: [] as string[]
    };

    // Get target tokens based on criteria
    let targetTokens: string[] = [];

    if (targetUserId) {
      // Send to specific user across all their devices
      const userDevicesDoc = await db.collection('fcm_user_devices').doc(targetUserId).get();
      if (userDevicesDoc.exists) {
        const userData = userDevicesDoc.data();
        if (userData?.devices) {
          targetTokens = userData.devices.map((device: any) => device.token);
        }
      }
    } else if (targetUserType) {
      // Send to all users of a specific type
      const subscriptionsSnapshot = await db.collection('fcm_user_subscriptions')
        .where('userType', '==', targetUserType)
        .where('status', '==', 'active')
        .get();

      targetTokens = subscriptionsSnapshot.docs.map(doc => doc.data().deviceToken);
    }

    if (targetTokens.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No active devices found for target criteria',
        results
      });
    }

    // Remove duplicates
    targetTokens = [...new Set(targetTokens)];

    console.log(`🎯 [Enterprise FCM] Sending to ${targetTokens.length} devices`);

    // Prepare FCM message
    const fcmMessage = {
      notification: {
        title,
        body: messageBody,
        ...(imageUrl && { imageUrl })
      },
      data: {
        ...data,
        userId: targetUserId || '',
        userType: targetUserType || '',
        timestamp: Date.now().toString(),
        clickAction: clickAction || '/',
        source: 'enterprise-fcm'
      },
      // Configure for both foreground and background
      android: {
        notification: {
          clickAction: clickAction || '/',
          channelId: 'default'
        }
      },
      webpush: {
        fcmOptions: {
          link: clickAction || '/'
        },
        notification: {
          icon: '/assets/logo.png',
          badge: '/assets/badge.png',
          requireInteraction: false,
          tag: `enterprise_${targetUserId || targetUserType}_${Date.now()}`
        }
      }
    };

    // Send to all target tokens
    const sendPromises = targetTokens.map(async (token) => {
      try {
        const response = await adminMessaging.send({
          ...fcmMessage,
          token
        });
        
        results.successCount++;
        results.sentTo.push(token.substring(0, 20) + '...');
        console.log(`✅ [Enterprise FCM] Sent to token: ${token.substring(0, 20)}...`);
        return { token, success: true, messageId: response };
        
      } catch (error: any) {
        results.failureCount++;
        results.failedTokens.push(token);
        console.error(`❌ [Enterprise FCM] Failed to send to token ${token.substring(0, 20)}:`, error.code);
        
        // Remove invalid tokens from database
        if (error.code === 'messaging/registration-token-not-registered' || 
            error.code === 'messaging/invalid-registration-token') {
          await cleanupInvalidToken(token);
        }
        
        return { token, success: false, error: error.code };
      }
    });

    await Promise.all(sendPromises);

    console.log(`📊 [Enterprise FCM] Results: ${results.successCount} success, ${results.failureCount} failed`);

    return NextResponse.json({
      success: results.successCount > 0,
      results,
      message: `Sent to ${results.successCount}/${targetTokens.length} devices`
    });

  } catch (error: any) {
    console.error('❌ [Enterprise FCM] Send failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Enterprise FCM send failed' 
      },
      { status: 500 }
    );
  }
}

// Helper function to cleanup invalid tokens
async function cleanupInvalidToken(token: string) {
  try {
    const db = adminFirestore;
    
    // Find and remove invalid token from user devices
    const subscriptionsSnapshot = await db.collection('fcm_user_subscriptions')
      .where('deviceToken', '==', token)
      .get();

    const batch = db.batch();
    
    subscriptionsSnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { status: 'invalid' });
    });

    // Also remove from user devices arrays
    const userDevicesSnapshot = await db.collection('fcm_user_devices').get();
    
    userDevicesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.devices) {
        const updatedDevices = data.devices.filter((device: any) => device.token !== token);
        if (updatedDevices.length !== data.devices.length) {
          batch.update(doc.ref, { devices: updatedDevices });
        }
      }
    });

    await batch.commit();
    console.log(`🧹 [Enterprise FCM] Cleaned up invalid token: ${token.substring(0, 20)}...`);
    
  } catch (error) {
    console.warn('⚠️ [Enterprise FCM] Failed to cleanup invalid token:', error);
  }
}
