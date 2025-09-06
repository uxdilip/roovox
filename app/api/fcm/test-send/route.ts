import { NextRequest, NextResponse } from 'next/server';
import { adminMessaging } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { 
      title, 
      body, 
      userType, 
      userId, 
      type, 
      clickAction, 
      priority, 
      image,
      targetToken 
    } = await request.json();

    // Validate required fields
    if (!title || !body || !targetToken) {
      return NextResponse.json(
        { error: 'Missing required fields: title, body, targetToken' },
        { status: 400 }
      );
    }

    // Prepare the test message
    const message = {
      token: targetToken,
      notification: {
        title,
        body,
        ...(image && { imageUrl: image })
      },
      data: {
        type: type || 'test',
        userId: userId || 'test-user',
        userType: userType || 'customer',
        clickAction: clickAction || '/',
        priority: priority || 'normal',
        timestamp: new Date().toISOString()
      },
      webpush: {
        notification: {
          title,
          body,
          icon: '/assets/logo.png',
          badge: '/assets/badge.png',
          tag: `test_${Date.now()}`,
          requireInteraction: priority === 'high',
          ...(image && { image }),
          actions: [
            { action: 'view', title: '👀 View' },
            { action: 'dismiss', title: '❌ Dismiss' }
          ]
        },
        fcmOptions: {
          link: clickAction || '/'
        }
      }
    };

    // Send via Firebase Admin SDK
    const response = await adminMessaging.send(message);

    return NextResponse.json({
      success: true,
      message: 'Test notification sent successfully',
      messageId: response
    });

  } catch (error) {
    console.error('❌ Test notification error:', error);
    
    // Handle specific Firebase errors
    if (error instanceof Error) {
      if (error.message.includes('registration-token-not-registered')) {
        return NextResponse.json(
          { 
            error: 'Invalid FCM token',
            details: 'The provided token is not registered or expired'
          },
          { status: 400 }
        );
      }
      
      if (error.message.includes('invalid-argument')) {
        return NextResponse.json(
          { 
            error: 'Invalid notification data',
            details: error.message
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
