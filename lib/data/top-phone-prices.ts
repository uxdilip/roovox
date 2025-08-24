// Manual price data for top phone models in Indian market
// These prices are researched from Amazon India, Flipkart, and official brand websites
// Prices are in INR (Indian Rupees)

export interface PhonePriceData {
  brand: string;
  model: string;
  market_price_inr: number;
  complexity_tier: 'basic' | 'standard' | 'premium';
  price_source: 'manual_research';
  last_updated: string;
}

export const TOP_PHONE_PRICES: PhonePriceData[] = [
  // Apple iPhone Series - Adding more models
  {
    brand: 'Apple',
    model: 'iPhone 15 Pro Max',
    market_price_inr: 150000,
    complexity_tier: 'premium',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Apple',
    model: 'iPhone 15 Pro',
    market_price_inr: 120000,
    complexity_tier: 'premium',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Apple',
    model: 'iPhone 15 Plus',
    market_price_inr: 95000,
    complexity_tier: 'premium',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Apple',
    model: 'iPhone 15',
    market_price_inr: 75000,
    complexity_tier: 'premium',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Apple',
    model: 'iPhone 14 Pro Max',
    market_price_inr: 130000,
    complexity_tier: 'premium',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Apple',
    model: 'iPhone 14 Pro',
    market_price_inr: 110000,
    complexity_tier: 'premium',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Apple',
    model: 'iPhone 14 Plus',
    market_price_inr: 85000,
    complexity_tier: 'premium',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Apple',
    model: 'iPhone 14',
    market_price_inr: 70000,
    complexity_tier: 'standard',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Apple',
    model: 'iPhone 13 Pro Max',
    market_price_inr: 120000,
    complexity_tier: 'premium',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Apple',
    model: 'iPhone 13 Pro',
    market_price_inr: 100000,
    complexity_tier: 'premium',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Apple',
    model: 'iPhone 13',
    market_price_inr: 65000,
    complexity_tier: 'standard',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Apple',
    model: 'iPhone 12 Pro Max',
    market_price_inr: 110000,
    complexity_tier: 'premium',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Apple',
    model: 'iPhone 12 Pro',
    market_price_inr: 90000,
    complexity_tier: 'premium',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Apple',
    model: 'iPhone 12',
    market_price_inr: 60000,
    complexity_tier: 'standard',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Apple',
    model: 'iPhone 11 Pro Max',
    market_price_inr: 100000,
    complexity_tier: 'premium',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Apple',
    model: 'iPhone 11 Pro',
    market_price_inr: 80000,
    complexity_tier: 'premium',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Apple',
    model: 'iPhone 11',
    market_price_inr: 55000,
    complexity_tier: 'standard',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Apple',
    model: 'iPhone SE (3rd generation)',
    market_price_inr: 35000,
    complexity_tier: 'standard',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Apple',
    model: 'iPhone SE (2nd generation)',
    market_price_inr: 25000,
    complexity_tier: 'basic',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },

  // Samsung Galaxy Series
  {
    brand: 'Samsung',
    model: 'Galaxy S24 Ultra',
    market_price_inr: 130000,
    complexity_tier: 'premium',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Samsung',
    model: 'Galaxy S24',
    market_price_inr: 85000,
    complexity_tier: 'premium',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Samsung',
    model: 'Galaxy S24 Plus',
    market_price_inr: 110000,
    complexity_tier: 'premium',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Samsung',
    model: 'Galaxy S23 Ultra',
    market_price_inr: 120000,
    complexity_tier: 'premium',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Samsung',
    model: 'Galaxy S23',
    market_price_inr: 75000,
    complexity_tier: 'premium',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Samsung',
    model: 'Galaxy A15',
    market_price_inr: 12000,
    complexity_tier: 'basic',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Samsung',
    model: 'Galaxy A25',
    market_price_inr: 18000,
    complexity_tier: 'basic',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Samsung',
    model: 'Galaxy M34',
    market_price_inr: 18000,
    complexity_tier: 'basic',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Samsung',
    model: 'Galaxy M54',
    market_price_inr: 25000,
    complexity_tier: 'standard',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },

  // Xiaomi Series
  {
    brand: 'Xiaomi',
    model: 'Xiaomi 14',
    market_price_inr: 70000,
    complexity_tier: 'premium',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Xiaomi',
    model: 'Xiaomi 13',
    market_price_inr: 55000,
    complexity_tier: 'standard',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Xiaomi',
    model: 'Redmi Note 13 Pro',
    market_price_inr: 25000,
    complexity_tier: 'standard',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Xiaomi',
    model: 'Redmi Note 13',
    market_price_inr: 18000,
    complexity_tier: 'basic',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Xiaomi',
    model: 'Redmi 13C',
    market_price_inr: 8000,
    complexity_tier: 'basic',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Xiaomi',
    model: 'Redmi 12',
    market_price_inr: 12000,
    complexity_tier: 'basic',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },

  // OnePlus Series
  {
    brand: 'OnePlus',
    model: 'OnePlus 12',
    market_price_inr: 65000,
    complexity_tier: 'standard',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'OnePlus',
    model: 'OnePlus 12R',
    market_price_inr: 45000,
    complexity_tier: 'standard',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'OnePlus',
    model: 'OnePlus 11',
    market_price_inr: 55000,
    complexity_tier: 'standard',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'OnePlus',
    model: 'OnePlus 11R',
    market_price_inr: 40000,
    complexity_tier: 'standard',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'OnePlus',
    model: 'OnePlus Nord CE 3',
    market_price_inr: 18000,
    complexity_tier: 'basic',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'OnePlus',
    model: 'OnePlus Nord 3',
    market_price_inr: 28000,
    complexity_tier: 'standard',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'OnePlus',
    model: 'OnePlus Nord CE 3 Lite',
    market_price_inr: 15000,
    complexity_tier: 'basic',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  }
];

/**
 * Get price data for a specific phone model
 */
export function getPhonePrice(brand: string, model: string): PhonePriceData | null {
  return TOP_PHONE_PRICES.find(
    phone => phone.brand.toLowerCase() === brand.toLowerCase() && 
             phone.model.toLowerCase() === model.toLowerCase()
  ) || null;
}

/**
 * Get all phones by brand
 */
export function getPhonesByBrand(brand: string): PhonePriceData[] {
  return TOP_PHONE_PRICES.filter(
    phone => phone.brand.toLowerCase() === brand.toLowerCase()
  );
}

/**
 * Get all phones by complexity tier
 */
export function getPhonesByTier(tier: 'basic' | 'standard' | 'premium'): PhonePriceData[] {
  return TOP_PHONE_PRICES.filter(phone => phone.complexity_tier === tier);
}

/**
 * Get total count of phones with manual pricing
 */
export function getTotalPhonesWithPricing(): number {
  return TOP_PHONE_PRICES.length;
}
