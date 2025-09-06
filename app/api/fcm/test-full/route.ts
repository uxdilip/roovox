import { NextRequest, NextResponse } from 'next/server';
import { sendPushNotification } from '@/lib/firebase/push-service';

export async function POST(request: NextRequest) {
  try {
    const { 
      title, 
      body, 
      userType, 
      userId, 
      type, 
      priority, 
      image 
    } = await request.json();

    // Validate required fields
    if (!title || !body || !userId || !userType) {
      return NextResponse.json(
        { error: 'Missing required fields: title, body, userId, userType' },
        { status: 400 }
      );
    }

    // Send notification using the existing service
    const result = await sendPushNotification({
      userId,
      userType: userType as 'customer' | 'provider' | 'admin',
      title,
      body,
      data: {
        test: 'true',
        timestamp: new Date().toISOString()
      },
      action: {
        type: (type || 'system') as 'booking' | 'message' | 'payment' | 'system',
        id: `test-${Date.now()}`
      },
      imageUrl: image,
      priority: (priority || 'normal') as 'normal' | 'high'
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Notification sent successfully',
        successCount: result.successCount,
        failureCount: result.failureCount,
        ...(result.failedTokens && { failedTokens: result.failedTokens })
      });
    } else {
      return NextResponse.json(
        { 
          error: 'Failed to send notification',
          reason: result.reason,
          details: result.error 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Full flow test error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
