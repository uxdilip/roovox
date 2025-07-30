const { Client, Databases } = require('node-appwrite');

// You need to set your API key as an environment variable
// Run: export APPWRITE_API_KEY="your_api_key_here"
// Or update the script below with your actual API key

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('687398a90012d5a8d92f')
  .setKey(process.env.APPWRITE_API_KEY || 'YOUR_API_KEY_HERE'); // Replace with your actual API key

const databases = new Databases(client);
const DATABASE_ID = '687399d400185ad33867';

async function addCancellationReasonField() {
  try {
    console.log('Adding cancellation_reason field to bookings collection...');
    console.log('Make sure you have set your API key with write permissions');
    
    // Add cancellation_reason string attribute to bookings collection
    await databases.createStringAttribute(
      DATABASE_ID,
      'bookings',
      'cancellation_reason',
      1000,
      false // optional field
    );
    console.log('✅ Added cancellation_reason field to bookings collection');
  } catch (error) {
    if (error.code === 409) {
      console.log('ℹ️ cancellation_reason field already exists');
    } else if (error.code === 401) {
      console.error('❌ Unauthorized: You need an API key with write permissions');
      console.error('Please:');
      console.error('1. Go to your Appwrite console');
      console.error('2. Create an API key with "collections.write" permission');
      console.error('3. Set it as: export APPWRITE_API_KEY="your_key_here"');
      console.error('4. Run this script again');
    } else {
      console.error('❌ Error adding cancellation_reason field:', error);
    }
  }
}

addCancellationReasonField(); 