import { NextRequest, NextResponse } from 'next/server';
import { createNotification } from '@/lib/server-notifications';

interface NotificationRequest {
  type: 'message' | 'booking' | 'offer' | 'payment' | 'system';
  category: 'business' | 'chat';
  priority: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  userId: string;
  userType: 'customer' | 'provider';
  relatedId?: string;
  relatedType?: string;
  senderId?: string;
  senderName?: string;
  messagePreview?: string;
  metadata?: any;
  skipIfActiveChat?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: NotificationRequest = await request.json();

    // Validate required fields
    if (!body.type || !body.title || !body.message || !body.userId || !body.userType) {
      return NextResponse.json(
        { success: false, error: 'Missing required notification fields' },
        { status: 400 }
      );
    }

    console.log('🔔 [API] Creating server notification:', {
      type: body.type,
      category: body.category,
      userId: body.userId,
      userType: body.userType,
      title: body.title,
      messagePreview: body.messagePreview?.substring(0, 50)
    });

    // Create notification using server service
    const result = await createNotification({
      type: body.type,
      category: body.category,
      priority: body.priority,
      title: body.title,
      message: body.message,
      userId: body.userId,
      userType: body.userType,
      relatedId: body.relatedId,
      relatedType: body.relatedType,
      senderId: body.senderId,
      senderName: body.senderName,
      messagePreview: body.messagePreview,
      metadata: body.metadata
    }, {
      skipIfActiveChat: body.skipIfActiveChat || false
    });

    return NextResponse.json({
      success: result.success,
      notification: result.notification,
      fcmSent: result.fcmSent || false
    });

  } catch (error) {
    console.error('🔔 [API] Server notification error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create notification',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
