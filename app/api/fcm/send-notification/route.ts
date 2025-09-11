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

    // Enhanced: Support data-only notifications with rich content
    let notificationTitle = title;
    let notificationBody = body;

    // If no title/body provided, generate them from data
    if (!title && !body && data) {
      notificationTitle = generateTitleFromData(data);
      notificationBody = generateBodyFromData(data);
    }

    // Validate required fields (either traditional or enhanced data)
    if (!notificationTitle || !notificationBody) {
      return NextResponse.json(
        { error: 'Missing notification content. Provide either title/body or enhanced data.' },
        { status: 400 }
      );
    }

    // Check if it's a single user or bulk notification
    if (users && Array.isArray(users)) {
      // Bulk notification
      console.log(`🔔 Sending bulk push notification to ${users.length} users`);
      
      const result = await sendBulkPushNotifications(users, {
        title: notificationTitle,
        body: notificationBody,
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

      console.log(`Sending enhanced push notification to ${userType} ${userId}`);

      const result = await sendPushNotification({
        userId,
        userType,
        title: notificationTitle,
        body: notificationBody,
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
    console.error('Error in send notification API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Enhanced: Generate title from data
function generateTitleFromData(data: any): string {
  const type = data?.type || 'system';
  
  switch (type) {
    case 'chat':
    case 'message':
      const senderName = data?.senderName || 'Someone';
      return `Message from ${senderName}`;
    
    case 'booking':
      return 'Booking Update';
    
    case 'payment':
      return 'Payment Notification';
    
    case 'provider_verification':
      return 'Provider Verification';
    
    case 'quote_request':
      return 'Quote Request';
    
    case 'service_update':
      return 'Service Update';
    
    case 'system':
    default:
      return 'Sniket Notification';
  }
}

// Enhanced: Generate body from data
function generateBodyFromData(data: any): string {
  const type = data?.type || 'system';
  
  switch (type) {
    case 'chat':
    case 'message':
      const messageContent = data?.messageContent || 'New message received';
      const isLongMessage = messageContent.length > 50;
      return isLongMessage ? messageContent.substring(0, 50) + '...' : messageContent;
    
    case 'booking':
      const bookingStatus = data?.bookingStatus || 'updated';
      return `Your booking has been ${bookingStatus}. Tap to view details.`;
    
    case 'payment':
      const amount = data?.amount || 'amount';
      return `Payment of ₹${amount} processed successfully.`;
    
    case 'provider_verification':
      return 'Your provider application has been reviewed. Check status.';
    
    case 'quote_request':
      const deviceType = data?.deviceType || 'device';
      return `New quote request for ${deviceType} repair.`;
    
    case 'service_update':
      const serviceStatus = data?.serviceStatus || 'updated';
      return `Service status: ${serviceStatus}. View progress.`;
    
    case 'system':
    default:
      return 'You have a new notification from Sniket.';
  }
}
