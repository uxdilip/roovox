// scripts/normalize-services-offered-device-type.js
import { Client, Databases, Query } from 'node-appwrite';
import { config } from './config.js';

const client = new Client()
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setKey(config.apiKey);

const databases = new Databases(client);
const DATABASE_ID = config.databaseId;
const COLLECTION_ID = 'services_offered';

async function normalizeDeviceType() {
  let page = 0;
  let totalUpdated = 0;
  while (true) {
    const docs = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [Query.equal('deviceType', 'Mobile'), Query.limit(100), Query.offset(page * 100)]
    );
    if (docs.documents.length === 0) break;
    for (const doc of docs.documents) {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        doc.$id,
        { deviceType: 'phone' }
      );
      console.log(`Updated document ${doc.$id} to deviceType: phone`);
      totalUpdated++;
    }
    if (docs.documents.length < 100) break;
    page++;
  }
  console.log(`Normalization complete! Total updated: ${totalUpdated}`);
}

normalizeDeviceType().catch(console.error); 