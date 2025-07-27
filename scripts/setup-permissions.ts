import { Client, Databases, ID } from 'node-appwrite';
import { config } from './config.js';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setKey(config.apiKey);

const databases = new Databases(client);
const DATABASE_ID = config.databaseId;

export const setupPermissions = async () => {
  console.log('🔧 Setting up database permissions...');

  try {
    // Enable document security for Users collection
    await databases.updateCollection(
      DATABASE_ID,
      'users',
      'Users',
      ['create("users")', 'read("users")', 'update("users")', 'delete("users")']
    );
    console.log('✅ Users collection permissions updated');

    // Enable document security for Providers collection
    await databases.updateCollection(
      DATABASE_ID,
      'providers',
      'Providers',
      ['create("users")', 'read("users")', 'update("users")', 'delete("users")']
    );
    console.log('✅ Providers collection permissions updated');

    // Enable read access for Devices collection
    await databases.updateCollection(
      DATABASE_ID,
      'devices',
      'Devices',
      ['read("users")']
    );
    console.log('✅ Devices collection permissions updated');

    // Enable read access for Services collection
    await databases.updateCollection(
      DATABASE_ID,
      'services',
      'Services',
      ['read("users")']
    );
    console.log('✅ Services collection permissions updated');

    // Enable document security for Bookings collection
    await databases.updateCollection(
      DATABASE_ID,
      'bookings',
      'Bookings',
      ['create("users")', 'read("users")', 'update("users")', 'delete("users")']
    );
    console.log('✅ Bookings collection permissions updated');

    // Remove Customers collection permissions setup

    console.log('🎉 Database permissions setup completed successfully!');
  } catch (error) {
    console.error('❌ Error during permissions setup:', error);
    throw error;
  }
};

// Remove CommonJS require.main check and add ESM-compatible entrypoint
setupPermissions().then(() => {
  console.log('🎉 Permissions setup complete!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Permissions setup failed:', error);
  process.exit(1);
}); 