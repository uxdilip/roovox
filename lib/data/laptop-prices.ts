// Laptop price data for popular gaming and student models in Indian market
// These prices are researched from Amazon India, Flipkart, Croma, and official brand websites
// Prices are in INR (Indian Rupees)
// Updated: January 2024

export interface LaptopPriceData {
  brand: string;
  model: string;
  category: 'gaming' | 'student' | 'business' | 'premium';
  market_price_inr: number;
  complexity_tier: 'basic' | 'standard' | 'premium';
  price_source: 'manual_research';
  last_updated: string;
}

export const LAPTOP_PRICES: LaptopPriceData[] = [
  // GAMING LAPTOPS
  
  // Basic Gaming Laptops (₹0 - ₹40,000)
  {
    brand: 'HP',
    model: 'HP Pavilion Gaming 15',
    category: 'gaming',
    market_price_inr: 38000,
    complexity_tier: 'basic',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Acer',
    model: 'Acer Nitro 5',
    category: 'gaming',
    market_price_inr: 39500,
    complexity_tier: 'basic',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  
  // Standard Gaming Laptops (₹40,001 - ₹80,000)
  {
    brand: 'ASUS',
    model: 'ASUS TUF Gaming F17',
    category: 'gaming',
    market_price_inr: 50990,
    complexity_tier: 'standard',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'ASUS',
    model: 'ASUS TUF Gaming A15',
    category: 'gaming',
    market_price_inr: 66990,
    complexity_tier: 'standard',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'HP',
    model: 'HP OMEN 15',
    category: 'gaming',
    market_price_inr: 75000,
    complexity_tier: 'standard',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Dell',
    model: 'Dell G15 5520',
    category: 'gaming',
    market_price_inr: 72000,
    complexity_tier: 'standard',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Acer',
    model: 'Acer Predator Helios 300',
    category: 'gaming',
    market_price_inr: 78000,
    complexity_tier: 'standard',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Lenovo',
    model: 'Lenovo Legion 5',
    category: 'gaming',
    market_price_inr: 68000,
    complexity_tier: 'standard',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  
  // Premium Gaming Laptops (₹80,001+)
  {
    brand: 'ASUS',
    model: 'ASUS ROG Strix Scar 16',
    category: 'gaming',
    market_price_inr: 329046,
    complexity_tier: 'premium',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'ASUS',
    model: 'ASUS ROG Zephyrus G14',
    category: 'gaming',
    market_price_inr: 120000,
    complexity_tier: 'premium',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'MSI',
    model: 'MSI Katana GF66',
    category: 'gaming',
    market_price_inr: 85000,
    complexity_tier: 'premium',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'HP',
    model: 'HP OMEN 16',
    category: 'gaming',
    market_price_inr: 95000,
    complexity_tier: 'premium',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Dell',
    model: 'Dell Alienware m15 R7',
    category: 'gaming',
    market_price_inr: 180000,
    complexity_tier: 'premium',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Acer',
    model: 'Acer Predator Triton 500',
    category: 'gaming',
    market_price_inr: 150000,
    complexity_tier: 'premium',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  
  // STUDENT LAPTOPS
  
  // Basic Student Laptops (₹0 - ₹40,000)
  {
    brand: 'HP',
    model: 'HP Chromebook 14a',
    category: 'student',
    market_price_inr: 25990,
    complexity_tier: 'basic',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'HP',
    model: 'HP 15s eq2144Au',
    category: 'student',
    market_price_inr: 38350,
    complexity_tier: 'basic',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Lenovo',
    model: 'Lenovo IdeaPad Slim 3',
    category: 'student',
    market_price_inr: 33990,
    complexity_tier: 'basic',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Acer',
    model: 'Acer Aspire Lite AL15 41',
    category: 'student',
    market_price_inr: 34990,
    complexity_tier: 'basic',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Dell',
    model: 'Dell Inspiron 15 3530',
    category: 'student',
    market_price_inr: 38090,
    complexity_tier: 'basic',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'ASUS',
    model: 'ASUS VivoBook 14',
    category: 'student',
    market_price_inr: 38000,
    complexity_tier: 'basic',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'HP',
    model: 'HP 14s',
    category: 'student',
    market_price_inr: 32000,
    complexity_tier: 'basic',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Lenovo',
    model: 'Lenovo IdeaPad 3',
    category: 'student',
    market_price_inr: 35000,
    complexity_tier: 'basic',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  
  // Standard Student Laptops (₹40,001 - ₹80,000)
  {
    brand: 'Lenovo',
    model: 'Lenovo IdeaPad Slim 5',
    category: 'student',
    market_price_inr: 59990,
    complexity_tier: 'standard',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'HP',
    model: 'HP Pavilion 15',
    category: 'student',
    market_price_inr: 55000,
    complexity_tier: 'standard',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Dell',
    model: 'Dell Inspiron 14 5420',
    category: 'student',
    market_price_inr: 62000,
    complexity_tier: 'standard',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'ASUS',
    model: 'ASUS VivoBook S15',
    category: 'student',
    market_price_inr: 58000,
    complexity_tier: 'standard',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Acer',
    model: 'Acer Swift 3',
    category: 'student',
    market_price_inr: 65000,
    complexity_tier: 'standard',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Lenovo',
    model: 'Lenovo ThinkPad E14',
    category: 'student',
    market_price_inr: 70000,
    complexity_tier: 'standard',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  
  // Premium Student Laptops (₹80,001+)
  {
    brand: 'Apple',
    model: 'MacBook Air M2',
    category: 'student',
    market_price_inr: 99900,
    complexity_tier: 'premium',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Apple',
    model: 'MacBook Pro 13 M2',
    category: 'student',
    market_price_inr: 129900,
    complexity_tier: 'premium',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Dell',
    model: 'Dell XPS 13',
    category: 'student',
    market_price_inr: 110000,
    complexity_tier: 'premium',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'HP',
    model: 'HP Spectre x360',
    category: 'student',
    market_price_inr: 125000,
    complexity_tier: 'premium',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'Lenovo',
    model: 'Lenovo ThinkPad X1 Carbon',
    category: 'student',
    market_price_inr: 180000,
    complexity_tier: 'premium',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  },
  {
    brand: 'ASUS',
    model: 'ASUS ZenBook 14',
    category: 'student',
    market_price_inr: 85000,
    complexity_tier: 'premium',
    price_source: 'manual_research',
    last_updated: '2024-01-15'
  }
];

/**
 * Get laptop price data by brand and model
 */
export function getLaptopPrice(brand: string, model: string): LaptopPriceData | null {
  return LAPTOP_PRICES.find(laptop => 
    laptop.brand.toLowerCase() === brand.toLowerCase() && 
    laptop.model.toLowerCase() === model.toLowerCase()
  ) || null;
}

/**
 * Get all laptops for a specific brand
 */
export function getLaptopsByBrand(brand: string): LaptopPriceData[] {
  return LAPTOP_PRICES.filter(laptop => 
    laptop.brand.toLowerCase() === brand.toLowerCase()
  );
}

/**
 * Get all laptops for a specific category
 */
export function getLaptopsByCategory(category: 'gaming' | 'student' | 'business' | 'premium'): LaptopPriceData[] {
  return LAPTOP_PRICES.filter(laptop => laptop.category === category);
}

/**
 * Get all laptops for a specific tier
 */
export function getLaptopsByTier(tier: 'basic' | 'standard' | 'premium'): LaptopPriceData[] {
  return LAPTOP_PRICES.filter(laptop => laptop.complexity_tier === tier);
}

/**
 * Get total number of laptops with pricing data
 */
export function getTotalLaptopsWithPricing(): number {
  return LAPTOP_PRICES.length;
}

/**
 * Get pricing statistics
 */
export function getLaptopPricingStats(): {
  total: number;
  by_tier: { basic: number; standard: number; premium: number };
  by_category: { gaming: number; student: number; business: number; premium: number };
  by_brand: Record<string, number>;
} {
  const stats = {
    total: LAPTOP_PRICES.length,
    by_tier: { basic: 0, standard: 0, premium: 0 },
    by_category: { gaming: 0, student: 0, business: 0, premium: 0 },
    by_brand: {} as Record<string, number>
  };

  LAPTOP_PRICES.forEach(laptop => {
    // Count by tier
    stats.by_tier[laptop.complexity_tier]++;
    
    // Count by category
    stats.by_category[laptop.category]++;
    
    // Count by brand
    stats.by_brand[laptop.brand] = (stats.by_brand[laptop.brand] || 0) + 1;
  });

  return stats;
}

