import { client, databases, DATABASE_ID } from './appwrite';
import { ID, Query } from 'appwrite';
import { ChatMessage, Conversation } from './chat-services';
import { notificationService } from './notifications';

// Real-time chat service for instant messaging like Fiverr
export class RealtimeChatService {
  private subscriptions: Map<string, () => void> = new Map();
  private messageCallbacks: Map<string, (message: ChatMessage) => void> = new Map();
  private conversationCallbacks: Map<string, (conversations: Conversation[]) => void> = new Map();
  private typingCallbacks: Map<string, (data: { userId: string, isTyping: boolean }) => void> = new Map();
  private onlineStatusCallbacks: Map<string, (data: { userId: string, isOnline: boolean }) => void> = new Map();

  /**
   * Subscribe to real-time messages for a specific conversation
   */
  subscribeToMessages(conversationId: string, callback: (message: ChatMessage) => void): () => void {
    const subscriptionKey = `messages_${conversationId}`;
    
    // Remove existing subscription if any
    this.unsubscribe(subscriptionKey);
    
    // ✅ FIXED: Track optimistic messages per conversation
    const recentOptimisticMessages = new Set<string>();
    
    // Subscribe to new messages in this conversation
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.messages.documents`,
      (response) => {
        if (response.events.includes('databases.*.collections.*.documents.*.create')) {
          const message = response.payload as any;
          
          // Only process messages for this conversation
          if (message.conversation_id === conversationId) {
            const chatMessage: ChatMessage = {
              id: message.$id,
              conversation_id: message.conversation_id,
              sender_id: message.sender_id,
              sender_type: message.sender_type,
              message_type: message.message_type || 'text',
              content: message.content,
              metadata: message.metadata ? JSON.parse(message.metadata) : {},
              created_at: message.created_at
            };
            
            // Check if this is a duplicate of a recent optimistic message from the SAME user
            const messageKey = `${message.sender_id}_${message.content}_${message.sender_type}`;
            
            if (recentOptimisticMessages.has(messageKey)) {
              recentOptimisticMessages.delete(messageKey);
              return;
            }
            
            callback(chatMessage);
          }
        }
      }
    );

    // ✅ FIXED: Store optimistic messages tracking per conversation
    this.subscriptions.set(subscriptionKey, unsubscribe);
    this.messageCallbacks.set(subscriptionKey, callback);
    
    // Store optimistic messages tracking for this conversation
    (this as any)[`recentOptimisticMessages_${conversationId}`] = recentOptimisticMessages;
    
    return () => this.unsubscribe(subscriptionKey);
  }

  /**
   * Subscribe to conversation updates for a user
   */
  subscribeToConversations(userId: string, userType: 'customer' | 'provider', callback: (conversations: Conversation[]) => void): () => void {
    const subscriptionKey = `conversations_${userId}`;
    
    // Remove existing subscription if any
    this.unsubscribe(subscriptionKey);
    
    // Subscribe to conversation updates
    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.conversations.documents`,
      async (response) => {
        // Refetch conversations when any conversation is updated
        if (response.events.some(event => 
          event.includes('databases.*.collections.*.documents.*.create') ||
          event.includes('databases.*.collections.*.documents.*.update')
        )) {
          try {
            const field = userType === 'customer' ? 'customer_id' : 'provider_id';
            const result = await databases.listDocuments(
              DATABASE_ID,
              'conversations',
              [
                Query.equal(field, userId),
                Query.orderDesc('last_message_at'),
                Query.limit(50)
              ]
            );

            // Parse and return conversations
            const conversations = result.documents.map(doc => ({
              ...doc,
              id: doc.$id,
              device_info: doc.device_info ? JSON.parse(doc.device_info) : {},
              services: Array.isArray(doc.services) ? doc.services : []
            })) as unknown as Conversation[];

            callback(conversations);
          } catch (error) {
            console.error('Error refetching conversations:', error);
          }
        }
      }
    );

    this.subscriptions.set(subscriptionKey, unsubscribe);
    this.conversationCallbacks.set(subscriptionKey, callback);
    
    return () => this.unsubscribe(subscriptionKey);
  }

  /**
   * Send message with optimistic updates and deduplication
   */
  async sendMessageOptimistic(
    conversationId: string,
    senderId: string,
    senderType: 'customer' | 'provider',
    content: string,
    onOptimisticUpdate?: (tempMessage: ChatMessage) => void,
    onSuccess?: (message: ChatMessage) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    // Generate unique temp ID to prevent duplicates
    const tempId = `temp_${senderId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create optimistic message for instant UI update
    const tempMessage: ChatMessage = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: senderId,
      sender_type: senderType,
      message_type: 'text',
      content: content,
      created_at: new Date().toISOString()
    };

          // Mark this optimistic message to avoid real-time duplicate
    const messageKey = `${senderId}_${content}_${senderType}`;
    
    // Use conversation-specific optimistic message tracking
    const recentOptimisticMessages = (this as any)[`recentOptimisticMessages_${conversationId}`];
    
    if (recentOptimisticMessages) {
      recentOptimisticMessages.add(messageKey);
      // Remove after 10 seconds to prevent memory leaks
      setTimeout(() => {
        recentOptimisticMessages?.delete(messageKey);
      }, 10000);
    }

    // Show optimistic update immediately
    onOptimisticUpdate?.(tempMessage);

    try {
      // ✅ FIXED: Only check for exact duplicates from the same user in the same conversation
      // This prevents blocking legitimate messages while still preventing spam
      const recentMessages = await databases.listDocuments(
        DATABASE_ID,
        'messages',
        [
          Query.equal('conversation_id', conversationId),
          Query.equal('sender_id', senderId),
          Query.equal('content', content),
          Query.orderDesc('created_at'),
          Query.limit(1)
        ]
      );

      // If identical message was sent in last 2 seconds, prevent duplicate
      if (recentMessages.documents.length > 0) {
        const lastMessage = recentMessages.documents[0];
        const timeDiff = Date.now() - new Date(lastMessage.created_at).getTime();
        
        if (timeDiff < 2000) { // Reduced to 2 seconds for better UX
          // Use existing message instead
          const existingMessage: ChatMessage = {
            id: lastMessage.$id,
            conversation_id: lastMessage.conversation_id,
            sender_id: lastMessage.sender_id,
            sender_type: lastMessage.sender_type,
            message_type: lastMessage.message_type,
            content: lastMessage.content,
            metadata: lastMessage.metadata ? JSON.parse(lastMessage.metadata) : {},
            created_at: lastMessage.created_at
          };
          
          onSuccess?.(existingMessage);
          return;
        }
      }

      // Send actual message to server
      const message = await databases.createDocument(
        DATABASE_ID,
        'messages',
        ID.unique(),
        {
          conversation_id: conversationId,
          sender_id: senderId,
          sender_type: senderType,
          message_type: 'text',
          content: content,
          metadata: '{}',
          created_at: new Date().toISOString()
        }
      );

      // Update conversation's last message time
      await databases.updateDocument(
        DATABASE_ID,
        'conversations',
        conversationId,
        {
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      );

      // Create notification for RECIPIENT only (not sender)
      try {
        // Get conversation details to determine recipient
        const conversation = await databases.getDocument(
          DATABASE_ID,
          'conversations',
          conversationId
        );

        if (conversation) {
          // Determine recipient (opposite of sender)
          const recipientId = message.sender_type === 'customer' 
            ? conversation.provider_id 
            : conversation.customer_id;
          
          const recipientType = message.sender_type === 'customer' ? 'provider' : 'customer';
          
          // Ensure we're not notifying the sender
          if (recipientId !== message.sender_id) {
            // Get sender name for notification
            let senderName = 'Someone';
            try {
              // 🆕 ENHANCED: Detect sender type and fetch appropriate name
              const senderType = message.sender_type || 'customer';
              
              if (senderType === 'provider') {
                // 🏢 PROVIDER: Fetch business name from business_setup collection
                try {
                  const businessSetupResponse = await databases.listDocuments(
                    DATABASE_ID,
                    'business_setup',
                    [Query.equal('user_id', message.sender_id), Query.limit(1)]
                  );
                  
                  if (businessSetupResponse.documents.length > 0) {
                    const onboardingData = businessSetupResponse.documents[0].onboarding_data;
                    if (onboardingData) {
                      try {
                        const parsedData = JSON.parse(onboardingData);
                        if (parsedData.businessInfo?.businessName) {
                          senderName = parsedData.businessInfo.businessName;
                        }
                      } catch (parseError) {
                        // Silent fallback
                      }
                    }
                  }
                  
                  // Fallback to User collection if no business name found
                  if (senderName === 'Someone') {
                    const userResponse = await databases.listDocuments(
                      DATABASE_ID,
                      'User',
                      [Query.equal('user_id', message.sender_id), Query.limit(1)]
                    );
                    
                    if (userResponse.documents.length > 0) {
                      senderName = userResponse.documents[0].name;
                    }
                  }
                } catch (businessError) {
                  // Fallback to User collection
                  const userResponse = await databases.listDocuments(
                    DATABASE_ID,
                    'User',
                    [Query.equal('user_id', message.sender_id), Query.limit(1)]
                  );
                  
                  if (userResponse.documents.length > 0) {
                    senderName = userResponse.documents[0].name;
                  }
                }
              } else {
                // 👤 CUSTOMER: Fetch customer name from customers collection
                try {
                  const customerResponse = await databases.listDocuments(
                    DATABASE_ID,
                    'customers',
                    [Query.equal('user_id', message.sender_id), Query.limit(1)]
                  );
                  
                  if (customerResponse.documents.length > 0) {
                    senderName = customerResponse.documents[0].full_name;
                  }
                } catch (customerError) {
                  // Silent fallback
                }
                
                // Fallback to User collection if customer not found
                if (senderName === 'Someone') {
                  const senderUser = await databases.listDocuments(
                    DATABASE_ID,
                    'User',
                    [Query.equal('user_id', message.sender_id), Query.limit(1)]
                  );
                  
                  if (senderUser.documents.length > 0) {
                    senderName = senderUser.documents[0].name;
                  }
                }
              }
              
            } catch (error) {
              console.error('🔔 [FIVERR] Error fetching sender name:', error);
              // Keep default 'Someone' if all queries fail
            }

            // 🚀 ENHANCED: Create Fiverr-style notification with smart grouping
            const notificationResult = await notificationService.createNotification({
              type: 'message',
              category: 'chat',
              priority: 'medium',
              title: 'New Message',
              message: `New message from ${senderName}`,
              userId: recipientId,
              userType: recipientType,
              relatedId: conversationId,
              relatedType: 'conversation',
              // 🆕 NEW: Fiverr-style fields for smart grouping
              senderId: message.sender_id,
              senderName: senderName,
              messagePreview: content, // Show actual message content instead of generic text
              metadata: {
                messageId: message.$id,
                senderId: message.sender_id,
                senderName,
                conversationId
              }
            }, {
              skipIfActiveChat: true
            });

            // Silent success - no debug logging needed
          }
        }
      } catch (notificationError) {
        console.error('🔔 [FIVERR] Error creating notification:', notificationError);
        // Silently handle notification errors
      }

      // Success callback with real message
      const realMessage: ChatMessage = {
        id: message.$id,
        conversation_id: message.conversation_id,
        sender_id: message.sender_id,
        sender_type: message.sender_type,
        message_type: message.message_type,
        content: message.content,
        metadata: message.metadata ? JSON.parse(message.metadata) : {},
        created_at: message.created_at
      };

      onSuccess?.(realMessage);

    } catch (error) {
      console.error('❌ Error sending message:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to send message');
    }
  }

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(conversationId: string, userId: string, isTyping: boolean): Promise<void> {
    // Use Appwrite's real-time channels for typing indicators
    // We'll use a custom channel pattern for ephemeral typing data
    try {
      // Broadcast typing status to all subscribers of this conversation
      const typingKey = `typing_${conversationId}`;
      const callback = this.typingCallbacks.get(typingKey);
      
      if (callback) {
        callback({ userId, isTyping });
      }
      
      // TODO: In production, implement real-time typing indicators using:
      // 1. Appwrite's real-time channels with custom events
      // 2. A dedicated typing_indicators collection with TTL
      // 3. WebSocket channels for ephemeral data
      // 
      // For now, the local callback system works within the same browser session
      // but won't sync across different users or browser tabs
      
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  }

  /**
   * Subscribe to typing indicators
   */
  subscribeToTyping(conversationId: string, callback: (data: { userId: string, isTyping: boolean }) => void): () => void {
    const subscriptionKey = `typing_${conversationId}`;
    this.typingCallbacks.set(subscriptionKey, callback);
    
    return () => this.typingCallbacks.delete(subscriptionKey);
  }

  /**
   * Update online status
   */
  async updateOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    // This would typically update a user's online status in the database
    // and emit real-time events to subscribers
    
    // For now, we'll just emit to local callbacks
    this.onlineStatusCallbacks.forEach(callback => {
      callback({ userId, isOnline });
    });
  }

  /**
   * Subscribe to online status changes
   */
  subscribeToOnlineStatus(callback: (data: { userId: string, isOnline: boolean }) => void): () => void {
    const subscriptionKey = `online_status_${Date.now()}`;
    this.onlineStatusCallbacks.set(subscriptionKey, callback);
    
    return () => this.onlineStatusCallbacks.delete(subscriptionKey);
  }

  /**
   * Get conversation messages with efficient pagination
   */
  async getMessages(conversationId: string, limit: number = 50, offset?: string): Promise<{
    success: boolean;
    messages?: ChatMessage[];
    nextOffset?: string;
    error?: string;
  }> {
    try {
      const queries = [
        Query.equal('conversation_id', conversationId),
        Query.orderDesc('created_at'),
        Query.limit(limit)
      ];

      if (offset) {
        queries.push(Query.cursorBefore(offset));
      }

      const result = await databases.listDocuments(
        DATABASE_ID,
        'messages',
        queries
      );

      const messages = result.documents.map(doc => ({
        id: doc.$id,
        conversation_id: doc.conversation_id,
        sender_id: doc.sender_id,
        sender_type: doc.sender_type,
        message_type: doc.message_type || 'text',
        content: doc.content,
        metadata: doc.metadata ? JSON.parse(doc.metadata) : {},
        created_at: doc.created_at
      })) as ChatMessage[];

      return {
        success: true,
        messages,
        nextOffset: result.documents.length === limit ? result.documents[result.documents.length - 1].$id : undefined
      };

    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Unsubscribe from a specific subscription
   */
  private unsubscribe(subscriptionKey: string): void {
    const unsubscribeFn = this.subscriptions.get(subscriptionKey);
    if (unsubscribeFn) {
      unsubscribeFn();
      this.subscriptions.delete(subscriptionKey);
    }
    
    // Clean up callbacks
    this.messageCallbacks.delete(subscriptionKey);
    this.conversationCallbacks.delete(subscriptionKey);
    this.typingCallbacks.delete(subscriptionKey);
  }

  // Fresh notification system will be implemented here

  /**
   * Clean up all subscriptions
   */
  cleanup(): void {
    this.subscriptions.forEach((unsubscribe) => unsubscribe());
    this.subscriptions.clear();
    this.messageCallbacks.clear();
    this.conversationCallbacks.clear();
    this.typingCallbacks.clear();
    this.onlineStatusCallbacks.clear();
  }
}

// Export singleton instance
export const realtimeChat = new RealtimeChatService();

// Helper function to get optimized conversations with last messages
export async function getOptimizedConversations(
  userId: string,
  userType: 'customer' | 'provider'
): Promise<{ success: boolean; conversations?: Conversation[]; error?: string }> {
  try {
    const field = userType === 'customer' ? 'customer_id' : 'provider_id';
    
    // Get conversations
    const conversations = await databases.listDocuments(
      DATABASE_ID,
      'conversations',
      [
        Query.equal(field, userId),
        Query.orderDesc('last_message_at'),
        Query.limit(50)
      ]
    );

    // Get all conversation IDs
    const conversationIds = conversations.documents.map(doc => doc.$id);
    
    // Get last messages for all conversations in a single query
    const lastMessages = await databases.listDocuments(
      DATABASE_ID,
      'messages',
      [
        Query.equal('conversation_id', conversationIds),
        Query.orderDesc('created_at'),
        Query.limit(conversations.documents.length * 2) // Buffer for multiple messages per conversation
      ]
    );

    // Create a map of conversation ID to last message
    const lastMessageMap = new Map<string, any>();
    lastMessages.documents.forEach(msg => {
      if (!lastMessageMap.has(msg.conversation_id)) {
        lastMessageMap.set(msg.conversation_id, msg);
      }
    });

    // Parse conversations with last message data
    const parsedConversations = conversations.documents.map(doc => {
      const lastMsg = lastMessageMap.get(doc.$id);
      
      return {
        ...doc,
        id: doc.$id,
        device_info: doc.device_info ? JSON.parse(doc.device_info) : {},
        services: Array.isArray(doc.services) ? doc.services : [],
        last_message_content: lastMsg?.content || '',
        last_message_sender: lastMsg?.sender_type
      };
    }) as unknown as Conversation[];

    return { success: true, conversations: parsedConversations };

  } catch (error) {
    console.error('❌ Error fetching optimized conversations:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
