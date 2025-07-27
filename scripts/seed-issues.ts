import { Client, Databases, ID } from 'node-appwrite';
import { config } from './config.js';

const client = new Client()
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setKey(config.apiKey);

const databases = new Databases(client);
const DATABASE_ID = config.databaseId;
const ISSUES_COLLECTION = 'issues';
const CATEGORIES_COLLECTION = 'categories';

const predefinedPhoneIssues = [
  {
    id: 'screen',
    name: 'Screen Replacement',
    description: 'Broken or cracked screen',
    requires_parts: true,
    complexity: 2,
    estimated_duration: 60
  },
  {
    id: 'battery',
    name: 'Battery Replacement',
    description: 'Battery draining fast or not charging',
    requires_parts: true,
    complexity: 1,
    estimated_duration: 45
  },
  {
    id: 'charging',
    name: 'Charging Port Repair',
    description: 'Device not charging or loose port',
    requires_parts: true,
    complexity: 2,
    estimated_duration: 50
  },
  {
    id: 'camera',
    name: 'Camera Repair',
    description: 'Camera not working or blurry',
    requires_parts: true,
    complexity: 2,
    estimated_duration: 40
  },
  {
    id: 'speaker',
    name: 'Speaker/Microphone Repair',
    description: 'No sound or microphone issues',
    requires_parts: true,
    complexity: 1,
    estimated_duration: 30
  },
  {
    id: 'water',
    name: 'Water Damage',
    description: 'Device exposed to water or moisture',
    requires_parts: false,
    complexity: 3,
    estimated_duration: 90
  },
  {
    id: 'software',
    name: 'Software Issue',
    description: 'OS, app, or update problems',
    requires_parts: false,
    complexity: 1,
    estimated_duration: 30
  }
];

const predefinedLaptopIssues = [
  {
    id: 'keyboard',
    name: 'Keyboard Replacement',
    description: 'Keys not working or stuck',
    requires_parts: true,
    complexity: 2,
    estimated_duration: 90
  },
  {
    id: 'battery',
    name: 'Battery Replacement',
    description: 'Battery not charging or draining fast',
    requires_parts: true,
    complexity: 1,
    estimated_duration: 60
  },
  {
    id: 'screen',
    name: 'Screen Replacement',
    description: 'Broken, flickering, or dead screen',
    requires_parts: true,
    complexity: 2,
    estimated_duration: 80
  },
  {
    id: 'trackpad',
    name: 'Trackpad Repair',
    description: 'Trackpad not responding',
    requires_parts: true,
    complexity: 2,
    estimated_duration: 50
  },
  {
    id: 'fan',
    name: 'Fan/Overheating',
    description: 'Laptop overheating or noisy fan',
    requires_parts: true,
    complexity: 2,
    estimated_duration: 60
  },
  {
    id: 'os',
    name: 'OS/Software Issue',
    description: 'Operating system or software problems',
    requires_parts: false,
    complexity: 1,
    estimated_duration: 40
  },
  {
    id: 'water',
    name: 'Water Damage',
    description: 'Laptop exposed to water or moisture',
    requires_parts: false,
    complexity: 3,
    estimated_duration: 120
  }
];

async function ensureCollectionAndAttributes() {
  // Check if collection exists
  let collection;
  try {
    collection = await databases.getCollection(DATABASE_ID, ISSUES_COLLECTION);
    console.log('ℹ️ Issues collection already exists.');
  } catch (e) {
    // Create collection if not exists
    collection = await databases.createCollection(DATABASE_ID, ISSUES_COLLECTION, 'Issues');
    console.log('✅ Created issues collection.');
  }
  // Ensure attributes
  const attributes = [
    { key: 'name', type: 'string', size: 255, required: true },
    { key: 'description', type: 'string', size: 1000, required: false },
    { key: 'category_id', type: 'string', size: 64, required: true },
  ];
  for (const attr of attributes) {
    try {
      await databases.getAttribute(DATABASE_ID, ISSUES_COLLECTION, attr.key);
      // Exists
    } catch (e) {
      // Create if missing
      await databases.createStringAttribute(
        DATABASE_ID,
        ISSUES_COLLECTION,
        attr.key,
        attr.size,
        attr.required
      );
      console.log(`✅ Created attribute: ${attr.key}`);
    }
  }
}

const getCategoryId = async (name: string) => {
  const res = await databases.listDocuments(DATABASE_ID, CATEGORIES_COLLECTION, []);
  return res.documents.find((doc) => doc.name === name)?.$id;
};

const seedIssues = async () => {
  await ensureCollectionAndAttributes();
  const phoneCategoryId = await getCategoryId('Phone');
  const laptopCategoryId = await getCategoryId('Laptop');
  if (!phoneCategoryId || !laptopCategoryId) {
    throw new Error('Missing Phone or Laptop category in categories collection.');
  }
  // Helper to seed a list of issues for a category
  const seedForCategory = async (issues: any[], categoryId: string) => {
    for (const issue of issues) {
      try {
        await databases.createDocument(
          DATABASE_ID,
          ISSUES_COLLECTION,
          ID.unique(),
          {
            name: issue.name,
            description: issue.description,
            category_id: categoryId
          }
        );
        console.log(`✓ Created issue: ${issue.name}`);
      } catch (error: any) {
        if (error.code === 409) {
          console.log(`ℹ️ Issue already exists: ${issue.name}`);
        } else {
          console.error(`✗ Error creating issue ${issue.name}:`, error);
        }
      }
    }
  };
  await seedForCategory(predefinedPhoneIssues, phoneCategoryId);
  await seedForCategory(predefinedLaptopIssues, laptopCategoryId);
};

seedIssues().then(() => {
  console.log('🎉 Issues seeding completed!');
  process.exit(0);
}).catch((err) => {
  console.error('❌ Error seeding issues:', err);
  process.exit(1);
}); 