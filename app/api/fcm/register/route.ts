import { NextRequest, NextResponse } from 'next/server';
import { FCMTokenService } from '@/lib/services/fcm-token-service';

export async function POST(request: NextRequest) {
  try {
    const { userId, userType, token, deviceId, deviceInfo } = await request.json();

    // Validate required fields
    if (!userId || !userType || !token) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, userType, token' },
        { status: 400 }
      );
    }

    // Validate userType
    if (!['customer', 'provider', 'admin', 'technician'].includes(userType)) {
      return NextResponse.json(
        { error: 'Invalid userType. Must be customer, provider, admin, or technician' },
        { status: 400 }
      );
    }

    // Save FCM token to database (with automatic cleanup of old tokens)
    const result = await FCMTokenService.saveToken({
      userId,
      userType,
      token,
      deviceId: deviceId || `fallback_${Date.now()}`,
      deviceInfo: deviceInfo || {
        platform: 'unknown',
        browser: 'unknown',
        userAgent: 'unknown'
      }
    });

    return NextResponse.json({
      success: true,
      tokenId: result.$id,
      deviceId: deviceId,
      message: 'FCM token registered successfully'
    });

  } catch (error: any) {
    console.error('❌ Error in FCM token registration:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
