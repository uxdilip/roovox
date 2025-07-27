import { Client, Databases } from 'node-appwrite';
import { config } from './config.js';

const client = new Client()
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setKey(config.apiKey);

const databases = new Databases(client);
const DATABASE_ID = config.databaseId;

export const createDatabaseSchema = async () => {
  // Reference Collections
  try {
    // Categories
    await databases.createCollection(DATABASE_ID, 'categories', 'Categories');
    await databases.createStringAttribute(DATABASE_ID, 'categories', 'name', 100, true);

    // Brands
    await databases.createCollection(DATABASE_ID, 'brands', 'Brands');
    await databases.createStringAttribute(DATABASE_ID, 'brands', 'name', 100, true);
    await databases.createStringAttribute(DATABASE_ID, 'brands', 'category_id', 255, true); // FK as string

    // Models
    await databases.createCollection(DATABASE_ID, 'models', 'Models');
    await databases.createStringAttribute(DATABASE_ID, 'models', 'name', 100, true);
    await databases.createStringAttribute(DATABASE_ID, 'models', 'brand_id', 255, true); // FK as string
    await databases.createStringAttribute(DATABASE_ID, 'models', 'specifications', 2000, false);
    await databases.createStringAttribute(DATABASE_ID, 'models', 'image_url', 500, false);

    // Issues
    await databases.createCollection(DATABASE_ID, 'issues', 'Issues');
    await databases.createStringAttribute(DATABASE_ID, 'issues', 'name', 100, true);
    await databases.createStringAttribute(DATABASE_ID, 'issues', 'description', 1000, false);
    await databases.createStringAttribute(DATABASE_ID, 'issues', 'category_id', 255, true); // FK as string

    // ServiceTypes
    await databases.createCollection(DATABASE_ID, 'service_types', 'ServiceTypes');
    await databases.createStringAttribute(DATABASE_ID, 'service_types', 'name', 100, true);
  } catch (e) { console.log('Reference collection exists or error:', (e as any).message); }

  // Customer-Specific Collections
  try {
    // Customers
    await databases.createCollection(DATABASE_ID, 'customers', 'Customers');
    await databases.createStringAttribute(DATABASE_ID, 'customers', 'user_id', 255, true);
    await databases.createStringAttribute(DATABASE_ID, 'customers', 'full_name', 255, true);
    await databases.createStringAttribute(DATABASE_ID, 'customers', 'email', 255, true);
    await databases.createStringAttribute(DATABASE_ID, 'customers', 'phone', 20, false);
    await databases.createStringAttribute(DATABASE_ID, 'customers', 'address', 500, false);
    await databases.createDatetimeAttribute(DATABASE_ID, 'customers', 'created_at', true);

    // CustomerDevices
    await databases.createCollection(DATABASE_ID, 'customer_devices', 'CustomerDevices');
    await databases.createStringAttribute(DATABASE_ID, 'customer_devices', 'customer_id', 255, true); // FK as string
    await databases.createStringAttribute(DATABASE_ID, 'customer_devices', 'model_id', 255, true); // FK as string
    await databases.createStringAttribute(DATABASE_ID, 'customer_devices', 'serial_number', 100, false);
    await databases.createStringAttribute(DATABASE_ID, 'customer_devices', 'nickname', 100, false);
    await databases.createDatetimeAttribute(DATABASE_ID, 'customer_devices', 'registered_at', true);

    // Bookings
    await databases.createCollection(DATABASE_ID, 'bookings', 'Bookings');
    await databases.createStringAttribute(DATABASE_ID, 'bookings', 'customer_id', 255, true); // FK as string
    await databases.createStringAttribute(DATABASE_ID, 'bookings', 'provider_id', 255, true); // FK as string
    await databases.createStringAttribute(DATABASE_ID, 'bookings', 'customer_device_id', 255, true); // FK as string
    await databases.createStringAttribute(DATABASE_ID, 'bookings', 'service_type_id', 255, true); // FK as string
    await databases.createStringAttribute(DATABASE_ID, 'bookings', 'issue_id', 255, true); // FK as string
    await databases.createEnumAttribute(DATABASE_ID, 'bookings', 'status', ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'], true);
    await databases.createDatetimeAttribute(DATABASE_ID, 'bookings', 'scheduled_time', true);
    await databases.createFloatAttribute(DATABASE_ID, 'bookings', 'price', true);
    await databases.createIntegerAttribute(DATABASE_ID, 'bookings', 'warranty_months', false);
    await databases.createDatetimeAttribute(DATABASE_ID, 'bookings', 'created_at', true);

    // CustomerReviews
    await databases.createCollection(DATABASE_ID, 'customer_reviews', 'CustomerReviews');
    await databases.createStringAttribute(DATABASE_ID, 'customer_reviews', 'booking_id', 255, true); // FK as string
    await databases.createStringAttribute(DATABASE_ID, 'customer_reviews', 'customer_id', 255, true); // FK as string
    await databases.createStringAttribute(DATABASE_ID, 'customer_reviews', 'provider_id', 255, true); // FK as string
    await databases.createIntegerAttribute(DATABASE_ID, 'customer_reviews', 'rating', true);
    await databases.createStringAttribute(DATABASE_ID, 'customer_reviews', 'review', 1000, false);
    await databases.createDatetimeAttribute(DATABASE_ID, 'customer_reviews', 'created_at', true);
  } catch (e) { console.log('Customer collection exists or error:', (e as any).message); }

  // Provider-Specific Collections
  try {
    // Providers
    await databases.createCollection(DATABASE_ID, 'providers', 'Providers');
    await databases.createStringAttribute(DATABASE_ID, 'providers', 'provider_id', 255, true); // Appwrite user ID
    await databases.createStringAttribute(DATABASE_ID, 'providers', 'full_name', 255, true);
    await databases.createStringAttribute(DATABASE_ID, 'providers', 'email', 255, true);
    await databases.createStringAttribute(DATABASE_ID, 'providers', 'phone', 20, true);
    await databases.createStringAttribute(DATABASE_ID, 'providers', 'business_name', 255, false);
    await databases.createStringAttribute(DATABASE_ID, 'providers', 'service_area', 2000, false); // JSON-stringified array of pincodes
    await databases.createStringAttribute(DATABASE_ID, 'providers', 'availability', 2000, false); // JSON-stringified object
    await databases.createStringAttribute(DATABASE_ID, 'providers', 'services_offered', 4000, false); // JSON-stringified object
    await databases.createStringAttribute(DATABASE_ID, 'providers', 'kyc_docs', 1000, false); // JSON-stringified object
    await databases.createStringAttribute(DATABASE_ID, 'providers', 'profile_photo', 500, false);
    await databases.createStringAttribute(DATABASE_ID, 'providers', 'shop_images', 2000, false); // JSON-stringified array of strings
    await databases.createStringAttribute(DATABASE_ID, 'providers', 'payment_info', 1000, false); // JSON-stringified object
    await databases.createEnumAttribute(DATABASE_ID, 'providers', 'verification_status', ['pending', 'approved', 'rejected'], true);
    await databases.createDatetimeAttribute(DATABASE_ID, 'providers', 'created_at', true);

    // ProviderSpecializations
    await databases.createCollection(DATABASE_ID, 'provider_specializations', 'ProviderSpecializations');
    await databases.createStringAttribute(DATABASE_ID, 'provider_specializations', 'provider_id', 255, true); // FK as string
    await databases.createStringAttribute(DATABASE_ID, 'provider_specializations', 'category_id', 255, true); // FK as string
    await databases.createStringAttribute(DATABASE_ID, 'provider_specializations', 'brand_id', 255, true); // FK as string
    await databases.createStringAttribute(DATABASE_ID, 'provider_specializations', 'model_id', 255, true); // FK as string
    await databases.createStringAttribute(DATABASE_ID, 'provider_specializations', 'issue_id', 255, true); // FK as string
    await databases.createStringAttribute(DATABASE_ID, 'provider_specializations', 'service_type_id', 255, true); // FK as string

    // ProviderPricing
    await databases.createCollection(DATABASE_ID, 'provider_pricing', 'ProviderPricing');
    await databases.createStringAttribute(DATABASE_ID, 'provider_pricing', 'provider_id', 255, true); // FK as string
    await databases.createStringAttribute(DATABASE_ID, 'provider_pricing', 'model_id', 255, true); // FK as string
    await databases.createStringAttribute(DATABASE_ID, 'provider_pricing', 'issue_id', 255, true); // FK as string
    await databases.createStringAttribute(DATABASE_ID, 'provider_pricing', 'service_type_id', 255, true); // FK as string
    await databases.createEnumAttribute(DATABASE_ID, 'provider_pricing', 'tier', ['basic', 'standard', 'premium'], true);
    await databases.createFloatAttribute(DATABASE_ID, 'provider_pricing', 'price', true);
    await databases.createIntegerAttribute(DATABASE_ID, 'provider_pricing', 'warranty_months', false);

    // ProviderReviews
    await databases.createCollection(DATABASE_ID, 'provider_reviews', 'ProviderReviews');
    await databases.createStringAttribute(DATABASE_ID, 'provider_reviews', 'booking_id', 255, true); // FK as string
    await databases.createStringAttribute(DATABASE_ID, 'provider_reviews', 'provider_id', 255, true); // FK as string
    await databases.createStringAttribute(DATABASE_ID, 'provider_reviews', 'customer_id', 255, true); // FK as string
    await databases.createIntegerAttribute(DATABASE_ID, 'provider_reviews', 'rating', true);
    await databases.createStringAttribute(DATABASE_ID, 'provider_reviews', 'review', 1000, false);
    await databases.createDatetimeAttribute(DATABASE_ID, 'provider_reviews', 'created_at', true);
  } catch (e) { console.log('Provider collection exists or error:', (e as any).message); }

  console.log('Database schema creation complete.');
};

// ESM-compatible entrypoint
createDatabaseSchema().then(() => process.exit(0)); 