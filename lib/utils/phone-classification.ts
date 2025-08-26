// Device classification utilities for automatic tier assignment
// Based on market prices in Indian Rupees (INR)
// Supports both phones and laptops with different price ranges

export type ComplexityTier = 'basic' | 'standard' | 'premium';
export type DeviceType = 'phone' | 'laptop';

/**
 * Classify device into complexity tier based on price and device type
 * @param priceInr - Price in Indian Rupees
 * @param deviceType - Type of device (phone or laptop)
 * @returns Complexity tier
 */
export function classifyDeviceByPrice(priceInr: number, deviceType: DeviceType): ComplexityTier {
  if (deviceType === 'phone') {
    if (priceInr <= 25000) return 'basic';
    if (priceInr <= 60000) return 'standard';
    return 'premium';
  } else if (deviceType === 'laptop') {
    if (priceInr <= 40000) return 'basic';
    if (priceInr <= 80000) return 'standard';
    return 'premium';
  }
  
  // Default fallback (shouldn't reach here)
  return 'standard';
}

/**
 * Classify phone into complexity tier based on price
 * @param priceInr - Price in Indian Rupees
 * @returns Complexity tier
 * @deprecated Use classifyDeviceByPrice instead
 */
export function classifyPhoneByPrice(priceInr: number): ComplexityTier {
  return classifyDeviceByPrice(priceInr, 'phone');
}

/**
 * Classify laptop into complexity tier based on price
 * @param priceInr - Price in Indian Rupees
 * @returns Complexity tier
 */
export function classifyLaptopByPrice(priceInr: number): ComplexityTier {
  return classifyDeviceByPrice(priceInr, 'laptop');
}

/**
 * Get price range for a specific tier and device type
 * @param tier - Complexity tier
 * @param deviceType - Type of device (phone or laptop)
 * @returns Price range object
 */
export function getTierPriceRange(tier: ComplexityTier, deviceType: DeviceType = 'phone'): { min: number; max: number; label: string } {
  if (deviceType === 'phone') {
    switch (tier) {
      case 'basic':
        return { min: 0, max: 25000, label: '₹0 - ₹25,000' };
      case 'standard':
        return { min: 25001, max: 60000, label: '₹25,001 - ₹60,000' };
      case 'premium':
        return { min: 60001, max: Infinity, label: '₹60,001+' };
      default:
        return { min: 0, max: 0, label: 'Unknown' };
    }
  } else if (deviceType === 'laptop') {
    switch (tier) {
      case 'basic':
        return { min: 0, max: 40000, label: '₹0 - ₹40,000' };
      case 'standard':
        return { min: 40001, max: 80000, label: '₹40,001 - ₹80,000' };
      case 'premium':
        return { min: 80001, max: Infinity, label: '₹80,001+' };
      default:
        return { min: 0, max: 0, label: 'Unknown' };
    }
  }
  
  // Default fallback for phones
  switch (tier) {
    case 'basic':
      return { min: 0, max: 25000, label: '₹0 - ₹25,000' };
    case 'standard':
      return { min: 25001, max: 60000, label: '₹25,001 - ₹60,000' };
    case 'premium':
      return { min: 60001, max: Infinity, label: '₹60,001+' };
    default:
      return { min: 0, max: 0, label: 'Unknown' };
  }
}

/**
 * Get tier description for specific device type
 * @param tier - Complexity tier
 * @param deviceType - Type of device (phone or laptop)
 * @returns Human-readable description
 */
export function getTierDescription(tier: ComplexityTier, deviceType: DeviceType = 'phone'): string {
  if (deviceType === 'phone') {
    switch (tier) {
      case 'basic':
        return 'Budget phones - Basic features, affordable pricing';
      case 'standard':
        return 'Mid-range phones - Good features, balanced pricing';
      case 'premium':
        return 'Flagship phones - Advanced features, premium pricing';
      default:
        return 'Unknown tier';
    }
  } else if (deviceType === 'laptop') {
    switch (tier) {
      case 'basic':
        return 'Budget laptops - Basic performance, student/office work';
      case 'standard':
        return 'Mid-range laptops - Good performance, gaming/professional work';
      case 'premium':
        return 'High-end laptops - Premium performance, gaming/creative work';
      default:
        return 'Unknown tier';
    }
  }
  
  return 'Unknown tier';
}

/**
 * Get tier color for UI display
 * @param tier - Complexity tier
 * @returns CSS color class or hex code
 */
export function getTierColor(tier: ComplexityTier): string {
  switch (tier) {
    case 'basic':
      return 'text-green-600 bg-green-100'; // Green for budget
    case 'standard':
      return 'text-blue-600 bg-blue-100';   // Blue for mid-range
    case 'premium':
      return 'text-purple-600 bg-purple-100'; // Purple for premium
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

/**
 * Validate if a price is within a specific tier
 * @param priceInr - Price in Indian Rupees
 * @param tier - Expected complexity tier
 * @returns True if price matches tier
 */
export function validatePriceTier(priceInr: number, tier: ComplexityTier): boolean {
  const expectedTier = classifyPhoneByPrice(priceInr);
  return expectedTier === tier;
}

/**
 * Get tier statistics from a list of prices
 * @param prices - Array of prices in INR
 * @returns Object with tier counts and percentages
 */
export function getTierStatistics(prices: number[]): {
  basic: { count: number; percentage: number };
  standard: { count: number; percentage: number };
  premium: { count: number; percentage: number };
  total: number;
} {
  const total = prices.length;
  const counts = {
    basic: 0,
    standard: 0,
    premium: 0
  };

  prices.forEach(price => {
    const tier = classifyPhoneByPrice(price);
    counts[tier]++;
  });

  return {
    basic: { count: counts.basic, percentage: (counts.basic / total) * 100 },
    standard: { count: counts.standard, percentage: (counts.standard / total) * 100 },
    premium: { count: counts.premium, percentage: (counts.premium / total) * 100 },
    total
  };
}

/**
 * Suggest tier based on brand reputation (fallback when price is unknown)
 * @param brand - Brand name
 * @param deviceType - Type of device (phone or laptop)
 * @returns Suggested complexity tier
 */
export function suggestTierByBrand(brand: string, deviceType: DeviceType = 'phone'): ComplexityTier {
  const brandLower = brand.toLowerCase();
  
  if (deviceType === 'phone') {
    // Premium brands (mostly flagship devices)
    if (['apple', 'samsung'].includes(brandLower)) {
      return 'premium';
    }
    
    // Mid-range brands (mix of budget and premium)
    if (['oneplus', 'google', 'nothing'].includes(brandLower)) {
      return 'standard';
    }
    
    // Budget brands (mostly affordable devices)
    if (['xiaomi', 'redmi', 'poco', 'realme', 'vivo', 'oppo', 'infinix', 'iqoo'].includes(brandLower)) {
      return 'basic';
    }
  } else if (deviceType === 'laptop') {
    // Premium laptop brands (high-end, gaming, professional)
    if (['apple', 'dell', 'hp', 'lenovo', 'asus', 'msi', 'alienware', 'razer'].includes(brandLower)) {
      return 'standard'; // Most laptop brands span multiple tiers
    }
    
    // Budget laptop brands (affordable, student-focused)
    if (['acer', 'toshiba', 'samsung'].includes(brandLower)) {
      return 'basic';
    }
  }
  
  // Default to standard for unknown brands
  return 'standard';
}

/**
 * Suggest tier based on laptop category
 * @param category - Laptop category (gaming, student, business, premium)
 * @returns Suggested complexity tier
 */
export function suggestTierByLaptopCategory(category: string): ComplexityTier {
  const categoryLower = category.toLowerCase();
  
  switch (categoryLower) {
    case 'gaming':
      return 'premium'; // Most gaming laptops are high-end
    case 'business':
    case 'professional':
      return 'standard'; // Business laptops are usually mid-range
    case 'student':
    case 'budget':
      return 'basic'; // Student laptops are usually budget-friendly
    case 'premium':
    case 'ultrabook':
      return 'premium'; // Premium/ultrabooks are high-end
    default:
      return 'standard';
  }
}
