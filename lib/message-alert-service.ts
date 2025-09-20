

import { databases, DATABASE_ID } from './appwrite';
import { Query } from 'appwrite';

interface SimpleMessageData {
  messageId: string;
  conversationId: string;
  customerId: string;
  customerName: string;
  providerId: string;
  providerName: string;
  providerPhone?: string;
  message: string;
  sentAt: string;
}

class SimpleMessageAlertService {
  private readonly ALERT_THRESHOLD_MINUTES = 10;
  private readonly CHECK_INTERVAL_MINUTES = 5;
  private alertCheckInterval: NodeJS.Timeout | null = null;
  private processedMessages = new Set<string>(); // In-memory tracking for already notified messages

  /**
   * Start monitoring for unresponded messages
   * Simple approach: check every 5 minutes, send push notification once per message
   */
  startMonitoring(): void {
    if (this.alertCheckInterval) {
      return;
    }

    // Check immediately
    this.checkUnrespondedMessages();
    
    // Then check every 5 minutes
    this.alertCheckInterval = setInterval(() => {
      this.checkUnrespondedMessages();
    }, this.CHECK_INTERVAL_MINUTES * 60 * 1000);
  }

  /**
   * Stop monitoring (cleanup when admin leaves dashboard)
   */
  stopMonitoring(): void {
    if (this.alertCheckInterval) {
      clearInterval(this.alertCheckInterval);
      this.alertCheckInterval = null;
    }
  }

  /**
   * Simple check for unresponded messages - send push notification once per message
   */
  private async checkUnrespondedMessages(): Promise<void> {
    try {
      // Get customer messages from 10-15 minutes ago (time window approach)
      const now = new Date();
      const startTime = new Date(now.getTime() - (15 * 60 * 1000)).toISOString();
      const endTime = new Date(now.getTime() - (this.ALERT_THRESHOLD_MINUTES * 60 * 1000)).toISOString();
      
      const messages = await databases.listDocuments(
        DATABASE_ID,
        'messages',
        [
          Query.equal('sender_type', 'customer'), // Only customer messages
          Query.greaterThan('created_at', startTime),
          Query.lessThan('created_at', endTime),
          Query.orderDesc('created_at'),
          Query.limit(50)
        ]
      );

      for (const message of messages.documents) {
        await this.processMessageForAlert(message);
      }

    } catch (error) {
      console.error('Error in checkUnrespondedMessages:', error);
    }
  }

  /**
   * Process individual message for alert - simple approach
   */
  private async processMessageForAlert(message: any): Promise<void> {
    try {
      // Skip if we already sent notification for this message
      if (this.processedMessages.has(message.$id)) {
        return;
      }

      // Check if provider has responded to this conversation since the message
      const hasResponse = await this.checkProviderResponse(
        message.conversation_id, 
        message.created_at
      );

      if (hasResponse) {
        return;
      }

      // Get conversation details for notification
      const conversationDetails = await this.getConversationDetails(message.conversation_id);
      if (!conversationDetails) {
        return;
      }

      // Send push notification to admin
      await this.sendAdminPushNotification({
        messageId: message.$id,
        conversationId: message.conversation_id,
        customerId: message.sender_id,
        customerName: conversationDetails.customerName,
        providerId: conversationDetails.providerId,
        providerName: conversationDetails.providerName,
        providerPhone: conversationDetails.providerPhone,
        message: message.content,
        sentAt: message.created_at
      });

      // Mark as processed to prevent duplicate notifications
      this.processedMessages.add(message.$id);

    } catch (error) {
      console.error('Error processing message for alert:', error);
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
      console.error('Error checking provider response:', error);
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

      // Get customer name
      let customerName = 'Unknown Customer';
      try {
        const customerResponse = await databases.listDocuments(
          DATABASE_ID,
          'customers',
          [Query.equal('user_id', conversation.customer_id), Query.limit(1)]
        );
        
        if (customerResponse.documents.length > 0) {
          const customer = customerResponse.documents[0];
          customerName = customer.full_name || customer.name || 'Customer';
        }
      } catch (error) {
        console.error('Error fetching customer details:', error);
      }

      // Get provider details
      let providerName = 'Unknown Provider';
      let providerPhone = '';
      
      try {
        const businessResponse = await databases.listDocuments(
          DATABASE_ID,
          'business_setup',
          [Query.equal('user_id', conversation.provider_id), Query.limit(1)]
        );
        
        if (businessResponse.documents.length > 0) {
          const businessSetup = businessResponse.documents[0];
          const onboardingData = JSON.parse(businessSetup.onboarding_data || '{}');
          providerName = onboardingData.businessInfo?.businessName || 'Provider';
          providerPhone = onboardingData.personalDetails?.mobile || '';
        }
      } catch (error) {
        console.error('Error fetching provider details:', error);
      }

      return {
        customerName,
        providerId: conversation.provider_id,
        providerName,
        providerPhone
      };

    } catch (error) {
      console.error('Error getting conversation details:', error);
      return null;
    }
  }

  /**
   * Send push notification to admin - simple direct approach
   */
  private async sendAdminPushNotification(data: SimpleMessageData): Promise<void> {
    try {
      const now = new Date().toISOString();

      // Send push notification directly to admin
      const response = await fetch('/api/fcm/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'admin_alerts', // Special admin user ID
          userType: 'admin',
          title: 'Unresponded Customer Message',
          body: `${data.customerName} → ${data.providerName}: "${data.message.substring(0, 80)}${data.message.length > 80 ? '...' : ''}"`,
          data: {
            type: 'message',
            category: 'chat',
            messageId: data.messageId,
            conversationId: data.conversationId,
            customerId: data.customerId,
            providerId: data.providerId,
            timestamp: now
          },
          action: {
            type: 'message',
            id: data.conversationId
          },
          priority: 'high'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`Push notification sent to admin: ${result.successCount || 0} delivered`);
      } else {
        const error = await response.json();
        console.error(`Push notification failed:`, error);
      }

    } catch (error) {
      console.error('Error sending admin push notification:', error);
    }
  }

  /**
   * Get count of messages that need admin attention (for dashboard stats)
   */
  async getUnrespondedMessagesCount(): Promise<number> {
    try {
      const cutoffTime = new Date(Date.now() - (this.ALERT_THRESHOLD_MINUTES * 60 * 1000)).toISOString();
      
      const messages = await databases.listDocuments(
        DATABASE_ID,
        'messages',
        [
          Query.equal('sender_type', 'customer'),
          Query.lessThan('created_at', cutoffTime),
          Query.limit(100)
        ]
      );

      let unrespondedCount = 0;
      
      for (const message of messages.documents) {
        const hasResponse = await this.checkProviderResponse(
          message.conversation_id, 
          message.created_at
        );
        
        if (!hasResponse) {
          unrespondedCount++;
        }
      }

      return unrespondedCount;
    } catch (error) {
      console.error('Error getting unresponded messages count:', error);
      return 0;
    }
  }

  /**
   * 🧪 TEST FUNCTION: Send test admin notification immediately
   * Use this to test if admin push notifications are working
   */
  async sendTestAdminNotification(): Promise<void> {
    console.log('🧪 Sending TEST admin notification...');
    
    await this.sendAdminPushNotification({
      messageId: 'test_message_' + Date.now(),
      conversationId: 'test_conversation',
      customerId: 'test_customer',
      customerName: 'Test Customer',
      providerId: 'test_provider',
      providerName: 'Test Provider',
      providerPhone: '+1234567890',
      message: 'This is a test message to check if admin push notifications are working!',
      sentAt: new Date().toISOString()
    });
  }
}

// Export singleton instance
export const simpleMessageAlertService = new SimpleMessageAlertService();
