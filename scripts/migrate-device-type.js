// Migration script for deviceType standardization
const { Client, Databases, Query } = require('node-appwrite');
const config = require('./config.js').config;

const client = new Client()
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setKey(config.apiKey);
const databases = new Databases(client);
const DATABASE_ID = config.databaseId;

async function migrateServicesOffered() {
  const docs = await databases.listDocuments(DATABASE_ID, 'services_offered', []);
  for (const doc of docs.documents) {
    let updated = false;
    let newType = doc.deviceType;
    if (doc.deviceType === 'Mobile' || doc.deviceType === 'mobile') {
      newType = 'phone';
      updated = true;
    } else if (doc.deviceType === 'Laptop' || doc.deviceType === 'laptop') {
      newType = 'laptop';
      updated = true;
    }
    if (updated) {
      await databases.updateDocument(DATABASE_ID, 'services_offered', doc.$id, { deviceType: newType });
      console.log(`Updated services_offered ${doc.$id} to deviceType: ${newType}`);
    }
  }
}

async function migrateBusinessSetup() {
  const docs = await databases.listDocuments(DATABASE_ID, 'business_setup', []);
  for (const doc of docs.documents) {
    let data = {};
    try {
      data = JSON.parse(doc.onboarding_data || '{}');
    } catch {}
    let changed = false;
    if (data.serviceSelection) {
      if (data.serviceSelection.mobile) {
        data.serviceSelection.phone = data.serviceSelection.mobile;
        delete data.serviceSelection.mobile;
        changed = true;
      }
      if (data.serviceSelection.laptop) {
        // Already correct, but ensure key is lowercase
        data.serviceSelection.laptop = data.serviceSelection.laptop;
        changed = true;
      }
    }
    if (changed) {
      await databases.updateDocument(DATABASE_ID, 'business_setup', doc.$id, { onboarding_data: JSON.stringify(data) });
      console.log(`Updated business_setup ${doc.$id} onboarding_data deviceType keys`);
    }
  }
}

(async () => {
  await migrateServicesOffered();
  await migrateBusinessSetup();
  console.log('Migration complete.');
})(); 