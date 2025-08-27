// 🆕 Fresh Notification System - Built from Scratch
// This service handles all notifications without duplicates or self-notifications
// 🚀 ENHANCED: Now with Fiverr-style smart grouping and message previews!

import { client, databases, DATABASE_ID } from './appwrite';
import { ID, Query } from 'appwrite';

// Types
export interface Notification {
  id: string;
  type: 'message' | 'booking' | 'offer' | 'payment' | 'system';
  category: 'business' | 'chat';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  userId: string;
  userType: 'customer' | 'provider' | 'admin';
  relatedId?: string;
  relatedType?: string;
  read: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
  // 🆕 NEW: Fiverr-style fields for smart grouping
  senderId?: string;
  senderName?: string;
  messagePreview?: string;
  lastMessageAt?: string;
  uniqueKey?: string; // For deduplication: "chat_{senderId}_{recipientId}"
}

export interface CreateNotificationData {
  type: Notification['type'];
  category: Notification['category'];
  priority: Notification['priority'];
  title: string;
  message: string;
  userId: string;
  userType: 'customer' | 'provider' | 'admin';
  relatedId?: string;
  relatedType?: string;
  metadata?: Record<string, any>;
  // 🆕 NEW: Fiverr-style fields
  senderId?: string;
  senderName?: string;
  messagePreview?: string;
}

// Notification Service Class
class NotificationService {
  private subscriptions = new Map<string, () => void>();

  /**
   * 🚀 ENHANCED: Create or update notification with Fiverr-style smart grouping
   * This prevents duplicate notifications from the same sender and shows message previews
   */
  async createNotification(
    data: CreateNotificationData, 
    options?: { 
      skipIfActiveChat?: boolean; 
      activeConversationId?: string | null;
      isInChatTab?: boolean;
    }
  ): Promise<{ success: boolean; notification?: Notification; error?: string; skipped?: boolean; updated?: boolean }> {
    try {
      // 🔔 NEW: Smart notification logic - check if user is actively viewing this conversation
      if (options?.skipIfActiveChat && data.relatedId) {
        const isActive = await this.isUserActiveInChat(data.userId, data.relatedId);
        
        if (isActive) {
          console.log('🔔 [FRESH] Skipping notification - user is actively viewing this conversation:', {
            conversationId: data.relatedId,
            userId: data.userId,
            isActive
          });
          return { success: true, skipped: true };
        }
      }

      // 🆕 NEW: Fiverr-style smart grouping for chat messages
      if (data.type === 'message' && data.senderId && data.relatedId) {
        const result = await this.createOrUpdateChatNotification(data);
        return result;
      }

      // 🔔 Original logic for non-chat notifications (bookings, payments, etc.)
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const result = await databases.createDocument(
        DATABASE_ID,
        'notifications',
        ID.unique(),
        notificationData
      );

      const notification: Notification = {
        id: result.$id,
        type: result.type,
        category: result.category,
        priority: result.priority,
        title: result.title,
        message: result.message,
        userId: result.user_id,
        userType: result.user_type,
        relatedId: result.related_id,
        relatedType: result.related_type,
        read: result.read,
        createdAt: result.created_at,
        metadata: result.metadata ? JSON.parse(result.metadata) : {}
      };

      return { success: true, notification };

    } catch (error) {
      console.error('🔔 [FRESH] ❌ Error creating notification:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 🆕 NEW: Fiverr-style smart grouping for chat notifications
   * Creates new notification OR updates existing one with latest message
   */
  private async createOrUpdateChatNotification(data: CreateNotificationData): Promise<{ success: boolean; notification?: Notification; error?: string; updated?: boolean }> {
    try {
      // Create unique key for this sender-recipient pair
      const uniqueKey = `chat_${data.senderId}_${data.userId}`;
      
      // Check if notification already exists for this sender-recipient pair
      const existingNotifications = await databases.listDocuments(
        DATABASE_ID,
        'notifications',
        [
          Query.equal('unique_key', uniqueKey),
          Query.equal('user_id', data.userId),
          Query.equal('type', 'message'),
          Query.limit(1)
        ]
      );

      if (existingNotifications.documents.length > 0) {
        // 🎯 UPDATE: Existing notification found - update it with new message
        const existing = existingNotifications.documents[0];
        
        const updateData: any = {
          message: data.message,
          message_preview: data.messagePreview || data.message,
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: data.metadata ? JSON.stringify(data.metadata) : existing.metadata
        };

        const updatedNotification = await databases.updateDocument(
          DATABASE_ID,
          'notifications',
          existing.$id,
          updateData
        );

        console.log('🔔 [FIVERR] Updated existing notification:', {
          notificationId: existing.$id,
          senderId: data.senderId,
          recipientId: data.userId,
          messagePreview: data.messagePreview || data.message
        });

        const notification: Notification = {
          id: updatedNotification.$id,
          type: updatedNotification.type,
          category: updatedNotification.category,
          priority: updatedNotification.priority,
          title: updatedNotification.title,
          message: updatedNotification.message,
          userId: updatedNotification.user_id,
          userType: updatedNotification.user_type,
          relatedId: updatedNotification.related_id,
          relatedType: updatedNotification.related_type,
          read: updatedNotification.read,
          createdAt: updatedNotification.created_at,
          metadata: updatedNotification.metadata ? JSON.parse(updatedNotification.metadata) : {},
          senderId: data.senderId,
          senderName: data.senderName,
          messagePreview: updatedNotification.message_preview,
          lastMessageAt: updatedNotification.last_message_at,
          uniqueKey: updatedNotification.unique_key
        };

        return { success: true, notification, updated: true };

      } else {
        // 🆕 CREATE: New notification - first message from this sender
        const notificationData: any = {
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
          // 🆕 NEW: Fiverr-style fields
          sender_id: data.senderId,
          sender_name: data.senderName,
          message_preview: data.messagePreview || data.message,
          last_message_at: new Date().toISOString(),
          unique_key: uniqueKey,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const result = await databases.createDocument(
          DATABASE_ID,
          'notifications',
          ID.unique(),
          notificationData
        );

        console.log('🔔 [FIVERR] Created new notification:', {
          notificationId: result.$id,
          senderId: data.senderId,
          recipientId: data.userId,
          messagePreview: data.messagePreview || data.message
        });

        const notification: Notification = {
          id: result.$id,
          type: result.type,
          category: result.category,
          priority: result.priority,
          title: result.title,
          message: result.message,
          userId: result.user_id,
          userType: result.user_type,
          relatedId: result.related_id,
          relatedType: result.related_type,
          read: result.read,
          createdAt: result.created_at,
          metadata: result.metadata ? JSON.parse(result.metadata) : {},
          senderId: result.sender_id,
          senderName: result.sender_name,
          messagePreview: result.message_preview,
          lastMessageAt: result.last_message_at,
          uniqueKey: result.unique_key
        };

        return { success: true, notification, updated: false };
      }

    } catch (error) {
      console.error('🔔 [FIVERR] ❌ Error in smart chat notification:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get notifications for a user with Fiverr-style formatting
   */
  async getUserNotifications(userId: string, userType: string, limit: number = 50): Promise<{ success: boolean; notifications?: Notification[]; error?: string }> {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        'notifications',
        [
          Query.equal('user_id', userId),
          Query.equal('user_type', userType),
          Query.orderDesc('last_message_at'), // 🆕 NEW: Order by last message time for chat notifications
          Query.orderDesc('created_at'), // Fallback for non-chat notifications
          Query.limit(limit)
        ]
      );

      const notifications: Notification[] = result.documents.map(doc => ({
        id: doc.$id,
        type: doc.type,
        category: doc.category,
        priority: doc.priority,
        title: doc.title,
        message: doc.message,
        userId: doc.user_id,
        userType: doc.user_type,
        relatedId: doc.related_id,
        relatedType: doc.related_type,
        read: doc.read,
        createdAt: doc.created_at,
        metadata: doc.metadata ? JSON.parse(doc.metadata) : {},
        // 🆕 NEW: Fiverr-style fields (with graceful fallbacks)
        senderId: doc.sender_id,
        senderName: doc.sender_name,
        messagePreview: doc.message_preview,
        lastMessageAt: doc.last_message_at,
        uniqueKey: doc.unique_key
      }));

      return { success: true, notifications };

    } catch (error) {
      console.error('🔔 [FRESH] Error fetching notifications:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        'notifications',
        notificationId,
        {
          read: true,
          updated_at: new Date().toISOString()
        }
      );

      return { success: true };

    } catch (error) {
      console.error('🔔 [FRESH] Error marking notification as read:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string, userType: string): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        'notifications',
        [
          Query.equal('user_id', userId),
          Query.equal('user_type', userType),
          Query.equal('read', false)
        ]
      );

      return { success: true, count: result.documents.length };

    } catch (error) {
      console.error('🔔 [FRESH] Error getting unread count:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Subscribe to real-time notifications for a user
   * CRITICAL: This prevents duplicate subscriptions
   */
  subscribeToUserNotifications(
    userId: string,
    userType: string,
    callback: (notification: Notification) => void
  ): () => void {
    const subscriptionKey = `notifications_${userId}_${userType}`;
    
    // Remove existing subscription to prevent duplicates
    this.unsubscribe(subscriptionKey);
    
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.notifications.documents`,
      (response) => {
        if (response.events.includes('databases.*.collections.*.documents.*.create')) {
          const notification = response.payload as any;
          
          // CRITICAL: Only process notifications for this specific user
          // This prevents self-notifications and cross-user notifications
          if (notification.user_id === userId && notification.user_type === userType) {
            const notificationData: Notification = {
              id: notification.$id,
              type: notification.type,
              category: notification.category,
              priority: notification.priority,
              title: notification.title,
              message: notification.message,
              userId: notification.user_id,
              userType: notification.user_type,
              relatedId: notification.related_id,
              relatedType: notification.related_type,
              read: notification.read,
              createdAt: notification.created_at,
              metadata: notification.metadata ? JSON.parse(notification.metadata) : {},
              // 🆕 NEW: Fiverr-style fields (with graceful fallbacks)
              senderId: notification.sender_id,
              senderName: notification.sender_name,
              messagePreview: notification.message_preview,
              lastMessageAt: notification.last_message_at,
              uniqueKey: notification.unique_key
            };
            
            callback(notificationData);
          }
        }
        
        // 🆕 NEW: Handle updates for Fiverr-style grouping
        if (response.events.includes('databases.*.collections.*.documents.*.update')) {
          const notification = response.payload as any;
          
          // Only process updates for this specific user
          if (notification.user_id === userId && notification.user_type === userType) {
            const notificationData: Notification = {
              id: notification.$id,
              type: notification.type,
              category: notification.category,
              priority: notification.priority,
              title: notification.title,
              message: notification.message,
              userId: notification.user_id,
              userType: notification.user_type,
              relatedId: notification.related_id,
              relatedType: notification.related_type,
              read: notification.read,
              createdAt: notification.created_at,
              metadata: notification.metadata ? JSON.parse(notification.metadata) : {},
              // 🆕 NEW: Fiverr-style fields
              senderId: notification.sender_id,
              senderName: notification.sender_name,
              messagePreview: notification.message_preview,
              lastMessageAt: notification.last_message_at,
              uniqueKey: notification.unique_key
            };
            
            callback(notificationData);
          }
        }
      }
    );

    this.subscriptions.set(subscriptionKey, unsubscribe);
    
    return () => this.unsubscribe(subscriptionKey);
  }

  /**
   * Unsubscribe from notifications
   */
  private unsubscribe(subscriptionKey: string): void {
    const unsubscribe = this.subscriptions.get(subscriptionKey);
    if (unsubscribe) {
      unsubscribe();
      this.subscriptions.delete(subscriptionKey);
    }
  }

  /**
   * Clean up all subscriptions
   */
  cleanup(): void {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions.clear();
  }

  // 🔔 NEW: Track active chat sessions (localStorage only for now)
  async setActiveChatSession(userId: string, conversationId: string | null, isActive: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      const sessionKey = `chat_session_${userId}`;
      const sessionData = {
        userId,
        conversationId,
        isActive,
        lastActive: new Date().toISOString(),
        timestamp: new Date().toISOString()
      };

      // Store in localStorage for immediate access
      if (typeof window !== 'undefined') {
        localStorage.setItem(sessionKey, JSON.stringify(sessionData));
      }

      // TODO: Enable database sessions when collection is created
      // For now, only use localStorage to avoid 401 errors
      
      return { success: true };
    } catch (error) {
      console.error('🔔 [SESSIONS] Error setting active chat session:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // 🔔 NEW: Check if user is actively viewing a conversation (localStorage only for now)
  async isUserActiveInChat(userId: string, conversationId: string): Promise<boolean> {
    try {
      // Check localStorage (fastest and most reliable for now)
      if (typeof window !== 'undefined') {
        const sessionKey = `chat_session_${userId}`;
        const sessionData = localStorage.getItem(sessionKey);
        
        if (sessionData) {
          const session = JSON.parse(sessionData);
          const isRecent = new Date(session.lastActive).getTime() > Date.now() - (5 * 60 * 1000); // 5 minutes
          
          if (session.isActive && session.conversationId === conversationId && isRecent) {
            return true;
          }
        }
      }

      // TODO: Enable database sessions when collection is created
      // For now, only use localStorage to avoid 401 errors

      return false;
    } catch (error) {
      console.error('🔔 [SESSIONS] Error checking active chat session:', error);
      return false;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
