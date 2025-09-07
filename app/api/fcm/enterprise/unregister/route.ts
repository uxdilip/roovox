import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore, adminMessaging } from '@/lib/firebase/admin';

interface EnterpriseUnregisterRequest {
  deviceId: string;
  userId: string;
  token?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: EnterpriseUnregisterRequest = await request.json();
    const { deviceId, userId, token } = body;

    console.log('🏢 [Enterprise FCM] Unregister request:', { deviceId, userId });

    const db = adminFirestore;
    const messaging = adminMessaging;
    
    if (!db || !messaging) {
      return NextResponse.json(
        { error: 'Firebase admin not initialized' },
        { status: 500 }
      );
    }

    const batch = db.batch();

    // 1. Mark user subscription as inactive
    const subscriptionRef = db.collection('fcm_user_subscriptions').doc(`${deviceId}_${userId}`);
    batch.update(subscriptionRef, { 
      status: 'inactive',
      unregisteredAt: new Date().toISOString()
    });

    // 2. Remove user from device's user list
    const userDeviceRef = db.collection('fcm_user_devices').doc(userId);
    const userDeviceDoc = await userDeviceRef.get();
    
    if (userDeviceDoc.exists) {
      const data = userDeviceDoc.data();
      if (data?.devices) {
        const updatedDevices = data.devices.filter((device: any) => device.deviceId !== deviceId);
        batch.update(userDeviceRef, { 
          devices: updatedDevices,
          updatedAt: new Date().toISOString()
        });
      }
    }

    await batch.commit();

    console.log(`✅ [Enterprise FCM] User ${userId} unregistered from device ${deviceId}`);

    return NextResponse.json({
      success: true,
      message: 'Enterprise FCM unregistration successful'
    });

  } catch (error: any) {
    console.error('❌ [Enterprise FCM] Unregister failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Enterprise FCM unregistration failed' 
      },
      { status: 500 }
    );
  }
}
