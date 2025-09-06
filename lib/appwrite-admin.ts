import { Client, Databases } from 'node-appwrite';

// Server-side Appwrite client with admin privileges
const adminClient = new Client();

adminClient
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '687398a90012d5a8d92f')
  .setKey(process.env.APPWRITE_API_KEY || ''); // Admin API key

export const adminDatabases = new Databases(adminClient);
export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '687399d400185ad33867';

export { adminClient };
