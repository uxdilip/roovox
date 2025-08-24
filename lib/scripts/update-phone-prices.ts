// Script to update existing phone records with market prices and complexity tiers
// This script will update the PHONES collection with new fields: market_price_inr and complexity_tier

import { databases, DATABASE_ID, COLLECTIONS } from '../appwrite';
import { TOP_PHONE_PRICES, getPhonePrice } from '../data/top-phone-prices';
import { classifyPhoneByPrice, suggestTierByBrand } from '../utils/phone-classification';
import { Query } from 'appwrite';

export interface UpdateResult {
  success: boolean;
  message: string;
  updated: number;
  skipped: number;
  errors: string[];
  details: {
    brand: string;
    model: string;
    status: 'updated' | 'skipped' | 'error';
    price?: number;
    tier?: string;
    error?: string;
  }[];
}

/**
 * Update phone records with market prices and complexity tiers
 */
export async function updatePhonePrices(): Promise<UpdateResult> {
  const result: UpdateResult = {
    success: false,
    message: '',
    updated: 0,
    skipped: 0,
    errors: [],
    details: []
  };

  try {
    console.log('🔄 Starting phone price update process...');
    
    // Get all phones from database with pagination
    let allPhones: any[] = [];
    let offset = 0;
    const limit = 100; // Process 100 phones at a time
    
    while (true) {
      const phonesResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PHONES,
        [
          // Add pagination
          Query.limit(limit),
          Query.offset(offset)
        ]
      );

      const phones = phonesResponse.documents;
      console.log(`📱 Fetched ${phones.length} phones (offset: ${offset})`);
      
      if (phones.length === 0) {
        break; // No more phones to process
      }
      
      allPhones = allPhones.concat(phones);
      offset += limit;
      
      // Safety check to prevent infinite loop
      if (offset > 10000) {
        console.warn('⚠️  Safety limit reached, stopping pagination');
        break;
      }
    }

    console.log(`📱 Total phones found: ${allPhones.length}`);

    // Process each phone
    for (const phone of allPhones) {
      try {
        const brand = phone.brand;
        const model = phone.model;
        
        // Check if we have manual price data for this phone
        const manualPrice = getPhonePrice(brand, model);
        
        if (manualPrice) {
          // Use manual price data
          await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.PHONES,
            phone.$id,
            {
              market_price_inr: manualPrice.market_price_inr,
              complexity_tier: manualPrice.complexity_tier
            }
          );
          
          result.updated++;
          result.details.push({
            brand,
            model,
            status: 'updated',
            price: manualPrice.market_price_inr,
            tier: manualPrice.complexity_tier
          });
          
          console.log(`✅ Updated: ${brand} ${model} - ₹${manualPrice.market_price_inr} (${manualPrice.complexity_tier})`);
        } else {
          // No manual price data, suggest tier based on brand
          const suggestedTier = suggestTierByBrand(brand);
          
          await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.PHONES,
            phone.$id,
            {
              complexity_tier: suggestedTier
            }
          );
          
          result.updated++;
          result.details.push({
            brand,
            model,
            status: 'updated',
            tier: suggestedTier
          });
          
          console.log(`⚠️  Updated (tier only): ${brand} ${model} - ${suggestedTier} (brand-based suggestion)`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`${phone.brand} ${phone.model}: ${errorMsg}`);
        result.details.push({
          brand: phone.brand,
          model: phone.model,
          status: 'error',
          error: errorMsg
        });
        
        console.error(`❌ Error updating ${phone.brand} ${phone.model}:`, error);
      }
    }

    result.success = true;
    result.message = `Successfully updated ${result.updated} phones. ${result.errors.length} errors occurred.`;
    
    console.log(`🎉 Update process completed!`);
    console.log(`✅ Updated: ${result.updated}`);
    console.log(`❌ Errors: ${result.errors.length}`);
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    result.message = `Failed to update phone prices: ${errorMsg}`;
    result.errors.push(errorMsg);
    
    console.error('❌ Fatal error during update process:', error);
  }

  return result;
}

/**
 * Get update statistics
 */
export async function getUpdateStatistics(): Promise<{
  totalPhones: number;
  phonesWithPrices: number;
  phonesWithTiers: number;
  tierBreakdown: {
    basic: number;
    standard: number;
    premium: number;
  };
}> {
  try {
    const phonesResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.PHONES,
      []
    );

    const phones = phonesResponse.documents;
    
    const phonesWithPrices = phones.filter(p => p.market_price_inr).length;
    const phonesWithTiers = phones.filter(p => p.complexity_tier).length;
    
    const tierBreakdown = {
      basic: phones.filter(p => p.complexity_tier === 'basic').length,
      standard: phones.filter(p => p.complexity_tier === 'standard').length,
      premium: phones.filter(p => p.complexity_tier === 'premium').length
    };

    return {
      totalPhones: phones.length,
      phonesWithPrices,
      phonesWithTiers,
      tierBreakdown
    };
  } catch (error) {
    console.error('Error getting update statistics:', error);
    throw error;
  }
}

/**
 * Test the update process with a single phone
 */
export async function testUpdateSinglePhone(brand: string, model: string): Promise<boolean> {
  try {
    console.log(`🧪 Testing update for: ${brand} ${model}`);
    
    // Find the phone in database
    const phonesResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.PHONES,
      []
    );

    const phone = phonesResponse.documents.find(
      p => p.brand.toLowerCase() === brand.toLowerCase() && 
           p.model.toLowerCase() === model.toLowerCase()
    );

    if (!phone) {
      console.log(`❌ Phone not found: ${brand} ${model}`);
      return false;
    }

    // Check if we have manual price data
    const manualPrice = getPhonePrice(brand, model);
    
    if (manualPrice) {
      console.log(`✅ Found manual price: ₹${manualPrice.market_price_inr} (${manualPrice.complexity_tier})`);
      
      // Update the phone
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.PHONES,
        phone.$id,
        {
          market_price_inr: manualPrice.market_price_inr,
          complexity_tier: manualPrice.complexity_tier
        }
      );
      
      console.log(`✅ Successfully updated: ${brand} ${model}`);
      return true;
    } else {
      console.log(`⚠️  No manual price data for: ${brand} ${model}`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Error testing update for ${brand} ${model}:`, error);
    return false;
  }
}
