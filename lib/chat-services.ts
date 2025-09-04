import { databases, DATABASE_ID } from './appwrite';
import { ID, Query } from 'appwrite';

// Types for chat system
export interface Conversation {
  id: string;
  customer_id: string;
  provider_id: string;
  device_info: {
    brand: string;
    model: string;
    category: 'phone' | 'laptop';
  };
  services: string[];
  status: 'active' | 'completed' | 'archived';
  last_message_at: string;
  last_message_content?: string;
  last_message_sender?: 'customer' | 'provider';
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: 'customer' | 'provider';
  message_type: 'text' | 'quote_request' | 'offer';
  content: string;
  metadata?: {
    quote_request?: {
      budget_min: number;
      budget_max: number;
      timeline: string;
      additional_notes?: string;
    };
    offer?: {
      price: number;
      timeline: string;
      warranty: string;
      terms: string;
    };
  };
  created_at: string;
}

export interface ContactOption {
  type: 'quote' | 'chat';
  label: string;
  icon: string;
  description: string;
}

// Contact options for provider cards
export const CONTACT_OPTIONS: ContactOption[] = [
  {
    type: 'quote',
    label: 'Get a quote',
    icon: '📋',
    description: 'Send detailed requirements for custom pricing'
  },
  {
    type: 'chat',
    label: 'Ask a question',
    icon: '💬',
    description: 'Start a conversation directly'
  }
];

/**
 * Find existing conversation between customer and provider
 */
export async function findExistingConversation(
  customerId: string,
  providerId: string,
  deviceInfo: { brand: string; model: string; category: 'phone' | 'laptop' }
): Promise<{ success: boolean; conversation?: Conversation; error?: string }> {
  try {
    
    // First, find conversations between this customer and provider
    const conversations = await databases.listDocuments(
      DATABASE_ID,
      'conversations',
      [
        Query.equal('customer_id', customerId),
        Query.equal('provider_id', providerId),
        Query.equal('status', 'active'),
        Query.orderDesc('last_message_at'),
        Query.limit(10)
      ]
    );

    if (conversations.documents.length === 0) {
      return { success: true, conversation: undefined };
    }


    // Look for exact device match first (most relevant)
    for (const conv of conversations.documents) {
      try {
        const convDeviceInfo = JSON.parse(conv.device_info);
        if (convDeviceInfo.brand === deviceInfo.brand && 
            convDeviceInfo.model === deviceInfo.model &&
            convDeviceInfo.category === deviceInfo.category) {
          
          return {
            success: true,
            conversation: {
              id: conv.$id,
              customer_id: conv.customer_id,
              provider_id: conv.provider_id,
              device_info: convDeviceInfo,
              services: Array.isArray(conv.services) ? conv.services : [],
              status: conv.status,
              last_message_at: conv.last_message_at,
              created_at: conv.created_at,
              updated_at: conv.updated_at
            }
          };
        }
      } catch (parseError) {
        console.warn('Could not parse device_info for conversation:', conv.$id);
      }
    }

    // If no exact device match, return the most recent conversation
    const mostRecent = conversations.documents[0];
    
    try {
      const convDeviceInfo = JSON.parse(mostRecent.device_info);
      return {
        success: true,
        conversation: {
          id: mostRecent.$id,
          customer_id: mostRecent.customer_id,
          provider_id: mostRecent.provider_id,
          device_info: convDeviceInfo,
          services: Array.isArray(mostRecent.services) ? mostRecent.services : [],
          status: mostRecent.status,
          last_message_at: mostRecent.last_message_at,
          created_at: mostRecent.created_at,
          updated_at: mostRecent.updated_at
        }
      };
    } catch (parseError) {
      console.warn('Could not parse device_info for most recent conversation');
      return { success: true, conversation: undefined };
    }

  } catch (error) {
    console.error('❌ Error finding existing conversation:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Create a new conversation between customer and provider
 */
export async function createConversation(
  customerId: string,
  providerId: string,
  deviceInfo: { brand: string; model: string; category: 'phone' | 'laptop' },
  services: string[]
): Promise<{ success: boolean; conversationId?: string; error?: string }> {
  try {
    const conversation = await databases.createDocument(
      DATABASE_ID,
      'conversations',
      ID.unique(),
      {
        customer_id: customerId,
        provider_id: providerId,
        device_info: JSON.stringify(deviceInfo),
        services: services,
        status: 'active',
        last_message_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    );

    return { success: true, conversationId: conversation.$id };

  } catch (error) {
    console.error('❌ Error creating conversation:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Update existing conversation with new services
 */
export async function updateConversationServices(
  conversationId: string,
  newServices: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await databases.updateDocument(
      DATABASE_ID,
      'conversations',
      conversationId,
      {
        services: newServices,
        updated_at: new Date().toISOString()
      }
    );

    return { success: true };

  } catch (error) {
    console.error('❌ Error updating conversation services:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Send a message in a conversation
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  senderType: 'customer' | 'provider',
  content: string,
  messageType: 'text' | 'quote_request' | 'offer' = 'text',
  metadata?: any
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const message = await databases.createDocument(
      DATABASE_ID,
      'messages',
      ID.unique(),
      {
        conversation_id: conversationId,
        sender_id: senderId,
        sender_type: senderType,
        message_type: messageType,
        content: content,
        metadata: metadata ? JSON.stringify(metadata) : '{}',
        created_at: new Date().toISOString()
      }
    );

    // Update conversation's last_message_at
    await databases.updateDocument(
      DATABASE_ID,
      'conversations',
      conversationId,
      {
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    );

    return { success: true, messageId: message.$id };

  } catch (error) {
    console.error('❌ Error sending message:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get all conversations for a user (customer or provider)
 */
export async function getUserConversations(
  userId: string,
  userType: 'customer' | 'provider'
): Promise<{ success: boolean; conversations?: Conversation[]; error?: string }> {
  try {
    const field = userType === 'customer' ? 'customer_id' : 'provider_id';
    
    const conversations = await databases.listDocuments(
      DATABASE_ID,
      'conversations',
      [
        Query.equal(field, userId),
        Query.orderDesc('last_message_at'),
        Query.limit(50)
      ]
    );

    
    // Parse JSON fields and fetch last messages
    const parsedConversations = await Promise.all(
      conversations.documents.map(async (doc) => {
        // Get the last message for this conversation
        let lastMessageContent = '';
        let lastMessageSender: 'customer' | 'provider' | undefined;
        
        try {
          const lastMessage = await databases.listDocuments(
            DATABASE_ID,
            'messages',
            [
              Query.equal('conversation_id', doc.$id),
              Query.orderDesc('created_at'),
              Query.limit(1)
            ]
          );
          
          if (lastMessage.documents.length > 0) {
            const msg = lastMessage.documents[0];
            lastMessageContent = msg.content || '';
            lastMessageSender = msg.sender_type;
          }
        } catch (msgError) {
          console.warn('Could not fetch last message for conversation:', doc.$id);
        }
        
        return {
          ...doc,
          id: doc.$id, // Map Appwrite $id to id
          device_info: doc.device_info ? JSON.parse(doc.device_info) : {},
          services: Array.isArray(doc.services) ? doc.services : [],
          last_message_content: lastMessageContent,
          last_message_sender: lastMessageSender
        };
      })
    );
    
    return { success: true, conversations: parsedConversations as unknown as Conversation[] };

  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get all messages in a conversation
 */
export async function getConversationMessages(
  conversationId: string
): Promise<{ success: boolean; messages?: ChatMessage[]; error?: string }> {
  try {
    const messages = await databases.listDocuments(
      DATABASE_ID,
      'messages',
      [
        Query.equal('conversation_id', conversationId),
        Query.orderAsc('created_at'),
        Query.limit(100)
      ]
    );

    
    // Parse JSON fields from Appwrite documents
    const parsedMessages = messages.documents.map(doc => ({
      ...doc,
      id: doc.$id, // Map Appwrite $id to id
      metadata: doc.metadata ? JSON.parse(doc.metadata) : {}
    })) as unknown as ChatMessage[];
    
    return { success: true, messages: parsedMessages };

  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Check if conversation exists between customer and provider
 * Updated to find ANY conversation between customer and provider, regardless of device/services
 */
export async function getExistingConversation(
  customerId: string,
  providerId: string
): Promise<{ success: boolean; conversation?: Conversation; error?: string }> {
  try {
    const conversations = await databases.listDocuments(
      DATABASE_ID,
      'conversations',
      [
        Query.equal('customer_id', customerId),
        Query.equal('provider_id', providerId),
        Query.equal('status', 'active'),
        Query.orderDesc('last_message_at'), // Get the most recent one
        Query.limit(1)
      ]
    );

    if (conversations.documents.length > 0) {
      const doc = conversations.documents[0];
      return { 
        success: true, 
        conversation: {
          ...doc,
          id: doc.$id,
          device_info: doc.device_info ? JSON.parse(doc.device_info) : {},
          services: Array.isArray(doc.services) ? doc.services : []
        } as unknown as Conversation
      };
    }

    return { success: true, conversation: undefined };

  } catch (error) {
    console.error('❌ Error checking existing conversation:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Update existing conversation with new device/service information
 */
export async function updateConversationContext(
  conversationId: string,
  newDeviceInfo?: { brand: string; model: string; category: 'phone' | 'laptop' },
  newServices?: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current conversation
    const currentConv = await databases.getDocument(
      DATABASE_ID,
      'conversations',
      conversationId
    );

    // Merge device info and services
    const currentDeviceInfo = currentConv.device_info ? JSON.parse(currentConv.device_info) : {};
    const currentServices = Array.isArray(currentConv.services) ? currentConv.services : [];

    // Update with new information
    const updatedDeviceInfo = newDeviceInfo || currentDeviceInfo;
    const updatedServices = newServices ? 
      [...new Set([...currentServices, ...newServices])] : // Merge and deduplicate
      currentServices;

    await databases.updateDocument(
      DATABASE_ID,
      'conversations',
      conversationId,
      {
        device_info: JSON.stringify(updatedDeviceInfo),
        services: updatedServices,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    );

    return { success: true };

  } catch (error) {
    console.error('❌ Error updating conversation context:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
