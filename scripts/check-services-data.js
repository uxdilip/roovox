import { Client, Databases } from 'node-appwrite';
import { config } from './config.js';

const client = new Client()
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setKey(config.apiKey);

const databases = new Databases(client);
const DATABASE_ID = config.databaseId;

async function checkServicesData() {
  try {
    console.log('🔍 Checking issues collection...');
    
    // Get all issues
    const issuesRes = await databases.listDocuments(
      DATABASE_ID,
      'issues',
      []
    );

    console.log('📊 Issues Count:', issuesRes.documents.length);
    
    if (issuesRes.documents.length > 0) {
      console.log('📋 All Issues:');
      issuesRes.documents.forEach((doc, index) => {
        console.log(`\n${index + 1}. Issue Document:`);
        console.log(`   ID: ${doc.$id}`);
        console.log(`   Name: ${doc.name}`);
        console.log(`   Description: ${doc.description}`);
        console.log(`   Category ID: ${doc.category_id}`);
      });
    } else {
      console.log('❌ No issues documents found');
    }

    console.log('\n🔍 Checking services_offered collection...');
    
    // Get all services_offered documents
    const servicesRes = await databases.listDocuments(
      DATABASE_ID,
      'services_offered',
      []
    );

    console.log('📊 Services Offered Count:', servicesRes.documents.length);
    
    if (servicesRes.documents.length > 0) {
      console.log('📋 All Services Offered Documents:');
      servicesRes.documents.forEach((doc, index) => {
        console.log(`\n${index + 1}. Service Document:`);
        console.log(`   Provider ID: ${doc.providerId}`);
        console.log(`   Device Type: ${doc.deviceType}`);
        console.log(`   Brand: ${doc.brand}`);
        console.log(`   Model: ${doc.model}`);
        console.log(`   Issue: ${doc.issue}`);
        console.log(`   Price: ${doc.price}`);
        console.log(`   Part Type: ${doc.partType}`);
        console.log(`   Warranty: ${doc.warranty}`);
      });
      
      // Group by device type
      const byDeviceType = {};
      servicesRes.documents.forEach(doc => {
        const deviceType = doc.deviceType;
        if (!byDeviceType[deviceType]) byDeviceType[deviceType] = [];
        byDeviceType[deviceType].push(doc);
      });
      
      console.log('\n📱 Services by Device Type:');
      Object.keys(byDeviceType).forEach(deviceType => {
        console.log(`  ${deviceType}: ${byDeviceType[deviceType].length} services`);
        byDeviceType[deviceType].forEach(doc => {
          console.log(`    - ${doc.brand} ${doc.model}: ${doc.issue} (₹${doc.price})`);
        });
      });
    } else {
      console.log('❌ No services_offered documents found');
    }

    console.log('\n🔍 Checking providers collection...');
    
    // Get all providers
    const providersRes = await databases.listDocuments(
      DATABASE_ID,
      'providers',
      []
    );

    console.log('📊 Providers Count:', providersRes.documents.length);
    
    if (providersRes.documents.length > 0) {
      console.log('📋 Sample Provider Document:');
      console.log(JSON.stringify(providersRes.documents[0], null, 2));
    } else {
      console.log('❌ No provider documents found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkServicesData(); 