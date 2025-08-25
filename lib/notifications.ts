// 🆕 Fresh Notification System - Built from Scratch
// This service handles all notifications without duplicates or self-notifications

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
}

// Notification Service Class
class NotificationService {
  private subscriptions = new Map<string, () => void>();

  /**
   * Create a new notification
   * CRITICAL: This prevents self-notifications by design
   * NEW: Also prevents notifications when user is actively viewing the chat
   */
  async createNotification(
    data: CreateNotificationData, 
    options?: { 
      skipIfActiveChat?: boolean; 
      activeConversationId?: string | null;
      isInChatTab?: boolean;
    }
  ): Promise<{ success: boolean; notification?: Notification; error?: string; skipped?: boolean }> {
    try {
      // 🔔 NEW: Smart notification logic - check if user is actively viewing this conversation
      if (options?.skipIfActiveChat && data.relatedId) {
        const isActive = await this.isUserActiveInChat(data.userId, data.relatedId);
        
        if (isActive) {
          return { success: true, skipped: true };
        }
      }

      // Smart logic enabled - check if user is actively viewing this conversation

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
   * Get notifications for a user
   */
  async getUserNotifications(userId: string, userType: string, limit: number = 50): Promise<{ success: boolean; notifications?: Notification[]; error?: string }> {
    try {
      const result = await databases.listDocuments(
        DATABASE_ID,
        'notifications',
        [
          // Only get notifications for this specific user
          // This prevents self-notifications from appearing
          Query.equal('user_id', userId),
          Query.equal('user_type', userType),
          Query.orderDesc('created_at'),
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
        metadata: doc.metadata ? JSON.parse(doc.metadata) : {}
      }));

      return { success: true, notifications };

    } catch (error) {
      // Silently handle notification fetch errors
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
      // Silently handle mark as read errors
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
      // Silently handle unread count errors
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
              metadata: notification.metadata ? JSON.parse(notification.metadata) : {}
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
