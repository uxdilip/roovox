import { NextRequest, NextResponse } from 'next/server';
import { sendPushNotification, sendBulkPushNotifications } from '@/lib/firebase/push-service';

export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      userType, 
      users, // For bulk notifications
      title, 
      body, 
      data, 
      action, 
      imageUrl, 
      priority 
    } = await request.json();

    // Validate required fields
    if (!title || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: title, body' },
        { status: 400 }
      );
    }

    // Check if it's a single user or bulk notification
    if (users && Array.isArray(users)) {
      // Bulk notification
      console.log(`🔔 Sending bulk push notification to ${users.length} users`);
      
      const result = await sendBulkPushNotifications(users, {
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
        error: result.error
      });

    } else {
      // Single user notification
      if (!userId || !userType) {
        return NextResponse.json(
          { error: 'Missing required fields for single notification: userId, userType' },
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

      console.log(`🔔 Sending push notification to ${userType} ${userId}`);

      const result = await sendPushNotification({
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
    }

  } catch (error: any) {
    console.error('❌ Error in send notification API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
