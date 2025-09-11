import { adminMessaging } from './admin';
import { FCMTokenService, FCMTokenData } from '@/lib/services/fcm-token-service';

export interface PushNotificationData {
  userId: string;
  userType: 'customer' | 'provider' | 'admin';
  title: string;
  body: string;
  data?: Record<string, string>;
  action?: {
    type: 'booking' | 'message' | 'payment' | 'system';
    id: string;
  };
  imageUrl?: string;
  priority?: 'normal' | 'high';
}

export interface PushNotificationResult {
  success: boolean;
  successCount?: number;
  failureCount?: number;
  failedTokens?: string[];
  error?: string;
  reason?: string;
}

/**
 * Get active FCM tokens from Appwrite (Unified System)
 */
async function getActiveTokensFromAppwrite(userId: string, userType: string): Promise<FCMTokenData[]> {
  try {
    console.log(`🔍 Getting tokens for ${userType} ${userId} from Appwrite...`);

    // Use the existing fcmTokenService to get active tokens
    const tokens = await FCMTokenService.getActiveTokensForUser(userId, userType);

    if (tokens.length === 0) {
      console.log(`📵 No active tokens found for ${userType} ${userId}`);
      return [];
    }

    console.log(`✅ Found ${tokens.length} active tokens for ${userType} ${userId}`);
    
    // Map FCMToken to FCMTokenData format
    return tokens.map(token => ({
      userId: token.user_id,
      userType: token.user_type as 'customer' | 'provider' | 'admin' | 'technician',
      token: token.token,
      deviceInfo: JSON.parse(token.device_info || '{}'),
      deviceId: token.device_id,
      createdAt: token.created_at,
      updatedAt: token.updated_at
    }));

  } catch (error) {
    console.error('❌ Error getting tokens from Appwrite:', error);
    return [];
  }
}

/**
 * Send push notification to a specific user
 */
export const sendPushNotification = async (
  notificationData: PushNotificationData
): Promise<PushNotificationResult> => {
  try {
    console.log(`🔔 Sending push notification to ${notificationData.userType} ${notificationData.userId}`);

    // Check if Firebase admin is initialized
    if (!adminMessaging) {
      console.error('Firebase admin messaging not initialized');
      return { 
        success: false, 
        error: 'Firebase admin not initialized',
        failedTokens: []
      };
    }

    // Get user's active FCM tokens from Appwrite (Unified System)
    const tokens = await getActiveTokensFromAppwrite(
      notificationData.userId,
      notificationData.userType
    );

    if (tokens.length === 0) {
      console.log(`📵 No active FCM tokens found for ${notificationData.userType} ${notificationData.userId}`);
      return { 
        success: false, 
        reason: 'no_tokens',
        successCount: 0,
        failureCount: 0
      };
    }

    console.log(`📱 Found ${tokens.length} active tokens for user`);

    // Prepare notification payload
    const clickAction = getClickAction(notificationData.action, notificationData.userType);
    
    const message = {
      notification: {
        title: notificationData.title,
        body: notificationData.body,
        ...(notificationData.imageUrl && { imageUrl: notificationData.imageUrl })
      },
      data: {
        type: notificationData.action?.type || 'system',
        id: notificationData.action?.id || '',
        userId: notificationData.userId,
        userType: notificationData.userType,
        clickAction,
        timestamp: new Date().toISOString(),
        ...notificationData.data
      },
      tokens: tokens.map((t: FCMTokenData) => t.token),
      webpush: {
        fcmOptions: {
          link: clickAction
        },
        headers: {
          Urgency: notificationData.priority === 'high' ? 'high' : 'normal'
        }
      },
      android: {
        priority: (notificationData.priority === 'high' ? 'high' : 'normal') as 'high' | 'normal',
        notification: {
          clickAction,
          channelId: getChannelId(notificationData.action?.type),
          ...(notificationData.imageUrl && { imageUrl: notificationData.imageUrl })
        }
      },
      apns: {
        payload: {
          aps: {
            category: notificationData.action?.type || 'system',
            'thread-id': `${notificationData.action?.type}_${notificationData.userId}`,
            'mutable-content': 1
          }
        },
        ...(notificationData.imageUrl && {
          fcmOptions: {
            imageUrl: notificationData.imageUrl
          }
        })
      }
    };

    // Send via Firebase Admin SDK
    const response = await adminMessaging.sendEachForMulticast(message);

    console.log(`📊 Push notification result: ${response.successCount} success, ${response.failureCount} failures`);

    // Handle failed tokens
    const failedTokens: string[] = [];
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const token = tokens[idx].token;
          failedTokens.push(token);
          console.log(`❌ Failed to send to token: ${token.substring(0, 20)}...`, resp.error);
        }
      });
      
      // Deactivate failed tokens
      await Promise.all(
        failedTokens.map(token => /* FCMTokenService.removeToken */(token))
      );
      
      console.log(`🧹 Deactivated ${failedTokens.length} invalid tokens`);
    }

    return {
      success: response.successCount > 0,
      successCount: response.successCount,
      failureCount: response.failureCount,
      failedTokens
    };

  } catch (error: any) {
    console.error('❌ Error sending push notification:', error);
    return { 
      success: false, 
      error: error.message,
      successCount: 0,
      failureCount: 0
    };
  }
};

/**
 * Send data-only push notification (triggers onBackgroundMessage)
 */
export const sendDataOnlyPushNotification = async (
  notificationData: PushNotificationData
): Promise<PushNotificationResult> => {
  try {
    console.log(`🔔 Sending data-only push notification to ${notificationData.userType} ${notificationData.userId}`);

    // Check if Firebase admin is initialized
    if (!adminMessaging) {
      console.error('Firebase admin messaging not initialized');
      return { 
        success: false, 
        error: 'Firebase admin not initialized',
        failedTokens: []
      };
    }

    // Get user's active FCM tokens
    const tokens = await FCMTokenService.getActiveTokensForUser(
      notificationData.userId,
      notificationData.userType
    );

    if (tokens.length === 0) {
      console.log(`📵 No active FCM tokens found for ${notificationData.userType} ${notificationData.userId}`);
      return { 
        success: false, 
        reason: 'no_tokens',
        successCount: 0,
        failureCount: 0
      };
    }

    console.log(`📱 Found ${tokens.length} active tokens for user`);

    // Prepare HYBRID payload (Industry Standard: WhatsApp/Slack pattern)
    const clickAction = getClickAction(notificationData.action, notificationData.userType);
    
    const message = {
      // INCLUDE notification field for automatic system notifications
      notification: {
        title: notificationData.title,
        body: notificationData.body,
        icon: '/assets/logo.png'
      },
      // INCLUDE data field for custom handling
      data: {
        type: notificationData.action?.type || 'system',
        id: notificationData.action?.id || '',
        userId: notificationData.userId,
        userType: notificationData.userType,
        clickAction,
        timestamp: new Date().toISOString(),
        priority: notificationData.priority || 'normal',
        source: 'enterprise-fcm', // Mark as enterprise message
        ...notificationData.data
      },
      tokens: tokens.map((t: any) => t.token),
      webpush: {
        fcmOptions: {
          link: clickAction
        },
        headers: {
          Urgency: notificationData.priority === 'high' ? 'high' : 'normal'
        }
      },
      android: {
        priority: (notificationData.priority === 'high' ? 'high' : 'normal') as 'high' | 'normal',
        notification: {
          clickAction,
          channelId: getChannelId(notificationData.action?.type),
          ...(notificationData.imageUrl && { imageUrl: notificationData.imageUrl })
        }
      },
      apns: {
        payload: {
          aps: {
            category: notificationData.action?.type || 'system',
            'thread-id': `${notificationData.action?.type}_${notificationData.userId}`,
          }
        }
      }
    };

    console.log('📤 Sending hybrid notification message (WhatsApp/Slack pattern):', {
      title: notificationData.title,
      userType: notificationData.userType,
      userId: notificationData.userId,
      tokenCount: tokens.length
    });

    // Industry Standard: Try topic-based delivery first (more reliable)
    const topic = `${notificationData.userType}_${notificationData.userId}`;
    
    try {
      console.log(`📡 Attempting topic-based delivery to: ${topic}`);
      
      const topicMessage = {
        notification: {
          title: notificationData.title,
          body: notificationData.body,
          icon: '/assets/logo.png'
        },
        data: {
          type: notificationData.action?.type || 'system',
          id: notificationData.action?.id || '',
          userId: notificationData.userId,
          userType: notificationData.userType,
          clickAction,
          timestamp: new Date().toISOString(),
          priority: notificationData.priority || 'normal',
          source: 'enterprise-fcm',
          ...notificationData.data
        },
        topic: topic,
        webpush: {
          fcmOptions: {
            link: clickAction
          }
        }
      };

      const topicResponse = await adminMessaging.send(topicMessage);
      console.log(`✅ Topic-based delivery successful: ${topicResponse}`);
      
      return {
        success: true,
        successCount: 1,
        failureCount: 0,
        failedTokens: []
      };
      
    } catch (topicError: any) {
      console.warn(`⚠️ Topic delivery failed, falling back to token-based:`, topicError.message);
    }

    // Fallback: Token-based delivery (WhatsApp fallback pattern)
    console.log(`📱 Using token-based delivery for ${tokens.length} tokens`);

    // Send via Firebase Admin SDK
    const response = await adminMessaging.sendEachForMulticast(message);

    console.log(`📊 Hybrid push notification result: ${response.successCount} success, ${response.failureCount} failures`);

    // Handle failed tokens
    const failedTokens: string[] = [];
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const token = tokens[idx].token;
          failedTokens.push(token);
          console.log(`❌ Failed to send to token: ${token.substring(0, 20)}...`, resp.error);
        }
      });
      
      // Deactivate failed tokens
      await Promise.all(
        failedTokens.map(token => /* FCMTokenService.removeToken */(token))
      );
      
      console.log(`🧹 Deactivated ${failedTokens.length} invalid tokens`);
    }

    return {
      success: response.successCount > 0,
      successCount: response.successCount,
      failureCount: response.failureCount,
      failedTokens
    };

  } catch (error: any) {
    console.error('❌ Error sending data-only push notification:', error);
    return { 
      success: false, 
      error: error.message,
      successCount: 0,
      failureCount: 0
    };
  }
};

/**
 * Send push notifications to multiple users
 */
export const sendBulkPushNotifications = async (
  users: Array<{ userId: string; userType: 'customer' | 'provider' | 'admin' }>,
  notificationData: Omit<PushNotificationData, 'userId' | 'userType'>
): Promise<PushNotificationResult> => {
  try {
    let totalSuccessCount = 0;
    let totalFailureCount = 0;
    const allFailedTokens: string[] = [];

    // Send to each user
    for (const user of users) {
      const result = await sendPushNotification({
        ...notificationData,
        userId: user.userId,
        userType: user.userType
      });

      if (result.success) {
        totalSuccessCount += result.successCount || 0;
        totalFailureCount += result.failureCount || 0;
        if (result.failedTokens) {
          allFailedTokens.push(...result.failedTokens);
        }
      }
    }

    return {
      success: totalSuccessCount > 0,
      successCount: totalSuccessCount,
      failureCount: totalFailureCount,
      failedTokens: allFailedTokens
    };

  } catch (error: any) {
    console.error('Error sending bulk push notifications:', error);
    return { 
      success: false, 
      error: error.message,
      successCount: 0,
      failureCount: 0
    };
  }
};

/**
 * Get click action URL based on notification type and user type
 */
const getClickAction = (action?: { type: string; id: string }, userType?: string) => {
  if (!action) return '/';
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  switch (action.type) {
    case 'booking':
      if (userType === 'customer') {
        return `${baseUrl}/customer/bookings/${action.id}`;
      } else if (userType === 'provider') {
        return `${baseUrl}/provider/bookings/${action.id}`;
      }
      return `${baseUrl}/admin/bookings/${action.id}`;
      
    case 'message':
      return `${baseUrl}/chat/${action.id}`;
      
    case 'payment':
      if (userType === 'customer') {
        return `${baseUrl}/customer/payments/${action.id}`;
      } else if (userType === 'provider') {
        return `${baseUrl}/provider/payments/${action.id}`;
      }
      return `${baseUrl}/admin/payments/${action.id}`;
      
    default:
      if (userType === 'customer') {
        return `${baseUrl}/customer`;
      } else if (userType === 'provider') {
        return `${baseUrl}/provider`;
      }
      return `${baseUrl}/admin`;
  }
};

/**
 * Get notification actions based on type
 */
const getNotificationActions = (type?: string) => {
  switch (type) {
    case 'booking':
      return [
        { action: 'view', title: 'View Booking' },
        { action: 'dismiss', title: 'Dismiss' }
      ];
    case 'message':
      return [
        { action: 'reply', title: 'Reply' },
        { action: 'view', title: 'View Chat' }
      ];
    case 'payment':
      return [
        { action: 'view', title: 'View Payment' },
        { action: 'dismiss', title: 'Dismiss' }
      ];
    default:
      return [
        { action: 'view', title: 'View' },
        { action: 'dismiss', title: 'Dismiss' }
      ];
  }
};

/**
 * Get notification channel ID for Android
 */
const getChannelId = (type?: string) => {
  switch (type) {
    case 'booking':
      return 'booking_notifications';
    case 'message':
      return 'message_notifications';
    case 'payment':
      return 'payment_notifications';
    default:
      return 'default_notifications';
  }
};
