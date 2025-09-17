// 🚨 Message Alert Service - Admin Notification System
// Tracks unresponded customer messages and alerts admin after 2 minutes

import { databases, DATABASE_ID } from './appwrite';
import { ID, Query } from 'appwrite';
import { notificationService } from './notifications';

export interface MessageAlert {
  id: string;
  conversationId: string;
  messageId: string;
  customerId: string;
  customerName: string;
  providerId: string;
  providerName: string;
  providerPhone?: string;
  message: string;
  messageAt: string;
  alertedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  status: 'active' | 'resolved';
  createdAt: string;
  updatedAt: string;
}

export interface UnrespondedMessage {
  conversationId: string;
  messageId: string;
  customerId: string;
  customerName: string;
  providerId: string;
  providerName: string;
  providerPhone?: string;
  message: string;
  sentAt: string;
  minutesAgo: number;
}

class MessageAlertService {
  private readonly ALERT_THRESHOLD_MINUTES = 2;
  private alertCheckInterval: NodeJS.Timeout | null = null;
  private subscribers = new Map<string, (alerts: MessageAlert[]) => void>();

  /**
   * Start monitoring for unresponded messages
   * Should be called once when admin dashboard loads
   */
  startMonitoring(): void {
    if (this.alertCheckInterval) {
      console.log('🚨 Alert monitoring already running');
      return;
    }

    console.log('🚨 Starting message alert monitoring...');
    
    // Check immediately
    this.checkUnrespondedMessages();
    
    // Then check every 30 seconds
    this.alertCheckInterval = setInterval(() => {
      this.checkUnrespondedMessages();
    }, 30 * 1000);
  }

  /**
   * Stop monitoring (cleanup when admin leaves dashboard)
   */
  stopMonitoring(): void {
    if (this.alertCheckInterval) {
      clearInterval(this.alertCheckInterval);
      this.alertCheckInterval = null;
      console.log('🚨 Stopped message alert monitoring');
    }
  }

  /**
   * Main function: Check for unresponded messages and create alerts
   */
  private async checkUnrespondedMessages(): Promise<void> {
    try {
      console.log('🚨 Checking for unresponded messages...');

      // Get messages from last 10 minutes (generous window)
      const cutoffTime = new Date(Date.now() - (10 * 60 * 1000)).toISOString();
      
      const messages = await databases.listDocuments(
        DATABASE_ID,
        'messages',
        [
          Query.equal('sender_type', 'customer'), // Only customer messages
          Query.greaterThan('created_at', cutoffTime),
          Query.orderDesc('created_at'),
          Query.limit(100)
        ]
      );

      console.log(`🚨 Found ${messages.documents.length} recent customer messages`);

      for (const message of messages.documents) {
        await this.processMessage(message);
      }

    } catch (error) {
      console.error('🚨 Error checking unresponded messages:', error);
    }
  }

  /**
   * Process individual message to check if it needs alerting
   */
  private async processMessage(message: any): Promise<void> {
    try {
      const messageTime = new Date(message.created_at).getTime();
      const now = Date.now();
      const minutesAgo = (now - messageTime) / (1000 * 60);

      // Skip if message is too new (less than threshold)
      if (minutesAgo < this.ALERT_THRESHOLD_MINUTES) {
        return;
      }

      // Check if we already created an alert for this message
      const existingAlert = await this.getExistingAlert(message.$id);
      if (existingAlert) {
        return; // Already alerted
      }

      // Check if provider has responded to this conversation since the message
      const hasResponse = await this.checkProviderResponse(
        message.conversation_id, 
        message.created_at
      );

      if (hasResponse) {
        return; // Provider already responded
      }

      // Get conversation details for context
      const conversationDetails = await this.getConversationDetails(message.conversation_id);
      if (!conversationDetails) {
        console.warn(`🚨 Could not get conversation details for ${message.conversation_id}`);
        return;
      }

      // Create alert!
      await this.createAlert({
        conversationId: message.conversation_id,
        messageId: message.$id,
        customerId: message.sender_id,
        customerName: conversationDetails.customerName,
        providerId: conversationDetails.providerId,
        providerName: conversationDetails.providerName,
        providerPhone: conversationDetails.providerPhone,
        message: message.content,
        messageAt: message.created_at
      });

    } catch (error) {
      console.error('🚨 Error processing message:', error);
    }
  }

  /**
   * Check if an alert already exists for this message
   */
  private async getExistingAlert(messageId: string): Promise<boolean> {
    try {
      const alerts = await databases.listDocuments(
        DATABASE_ID,
        'message_alerts',
        [
          Query.equal('message_id', messageId),
          Query.limit(1)
        ]
      );

      return alerts.documents.length > 0;
    } catch (error) {
      console.error('🚨 Error checking existing alert:', error);
      return false; // Assume no existing alert to be safe
    }
  }

  /**
   * Check if provider responded to conversation after the customer message
   */
  private async checkProviderResponse(conversationId: string, customerMessageTime: string): Promise<boolean> {
    try {
      const responses = await databases.listDocuments(
        DATABASE_ID,
        'messages',
        [
          Query.equal('conversation_id', conversationId),
          Query.equal('sender_type', 'provider'),
          Query.greaterThan('created_at', customerMessageTime),
          Query.limit(1)
        ]
      );

      return responses.documents.length > 0;
    } catch (error) {
      console.error('🚨 Error checking provider response:', error);
      return false; // Assume no response to be safe
    }
  }

  /**
   * Get conversation details (customer and provider info)
   */
  private async getConversationDetails(conversationId: string): Promise<{
    customerName: string;
    providerId: string;
    providerName: string;
    providerPhone?: string;
  } | null> {
    try {
      // Get conversation
      const conversation = await databases.getDocument(
        DATABASE_ID,
        'conversations',
        conversationId
      );

      // Get customer details
      const customer = await databases.getDocument(
        DATABASE_ID,
        'users',
        conversation.customer_id
      );

      // Get provider details
      const provider = await databases.getDocument(
        DATABASE_ID,
        'users',
        conversation.provider_id
      );

      return {
        customerName: customer.name || customer.email || 'Customer',
        providerId: provider.$id,
        providerName: provider.name || provider.email || 'Provider',
        providerPhone: provider.phone || provider.mobile
      };

    } catch (error) {
      console.error('🚨 Error getting conversation details:', error);
      return null;
    }
  }

  /**
   * Create a new message alert
   */
  private async createAlert(data: {
    conversationId: string;
    messageId: string;
    customerId: string;
    customerName: string;
    providerId: string;
    providerName: string;
    providerPhone?: string;
    message: string;
    messageAt: string;
  }): Promise<void> {
    try {
      const now = new Date().toISOString();

      const alert = await databases.createDocument(
        DATABASE_ID,
        'message_alerts',
        ID.unique(),
        {
          conversation_id: data.conversationId,
          message_id: data.messageId,
          customer_id: data.customerId,
          customer_name: data.customerName,
          provider_id: data.providerId,
          provider_name: data.providerName,
          provider_phone: data.providerPhone || '',
          message: data.message,
          message_at: data.messageAt,
          alerted_at: now,
          status: 'active',
          created_at: now,
          updated_at: now
        }
      );

      console.log(`🚨 ✅ Created alert: Customer ${data.customerName} → Provider ${data.providerName}`);

      // Notify admin with desktop notification
      this.notifyAdmin({
        title: 'Unresponded Customer Message!',
        body: `${data.customerName} → ${data.providerName}: "${data.message.substring(0, 50)}..."`
      });

      // Notify subscribers (real-time dashboard updates)
      this.notifySubscribers();

    } catch (error) {
      console.error('🚨 Error creating alert:', error);
    }
  }

  /**
   * Get all active alerts for admin dashboard
   */
  async getActiveAlerts(): Promise<{ success: boolean; alerts?: MessageAlert[]; error?: string }> {
    try {
      const alerts = await databases.listDocuments(
        DATABASE_ID,
        'message_alerts',
        [
          Query.equal('status', 'active'),
          Query.orderDesc('alerted_at'),
          Query.limit(50)
        ]
      );

      const messageAlerts: MessageAlert[] = alerts.documents.map(doc => ({
        id: doc.$id,
        conversationId: doc.conversation_id,
        messageId: doc.message_id,
        customerId: doc.customer_id,
        customerName: doc.customer_name,
        providerId: doc.provider_id,
        providerName: doc.provider_name,
        providerPhone: doc.provider_phone,
        message: doc.message,
        messageAt: doc.message_at,
        alertedAt: doc.alerted_at,
        resolvedAt: doc.resolved_at,
        resolvedBy: doc.resolved_by,
        status: doc.status,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at
      }));

      return { success: true, alerts: messageAlerts };

    } catch (error) {
      console.error('🚨 Error getting active alerts:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Mark alert as resolved by admin
   */
  async resolveAlert(alertId: string, adminId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        'message_alerts',
        alertId,
        {
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: adminId,
          updated_at: new Date().toISOString()
        }
      );

      console.log(`🚨 ✅ Alert resolved by admin: ${alertId}`);

      // Notify subscribers of the update
      this.notifySubscribers();

      return { success: true };

    } catch (error) {
      console.error('🚨 Error resolving alert:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Subscribe to real-time alert updates
   */
  subscribeToAlerts(callback: (alerts: MessageAlert[]) => void): () => void {
    const subscriptionId = `alerts_${Date.now()}_${Math.random()}`;
    this.subscribers.set(subscriptionId, callback);

    // Send current alerts immediately
    this.getActiveAlerts().then(result => {
      if (result.success && result.alerts) {
        callback(result.alerts);
      }
    });

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(subscriptionId);
    };
  }

  /**
   * Notify all subscribers of alert changes
   */
  private async notifySubscribers(): Promise<void> {
    if (this.subscribers.size === 0) return;

    const result = await this.getActiveAlerts();
    if (result.success && result.alerts) {
      this.subscribers.forEach(callback => {
        try {
          callback(result.alerts!);
        } catch (error) {
          console.error('🚨 Error notifying subscriber:', error);
        }
      });
    }
  }

  /**
   * Send desktop notification to admin
   */
  private notifyAdmin(notification: { title: string; body: string }): void {
    // Desktop notification (if permission granted)
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.body,
          icon: '/favicon.ico',
          tag: 'message-alert' // Prevent duplicate notifications
        });
      } else if (Notification.permission === 'default') {
        // Request permission for future notifications
        Notification.requestPermission();
      }
    }

    // Audio alert (optional)
    this.playAlertSound();
  }

  /**
   * Play alert sound
   */
  private playAlertSound(): void {
    if (typeof window !== 'undefined') {
      try {
        // Create a simple beep sound
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } catch (error) {
        console.log('🚨 Could not play alert sound:', error);
      }
    }
  }
}

// Export singleton instance
export const messageAlertService = new MessageAlertService();
