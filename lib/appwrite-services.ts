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
    console.log('🔍 Searching for customer profile with user_id:', userId);
    const response = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.CUSTOMERS,
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

export const getBusinessSetupByUserId = async (userId: string) => {
  try {
    console.log('🔍 Searching for business setup with user_id:', userId);
    const response = await databases.listDocuments(
      DATABASE_ID,
      'business_setup',
      [Query.equal('user_id', userId), Query.limit(1)]
    );
    
    console.log('📊 Found business setup documents:', response.documents.length);
    if (response.documents.length > 0) {
      console.log('✅ Business setup found:', response.documents[0]);
      return response.documents[0];
    } else {
      console.log('❌ No business setup found for user_id:', userId);
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching business setup:', error);
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
    // Step 1: Get the device's series information
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

    // Step 2: Look for series-based pricing first
    let seriesServices: any[] = [];
    if (deviceSeries) {
      try {
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
      } catch (error) {
        // Error fetching series services, continue with model lookup
      }
    }

    // Step 3: Look for custom series that include this model
    let customSeriesServices: any[] = [];
    try {
      // Get all custom series
      const customSeriesRes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CUSTOM_SERIES,
        [Query.equal('deviceType', deviceType)]
      );
      
              // Filter custom series that include this specific brand:model
        const matchingCustomSeries = customSeriesRes.documents.filter((series: any) => {
          if (!series.models || !Array.isArray(series.models)) return false;
          return series.models.some((modelString: string) => {
            const [seriesBrand, seriesModel] = modelString.split(':');
            return seriesBrand === brand && seriesModel === model;
          });
        });
        
        console.log('🔍 Found matching custom series:', matchingCustomSeries.length);
        
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
            pricingType: 'custom_series',
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
    
    // Override with custom series services (medium priority)
    customSeriesServices.forEach(service => {
      const key = `${service.providerId}-${service.issue}-${service.partType}`;
      mergedServices.set(key, {
        ...service,
        pricingType: 'custom_series',
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
    const modelsAsStrings = customizationData.models.map(model => 
      `${model.brand}:${model.model}`
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
    const updateData: any = { ...updates };
    if (updates.models) {
      updateData.models = updates.models.map(model => 
        `${model.brand}:${model.model}`
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



// Function to populate platform series with your cluster data
export const populatePlatformSeries = async (): Promise<void> => {
  try {
    console.log('Starting platform series population with cluster data...');

    // Check if platform series already exist
    const existingSeries = await getModelSeries();
    if (existingSeries.length > 0) {
      console.log('Platform series already exist, skipping population');
      return;
    }

    // Platform series data based on your clusters
    const platformSeriesData = [
      // Budget & Entry Level Series
      {
        name: "Budget Entry Level Series",
        brand: "Multi-Brand",
        device_type: "phone" as const,
        description: "Affordable phones with LCD displays, basic features for budget-conscious users",
        models: [
          "Samsung A04", "Samsung A04e", "Samsung A05", "Samsung A05s", "Samsung A10s", "Samsung A12", "Samsung F04",
          "Xiaomi Redmi 3S", "Xiaomi Redmi 4", "Xiaomi Redmi 4A", "Xiaomi Redmi 5A", "Xiaomi Redmi 6A", "Xiaomi Redmi 7A", "Xiaomi Redmi 8A", "Xiaomi Redmi 8A Dual", "Xiaomi Redmi 9A", "Xiaomi Redmi 9i", "Xiaomi Redmi A1", "Xiaomi Redmi A1 Plus", "Xiaomi Redmi A2", "Xiaomi Redmi A2 Plus", "Xiaomi Redmi 12C", "Xiaomi Redmi 13C", "Xiaomi Redmi 13C 5G",
          "Vivo Y02", "Vivo Y02A", "Vivo Y02s", "Vivo Y02T", "Vivo Y11 2023", "Vivo Y12", "Vivo Y12 2023", "Vivo Y12s", "Vivo Y15 2019", "Vivo Y15c", "Vivo Y16", "Vivo Y17",
          "Realme C11", "Realme C21", "Realme C25",
          "OPPO A1K", "OPPO A3s", "OPPO A5", "OPPO A5s", "OPPO A7", "OPPO A12", "OPPO A15"
        ]
      },

      // Lower Mid LCD Group
      {
        name: "Lower Mid-Range LCD Series",
        brand: "Multi-Brand",
        device_type: "phone" as const,
        description: "Lower mid-range phones with LCD displays, improved performance over budget models",
        models: [
          "Samsung M13 5G", "Samsung A13", "Samsung A14", "Samsung A14 5G", "Samsung F14 5G",
          "Xiaomi Redmi 5", "Xiaomi Redmi 6 Pro", "Xiaomi Redmi Y1", "Xiaomi Redmi Y2", "Xiaomi Redmi Y3", "Xiaomi Redmi 7", "Xiaomi Redmi 8", "Xiaomi Redmi 9", "Xiaomi Redmi 9 Prime", "Xiaomi Redmi 9 Power", "Xiaomi Redmi 10 Prime", "Xiaomi Redmi 11 Prime 5G", "Xiaomi Redmi 12", "Xiaomi Redmi 12 5G",
          "Vivo Y19", "Vivo Y20", "Vivo Y21", "Vivo Y21 2021", "Vivo Y22 2022", "Vivo Y22s", "Vivo Y27", "Vivo Y27 5G", "Vivo Y27s", "Vivo Y30 5G", "Vivo Y33s",
          "OPPO A31", "OPPO A32", "OPPO A33", "OPPO A36", "OPPO A37", "OPPO A52", "OPPO A53", "OPPO A54"
        ]
      },

      // Mainstream LCD/AMOLED Group
      {
        name: "Mainstream LCD/AMOLED Series",
        brand: "Multi-Brand",
        device_type: "phone" as const,
        description: "Mainstream phones with LCD or AMOLED displays, balanced performance and features",
        models: [
          "Samsung M20", "Samsung M21", "Samsung M23 5G", "Samsung M30", "Samsung M30s", "Samsung A20", "Samsung A20s", "Samsung A21s", "Samsung A22", "Samsung A22 5G", "Samsung A23", "Samsung A24",
          "Xiaomi Redmi Note 3", "Xiaomi Redmi Note 4", "Xiaomi Redmi Note 5", "Xiaomi Redmi Note 5 Pro", "Xiaomi Redmi Note 6 Pro", "Xiaomi Redmi Note 7", "Xiaomi Redmi Note 7S", "Xiaomi Redmi Note 7 Pro", "Xiaomi Redmi Note 8", "Xiaomi Redmi Note 8 Pro",
          "Vivo V3", "Vivo V5", "Vivo V5 Plus", "Vivo V5s", "Vivo V7", "Vivo V7 Plus", "Vivo V9", "Vivo V9 Pro", "Vivo V9 Youth", "Vivo V11", "Vivo V11 Pro",
          "Realme 7", "Realme 8", "Realme 9", "Realme 9i", "Realme Narzo 20",
          "OPPO A71", "OPPO A72", "OPPO A74", "OPPO A76"
        ]
      },

      // Mid AMOLED Group
      {
        name: "Mid-Range AMOLED Series",
        brand: "Multi-Brand",
        device_type: "phone" as const,
        description: "Mid-range phones with AMOLED displays, enhanced visual experience",
        models: [
          "Samsung A30", "Samsung A30s", "Samsung A31", "Samsung A32", "Samsung M32", "Samsung M34 5G",
          "Xiaomi Redmi Note 9", "Xiaomi Redmi Note 9 Pro", "Xiaomi Redmi Note 9 Pro Max", "Xiaomi Redmi Note 10", "Xiaomi Redmi Note 10S",
          "Vivo V15", "Vivo V15 Pro", "Vivo V17", "Vivo V17 Pro",
          "Realme 10", "Realme 10 Pro", "Realme GT Master",
          "OPPO F7", "OPPO F9", "OPPO F11", "OPPO F11 Pro", "OPPO F15"
        ]
      },

      // Upper Mid AMOLED Group
      {
        name: "Upper Mid-Range AMOLED Series",
        brand: "Multi-Brand",
        device_type: "phone" as const,
        description: "Upper mid-range phones with AMOLED displays, premium features at accessible prices",
        models: [
          "Samsung A50", "Samsung A50s", "Samsung A51", "Samsung A52", "Samsung M40", "Samsung M51", "Samsung M54",
          "Xiaomi Redmi Note 10 Pro", "Xiaomi Redmi Note 10 Pro Max", "Xiaomi Redmi Note 11", "Xiaomi Redmi Note 11S", "Xiaomi Redmi Note 11 SE",
          "Vivo V19", "Vivo V20", "Vivo V20 SE", "Vivo V20 Pro",
          "Realme GT Neo 2",
          "OnePlus Nord", "OnePlus Nord CE", "OnePlus Nord 2", "OnePlus Nord 2T",
          "OPPO F17", "OPPO F17 Pro", "OPPO F19 Pro"
        ]
      },

      // Premium Standard AMOLED Group
      {
        name: "Premium Standard AMOLED Series",
        brand: "Multi-Brand",
        device_type: "phone" as const,
        description: "Premium phones with AMOLED displays, flagship-level features and performance",
        models: [
          "Samsung A70", "Samsung A70s", "Samsung A71", "Samsung M62", "Samsung F41", "Samsung F62",
          "Xiaomi Redmi Note 11 Pro", "Xiaomi Redmi Note 11 Pro Plus 5G", "Xiaomi Redmi Note 11S 5G", "Xiaomi Redmi Note 12", "Xiaomi Redmi Note 12s", "Xiaomi Redmi Note 12 Pro", "Xiaomi Redmi Note 12 Pro Plus 5G", "Xiaomi Redmi Note 12 Pro Speed Edition", "Xiaomi Redmi Note 12T Pro", "Xiaomi Redmi Note 13 5G",
          "Vivo V21", "Vivo V21e", "Vivo V21s", "Vivo V23", "Vivo V23e", "Vivo V23 Pro", "Vivo V25", "Vivo V25 Pro", "Vivo V27", "Vivo V27 Pro", "Vivo V29", "Vivo V29 Pro", "Vivo V30", "Vivo V30e",
          "Realme GT Neo 3",
          "OnePlus Nord 3", "OnePlus Nord CE 3"
        ]
      },

      // Premium Flagship Standard Group
      {
        name: "Premium Flagship Standard Series",
        brand: "Multi-Brand",
        device_type: "phone" as const,
        description: "Premium flagship phones with cutting-edge features and performance",
        models: [
          "Samsung S21", "Samsung A73 5G",
          "Xiaomi 12X", "Xiaomi 12T", "Xiaomi 12 Pro", "Xiaomi Mi 13",
          "Vivo X80", "Vivo X90",
          "Realme GT 2 Pro",
          "OnePlus 9", "OnePlus 9RT", "OnePlus 9R", "OnePlus 10R", "OnePlus 11R",
          "OPPO Reno 8 Pro", "OPPO Reno 10 Pro", "OPPO F21 Pro"
        ]
      },

      // Ultra Flagship (Isolated)
      {
        name: "Ultra Flagship Series",
        brand: "Samsung",
        device_type: "phone" as const,
        description: "Ultra-premium flagship phones with the latest technology and features",
        models: ["Samsung S22 Ultra", "Samsung S23 Ultra", "Samsung S24 Ultra"]
      },

      // Foldable/Unique (Isolated)
      {
        name: "Foldable & Unique Series",
        brand: "Samsung",
        device_type: "phone" as const,
        description: "Innovative foldable phones and unique form factors",
        models: ["Samsung Z Fold3", "Samsung Z Fold4", "Samsung Z Fold5", "Samsung Z Fold6", "Samsung Z Flip3", "Samsung Z Flip4", "Samsung Z Flip5", "Samsung Z Flip6"]
      },

      // Apple Budget LCD Group
      {
        name: "Apple Budget LCD Series",
        brand: "Apple",
        device_type: "phone" as const,
        description: "Affordable Apple iPhones with LCD displays, great for entry-level Apple users",
        models: ["iPhone 5", "iPhone 5c", "iPhone 5s", "iPhone 6", "iPhone 6 Plus", "iPhone 6S", "iPhone 6S Plus", "iPhone SE 1st Gen", "iPhone 7", "iPhone 7 Plus", "iPhone 8", "iPhone 8 Plus", "iPhone SE 2020", "iPhone SE 2022"]
      },

      // Apple X to 11 OLED Group
      {
        name: "Apple X to 11 OLED Series",
        brand: "Apple",
        device_type: "phone" as const,
        description: "Apple iPhones with OLED displays, introducing modern design and features",
        models: ["iPhone X", "iPhone XR", "iPhone XS", "iPhone XS Max", "iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max"]
      },

      // Apple 12–14 Series Group
      {
        name: "Apple 12-14 Series",
        brand: "Apple",
        device_type: "phone" as const,
        description: "Modern Apple iPhones with advanced features, 5G support, and improved cameras",
        models: ["iPhone 12", "iPhone 12 Mini", "iPhone 12 Pro", "iPhone 12 Pro Max", "iPhone 13", "iPhone 13 Mini", "iPhone 13 Pro", "iPhone 13 Pro Max", "iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro", "iPhone 14 Pro Max"]
      },

      // Apple 15 Series Group
      {
        name: "Apple 15 Series",
        brand: "Apple",
        device_type: "phone" as const,
        description: "Latest Apple iPhones with cutting-edge technology and premium features",
        models: ["iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro"]
      },

      // Apple Ultra Flagship (Isolated)
      {
        name: "Apple Ultra Flagship Series",
        brand: "Apple",
        device_type: "phone" as const,
        description: "Ultra-premium Apple iPhones with the most advanced features and performance",
        models: ["iPhone 15 Pro Max"]
      },

      // Xiaomi Flagship/Gaming (Isolated)
      {
        name: "Xiaomi Flagship & Gaming Series",
        brand: "Xiaomi",
        device_type: "phone" as const,
        description: "Xiaomi flagship phones and gaming-focused devices with high performance",
        models: ["K20 Pro", "K30 5G Extreme", "K60", "Black Shark 4 Pro"]
      },

      // Older Flagship (Isolated)
      {
        name: "Classic Flagship Series",
        brand: "Multi-Brand",
        device_type: "phone" as const,
        description: "Classic flagship phones from previous generations, still powerful and reliable",
        models: ["Samsung Note 9", "Samsung Note 10 Lite", "iPhone XS Max"]
      }
    ];

    console.log(`Creating ${platformSeriesData.length} platform series...`);

    // Create all platform series
    for (const seriesData of platformSeriesData) {
      try {
        await createModelSeries(seriesData);
        console.log(`Created platform series: ${seriesData.name}`);
      } catch (error) {
        console.error(`Error creating series ${seriesData.name}:`, error);
      }
    }

    console.log('Platform series population completed!');
  } catch (error) {
    console.error('Error populating platform series:', error);
    throw error;
  }
};