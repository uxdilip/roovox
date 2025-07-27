import { Client, Databases } from 'node-appwrite';
import { config } from './config.js';

const client = new Client()
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setKey(config.apiKey);

const databases = new Databases(client);
const DATABASE_ID = config.databaseId;

interface CollectionInfo {
  id: string;
  name: string;
  attributes: {
    key: string;
    type: string;
    required: boolean;
    array: boolean;
    size?: number;
    default?: any;
    enum?: string[];
  }[];
}

async function extractCollections(): Promise<CollectionInfo[]> {
  try {
    // Get all collections
    const collections = await databases.listCollections(DATABASE_ID);
    const collectionInfos: CollectionInfo[] = [];

    for (const collection of collections.collections) {
      console.log(`\n📋 Processing collection: ${collection.name} (${collection.$id})`);
      
      // Get collection attributes
      const attributes = await databases.listAttributes(DATABASE_ID, collection.$id);
      
      const attributeInfos = attributes.attributes.map(attr => ({
        key: attr.key,
        type: attr.type,
        required: attr.required,
        array: attr.array || false,
        size: 'size' in attr ? attr.size : undefined,
        default: 'default' in attr ? attr.default : undefined,
        enum: 'enum' in attr ? (Array.isArray(attr.enum) ? attr.enum as string[] : undefined) : undefined
      }));

      collectionInfos.push({
        id: collection.$id,
        name: collection.name,
        attributes: attributeInfos
      });

      console.log(`   Found ${attributeInfos.length} attributes`);
    }

    return collectionInfos;
  } catch (error) {
    console.error('Error extracting collections:', error);
    throw error;
  }
}

async function generateCollectionReport() {
  try {
    console.log('🔍 Extracting collections and attributes from Appwrite database...\n');
    
    const collections = await extractCollections();
    
    console.log('\n📊 COLLECTION REPORT');
    console.log('===================\n');
    
    for (const collection of collections) {
      console.log(`📁 Collection: ${collection.name} (${collection.id})`);
      console.log('   Attributes:');
      
      for (const attr of collection.attributes) {
        const required = attr.required ? 'REQUIRED' : 'optional';
        const array = attr.array ? '[]' : '';
        const size = attr.size ? `(${attr.size})` : '';
        const enumValues = attr.enum ? ` [${attr.enum.join(', ')}]` : '';
        
        console.log(`     • ${attr.key}: ${attr.type}${array}${size} - ${required}${enumValues}`);
      }
      console.log('');
    }
    
    // Generate summary
    console.log('📈 SUMMARY');
    console.log('==========');
    console.log(`Total Collections: ${collections.length}`);
    console.log(`Total Attributes: ${collections.reduce((sum, col) => sum + col.attributes.length, 0)}`);
    
    // Group by collection type
    const referenceCollections = ['categories', 'brands', 'models', 'issues', 'service_types'];
    const customerCollections = ['customers', 'customer_devices', 'bookings', 'customer_reviews'];
    const providerCollections = ['providers', 'provider_specializations', 'provider_pricing', 'provider_reviews'];
    
    const refCount = collections.filter(c => referenceCollections.includes(c.id)).length;
    const customerCount = collections.filter(c => customerCollections.includes(c.id)).length;
    const providerCount = collections.filter(c => providerCollections.includes(c.id)).length;
    
    console.log(`Reference Collections: ${refCount}`);
    console.log(`Customer Collections: ${customerCount}`);
    console.log(`Provider Collections: ${providerCount}`);
    
    return collections;
  } catch (error) {
    console.error('Failed to generate collection report:', error);
    throw error;
  }
}

// Run the extraction
generateCollectionReport()
  .then(() => {
    console.log('\n✅ Collection extraction complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Collection extraction failed:', error);
    process.exit(1);
  }); 