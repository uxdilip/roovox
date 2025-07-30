import { Client, Databases, ID } from 'node-appwrite';
import { config, COLLECTIONS } from './config.js';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setKey(config.apiKey);

const databases = new Databases(client);
const DATABASE_ID = config.databaseId;

const deleteAllProviders = async () => {
  try {
    const docs = await databases.listDocuments(DATABASE_ID, COLLECTIONS.PROVIDERS, []);
    for (const doc of docs.documents) {
      try {
        await databases.deleteDocument(DATABASE_ID, COLLECTIONS.PROVIDERS, doc.$id);
        console.log(`Deleted provider document: ${doc.$id}`);
      } catch (e) {
        console.error(`Failed to delete provider document: ${doc.$id}`, e);
      }
    }
    console.log('✅ All provider documents deleted');
  } catch (e) {
    console.error('Error listing provider documents:', e);
  }
};

export const setupDatabase = async () => {
  console.log('🚀 Starting database setup...');

  try {
    // Clean up providers collection
    await deleteAllProviders();

    // Create database
    try {
      await databases.create(DATABASE_ID, 'Device Repair Platform');
      console.log('✅ Database created successfully');
    } catch (error: any) {
      if (error.code === 409) {
        console.log('ℹ️ Database already exists');
      } else {
        throw error;
      }
    }

    // Create collections and attributes
    await createUsersCollection();
    await createProvidersCollection();
    await createDevicesCollection();
    await createServicesCollection();
    await createBookingsCollection();
    await createMessagesCollection();
    await createPaymentsCollection();
    await createCommissionsCollection();
    await createComplaintsCollection();
    await createBusinessSetupCollection();
    await createServicesOfferedCollection();

    // Add creation of 'phones' collection
    try {
      await databases.createCollection(DATABASE_ID, 'phones', 'Phones');
      await databases.createStringAttribute(DATABASE_ID, 'phones', 'brand', 100, true);
      await databases.createStringAttribute(DATABASE_ID, 'phones', 'model', 255, true);
      await databases.createStringAttribute(DATABASE_ID, 'phones', 'specifications', 2000, false);
      await databases.createStringAttribute(DATABASE_ID, 'phones', 'image_url', 500, false);
      console.log('✅ Phones collection created');
    } catch (error) {
      if ((error as any).code === 409) {
        console.log('ℹ️ Phones collection already exists');
      } else {
        console.error('❌ Error creating Phones collection:', error);
      }
    }

    // Add creation of 'laptops' collection
    try {
      await databases.createCollection(DATABASE_ID, 'laptops', 'Laptops');
      await databases.createStringAttribute(DATABASE_ID, 'laptops', 'brand', 100, true);
      await databases.createStringAttribute(DATABASE_ID, 'laptops', 'model', 255, true);
      await databases.createStringAttribute(DATABASE_ID, 'laptops', 'specifications', 2000, false);
      await databases.createStringAttribute(DATABASE_ID, 'laptops', 'image_url', 500, false);
      console.log('✅ Laptops collection created');
    } catch (error) {
      if ((error as any).code === 409) {
        console.log('ℹ️ Laptops collection already exists');
      } else {
        console.error('❌ Error creating Laptops collection:', error);
      }
    }

    console.log('🎉 Database setup completed successfully!');
  } catch (error) {
    console.error('❌ Error during database setup:', error);
    throw error;
  }
};

const createUsersCollection = async () => {
  try {
    await databases.createCollection(DATABASE_ID, COLLECTIONS.USERS, 'Users');
    console.log('✅ Users collection created');

    // Create attributes with new schema
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.USERS, 'user_id', 255, true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.USERS, 'name', 255, true);
    await databases.createEmailAttribute(DATABASE_ID, COLLECTIONS.USERS, 'email', true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.USERS, 'phone', 20, false);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.USERS, 'roles', 1000, true); // JSON array as string
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.USERS, 'address_city', 100, false);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.USERS, 'address_state', 100, false);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.USERS, 'address_zip', 20, false);
    await databases.createFloatAttribute(DATABASE_ID, COLLECTIONS.USERS, 'address_lat', false);
    await databases.createFloatAttribute(DATABASE_ID, COLLECTIONS.USERS, 'address_lng', false);
    await databases.createDatetimeAttribute(DATABASE_ID, COLLECTIONS.USERS, 'created_at', true);

    console.log('✅ Users attributes created with new schema');
  } catch (error: any) {
    if (error.code === 409) {
      console.log('ℹ️ Users collection already exists');
    } else {
      console.error('❌ Error creating Users collection:', error);
    }
  }
};

const ensureProvidersAttributes = async () => {
  const requiredAttributes = [
    { key: 'role', type: 'string', size: 32, required: true },
    { key: 'isVerified', type: 'boolean', required: true },
    { key: 'isApproved', type: 'boolean', required: true },
    { key: 'onboardingCompleted', type: 'boolean', required: true },
    { key: 'joinedAt', type: 'datetime', required: true },
  ];
  try {
    const attrs = await databases.listAttributes(DATABASE_ID, COLLECTIONS.PROVIDERS);
    const existing = attrs.attributes.map(a => a.key);
    for (const attr of requiredAttributes) {
      if (!existing.includes(attr.key)) {
        try {
          if (attr.type === 'string') {
            await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.PROVIDERS, attr.key, attr.size as number, attr.required);
          } else if (attr.type === 'boolean') {
            await databases.createBooleanAttribute(DATABASE_ID, COLLECTIONS.PROVIDERS, attr.key, attr.required);
          } else if (attr.type === 'datetime') {
            await databases.createDatetimeAttribute(DATABASE_ID, COLLECTIONS.PROVIDERS, attr.key, attr.required);
          }
          console.log(`✅ Created missing attribute: ${attr.key}`);
        } catch (e) {
          console.error(`❌ Error creating attribute ${attr.key}:`, e);
        }
      }
    }
  } catch (e) {
    console.error('Error listing provider attributes:', e);
  }
};

const createProvidersCollection = async () => {
  try {
    await databases.createCollection(DATABASE_ID, COLLECTIONS.PROVIDERS, 'Providers');
    console.log('✅ Providers collection created');

    // Create attributes as per new requirements (no defaults for required fields)
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.PROVIDERS, 'providerId', 255, true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.PROVIDERS, 'email', 255, true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.PROVIDERS, 'phone', 32, true);
    // The rest will be ensured by ensureProvidersAttributes
    await ensureProvidersAttributes();

    console.log('✅ Providers attributes created (updated schema, no defaults for required fields)');
  } catch (error: any) {
    if (error.code === 409) {
      console.log('ℹ️ Providers collection already exists');
      await ensureProvidersAttributes();
    } else {
      console.error('❌ Error creating Providers collection:', error);
    }
  }
};

const createDevicesCollection = async () => {
  try {
    await databases.createCollection(DATABASE_ID, COLLECTIONS.DEVICES, 'Devices');
    console.log('✅ Devices collection created');

    // Create attributes
    await databases.createEnumAttribute(DATABASE_ID, COLLECTIONS.DEVICES, 'category', ['phone', 'laptop'], true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.DEVICES, 'brand', 100, true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.DEVICES, 'model', 255, true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.DEVICES, 'specifications', 2000, false);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.DEVICES, 'common_issues', 5000, false);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.DEVICES, 'image_url', 500, false);

    console.log('✅ Devices attributes created');
  } catch (error: any) {
    if (error.code === 409) {
      console.log('ℹ️ Devices collection already exists');
    } else {
      console.error('❌ Error creating Devices collection:', error);
    }
  }
};

const createServicesCollection = async () => {
  try {
    await databases.createCollection(DATABASE_ID, COLLECTIONS.SERVICES, 'Services');
    console.log('✅ Services collection created');

    // Create attributes
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.SERVICES, 'device_id', 255, true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.SERVICES, 'name', 255, true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.SERVICES, 'description', 1000, false);
    await databases.createFloatAttribute(DATABASE_ID, COLLECTIONS.SERVICES, 'base_price', true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.SERVICES, 'part_qualities', 2000, false);

    console.log('✅ Services attributes created');
  } catch (error: any) {
    if (error.code === 409) {
      console.log('ℹ️ Services collection already exists');
    } else {
      console.error('❌ Error creating Services collection:', error);
    }
  }
};

const createBookingsCollection = async () => {
  try {
    await databases.createCollection(DATABASE_ID, COLLECTIONS.BOOKINGS, 'Bookings');
    console.log('✅ Bookings collection created');

    // Create attributes
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.BOOKINGS, 'customer_id', 255, true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.BOOKINGS, 'provider_id', 255, true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.BOOKINGS, 'device_id', 255, true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.BOOKINGS, 'service_id', 255, true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.BOOKINGS, 'issue_description', 2000, false);
    await databases.createEnumAttribute(DATABASE_ID, COLLECTIONS.BOOKINGS, 'part_quality', ['basic', 'standard', 'premium'], true);
    await databases.createEnumAttribute(DATABASE_ID, COLLECTIONS.BOOKINGS, 'status', ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'], true);
    await databases.createDatetimeAttribute(DATABASE_ID, COLLECTIONS.BOOKINGS, 'appointment_time', true);
    await databases.createFloatAttribute(DATABASE_ID, COLLECTIONS.BOOKINGS, 'total_amount', true);
    await databases.createEnumAttribute(DATABASE_ID, COLLECTIONS.BOOKINGS, 'payment_status', ['pending', 'completed', 'refunded', 'cancelled'], true);
    await databases.createEnumAttribute(DATABASE_ID, COLLECTIONS.BOOKINGS, 'payment_method', ['online', 'cod'], false);
    await databases.createEnumAttribute(DATABASE_ID, COLLECTIONS.BOOKINGS, 'location_type', ['doorstep', 'provider_location'], true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.BOOKINGS, 'customer_address', 1000, false);
    await databases.createFloatAttribute(DATABASE_ID, COLLECTIONS.BOOKINGS, 'rating', false);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.BOOKINGS, 'review', 1000, false);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.BOOKINGS, 'cancellation_reason', 1000, false);
    await databases.createDatetimeAttribute(DATABASE_ID, COLLECTIONS.BOOKINGS, 'created_at', true);
    await databases.createDatetimeAttribute(DATABASE_ID, COLLECTIONS.BOOKINGS, 'updated_at', true);

    console.log('✅ Bookings attributes created');
  } catch (error: any) {
    if (error.code === 409) {
      console.log('ℹ️ Bookings collection already exists');
    } else {
      console.error('❌ Error creating Bookings collection:', error);
    }
  }
};

const createMessagesCollection = async () => {
  try {
    await databases.createCollection(DATABASE_ID, COLLECTIONS.MESSAGES, 'Messages');
    console.log('✅ Messages collection created');

    // Create attributes
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.MESSAGES, 'booking_id', 255, true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.MESSAGES, 'sender_id', 255, true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.MESSAGES, 'receiver_id', 255, true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.MESSAGES, 'content', 2000, true);
    await databases.createStringAttribute(DATABASE_ID, COLLECTIONS.MESSAGES, 'attachment_url', 500, false);
    await databases.createBooleanAttribute(DATABASE_ID, COLLECTIONS.MESSAGES, 'read', true);
    await databases.createDatetimeAttribute(DATABASE_ID, COLLECTIONS.MESSAGES, 'created_at', true);

    console.log('✅ Messages attributes created');
  } catch (error: any) {
    if (error.code === 409) {
      console.log('ℹ️ Messages collection already exists');
    } else {
      console.error('❌ Error creating Messages collection:', error);
    }
  }
};

const createPaymentsCollection = async () => {
  try {
    await databases.createCollection(DATABASE_ID, COLLECTIONS.PAYMENTS, 'Payments');
    console.log('✅ Payments collection created');
  } catch (error: any) {
    if (error.code === 409) {
      console.log('ℹ️ Payments collection already exists');
    } else {
      console.error('❌ Error creating Payments collection:', error);
      return;
    }
  }

  // Ensure all required attributes exist (migration-safe)
  try {
    const attrs = await databases.listAttributes(DATABASE_ID, COLLECTIONS.PAYMENTS);
    const existing = attrs.attributes.map((a: any) => a.key);
    // Helper to avoid duplicate creation
    const ensure = async (fn: () => Promise<any>, key: string) => {
      if (!existing.includes(key)) {
        try {
          await fn();
          console.log(`✅ Created attribute: ${key}`);
        } catch (e: any) {
          if (e.code === 409) {
            console.log(`ℹ️ Attribute already exists: ${key}`);
          } else {
            console.error(`❌ Error creating attribute ${key}:`, e);
          }
        }
      }
    };
    // booking_id (string, required)
    await ensure(() => databases.createStringAttribute(DATABASE_ID, COLLECTIONS.PAYMENTS, 'booking_id', 255, true), 'booking_id');
    // amount (number, required)
    await ensure(() => databases.createFloatAttribute(DATABASE_ID, COLLECTIONS.PAYMENTS, 'amount', true), 'amount');
    // method (string, required, enum)
    await ensure(() => databases.createEnumAttribute(DATABASE_ID, COLLECTIONS.PAYMENTS, 'method', ['Razorpay', 'COD'], true), 'method');
    // status (string, required, enum)
    await ensure(() => databases.createEnumAttribute(DATABASE_ID, COLLECTIONS.PAYMENTS, 'status', ['pending', 'completed', 'failed', 'manual_due'], true), 'status');
    // razorpay_order_id (string, optional)
    await ensure(() => databases.createStringAttribute(DATABASE_ID, COLLECTIONS.PAYMENTS, 'razorpay_order_id', 255, false), 'razorpay_order_id');
    // razorpay_payment_id (string, optional)
    await ensure(() => databases.createStringAttribute(DATABASE_ID, COLLECTIONS.PAYMENTS, 'razorpay_payment_id', 255, false), 'razorpay_payment_id');
    // commission (number, required)
    await ensure(() => databases.createFloatAttribute(DATABASE_ID, COLLECTIONS.PAYMENTS, 'commission', true), 'commission');
    // provider_payout (number, required)
    await ensure(() => databases.createFloatAttribute(DATABASE_ID, COLLECTIONS.PAYMENTS, 'provider_payout', true), 'provider_payout');
    // is_commission_settled (boolean, required)
    await ensure(() => databases.createBooleanAttribute(DATABASE_ID, COLLECTIONS.PAYMENTS, 'is_commission_settled', true), 'is_commission_settled');
    // created_at (datetime, required)
    await ensure(() => databases.createDatetimeAttribute(DATABASE_ID, COLLECTIONS.PAYMENTS, 'created_at', true), 'created_at');
    // updated_at (datetime, required)
    await ensure(() => databases.createDatetimeAttribute(DATABASE_ID, COLLECTIONS.PAYMENTS, 'updated_at', true), 'updated_at');

    // Add index on booking_id for fast lookup
    try {
      await databases.createIndex(DATABASE_ID, COLLECTIONS.PAYMENTS, 'booking_id_index', 'key', ['booking_id']);
      console.log('✅ Index created: booking_id_index');
    } catch (e: any) {
      if (e.code === 409) {
        console.log('ℹ️ Index already exists: booking_id_index');
      } else {
        console.error('❌ Error creating index booking_id_index:', e);
      }
    }
  } catch (error) {
    console.error('❌ Error ensuring Payments attributes:', error);
  }
};

const createCommissionsCollection = async () => {
  const COLLECTION_ID = 'commissions';
  try {
    await databases.createCollection(DATABASE_ID, COLLECTION_ID, 'Commissions');
    console.log('✅ Commissions collection created');
  } catch (error: any) {
    if (error.code === 409) {
      console.log('ℹ️ Commissions collection already exists');
    } else {
      console.error('❌ Error creating Commissions collection:', error);
      return;
    }
  }
  // Ensure all required attributes exist (migration-safe)
  try {
    const attrs = await databases.listAttributes(DATABASE_ID, COLLECTION_ID);
    const existing = attrs.attributes.map((a: any) => a.key);
    const ensure = async (fn: () => Promise<any>, key: string) => {
      if (!existing.includes(key)) {
        try {
          await fn();
          console.log(`✅ Created attribute: ${key}`);
        } catch (e: any) {
          if (e.code === 409) {
            console.log(`ℹ️ Attribute already exists: ${key}`);
          } else {
            console.error(`❌ Error creating attribute ${key}:`, e);
          }
        }
      }
    };
    await ensure(() => databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'provider_id', 255, true), 'provider_id');
    await ensure(() => databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'booking_id', 255, true), 'booking_id');
    await ensure(() => databases.createFloatAttribute(DATABASE_ID, COLLECTION_ID, 'amount_due', true), 'amount_due');
    await ensure(() => databases.createDatetimeAttribute(DATABASE_ID, COLLECTION_ID, 'due_date', true), 'due_date');
    await ensure(() => databases.createBooleanAttribute(DATABASE_ID, COLLECTION_ID, 'is_settled', true), 'is_settled');
    await ensure(() => databases.createDatetimeAttribute(DATABASE_ID, COLLECTION_ID, 'created_at', true), 'created_at');
    await ensure(() => databases.createDatetimeAttribute(DATABASE_ID, COLLECTION_ID, 'updated_at', true), 'updated_at');
    // Indexes
    try {
      await databases.createIndex(DATABASE_ID, COLLECTION_ID, 'provider_id_index', 'key', ['provider_id']);
      console.log('✅ Index created: provider_id_index');
    } catch (e: any) {
      if (e.code === 409) {
        console.log('ℹ️ Index already exists: provider_id_index');
      } else {
        console.error('❌ Error creating index provider_id_index:', e);
      }
    }
    try {
      await databases.createIndex(DATABASE_ID, COLLECTION_ID, 'booking_id_index', 'key', ['booking_id']);
      console.log('✅ Index created: booking_id_index');
    } catch (e: any) {
      if (e.code === 409) {
        console.log('ℹ️ Index already exists: booking_id_index');
      } else {
        console.error('❌ Error creating index booking_id_index:', e);
      }
    }
  } catch (error) {
    console.error('❌ Error ensuring Commissions attributes:', error);
  }
};

const createComplaintsCollection = async () => {
  const COLLECTION_ID = 'complaints';
  try {
    await databases.createCollection(DATABASE_ID, COLLECTION_ID, 'Complaints');
    console.log('✅ Complaints collection created');
  } catch (error: any) {
    if (error.code === 409) {
      console.log('ℹ️ Complaints collection already exists');
    } else {
      console.error('❌ Error creating Complaints collection:', error);
      return;
    }
  }
  // Ensure all required attributes exist (migration-safe)
  try {
    const attrs = await databases.listAttributes(DATABASE_ID, COLLECTION_ID);
    const existing = attrs.attributes.map((a: any) => a.key);
    const ensure = async (fn: () => Promise<any>, key: string) => {
      if (!existing.includes(key)) {
        try {
          await fn();
          console.log(`✅ Created attribute: ${key}`);
        } catch (e: any) {
          if (e.code === 409) {
            console.log(`ℹ️ Attribute already exists: ${key}`);
          } else {
            console.error(`❌ Error creating attribute ${key}:`, e);
          }
        }
      }
    };
    await ensure(() => databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'booking_id', 255, true), 'booking_id');
    await ensure(() => databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'customer_id', 255, true), 'customer_id');
    await ensure(() => databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'issue_type', 100, true), 'issue_type');
    await ensure(() => databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'description', 2000, true), 'description');
    await ensure(() => databases.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'proof_url', 500, false), 'proof_url');
    await ensure(() => databases.createEnumAttribute(DATABASE_ID, COLLECTION_ID, 'status', ['open', 'in_review', 'resolved', 'rejected'], true), 'status');
    await ensure(() => databases.createDatetimeAttribute(DATABASE_ID, COLLECTION_ID, 'created_at', true), 'created_at');
    await ensure(() => databases.createDatetimeAttribute(DATABASE_ID, COLLECTION_ID, 'updated_at', true), 'updated_at');
    // Indexes
    try {
      await databases.createIndex(DATABASE_ID, COLLECTION_ID, 'booking_id_index', 'key', ['booking_id']);
      console.log('✅ Index created: booking_id_index');
    } catch (e: any) {
      if (e.code === 409) {
        console.log('ℹ️ Index already exists: booking_id_index');
      } else {
        console.error('❌ Error creating index booking_id_index:', e);
      }
    }
    try {
      await databases.createIndex(DATABASE_ID, COLLECTION_ID, 'customer_id_index', 'key', ['customer_id']);
      console.log('✅ Index created: customer_id_index');
    } catch (e: any) {
      if (e.code === 409) {
        console.log('ℹ️ Index already exists: customer_id_index');
      } else {
        console.error('❌ Error creating index customer_id_index:', e);
      }
    }
  } catch (error) {
    console.error('❌ Error ensuring Complaints attributes:', error);
  }
};

const createBusinessSetupCollection = async () => {
  try {
    await databases.createCollection(DATABASE_ID, 'business_setup', 'BusinessSetup');
    await databases.createStringAttribute(DATABASE_ID, 'business_setup', 'user_id', 255, true);
    await databases.createStringAttribute(DATABASE_ID, 'business_setup', 'personal_details', 10000, false);
    await databases.createStringAttribute(DATABASE_ID, 'business_setup', 'business_details', 10000, false);
    await databases.createStringAttribute(DATABASE_ID, 'business_setup', 'pricing_warranty', 10000, false);
    await databases.createStringAttribute(DATABASE_ID, 'business_setup', 'verification', 10000, false);
    await databases.createStringAttribute(DATABASE_ID, 'business_setup', 'payment_setup', 10000, false);
    await databases.createDatetimeAttribute(DATABASE_ID, 'business_setup', 'created_at', true);
    console.log('✅ BusinessSetup collection created');
  } catch (error: any) {
    if (error.code === 409) {
      console.log('ℹ️ BusinessSetup collection already exists');
    } else {
      console.error('❌ Error creating BusinessSetup collection:', error);
    }
  }
};

const createServicesOfferedCollection = async () => {
  try {
    await databases.createCollection(DATABASE_ID, 'services_offered', 'Services Offered');
    console.log('✅ services_offered collection created');

    // Attributes
    await databases.createStringAttribute(DATABASE_ID, 'services_offered', 'providerId', 255, true);
    await databases.createStringAttribute(DATABASE_ID, 'services_offered', 'deviceType', 32, true);
    await databases.createStringAttribute(DATABASE_ID, 'services_offered', 'brand', 100, true);
    await databases.createStringAttribute(DATABASE_ID, 'services_offered', 'model', 100, false, undefined, true); // allow null
    await databases.createStringAttribute(DATABASE_ID, 'services_offered', 'issue', 100, true);
    await databases.createStringAttribute(DATABASE_ID, 'services_offered', 'partType', 32, false, undefined, true); // allow null
    await databases.createFloatAttribute(DATABASE_ID, 'services_offered', 'price', true);
    await databases.createStringAttribute(DATABASE_ID, 'services_offered', 'warranty', 32, false, undefined, true); // allow null
    await databases.createDatetimeAttribute(DATABASE_ID, 'services_offered', 'created_at', true);

    console.log('✅ services_offered attributes created');
  } catch (error: any) {
    if (error.code === 409) {
      console.log('ℹ️ services_offered collection already exists');
    } else {
      console.error('❌ Error creating services_offered collection:', error);
    }
  }
};

// Always run setupDatabase when this script is executed
  setupDatabase().then(() => {
    console.log('🎉 Setup complete!');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });