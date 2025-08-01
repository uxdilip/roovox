import { Client, Databases, ID } from 'node-appwrite';

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('687398a90012d5a8d92f')
  .setKey('standard_e992306df3c8114a99875bbc75741906b6706662916743e39f3150347268ef3d44e64330b4732ca2175c2f6bd7a5560304cc9cab9dbaca354533300e6cd94113126862ddafe20c275a0a38f3255559cc1c5ba01fdae0f937e326bebfa0482e4897b7e860be315fe19d984ced4bba5723fe5e19180ec20543ecb6e18c1680ed2e');

const databases = new Databases(client);
const DATABASE_ID = '687399d400185ad33867';

async function createCustomersCollection() {
  try {
    console.log('🚀 Creating customers collection...');
    
    // Create customers collection
    await databases.createCollection(DATABASE_ID, 'customers', 'Customers');
    console.log('✅ Customers collection created');

    // Create attributes
    await databases.createStringAttribute(DATABASE_ID, 'customers', 'user_id', 255, true);
    console.log('✅ user_id attribute created');
    
    await databases.createStringAttribute(DATABASE_ID, 'customers', 'full_name', 255, true);
    console.log('✅ full_name attribute created');
    
    await databases.createStringAttribute(DATABASE_ID, 'customers', 'email', 255, true);
    console.log('✅ email attribute created');
    
    await databases.createStringAttribute(DATABASE_ID, 'customers', 'phone', 20, false);
    console.log('✅ phone attribute created');
    
    await databases.createStringAttribute(DATABASE_ID, 'customers', 'address', 500, false);
    console.log('✅ address attribute created');
    
    await databases.createDatetimeAttribute(DATABASE_ID, 'customers', 'created_at', true);
    console.log('✅ created_at attribute created');

    console.log('🎉 Customers collection setup completed successfully!');
  } catch (error) {
    if (error.code === 409) {
      console.log('ℹ️ Customers collection already exists');
    } else {
      console.error('❌ Error creating customers collection:', error);
    }
  }
}

createCustomersCollection().then(() => process.exit(0)); 