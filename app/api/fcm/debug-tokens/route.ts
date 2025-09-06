import { NextRequest, NextResponse } from 'next/server';
import { fcmTokenService } from '@/lib/services/fcm-token-service';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const userType = url.searchParams.get('userType');

    if (!userId || !userType) {
      return NextResponse.json(
        { error: 'Missing userId or userType parameters' },
        { status: 400 }
      );
    }

    console.log(`🔍 [DEBUG] Checking tokens for ${userType} ${userId}`);

    // Get user's active FCM tokens
    const tokens = await fcmTokenService.getActiveTokens(userId, userType as any);

    return NextResponse.json({
      success: true,
      userId,
      userType,
      tokenCount: tokens.length,
      tokens: tokens.map(token => ({
        tokenId: token.token.substring(0, 20) + '...',
        deviceInfo: token.deviceInfo,
        isActive: token.isActive,
        createdAt: token.createdAt,
        updatedAt: token.updatedAt
      })),
      fullTokens: process.env.NODE_ENV === 'development' ? tokens : undefined
    });

  } catch (error: any) {
    console.error('❌ Error in debug tokens API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
