import { Client, Databases, ID } from 'node-appwrite';
import { config } from './config.js';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setKey(config.apiKey);

const databases = new Databases(client);
const DATABASE_ID = config.databaseId;

export const verifyProvider = async (providerId: string) => {
  try {
    console.log(`🔍 Verifying provider: ${providerId}`);
    
    // Update provider document - use correct attribute names
    await databases.updateDocument(
      DATABASE_ID,
      'providers',
      providerId,
      {
        isVerified: true,
        isApproved: true
      }
    );
    
    console.log(`✅ Provider ${providerId} verified successfully`);
    
    // Also update business_setup if it exists
    try {
      const businessSetupDocs = await databases.listDocuments(
        DATABASE_ID,
        'business_setup',
        []
      );
      
      const providerSetup = businessSetupDocs.documents.find(
        doc => doc.user_id === providerId
      );
      
      if (providerSetup) {
        const onboardingData = JSON.parse(providerSetup.onboarding_data || '{}');
        onboardingData.verification = {
          status: 'verified',
          verified_at: new Date().toISOString(),
          verified_by: 'admin'
        };
        
        await databases.updateDocument(
          DATABASE_ID,
          'business_setup',
          providerSetup.$id,
          {
            onboarding_data: JSON.stringify(onboardingData)
          }
        );
        
        console.log(`✅ Business setup verification updated for provider ${providerId}`);
      }
    } catch (error) {
      console.log('⚠️ Could not update business_setup verification:', error);
    }
    
  } catch (error) {
    console.error(`❌ Error verifying provider ${providerId}:`, error);
    throw error;
  }
};

export const listPendingProviders = async () => {
  try {
    const providers = await databases.listDocuments(
      DATABASE_ID,
      'providers',
      []
    );
    
    const pendingProviders = providers.documents.filter(
      provider => !provider.isVerified || !provider.isApproved
    );
    
    console.log('📋 Pending providers:');
    pendingProviders.forEach(provider => {
      console.log(`- ID: ${provider.$id}`);
      console.log(`  Email: ${provider.email}`);
      console.log(`  Business: ${provider.business_name || 'N/A'}`);
      console.log(`  Verified: ${provider.isVerified ? 'Yes' : 'No'}`);
      console.log(`  Approved: ${provider.isApproved ? 'Yes' : 'No'}`);
      console.log('---');
    });
    
    return pendingProviders;
  } catch (error) {
    console.error('❌ Error listing pending providers:', error);
    return [];
  }
};

// Example usage
if (require.main === module) {
  const providerId = process.argv[2];
  
  if (providerId) {
    verifyProvider(providerId);
  } else {
    console.log('Usage: npx ts-node scripts/verify-provider.ts <provider_id>');
    console.log('Or run without arguments to list pending providers:');
    listPendingProviders();
  }
} 