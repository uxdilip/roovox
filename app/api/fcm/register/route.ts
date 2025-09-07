import { NextRequest, NextResponse } from 'next/server';
import { fcmTokenService } from '@/lib/services/fcm-token-service';

export async function POST(request: NextRequest) {
  try {
    const { userId, userType, token, deviceInfo } = await request.json();

    // Validate required fields
    if (!userId || !userType || !token) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, userType, token' },
        { status: 400 }
      );
    }

    // Validate userType
    if (!['customer', 'provider', 'admin'].includes(userType)) {
      return NextResponse.json(
        { error: 'Invalid userType. Must be customer, provider, or admin' },
        { status: 400 }
      );
    }

    console.log(`🔔 Registering FCM token for ${userType} ${userId}`);

    // Save FCM token to database
    const result = await fcmTokenService.saveToken({
      userId,
      userType,
      token,
      deviceInfo: deviceInfo || {
        platform: 'unknown',
        browser: 'unknown',
        userAgent: 'unknown'
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    if (!result.success) {
      console.error('❌ Failed to save FCM token:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to save FCM token' },
        { status: 500 }
      );
    }

    console.log(`✅ FCM token registered successfully: ${result.tokenId}`);

    return NextResponse.json({
      success: true,
      tokenId: result.tokenId,
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
