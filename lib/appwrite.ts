import { Client, Account, Databases, Storage, Functions } from 'appwrite';

const client = new Client();

client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '687398a90012d5a8d92f');

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

export { client };

export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '687399d400185ad33867';

// OAuth Configuration
export const GOOGLE_OAUTH_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === 'true';

// OAuth utility functions
export const createGoogleOAuthSession = async (successUrl: string, failureUrl: string) => {
  console.log('🔐 Attempting Google OAuth...', {
    enabled: GOOGLE_OAUTH_ENABLED,
    successUrl,
    failureUrl,
    endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
    projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
    appUrl: process.env.NEXT_PUBLIC_APP_URL
  });

  if (!GOOGLE_OAUTH_ENABLED) {
    throw new Error('Google OAuth is not enabled. Please contact support.');
  }
  
  try {
    const result = await account.createOAuth2Session('google' as any, successUrl, failureUrl);
    console.log('✅ Google OAuth session created successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Google OAuth error:', error);
    if (error instanceof Error) {
      throw new Error(`Google OAuth failed: ${error.message}`);
    }
    throw new Error('Google sign-in is not available at the moment. Please try using phone number or email instead.');
  }
};

// Helper function to get the correct OAuth URLs
export const getOAuthUrls = (path: string = '') => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const fullPath = path.startsWith('/') ? path : `/${path}`;
  
  return {
    successUrl: `${baseUrl}${fullPath}`,
    failureUrl: `${baseUrl}/login?error=oauth`
  };
};

export const COLLECTIONS = {
  USERS: process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID || 'user',
  PROVIDERS: process.env.NEXT_PUBLIC_APPWRITE_PROVIDERS_COLLECTION_ID || 'providers',
  CUSTOMERS: process.env.NEXT_PUBLIC_APPWRITE_CUSTOMERS_COLLECTION_ID || 'customers',
  // Use the collections that actually exist and work
  DEVICES: process.env.NEXT_PUBLIC_APPWRITE_DEVICES_COLLECTION_ID || 'phones', // Use phones as default since it exists
  PHONES: process.env.NEXT_PUBLIC_APPWRITE_PHONES_COLLECTION_ID || 'phones',
  LAPTOPS: process.env.NEXT_PUBLIC_APPWRITE_LAPTOPS_COLLECTION_ID || 'laptops',
  SERVICES: process.env.NEXT_PUBLIC_APPWRITE_SERVICES_COLLECTION_ID || 'custom_series_services', // Use custom_series_services as default
  BOOKINGS: process.env.NEXT_PUBLIC_APPWRITE_BOOKINGS_COLLECTION_ID || 'bookings',
  MESSAGES: process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID || 'messages',
  PAYMENTS: process.env.NEXT_PUBLIC_APPWRITE_PAYMENTS_COLLECTION_ID || 'payments',
  ADDRESSES: process.env.NEXT_PUBLIC_APPWRITE_ADDRESSES_COLLECTION_ID || 'addresses',
  BUSINESS_SETUP: 'business_setup',
  SERVICES_OFFERED: 'services_offered',
  ISSUES: process.env.NEXT_PUBLIC_APPWRITE_ISSUES_COLLECTION_ID || 'issues',
  MODEL_SERIES: 'model_series',
  CUSTOM_SERIES: 'custom_series',
  CUSTOM_SERIES_SERVICES: 'custom_series_services',
  OFFERS: '68a74c1a001346172533',
  // 🔔 NEW: Notifications collection
  NOTIFICATIONS: 'notifications',
};