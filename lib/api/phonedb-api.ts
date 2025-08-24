// PhoneDB API client for fetching phone specifications and pricing
// Free API: https://phonedb.net/api/v1

const PHONEDB_BASE_URL = 'https://phonedb.net/api/v1';

export interface PhoneDBPhone {
  id: string;
  brand: string;
  model: string;
  name: string;
  release_date?: string;
  specifications?: {
    display?: string;
    processor?: string;
    ram?: string;
    storage?: string;
    camera?: string;
    battery?: string;
  };
  pricing?: {
    launch_price_usd?: number;
    current_price_usd?: number;
    price_range?: string;
  };
}

export interface PhoneDBResponse {
  success: boolean;
  data?: PhoneDBPhone[];
  error?: string;
}

/**
 * Search for phones by brand and model
 */
export async function searchPhones(brand: string, model: string): Promise<PhoneDBResponse> {
  try {
    const response = await fetch(`${PHONEDB_BASE_URL}/phones?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return { success: true, data: data.data || data };
  } catch (error) {
    console.error('PhoneDB API error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get phone specifications by ID
 */
export async function getPhoneSpecs(phoneId: string): Promise<PhoneDBResponse> {
  try {
    const response = await fetch(`${PHONEDB_BASE_URL}/phones/${phoneId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return { success: true, data: [data] };
  } catch (error) {
    console.error('PhoneDB API error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get all phones by brand
 */
export async function getPhonesByBrand(brand: string): Promise<PhoneDBResponse> {
  try {
    const response = await fetch(`${PHONEDB_BASE_URL}/brands/${encodeURIComponent(brand)}/phones`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return { success: true, data: data.data || data };
  } catch (error) {
    console.error('PhoneDB API error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Test the PhoneDB API connection
 */
export async function testPhoneDBConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${PHONEDB_BASE_URL}/brands`);
    return response.ok;
  } catch (error) {
    console.error('PhoneDB connection test failed:', error);
    return false;
  }
}

