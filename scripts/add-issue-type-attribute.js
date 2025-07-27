// Script to add 'type' attribute to issues collection if not present
const { Client, Databases } = require('node-appwrite');
const config = require('./config.js').config;

const client = new Client()
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setKey(config.apiKey);
const databases = new Databases(client);
const DATABASE_ID = config.databaseId;

async function addTypeAttribute() {
  try {
    // Try to create the attribute (will fail if it already exists)
    await databases.createStringAttribute(
      DATABASE_ID,
      'issues',
      'type',
      32, // max length
      false // not required
    );
    console.log("'type' attribute added to issues collection.");
  } catch (e) {
    if (e.message && e.message.includes('already exists')) {
      console.log("'type' attribute already exists in issues collection.");
    } else {
      console.error('Error adding type attribute:', e);
    }
  }
}

addTypeAttribute(); 