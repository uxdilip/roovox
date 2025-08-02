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
    const response = await databases.listDocuments(
      DATABASE_ID,
      'brands',
      [Query.equal('category_id', category)]
    );
    return response.documents.map((doc: any) => ({
      key: doc.name,
      label: doc.name.charAt(0).toUpperCase() + doc.name.slice(1)
    }));
  } catch (error) {
    console.error('Error fetching brands by category:', error);
    return [];
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

// Test function to create a sample service
export const createTestService = async (providerId: string) => {
  try {
    const testService = await createServiceOffered({
      providerId,
      deviceType: 'Phone',
      brand: 'Test Brand',
      model: 'Test Model',
      issue: 'Test Issue',
      partType: null,
      price: 1000,
      warranty: null,
      created_at: new Date().toISOString(),
    });
    console.log('✅ Test service created successfully:', testService);
    return testService;
  } catch (error) {
    console.error('❌ Failed to create test service:', error);
    throw error;
  }
}; 

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
      'customers',
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
        'customers',
        existingDoc.$id,
        updateData
      );
      
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
        'customers',
        ID.unique(),
        newCustomerData
      );
      
      console.log('✅ New customer profile created:', newDoc.$id);
      
      // Also update the user's name in the User collection
      try {
        console.log('🔄 Updating user name in User collection...');
        await databases.updateDocument(
          DATABASE_ID,
          'User',
          customerData.user_id,
          {
            name: customerData.full_name
          }
        );
        console.log('✅ User name updated in User collection');
      } catch (userUpdateError) {
        console.error('⚠️ Failed to update user name:', userUpdateError);
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
    console.log('🔍 Searching for customer profile with user_id:', userId);
    const response = await databases.listDocuments(
      DATABASE_ID,
      'customers',
      [Query.equal('user_id', userId), Query.limit(1)]
    );
    
    console.log('📊 Found customer documents:', response.documents.length);
    if (response.documents.length > 0) {
      console.log('✅ Customer profile found:', response.documents[0]);
      return response.documents[0];
    } else {
      console.log('❌ No customer profile found for user_id:', userId);
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching customer profile:', error);
    return null;
  }
}; 