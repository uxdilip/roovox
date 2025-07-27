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
      console.log('model attribute:', JSON.stringify(modelAttr, null, 2));
      if (modelAttr.type === 'string' && modelAttr.required === false) {
        console.log('✅ model attribute is a nullable string');
      } else {
        console.log('❌ model attribute is NOT a nullable string');
      }
    } else {
      console.log('No model attribute found');
    }
  } catch (err) {
    console.error('❌ Error verifying model attribute:', err);
    process.exit(1);
  }
  process.exit(0);
})(); 