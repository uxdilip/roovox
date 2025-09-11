import { NextRequest, NextResponse } from 'next/server';
import { FCMTokenService } from '@/lib/services/fcm-token-service';

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

    // TODO: Implement token lookup by FCM token and deactivation
    return NextResponse.json({
      success: true,
      message: 'FCM token unregistration noted'
    });

  } catch (error: any) {
    console.error('❌ Error in FCM token unregistration:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
