import { Client, Databases, ID } from 'node-appwrite';
import { config } from './config.js';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setKey(config.apiKey);

const databases = new Databases(client);
const DATABASE_ID = config.databaseId;

const createUserCollection = async () => {
  console.log('🚀 Creating new user collection...');

  try {
    // Create the user collection
    await databases.createCollection(DATABASE_ID, 'user', 'User');
    console.log('✅ User collection created');

    // Create attributes for the new schema
    const attributes = [
      // Core user fields
      { name: 'user_id', type: 'string', size: 255, required: true },
      { name: 'name', type: 'string', size: 255, required: true },
      { name: 'email', type: 'email', required: true },
      { name: 'phone', type: 'string', size: 20, required: false },
      
      // Roles and status
      { name: 'roles', type: 'string', size: 1000, required: true }, // JSON array as string
      { name: 'is_verified', type: 'boolean', required: false },
      { name: 'is_active', type: 'boolean', required: false },
      
      // Address fields (for providers)
      { name: 'address_city', type: 'string', size: 100, required: false },
      { name: 'address_state', type: 'string', size: 100, required: false },
      { name: 'address_zip', type: 'string', size: 20, required: false },
      { name: 'address_lat', type: 'float', required: false },
      { name: 'address_lng', type: 'float', required: false },
      
      // Timestamps
      { name: 'created_at', type: 'datetime', required: true },
      { name: 'updated_at', type: 'datetime', required: false }
    ];

    for (const attr of attributes) {
      try {
        if (attr.type === 'string') {
          await databases.createStringAttribute(DATABASE_ID, 'user', attr.name, attr.size!, attr.required);
        } else if (attr.type === 'email') {
          await databases.createEmailAttribute(DATABASE_ID, 'user', attr.name, attr.required);
        } else if (attr.type === 'boolean') {
          await databases.createBooleanAttribute(DATABASE_ID, 'user', attr.name, attr.required);
        } else if (attr.type === 'float') {
          await databases.createFloatAttribute(DATABASE_ID, 'user', attr.name, attr.required);
        } else if (attr.type === 'datetime') {
          await databases.createDatetimeAttribute(DATABASE_ID, 'user', attr.name, attr.required);
        }
        console.log(`✅ Added attribute: ${attr.name}`);
      } catch (error: any) {
        if (error.code === 409) {
          console.log(`ℹ️ Attribute ${attr.name} already exists`);
        } else {
          console.error(`❌ Error adding attribute ${attr.name}:`, error);
        }
      }
    }

    console.log('🎉 User collection setup completed!');
  } catch (error: any) {
    if (error.code === 409) {
      console.log('ℹ️ User collection already exists');
    } else {
      console.error('❌ Error creating user collection:', error);
    }
  }
};

createUserCollection(); 