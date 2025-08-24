import { databases, DATABASE_ID, COLLECTIONS } from './appwrite';
import { ID, Query } from 'appwrite';

// Types for offer system
export interface Offer {
  id: string;
  conversation_id: string;
  provider_id: string;
  customer_id: string;
  
  // Offer details
  price: string;
  timeline: string;
  warranty: string;
  parts_type: string;
  description: string;
  selected_services: string[];
  
  // Status tracking
  status: 'pending' | 'processing' | 'accepted' | 'declined';
  created_at: string;
  accepted_at?: string;
  declined_at?: string;
  decline_reason?: string;
  
  // ✅ FIXED: Add device information for better offer targeting (stored as JSON string)
  device_info?: string; // JSON string containing { brand, model, category }
  
  // NEW: Booking relationship
  booking_id?: string;
  conversation_context?: any; // For device info and services
}

export interface CreateOfferData {
  conversation_id: string;
  provider_id: string;
  customer_id: string;
  price: string;
  timeline: string;
  warranty: string;
  parts_type: string;
  description: string;
  selected_services: string[];
  // ✅ FIXED: Add device information for better offer targeting (will be stored as JSON string)
  device_info: {
    brand: string;
    model: string;
    category: 'phone' | 'laptop';
  };
}

/**
 * Create a new offer
 */
export async function createOffer(offerData: CreateOfferData): Promise<{ success: boolean; offerId?: string; error?: string }> {
  try {
    const offer = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.OFFERS,
      ID.unique(),
      {
        conversation_id: offerData.conversation_id,
        provider_id: offerData.provider_id,
        customer_id: offerData.customer_id,
        price: offerData.price,
        timeline: offerData.timeline,
        warranty: offerData.warranty,
        parts_type: offerData.parts_type,
        description: offerData.description,
        selected_services: offerData.selected_services,
        // ✅ FIXED: Store device information in the offer as JSON string
        device_info: JSON.stringify(offerData.device_info),
        status: 'pending',
        created_at: new Date().toISOString()
      }
    );

    console.log('✅ Offer created:', offer.$id);
    return { success: true, offerId: offer.$id };

  } catch (error) {
    console.error('❌ Error creating offer:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get offers for a specific conversation
 */
export async function getOffersForConversation(conversationId: string): Promise<{ success: boolean; offers?: Offer[]; error?: string }> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.OFFERS,
      [
        Query.equal('conversation_id', conversationId),
        Query.orderDesc('created_at')
      ]
    );

    const offers: Offer[] = response.documents.map(doc => ({
      id: doc.$id,
      conversation_id: doc.conversation_id,
      provider_id: doc.provider_id,
      customer_id: doc.customer_id,
      price: doc.price,
      timeline: doc.timeline,
      warranty: doc.warranty,
      parts_type: doc.parts_type,
      description: doc.description,
      selected_services: doc.selected_services,
      status: doc.status,
      created_at: doc.created_at,
      accepted_at: doc.accepted_at,
      declined_at: doc.declined_at,
      decline_reason: doc.decline_reason,
      // ✅ FIXED: Include device_info in offer mapping (parse JSON string)
      device_info: doc.device_info ? JSON.parse(doc.device_info) : undefined,
      booking_id: doc.booking_id,
      conversation_context: doc.conversation_context
    }));

    return { success: true, offers };

  } catch (error) {
    console.error('❌ Error fetching offers for conversation:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get a specific offer by ID with conversation context
 */
export async function getOfferById(offerId: string): Promise<{ success: boolean; offer?: Offer & { conversation_context?: any }; error?: string }> {
  try {
    const response = await databases.getDocument(
      DATABASE_ID,
      COLLECTIONS.OFFERS,
      offerId
    );

    const offer: Offer & { conversation_context?: any } = {
      id: response.$id,
      conversation_id: response.conversation_id,
      provider_id: response.provider_id,
      customer_id: response.customer_id,
      price: response.price,
      timeline: response.timeline,
      warranty: response.warranty,
      parts_type: response.parts_type,
      description: response.description,
      selected_services: response.selected_services,
      status: response.status,
      created_at: response.created_at,
      accepted_at: response.accepted_at,
      declined_at: response.declined_at,
      decline_reason: response.decline_reason,
      // ✅ FIXED: Include device_info in offer mapping (parse JSON string)
      device_info: response.device_info ? JSON.parse(response.device_info) : undefined,
      booking_id: response.booking_id
    };

    // Fetch conversation context for device info and services
    try {
      const conversationResponse = await databases.getDocument(
        DATABASE_ID,
        'conversations',
        response.conversation_id
      );

      offer.conversation_context = {
        device_info: conversationResponse.device_info ? JSON.parse(conversationResponse.device_info) : null,
        services: conversationResponse.services || []
      };

      console.log('✅ Conversation context loaded:', offer.conversation_context);
    } catch (convError) {
      console.warn('⚠️ Could not load conversation context:', convError);
      offer.conversation_context = null;
    }

    return { success: true, offer };

  } catch (error) {
    console.error('❌ Error fetching offer by ID:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Accept an offer
 */
export async function acceptOffer(offerId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.OFFERS,
      offerId,
      {
        status: 'accepted',
        accepted_at: new Date().toISOString()
      }
    );

    console.log('✅ Offer accepted:', offerId);
    return { success: true };

  } catch (error) {
    console.error('❌ Error accepting offer:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Decline an offer
 */
export async function declineOffer(offerId: string, reason: string): Promise<{ success: boolean; error?: string }> {
  try {
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.OFFERS,
      offerId,
      {
        status: 'declined',
        declined_at: new Date().toISOString(),
        decline_reason: reason
      }
    );

    console.log('✅ Offer declined:', offerId, 'Reason:', reason);
    return { success: true };

  } catch (error) {
    console.error('❌ Error declining offer:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get all offers for a provider
 */
export async function getProviderOffers(providerId: string): Promise<{ success: boolean; offers?: Offer[]; error?: string }> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.OFFERS,
      [
        Query.equal('provider_id', providerId),
        Query.orderDesc('created_at')
      ]
    );

    const offers: Offer[] = response.documents.map(doc => ({
      id: doc.$id,
      conversation_id: doc.conversation_id,
      provider_id: doc.provider_id,
      customer_id: doc.customer_id,
      price: doc.price,
      timeline: doc.timeline,
      warranty: doc.warranty,
      parts_type: doc.parts_type,
      description: doc.description,
      selected_services: doc.selected_services,
      status: doc.status,
      created_at: doc.created_at,
      accepted_at: doc.accepted_at,
      declined_at: doc.declined_at,
      decline_reason: doc.decline_reason,
      // ✅ FIXED: Include device_info in offer mapping
      device_info: doc.device_info,
      booking_id: doc.booking_id,
      conversation_context: doc.conversation_context
    }));

    console.log('✅ Provider offers retrieved:', providerId, offers.length);
    return { success: true, offers };

  } catch (error) {
    console.error('❌ Error retrieving provider offers:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get all offers for a customer
 */
export async function getCustomerOffers(customerId: string): Promise<{ success: boolean; offers?: Offer[]; error?: string }> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.OFFERS,
      [
        Query.equal('customer_id', customerId),
        Query.orderDesc('created_at')
      ]
    );

    const offers: Offer[] = response.documents.map(doc => ({
      id: doc.$id,
      conversation_id: doc.conversation_id,
      provider_id: doc.provider_id,
      customer_id: doc.customer_id,
      price: doc.price,
      timeline: doc.timeline,
      warranty: doc.warranty,
      parts_type: doc.parts_type,
      description: doc.description,
      selected_services: doc.selected_services,
      status: doc.status,
      created_at: doc.created_at,
      accepted_at: doc.accepted_at,
      declined_at: doc.declined_at,
      decline_reason: doc.decline_reason,
      // ✅ FIXED: Include device_info in offer mapping
      device_info: doc.device_info,
      booking_id: doc.booking_id,
      conversation_context: doc.conversation_context
    }));

    console.log('✅ Customer offers retrieved:', customerId, offers.length);
    return { success: true, offers };

  } catch (error) {
    console.error('❌ Error retrieving customer offers:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Update offer status when booking is completed
 */
export async function updateOfferOnBookingComplete(offerId: string, bookingId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.OFFERS,
      offerId,
      {
        status: 'accepted',
        booking_id: bookingId,
        accepted_at: new Date().toISOString()
      }
    );

    console.log('✅ [OFFER-SERVICES] Offer updated successfully:', {
      offerId,
      bookingId,
      newStatus: 'accepted',
      acceptedAt: new Date().toISOString()
    });
    return { success: true };

  } catch (error) {
    console.error('❌ Error updating offer on booking completion:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

