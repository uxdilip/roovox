import { NextRequest, NextResponse } from 'next/server';
import { sendDataOnlyPushNotification } from '@/lib/firebase/push-service';

export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      userType, 
      title, 
      body, 
      data, 
      action, 
      imageUrl, 
      priority 
    } = await request.json();

    // Validate required fields
    if (!userId || !userType || !title || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, userType, title, body' },
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

    console.log(`🔔 Sending data-only push notification to ${userType} ${userId}`);

    const result = await sendDataOnlyPushNotification({
      userId,
      userType,
      title,
      body,
      data,
      action,
      imageUrl,
      priority: priority || 'normal'
    });

    return NextResponse.json({
      success: result.success,
      successCount: result.successCount,
      failureCount: result.failureCount,
      failedTokens: result.failedTokens,
      error: result.error,
      reason: result.reason
    });

  } catch (error: any) {
    console.error('❌ Error in send data-only notification API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
