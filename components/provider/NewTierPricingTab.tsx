"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Smartphone, 
  Laptop, 
  DollarSign,
  Settings,
  Save,
  X,
  Check,
  CheckCircle2,
  InfoIcon,
  Copy
} from 'lucide-react';
import { getPhones, getLaptops, getIssuesByCategory, getBrandsByCategory } from '@/lib/appwrite-services';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { saveBulkTierPricing, getProviderTierPricing, deleteTierPricing, deleteTierPricingService, BulkTierPricingData, saveBulkBrandPricing, BulkBrandPricingData } from '@/lib/tier-pricing-services';

interface IssueData {
  id: string;
  name: string;
  category: string;
  originalId: string;
  partType?: string; // "OEM" | "HQ" for Screen Replacement issues
  isSelected: boolean;
  basicPrice: number;
  standardPrice: number;
  premiumPrice: number;
}

interface PricingData {
  deviceType: 'phones' | 'laptops' | '';
  brand: string;
  issues: IssueData[];
}

interface Category {
  id: string;
  name: string;
  device_type: string;
}

interface SavedPricing {
  deviceType: string;
  brand: string;
  issues: IssueData[];
  savedAt: string;
}

interface BrandCardProps {
  deviceType: string;
  brand: string;
  issues: IssueData[];
  existingPricings: any[];
  onSave: (data: BulkTierPricingData) => Promise<void>;
  onDelete: (deviceType: string, brand: string) => Promise<void>;
  onDeleteService: (deviceType: string, brand: string, issueName: string) => Promise<void>;
}

const BrandCard: React.FC<BrandCardProps> = ({ 
  deviceType, 
  brand, 
  issues, 
  existingPricings, 
  onSave, 
  onDelete,
  onDeleteService 
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedIssues, setEditedIssues] = useState<IssueData[]>(issues);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Debug logging
  console.log(`🔍 BrandCard ${brand}:`, { 
    deviceType, 
    issuesCount: issues.length, 
    issues: issues.map(i => ({ name: i.name, isSelected: i.isSelected, prices: { basic: i.basicPrice, standard: i.standardPrice, premium: i.premiumPrice } }))
  });

  // Initialize edited issues when entering edit mode
  useEffect(() => {
    if (isEditMode) {
      console.log(`📝 Entering edit mode for ${brand}, initializing with:`, issues);
      setEditedIssues([...issues]);
      setHasChanges(false);
    }
  }, [isEditMode, issues, brand]);

  // Update edited issues when issues prop changes
  useEffect(() => {
    setEditedIssues([...issues]);
  }, [issues]);

  // Reset edited issues when issues prop changes
  useEffect(() => {
    if (isEditMode) {
      console.log(`🔄 Issues prop changed for ${brand}, updating editedIssues:`, issues);
      setEditedIssues([...issues]);
    }
  }, [issues, isEditMode, brand]);

  const handlePriceChange = (issueId: string, priceType: 'basic' | 'standard' | 'premium', value: string) => {
    const numValue = parseInt(value) || 0;
    setEditedIssues(prev => 
      prev.map(issue => 
        issue.id === issueId 
          ? { ...issue, [priceType + 'Price']: numValue }
          : issue
      )
    );
    setHasChanges(true);
  };

  const handleIssueToggle = (issueId: string, isSelected: boolean) => {
    setEditedIssues(prev => 
      prev.map(issue => 
        issue.id === issueId 
          ? { ...issue, isSelected }
          : issue
      )
    );
    setHasChanges(true);
  };

  const validatePricing = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    editedIssues.forEach(issue => {
      if (issue.isSelected) {
        // Check if all prices are set
        if (!issue.basicPrice || !issue.standardPrice || !issue.premiumPrice) {
          errors.push(`${issue.name}: All prices must be set`);
        }
        
        // Check price hierarchy
        if (issue.basicPrice >= issue.standardPrice) {
          errors.push(`${issue.name}: Basic price must be less than Standard price`);
        }
        if (issue.standardPrice >= issue.premiumPrice) {
          errors.push(`${issue.name}: Standard price must be less than Premium price`);
        }
        
        // Check minimum prices
        if (issue.basicPrice < 100) {
          errors.push(`${issue.name}: Basic price must be at least ₹100`);
        }
      }
    });
    
    return { isValid: errors.length === 0, errors };
  };

  const handleSave = async () => {
    const validation = validatePricing();
    if (!validation.isValid) {
      toast.error(validation.errors.join('\n'));
      return;
    }

    const selectedIssues = editedIssues.filter(issue => issue.isSelected);
    if (selectedIssues.length === 0) {
      toast.error('Please select at least one service');
      return;
    }

    try {
      setIsSaving(true);
      await onSave({
        providerId: '', // Will be set by parent component
        deviceType: deviceType as 'phones' | 'laptops',
        brand,
        issues: selectedIssues.map(issue => ({
          issue: issue.partType && issue.name.toLowerCase().includes('screen replacement') 
            ? `${issue.name} (${issue.partType})` 
            : issue.name,
          part_type: issue.partType,
          basicPrice: issue.basicPrice,
          standardPrice: issue.standardPrice,
          premiumPrice: issue.premiumPrice
        }))
      });
      
      toast.success('Pricing updated successfully!');
      setIsEditMode(false);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving pricing:', error);
      toast.error('Failed to save pricing');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setEditedIssues([...issues]);
    setHasChanges(false);
  };

  const handleDeleteService = async (issueName: string) => {
    if (confirm(`Are you sure you want to remove "${issueName}" from ${brand}?`)) {
      try {
        await onDeleteService(deviceType, brand, issueName);
        toast.success('Service removed successfully!');
      } catch (error) {
        console.error('Error deleting service:', error);
        toast.error('Failed to remove service');
      }
    }
  };

  const handleDeleteBrand = async () => {
    if (confirm(`Are you sure you want to delete all pricing for ${brand}? This action cannot be undone.`)) {
      try {
        await onDelete(deviceType, brand);
        toast.success('Brand pricing deleted successfully!');
      } catch (error) {
        console.error('Error deleting brand:', error);
        toast.error('Failed to delete brand pricing');
      }
    }
  };

  // FIXED: Use the actual issues array for counting, not editedIssues
  const selectedCount = issues.filter(issue => issue.isSelected).length;
  const totalIssues = issues.length;

  // Simple placeholder function for price inputs
  const getPlaceholder = (issue: any, priceType: 'basic' | 'standard' | 'premium'): string => {
    console.log(`🔍 getPlaceholder called with issue:`, issue?.name, `priceType:`, priceType);
    
    if (!priceType) {
      console.warn(`⚠️ getPlaceholder received undefined priceType, using default`);
      return '500';
    }
    
    const basePrices = {
      basic: 500,
      standard: 800,
      premium: 1200
    };
    
    const price = basePrices[priceType];
    if (price === undefined) {
      console.warn(`⚠️ getPlaceholder received invalid priceType: ${priceType}, using default`);
      return '500';
    }
    
    return price.toString();
  };

  console.log(`📊 ${brand} stats:`, { selectedCount, totalIssues, isEditMode });

  return (
    <Card className={`transition-all duration-200 ${isEditMode ? 'ring-2 ring-blue-500 shadow-lg' : ''} mx-2 sm:mx-0`}>
      <CardHeader className="pb-3 px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <CardTitle className="text-base sm:text-lg font-semibold">{brand} {deviceType === 'phones' ? 'phones' : 'laptops'}</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {selectedCount} {selectedCount === 1 ? 'service' : 'services'}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
            {!isEditMode ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditMode(true)}
                  className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                >
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleDeleteBrand}
                  className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                >
                  Delete Brand
                </Button>
              </>
            ) : (
              <>
                <Button 
                  size="sm"
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 px-4 sm:px-6">
        <div className="space-y-3">
          {editedIssues.map((issue) => (
            <div key={issue.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 sm:p-4 rounded-lg border hover:bg-gray-50">
              <div className="flex items-center gap-2 min-w-0 flex-1 w-full sm:w-auto">
                <input
                  type="checkbox"
                  checked={issue.isSelected}
                  onChange={(e) => handleIssueToggle(issue.id, e.target.checked)}
                  disabled={!isEditMode}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 flex-shrink-0"
                />
                
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="font-medium text-gray-900 truncate text-sm sm:text-base">
                    {issue.name}
                  </span>
                  {issue.partType && (
                    <Badge 
                      variant={issue.partType === 'OEM' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {issue.partType}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                {isEditMode ? (
                  <>
                    <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
                      <div className="text-center">
                        <label className="text-xs text-gray-500 mb-1 block">Basic</label>
                        <Input
                          type="number"
                          placeholder={getPlaceholder(issue, 'basic')}
                          value={issue.basicPrice || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePriceChange(issue.id, 'basic', e.target.value)}
                          className="w-full sm:w-20 h-8 text-center text-sm"
                          min="100"
                        />
                      </div>
                      
                      <div className="text-center">
                        <label className="text-xs text-gray-500 mb-1 block">Standard</label>
                        <Input
                          type="number"
                          placeholder={getPlaceholder(issue, 'standard')}
                          value={issue.standardPrice || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePriceChange(issue.id, 'standard', e.target.value)}
                          className="w-full sm:w-20 h-8 text-center text-sm"
                          min="100"
                        />
                      </div>
                      
                      <div className="text-center">
                        <label className="text-xs text-gray-500 mb-1 block">Premium</label>
                        <Input
                          type="number"
                          placeholder={getPlaceholder(issue, 'premium')}
                          value={issue.premiumPrice || ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePriceChange(issue.id, 'premium', e.target.value)}
                          className="w-full sm:w-20 h-8 text-center text-sm"
                          min="100"
                        />
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteService(issue.name)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 w-full sm:w-auto mt-2 sm:mt-0"
                      disabled={isSaving}
                    >
                      Remove
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-2 w-full sm:w-auto">
                      <div className="text-center">
                        <div className="text-xs text-gray-500">Basic</div>
                        <div className="font-semibold text-gray-900 text-sm sm:text-base">₹{issue.basicPrice || 0}</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-xs text-gray-500">Standard</div>
                        <div className="font-semibold text-gray-900 text-sm sm:text-base">₹{issue.standardPrice || 0}</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-xs text-gray-500">Premium</div>
                        <div className="font-semibold text-gray-900 text-sm sm:text-base">₹{issue.premiumPrice || 0}</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {isEditMode && (
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-sm sm:text-base py-2 sm:py-2"
              onClick={() => {
                // TODO: Implement add service functionality
                toast.info('Add service functionality coming soon!');
              }}
            >
              + Add New Service
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function NewTierPricingTab() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pricingData, setPricingData] = useState<PricingData>({
    deviceType: '',
    brand: '',
    issues: []
  });
  const [savedPricings, setSavedPricings] = useState<SavedPricing[]>([]);
  const [existingPricings, setExistingPricings] = useState<any[]>([]);

  // 🚀 NEW: Bulk pricing state variables
  const [masterBrand, setMasterBrand] = useState<string>('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [applyToAllBrands, setApplyToAllBrands] = useState(false);
  const [bulkPricingMode, setBulkPricingMode] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Load existing tier pricing on component mount
  useEffect(() => {
    if (user?.id) {
      loadExistingPricings();
    }
  }, [user?.id]);

  const loadExistingPricings = async () => {
    if (!user?.id) return;
    
    try {
      // Load both phones and laptops tier pricing
      const [phonesPricing, laptopsPricing] = await Promise.all([
        getProviderTierPricing(user.id, 'phones'),
        getProviderTierPricing(user.id, 'laptops')
      ]);
      
      const allPricings = [...phonesPricing, ...laptopsPricing];
      setExistingPricings(allPricings);
      console.log('📊 Loaded existing tier pricing:', allPricings.length, 'items');
      console.log('🔍 Raw pricing data structure:', allPricings.map(p => ({
        id: p.id || p.$id || 'unknown',
        device_type: p.device_type,
        brand: p.brand,
        issue: p.issue,
        basic: p.basic,
        standard: p.standard,
        premium: p.premium
      })));
    } catch (error) {
      console.error('❌ Error loading existing tier pricing:', error);
    }
  };

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesRes = await databases.listDocuments(DATABASE_ID, 'categories');
        setCategories(categoriesRes.documents as any);
      } catch (error) {
        console.error('❌ Error loading categories:', error);
      }
    };
    
    loadCategories();
  }, []);

  // Split Screen Replacement issues into OEM and HQ variants
  const processIssuesWithPartTypes = (issues: any[]): IssueData[] => {
    const processedIssues: IssueData[] = [];
    
    issues.forEach(issue => {
      if (issue.name.toLowerCase().includes('screen replacement')) {
        // Create OEM variant
        processedIssues.push({
          id: `${issue.id}_oem`,
          name: issue.name,
          category: issue.category,
          originalId: issue.id,
          partType: 'OEM',
          isSelected: false,
          basicPrice: 0,
          standardPrice: 0,
          premiumPrice: 0
        });
        
        // Create HQ variant
        processedIssues.push({
          id: `${issue.id}_hq`,
          name: issue.name,
          category: issue.category,
          originalId: issue.id,
          partType: 'HQ',
          isSelected: false,
          basicPrice: 0,
          standardPrice: 0,
          premiumPrice: 0
        });
      } else {
        // Regular issue (no part type)
        processedIssues.push({
          id: issue.id,
          name: issue.name,
          category: issue.category,
          originalId: issue.id,
          partType: undefined,
          isSelected: false,
          basicPrice: 0,
          standardPrice: 0,
          premiumPrice: 0
        });
      }
    });
    
    return processedIssues;
  };

  // 🚀 NEW: Bulk pricing helper functions
  const getAllBrandsExceptMaster = (masterBrand: string): string[] => {
    return brands.filter(brand => brand !== masterBrand);
  };

  const handleMasterBrandChange = (brand: string) => {
    setMasterBrand(brand);
    setSelectedBrands([]);
    setApplyToAllBrands(false);
    setBulkPricingMode(false);
    
    // Load pricing for the master brand
    handleBrandChange(brand);
  };

  const handleBrandSelectionChange = (brand: string, selected: boolean) => {
    if (selected) {
      setSelectedBrands(prev => [...prev, brand]);
    } else {
      setSelectedBrands(prev => prev.filter(b => b !== brand));
    }
  };

  const handleApplyToAllBrandsChange = (checked: boolean) => {
    setApplyToAllBrands(checked);
    if (checked) {
      setSelectedBrands([]);
    }
  };

  const validateBulkPricing = (): { isValid: boolean; message: string } => {
    if (!masterBrand) {
      return { isValid: false, message: 'Please select a master brand first' };
    }

    if (!applyToAllBrands && selectedBrands.length === 0) {
      return { isValid: false, message: 'Please select brands to apply pricing to' };
    }

    if (pricingData.issues.length === 0) {
      return { isValid: false, message: 'Please set pricing for the master brand first' };
    }

    const selectedIssues = pricingData.issues.filter(issue => issue.isSelected);
    if (selectedIssues.length === 0) {
      return { isValid: false, message: 'Please select at least one issue to apply pricing to' };
    }

    return { isValid: true, message: '' };
  };

  const applyBulkPricing = async () => {
    const validation = validateBulkPricing();
    if (!validation.isValid) {
      toast.error(validation.message);
      return;
    }

    setBulkLoading(true);
    try {
      const targetBrands = applyToAllBrands 
        ? getAllBrandsExceptMaster(masterBrand)
        : selectedBrands;

      console.log('🚀 Starting bulk pricing application:', {
        masterBrand,
        targetBrands,
        selectedIssues: pricingData.issues.filter(issue => issue.isSelected)
      });

      // Get selected issues with pricing
      const selectedIssues = pricingData.issues.filter(issue => issue.isSelected);
      
      // Prepare bulk pricing data
      const bulkPricingData: BulkBrandPricingData = {
        providerId: user?.id || '',
        deviceType: pricingData.deviceType as 'phones' | 'laptops',
        masterBrand: masterBrand,
        targetBrands: targetBrands,
        issues: selectedIssues.map(issue => ({
          issue: issue.name,
          part_type: issue.partType,
          basic: issue.basicPrice,
          standard: issue.standardPrice,
          premium: issue.premiumPrice
        }))
      };

      console.log('📊 Bulk pricing data prepared:', bulkPricingData);

      // Save bulk pricing
      const result = await saveBulkBrandPricing(bulkPricingData);
      
      if (result.success) {
        toast.success(`✅ Bulk pricing applied successfully to ${targetBrands.length} brands!`);
        
        // Refresh existing pricings
        await loadExistingPricings();
        
        // Reset bulk pricing mode and form
        setBulkPricingMode(false);
        setSelectedBrands([]);
        setApplyToAllBrands(false);
        
        // 🚀 NEW: Close modal and reset form to show dashboard
        setIsModalOpen(false);
        setPricingData({ deviceType: '', brand: '', issues: [] });
        setMasterBrand('');
      } else {
        toast.error(`❌ Failed to apply bulk pricing: ${result.message}`);
      }
    } catch (error) {
      console.error('❌ Error applying bulk pricing:', error);
      toast.error('Failed to apply bulk pricing');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleDeviceTypeChange = async (deviceType: 'phones' | 'laptops') => {
    setLoading(true);
    setBrands([]);
    setPricingData({ deviceType, brand: '', issues: [] });
    
    try {
      let devices: any[] = [];
      
      if (deviceType === 'phones') {
        devices = await getPhones();
      } else {
        devices = await getLaptops();
      }
      
      const uniqueBrands = [...new Set(devices.map(device => device.brand))].sort();
      setBrands(uniqueBrands);
      
      console.log('📱 Loaded brands for', deviceType, ':', uniqueBrands.length);
    } catch (error) {
      console.error('❌ Error loading brands:', error);
      toast.error('Failed to load brands');
    } finally {
      setLoading(false);
    }
  };

  const handleBrandChange = async (brand: string) => {
    setLoading(true);
    setPricingData(prev => ({ ...prev, brand, issues: [] }));
    
    // 🚀 NEW: Set master brand for bulk pricing
    setMasterBrand(brand);
    
    try {
      // ✅ FIX: Use the same approach as customer flow - search by category name
      const categoryName = pricingData.deviceType === 'phones' ? 'Phone' : 'Laptop';
      const category = categories.find((c: any) => c.name.toLowerCase() === categoryName.toLowerCase());
      
      if (!category) {
        console.log('❌ No category found for:', categoryName);
        setPricingData(prev => ({ ...prev, issues: [] }));
        toast.error(`No category found for ${categoryName}`);
        return;
      }
      
      console.log('🔍 DEBUG - Category object found:', category);
      console.log('🔍 DEBUG - Category ID:', category.id);
      console.log('🔍 DEBUG - Category $id:', (category as any).$id);
      
      let allIssues: any[] = [];
      
      // Load issues for the found category
      try {
        const categoryId = category.id || (category as any).$id;
        console.log('🔍 DEBUG - Using category ID:', categoryId);
        const issues = await getIssuesByCategory(categoryId);
        allIssues = issues;
      } catch (error) {
        console.error(`❌ Error loading issues for category ${category.name}:`, error);
      }
      
      // Process issues with part types (OEM/HQ for Screen Replacement)
      const processedIssues = processIssuesWithPartTypes(allIssues);
      
      // Load existing pricing data for this brand
      const existingForBrand = existingPricings.filter(pricing => 
        pricing.device_type === pricingData.deviceType && 
        pricing.brand === brand
      );
      
      // Pre-fill existing pricing data
      const issuesWithPricing = processedIssues.map(issue => {
        // For screen replacement with part types, look for "Issue (OEM)" or "Issue (HQ)" format
        let issueNameToMatch = issue.name;
        if (issue.partType && issue.name.toLowerCase().includes('screen replacement')) {
          issueNameToMatch = `${issue.name} (${issue.partType})`;
        }
        
        const existing = existingForBrand.find(pricing => 
          pricing.issue === issueNameToMatch
        );
        
        if (existing) {
          return {
            ...issue,
            isSelected: true,
            basicPrice: existing.basic || 0,
            standardPrice: existing.standard || 0,
            premiumPrice: existing.premium || 0
          };
        }
        
        return issue;
      });
      
      setPricingData(prev => ({ ...prev, issues: issuesWithPricing }));
      
      console.log('🔧 Loaded issues for brand', brand, ':', processedIssues.length);
    } catch (error) {
      console.error('❌ Error loading issues:', error);
      toast.error('Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  const handleIssueUpdate = (issueId: string, updates: Partial<IssueData>) => {
    setPricingData(prev => ({
      ...prev,
      issues: prev.issues.map(issue =>
        issue.id === issueId ? { ...issue, ...updates } : issue
      )
    }));
  };

  const handleSelectAll = (selected: boolean) => {
    setPricingData(prev => ({
      ...prev,
      issues: prev.issues.map(issue => ({
        ...issue,
        isSelected: selected
      }))
    }));
  };

  const getPlaceholder = (issue: IssueData, priceType: 'basic' | 'standard' | 'premium'): string => {
    // Base suggestions for different issue types
    const basePrices = {
      'screen replacement': { basic: 1500, standard: 2000, premium: 2500 },
      'battery replacement': { basic: 800, standard: 1200, premium: 1500 },
      'charging port': { basic: 500, standard: 700, premium: 900 },
      'speaker': { basic: 400, standard: 600, premium: 800 },
      'camera': { basic: 1000, standard: 1500, premium: 2000 },
      'default': { basic: 500, standard: 800, premium: 1200 }
    };
    
    const issueKey = Object.keys(basePrices).find(key => 
      issue.name.toLowerCase().includes(key)
    ) || 'default';
    
    let basePrice = basePrices[issueKey as keyof typeof basePrices][priceType];
    
    // Adjust for part type
    if (issue.partType === 'HQ') {
      basePrice = Math.round(basePrice * 0.8); // HQ is ~20% less than OEM
    }
    
    return basePrice.toString();
  };

  const handleSave = async () => {
    console.log('🔍 DEBUG - handleSave called!');
    console.log('🔍 DEBUG - pricingData:', pricingData);
    
    const selectedIssues = pricingData.issues.filter(issue => issue.isSelected);
    console.log('🔍 DEBUG - selectedIssues:', selectedIssues.length, selectedIssues);
    
    if (selectedIssues.length === 0) {
      console.log('❌ DEBUG - No issues selected');
      toast.error('Please select at least one issue to save pricing for.');
      return;
    }

    // Validate that all selected issues have prices set
    const invalidIssues = selectedIssues.filter(issue => 
      !issue.basicPrice || !issue.standardPrice || !issue.premiumPrice ||
      issue.basicPrice <= 0 || issue.standardPrice <= 0 || issue.premiumPrice <= 0
    );

    console.log('🔍 DEBUG - invalidIssues:', invalidIssues.length, invalidIssues);

    if (invalidIssues.length > 0) {
      console.log('❌ DEBUG - Invalid pricing found');
      toast.error(`Please set all prices for: ${invalidIssues.map(i => i.name).join(', ')}`);
      return;
    }

    if (!user?.id) {
      console.log('❌ DEBUG - User not authenticated:', user);
      toast.error('User not authenticated');
      return;
    }

    console.log('🔍 DEBUG - All validations passed, proceeding to save...');

    try {
      setLoading(true);
      
      const bulkData: BulkTierPricingData = {
        providerId: user.id,
        deviceType: pricingData.deviceType as 'phones' | 'laptops',
        brand: pricingData.brand,
        issues: selectedIssues.map(issue => ({
          issue: issue.name,
          part_type: issue.partType,
          basicPrice: issue.basicPrice,
          standardPrice: issue.standardPrice,
          premiumPrice: issue.premiumPrice
        }))
      };
      
      console.log('🔍 DEBUG - Calling saveBulkTierPricing with:', bulkData);
      await saveBulkTierPricing(bulkData);
      console.log('✅ DEBUG - saveBulkTierPricing completed successfully');
      
      // Refresh existing pricing data
      console.log('🔍 DEBUG - Refreshing existing pricing data...');
      await loadExistingPricings();
      
      // Save to local state for display
      setSavedPricings(prev => [...prev, { 
        ...pricingData, 
        savedAt: new Date().toISOString() 
      }]);
      
      // Reset and close
      setPricingData({
        deviceType: '',
        brand: '',
        issues: []
      });
      setIsModalOpen(false);
      
      console.log('✅ DEBUG - Save operation completed successfully');
      toast.success('Tier pricing saved successfully!');
    } catch (error) {
      console.error('❌ Error saving tier pricing:', error);
      toast.error('Failed to save tier pricing');
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = pricingData.issues.filter(issue => issue.isSelected).length;
  const totalCount = pricingData.issues.length;
  const canSave = selectedCount > 0 && pricingData.deviceType && pricingData.brand;

  // Handler functions for BrandCard
  const handleSavePricing = async (data: BulkTierPricingData) => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }
    
    try {
      const bulkData = { ...data, providerId: user.id };
      await saveBulkTierPricing(bulkData);
      await loadExistingPricings();
      toast.success('Pricing updated successfully!');
    } catch (error) {
      console.error('Error updating pricing:', error);
      toast.error('Failed to update pricing');
    }
  };

  const handleDeleteBrand = async (deviceType: string, brand: string) => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }
    
    try {
      await deleteTierPricing(user.id, deviceType, brand);
      await loadExistingPricings();
      toast.success('Brand pricing deleted successfully!');
    } catch (error) {
      console.error('Error deleting brand:', error);
      toast.error('Failed to delete brand pricing');
    }
  };

  const handleDeleteService = async (deviceType: string, brand: string, issueName: string) => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }
    
    try {
      await deleteTierPricingService(user.id, deviceType, brand, issueName);
      await loadExistingPricings();
      toast.success('Service removed successfully!');
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Failed to remove service');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="text-center sm:text-left">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Tier Pricing Setup</h3>
          <p className="text-gray-600 mt-1 text-xs sm:text-sm lg:text-base">Set Basic, Standard, and Premium prices for all your services at once</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto text-sm sm:text-base">
              <Plus className="w-4 h-4 mr-2" />
              Add Tier Pricing
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-[90vw] md:w-[80vw] lg:w-[70vw] mx-2 sm:mx-4">
            <DialogHeader className="text-center sm:text-left">
              <DialogTitle className="text-lg sm:text-xl font-bold">Setup Tier Pricing</DialogTitle>
              <p className="text-sm text-gray-600 mt-2">Configure pricing for your services</p>
            </DialogHeader>
            
            <div className="space-y-4 sm:space-y-6">
              {/* Device Type Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="device-type">Device Type</Label>
                  <Select 
                    value={pricingData.deviceType} 
                    onValueChange={handleDeviceTypeChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select device type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phones">
                        <div className="flex items-center">
                          <Smartphone className="w-4 h-4 mr-2" />
                          Phones
                        </div>
                      </SelectItem>
                      <SelectItem value="laptops">
                        <div className="flex items-center">
                          <Laptop className="w-4 h-4 mr-2" />
                          Laptops
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="brand">Brand</Label>
                  <Select 
                    value={pricingData.brand} 
                    onValueChange={handleBrandChange}
                    disabled={!pricingData.deviceType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map(brand => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* OEM/HQ Info Banner */}
              {pricingData.issues.some(issue => issue.partType) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <InfoIcon className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">OEM vs HQ Pricing</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Screen Replacement offers two quality options: <strong>OEM</strong> (Original Equipment Manufacturer) parts are premium quality, 
                        while <strong>HQ</strong> (High Quality) parts are cost-effective alternatives. Price them accordingly.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Issues Selection */}
              {pricingData.brand && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h4 className="text-base sm:text-lg font-semibold text-center sm:text-left">Select Issues & Set Pricing</h4>
                    {totalCount > 0 && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <span className="text-sm text-gray-600 text-center sm:text-left">
                          {selectedCount} of {totalCount} selected
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelectAll(selectedCount < totalCount)}
                          className="w-full sm:w-auto text-sm"
                        >
                          {selectedCount < totalCount ? 'Select All' : 'Deselect All'}
                        </Button>
                      </div>
                    )}
                  </div>

                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="text-gray-600 text-center">Loading issues...</span>
                      <div className="text-xs text-gray-500 text-center max-w-xs">
                        Fetching available services for {pricingData.brand} {pricingData.deviceType}
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      {/* Mobile Card Layout */}
                      <div className="lg:hidden space-y-4 p-4">
                        {pricingData.issues.length === 0 ? (
                          <div className="text-center py-8">
                            <div className="text-gray-400 mb-2">
                              <Smartphone className="w-12 h-12 mx-auto" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No issues found</h3>
                            <p className="text-sm text-gray-600">
                              Try selecting a different brand or device type
                            </p>
                          </div>
                        ) : (
                          pricingData.issues.map((issue) => (
                            <Card key={issue.id} className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      checked={issue.isSelected}
                                      onCheckedChange={(checked: boolean | string) => 
                                        handleIssueUpdate(issue.id, { isSelected: !!checked })
                                      }
                                    />
                                    <span className="font-medium text-sm">{issue.name}</span>
                                    {issue.partType && (
                                      <Badge 
                                        variant="outline" 
                                        className="text-xs"
                                      >
                                        {issue.partType}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                {issue.isSelected && (
                                  <div className="grid grid-cols-3 gap-2">
                                    <div>
                                      <label className="text-xs text-gray-500 block mb-1">Basic</label>
                                      <Input
                                        type="number"
                                        placeholder={getPlaceholder(issue, 'basic')}
                                        value={issue.basicPrice || ''}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                          handleIssueUpdate(issue.id, { basicPrice: parseInt(e.target.value) || 0 })
                                        }
                                        className="text-sm text-center"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs text-gray-500 block mb-1">Standard</label>
                                      <Input
                                        type="number"
                                        placeholder={getPlaceholder(issue, 'standard')}
                                        value={issue.standardPrice || ''}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                          handleIssueUpdate(issue.id, { standardPrice: parseInt(e.target.value) || 0 })
                                        }
                                        className="text-sm text-center"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-xs text-gray-500 block mb-1">Premium</label>
                                      <Input
                                        type="number"
                                        placeholder={getPlaceholder(issue, 'premium')}
                                        value={issue.premiumPrice || ''}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                          handleIssueUpdate(issue.id, { premiumPrice: parseInt(e.target.value) || 0 })
                                        }
                                        className="text-sm text-center"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </Card>
                          ))
                        )}
                      </div>
                      
                      {/* Desktop Table */}
                      <div className="hidden lg:block">
                        {/* Table Header */}
                        <div className="bg-gray-50 border-b px-4 py-3">
                          <div className="grid grid-cols-6 gap-4 font-medium text-gray-700">
                            <div>Issue</div>
                            <div>Select</div>
                            <div>Basic (₹)</div>
                            <div>Standard (₹)</div>
                            <div>Premium (₹)</div>
                            <div>Status</div>
                          </div>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y">
                          {pricingData.issues.map((issue) => (
                            <div key={issue.id} className="px-4 py-3 hover:bg-gray-50">
                              <div className="grid grid-cols-6 gap-4 items-center">
                                {/* Issue Name */}
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium">{issue.name}</span>
                                    {issue.partType && (
                                      <Badge 
                                        variant="outline" 
                                        className={
                                          issue.partType === 'OEM' 
                                            ? 'bg-green-50 text-green-700 border-green-200' 
                                            : 'bg-orange-50 text-orange-700 border-orange-200'
                                        }
                                      >
                                        {issue.partType}
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                {/* Select Checkbox */}
                                <div>
                                  <Checkbox
                                    checked={issue.isSelected}
                                    onCheckedChange={(checked: boolean | string) => 
                                      handleIssueUpdate(issue.id, { isSelected: !!checked })
                                    }
                                  />
                                </div>

                                {/* Price Inputs */}
                                <div>
                                  <Input
                                    type="number"
                                    placeholder={getPlaceholder(issue, 'basic')}
                                    value={issue.basicPrice || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                      handleIssueUpdate(issue.id, { basicPrice: parseInt(e.target.value) || 0 })
                                    }
                                    disabled={!issue.isSelected}
                                    className="text-sm"
                                  />
                                </div>

                                <div>
                                  <Input
                                    type="number"
                                    placeholder={getPlaceholder(issue, 'standard')}
                                    value={issue.standardPrice || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                      handleIssueUpdate(issue.id, { standardPrice: parseInt(e.target.value) || 0 })
                                    }
                                    disabled={!issue.isSelected}
                                    className="text-sm"
                                  />
                                </div>

                                <div>
                                  <Input
                                    type="number"
                                    placeholder={getPlaceholder(issue, 'premium')}
                                    value={issue.premiumPrice || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                      handleIssueUpdate(issue.id, { premiumPrice: parseInt(e.target.value) || 0 })
                                    }
                                    disabled={!issue.isSelected}
                                    className="text-sm"
                                  />
                                </div>

                                {/* Status */}
                                <div>
                                  {issue.isSelected && issue.basicPrice && issue.standardPrice && issue.premiumPrice ? (
                                    <Badge variant="default" className="bg-green-100 text-green-800">
                                      <CheckCircle2 className="w-3 h-3 mr-1" />
                                      Ready
                                    </Badge>
                                  ) : issue.isSelected ? (
                                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                                      Incomplete
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-gray-500">
                                      Not Selected
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Mobile Card Layout */}
                      <div className="lg:hidden space-y-4">
                        {pricingData.issues.map((issue) => (
                          <div key={issue.id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center gap-3">
                              <Checkbox
                                checked={issue.isSelected}
                                onCheckedChange={(checked: boolean | string) => 
                                  handleIssueUpdate(issue.id, { isSelected: !!checked })
                                }
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium">{issue.name}</span>
                                  {issue.partType && (
                                    <Badge 
                                      variant="outline" 
                                      className={
                                        issue.partType === 'OEM' 
                                          ? 'bg-green-50 text-green-700 border-green-200' 
                                          : 'bg-orange-50 text-orange-700 border-orange-200'
                                      }
                                    >
                                      {issue.partType}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            {issue.isSelected && (
                              <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <label className="text-xs text-gray-500 font-medium">Basic (₹)</label>
                                  <Input
                                    type="number"
                                    placeholder={getPlaceholder(issue, 'basic')}
                                    value={issue.basicPrice || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                      handleIssueUpdate(issue.id, { basicPrice: parseInt(e.target.value) || 0 })
                                    }
                                    className="h-10 text-center"
                                  />
                                </div>
                                
                                <div className="space-y-1">
                                  <label className="text-xs text-gray-500 font-medium">Standard (₹)</label>
                                  <Input
                                    type="number"
                                    placeholder={getPlaceholder(issue, 'standard')}
                                    value={issue.standardPrice || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                      handleIssueUpdate(issue.id, { standardPrice: parseInt(e.target.value) || 0 })
                                    }
                                    className="h-10 text-center"
                                  />
                                </div>
                                
                                <div className="space-y-1">
                                  <label className="text-xs text-gray-500 font-medium">Premium (₹)</label>
                                  <Input
                                    type="number"
                                    placeholder={getPlaceholder(issue, 'premium')}
                                    value={issue.premiumPrice || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                      handleIssueUpdate(issue.id, { premiumPrice: parseInt(e.target.value) || 0 })
                                    }
                                    className="h-10 text-center"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Status Badge */}
                            <div className="flex justify-end">
                              {issue.isSelected && issue.basicPrice && issue.standardPrice && issue.premiumPrice ? (
                                <Badge variant="default" className="bg-green-100 text-green-800">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Ready
                                </Badge>
                              ) : issue.isSelected ? (
                                <Badge variant="outline" className="text-orange-600 border-orange-300">
                                  Incomplete
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-gray-500">
                                  Not Selected
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mobile Card Layout */}
                  <div className="lg:hidden space-y-4">
                    {pricingData.issues.map((issue) => (
                      <div key={issue.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={issue.isSelected}
                            onCheckedChange={(checked: boolean | string) => 
                              handleIssueUpdate(issue.id, { isSelected: !!checked })
                            }
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{issue.name}</span>
                              {issue.partType && (
                                <Badge 
                                  variant="outline" 
                                  className={
                                    issue.partType === 'OEM' 
                                      ? 'bg-green-50 text-green-700 border-green-200' 
                                      : 'bg-orange-50 text-orange-700 border-orange-200'
                                  }
                                >
                                  {issue.partType}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {issue.isSelected && (
                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <label className="text-xs text-gray-500 font-medium">Basic (₹)</label>
                              <Input
                                type="number"
                                placeholder={getPlaceholder(issue, 'basic')}
                                value={issue.basicPrice || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                  handleIssueUpdate(issue.id, { basicPrice: parseInt(e.target.value) || 0 })
                                }
                                className="h-10 text-center"
                              />
                            </div>
                            
                            <div className="space-y-1">
                              <label className="text-xs text-gray-500 font-medium">Standard (₹)</label>
                              <Input
                                type="number"
                                placeholder={getPlaceholder(issue, 'standard')}
                                value={issue.standardPrice || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                  handleIssueUpdate(issue.id, { standardPrice: parseInt(e.target.value) || 0 })
                                }
                                className="h-10 text-center"
                              />
                            </div>
                            
                            <div className="space-y-1">
                              <label className="text-xs text-gray-500 font-medium">Premium (₹)</label>
                              <Input
                                type="number"
                                placeholder={getPlaceholder(issue, 'premium')}
                                value={issue.premiumPrice || ''}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                                  handleIssueUpdate(issue.id, { premiumPrice: parseInt(e.target.value) || 0 })
                                }
                                className="h-10 text-center"
                              />
                            </div>
                          </div>
                        )}

                        {/* Status Badge */}
                        <div className="flex justify-end">
                          {issue.isSelected && issue.basicPrice && issue.standardPrice && issue.premiumPrice ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Ready
                            </Badge>
                          ) : issue.isSelected ? (
                            <Badge variant="outline" className="text-orange-600 border-orange-300">
                              Incomplete
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-500">
                              Not Selected
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    console.log('🔍 DEBUG - Save button clicked!');
                    console.log('🔍 DEBUG - canSave:', canSave);
                    console.log('🔍 DEBUG - loading:', loading);
                    console.log('🔍 DEBUG - selectedCount:', selectedCount);
                    handleSave();
                  }}
                  disabled={!canSave || loading}
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Tier Pricing ({selectedCount} issues)
                    </>
                  )}
                </Button>
              </div>

              {/* 🚀 NEW: Bulk Pricing Section */}
              {pricingData.brand && pricingData.issues.length > 0 && (
                <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2 mb-4">
                    <Copy className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Apply {pricingData.brand} Pricing to Other Brands
                    </h3>
                  </div>
                  
                  <p className="text-gray-600 mb-4">
                    Set pricing once for {pricingData.brand} and apply it to multiple brands at once. 
                    You can still set individual pricing for any brand later.
                  </p>

                  {/* Brand Selection */}
                  <div className="space-y-4">
                    {/* Apply to All Toggle */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="apply-to-all"
                        checked={applyToAllBrands}
                        onCheckedChange={handleApplyToAllBrandsChange}
                      />
                      <Label htmlFor="apply-to-all" className="text-sm font-medium">
                        Apply to ALL brands (except {pricingData.brand})
                      </Label>
                    </div>

                    {/* Individual Brand Selection */}
                    {!applyToAllBrands && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-3 block">
                          Or select specific brands:
                        </Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {getAllBrandsExceptMaster(pricingData.brand).map((brand) => (
                            <div key={brand} className="flex items-center space-x-2">
                              <Checkbox
                                id={`brand-${brand}`}
                                checked={selectedBrands.includes(brand)}
                                onCheckedChange={(checked: boolean | string) => 
                                  handleBrandSelectionChange(brand, !!checked)
                                }
                              />
                              <Label htmlFor={`brand-${brand}`} className="text-sm text-gray-700">
                                {brand}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bulk Pricing Action */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedBrands([]);
                          setApplyToAllBrands(false);
                        }}
                        disabled={bulkLoading}
                        className="w-full sm:w-auto"
                      >
                        Reset Selection
                      </Button>
                      <Button
                        onClick={applyBulkPricing}
                        disabled={bulkLoading || (!applyToAllBrands && selectedBrands.length === 0)}
                        className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                      >
                        {bulkLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Applying...
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Apply Bulk Pricing
                            {applyToAllBrands 
                              ? ` to ${getAllBrandsExceptMaster(pricingData.brand).length} brands`
                              : ` to ${selectedBrands.length} brands`
                            }
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Mobile-Friendly Save Button */}
              <div className="pt-4 border-t">
                <Button
                  onClick={handleSave}
                  disabled={loading || selectedCount === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 text-base"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    `Save ${selectedCount} Service${selectedCount !== 1 ? 's' : ''}`
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Tier Pricing Display */}
      <div className="space-y-3 sm:space-y-4">
        <h4 className="text-base sm:text-lg font-semibold text-gray-900 text-center sm:text-left">Current Tier Pricing</h4>
        
        {existingPricings.length === 0 ? (
          <Card className="mx-2 sm:mx-0">
            <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 sm:px-6">
              <div className="bg-blue-50 rounded-full p-4 mb-4">
                <DollarSign className="w-10 h-10 sm:w-12 sm:h-12 text-blue-500" />
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2 text-center">No tier pricing set up yet</h3>
              <p className="text-gray-600 text-center mb-6 text-sm sm:text-base px-2 sm:px-0 max-w-md">
                Start by adding tier pricing for your devices. You can set Basic, Standard, and Premium prices for multiple issues at once.
              </p>
              <Button 
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-sm sm:text-base w-full sm:w-auto shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Tier Pricing
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {/* Group by device type and brand */}
            {Object.entries(
              existingPricings.reduce((acc, pricing) => {
                const key = `${pricing.device_type}-${pricing.brand}`;
                if (!acc[key]) {
                  acc[key] = {
                    device_type: pricing.device_type,
                    brand: pricing.brand,
                    items: []
                  };
                }
                acc[key].items.push(pricing);
                return acc;
              }, {} as Record<string, any>)
            ).map(([key, group]: [string, any]) => {
              // Convert existing pricing data to IssueData format for BrandCard
              const issues: IssueData[] = group.items.map((item: any) => {
                const issueMatch = item.issue.match(/^(.+?)\s*\(([^)]+)\)$/);
                let displayIssue = item.issue;
                let partType = undefined;
                
                if (issueMatch) {
                  displayIssue = issueMatch[1].trim();
                  partType = issueMatch[2].trim();
                }
                
                const issueData: IssueData = {
                  id: item.id || item.$id || `temp-${Math.random()}`,
                  name: displayIssue,
                  category: group.device_type,
                  originalId: item.id || item.$id || `temp-${Math.random()}`,
                  partType: partType,
                  isSelected: true,
                  basicPrice: item.basic || 0,
                  standardPrice: item.standard || 0,
                  premiumPrice: item.premium || 0
                };
                
                console.log(`🔧 Converting issue:`, { original: item, converted: issueData });
                return issueData;
              });
              
              console.log(`📦 BrandCard ${group.brand} data:`, { 
                deviceType: group.device_type, 
                brand: group.brand, 
                issuesCount: issues.length,
                issues: issues.map(i => ({ name: i.name, isSelected: i.isSelected, prices: { basic: i.basicPrice, standard: i.standardPrice, premium: i.premiumPrice } }))
              });
              
              return (
                <BrandCard
                  key={key}
                  deviceType={group.device_type}
                  brand={group.brand}
                  issues={issues}
                  existingPricings={existingPricings}
                  onSave={handleSavePricing}
                  onDelete={handleDeleteBrand}
                  onDeleteService={handleDeleteService}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

