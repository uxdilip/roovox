import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const { senderId, senderType, recipientId, recipientType, senderName, content, conversationId } = await request.json();

    if (!senderId || !senderType || !recipientId || !recipientType || !senderName || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log(`🔔 [TEST CHAT API] Creating chat notification:`, {
      senderId,
      senderType,
      recipientId,
      recipientType,
      senderName,
      content: content.substring(0, 50) + '...'
    });

    // Simulate the exact notification creation logic from realtime-chat.ts
    const notificationResult = await notificationService.createNotification({
      type: 'message',
      category: 'chat',
      priority: 'medium',
      title: 'New Message',
      message: `New message from ${senderName}`,
      userId: recipientId,
      userType: recipientType,
      relatedId: conversationId,
      relatedType: 'conversation',
      senderId: senderId,
      senderName: senderName,
      messagePreview: content,
      metadata: {
        senderId,
        senderName,
        conversationId,
        testMode: true
      }
    }, {
      skipIfActiveChat: false,
      activeConversationId: conversationId,
      skipPush: true
    });

    console.log(`🔔 [TEST CHAT API] Notification result:`, {
      success: notificationResult.success,
      notificationId: notificationResult.notification?.id,
      skipToast: (notificationResult.notification as any)?.skipToast,
      error: notificationResult.error
    });

    return NextResponse.json({
      success: notificationResult.success,
      notificationId: notificationResult.notification?.id,
      skipToast: (notificationResult.notification as any)?.skipToast,
      error: notificationResult.error,
      debug: {
        senderId,
        senderType,
        recipientId,
        recipientType,
        senderName,
        conversationId,
        notification: notificationResult.notification
      }
    });

  } catch (error: any) {
    console.error('🔔 [TEST CHAT API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error', success: false },
      { status: 500 }
    );
  }
}
