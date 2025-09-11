import { NextRequest, NextResponse } from 'next/server';
import { adminMessaging } from '@/lib/firebase/admin';
import { FCMTokenService } from '@/lib/services/fcm-token-service';

interface EnterpriseRegistrationRequest {
  deviceToken: {
    token: string;
    deviceId: string;
    browser: string;
    platform: string;
    userAgent: string;
    registeredAt: string;
  };
  userSubscription: {
    userId: string;
    userType: 'customer' | 'provider' | 'admin' | 'technician';
    email?: string;
    name?: string;
    activeSessionId: string;
    lastActive: string;
  };
  topics: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: EnterpriseRegistrationRequest = await request.json();
    const { deviceToken, userSubscription, topics } = body;

    // Ensure Firebase admin messaging is available for topic subscriptions
    if (!adminMessaging) {
      console.error('🔥 [Enterprise FCM] Firebase messaging not initialized');
      return NextResponse.json({
        success: false,
        error: 'Firebase messaging services not available',
        code: 'FIREBASE_UNAVAILABLE'
      }, { status: 503 });
    }

    // Use unified Appwrite system for token storage (with automatic cleanup)
    const tokenData = {
      token: deviceToken.token,
      deviceId: deviceToken.deviceId,
      userId: userSubscription.userId,
      userType: userSubscription.userType,
      deviceInfo: {
        browser: deviceToken.browser,
        platform: deviceToken.platform,
        userAgent: deviceToken.userAgent
      }
    };

    // Save token using unified system with cleanup
    await FCMTokenService.saveToken(tokenData);

    // Subscribe to topics with error handling
    const topicResults: { topic: string; success: boolean; error?: string }[] = [];
    
    if (topics.length > 0) {
      for (const topic of topics) {
        try {
          await adminMessaging.subscribeToTopic([deviceToken.token], topic);
          topicResults.push({ topic, success: true });
        } catch (topicError: any) {
          console.warn(`⚠️ [Enterprise FCM] Topic subscription failed for ${topic}:`, topicError.message);
          topicResults.push({ topic, success: false, error: topicError.message });
        }
      }
    }

    return NextResponse.json({
      success: true,
      deviceId: deviceToken.deviceId,
      subscriptions: topicResults,
      method: 'appwrite_unified',
      message: 'Enterprise FCM registration successful',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ [Enterprise FCM] Registration failed:', error);
    
    // Handle messaging API errors
    if (error.message.includes('messaging')) {
      return NextResponse.json({
        success: false,
        error: 'Firebase Cloud Messaging error',
        code: 'FCM_ERROR',
        details: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: false, 
      error: error.message || 'Enterprise FCM registration failed',
      code: error.code || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
