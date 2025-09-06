import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, userType, title, message } = await request.json();

    if (!userId || !userType || !title || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send test notification using our FCM endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/fcm/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        userType,
        title,
        body: message,
        data: {
          type: 'test',
          category: 'system',
          priority: 'medium'
        },
        action: {
          type: 'test',
          id: 'test-notification'
        },
        priority: 'normal'
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return NextResponse.json({
        success: true,
        message: 'Test notification sent successfully',
        delivered: result.successCount
      });
    } else {
      const error = await response.json();
      return NextResponse.json(
        { success: false, error: 'Failed to send test notification', details: error },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Test notification error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
