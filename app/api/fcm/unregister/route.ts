import { NextRequest, NextResponse } from 'next/server';
import { fcmTokenService } from '@/lib/services/fcm-token-service';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    // Validate required fields
    if (!token) {
      return NextResponse.json(
        { error: 'Missing required field: token' },
        { status: 400 }
      );
    }

    console.log(`🔕 Unregistering FCM token: ${token.substring(0, 20)}...`);

    // Deactivate FCM token
    const result = await fcmTokenService.deactivateToken(token);

    if (!result.success) {
      console.error('❌ Failed to deactivate FCM token:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to deactivate FCM token' },
        { status: 500 }
      );
    }

    console.log(`✅ FCM token deactivated successfully`);

    return NextResponse.json({
      success: true,
      message: 'FCM token deactivated successfully'
    });

  } catch (error: any) {
    console.error('❌ Error in FCM token deactivation:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
