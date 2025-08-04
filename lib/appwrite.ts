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
export const COLLECTIONS = {
  USERS: process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION_ID || 'user',
  PROVIDERS: process.env.NEXT_PUBLIC_APPWRITE_PROVIDERS_COLLECTION_ID || 'providers',
  DEVICES: process.env.NEXT_PUBLIC_APPWRITE_DEVICES_COLLECTION_ID || 'devices',
  PHONES: process.env.NEXT_PUBLIC_APPWRITE_PHONES_COLLECTION_ID || 'phones',
  LAPTOPS: process.env.NEXT_PUBLIC_APPWRITE_LAPTOPS_COLLECTION_ID || 'laptops',
  SERVICES: process.env.NEXT_PUBLIC_APPWRITE_SERVICES_COLLECTION_ID || 'services',
  BOOKINGS: process.env.NEXT_PUBLIC_APPWRITE_BOOKINGS_COLLECTION_ID || 'bookings',
  MESSAGES: process.env.NEXT_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID || 'messages',
  PAYMENTS: process.env.NEXT_PUBLIC_APPWRITE_PAYMENTS_COLLECTION_ID || 'payments',
  ADDRESSES: process.env.NEXT_PUBLIC_APPWRITE_ADDRESSES_COLLECTION_ID || 'addresses',
  BUSINESS_SETUP: 'business_setup',
  SERVICES_OFFERED: 'services_offered',
  ISSUES: process.env.NEXT_PUBLIC_APPWRITE_ISSUES_COLLECTION_ID || 'issues',
  CATEGORIES: process.env.NEXT_PUBLIC_APPWRITE_CATEGORIES_COLLECTION_ID || 'categories',
};