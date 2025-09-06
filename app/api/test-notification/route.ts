import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const { userId, userType, title, message } = await request.json();

    if (!userId || !userType || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log(`🔔 [TEST API] Creating test notification for ${userType} ${userId}`);

    const result = await notificationService.createNotification({
      type: 'system',
      category: 'business',
      priority: 'medium',
      title,
      message,
      userId,
      userType: userType as 'customer' | 'provider',
      relatedId: 'test',
      relatedType: 'test'
    });

    console.log(`🔔 [TEST API] Notification result:`, result);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('🔔 [TEST API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
