import { databases, DATABASE_ID } from './appwrite';
import { Query } from 'appwrite';

export interface TierPricing {
  id: string;
  provider_id: string;
  device_type: string;
  brand: string;
  issue: string;
  basic: number;
  standard: number;
  premium: number;
  $createdAt: string;
  $updatedAt: string;
}

export interface TierPricingMatch {
  providerId: string;
  issue: string;
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
  issueNames: string[]
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
