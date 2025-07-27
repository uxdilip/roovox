// Script to add 'type' field to issues collection, setting 'screen' for screen-related issues
const { Client, Databases } = require('node-appwrite');
const config = require('./config.js').config;

const client = new Client()
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setKey(config.apiKey);
const databases = new Databases(client);
const DATABASE_ID = config.databaseId;

async function addIssueTypeScreen() {
  const issues = await databases.listDocuments(DATABASE_ID, 'issues', []);
  for (const issue of issues.documents) {
    let type = undefined;
    if (issue.name && issue.name.toLowerCase().includes('screen')) {
      type = 'screen';
    }
    if (type && issue.type !== type) {
      await databases.updateDocument(DATABASE_ID, 'issues', issue.$id, { type });
      console.log(`Updated issue '${issue.name}' to type: ${type}`);
    }
  }
  console.log('Done updating issues with type field.');
}

addIssueTypeScreen(); 