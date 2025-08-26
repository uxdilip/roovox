import { databases, DATABASE_ID } from './appwrite';
import { Query } from 'appwrite';

export interface TierPricing {
  id: string;
  $id?: string; // Appwrite document ID
  provider_id: string;
  device_type: string;
  brand: string;
  issue: string;
  part_type?: string; // "OEM" | "HQ" | null - for Screen Replacement issues
  basic: number;
  standard: number;
  premium: number;
  $createdAt: string;
  $updatedAt: string;
}

export interface TierPricingMatch {
  providerId: string;
  issue: string;
  part_type?: string; // "OEM" | "HQ" | null
  tierPrices: {
    basic: number;
    standard: number;
    premium: number;
  };
  pricingType: 'tier_pricing';
}

// Get tier pricing for specific providers and issues
export const getTierPricingForProviders = async (
  providerIds: string[],
  deviceType: 'phones' | 'laptops',
  brand: string,
  issueNames: string[],
  partTypes?: string[] // Optional part types for filtering
): Promise<TierPricingMatch[]> => {
  try {
    console.log('🔍 Fetching tier pricing for:', { providerIds, deviceType, brand, issueNames });
    
    if (providerIds.length === 0 || issueNames.length === 0) {
      return [];
    }

    // Fetch tier pricing for these providers, device type, brand, and issues
    const tierPricingRes = await databases.listDocuments(
      DATABASE_ID,
      'tier_pricing',
      [
        Query.contains('provider_id', providerIds),
        Query.equal('device_type', deviceType),
        Query.equal('brand', brand),
        Query.contains('issue', issueNames),
        Query.limit(100)
      ]
    );

    console.log('🔍 Found tier pricing documents:', tierPricingRes.documents.length);

    // Transform to TierPricingMatch format
    const tierMatches: TierPricingMatch[] = tierPricingRes.documents.map((doc: any) => ({
      providerId: doc.provider_id,
      issue: doc.issue,
      part_type: doc.part_type || null,
      tierPrices: {
        basic: doc.basic,
        standard: doc.standard,
        premium: doc.premium
      },
      pricingType: 'tier_pricing' as const
    }));

    console.log('🔍 Transformed tier pricing matches:', tierMatches.length);
    return tierMatches;

  } catch (error) {
    console.error('❌ Error fetching tier pricing:', error);
    return [];
  }
};

// Get device complexity tier from PHONES or LAPTOPS collection
export const getDeviceComplexityTier = async (
  deviceId: string,
  deviceCategory: 'phone' | 'laptop'
): Promise<'basic' | 'standard' | 'premium' | null> => {
  try {
    const collectionName = deviceCategory === 'phone' ? 'phones' : 'laptops';
    
    const deviceDoc = await databases.getDocument(
      DATABASE_ID,
      collectionName,
      deviceId
    );

    return deviceDoc.complexity_tier || null;
  } catch (error) {
    console.error('❌ Error fetching device complexity tier:', error);
    return null;
  }
};

// Calculate exact price based on device tier and provider's tier pricing
export const calculateTierPrice = (
  tierPricing: TierPricingMatch,
  deviceTier: 'basic' | 'standard' | 'premium'
): number => {
  return tierPricing.tierPrices[deviceTier];
};

// Get all tier pricing for a specific provider
export const getProviderTierPricing = async (
  providerId: string,
  deviceType: 'phones' | 'laptops'
): Promise<TierPricing[]> => {
  try {
    const tierPricingRes = await databases.listDocuments(
      DATABASE_ID,
      'tier_pricing',
      [
        Query.equal('provider_id', providerId),
        Query.equal('device_type', deviceType),
        Query.limit(100)
      ]
    );

    return tierPricingRes.documents.map((doc: any) => ({
      id: doc.$id,
      provider_id: doc.provider_id,
      device_type: doc.device_type,
      brand: doc.brand,
      issue: doc.issue,
      part_type: doc.part_type || null,
      basic: doc.basic,
      standard: doc.standard,
      premium: doc.premium,
      $createdAt: doc.$createdAt,
      $updatedAt: doc.$updatedAt
    })) as TierPricing[];
  } catch (error) {
    console.error('❌ Error fetching provider tier pricing:', error);
    return [];
  }
};

// Check if a provider has tier pricing set up
export const hasProviderTierPricing = async (
  providerId: string,
  deviceType: 'phones' | 'laptops',
  brand: string
): Promise<boolean> => {
  try {
    const tierPricingRes = await databases.listDocuments(
      DATABASE_ID,
      'tier_pricing',
      [
        Query.equal('provider_id', providerId),
        Query.equal('device_type', deviceType),
        Query.equal('brand', brand),
        Query.limit(1)
      ]
    );

    return tierPricingRes.documents.length > 0;
  } catch (error) {
    console.error('❌ Error checking provider tier pricing:', error);
    return false;
  }
};

// Get tier pricing breakdown for customer display
export const getTierPricingBreakdown = (
  tierMatches: TierPricingMatch[],
  deviceTier: 'basic' | 'standard' | 'premium',
  selectedIssues: string[]
): {
  issueBreakdown: Array<{
    issue: string;
    price: number;
    tierUsed: string;
  }>;
  totalPrice: number;
  hasTierPricing: boolean;
} => {
  const breakdown: Array<{
    issue: string;
    price: number;
    tierUsed: string;
  }> = [];

  let totalPrice = 0;

  selectedIssues.forEach(issue => {
    const tierMatch = tierMatches.find(t => t.issue.toLowerCase() === issue.toLowerCase());
    if (tierMatch) {
      const price = calculateTierPrice(tierMatch, deviceTier);
      breakdown.push({
        issue,
        price,
        tierUsed: deviceTier
      });
      totalPrice += price;
    }
  });

  return {
    issueBreakdown: breakdown,
    totalPrice,
    hasTierPricing: breakdown.length > 0
  };
};

// Bulk save tier pricing - New Fiverr-style implementation
export interface BulkTierPricingData {
  providerId: string;
  deviceType: 'phones' | 'laptops';
  brand: string;
  issues: {
    issue: string;
    part_type?: string;
    basicPrice: number;
    standardPrice: number;
    premiumPrice: number;
  }[];
}

export const saveBulkTierPricing = async (data: BulkTierPricingData): Promise<void> => {
  try {
    console.log('🔍 DEBUG - saveBulkTierPricing function called with data:', data);
    const { providerId, deviceType, brand, issues } = data;
    
    console.log('💾 Saving bulk tier pricing:', { providerId, deviceType, brand, issueCount: issues.length });

    // Process each issue
    for (const issueData of issues) {
      const { issue, part_type, basicPrice, standardPrice, premiumPrice } = issueData;
      console.log('🔍 DEBUG - Processing issue:', { issue, part_type, basicPrice, standardPrice, premiumPrice });
      
      // For Screen Replacement with part types, modify the issue name to include the part type
      // This way we can handle OEM/HQ without needing the part_type field in database
      let issueNameToSave = issue;
      if (part_type && issue.toLowerCase().includes('screen replacement')) {
        issueNameToSave = `${issue} (${part_type})`;
        console.log('🔍 DEBUG - Screen replacement detected, modified issue name:', issueNameToSave);
      }
      
      // Check if pricing already exists (simplified query without part_type field)
      const queries = [
        Query.equal('provider_id', providerId),
        Query.equal('device_type', deviceType),
        Query.equal('brand', brand),
        Query.equal('issue', issueNameToSave)
      ];

      console.log('🔍 DEBUG - Checking for existing pricing with queries:', queries);
      const existingRes = await databases.listDocuments(
        DATABASE_ID,
        'tier_pricing',
        queries
      );

      console.log('🔍 DEBUG - Existing documents found:', existingRes.documents.length);

      // Simplified data object - only fields that exist in your database
      const pricingData = {
        provider_id: providerId,
        device_type: deviceType,
        brand: brand,
        issue: issueNameToSave,
        basic: basicPrice,
        standard: standardPrice,
        premium: premiumPrice
      };

      console.log('🔍 DEBUG - Pricing data to save:', pricingData);

      if (existingRes.documents.length > 0) {
        // Update existing
        const existingDoc = existingRes.documents[0];
        console.log('🔍 DEBUG - Updating existing document:', existingDoc.$id);
        await databases.updateDocument(
          DATABASE_ID,
          'tier_pricing',
          existingDoc.$id,
          {
            basic: basicPrice,
            standard: standardPrice,
            premium: premiumPrice
          }
        );
        console.log(`✅ Updated pricing for ${issueNameToSave}`);
      } else {
        // Create new
        console.log('🔍 DEBUG - Creating new document...');
        const createdDoc = await databases.createDocument(
          DATABASE_ID,
          'tier_pricing',
          'unique()',
          pricingData
        );
        console.log(`✅ Created pricing for ${issueNameToSave}`, createdDoc.$id);
      }
    }

    console.log('🎉 Bulk tier pricing saved successfully!');
  } catch (error) {
    console.error('❌ Error saving bulk tier pricing:', error);
    throw error;
  }
};

// 🚀 NEW: Bulk brand pricing - apply pricing from one brand to multiple brands
export interface BulkBrandPricingData {
  providerId: string;
  deviceType: 'phones' | 'laptops';
  masterBrand: string;
  targetBrands: string[];
  issues: {
    issue: string;
    part_type?: string;
    basic: number;
    standard: number;
    premium: number;
  }[];
}

export const saveBulkBrandPricing = async (data: BulkBrandPricingData): Promise<{ success: boolean; message: string; appliedCount: number }> => {
  try {
    console.log('🚀 DEBUG - saveBulkBrandPricing function called with data:', data);
    const { providerId, deviceType, masterBrand, targetBrands, issues } = data;
    
    console.log('💾 Applying bulk brand pricing:', { 
      providerId, 
      deviceType, 
      masterBrand, 
      targetBrands, 
      issueCount: issues.length 
    });

    let appliedCount = 0;
    const errors: string[] = [];

    // Process each target brand
    for (const targetBrand of targetBrands) {
      console.log(`🔍 Processing brand: ${targetBrand}`);
      
      // Process each issue for this brand
      for (const issueData of issues) {
        const { issue, part_type, basic, standard, premium } = issueData;
        
        // For Screen Replacement with part types, modify the issue name to include the part type
        let issueNameToSave = issue;
        if (part_type && issue.toLowerCase().includes('screen replacement')) {
          issueNameToSave = `${issue} (${part_type})`;
        }
        
        try {
          // Check if pricing already exists
          const queries = [
            Query.equal('provider_id', providerId),
            Query.equal('device_type', deviceType),
            Query.equal('brand', targetBrand),
            Query.equal('issue', issueNameToSave)
          ];

          const existingRes = await databases.listDocuments(
            DATABASE_ID,
            'tier_pricing',
            queries
          );

          const pricingData = {
            provider_id: providerId,
            device_type: deviceType,
            brand: targetBrand,
            issue: issueNameToSave,
            basic: basic,
            standard: standard,
            premium: premium
          };

          if (existingRes.documents.length > 0) {
            // Update existing
            const existingDoc = existingRes.documents[0];
            await databases.updateDocument(
              DATABASE_ID,
              'tier_pricing',
              existingDoc.$id,
              {
                basic: basic,
                standard: standard,
                premium: premium
              }
            );
            console.log(`✅ Updated pricing for ${targetBrand} - ${issueNameToSave}`);
          } else {
            // Create new
            await databases.createDocument(
              DATABASE_ID,
              'tier_pricing',
              'unique()',
              pricingData
            );
            console.log(`✅ Created pricing for ${targetBrand} - ${issueNameToSave}`);
          }
          
          appliedCount++;
        } catch (error) {
          const errorMsg = `Failed to save ${targetBrand} - ${issueNameToSave}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`❌ ${errorMsg}`);
          errors.push(errorMsg);
        }
      }
    }

    if (errors.length > 0) {
      console.warn(`⚠️ Some errors occurred during bulk pricing:`, errors);
      return {
        success: false,
        message: `Applied to ${appliedCount} items with ${errors.length} errors: ${errors.slice(0, 3).join(', ')}`,
        appliedCount
      };
    }

    console.log(`🎉 Bulk brand pricing completed successfully! Applied to ${appliedCount} items across ${targetBrands.length} brands`);
    return {
      success: true,
      message: `Successfully applied pricing to ${targetBrands.length} brands`,
      appliedCount
    };
  } catch (error) {
    console.error('❌ Error in saveBulkBrandPricing:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      appliedCount: 0
    };
  }
};

export const deleteTierPricing = async (providerId: string, deviceType: string, brand: string): Promise<void> => {
  try {
    console.log('🗑️ Deleting tier pricing:', { providerId, deviceType, brand });
    
    const queries = [
      Query.equal('provider_id', providerId),
      Query.equal('device_type', deviceType),
      Query.equal('brand', brand)
    ];
    
    const existingRes = await databases.listDocuments(DATABASE_ID, 'tier_pricing', queries);
    console.log('🔍 Found documents to delete:', existingRes.documents.length);
    
    // Delete all matching documents
    for (const doc of existingRes.documents) {
      await databases.deleteDocument(DATABASE_ID, 'tier_pricing', doc.$id);
      console.log(`🗑️ Deleted document: ${doc.$id}`);
    }
    
    console.log('✅ Tier pricing deleted successfully!');
  } catch (error) {
    console.error('❌ Error deleting tier pricing:', error);
    throw error;
  }
};

export const deleteTierPricingService = async (providerId: string, deviceType: string, brand: string, issueName: string): Promise<void> => {
  try {
    console.log('🗑️ Deleting service:', { providerId, deviceType, brand, issueName });
    
    const queries = [
      Query.equal('provider_id', providerId),
      Query.equal('device_type', deviceType),
      Query.equal('brand', brand),
      Query.equal('issue', issueName)
    ];
    
    const existingRes = await databases.listDocuments(DATABASE_ID, 'tier_pricing', queries);
    console.log('🔍 Found service documents to delete:', existingRes.documents.length);
    
    // Delete the specific service
    for (const doc of existingRes.documents) {
      await databases.deleteDocument(DATABASE_ID, 'tier_pricing', doc.$id);
      console.log(`🗑️ Deleted service document: ${doc.$id}`);
    }
    
    console.log('✅ Service deleted successfully!');
  } catch (error) {
    console.error('❌ Error deleting service:', error);
    throw error;
  }
};
