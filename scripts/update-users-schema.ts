// Script to update the Appwrite bookings collection schema with new attributes
import 'dotenv/config';
import { Client, Databases } from 'node-appwrite';

const client = new Client();
client
  .setEndpoint(process.env.APPWRITE_ENDPOINT!)
  .setProject(process.env.APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!);

const databases = new Databases(client);

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID!;
const COLLECTION_ID = 'bookings';

async function updateBookingsSchema() {
  try {
    // Add selected_issues (string, 5000, not required)
    try {
      await databases.createStringAttribute(
        DATABASE_ID,
        COLLECTION_ID,
        'selected_issues',
        5000,
        false,
        undefined,
        false
      );
      console.log('✅ Added selected_issues attribute');
    } catch (e: any) {
      if (e.message && e.message.includes('already exists')) {
        console.log('selected_issues already exists, skipping');
      } else {
        throw e;
      }
    }
    // Add warranty (string, 100, not required)
    try {
      await databases.createStringAttribute(
        DATABASE_ID,
        COLLECTION_ID,
        'warranty',
        100,
        false,
        undefined,
        false
      );
      console.log('✅ Added warranty attribute');
    } catch (e: any) {
      if (e.message && e.message.includes('already exists')) {
        console.log('warranty already exists, skipping');
        } else {
        throw e;
      }
    }
    // Add serviceMode (enum: doorstep, instore, not required)
    try {
      await databases.createEnumAttribute(
        DATABASE_ID,
        COLLECTION_ID,
        'serviceMode',
        ['doorstep', 'instore'],
        false,
        undefined,
        false
      );
      console.log('✅ Added serviceMode attribute');
    } catch (e: any) {
      if (e.message && e.message.includes('already exists')) {
        console.log('serviceMode already exists, skipping');
      } else {
        throw e;
      }
    }
    console.log('Bookings collection schema update complete.');
  } catch (err) {
    console.error('❌ Error updating bookings schema:', err);
    process.exit(1);
  }
}

updateBookingsSchema(); 