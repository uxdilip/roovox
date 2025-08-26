// Script to update existing laptop records with market prices and complexity tiers
// This script will update the LAPTOPS collection with new fields: market_price_inr and complexity_tier

import { databases, DATABASE_ID, COLLECTIONS } from '../appwrite';
import { LAPTOP_PRICES, getLaptopPrice } from '../data/laptop-prices';
import { classifyLaptopByPrice, suggestTierByBrand, suggestTierByLaptopCategory } from '../utils/phone-classification';
import { Query } from 'appwrite';

export interface LaptopUpdateResult {
  success: boolean;
  message: string;
  updated: number;
  skipped: number;
  errors: string[];
  details: {
    brand: string;
    model: string;
    category?: string;
    status: 'updated' | 'skipped' | 'error';
    price?: number;
    tier?: string;
    error?: string;
  }[];
}

/**
 * Update laptop records with market prices and complexity tiers
 */
export async function updateLaptopPrices(): Promise<LaptopUpdateResult> {
  const result: LaptopUpdateResult = {
    success: false,
    message: '',
    updated: 0,
    skipped: 0,
    errors: [],
    details: []
  };

  try {
    console.log('🔄 Starting laptop price update process...');
    
    // Get all laptops from database with pagination
    let allLaptops: any[] = [];
    let offset = 0;
    const limit = 100; // Process 100 laptops at a time
    
    while (true) {
      const laptopsResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.LAPTOPS,
        [
          // Add pagination
          Query.limit(limit),
          Query.offset(offset)
        ]
      );

      const laptops = laptopsResponse.documents;
      if (laptops.length === 0) break;
      
      allLaptops = allLaptops.concat(laptops);
      offset += limit;
      
      console.log(`📄 Loaded ${laptops.length} laptops (total: ${allLaptops.length})`);
    }

    console.log(`📊 Processing ${allLaptops.length} laptops total...`);

    for (const laptop of allLaptops) {
      try {
        const { brand, model, category } = laptop;
        const laptopId = laptop.$id;

        // Check if laptop already has pricing data
        if (laptop.market_price_inr && laptop.complexity_tier) {
          console.log(`⏭️  Skipping ${brand} ${model} - already has pricing data`);
          result.skipped++;
          result.details.push({
            brand,
            model,
            category,
            status: 'skipped'
          });
          continue;
        }

        // Try to get manual price data first
        const manualPriceData = getLaptopPrice(brand, model);
        let marketPrice: number | null = null;
        let complexityTier: string;

        if (manualPriceData) {
          // Use manual price data
          marketPrice = manualPriceData.market_price_inr;
          complexityTier = manualPriceData.complexity_tier;
          console.log(`💰 Found manual price for ${brand} ${model}: ₹${marketPrice} (${complexityTier})`);
        } else {
          // Use fallback tier suggestion based on brand and category
          if (category) {
            complexityTier = suggestTierByLaptopCategory(category);
            console.log(`🏷️  Using category-based tier for ${brand} ${model} (${category}): ${complexityTier}`);
          } else {
            complexityTier = suggestTierByBrand(brand, 'laptop');
            console.log(`🏷️  Using brand-based tier for ${brand} ${model}: ${complexityTier}`);
          }
        }

        // Update laptop document
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.LAPTOPS,
          laptopId,
          {
            market_price_inr: marketPrice,
            complexity_tier: complexityTier
          }
        );

        console.log(`✅ Updated ${brand} ${model}`);
        result.updated++;
        result.details.push({
          brand,
          model,
          category,
          status: 'updated',
          price: marketPrice || undefined,
          tier: complexityTier
        });

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error: any) {
        console.error(`❌ Error updating laptop ${laptop.brand} ${laptop.model}:`, error.message);
        result.errors.push(`${laptop.brand} ${laptop.model}: ${error.message}`);
        result.details.push({
          brand: laptop.brand,
          model: laptop.model,
          category: laptop.category,
          status: 'error',
          error: error.message
        });
      }
    }

    result.success = true;
    result.message = `Successfully processed ${allLaptops.length} laptops. Updated: ${result.updated}, Skipped: ${result.skipped}, Errors: ${result.errors.length}`;
    
    console.log('🎉 Laptop price update completed!');
    console.log(`📊 Summary: ${result.message}`);

    return result;

  } catch (error: any) {
    result.success = false;
    result.message = `Failed to update laptop prices: ${error.message}`;
    result.errors.push(error.message);
    console.error('💥 Fatal error in laptop price update:', error);
    return result;
  }
}

/**
 * Test updating a single laptop by brand and model
 */
export async function testUpdateSingleLaptop(brand: string, model: string): Promise<boolean> {
  try {
    console.log(`🧪 Testing single laptop update: ${brand} ${model}`);
    
    // Find the laptop in database
    const laptopsResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.LAPTOPS,
      [
        Query.equal('brand', brand),
        Query.equal('model', model),
        Query.limit(1)
      ]
    );

    if (laptopsResponse.documents.length === 0) {
      console.log(`❌ Laptop not found: ${brand} ${model}`);
      return false;
    }

    const laptop = laptopsResponse.documents[0];
    const laptopId = laptop.$id;

    // Get manual price data
    const manualPriceData = getLaptopPrice(brand, model);
    let marketPrice: number | null = null;
    let complexityTier: string;

    if (manualPriceData) {
      marketPrice = manualPriceData.market_price_inr;
      complexityTier = manualPriceData.complexity_tier;
      console.log(`💰 Found manual price: ₹${marketPrice} (${complexityTier})`);
    } else {
      complexityTier = suggestTierByBrand(brand, 'laptop');
      console.log(`🏷️  Using brand-based tier: ${complexityTier}`);
    }

    // Update laptop document
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.LAPTOPS,
      laptopId,
      {
        market_price_inr: marketPrice,
        complexity_tier: complexityTier
      }
    );

    console.log(`✅ Successfully updated ${brand} ${model}`);
    return true;

  } catch (error: any) {
    console.error(`❌ Error testing laptop update:`, error.message);
    return false;
  }
}

/**
 * Get update statistics for laptops
 */
export async function getLaptopUpdateStatistics(): Promise<{
  total: number;
  with_prices: number;
  with_tiers: number;
  tier_breakdown: { basic: number; standard: number; premium: number };
}> {
  try {
    // Get all laptops
    const laptopsResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.LAPTOPS,
      [Query.limit(1000)] // Adjust if you have more than 1000 laptops
    );

    const laptops = laptopsResponse.documents;
    const stats = {
      total: laptops.length,
      with_prices: 0,
      with_tiers: 0,
      tier_breakdown: { basic: 0, standard: 0, premium: 0 }
    };

    laptops.forEach(laptop => {
      if (laptop.market_price_inr) {
        stats.with_prices++;
      }
      if (laptop.complexity_tier) {
        stats.with_tiers++;
        if (laptop.complexity_tier === 'basic') stats.tier_breakdown.basic++;
        else if (laptop.complexity_tier === 'standard') stats.tier_breakdown.standard++;
        else if (laptop.complexity_tier === 'premium') stats.tier_breakdown.premium++;
      }
    });

    return stats;

  } catch (error: any) {
    console.error('Error getting laptop statistics:', error);
    return {
      total: 0,
      with_prices: 0,
      with_tiers: 0,
      tier_breakdown: { basic: 0, standard: 0, premium: 0 }
    };
  }
}
