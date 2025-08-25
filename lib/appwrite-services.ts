import { Client, Account, Databases, Storage, Functions } from 'appwrite';

// Server-side client with admin privileges
const serverClient = new Client();

serverClient
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '687398a90012d5a8d92f');

// For server-side operations, we'll use the client without API key for now
// In production, you would set up proper authentication
export const serverAccount = new Account(serverClient);
export const serverDatabases = new Databases(serverClient);
export const serverStorage = new Storage(serverClient);
export const serverFunctions = new Functions(serverClient);

export { serverClient };

export const SERVER_DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '687399d400185ad33867';

import { databases, DATABASE_ID, COLLECTIONS } from './appwrite';
import { Permission, Role } from 'appwrite';
import { Device, Provider, Service, Booking } from '@/types';
import { Query } from 'appwrite';
import { storage } from './appwrite';
import { ID } from 'appwrite';
import { notificationService } from './notifications';

const MAX_LIMIT = 100;

// Device Services
export const getDevices = async (): Promise<Device[]> => {
  let allDevices: any[] = [];
  let offset = 0;
  let keepFetching = true;

  while (keepFetching) {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.DEVICES,
      [Query.limit(MAX_LIMIT), Query.offset(offset)]
    );
    allDevices = allDevices.concat(response.documents);
    if (response.documents.length < MAX_LIMIT) {
      keepFetching = false;
    } else {
      offset += MAX_LIMIT;
    }
  }

  return allDevices.map(doc => ({
      id: doc.$id,
      category: doc.category,
      brand: doc.brand,
      model: doc.model,
      specifications: JSON.parse(doc.specifications || '{}'),
      common_issues: JSON.parse(doc.common_issues || '[]'),
      image_url: doc.image_url
    }));
};

export const getDevicesByCategory = async (category: 'phone' | 'laptop'): Promise<Device[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID, 
      COLLECTIONS.DEVICES,
      [
        Query.equal('category', category),
        Query.limit(MAX_LIMIT)
      ]
    );
    return response.documents.map(doc => ({
      id: doc.$id,
      category: doc.category,
      brand: doc.brand,
      model: doc.model,
      specifications: JSON.parse(doc.specifications || '{}'),
      common_issues: JSON.parse(doc.common_issues || '[]'),
      image_url: doc.image_url
    }));
  } catch (error) {
    console.error('Error fetching devices by category:', error);
    return [];
  }
};

export const getDevicesByBrand = async (brand: string): Promise<Device[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID, 
      COLLECTIONS.DEVICES,
      [Query.equal('brand', brand)]
    );
    return response.documents.map(doc => ({
      id: doc.$id,
      category: doc.category,
      brand: doc.brand,
      model: doc.model,
      specifications: JSON.parse(doc.specifications || '{}'),
      common_issues: JSON.parse(doc.common_issues || '[]'),
      image_url: doc.image_url
    }));
  } catch (error) {
    console.error('Error fetching devices by brand:', error);
    return [];
  }
};

export const getDeviceById = async (id: string): Promise<Device | null> => {
  try {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.DEVICES, id);
    return {
      id: doc.$id,
      category: doc.category,
      brand: doc.brand,
      model: doc.model,
      specifications: JSON.parse(doc.specifications || '{}'),
      common_issues: JSON.parse(doc.common_issues || '[]'),
      image_url: doc.image_url
    };
  } catch (error) {
    console.error('Error fetching device by ID:', error);
    return null;
  }
};

export const getPhones = async (): Promise<Device[]> => {
  let allPhones: any[] = [];
  let offset = 0;
  let keepFetching = true;
  while (keepFetching) {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.PHONES,
      [Query.limit(MAX_LIMIT), Query.offset(offset)]
    );
    allPhones = allPhones.concat(response.documents);
    if (response.documents.length < MAX_LIMIT) {
      keepFetching = false;
    } else {
      offset += MAX_LIMIT;
    }
  }
  return allPhones.map(doc => ({
    id: doc.$id,
    brand: doc.brand,
    model: doc.model,
    category: 'phone',
    specifications: {},
    common_issues: [],
    image_url: doc.image_url || ''
  }));
};

export const getLaptops = async (): Promise<Device[]> => {
  let allLaptops: any[] = [];
  let offset = 0;
  let keepFetching = true;
  while (keepFetching) {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.LAPTOPS,
      [Query.limit(MAX_LIMIT), Query.offset(offset)]
    );
    allLaptops = allLaptops.concat(response.documents);
    if (response.documents.length < MAX_LIMIT) {
      keepFetching = false;
    } else {
      offset += MAX_LIMIT;
    }
  }
  return allLaptops.map(doc => ({
    id: doc.$id,
    brand: doc.brand,
    model: doc.model,
    category: 'laptop',
    specifications: {},
    common_issues: [],
    image_url: doc.image_url || ''
  }));
};

// Provider Services
export const getProviders = async (): Promise<Provider[]> => {
  try {
    const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROVIDERS);
    return response.documents.map(doc => ({
      id: doc.$id,
      user_id: doc.user_id,
      business_name: doc.business_name,
      specializations: doc.specializations || [],
      service_radius: doc.service_radius,
      working_hours: JSON.parse(doc.working_hours || '[]'),
      ratings: doc.ratings,
      total_bookings: doc.total_bookings,
      verification_status: doc.verification_status,
      documents: doc.documents || [],
      commission_rate: doc.commission_rate,
      subscription_tier: doc.subscription_tier
    }));
  } catch (error) {
    console.error('Error fetching providers:', error);
    return [];
  }
};

export const getVerifiedProviders = async (): Promise<Provider[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID, 
      COLLECTIONS.PROVIDERS,
      [Query.equal('verification_status', 'verified')]
    );
    return response.documents.map(doc => ({
      id: doc.$id,
      user_id: doc.user_id,
      business_name: doc.business_name,
      specializations: doc.specializations || [],
      service_radius: doc.service_radius,
      working_hours: JSON.parse(doc.working_hours || '[]'),
      ratings: doc.ratings,
      total_bookings: doc.total_bookings,
      verification_status: doc.verification_status,
      documents: doc.documents || [],
      commission_rate: doc.commission_rate,
      subscription_tier: doc.subscription_tier
    }));
  } catch (error) {
    console.error('Error fetching verified providers:', error);
    return [];
  }
};

export const createProvider = async (providerData: any) => {
  try {
    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.PROVIDERS,
      'unique()',
      providerData
    );
    return doc;
  } catch (error) {
    console.error('Error creating provider:', error);
    throw error;
  }
};

// Get provider profile by user ID
export const getProviderByUserId = async (userId: string): Promise<Provider | null> => {
  try {
    // Use providerId as that's what the schema expects
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.PROVIDERS,
      [Query.equal('providerId', userId), Query.limit(1)]
    );
    
    if (response.documents.length === 0) return null;
    const doc = response.documents[0];
    
    // Try to fetch business setup data for additional details
    let businessDetails = null;
    try {
      const businessResponse = await databases.listDocuments(
        DATABASE_ID,
        'business_setup',
        [Query.equal('user_id', userId), Query.limit(1)]
      );
      
      if (businessResponse.documents.length > 0) {
        businessDetails = JSON.parse(businessResponse.documents[0].onboarding_data || '{}');
      }
    } catch (error) {
      console.error('Error fetching business setup data:', error);
    }
    
    return {
      id: doc.$id,
      user_id: doc.providerId, // Map providerId to user_id for consistency
      business_name: businessDetails?.businessSetup?.business?.name || businessDetails?.personalDetails?.fullName || 'Your Business',
      specializations: businessDetails?.serviceSetup?.specializations || [],
      service_radius: businessDetails?.businessSetup?.business?.radius || 10,
      working_hours: businessDetails?.serviceSetup?.availability || [],
      ratings: 0, // Default value since not in schema
      total_bookings: 0, // Default value since not in schema
      verification_status: doc.isVerified ? 'verified' : 'pending',
      documents: [], // Default empty array since not in schema
      commission_rate: 0.1, // Default value since not in schema
      subscription_tier: 'basic' // Default value since not in schema
    };
  } catch (error) {
    console.error('Error fetching provider by user_id:', error);
    return null;
  }
};

// Create a minimal provider profile for onboarding
export const createProviderProfile = async (userId: string, email: string, phone: string) => {
  try {
    const providerData = {
      user_id: userId,
      business_name: '',
      contact_email: email,
      contact_phone: phone,
      address: '',
      verification_status: 'pending',
      documents: [],
      payment_info: '',
      created_at: new Date().toISOString(),
      specializations: [],
      service_radius: 0,
      working_hours: JSON.stringify([]),
      ratings: 0,
      total_bookings: 0,
      commission_rate: 0,
      subscription_tier: 'basic',
    };
    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.PROVIDERS,
      'unique()',
      providerData
    );
    return doc;
  } catch (error) {
    console.error('Error creating provider profile:', error);
    throw error;
  }
};

export const updateProviderWorkingHours = async (providerId: string, workingHours: Provider['working_hours']) => {
  try {
    const doc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.PROVIDERS,
      providerId,
      { working_hours: JSON.stringify(workingHours) }
    );
    return doc;
  } catch (error) {
    console.error('Error updating provider working hours:', error);
    throw error;
  }
};

// Service Services
export const getServicesByDeviceId = async (deviceId: string): Promise<Service[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID, 
      COLLECTIONS.SERVICES,
      [Query.equal('device_id', deviceId)]
    );
    return response.documents.map(doc => ({
      id: doc.$id,
      device_id: doc.device_id,
      name: doc.name,
      description: doc.description,
      base_price: doc.base_price,
      part_qualities: JSON.parse(doc.part_qualities || '[]')
    }));
  } catch (error) {
    console.error('Error fetching services by device ID:', error);
    return [];
  }
};

// Booking Services
export const createBooking = async (bookingData: Omit<Booking, 'id' | 'created_at' | 'updated_at'>): Promise<Booking | null> => {
  try {
    // Validate required fields
    const requiredFields = ['customer_id', 'provider_id', 'device_id', 'service_id', 'appointment_time', 'total_amount'];
    for (const field of requiredFields) {
      if (!(bookingData as any)[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.BOOKINGS,
      'unique()',
      {
        ...bookingData,
        status: bookingData.status || 'pending',
        payment_status: bookingData.payment_status || 'pending',
        rating: bookingData.rating || 0,
        review: bookingData.review || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    );
    
    return {
      id: doc.$id,
      customer_id: doc.customer_id,
      provider_id: doc.provider_id,
      device_id: doc.device_id,
      service_id: doc.service_id,
      issue_description: doc.issue_description,
      part_quality: doc.part_quality,
      status: doc.status,
      appointment_time: doc.appointment_time,
      total_amount: doc.total_amount,
      payment_status: doc.payment_status,
      location_type: doc.location_type,
      customer_address: doc.customer_address,
      rating: doc.rating,
      review: doc.review,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
      payment_method: doc.payment_method || 'online',
      selected_issues: doc.selected_issues || doc.issue_description || '',
      warranty: doc.warranty || '30 days',
      serviceMode: doc.serviceMode || 'home_service'
    };
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

export const getBookingsByCustomerId = async (customerId: string): Promise<Booking[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID, 
      COLLECTIONS.BOOKINGS,
      [Query.equal('customer_id', customerId), Query.orderDesc('created_at')]
    );
    return response.documents.map(doc => ({
      id: doc.$id,
      customer_id: doc.customer_id,
      provider_id: doc.provider_id,
      device_id: doc.device_id,
      service_id: doc.service_id,
      issue_description: doc.issue_description,
      part_quality: doc.part_quality,
      status: doc.status,
      appointment_time: doc.appointment_time,
      total_amount: doc.total_amount,
      payment_status: doc.payment_status,
      location_type: doc.location_type,
      customer_address: doc.customer_address,
      rating: doc.rating,
      review: doc.review,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
      payment_method: doc.payment_method || 'online',
      selected_issues: doc.selected_issues || doc.issue_description || '',
      warranty: doc.warranty || '30 days',
      serviceMode: doc.serviceMode || 'home_service'
    }));
  } catch (error) {
    console.error('Error fetching bookings by customer ID:', error);
    return [];
  }
};

export const getBookingsByProviderId = async (providerId: string): Promise<Booking[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID, 
      COLLECTIONS.BOOKINGS,
      [Query.equal('provider_id', providerId), Query.orderDesc('created_at')]
    );
    return response.documents.map(doc => ({
      id: doc.$id,
      customer_id: doc.customer_id,
      provider_id: doc.provider_id,
      device_id: doc.device_id,
      service_id: doc.service_id,
      issue_description: doc.issue_description,
      part_quality: doc.part_quality,
      status: doc.status,
      appointment_time: doc.appointment_time,
      total_amount: doc.total_amount,
      payment_status: doc.payment_status,
      location_type: doc.location_type,
      customer_address: doc.customer_address,
      rating: doc.rating,
      review: doc.review,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
      payment_method: doc.payment_method || 'online',
      selected_issues: doc.selected_issues || doc.issue_description || '',
      warranty: doc.warranty || '30 days',
      serviceMode: doc.serviceMode || 'home_service'
    }));
  } catch (error) {
    console.error('Error fetching bookings by provider ID:', error);
    return [];
  }
};

export const getBookingById = async (bookingId: string): Promise<Booking | null> => {
  try {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.BOOKINGS, bookingId);
    return {
      id: doc.$id,
      customer_id: doc.customer_id,
      provider_id: doc.provider_id,
      device_id: doc.device_id,
      service_id: doc.service_id,
      issue_description: doc.issue_description,
      part_quality: doc.part_quality,
      status: doc.status,
      appointment_time: doc.appointment_time,
      total_amount: doc.total_amount,
      payment_status: doc.payment_status,
      location_type: doc.location_type,
      customer_address: doc.customer_address,
      rating: doc.rating,
      review: doc.review,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
      payment_method: doc.payment_method || 'online',
      selected_issues: doc.selected_issues || doc.issue_description || '',
      warranty: doc.warranty || '30 days',
      serviceMode: doc.serviceMode || 'home_service'
    };
  } catch (error) {
    console.error('Error fetching booking by ID:', error);
    return null;
  }
};

export const updateBookingStatus = async (bookingId: string, status: string, notes?: string) => {
  try {
    const updateData: any = { 
      status, 
      updated_at: new Date().toISOString() 
    };
    
    if (notes) {
      updateData.work_notes = notes;
    }
    
    const doc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.BOOKINGS,
      bookingId,
      updateData
    );
    return doc;
  } catch (error) {
    console.error('Error updating booking status:', error);
    throw error;
  }
};

export const updateBookingPayment = async (bookingId: string, paymentMethod: string) => {
  try {
    const doc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.BOOKINGS,
      bookingId,
      { 
        payment_status: 'completed', 
        payment_method: paymentMethod, 
        updated_at: new Date().toISOString() 
      }
    );

    // 🔔 NEW: Create payment notification
    try {
      console.log('🔔 Creating payment notification...');
      
      // Get booking details for notification
      const booking = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.BOOKINGS,
        bookingId
      );

      if (booking) {
        const deviceInfo = booking.device_info ? JSON.parse(booking.device_info) : {};
        const deviceName = `${deviceInfo.brand || 'Device'} ${deviceInfo.model || ''}`.trim();
        
        // Notify customer about payment completion
        await notificationService.createNotification({
          type: 'payment',
          category: 'business', // NEW: Mark as business notification
          priority: 'high',
          title: 'Payment Confirmed',
          message: `Payment of ₹${booking.total_amount || 0} confirmed for your ${deviceName} repair`,
          userId: booking.customer_id,
          userType: 'customer',
          relatedId: bookingId,
          relatedType: 'payment',
          metadata: { 
            bookingId,
            amount: booking.total_amount,
            paymentMethod,
            deviceInfo: booking.device_info
          }
        });

        // Notify provider about payment received
        await notificationService.createNotification({
          type: 'payment',
          category: 'business', // NEW: Mark as business notification
          priority: 'high',
          title: 'Payment Received',
          message: `Payment of ₹${booking.total_amount || 0} received for ${deviceName} repair`,
          userId: booking.provider_id,
          userType: 'provider',
          relatedId: bookingId,
          relatedType: 'payment',
          metadata: { 
            bookingId,
            amount: booking.total_amount,
            paymentMethod,
            deviceInfo,
            customerId: booking.customer_id
          }
        });

        console.log('✅ Payment notifications created successfully');
      }
    } catch (notificationError) {
      console.error('❌ Error creating payment notifications (non-fatal):', notificationError);
      // Continue without failing the payment update
    }

    return doc;
  } catch (error) {
    console.error('Error updating booking payment:', error);
    throw error;
  }
};

export const updateBookingRating = async (bookingId: string, rating: number, review?: string) => {
  try {
    if (rating < 0 || rating > 5) {
      throw new Error('Rating must be between 0 and 5');
    }
    
    const updateData: any = { 
      rating, 
      updated_at: new Date().toISOString() 
    };
    
    if (review !== undefined) {
      updateData.review = review;
    }
    
    const doc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.BOOKINGS,
      bookingId,
      updateData
    );
    return doc;
  } catch (error) {
    console.error('Error updating booking rating:', error);
    throw error;
  }
};

export const updateBookingCancelReschedule = async (bookingId: string, action: 'cancel' | 'reschedule', data: { reason?: string, newTime?: string }) => {
  try {
    let updateData: any = { updated_at: new Date().toISOString() };
    
    if (action === 'cancel') {
      updateData.status = 'cancelled';
      updateData.cancelled_at = new Date().toISOString();
      if (data.reason) updateData.cancel_reason = data.reason;
    } else if (action === 'reschedule') {
      updateData.status = 'pending';
      updateData.rescheduled_at = new Date().toISOString();
      if (data.newTime) updateData.appointment_time = data.newTime;
    }
    
    const doc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.BOOKINGS,
      bookingId,
      updateData
    );
    return doc;
  } catch (error) {
    console.error('Error updating booking for cancel/reschedule:', error);
    throw error;
  }
};

export const getBookingStats = async (userId: string, userType: 'customer' | 'provider') => {
  try {
    const field = userType === 'customer' ? 'customer_id' : 'provider_id';
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.BOOKINGS,
      [Query.equal(field, userId)]
    );
    
    const bookings = response.documents;
    const stats = {
      total: bookings.length,
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      in_progress: bookings.filter(b => b.status === 'in_progress').length,
      completed: bookings.filter(b => b.status === 'completed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      totalRevenue: bookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (b.total_amount || 0), 0),
      averageRating: 0
    };
    
    const ratedBookings = bookings.filter(b => b.rating && b.rating > 0);
    if (ratedBookings.length > 0) {
      stats.averageRating = ratedBookings.reduce((sum, b) => sum + b.rating, 0) / ratedBookings.length;
    }
    
    return stats;
  } catch (error) {
    console.error('Error fetching booking stats:', error);
    return {
      total: 0,
      pending: 0,
      confirmed: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      totalRevenue: 0,
      averageRating: 0
    };
  }
};

// Address management (new collection: addresses)
export const createAddress = async (address: Record<string, any>) => {
  try {
    return await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.ADDRESSES,
      'unique()',
      address
    );
  } catch (error) {
    console.log('Addresses collection not found, skipping address creation');
    return null;
  }
};

export const updateAddress = async (addressId: string, address: Record<string, any>) => {
  try {
    return await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.ADDRESSES,
      addressId,
      address
    );
  } catch (error) {
    console.log('Addresses collection not found, skipping address update');
    return null;
  }
};

export const deleteAddress = async (addressId: string) => {
  try {
    return await databases.deleteDocument(
      DATABASE_ID,
      COLLECTIONS.ADDRESSES,
      addressId
    );
  } catch (error) {
    console.log('Addresses collection not found, skipping address deletion');
    return null;
  }
};

export const getAddressesByUser = async (userId: string) => {
  try {
    const res = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.ADDRESSES,
      [Query.equal('user_id', userId)]
    );
    return res.documents;
  } catch (error) {
    // If addresses collection doesn't exist, return empty array
    console.log('Addresses collection not found, returning empty array');
    return [];
  }
};

export const setDefaultAddress = async (addressId: string, userId: string) => {
  // Unset previous default
  const addresses = await getAddressesByUser(userId);
  for (const addr of addresses) {
    if (addr.is_default && addr.$id !== addressId) {
      await updateAddress(addr.$id, { is_default: false });
    }
  }
  // Set new default
  return await updateAddress(addressId, { is_default: true });
};

export const updateUserPhone = async (userId: string, phone: string) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      'User',
      [Query.equal('user_id', userId), Query.limit(1)]
    );
    if (response.documents.length > 0) {
      const docId = response.documents[0].$id;
      return await databases.updateDocument(
        DATABASE_ID,
        'User',
        docId,
        { phone }
      );
    }
  } catch (error) {
    console.error('Error updating user phone:', error);
    throw error;
  }
}; 

export const updateUserRole = async (userId: string, role: 'customer' | 'provider' | 'admin') => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      'User',
      [Query.equal('user_id', userId), Query.limit(1)]
    );
    if (response.documents.length > 0) {
      const docId = response.documents[0].$id;
      const currentRoles = response.documents[0].roles ? JSON.parse(response.documents[0].roles) : [];
      const updatedRoles = [...new Set([...currentRoles, role])];
      
      return await databases.updateDocument(
        DATABASE_ID,
        'User',
        docId,
        { 
          roles: JSON.stringify(updatedRoles),
          active_role: role
        }
      );
    }
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

export const updateUserProfile = async (userId: string, userData: {
  name?: string;
  email?: string;
  phone?: string;
  role?: 'customer' | 'provider' | 'admin';
}) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      'User',
      [Query.equal('user_id', userId), Query.limit(1)]
    );
    if (response.documents.length > 0) {
      const docId = response.documents[0].$id;
      const updateData: any = {};
      
      if (userData.name) updateData.name = userData.name;
      if (userData.email) updateData.email = userData.email;
      if (userData.phone) updateData.phone = userData.phone;
      if (userData.role) {
        const currentRoles = response.documents[0].roles ? JSON.parse(response.documents[0].roles) : [];
        const updatedRoles = [...new Set([...currentRoles, userData.role])];
        updateData.roles = JSON.stringify(updatedRoles);
        updateData.active_role = userData.role;
      }
      
      updateData.updated_at = new Date().toISOString();
      
      return await databases.updateDocument(
        DATABASE_ID,
        'User',
        docId,
        updateData
      );
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const createBusinessSetup = async (data: {
  user_id: string,
  onboarding_data: any,
  created_at: string,
}) => {
  try {
    const doc = await databases.createDocument(
      DATABASE_ID,
      'business_setup',
      'unique()',
      {
        user_id: data.user_id,
        onboarding_data: JSON.stringify(data.onboarding_data),
        created_at: data.created_at,
      },
      [
        Permission.read(Role.any()),
        Permission.write(Role.any()),
        Permission.update(Role.any()),
        Permission.delete(Role.any()),
        Permission.read(Role.users()),
        Permission.write(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ]
    );
    return doc;
  } catch (error) {
    console.error('Error creating business setup document:', error);
    throw error;
  }
}; 

export const upsertBusinessSetup = async (data: {
  user_id: string,
  onboarding_data: any,
  created_at?: string,
}) => {
  try {
    // Check if a document exists for this user_id
    const response = await databases.listDocuments(
      DATABASE_ID,
      'business_setup',
      [Query.equal('user_id', data.user_id), Query.limit(1)]
    );
    if (response.documents.length > 0) {
      // Update existing document
      const docId = response.documents[0].$id;
      // Fetch and merge existing onboarding_data
      let prevData = {};
      try {
        prevData = response.documents[0].onboarding_data ? JSON.parse(response.documents[0].onboarding_data) : {};
      } catch { prevData = {}; }
      const merged = { ...prevData, ...data.onboarding_data };
      return await databases.updateDocument(
        DATABASE_ID,
        'business_setup',
        docId,
        {
          onboarding_data: JSON.stringify(merged),
        },
        [
          Permission.read(Role.any()),
          Permission.write(Role.any()),
          Permission.update(Role.any()),
          Permission.delete(Role.any()),
          Permission.read(Role.users()),
          Permission.write(Role.users()),
          Permission.update(Role.users()),
          Permission.delete(Role.users()),
        ]
      );
    } else {
      // Create new document with permissions
      return await createBusinessSetup({
        user_id: data.user_id,
        onboarding_data: data.onboarding_data || {},
        created_at: data.created_at || new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error upserting business setup document:', error);
    throw error;
  }
}; 

export const updateBusinessSetupKycDocs = async (user_id: string, kyc_docs: any): Promise<any> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      'business_setup',
      [Query.equal('user_id', user_id), Query.limit(1)]
    );
    if (response.documents.length > 0) {
      const docId = response.documents[0].$id;
      return await databases.updateDocument(
        DATABASE_ID,
        'business_setup',
        docId,
        { kyc_docs: JSON.stringify(kyc_docs) },
        [
          Permission.read(Role.any()),
          Permission.write(Role.any()),
          Permission.update(Role.any()),
          Permission.delete(Role.any()),
          Permission.read(Role.users()),
          Permission.write(Role.users()),
          Permission.update(Role.users()),
          Permission.delete(Role.users()),
        ]
      );
    } else {
      // Create new business_setup document with kyc_docs
      return await databases.createDocument(
        DATABASE_ID,
        'business_setup',
        'unique()',
        {
          user_id: user_id,
          kyc_docs: JSON.stringify(kyc_docs),
          onboarding_data: JSON.stringify({}),
          created_at: new Date().toISOString(),
        },
        [
          Permission.read(Role.any()),
          Permission.write(Role.any()),
          Permission.update(Role.any()),
          Permission.delete(Role.any()),
          Permission.read(Role.users()),
          Permission.write(Role.users()),
          Permission.update(Role.users()),
          Permission.delete(Role.users()),
        ]
      );
    }
  } catch (error: any) {
    console.error('Error updating business_setup kyc_docs:', error);
    
    // If the error is about invalid structure, the attribute might still be processing
    if (error.code === 400 && error.message.includes('kyc_docs')) {
      console.log('⚠️ KYC docs attribute might still be processing. Retrying in 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return updateBusinessSetupKycDocs(user_id, kyc_docs);
    }
    
    throw error;
  }
}; 

export const getBrandsByCategory = async (category: 'phone' | 'laptop'): Promise<{ key: string; label: string }[]> => {
  try {
    // Try to get brands from the brands collection first
    const response = await databases.listDocuments(
      DATABASE_ID,
      'brands',
      [Query.equal('category_id', category)]
    );
    
    if (response.documents.length > 0) {
      return response.documents.map((doc: any) => ({
        key: doc.name,
        label: doc.name.charAt(0).toUpperCase() + doc.name.slice(1)
      }));
    }
    
    // If no brands found, return common brands based on category
    const commonBrands = category === 'phone' ? [
      { key: 'Apple', label: 'Apple' },
      { key: 'Samsung', label: 'Samsung' },
      { key: 'OnePlus', label: 'OnePlus' },
      { key: 'Xiaomi', label: 'Xiaomi' },
      { key: 'Realme', label: 'Realme' },
      { key: 'Oppo', label: 'Oppo' },
      { key: 'Vivo', label: 'Vivo' },
      { key: 'Nothing', label: 'Nothing' },
      { key: 'Google', label: 'Google' },
      { key: 'Motorola', label: 'Motorola' },
      { key: 'Poco', label: 'Poco' },
      { key: 'Honor', label: 'Honor' },
      { key: 'Nokia', label: 'Nokia' },
      { key: 'Asus', label: 'Asus' },
    ] : [
      { key: 'Apple', label: 'Apple' },
      { key: 'Dell', label: 'Dell' },
      { key: 'HP', label: 'HP' },
      { key: 'Lenovo', label: 'Lenovo' },
      { key: 'ASUS', label: 'ASUS' },
      { key: 'Acer', label: 'Acer' },
      { key: 'MSI', label: 'MSI' },
      { key: 'Razer', label: 'Razer' },
      { key: 'Alienware', label: 'Alienware' },
    ];
    
    return commonBrands;
  } catch (error) {
    console.error('Error fetching brands by category:', error);
    
    // Fallback to common brands
    const fallbackBrands = category === 'phone' ? [
      { key: 'Apple', label: 'Apple' },
      { key: 'Samsung', label: 'Samsung' },
      { key: 'OnePlus', label: 'OnePlus' },
      { key: 'Xiaomi', label: 'Xiaomi' },
      { key: 'Realme', label: 'Realme' },
      { key: 'Oppo', label: 'Oppo' },
      { key: 'Vivo', label: 'Vivo' },
      { key: 'Nothing', label: 'Nothing' },
      { key: 'Google', label: 'Google' },
      { key: 'Motorola', label: 'Motorola' },
      { key: 'Poco', label: 'Poco' },
      { key: 'Honor', label: 'Honor' },
      { key: 'Nokia', label: 'Nokia' },
      { key: 'Asus', label: 'Asus' },
    ] : [
      { key: 'Apple', label: 'Apple' },
      { key: 'Dell', label: 'Dell' },
      { key: 'HP', label: 'HP' },
      { key: 'Lenovo', label: 'Lenovo' },
      { key: 'ASUS', label: 'ASUS' },
      { key: 'Acer', label: 'Acer' },
    ];
    
    return fallbackBrands;
  }
}; 

// Upload a file to provider_docs bucket and return the file ID
export const uploadProviderDoc = async (file: File, userId: string) => {
  try {
    const result = await storage.createFile(
      'provider_docs',
      'unique()',
      file,
      [
        Permission.read(Role.user(userId)),
        Permission.delete(Role.user(userId)),
      ]
    );
    return result.$id;
  } catch (error) {
    console.error('Error uploading provider doc:', error);
    throw error;
  }
}; 

// Save or update onboarding step for business_setup
export async function saveOnboardingStep(userId: string, stepData: any) {
  try {
    // Try to update, if not found, create
    await databases.updateDocument(DATABASE_ID, COLLECTIONS.BUSINESS_SETUP, userId, stepData);
  } catch (err: any) {
    if (err.code === 404) {
      await databases.createDocument(DATABASE_ID, COLLECTIONS.BUSINESS_SETUP, userId, {
        user_id: userId,
        ...stepData,
        created_at: new Date().toISOString(),
      });
    } else {
      throw err;
    }
  }
}

// Mark onboarding complete in providers collection
export async function completeProviderOnboarding(userId: string) {
  await databases.updateDocument(DATABASE_ID, COLLECTIONS.PROVIDERS, userId, {
    businessSetupId: userId,
    onboardingCompleted: true,
    isApproved: false,
  });
}

// Create service offered document
export const createServiceOffered = async (serviceData: {
  providerId: string;
  deviceType: string;
  brand: string;
  model: string | null;
  issue: string;
  partType: string | null;
  price: number;
  warranty: string | null;
  created_at: string;
}) => {
  try {
    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.SERVICES_OFFERED,
      'unique()',
      {
        providerId: serviceData.providerId,
        deviceType: serviceData.deviceType,
        brand: serviceData.brand,
        model: serviceData.model,
        issue: serviceData.issue,
        partType: serviceData.partType,
        price: serviceData.price,
        warranty: serviceData.warranty,
        created_at: serviceData.created_at,
      }
    );
    console.log(`✅ Created service offered: ${serviceData.brand} ${serviceData.model || ''} ${serviceData.issue}`);
    return doc;
  } catch (error) {
    console.error('Error creating service offered:', error);
    throw error;
  }
};

// Get services offered by a provider
export const getServicesOfferedByProvider = async (providerId: string) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.SERVICES_OFFERED,
      [Query.equal('providerId', providerId)]
    );
    return response.documents;
  } catch (error) {
    console.error('Error fetching services offered by provider:', error);
    return [];
  }
};

// Test function removed for production 

// New User Collection Functions
export const createUserDocument = async (userData: {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  roles?: string[];
  activeRole?: 'customer' | 'provider';
  isVerified?: boolean;
  isActive?: boolean;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  addressLat?: number;
  addressLng?: number;
}) => {
  try {
    // Check if user already exists in User collection
    const response = await databases.listDocuments(
      DATABASE_ID,
      'User',
      [Query.equal('user_id', userData.userId), Query.limit(1)]
    );
    
    if (response.documents.length > 0) {
      // User exists, update their document
      const existingDoc = response.documents[0];
      const currentRoles = existingDoc.roles ? JSON.parse(existingDoc.roles) : [];
      
      // Add new roles if not present
      const newRoles = userData.roles || ['customer'];
      const updatedRoles = [...new Set([...currentRoles, ...newRoles])];
      
      const updateData: any = {
        name: userData.name,
        email: userData.email,
        roles: JSON.stringify(updatedRoles),
        updated_at: new Date().toISOString()
      };
      
      // Only update fields that are provided
      if (userData.phone !== undefined) updateData.phone = userData.phone;
      if (userData.isVerified !== undefined) updateData.is_verified = userData.isVerified;
      if (userData.isActive !== undefined) updateData.is_active = userData.isActive;
      if (userData.addressCity !== undefined) updateData.address_city = userData.addressCity;
      if (userData.addressState !== undefined) updateData.address_state = userData.addressState;
      if (userData.addressZip !== undefined) updateData.address_zip = userData.addressZip;
      if (userData.addressLat !== undefined) updateData.address_lat = userData.addressLat;
      if (userData.addressLng !== undefined) updateData.address_lng = userData.addressLng;
      
      const updatedDoc = await databases.updateDocument(
        DATABASE_ID,
        'User',
        existingDoc.$id,
        updateData
      );
      
      console.log('✅ User document updated:', updatedDoc.$id);
      return updatedDoc;
    } else {
      // Create new user document
      const newUserData = {
        user_id: userData.userId,
        name: userData.name,
        email: userData.email,
        phone: userData.phone || '',
        roles: JSON.stringify(userData.roles || ['customer']),
        active_role: userData.activeRole || (userData.roles && userData.roles.length > 0 ? userData.roles[0] : 'customer'),
        is_verified: userData.isVerified || false,
        is_active: userData.isActive !== undefined ? userData.isActive : true,
        address_city: userData.addressCity || '',
        address_state: userData.addressState || '',
        address_zip: userData.addressZip || '',
        address_lat: userData.addressLat || 0,
        address_lng: userData.addressLng || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const newDoc = await databases.createDocument(
        DATABASE_ID,
        'User',
        ID.unique(),
        newUserData
      );
      
      console.log('✅ New user document created:', newDoc.$id);
      return newDoc;
    }
  } catch (error) {
    console.error('❌ Error creating/updating user document:', error);
    throw error;
  }
};

export const getUserByUserId = async (userId: string) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      'User',
      [Query.equal('user_id', userId), Query.limit(1)]
    );
    
    if (response.documents.length > 0) {
      const userDoc = response.documents[0];
      return {
        id: userDoc.$id,
        userId: userDoc.user_id,
        name: userDoc.name,
        email: userDoc.email,
        phone: userDoc.phone || '',
        roles: userDoc.roles ? JSON.parse(userDoc.roles) : ['customer'],
        activeRole: userDoc.active_role || 'customer',
        isVerified: userDoc.is_verified || false,
        isActive: userDoc.is_active !== undefined ? userDoc.is_active : true,
        address: {
          city: userDoc.address_city || '',
          state: userDoc.address_state || '',
          zip: userDoc.address_zip || '',
          lat: userDoc.address_lat || 0,
          lng: userDoc.address_lng || 0
        },
        createdAt: userDoc.created_at,
        updatedAt: userDoc.updated_at
      };
    }
    return null;
  } catch (error) {
    console.error('❌ Error fetching user by userId:', error);
    return null;
  }
};

export const updateUserDocument = async (userId: string, updateData: any) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      'User',
      [Query.equal('user_id', userId), Query.limit(1)]
    );
    
    if (response.documents.length > 0) {
      const existingDoc = response.documents[0];
      const updatedDoc = await databases.updateDocument(
        DATABASE_ID,
        'User',
        existingDoc.$id,
        {
          ...updateData,
          updated_at: new Date().toISOString()
        }
      );
      
      console.log('✅ User document updated:', updatedDoc.$id);
      return updatedDoc;
    }
    return null;
  } catch (error) {
    console.error('❌ Error updating user document:', error);
    throw error;
  }
};

export const addProviderRole = async (userId: string) => {
  try {
    const user = await getUserByUserId(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    const currentRoles = user.roles;
    if (!currentRoles.includes('provider')) {
      const updatedRoles = [...currentRoles, 'provider'];
      await updateUserDocument(userId, {
        roles: JSON.stringify(updatedRoles)
      });
      console.log('✅ Provider role added to user:', userId);
    } else {
      console.log('ℹ️ User already has provider role:', userId);
    }
  } catch (error) {
    console.error('❌ Error adding provider role:', error);
    throw error;
  }
}; 

export const updateUserActiveRole = async (userId: string, activeRole: 'customer' | 'provider') => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      'User',
      [Query.equal('user_id', userId), Query.limit(1)]
    );
    
    if (response.documents.length > 0) {
      const existingDoc = response.documents[0];
      const updatedDoc = await databases.updateDocument(
        DATABASE_ID,
        'User',
        existingDoc.$id,
        {
          active_role: activeRole,
          updated_at: new Date().toISOString()
        }
      );
      
      console.log('✅ User active role updated:', activeRole);
      return updatedDoc;
    }
    return null;
  } catch (error) {
    console.error('❌ Error updating user active role:', error);
    throw error;
  }
}; 

export const addProviderRoleToUser = async (userId: string) => {
  try {
    // Get current user document directly from database
    const response = await databases.listDocuments(
      DATABASE_ID,
      'User',
      [Query.equal('user_id', userId), Query.limit(1)]
    );
    
    if (response.documents.length === 0) {
      throw new Error('User document not found');
    }
    
    const userDoc = response.documents[0];
    
    // Check if provider role already exists
    const currentRoles = userDoc.roles ? JSON.parse(userDoc.roles) : [];
    if (currentRoles.includes('provider')) {
      console.log('Provider role already exists for user');
      return userDoc;
    }
    
    // Add provider role to roles array
    const updatedRoles = [...currentRoles, 'provider'];
    
    // Update the user document using the correct field names
    const updatedUser = await databases.updateDocument(
      DATABASE_ID,
      'User',
      userDoc.$id,
      {
        roles: JSON.stringify(updatedRoles)
      }
    );
    
    console.log('Provider role added to user:', updatedUser);
    return updatedUser;
  } catch (error) {
    console.error('Error adding provider role to user:', error);
    throw error;
  }
}; 

// Fetch issues by category (with pagination and sorting)
export const getIssuesByCategory = async (categoryId: string, limit = 50, offset = 0) => {
  // Assumes COLLECTIONS.ISSUES is set to the correct collection ID for issues
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.ISSUES,
      [
        Query.equal('category_id', categoryId),
        Query.limit(limit),
        Query.offset(offset),
        Query.orderAsc('name')
      ]
    );
    return response.documents.map(doc => ({
      id: doc.$id,
      name: doc.name,
      description: doc.description || '',
      category_id: doc.category_id
    }));
  } catch (error) {
    console.error('Error fetching issues by category:', error);
    return [];
  }
}; 

export const createCustomerProfile = async (customerData: {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  address?: string;
}) => {
  try {
    console.log('🆕 Creating customer profile for user_id:', customerData.user_id);
    console.log('📝 Customer data:', customerData);
    
    // Check if customer already exists
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.CUSTOMERS,
      [Query.equal('user_id', customerData.user_id), Query.limit(1)]
    );
    
    console.log('🔍 Existing customer documents found:', response.documents.length);
    
    if (response.documents.length > 0) {
      // Customer exists, update their profile
      console.log('🔄 Updating existing customer profile...');
      const existingDoc = response.documents[0];
      const updateData: any = {
        full_name: customerData.full_name,
        email: customerData.email,
        phone: customerData.phone
      };
      
      if (customerData.address !== undefined) {
        updateData.address = customerData.address;
      }
      
      const updatedDoc = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.CUSTOMERS,
        existingDoc.$id,
        updateData
      );
      
      // Also update the user's name and phone in the User collection
      try {
        console.log('🔄 Updating user name and phone in User collection...');
        
        // First find the User document by user_id
        const userResponse = await databases.listDocuments(
          DATABASE_ID,
          'User',
          [Query.equal('user_id', customerData.user_id), Query.limit(1)]
        );
        
        if (userResponse.documents.length > 0) {
          const userDocId = userResponse.documents[0].$id;
          const userUpdateData: any = {
            name: customerData.full_name
          };
          
          // If this is a Google OAuth user providing phone number, update phone too
          if (customerData.phone && customerData.phone.trim() !== '') {
            userUpdateData.phone = customerData.phone;
          }
          
          await databases.updateDocument(
            DATABASE_ID,
            'User',
            userDocId,
            userUpdateData
          );
          console.log('✅ User name and phone updated in User collection');
        } else {
          console.log('⚠️ User document not found in User collection');
        }
      } catch (userUpdateError) {
        console.error('⚠️ Failed to update user name and phone:', userUpdateError);
        // Don't throw error here as customer profile was updated successfully
      }
      
      console.log('✅ Customer profile updated:', updatedDoc.$id);
      return updatedDoc;
    } else {
      // Create new customer profile
      console.log('🆕 Creating new customer profile...');
      const newCustomerData = {
        user_id: customerData.user_id,
        full_name: customerData.full_name,
        email: customerData.email,
        phone: customerData.phone,
        address: customerData.address || '',
        created_at: new Date().toISOString()
      };
      
      console.log('📝 New customer data:', newCustomerData);
      
      const newDoc = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.CUSTOMERS,
        ID.unique(),
        newCustomerData
      );
      
      console.log('✅ New customer profile created:', newDoc.$id);
      
      // Also update the user's name and phone in the User collection
      try {
        console.log('🔄 Updating user name and phone in User collection...');
        
        // First find the User document by user_id
        const userResponse = await databases.listDocuments(
          DATABASE_ID,
          'User',
          [Query.equal('user_id', customerData.user_id), Query.limit(1)]
        );
        
        if (userResponse.documents.length > 0) {
          const userDocId = userResponse.documents[0].$id;
          const updateData: any = {
            name: customerData.full_name
          };
          
          // If this is a Google OAuth user providing phone number, update phone too
          if (customerData.phone && customerData.phone.trim() !== '') {
            updateData.phone = customerData.phone;
          }
          
          await databases.updateDocument(
            DATABASE_ID,
            'User',
            userDocId,
            updateData
          );
          console.log('✅ User name and phone updated in User collection');
        } else {
          console.log('⚠️ User document not found in User collection');
        }
      } catch (userUpdateError) {
        console.error('⚠️ Failed to update user name and phone:', userUpdateError);
        // Don't throw error here as customer profile was created successfully
      }
      
      return newDoc;
    }
  } catch (error) {
    console.error('❌ Error creating/updating customer profile:', error);
    throw error;
  }
};

export const getCustomerByUserId = async (userId: string) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.CUSTOMERS,
      [Query.equal('user_id', userId), Query.limit(1)]
    );
    
    if (response.documents.length > 0) {
      return response.documents[0];
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    return null;
  }
}; 

export const getBusinessSetupByUserId = async (userId: string) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      'business_setup',
      [Query.equal('user_id', userId), Query.limit(1)]
    );
    
    if (response.documents.length > 0) {
      return response.documents[0];
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching business setup:', error);
    return null;
  }
}; 

// Model Series Services
export const createModelSeries = async (seriesData: {
  name: string;
  brand: string;
  device_type: 'phone' | 'laptop';
  description: string;
  models: string[];
}): Promise<any> => {
  try {
    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.MODEL_SERIES,
      'unique()',
      {
        ...seriesData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    );
    return doc;
  } catch (error) {
    console.error('Error creating model series:', error);
    throw error;
  }
};

export const getModelSeries = async (brand?: string, deviceType?: 'phone' | 'laptop'): Promise<any[]> => {
  try {
    let queries = [];
    if (brand) {
      queries.push(Query.equal('brand', brand));
    }
    if (deviceType) {
      queries.push(Query.equal('device_type', deviceType));
    }
    
    // Add high limit to get all series
    queries.push(Query.limit(1000));
    
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.MODEL_SERIES,
      queries
    );
    
    // Add isPlatform flag to distinguish from custom series
    const seriesWithFlags = response.documents.map(series => ({
      ...series,
      isPlatform: true,
      isCustom: false
    }));
    
    return seriesWithFlags;
  } catch (error) {
    console.error('Error fetching model series:', error);
    return [];
  }
};

export const populateModelSeries = async (): Promise<void> => {
  try {
    console.log('Starting comprehensive model series population...');

    // Get all phones and laptops from database
    const allPhones = await getPhones();
    const allLaptops = await getLaptops();
    
    console.log(`Found ${allPhones.length} phones and ${allLaptops.length} laptops`);

    // Group by brand and device type
    const phoneBrands = new Map<string, string[]>();
    const laptopBrands = new Map<string, string[]>();

    // Group phones by brand
    allPhones.forEach(phone => {
      if (!phoneBrands.has(phone.brand)) {
        phoneBrands.set(phone.brand, []);
      }
      phoneBrands.get(phone.brand)!.push(phone.model);
    });

    // Group laptops by brand
    allLaptops.forEach(laptop => {
      if (!laptopBrands.has(laptop.brand)) {
        laptopBrands.set(laptop.brand, []);
      }
      laptopBrands.get(laptop.brand)!.push(laptop.model);
    });

    console.log(`Found ${phoneBrands.size} phone brands and ${laptopBrands.size} laptop brands`);

    // Get existing series to avoid duplicates
    const existingSeries = await getModelSeries();
    const existingSeriesMap = new Map();
    existingSeries.forEach(series => {
      const key = `${series.brand}-${series.device_type}-${series.name}`;
      existingSeriesMap.set(key, series);
    });

    console.log(`Found ${existingSeries.length} existing series`);

    // Predefined series patterns for known brands
    const seriesPatterns: Record<string, Partial<Record<'phone' | 'laptop', Array<{
      pattern: RegExp;
      name: string;
      description: string;
    }>>>> = {
      // Samsung patterns
      samsung: {
        phone: [
          { pattern: /^Galaxy\s+S\d+/, name: 'Galaxy S Series', description: 'Samsung Galaxy S series flagship models' },
          { pattern: /^Galaxy\s+A\d+/, name: 'Galaxy A Series', description: 'Samsung Galaxy A series mid-range models' },
          { pattern: /^Galaxy\s+M\d+/, name: 'Galaxy M Series', description: 'Samsung Galaxy M series budget models' },
          { pattern: /^Galaxy\s+F\d+/, name: 'Galaxy F Series', description: 'Samsung Galaxy F series models' },
          { pattern: /^Galaxy\s+Z\s*(Fold|Flip)/, name: 'Galaxy Z Series', description: 'Samsung Galaxy Z series foldable models' },
          { pattern: /^Galaxy\s+Note\s*\d+/, name: 'Galaxy Note Series', description: 'Samsung Galaxy Note series models' }
        ],
        laptop: [
          { pattern: /^Galaxy\s*Book/, name: 'Galaxy Book Series', description: 'Samsung Galaxy Book series laptops' }
        ]
      },
      // Apple patterns
      apple: {
        phone: [
          { pattern: /^iPhone\s*15/, name: 'iPhone 15 Series', description: 'Apple iPhone 15 series models' },
          { pattern: /^iPhone\s*14/, name: 'iPhone 14 Series', description: 'Apple iPhone 14 series models' },
          { pattern: /^iPhone\s*13/, name: 'iPhone 13 Series', description: 'Apple iPhone 13 series models' },
          { pattern: /^iPhone\s*12/, name: 'iPhone 12 Series', description: 'Apple iPhone 12 series models' },
          { pattern: /^iPhone\s*11/, name: 'iPhone 11 Series', description: 'Apple iPhone 11 series models' },
          { pattern: /^iPhone\s*X/, name: 'iPhone X Series', description: 'Apple iPhone X series models' },
          { pattern: /^iPhone\s*SE/, name: 'iPhone SE Series', description: 'Apple iPhone SE series models' }
        ],
        laptop: [
          { pattern: /^MacBook\s*Pro/, name: 'MacBook Pro Series', description: 'Apple MacBook Pro series models' },
          { pattern: /^MacBook\s*Air/, name: 'MacBook Air Series', description: 'Apple MacBook Air series models' }
        ]
      },
      // Realme patterns
      realme: {
        phone: [
          { pattern: /^(\d+)\s*Pro/, name: 'Realme Pro Series', description: 'Realme Pro series models' },
          { pattern: /^(\d+)$/, name: 'Realme Number Series', description: 'Realme Number series models' },
          { pattern: /^GT/, name: 'Realme GT Series', description: 'Realme GT series models' },
          { pattern: /^C\d+/, name: 'Realme C Series', description: 'Realme C series models' },
          { pattern: /^Narzo/, name: 'Realme Narzo Series', description: 'Realme Narzo series models' }
        ]
      },
      // Vivo patterns
      vivo: {
        phone: [
          { pattern: /^V\d+/, name: 'Vivo V Series', description: 'Vivo V series models' },
          { pattern: /^Y\d+/, name: 'Vivo Y Series', description: 'Vivo Y series models' },
          { pattern: /^X\d+/, name: 'Vivo X Series', description: 'Vivo X series models' },
          { pattern: /^T\d+/, name: 'Vivo T Series', description: 'Vivo T series models' },
          { pattern: /^U\d+/, name: 'Vivo U Series', description: 'Vivo U series models' }
        ]
      },
      // OnePlus patterns
      oneplus: {
        phone: [
          { pattern: /^(\d+)$/, name: 'OnePlus Number Series', description: 'OnePlus Number series models' },
          { pattern: /^Nord/, name: 'OnePlus Nord Series', description: 'OnePlus Nord series models' },
          { pattern: /^R/, name: 'OnePlus R Series', description: 'OnePlus R series models' }
        ]
      },
      // Xiaomi patterns
      xiaomi: {
        phone: [
          { pattern: /^Mi\s*\d+/, name: 'Xiaomi Mi Series', description: 'Xiaomi Mi series models' },
          { pattern: /^Redmi/, name: 'Xiaomi Redmi Series', description: 'Xiaomi Redmi series models' },
          { pattern: /^POCO/, name: 'Xiaomi POCO Series', description: 'Xiaomi POCO series models' },
          { pattern: /^Black\s*Shark/, name: 'Xiaomi Black Shark Series', description: 'Xiaomi Black Shark series models' }
        ],
        laptop: [
          { pattern: /^Mi\s*Notebook/, name: 'Xiaomi Mi Notebook Series', description: 'Xiaomi Mi Notebook series laptops' }
        ]
      },
      // OPPO patterns
      oppo: {
        phone: [
          { pattern: /^Find/, name: 'OPPO Find Series', description: 'OPPO Find series models' },
          { pattern: /^Reno/, name: 'OPPO Reno Series', description: 'OPPO Reno series models' },
          { pattern: /^A\d+/, name: 'OPPO A Series', description: 'OPPO A series models' },
          { pattern: /^F\d+/, name: 'OPPO F Series', description: 'OPPO F Series models' }
        ]
      },
      // Dell patterns
      dell: {
        laptop: [
          { pattern: /^XPS/, name: 'Dell XPS Series', description: 'Dell XPS series models' },
          { pattern: /^Inspiron/, name: 'Dell Inspiron Series', description: 'Dell Inspiron series models' },
          { pattern: /^Latitude/, name: 'Dell Latitude Series', description: 'Dell Latitude series models' },
          { pattern: /^Precision/, name: 'Dell Precision Series', description: 'Dell Precision series models' },
          { pattern: /^Alienware/, name: 'Dell Alienware Series', description: 'Dell Alienware series models' }
        ]
      },
      // HP patterns
      hp: {
        laptop: [
          { pattern: /^Spectre/, name: 'HP Spectre Series', description: 'HP Spectre series models' },
          { pattern: /^Envy/, name: 'HP Envy Series', description: 'HP Envy series models' },
          { pattern: /^Pavilion/, name: 'HP Pavilion Series', description: 'HP Pavilion series models' },
          { pattern: /^EliteBook/, name: 'HP EliteBook Series', description: 'HP EliteBook series models' },
          { pattern: /^ProBook/, name: 'HP ProBook Series', description: 'HP ProBook series models' },
          { pattern: /^OMEN/, name: 'HP OMEN Series', description: 'HP OMEN series models' }
        ]
      },
      // Lenovo patterns
      lenovo: {
        laptop: [
          { pattern: /^ThinkPad/, name: 'Lenovo ThinkPad Series', description: 'Lenovo ThinkPad series models' },
          { pattern: /^Yoga/, name: 'Lenovo Yoga Series', description: 'Lenovo Yoga series models' },
          { pattern: /^IdeaPad/, name: 'Lenovo IdeaPad Series', description: 'Lenovo IdeaPad series models' },
          { pattern: /^Legion/, name: 'Lenovo Legion Series', description: 'Lenovo Legion series models' }
        ]
      },
      // Asus patterns
      asus: {
        phone: [
          { pattern: /^ZenFone/, name: 'Asus ZenFone Series', description: 'Asus ZenFone series models' },
          { pattern: /^ROG\s*Phone/, name: 'Asus ROG Phone Series', description: 'Asus ROG Phone series models' }
        ],
        laptop: [
          { pattern: /^ZenBook/, name: 'Asus ZenBook Series', description: 'Asus ZenBook series models' },
          { pattern: /^VivoBook/, name: 'Asus VivoBook Series', description: 'Asus VivoBook series models' },
          { pattern: /^ROG/, name: 'Asus ROG Series', description: 'Asus ROG series models' },
          { pattern: /^TUF/, name: 'Asus TUF Series', description: 'Asus TUF series models' }
        ]
      },
      // Acer patterns
      acer: {
        laptop: [
          { pattern: /^Aspire/, name: 'Acer Aspire Series', description: 'Acer Aspire series models' },
          { pattern: /^Swift/, name: 'Acer Swift Series', description: 'Acer Swift series models' },
          { pattern: /^Predator/, name: 'Acer Predator Series', description: 'Acer Predator series models' },
          { pattern: /^Spin/, name: 'Acer Spin Series', description: 'Acer Spin series models' }
        ]
      },
      // MSI patterns
      msi: {
        laptop: [
          { pattern: /^GS/, name: 'MSI GS Series', description: 'MSI GS series models' },
          { pattern: /^GE/, name: 'MSI GE Series', description: 'MSI GE series models' },
          { pattern: /^GL/, name: 'MSI GL Series', description: 'MSI GL series models' },
          { pattern: /^Creator/, name: 'MSI Creator Series', description: 'MSI Creator series models' }
        ]
      }
    };

    // Function to group models into series
    const groupModelsIntoSeries = (models: string[], brand: string, deviceType: 'phone' | 'laptop'): Array<{
      name: string;
      description: string;
      models: string[];
    }> => {
      const series: Array<{ name: string; description: string; models: string[] }> = [];
      const brandLower = brand.toLowerCase();
      
      // Check if we have predefined patterns for this brand
      const brandPatterns = seriesPatterns[brandLower as keyof typeof seriesPatterns];
      const patterns = brandPatterns?.[deviceType] || [];
      
      if (patterns.length > 0) {
        // Use predefined patterns
        const usedModels = new Set<string>();
        
        patterns.forEach((pattern: { pattern: RegExp; name: string; description: string }) => {
          const matchingModels = models.filter(model => 
            pattern.pattern.test(model) && !usedModels.has(model)
          );
          
          if (matchingModels.length > 0) {
            series.push({
              name: pattern.name,
              description: pattern.description,
              models: matchingModels
            });
            matchingModels.forEach(model => usedModels.add(model));
          }
        });
        
        // Add remaining models to "Other" series
        const remainingModels = models.filter(model => !usedModels.has(model));
        if (remainingModels.length > 0) {
          series.push({
            name: `${brand} Other Series`,
            description: `${brand} other models`,
            models: remainingModels
          });
        }
      } else {
        // No predefined patterns - create generic series
        if (models.length <= 5) {
          // Small number of models - put all in one series
          series.push({
            name: `${brand} Series`,
            description: `${brand} models`,
            models: models
          });
        } else {
          // Large number of models - split into multiple series
          const chunkSize = Math.ceil(models.length / 3);
          for (let i = 0; i < models.length; i += chunkSize) {
            const chunk = models.slice(i, i + chunkSize);
            series.push({
              name: `${brand} Series ${Math.floor(i / chunkSize) + 1}`,
              description: `${brand} series ${Math.floor(i / chunkSize) + 1}`,
              models: chunk
            });
          }
        }
      }
      
      return series;
    };

    // Process phone brands
    const phoneSeries: Array<{
      name: string;
      brand: string;
      device_type: 'phone' | 'laptop';
      description: string;
      models: string[];
    }> = [];

    for (const [brand, models] of phoneBrands) {
      const brandSeries = groupModelsIntoSeries(models, brand, 'phone');
      brandSeries.forEach(series => {
        phoneSeries.push({
          name: series.name,
          brand: brand,
          device_type: 'phone',
          description: series.description,
          models: series.models
        });
      });
    }

    // Process laptop brands
    const laptopSeries: Array<{
      name: string;
      brand: string;
      device_type: 'phone' | 'laptop';
      description: string;
      models: string[];
    }> = [];

    for (const [brand, models] of laptopBrands) {
      const brandSeries = groupModelsIntoSeries(models, brand, 'laptop');
      brandSeries.forEach(series => {
        laptopSeries.push({
          name: series.name,
          brand: brand,
          device_type: 'laptop',
          description: series.description,
          models: series.models
        });
      });
    }

    // Combine all series
    const allSeries = [...phoneSeries, ...laptopSeries];
    
    console.log(`Generated ${allSeries.length} series total`);
    console.log(`Phone series: ${phoneSeries.length}`);
    console.log(`Laptop series: ${laptopSeries.length}`);

    // Create all series in database (with duplicate checking)
    let createdCount = 0;
    let skippedCount = 0;
    
    for (const series of allSeries) {
      // Check if series already exists
      const seriesKey = `${series.brand}-${series.device_type}-${series.name}`;
      
      if (existingSeriesMap.has(seriesKey)) {
        skippedCount++;
        console.log(`⏭️ Skipped existing series: ${series.name} for ${series.brand}`);
        continue;
      }
      
      try {
        await createModelSeries(series);
        createdCount++;
        console.log(`✅ Created series: ${series.name} for ${series.brand} (${series.models.length} models)`);
      } catch (error) {
        skippedCount++;
        console.log(`❌ Failed to create series ${series.name} for ${series.brand}:`, error);
      }
    }

    console.log(`Series population completed: ${createdCount} created, ${skippedCount} skipped`);
    console.log(`Total series created: ${createdCount}`);
  } catch (error) {
    console.error('Error populating model series:', error);
    throw error;
  }
}; 

export const updatePhonesWithSeriesMapping = async (): Promise<void> => {
  try {
    // First, get all model series
    const allSeries = await getModelSeries();
    const seriesMap = new Map();
    
    // Create a map for quick lookup: model -> series_id
    allSeries.forEach(series => {
      series.models.forEach((model: string) => {
        seriesMap.set(model.toLowerCase(), {
          series_id: series.$id,
          series_name: series.name,
          brand: series.brand,
          device_type: series.device_type
        });
      });
    });

    // Get all phones
    let allPhones: any[] = [];
    let offset = 0;
    const LIMIT = 100;
    
    while (true) {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PHONES,
        [Query.limit(LIMIT), Query.offset(offset)]
      );
      
      allPhones = allPhones.concat(response.documents);
      
      if (response.documents.length < LIMIT) {
        break;
      }
      offset += LIMIT;
    }

    console.log(`Found ${allPhones.length} phones to update`);

    // Update each phone with series_id if it matches
    let updatedCount = 0;
    let skippedCount = 0;

    for (const phone of allPhones) {
      const modelKey = phone.model.toLowerCase();
      const seriesInfo = seriesMap.get(modelKey);
      
      if (seriesInfo && seriesInfo.brand === phone.brand) {
        try {
          await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.PHONES,
            phone.$id,
            {
              series_id: seriesInfo.series_id,
              series_name: seriesInfo.series_name
            }
          );
          updatedCount++;
          console.log(`Updated phone: ${phone.brand} ${phone.model} -> ${seriesInfo.series_name}`);
        } catch (error) {
          console.error(`Failed to update phone ${phone.brand} ${phone.model}:`, error);
        }
      } else {
        skippedCount++;
        console.log(`Skipped phone (no series match): ${phone.brand} ${phone.model}`);
      }
    }

    console.log(`Update completed: ${updatedCount} updated, ${skippedCount} skipped`);
  } catch (error) {
    console.error('Error updating phones with series mapping:', error);
    throw error;
  }
}; 

// Find provider services with series-based pricing and fallback
export const findProviderServicesWithSeries = async (
  deviceType: string,
  brand: string,
  model: string,
  issueNames: string[]
): Promise<any[]> => {
  try {
    // Step 1: Get the device's series information (for backward compatibility)
    let deviceSeries = null;
    try {
      // Get device from phones or laptops collection
      const deviceCollection = deviceType === 'phone' ? COLLECTIONS.PHONES : COLLECTIONS.LAPTOPS;
      const deviceRes = await databases.listDocuments(
        DATABASE_ID,
        deviceCollection,
        [Query.equal('brand', brand), Query.equal('model', model), Query.limit(1)]
      );
      
      if (deviceRes.documents.length > 0) {
        const device = deviceRes.documents[0];
        if (device.series_id) {
          // Get series information
          const seriesRes = await databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.MODEL_SERIES,
            device.series_id
          );
          deviceSeries = seriesRes;
        }
      }
    } catch (error) {
      // Series not found, continue with individual model lookup
    }

    // Step 2: Look for series-based pricing first (both SERVICES_OFFERED and custom_series_services)
    let seriesServices: any[] = [];
    if (deviceSeries) {
      try {
        // Look in SERVICES_OFFERED collection for direct series-based pricing
        const seriesServicesRes = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.SERVICES_OFFERED,
          [
            Query.equal('deviceType', deviceType),
            Query.equal('brand', brand),
            Query.equal('series_id', deviceSeries.$id),
            Query.isNull('model') // Series-based pricing has model = null
          ]
        );
        
        seriesServices = seriesServicesRes.documents.filter((doc: any) => {
          const serviceIssue = doc.issue?.toLowerCase().trim();
          return issueNames.some(issueName => 
            issueName.toLowerCase().trim() === serviceIssue
          );
        });

        // ALSO look in custom_series_services for platform series customizations
        // Get all platform series customizations that include this device
        const platformSeriesCustomizationsRes = await databases.listDocuments(
          DATABASE_ID,
          'custom_series',
          [
            Query.equal('deviceType', deviceType),
            Query.search('description', `[Platform Series: ${deviceSeries.$id}]`)
          ]
        );

        console.log('🔍 Found platform series customizations:', platformSeriesCustomizationsRes.documents.length);

        // For each platform series customization, get its services
        for (const customization of platformSeriesCustomizationsRes.documents) {
          try {
            const platformServicesRes = await databases.listDocuments(
              DATABASE_ID,
              'custom_series_services',
              [
                Query.equal('customSeriesId', customization.$id)
              ]
            );

            console.log('🔍 Platform series services found:', platformServicesRes.documents.length);

            // Filter services by issue names and transform to match expected format
            const filteredPlatformServices = platformServicesRes.documents.filter((doc: any) => {
              const serviceIssue = doc.issue?.toLowerCase().trim();
              return issueNames.some(issueName => 
                issueName.toLowerCase().trim() === serviceIssue
              );
            });

            // Transform platform series services to match regular service format
            const transformedPlatformServices = filteredPlatformServices.map(service => ({
              ...service,
              $id: service.$id,
              providerId: service.providerId,
              deviceType: deviceType,
              brand: brand,
              model: model,
              issue: service.issue,
              price: service.price,
              partType: service.partType,
              warranty: service.warranty,
              created_at: service.created_at,
              pricingType: 'platform_series_customization',
              seriesName: customization.name,
              customSeriesId: customization.$id
            }));

            seriesServices.push(...transformedPlatformServices);
          } catch (error) {
            console.error('Error fetching platform series services:', error);
            // Continue with other customizations
          }
        }
      } catch (error) {
        // Error fetching series services, continue with model lookup
      }
    }

    // Step 3: Look for custom series that include this model (including Platform Series!)
    let customSeriesServices: any[] = [];
    try {
      // Get all custom series (including Platform Series customizations)
      const customSeriesRes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CUSTOM_SERIES,
        [Query.equal('deviceType', deviceType)]
      );
      
              // Filter custom series that include this specific brand:model
      // RESTORED: Dual-format handling works for Platform Series, Custom Series, and Individual Services!
        const matchingCustomSeries = customSeriesRes.documents.filter((series: any) => {
          if (!series.models || !Array.isArray(series.models)) return false;
        
        // Check if this model is in the series models array
        // RESTORED: Dual-format handling for all series types
        return series.models.some((modelString: string) => {
          if (modelString.includes(':')) {
            // Format 1: "Brand:Model" (for Custom Series)
            const [seriesBrand, seriesModel] = modelString.split(':');
            return seriesBrand === brand && seriesModel === model;
          } else {
            // Format 2: "Model" (for Platform Series and Individual Services)
            return modelString === model;
          }
        });
        });
        
      console.log('🔍 Found matching custom series (including Platform Series):', matchingCustomSeries.length);
        
        // Get services for matching custom series
        for (const customSeries of matchingCustomSeries) {
          try {
            const customSeriesServicesRes = await databases.listDocuments(
              DATABASE_ID,
              COLLECTIONS.CUSTOM_SERIES_SERVICES,
              [
                Query.equal('customSeriesId', customSeries.$id),
                Query.equal('providerId', customSeries.providerId)
              ]
            );
            
            console.log('🔍 Custom series services found:', customSeriesServicesRes.documents.length);
            console.log('🔍 Looking for issues:', issueNames);
            console.log('🔍 Available services:', customSeriesServicesRes.documents.map((s: any) => s.issue));
            
            // Case-insensitive matching
            const filteredServices = customSeriesServicesRes.documents.filter((doc: any) => {
              const serviceIssue = doc.issue?.toLowerCase().trim();
              const matches = issueNames.some(issueName => 
                issueName.toLowerCase().trim() === serviceIssue
              );
              console.log('🔍 Matching service:', doc.issue, 'with issues:', issueNames, 'result:', matches);
              return matches;
            });
          
          // Transform custom series services to match regular service format
          const transformedServices = filteredServices.map(service => ({
            ...service,
            $id: service.$id,
            providerId: service.providerId,
            deviceType: customSeries.deviceType,
            brand: brand, // Use the requested brand
            model: model, // Use the requested model
            issue: service.issue,
            price: service.price,
            partType: service.partType,
            warranty: service.warranty,
            created_at: service.created_at,
          pricingType: customSeries.description && customSeries.description.includes('[Platform Series:') ? 'platform_series' : 'custom_series',
            seriesName: customSeries.name,
            customSeriesId: customSeries.$id
          }));
          
          customSeriesServices.push(...transformedServices);
        } catch (error) {
          // Error fetching custom series services, continue
        }
      }
    } catch (error) {
      // Error fetching custom series, continue with model lookup
    }

    // Step 4: Look for individual model pricing (overrides)
    let modelServices: any[] = [];
    try {
      const modelServicesRes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.SERVICES_OFFERED,
        [
          Query.equal('deviceType', deviceType),
          Query.equal('brand', brand),
          Query.equal('model', model)
        ]
      );
      
      modelServices = modelServicesRes.documents.filter((doc: any) => {
        const serviceIssue = doc.issue?.toLowerCase().trim();
        return issueNames.some(issueName => 
          issueName.toLowerCase().trim() === serviceIssue
        );
      });
    } catch (error) {
      // Error fetching model services
    }

    // Step 5: Merge services with priority (model overrides > custom series > platform series)
    const mergedServices = new Map();
    
    // Add platform series-based services first (lowest priority)
    seriesServices.forEach(service => {
      const key = `${service.providerId}-${service.issue}-${service.partType}`;
      mergedServices.set(key, {
        ...service,
        pricingType: 'platform_series',
        seriesName: deviceSeries?.name
      });
    });
    
  // Override with custom series services (medium priority) - now includes Platform Series!
    customSeriesServices.forEach(service => {
      const key = `${service.providerId}-${service.issue}-${service.partType}`;
      mergedServices.set(key, {
        ...service,
      pricingType: service.pricingType, // 'custom_series' or 'platform_series'
        seriesName: service.seriesName
      });
    });
    
    // Override with model-specific services (highest priority)
    modelServices.forEach(service => {
      const key = `${service.providerId}-${service.issue}-${service.partType}`;
      mergedServices.set(key, {
        ...service,
        pricingType: 'model_override'
      });
    });

    const finalServices = Array.from(mergedServices.values());
    
    return finalServices;
  } catch (error) {
    console.error('Error finding provider services with series:', error);
    return [];
  }
};

// Create service offered with series support
export const createServiceOfferedWithSeries = async (serviceData: {
  providerId: string;
  deviceType: string;
  brand: string;
  model: string | null; // null for series-based, model name for override
  series_id?: string | null; // series ID for series-based pricing
  issue: string;
  partType: string | null;
  price: number;
  warranty: string | null;
  created_at: string;
}) => {
  try {
    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.SERVICES_OFFERED,
      'unique()',
      {
        providerId: serviceData.providerId,
        deviceType: serviceData.deviceType,
        brand: serviceData.brand,
        model: serviceData.model,
        series_id: serviceData.series_id || null,
        issue: serviceData.issue,
        partType: serviceData.partType,
        price: serviceData.price,
        warranty: serviceData.warranty,
        created_at: serviceData.created_at,
      }
    );
    
    return doc;
  } catch (error) {
    console.error('Error creating service offered with series:', error);
    throw error;
  }
}; 

// Update existing service offered with series support
export const updateServiceOfferedWithSeries = async (
  serviceId: string,
  updates: {
    price?: number;
    warranty?: string | null;
  }
) => {
  try {
    const doc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.SERVICES_OFFERED,
      serviceId,
      updates
    );
    
    return doc;
  } catch (error) {
    console.error('Error updating service offered with series:', error);
    throw error;
  }
};

// Find existing service by series, issue, and partType
export const findExistingService = async (
  providerId: string,
  seriesId: string,
  issue: string,
  partType: string | null
): Promise<any | null> => {
  try {
    let queries = [
      Query.equal('providerId', providerId),
      Query.equal('series_id', seriesId),
      Query.equal('issue', issue),
      Query.isNull('model')
    ];

    // Handle partType query properly
    if (partType === null) {
      queries.push(Query.isNull('partType'));
    } else {
      queries.push(Query.equal('partType', partType));
    }

    const servicesRes = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.SERVICES_OFFERED,
      queries
    );
    
    return servicesRes.documents.length > 0 ? servicesRes.documents[0] : null;
  } catch (error) {
    console.error('Error finding existing service:', error);
    return null;
  }
}; 

// Custom Series Functions
export const createCustomSeries = async (seriesData: {
  providerId: string;
  name: string;
  description: string;
  deviceType: 'phone' | 'laptop';
  models: Array<{ brand: string; model: string }>;
}) => {
  try {
    // Convert models array to string array for storage
    const modelsAsStrings = seriesData.models.map(model => 
      `${model.brand}:${model.model}`
    );
    
    const doc = await databases.createDocument(
      DATABASE_ID,
      'custom_series',
      'unique()',
      {
        providerId: seriesData.providerId,
        name: seriesData.name,
        description: seriesData.description,
        deviceType: seriesData.deviceType,
        models: modelsAsStrings,
        created_at: new Date().toISOString(),
      }
    );
    
    return doc;
  } catch (error) {
    console.error('Error creating custom series:', error);
    throw error;
  }
};

export const getCustomSeriesByProvider = async (providerId: string): Promise<any[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      'custom_series',
      [Query.equal('providerId', providerId)]
    );
    
    return response.documents;
  } catch (error) {
    console.error('Error fetching custom series:', error);
    return [];
  }
};

export const updateCustomSeries = async (
  seriesId: string,
  updates: {
    name?: string;
    description?: string;
    models?: Array<{ brand: string; model: string }>;
  }
) => {
  try {
    // Convert models array to string array for storage if models are provided
    const updateData: any = { ...updates };
    if (updates.models) {
      updateData.models = updates.models.map(model => 
        `${model.brand}:${model.model}`
      );
    }
    
    const doc = await databases.updateDocument(
      DATABASE_ID,
      'custom_series',
      seriesId,
      updateData
    );
    
    return doc;
  } catch (error) {
    console.error('Error updating custom series:', error);
    throw error;
  }
};

export const deleteCustomSeries = async (seriesId: string) => {
  try {
    // First delete all associated services
    const servicesResponse = await databases.listDocuments(
      DATABASE_ID,
      'custom_series_services',
      [Query.equal('customSeriesId', seriesId)]
    );
    
    // Delete all services for this series
    for (const service of servicesResponse.documents) {
      await databases.deleteDocument(
        DATABASE_ID,
        'custom_series_services',
        service.$id
      );
    }
    
    // Then delete the series
    await databases.deleteDocument(
      DATABASE_ID,
      'custom_series',
      seriesId
    );
    
    return true;
  } catch (error) {
    console.error('Error deleting custom series:', error);
    throw error;
  }
};

export const createCustomSeriesService = async (serviceData: {
  customSeriesId: string;
  providerId: string;
  issue: string;
  partType: string | null;
  price: number;
  warranty: string | null;
}) => {
  try {
    const doc = await databases.createDocument(
      DATABASE_ID,
      'custom_series_services',
      'unique()',
      {
        customSeriesId: serviceData.customSeriesId,
        providerId: serviceData.providerId,
        issue: serviceData.issue,
        partType: serviceData.partType,
        price: serviceData.price,
        warranty: serviceData.warranty,
        created_at: new Date().toISOString(),
      }
    );
    
    return doc;
  } catch (error) {
    console.error('Error creating custom series service:', error);
    throw error;
  }
};

export const getCustomSeriesServices = async (customSeriesId: string): Promise<any[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      'custom_series_services',
      [Query.equal('customSeriesId', customSeriesId)]
    );
    
    return response.documents;
  } catch (error) {
    console.error('Error fetching custom series services:', error);
    return [];
  }
};

export const updateCustomSeriesService = async (
  serviceId: string,
  updates: {
    price?: number;
    warranty?: string | null;
  }
) => {
  try {
    const doc = await databases.updateDocument(
      DATABASE_ID,
      'custom_series_services',
      serviceId,
      updates
    );
    
    return doc;
  } catch (error) {
    console.error('Error updating custom series service:', error);
    throw error;
  }
};

export const deleteCustomSeriesService = async (serviceId: string) => {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      'custom_series_services',
      serviceId
    );
    
    return true;
  } catch (error) {
    console.error('Error deleting custom series service:', error);
    throw error;
  }
};

export const findCustomSeriesForModel = async (
  providerId: string,
  deviceType: string,
  brand: string,
  model: string
): Promise<any | null> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      'custom_series',
      [
        Query.equal('providerId', providerId),
        Query.equal('deviceType', deviceType)
      ]
    );
    
    // Find series that contains this specific model
    for (const series of response.documents) {
      // Convert string array back to object array for comparison
      const modelObjects = series.models.map((modelString: string) => {
        const [brand, model] = modelString.split(':');
        return { brand, model };
      });
      
      const hasModel = modelObjects.some((m: any) => 
        m.brand === brand && m.model === model
      );
      
      if (hasModel) {
        return series;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding custom series for model:', error);
    return null;
  }
};

// Enhanced service lookup with custom series support
export const findProviderServicesWithCustomSeries = async (
  deviceType: string,
  brand: string,
  model: string,
  issueNames: string[],
  providerId: string
): Promise<any[]> => {
  try {
    // Step 1: Check for custom series containing this model
    const customSeries = await findCustomSeriesForModel(
      providerId,
      deviceType,
      brand,
      model
    );
    
    let customSeriesServices: any[] = [];
    
    if (customSeries) {
      // Get services for this custom series
      const seriesServices = await getCustomSeriesServices(customSeries.$id);
      customSeriesServices = seriesServices.filter((doc: any) => 
        issueNames.includes(doc.issue)
      );
    }
    
    // Step 2: Get existing series-based and model-specific services
    const existingServices = await findProviderServicesWithSeries(
      deviceType,
      brand,
      model,
      issueNames
    );
    
    // Step 3: Merge with priority (custom series > model override > platform series)
    const mergedServices = new Map();
    
    // Add existing services first
    existingServices.forEach((service: any) => {
      const key = `${service.issue}-${service.partType}`;
      mergedServices.set(key, service);
    });
    
    // Override with custom series services (highest priority)
    customSeriesServices.forEach((service: any) => {
      const key = `${service.issue}-${service.partType}`;
      mergedServices.set(key, {
        ...service,
        customSeriesId: customSeries.$id,
        customSeriesName: customSeries.name
      });
    });
    
    return Array.from(mergedServices.values());
  } catch (error) {
    console.error('Error in findProviderServicesWithCustomSeries:', error);
    // Fallback to existing logic
    return await findProviderServicesWithSeries(
      deviceType,
      brand,
      model,
      issueNames
    );
  }
};

// Platform Series Customization Functions
export const createPlatformSeriesCustomization = async (customizationData: {
  providerId: string;
  baseSeriesId: string;
  name: string;
  description: string;
  deviceType: 'phone' | 'laptop';
  models: Array<{ brand: string; model: string }>;
}) => {
  try {
    // Convert models array to string array for storage
    // FIXED: Store the FULL model names to match Platform Series template format
    const modelsAsStrings = customizationData.models.map(model => 
      model.model  // Store the full model name (e.g., "Galaxy A04", not just "A04")
    );
    
    // Store platform series info in the description to maintain the relationship
    const enhancedDescription = `[Platform Series: ${customizationData.baseSeriesId}] ${customizationData.description}`;
    
    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.CUSTOM_SERIES,
      'unique()',
      {
        providerId: customizationData.providerId,
        name: customizationData.name,
        description: enhancedDescription,
        deviceType: customizationData.deviceType,
        models: modelsAsStrings,
        created_at: new Date().toISOString(),
      }
    );
    
    return doc;
  } catch (error) {
    console.error('Error creating platform series customization:', error);
    throw error;
  }
};

export const getPlatformSeriesCustomizationsByProvider = async (providerId: string): Promise<any[]> => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.CUSTOM_SERIES,
      [Query.equal('providerId', providerId)]
    );
    
    // Filter for platform series customizations by checking description pattern
    return response.documents.filter(doc => 
      doc.description && doc.description.includes('[Platform Series:')
    );
  } catch (error) {
    console.error('Error fetching platform series customizations:', error);
    return [];
  }
};

export const updatePlatformSeriesCustomization = async (
  customizationId: string,
  updates: {
    name?: string;
    description?: string;
    models?: Array<{ brand: string; model: string }>;
  }
) => {
  try {
    // Convert models array to string array for storage if models are provided
    // FIXED: Store the FULL model names to match Platform Series template format
    const updateData: any = { ...updates };
    if (updates.models) {
      updateData.models = updates.models.map(model => 
        model.model  // Store the full model name (e.g., "Galaxy A04", not just "A04")
      );
    }
    
    const doc = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.CUSTOM_SERIES,
      customizationId,
      updateData
    );
    
    return doc;
  } catch (error) {
    console.error('Error updating platform series customization:', error);
    throw error;
  }
};

export const deletePlatformSeriesCustomization = async (customizationId: string) => {
  try {
    // First delete all associated services
    const servicesResponse = await databases.listDocuments(
      DATABASE_ID,
      'custom_series_services',
      [Query.equal('customSeriesId', customizationId)]
    );
    
    // Delete all services for this customization
    for (const service of servicesResponse.documents) {
      await databases.deleteDocument(
        DATABASE_ID,
        'custom_series_services',
        service.$id
      );
    }
    
    // Then delete the customization
    await databases.deleteDocument(
      DATABASE_ID,
      COLLECTIONS.CUSTOM_SERIES,
      customizationId
    );
    
    return true;
  } catch (error) {
    console.error('Error deleting platform series customization:', error);
    throw error;
  }
};



// Function to populate platform series with brand-wise data
export const populatePlatformSeries = async (): Promise<void> => {
  try {
    console.log('Starting platform series population with brand-wise data...');

    // First, delete all existing platform series
    console.log('Deleting all existing platform series...');
    const existingSeriesResponse = await getModelSeries();
    const existingSeries = existingSeriesResponse || [];
    
    for (const series of existingSeries) {
      try {
        await databases.deleteDocument(
          DATABASE_ID,
          COLLECTIONS.MODEL_SERIES,
          series.$id
        );
        console.log(`Deleted existing series: ${series.name}`);
      } catch (error) {
        console.error(`Error deleting series ${series.name}:`, error);
      }
    }

    // Now add new brand-wise platform series
    const newPlatformSeries = [
      {
        name: "Entry Core",
        brand: "Nothing",
        models: ["Phone (1)"],
        description: "Nothing Phone entry level devices",
        device_type: "phone"
      },
      {
        name: "Mainstream",
        brand: "Nothing",
        models: ["Phone (2)"],
        description: "Nothing Phone mainstream devices",
        device_type: "phone"
      },
      {
        name: "ROG Performance",
        brand: "Asus",
        models: ["ROG Phone 5", "ROG Phone 6"],
        description: "Asus ROG gaming phones with high performance",
        device_type: "phone"
      },
      {
        name: "ROG Ultra",
        brand: "Asus",
        models: ["ROG Phone 7", "ROG Phone 8"],
        description: "Asus ROG ultra gaming phones",
        device_type: "phone"
      },
      {
        name: "ZenFone Compact",
        brand: "Asus",
        models: ["ZenFone 8", "ZenFone 9"],
        description: "Asus ZenFone compact devices",
        device_type: "phone"
      },
      {
        name: "ZenFone Flagship",
        brand: "Asus",
        models: ["ZenFone 10", "ZenFone 11"],
        description: "Asus ZenFone flagship devices",
        device_type: "phone"
      },
      {
        name: "Smart Series",
        brand: "Infinix",
        models: ["Smart 6 HD", "Smart 6 Plus", "Smart 7", "Smart 7 HD", "Smart 8", "Smart 8 HD"],
        description: "Infinix Smart series entry devices",
        device_type: "phone"
      },
      {
        name: "Hot Entry",
        brand: "Infinix",
        models: ["Hot 11 2022", "Hot 20i", "Hot 20 Play"],
        description: "Infinix Hot series entry level",
        device_type: "phone"
      },
      {
        name: "Hot Main",
        brand: "Infinix",
        models: ["Hot 20 4G", "Hot 20S", "Hot 20 5G", "Hot 30", "Hot 30 Play", "Hot 40", "Hot 12 Pro"],
        description: "Infinix Hot series main devices",
        device_type: "phone"
      },
      {
        name: "Note Main",
        brand: "Infinix",
        models: ["Note 10", "Note 12i 2022", "Note 12 G96", "Note 12 2023"],
        description: "Infinix Note series main devices",
        device_type: "phone"
      },
      {
        name: "Note Premium",
        brand: "Infinix",
        models: ["Note 12 5G", "Note 12 Pro 4G", "Note 12 VIP"],
        description: "Infinix Note series premium devices",
        device_type: "phone"
      },
      {
        name: "Flagship",
        brand: "Infinix",
        models: ["Zero 5G 2023"],
        description: "Infinix flagship devices",
        device_type: "phone"
      },
      {
        name: "Entry/Budget",
        brand: "iQOO",
        models: ["U1x", "U3x 4G", "U5", "U5e", "U5x"],
        description: "iQOO entry and budget devices",
        device_type: "phone"
      },
      {
        name: "Value",
        brand: "iQOO",
        models: ["Z9 Lite 5G"],
        description: "iQOO value devices",
        device_type: "phone"
      },
      {
        name: "Neo Series",
        brand: "iQOO",
        models: ["Neo 6 5G", "Neo 7 5G", "Z8"],
        description: "iQOO Neo series devices",
        device_type: "phone"
      },
      {
        name: "Flagship",
        brand: "iQOO",
        models: ["5 Pro", "7 5G", "7 Legend 5G", "9 SE 5G", "10"],
        description: "iQOO flagship devices",
        device_type: "phone"
      },
      {
        name: "Old LCD",
        brand: "Apple",
        models: ["iPhone 5", "iPhone 5c", "iPhone 5s", "iPhone 6", "iPhone 6 Plus", "iPhone 6S", "iPhone 6S Plus", "iPhone SE 1st Generation", "iPhone SE 2020", "iPhone SE 2022", "iPhone 7", "iPhone 7 Plus", "iPhone 8", "iPhone 8 Plus"],
        description: "Apple iPhone devices with LCD displays",
        device_type: "phone"
      },
      {
        name: "X to 11",
        brand: "Apple",
        models: ["iPhone X", "iPhone XR", "iPhone XS", "iPhone XS Max", "iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max"],
        description: "Apple iPhone X to 11 series",
        device_type: "phone"
      },
      {
        name: "12–13 Series",
        brand: "Apple",
        models: ["iPhone 12", "iPhone 12 Mini", "iPhone 12 Pro", "iPhone 12 Pro Max", "iPhone 13", "iPhone 13 Mini", "iPhone 13 Pro", "iPhone 13 Pro Max"],
        description: "Apple iPhone 12 and 13 series",
        device_type: "phone"
      },
      {
        name: "14–15 Series",
        brand: "Apple",
        models: ["iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro", "iPhone 14 Pro Max", "iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 15 Pro Max"],
        description: "Apple iPhone 14 and 15 series",
        device_type: "phone"
      },
      {
        name: "Budget LCD",
        brand: "Samsung",
        models: ["Galaxy A04", "Galaxy A04e", "Galaxy A05", "Galaxy A05s", "Galaxy A10s", "Galaxy A12", "Galaxy F04"],
        description: "Samsung Galaxy budget devices with LCD displays",
        device_type: "phone"
      },
      {
        name: "Core A/M/F",
        brand: "Samsung",
        models: ["Galaxy A13", "Galaxy A14", "Galaxy A14 5G", "Galaxy M13 5G", "Galaxy F14 5G", "Galaxy M11", "Galaxy M12", "Galaxy F12", "Galaxy M01 Core", "Galaxy M10"],
        description: "Samsung Galaxy core A, M, and F series",
        device_type: "phone"
      },
      {
        name: "Mainstream LCD/AMOLED",
        brand: "Samsung",
        models: ["Galaxy M20", "Galaxy M21", "Galaxy M23 5G", "Galaxy M30", "Galaxy M30s", "Galaxy M31", "Galaxy A20", "Galaxy A20s", "Galaxy A21s", "Galaxy A22", "Galaxy A22 5G", "Galaxy A23", "Galaxy A24", "Galaxy A30", "Galaxy A30s", "Galaxy A31", "Galaxy A32", "Galaxy M32", "Galaxy M34 5G", "Galaxy M40"],
        description: "Samsung Galaxy mainstream devices with LCD/AMOLED displays",
        device_type: "phone"
      },
      {
        name: "Upper Mid A/M",
        brand: "Samsung",
        models: ["Galaxy A50", "Galaxy A50s", "Galaxy A51", "Galaxy A52", "Galaxy A70", "Galaxy A70s", "Galaxy A71", "Galaxy M51", "Galaxy M54", "Galaxy M62", "Galaxy F41", "Galaxy F62"],
        description: "Samsung Galaxy upper mid-range A and M series",
        device_type: "phone"
      },
      {
        name: "Legacy/Flagship",
        brand: "Samsung",
        models: ["Galaxy S8", "Galaxy S8 Plus", "Galaxy S9", "Galaxy S9 Plus", "Galaxy S10", "Galaxy S10 Plus", "Galaxy Note 9", "Galaxy Note 10 Lite", "Galaxy S20 FE 2022", "Galaxy S21 FE 5G", "Galaxy S22 5G", "Galaxy S22 Ultra 5G", "Galaxy Xcover 6 Pro", "Galaxy Wide 5", "Galaxy J4 Plus", "Galaxy J6", "Galaxy J6 Plus", "Galaxy J7 2016", "Galaxy J7 Max", "Galaxy J7 Prime", "Galaxy J7 Pro", "Galaxy J8"],
        description: "Samsung Galaxy legacy and flagship devices",
        device_type: "phone"
      },
      {
        name: "Entry A/Number",
        brand: "Xiaomi",
        models: ["Redmi 3S", "Redmi 3S Prime", "Redmi 4", "Redmi 4A", "Redmi 5A", "Redmi 6A", "Redmi 7A", "Redmi 8A", "Redmi 8A Dual", "Redmi 9A", "Redmi 9i", "Redmi A1", "Redmi A1 Plus", "Redmi A2", "Redmi A2 Plus", "Redmi 12C", "Redmi 13C", "Redmi 13C 5G", "Redmi 12", "Redmi 12 5G", "Redmi 10 Prime", "Redmi 11 Prime 5G", "Redmi 9", "Redmi 9 Prime", "Redmi 9 Power", "Redmi 7", "Redmi 6 Pro", "Redmi 5", "Redmi 5A", "Redmi 4"],
        description: "Xiaomi Redmi entry level A and number series",
        device_type: "phone"
      },
      {
        name: "Note LCD Legacy",
        brand: "Xiaomi",
        models: ["Redmi Note 3", "Redmi Note 4", "Redmi Note 5", "Redmi Note 5 Pro", "Redmi Note 6 Pro", "Redmi Note 7", "Redmi Note 7S", "Redmi Note 7 Pro", "Redmi Note 8", "Redmi Note 8 Pro"],
        description: "Xiaomi Redmi Note legacy LCD devices",
        device_type: "phone"
      },
      {
        name: "Note 9–13 Gen",
        brand: "Xiaomi",
        models: ["Redmi Note 9", "Redmi Note 9 Pro", "Redmi Note 9 Pro Max", "Redmi Note 10", "Redmi Note 10s", "Redmi Note 10 Pro", "Redmi Note 10 Pro Max", "Redmi Note 11", "Redmi Note 11S", "Redmi Note 11 SE", "Redmi Note 11 SE 5G", "Redmi Note 11 Pro", "Redmi Note 11R", "Redmi Note 12", "Redmi Note 12s", "Redmi Note 12R", "Redmi Note 12T Pro", "Redmi Note 12 Pro", "Redmi Note 12 Pro Plus 5G", "Redmi Note 12 Pro Speed Edition", "Redmi Note 13 5G"],
        description: "Xiaomi Redmi Note 9th to 13th generation devices",
        device_type: "phone"
      },
      {
        name: "Mi/Premium",
        brand: "Xiaomi",
        models: ["Mi 4i", "Mi Max 2", "Mi A1", "Mi A2", "Mi A3", "Mi Note 10", "Mi 10T Pro", "Mi 11 Lite", "Mi 11X", "11T", "11i HyperCharge 5G", "12X", "12T", "12 Pro 5G", "Mi 13"],
        description: "Xiaomi Mi series premium devices",
        device_type: "phone"
      },
      {
        name: "Performance/Gaming",
        brand: "Xiaomi",
        models: ["Redmi K20", "Redmi K20 Pro", "Redmi K20 Pro Premium", "Redmi K30 5G Extreme Edition", "Redmi K60", "Black Shark 4 Pro"],
        description: "Xiaomi Redmi K series and Black Shark gaming devices",
        device_type: "phone"
      },
      {
        name: "Entry/Budget Y",
        brand: "Vivo",
        models: ["Y02", "Y02A", "Y02s", "Y02T", "Y11", "Y11 2023", "Y12", "Y12 2023", "Y12s", "Y15 2019", "Y15c", "Y16", "Y17"],
        description: "Vivo Y series entry and budget devices",
        device_type: "phone"
      },
      {
        name: "Mainstream Y",
        brand: "Vivo",
        models: ["Y19", "Y20", "Y21", "Y21 2021", "Y22 2022", "Y22s", "Y27", "Y27 5G", "Y27s", "Y30 5G", "Y33s", "Y35 2022", "Y35 5G", "Y35 Plus", "Y35m", "Y36", "Y36 5G"],
        description: "Vivo Y series mainstream devices",
        device_type: "phone"
      },
      {
        name: "V Legacy–Mid",
        brand: "Vivo",
        models: ["V3", "V5", "V5s", "V5 Plus", "V7", "V7 Plus", "V9", "V9 Pro", "V9 Youth", "V11", "V11 Pro", "V15", "V15 Pro", "V17", "V17 Pro", "V19", "V20", "V20 2021", "V20 SE", "V20 Pro"],
        description: "Vivo V series legacy and mid-range devices",
        device_type: "phone"
      },
      {
        name: "V New Gen",
        brand: "Vivo",
        models: ["V21", "V21e 5G", "V21s", "V23 5G", "V23e", "V23 Pro", "V25 5G", "V25 Pro 5G", "V27", "V27 Pro", "V29", "V29e", "V29 Pro", "V30", "V30e", "V30 Pro"],
        description: "Vivo V series new generation devices",
        device_type: "phone"
      },
      {
        name: "X/Flagship",
        brand: "Vivo",
        models: ["X21", "X60", "X60 Pro", "X60 Pro Plus", "X70 Pro", "X70 Pro Plus", "X80", "X80 Pro", "X90", "X90 Pro", "V40", "V40e", "V40"],
        description: "Vivo X series and flagship devices",
        device_type: "phone"
      },
      {
        name: "Classic",
        brand: "OnePlus",
        models: ["OnePlus 3", "OnePlus 3T", "OnePlus 5", "OnePlus 5T", "OnePlus 6", "OnePlus 6T"],
        description: "OnePlus classic series devices",
        device_type: "phone"
      },
      {
        name: "7–9 Gen",
        brand: "OnePlus",
        models: ["OnePlus 7", "OnePlus 7T", "OnePlus 8", "OnePlus 8T", "OnePlus 9 5G", "OnePlus 9R 5G", "OnePlus 9RT 5G", "OnePlus 7 Pro", "OnePlus 7 Pro 5G", "OnePlus 7T Pro", "OnePlus 8 Pro", "OnePlus 9 Pro 5G"],
        description: "OnePlus 7th to 9th generation devices",
        device_type: "phone"
      },
      {
        name: "10–12 Gen",
        brand: "OnePlus",
        models: ["OnePlus 10R 5G", "OnePlus 10T 5G", "OnePlus 10 Pro 5G", "OnePlus 11 5G", "OnePlus 11R 5G", "OnePlus 12", "OnePlus 12R"],
        description: "OnePlus 10th to 12th generation devices",
        device_type: "phone"
      },
      {
        name: "Nord Family",
        brand: "OnePlus",
        models: ["OnePlus Nord", "OnePlus Nord 2 5G", "OnePlus Nord 2T 5G", "OnePlus Nord 3 5G", "OnePlus Nord CE 5G", "OnePlus Nord CE 2 5G", "OnePlus Nord CE 2 Lite 5G", "OnePlus Nord CE 3 5G", "OnePlus Nord CE 3 Lite 5G", "OnePlus Nord CE4 5G", "OnePlus Nord CE4 Lite 5G", "OnePlus Nord 4"],
        description: "OnePlus Nord family devices",
        device_type: "phone"
      },
      {
        name: "Entry A",
        brand: "OPPO",
        models: ["A1K", "A3s", "A5", "A5 2020", "A5s", "A7", "A8", "A9 2020", "A11", "A12", "A12s", "A15", "A15s", "A16", "A16e", "A17K", "A18"],
        description: "OPPO A series entry devices",
        device_type: "phone"
      },
      {
        name: "Core A",
        brand: "OPPO",
        models: ["A31", "A32", "A33", "A36", "A37", "A52", "A53", "A53s", "A54", "A56s", "A57", "A57 5G", "A57 2022", "A57e", "A57s", "A58", "A58x"],
        description: "OPPO A series core devices",
        device_type: "phone"
      },
      {
        name: "Upper A",
        brand: "OPPO",
        models: ["A71", "A72", "A74", "A74 5G", "A76", "A77 2022", "A77 5G", "A77s", "A78 4G", "A78 5G", "A79 5G"],
        description: "OPPO A series upper tier devices",
        device_type: "phone"
      },
      {
        name: "Reno Series",
        brand: "OPPO",
        models: ["Reno Ace", "Reno A", "Reno 2", "Reno 2Z", "Reno 10x Zoom", "Reno2 F", "Reno3 Pro", "Reno4", "Reno4 Pro", "Reno4 Pro 5G", "Reno6 5G", "Reno7 4G", "Reno8 4G", "Reno8 T", "Reno8T 5G", "Reno9", "Reno9 Pro"],
        description: "OPPO Reno series devices",
        device_type: "phone"
      },
      {
        name: "F/K Series",
        brand: "OPPO",
        models: ["F1", "F1s", "F3", "F3 Plus", "F5", "F7", "F9", "F9 Pro", "F11", "F11 Pro", "F15", "F17", "F17 Pro", "F19 Pro", "F21 Pro 5G", "F21s Pro", "F21s Pro 5G", "F23 5G", "K9", "K10", "K10 5G", "K10 Energy", "K11", "K11x", "A1 Pro"],
        description: "OPPO F and K series devices",
        device_type: "phone"
      },
      {
        name: "Entry C",
        brand: "Realme",
        models: ["Realme C1", "Realme C2", "Realme C3", "Realme C11", "Realme C11 2021", "Realme C12", "Realme C15", "Realme C15 Qualcomm Edition", "Realme C17", "Realme C20", "Realme C20A", "Realme C21Y", "Realme C25", "Realme C25s", "Realme C30s", "Realme C31", "Realme C33", "Realme C33 2023", "Realme C35", "Realme C51", "Realme C55"],
        description: "Realme C series entry devices",
        device_type: "phone"
      },
      {
        name: "Mainstream Number",
        brand: "Realme",
        models: ["Realme 1", "Realme 2", "Realme 2 Pro", "Realme 3", "Realme 3 Pro", "Realme 3i", "Realme 5", "Realme 5i", "Realme 5s", "Realme 6", "Realme 6i", "Realme 6 Pro", "Realme 7", "Realme 7i", "Realme 7 Pro", "Realme 8", "Realme 8i", "Realme 8 5G", "Realme 8s 5G", "Realme 9", "Realme 9i", "Realme 9i 5G", "Realme 9 5G", "Realme 9 5G SE", "Realme 9 Pro 5G", "Realme 9 Pro Plus 5G", "Realme 10 5G", "Realme 10 Pro 5G", "Realme 10 Pro Plus 5G", "Realme 11 Pro Plus 5G"],
        description: "Realme mainstream number series devices",
        device_type: "phone"
      },
      {
        name: "Flagship/GT/X",
        brand: "Realme",
        models: ["Realme X", "Realme XT", "Realme X2", "Realme X2 Pro", "Realme X7", "Realme X7 Pro", "Realme X7 Pro Ultra", "Realme GT Master Edition", "Realme U1"],
        description: "Realme flagship, GT, and X series devices",
        device_type: "phone"
      },
      {
        name: "Narzo/V/Q",
        brand: "Realme",
        models: ["Realme Narzo 10", "Realme Narzo 20", "Realme Narzo 20A", "Realme Narzo 20 Pro", "Realme Narzo 30", "Realme Narzo 30A", "Realme Narzo 30 Pro 5G", "Realme Narzo 50A", "Realme Narzo N53", "Realme Narzo N55", "Realme Narzo 60X 5G", "Realme V11", "Realme V11 5G", "Realme V11s", "Realme V20", "Realme V23 5G", "Realme V50", "Realme Q3 Pro", "Realme Q5 5G", "Realme Q5i"],
        description: "Realme Narzo, V, and Q series devices",
        device_type: "phone"
      },
      {
        name: "Entry E",
        brand: "Motorola",
        models: ["Moto E4 Plus", "Moto E5", "Moto E5 Plus"],
        description: "Motorola E series entry devices",
        device_type: "phone"
      },
      {
        name: "Main G",
        brand: "Motorola",
        models: ["Moto G4 Plus", "Moto G5 Plus", "Moto G5s Plus", "Moto G6", "Moto G40", "Moto G60"],
        description: "Motorola G series main devices",
        device_type: "phone"
      },
      {
        name: "One/Upper",
        brand: "Motorola",
        models: ["One Fusion Plus", "One Power", "Moto M", "Moto X4"],
        description: "Motorola One series and upper tier devices",
        device_type: "phone"
      },
      {
        name: "Entry C",
        brand: "Nokia",
        models: ["Nokia C02", "Nokia C12", "Nokia C12 Plus", "Nokia C12 Pro", "Nokia C21", "Nokia C22", "Nokia C31", "Nokia C32", "Nokia C100", "Nokia C200", "Nokia C210"],
        description: "Nokia C series entry devices",
        device_type: "phone"
      },
      {
        name: "Main G",
        brand: "Nokia",
        models: ["Nokia G11", "Nokia G21", "Nokia G22", "Nokia G42 5G", "Nokia G60 5G", "Nokia G100", "Nokia G400 5G"],
        description: "Nokia G series main devices",
        device_type: "phone"
      },
      {
        name: "Upper/X/6",
        brand: "Nokia",
        models: ["Nokia 3.1", "Nokia 5.1 Plus", "Nokia 6.1", "Nokia 6.1 Plus", "Nokia X30 5G"],
        description: "Nokia upper tier, X series, and 6 series devices",
        device_type: "phone"
      },
      {
        name: "Entry/Legacy",
        brand: "Honor",
        models: ["Honor 7X", "Honor 8X", "Honor 9 Lite", "Honor 9N"],
        description: "Honor entry level and legacy devices",
        device_type: "phone"
      },
      {
        name: "Performance",
        brand: "Honor",
        models: ["Honor 8 Pro", "Honor Play"],
        description: "Honor performance devices",
        device_type: "phone"
      },
      {
        name: "Pixel Entry",
        brand: "Google",
        models: ["Pixel 4a 5G", "Pixel 6A"],
        description: "Google Pixel entry level devices",
        device_type: "phone"
      },
      {
        name: "Pixel Flagship",
        brand: "Google",
        models: ["Pixel 6", "Pixel 6 Pro", "Pixel 7", "Pixel 7 Pro"],
        description: "Google Pixel flagship devices",
        device_type: "phone"
      },
      {
        name: "Entry/Value",
        brand: "POCO",
        models: ["POCO C3", "POCO C40", "POCO C50", "POCO C51", "POCO C55", "POCO C65"],
        description: "POCO entry level and value devices",
        device_type: "phone"
      },
      {
        name: "Mid X/M",
        brand: "POCO",
        models: ["POCO M2", "POCO M2 Pro", "POCO M3", "POCO M3 Pro 5G", "POCO M4 5G", "POCO M4 Pro", "POCO X2", "POCO X3", "POCO X3 Pro", "POCO X6 5G"],
        description: "POCO mid-range X and M series devices",
        device_type: "phone"
      },
      {
        name: "Flagship F",
        brand: "POCO",
        models: ["POCO F1", "POCO F4 5G", "POCO F5 5G", "POCO F5 Pro"],
        description: "POCO flagship F series devices",
        device_type: "phone"
      }
    ];

    console.log('Adding new brand-wise platform series...');
    for (const series of newPlatformSeries) {
      try {
        await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.MODEL_SERIES,
          ID.unique(),
          {
            ...series,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        );
        console.log(`Added series: ${series.name} (${series.brand})`);
      } catch (error) {
        console.error(`Error adding series ${series.name}:`, error);
      }
    }

    console.log('Platform series population completed successfully!');
  } catch (error) {
    console.error('Error in populatePlatformSeries:', error);
    throw error;
  }
};