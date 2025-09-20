// 🚨 Message Alert Service - Admin Notification System
// Tracks unresponded customer messages and alerts admin after 2 minutes

import { databases, DATABASE_ID, COLLECTIONS } from './appwrite';
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

      console.log(`🚨 Processing message ${message.$id} - ${minutesAgo.toFixed(1)} minutes old`);

      // Skip if message is too new (less than threshold)
      if (minutesAgo < this.ALERT_THRESHOLD_MINUTES) {
        console.log(`🚨 ⏰ Message ${message.$id} is too new (${minutesAgo.toFixed(1)} min < ${this.ALERT_THRESHOLD_MINUTES} min threshold)`);
        return;
      }

      // Check if we already created an alert for this message
      const existingAlert = await this.getExistingAlert(message.$id);
      if (existingAlert) {
        console.log(`🚨 ✅ Alert already exists for message ${message.$id} - skipping`);
        return; // Already alerted
      }

      // Check if provider has responded to this conversation since the message
      const hasResponse = await this.checkProviderResponse(
        message.conversation_id, 
        message.created_at
      );

      if (hasResponse) {
        console.log(`🚨 ✅ Provider already responded to message ${message.$id} - skipping`);
        return; // Provider already responded
      }

      console.log(`🚨 🚨 Creating NEW alert for message ${message.$id}`);

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
      console.log(`🚨 🔍 Checking for existing alert for message: ${messageId}`);
      
      // Check in notifications collection for existing alert
      const alerts = await databases.listDocuments(
        DATABASE_ID,
        'notifications',
        [
          Query.equal('user_id', 'admin_alerts'), // Special admin alerts user ID
          Query.equal('user_type', 'admin'),
          Query.equal('type', 'message'),
          Query.equal('category', 'chat'),
          Query.limit(100) // Get more alerts to check properly
        ]
      );

      console.log(`🚨 🔍 Found ${alerts.documents.length} total admin alerts to check`);

      // Check if any alert has this messageId in metadata
      const existingAlert = alerts.documents.find(doc => {
        try {
          const metadata = JSON.parse(doc.metadata || '{}');
          const hasMatchingMessage = metadata.messageId === messageId && metadata.alertType === 'unresponded_message';
          
          if (hasMatchingMessage) {
            console.log(`🚨 ✅ Found existing alert for message ${messageId}:`, doc.$id);
          }
          
          return hasMatchingMessage;
        } catch (parseError) {
          console.log(`🚨 ⚠️ Could not parse metadata for alert ${doc.$id}:`, parseError);
          return false;
        }
      });

      if (existingAlert) {
        console.log(`🚨 ✅ Alert already exists for message ${messageId} - found alert ID: ${existingAlert.$id}`);
        return true;
      } else {
        console.log(`🚨 ❌ No existing alert found for message ${messageId}`);
        return false;
      }
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

      // Get customer details - try customers collection first, then User collection
      let customerName = 'Unknown Customer';
      try {
        // Try customers collection first
        const customerResponse = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.CUSTOMERS,
          [Query.equal('user_id', conversation.customer_id), Query.limit(1)]
        );
        
        if (customerResponse.documents.length > 0) {
          const customer = customerResponse.documents[0];
          customerName = customer.full_name || customer.name || 'Customer';
        } else {
          // Fallback to User collection
          const userResponse = await databases.listDocuments(
            DATABASE_ID,
            'User', // Note: Using 'User' (capital U) as seen in your codebase
            [Query.equal('user_id', conversation.customer_id), Query.limit(1)]
          );
          
          if (userResponse.documents.length > 0) {
            const user = userResponse.documents[0];
            customerName = user.name || user.email || 'Customer';
          }
        }
      } catch (error) {
        console.error('🚨 Error fetching customer details:', error);
      }

      // Get provider details - simple phone lookup
      let providerName = 'Unknown Provider';
      let providerPhone = '';
      
      try {
        // Get business setup for business name and phone
        const businessResponse = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.BUSINESS_SETUP,
          [Query.equal('user_id', conversation.provider_id), Query.limit(1)]
        );
        
        if (businessResponse.documents.length > 0) {
          const businessSetup = businessResponse.documents[0];
          const onboardingData = JSON.parse(businessSetup.onboarding_data || '{}');
          providerName = onboardingData.businessInfo?.businessName || 'Provider';
          providerPhone = onboardingData.personalDetails?.mobile || '';
        }
        
        // Fallback to User collection if no phone found
        if (!providerPhone) {
          const userResponse = await databases.listDocuments(
            DATABASE_ID,
            'User',
            [Query.equal('user_id', conversation.provider_id), Query.limit(1)]
          );
          
          if (userResponse.documents.length > 0) {
            const user = userResponse.documents[0];
            providerPhone = user.phone || '';
            if (!providerName || providerName === 'Provider') {
              providerName = user.name || 'Provider';
            }
          }
        }
        
      } catch (error) {
        console.error('🚨 Error fetching provider details:', error);
      }

      return {
        customerName,
        providerId: conversation.provider_id,
        providerName,
        providerPhone
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

      // Create notification using existing notifications system instead of separate message_alerts collection
      const result = await notificationService.createNotification({
        type: 'message',
        category: 'chat',
        priority: 'urgent',
        title: `Unresponded Customer Message`,
        message: `${data.customerName} → ${data.providerName}: "${data.message.substring(0, 100)}${data.message.length > 100 ? '...' : ''}"`,
        userId: 'admin_alerts', // Special user ID for admin alerts - will be visible to all admins
        userType: 'admin',
        relatedId: data.conversationId,
        relatedType: 'conversation',
        senderId: data.customerId,
        senderName: data.customerName,
        messagePreview: data.message,
        metadata: {
          messageId: data.messageId,
          customerId: data.customerId,
          providerId: data.providerId,
          providerName: data.providerName,
          providerPhone: data.providerPhone || 'No Phone',
          messageAt: data.messageAt,
          alertType: 'unresponded_message',
          alertedAt: now
        }
      });

      if (result.success) {
        console.log(`🚨 ✅ Created alert notification: Customer ${data.customerName} → Provider ${data.providerName}`);

        // Notify admin with desktop notification
        this.notifyAdmin({
          title: 'Unresponded Customer Message!',
          body: `${data.customerName} → ${data.providerName}: "${data.message.substring(0, 50)}..."`
        });

        // Notify subscribers (real-time dashboard updates)
        this.notifySubscribers();
      } else {
        console.error('🚨 Failed to create alert notification:', result.error);
      }

    } catch (error) {
      console.error('🚨 Error creating alert:', error);
    }
  }

  /**
   * Get all active alerts for admin dashboard
   */
  async getActiveAlerts(): Promise<{ success: boolean; alerts?: MessageAlert[]; error?: string }> {
    try {
      // Fetch admin notifications that are message alerts
      const alerts = await databases.listDocuments(
        DATABASE_ID,
        'notifications',
        [
          Query.equal('user_id', 'admin_alerts'), // Special admin alerts user ID
          Query.equal('user_type', 'admin'),
          Query.equal('type', 'message'),
          Query.equal('category', 'chat'),
          Query.orderDesc('created_at'),
          Query.limit(50)
        ]
      );

      // Filter and convert notifications to MessageAlert format
      const messageAlerts: MessageAlert[] = alerts.documents
        .filter(doc => {
          try {
            const metadata = JSON.parse(doc.metadata || '{}');
            return metadata.alertType === 'unresponded_message';
          } catch {
            return false;
          }
        })
        .map(doc => {
          const metadata = JSON.parse(doc.metadata || '{}');
          return {
            id: doc.$id,
            conversationId: doc.related_id || '',
            messageId: metadata.messageId || '',
            customerId: metadata.customerId || '',
            customerName: doc.sender_name || 'Unknown Customer',
            providerId: metadata.providerId || '',
            providerName: metadata.providerName || 'Unknown Provider',
            providerPhone: metadata.providerPhone || '',
            message: doc.message_preview || doc.message || '',
            messageAt: metadata.messageAt || doc.created_at,
            alertedAt: metadata.alertedAt || doc.created_at,
            resolvedAt: undefined, // Not implemented yet
            resolvedBy: undefined, // Not implemented yet
            status: doc.read ? 'resolved' : 'active',
            createdAt: doc.created_at,
            updatedAt: doc.updated_at || doc.created_at
          };
        });

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
      // Mark notification as read to resolve the alert
      await databases.updateDocument(
        DATABASE_ID,
        'notifications',
        alertId,
        {
          read: true,
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
