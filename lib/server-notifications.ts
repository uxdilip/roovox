// Server-side notification service for API routes
import { databases, DATABASE_ID } from './appwrite';
import { ID } from 'appwrite';

export interface ServerNotificationData {
  type: 'message' | 'booking' | 'offer' | 'payment' | 'system';
  category: 'business' | 'chat';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  userId: string;
  userType: 'customer' | 'provider' | 'admin';
  relatedId?: string;
  relatedType?: string;
  metadata?: Record<string, any>;
  senderId?: string;
  senderName?: string;
  messagePreview?: string;
}

class ServerNotificationService {
  /**
   * Create notification from server-side (API routes)
   */
  async createNotification(
    data: ServerNotificationData, 
    options?: { skipIfActiveChat?: boolean }
  ): Promise<{ success: boolean; notification?: any; error?: string; fcmSent?: boolean }> {
    try {
      console.log(`🔔 [SERVER] Creating ${data.type} notification for ${data.userType} ${data.userId}`);

      const notificationData = {
        type: data.type,
        category: data.category,
        priority: data.priority,
        title: data.title,
        message: data.message,
        user_id: data.userId,
        user_type: data.userType,
        related_id: data.relatedId,
        related_type: data.relatedType,
        read: false,
        metadata: data.metadata ? JSON.stringify(data.metadata) : '{}',
        sender_id: data.senderId,
        sender_name: data.senderName,
        message_preview: data.messagePreview || data.message,
        last_message_at: new Date().toISOString(),
        unique_key: data.senderId ? `chat_${data.senderId}_${data.userId}` : undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const result = await databases.createDocument(
        DATABASE_ID,
        'notifications',
        ID.unique(),
        notificationData
      );

      console.log(`✅ [SERVER] Notification created: ${result.$id}`);

      // Send FCM push notification asynchronously
      const fcmPromise = this.sendPushNotificationAsync(data);

      return { 
        success: true, 
        notification: {
          id: result.$id,
          ...notificationData
        },
        fcmSent: true // Will be sent asynchronously
      };

    } catch (error) {
      console.error('❌ [SERVER] Error creating notification:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        fcmSent: false
      };
    }
  }

  /**
   * Send FCM push notification asynchronously
   */
  private async sendPushNotificationAsync(data: ServerNotificationData): Promise<void> {
    try {
      // Don't await this - run it asynchronously
      setTimeout(async () => {
        try {
          console.log(`🔔 [SERVER] Sending push notification for ${data.type} to ${data.userType} ${data.userId}`);
          
          const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/fcm/send-notification`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: data.userId,
              userType: data.userType,
              title: data.title,
              body: data.message,
              data: {
                type: data.type,
                category: data.category,
                priority: data.priority,
                relatedId: data.relatedId || '',
                relatedType: data.relatedType || ''
              },
              action: {
                type: data.type,
                id: data.relatedId || ''
              },
              priority: data.priority === 'high' || data.priority === 'urgent' ? 'high' : 'normal'
            }),
          });

          if (response.ok) {
            const result = await response.json();
            console.log(`✅ [SERVER] Push notification sent: ${result.successCount} delivered`);
          } else {
            const error = await response.json();
            console.error(`❌ [SERVER] Push notification failed:`, error);
          }
        } catch (error) {
          console.error('❌ [SERVER] Error sending push notification:', error);
        }
      }, 100);
    } catch (error) {
      console.error('❌ [SERVER] Error in sendPushNotificationAsync:', error);
    }
  }
}

// Export singleton instance
export const serverNotificationService = new ServerNotificationService();

// Export the createNotification function directly for easy import
export const createNotification = (
  data: ServerNotificationData, 
  options?: { skipIfActiveChat?: boolean }
) => {
  return serverNotificationService.createNotification(data);
};
