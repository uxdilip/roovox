import { Client, Databases } from 'node-appwrite';
import { config } from './config.js';

const client = new Client()
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setKey(config.apiKey);

const databases = new Databases(client);
const DATABASE_ID = config.databaseId;

async function testProviderMatching() {
  try {
    console.log('🔍 Testing provider matching logic...');
    
    // Simulate the data structures
    const selectedIssues = [
      { id: '687d55210022ed99fa0a', name: 'Battery Replacement', partType: undefined }
    ];
    
    const servicesOffered = [
      {
        providerId: '6877cf2d001d10de08ec',
        deviceType: 'phone',
        brand: 'Apple',
        model: 'iPhone 15 Pro Max',
        issue: 'Battery Replacement',
        price: 1000,
        partType: null,
        warranty: null
      }
    ];
    
    console.log('📋 Selected Issues:', selectedIssues);
    console.log('📋 Services Offered:', servicesOffered);
    
    // Test the matching logic
    selectedIssues.forEach(issueObj => {
      const match = servicesOffered.find(s => {
        const matchesIssue = s.issue === (issueObj.name || issueObj.id);
        console.log('🔍 Matching test:', {
          serviceIssue: s.issue,
          issueObjName: issueObj.name,
          issueObjId: issueObj.id,
          matchesIssue
        });
        return matchesIssue;
      });
      
      if (match) {
        console.log('✅ Match found:', match);
      } else {
        console.log('❌ No match found for:', issueObj);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testProviderMatching(); 