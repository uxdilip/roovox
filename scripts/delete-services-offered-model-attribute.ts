import { Client, Databases } from 'node-appwrite';
import { config } from './config.js';

(async () => {
  const client = new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setKey(config.apiKey);
  const databases = new Databases(client);
  try {
    const attrs = await databases.listAttributes(config.databaseId, 'services_offered');
    const modelAttr = attrs.attributes.find((a: any) => a.key === 'model');
    if (modelAttr) {
      await databases.deleteAttribute(config.databaseId, 'services_offered', 'model');
      console.log('✅ Deleted model attribute from services_offered');
    } else {
      console.log('ℹ️ No model attribute to delete');
    }
  } catch (err) {
    console.error('❌ Error deleting model attribute:', err);
    process.exit(1);
  }
  process.exit(0);
})(); 