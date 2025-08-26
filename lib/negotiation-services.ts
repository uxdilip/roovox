import { databases, DATABASE_ID } from './appwrite';
import { ID } from 'appwrite';
import { notificationService } from './notifications';
// Fresh notification system will be implemented

// Types for negotiation system - simplified to match actual collections
export interface QuoteRequestData {
  budget_min?: number;
  budget_max?: number;
  requirements: string; // Will be stored in additional_notes
  timeline: 'asap' | '1-2_days' | '1_week' | 'flexible';
  urgency_level: 'low' | 'medium' | 'high';
  provider_id: string;
  device_info: {
    brand: string;
    model: string;
    category?: string; // Not stored in DB, just for UI
  };
}

export interface CustomerRequest {
  id: string;
  customer_id: string;
  provider_id: string;
  device_brand: string;
  device_model: string;
  service_issues: string[];
  budget_min: number;
  budget_max: number;
  requirements: string;
  timeline: string;
  urgency_level: string;
  additional_notes?: string;
  status: 'pending' | 'responded' | 'accepted' | 'declined' | 'expired';
  created_at: string;
  updated_at: string;
  initial_tier_prices: Record<string, number>;
}

export interface NegotiationChat {
  id: string;
  request_id: string;
  messages: Array<{
    sender_id: string;
    sender_type: 'customer' | 'provider' | 'system';
    message_type: 'text' | 'offer' | 'system';
    message_content: string;
    created_at: string;
  }>;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

/**
 * Create a new customer quote request
 */
export async function createCustomerRequest(
  customerId: string,
  requestData: QuoteRequestData
): Promise<{ success: boolean; requestId?: string; error?: string }> {
  try {
    console.log('🔍 Creating customer request for provider:', requestData.provider_id);
    
    // Create the customer request document with ONLY the fields that actually exist in your collection
    const requestDoc = await databases.createDocument(
      DATABASE_ID,
      'customer_requests',
      ID.unique(),
      {
        // Required fields
        customer_id: customerId,
        provider_id: requestData.provider_id,
        device_brand: requestData.device_info.brand,
        device_model: requestData.device_info.model,
        urgency_level: requestData.urgency_level,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        
        // Optional fields (only if they exist in the collection)
        ...(requestData.timeline && { timeline: requestData.timeline }),
        ...(requestData.budget_min && { budget_min: requestData.budget_min.toString() }),
        ...(requestData.budget_max && { budget_max: requestData.budget_max.toString() }),
        
        // Put requirements in additional_notes since requirements field doesn't exist
        additional_notes: requestData.requirements || ''
      }
    );

    console.log('✅ Customer request created:', requestDoc.$id);

    // Create the initial conversation message
    const chatDoc = await databases.createDocument(
      DATABASE_ID,
      'negotiation_chats',
      ID.unique(),
      {
        request_id: requestDoc.$id,
        sender_id: customerId,
        sender_type: 'customer',
        message_type: 'request',
        created_at: new Date().toISOString(),
        attachments: '',
        offer_data: ''
      }
    );

    console.log('✅ Negotiation chat created:', chatDoc.$id);

    // Send email notifications (don't fail if emails fail)
    try {
      // Get provider and customer email addresses
      const providerUser = await databases.listDocuments(
        DATABASE_ID,
        'User',
        [
          // Note: We'll filter client-side for now
        ]
      );

      const customerUser = await databases.listDocuments(
        DATABASE_ID,
        'User',
        [
          // Note: We'll filter client-side for now
        ]
      );

      const provider = providerUser.documents.find((u: any) => u.user_id === requestData.provider_id);
      const customer = customerUser.documents.find((u: any) => u.user_id === customerId);

      // Email notifications removed - using in-app notifications instead
      console.log('📧 Email notifications disabled - using in-app notifications');

      // 🔔 NEW: Create in-app notifications
      try {
      console.log('🔔 Creating in-app notifications for quote request...');
      
      // Notify provider about new quote request
      await notificationService.createNotification({
        type: 'offer',
        category: 'business', // NEW: Mark as business notification
        priority: 'high',
        title: 'New Quote Request',
        message: `New ${requestData.device_info.brand} ${requestData.device_info.model} repair request`,
        userId: requestData.provider_id,
        userType: 'provider',
        relatedId: requestDoc.$id,
        relatedType: 'quote_request',
        metadata: { 
          requestId: requestDoc.$id, 
          deviceInfo: requestData.device_info,
          customerId: customerId,
          timeline: requestData.timeline,
          urgency: requestData.urgency_level
        }
      });

      // Notify customer about quote request submission
      await notificationService.createNotification({
        type: 'offer',
        category: 'business', // NEW: Mark as business notification
        priority: 'medium',
        title: 'Quote Request Sent',
        message: `Your quote request has been sent to the provider`,
        userId: customerId,
        userType: 'customer',
        relatedId: requestDoc.$id,
        relatedType: 'quote_request',
        metadata: { 
          requestId: requestDoc.$id, 
          deviceInfo: requestData.device_info,
          providerId: requestData.provider_id
        }
      });

      console.log('✅ In-app notifications created successfully');
    } catch (notificationError) {
      console.error('❌ Error creating in-app notifications (non-fatal):', notificationError);
      // Continue without failing the request creation
    }

    return {
      success: true,
      requestId: requestDoc.$id
    };

  } catch (error) {
    console.error('❌ Error creating customer request:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get all customer requests for a specific provider
 */
export async function getProviderRequests(
  providerId: string
): Promise<{ success: boolean; requests?: CustomerRequest[]; error?: string }> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      'customer_requests',
      [
        // Query for requests where provider_id matches
        // Note: We'll need to create an index for this field
        // For now, we'll get all and filter client-side
      ]
    );

    // Filter requests for this provider
    const providerRequests = response.documents
      .filter((doc: any) => doc.provider_id === providerId)
      .map((doc: any) => ({
        id: doc.$id,
        customer_id: doc.customer_id,
        provider_id: doc.provider_id,
        device_brand: doc.device_brand,
        device_model: doc.device_model,
        service_issues: doc.service_issues,
        budget_min: doc.budget_min,
        budget_max: doc.budget_max,
        requirements: doc.requirements,
        timeline: doc.timeline,
        urgency_level: doc.urgency_level,
        additional_notes: doc.additional_notes,
        status: doc.status,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        initial_tier_prices: doc.initial_tier_prices
      }));

    return {
      success: true,
      requests: providerRequests
    };

  } catch (error) {
    console.error('❌ Error fetching provider requests:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get all customer requests for a specific customer
 */
export async function getCustomerRequests(
  customerId: string
): Promise<{ success: boolean; requests?: CustomerRequest[]; error?: string }> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      'customer_requests',
      [
        // Query for requests where customer_id matches
        // Note: We'll need to create an index for this field
        // For now, we'll get all and filter client-side
      ]
    );

    // Filter requests for this customer
    const customerRequests = response.documents
      .filter((doc: any) => doc.customer_id === customerId)
      .map((doc: any) => ({
        id: doc.$id,
        customer_id: doc.customer_id,
        provider_id: doc.provider_id,
        device_brand: doc.device_brand,
        device_model: doc.device_model,
        service_issues: doc.service_issues,
        budget_min: doc.budget_min,
        budget_max: doc.budget_max,
        requirements: doc.requirements,
        timeline: doc.timeline,
        urgency_level: doc.urgency_level,
        additional_notes: doc.additional_notes,
        status: doc.status,
        created_at: doc.created_at,
        updated_at: doc.updated_at,
        initial_tier_prices: doc.initial_tier_prices
      }));

    return {
      success: true,
      requests: customerRequests
    };

  } catch (error) {
    console.error('❌ Error fetching customer requests:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get negotiation conversation for a specific request
 */
export async function getNegotiationChat(
  requestId: string
): Promise<{ success: boolean; chat?: NegotiationChat; error?: string }> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      'negotiation_chats',
      [
        // Query for conversation where request_id matches
        // Note: We'll need to create an index for this field
        // For now, we'll get all and filter client-side
      ]
    );

    // Find conversations for this request
    const chatMessages = response.documents.filter((doc: any) => doc.request_id === requestId);

    if (chatMessages.length === 0) {
      return {
        success: false,
        error: 'Conversation not found for this request'
      };
    }

    // Convert to the expected format
    const chat: NegotiationChat = {
      id: requestId, // Use request_id as the chat id
      request_id: requestId,
      messages: chatMessages.map((doc: any) => ({
        sender_id: doc.sender_id,
        sender_type: doc.sender_type,
        message_type: doc.message_type,
        message_content: doc.offer_data || 'Quote request submitted',
        created_at: doc.created_at
      })),
      status: 'active',
      created_at: chatMessages[0]?.created_at || new Date().toISOString(),
      updated_at: chatMessages[chatMessages.length - 1]?.created_at || new Date().toISOString()
    };

    return {
      success: true,
      chat
    };

  } catch (error) {
    console.error('❌ Error fetching negotiation conversation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Check if there's an active negotiation between customer and provider
 */
export async function hasActiveNegotiation(
  customerId: string,
  providerId: string
): Promise<{ success: boolean; hasActive?: boolean; error?: string }> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      'customer_requests',
      [
        // Query for active requests between customer and provider
        // Note: We'll need to create an index for this field
        // For now, we'll get all and filter client-side
      ]
    );

    // Check if there's an active request
    const hasActive = response.documents.some((doc: any) => 
      doc.customer_id === customerId && 
      doc.provider_id === providerId && 
      doc.status === 'pending'
    );

    return {
      success: true,
      hasActive
    };

  } catch (error) {
    console.error('❌ Error checking active negotiation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
