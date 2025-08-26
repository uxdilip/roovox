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
  InfoIcon
} from 'lucide-react';
import { getPhones, getLaptops, getIssuesByCategory, getBrandsByCategory } from '@/lib/appwrite-services';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { saveBulkTierPricing, getProviderTierPricing, deleteTierPricing, deleteTierPricingService, BulkTierPricingData } from '@/lib/tier-pricing-services';

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
  const [editedIssues, setEditedIssues] = useState<IssueData[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Debug logging
  console.log(`🔍 BrandCard ${brand}:`, { 
    deviceType, 
    issuesCount: issues.length, 
    isEditMode,
    editedIssuesCount: editedIssues.length,
    issues: issues.map(i => ({ name: i.name, isSelected: i.isSelected, prices: { basic: i.basicPrice, standard: i.standardPrice, premium: i.premiumPrice } })),
    editedIssues: editedIssues.map(i => ({ id: i.id, name: i.name, isSelected: i.isSelected, prices: { basic: i.basicPrice, standard: i.standardPrice, premium: i.premiumPrice } }))
  });

  // Initialize edited issues when entering edit mode
  useEffect(() => {
    if (isEditMode) {
      console.log(`📝 Entering edit mode for ${brand}, initializing with:`, issues);
      console.log(`🔍 Issues structure:`, issues.map(i => ({ id: i.id, name: i.name, basicPrice: i.basicPrice, standardPrice: i.standardPrice, premiumPrice: i.premiumPrice })));
      
      // Deep clone the issues to ensure we have a clean copy
      const clonedIssues = issues.map(issue => ({
        ...issue,
        basicPrice: Number(issue.basicPrice) || 0,
        standardPrice: Number(issue.standardPrice) || 0,
        premiumPrice: Number(issue.premiumPrice) || 0
      }));
      
      console.log(`🔍 Cloned issues:`, clonedIssues.map(i => ({ id: i.id, name: i.name, basicPrice: i.basicPrice, standardPrice: i.standardPrice, premiumPrice: i.premiumPrice })));
      
      setEditedIssues(clonedIssues);
      setHasChanges(false);
    } else {
      // Reset editedIssues when exiting edit mode
      setEditedIssues([]);
    }
  }, [isEditMode, issues, brand]);

  // Reset edited issues when issues prop changes
  useEffect(() => {
    if (isEditMode) {
      console.log(`🔄 Issues prop changed for ${brand}, updating editedIssues:`, issues);
      setEditedIssues([...issues]);
    }
  }, [issues, isEditMode, brand]);

  // Debug: Log when editedIssues changes
  useEffect(() => {
    console.log(`📝 editedIssues changed for ${brand}:`, editedIssues.map(i => ({ id: i.id, basicPrice: i.basicPrice, standardPrice: i.standardPrice, premiumPrice: i.premiumPrice })));
  }, [editedIssues, brand]);

  const handlePriceChange = (issueId: string, priceType: 'basic' | 'standard' | 'premium', value: string) => {
    // Ensure we get a clean number value, removing any leading zeros
    const cleanValue = value.replace(/^0+/, '') || '0'; // Remove leading zeros but keep '0' if empty
    const numValue = parseInt(cleanValue) || 0;
    
    console.log(`💰 Price change: ${issueId} ${priceType} = ${value} -> ${cleanValue} -> ${numValue}`);
    console.log(`🔍 Current editedIssues:`, editedIssues);
    console.log(`🔍 Looking for issue with ID: ${issueId}`);
    
    setEditedIssues(prev => {
      console.log(`🔍 Previous editedIssues:`, prev);
      const updated = prev.map(issue => {
        if (issue.id === issueId) {
          const oldValue = priceType === 'basic' ? issue.basicPrice : priceType === 'standard' ? issue.standardPrice : issue.premiumPrice;
          console.log(`✅ Found issue ${issueId}, updating ${priceType}Price from ${oldValue} to ${numValue}`);
          if (priceType === 'basic') {
            return { ...issue, basicPrice: numValue };
          } else if (priceType === 'standard') {
            return { ...issue, standardPrice: numValue };
          } else {
            return { ...issue, premiumPrice: numValue };
          }
        }
        return issue;
      });
      console.log(`✅ Updated editedIssues:`, updated);
      return updated;
    });
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

  console.log(`📊 ${brand} stats:`, { selectedCount, totalIssues, isEditMode });

  return (
    <Card className={`transition-all duration-200 ${isEditMode ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-semibold">{brand} {deviceType === 'phones' ? 'phones' : 'laptops'}</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {selectedCount} {selectedCount === 1 ? 'service' : 'services'}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {!isEditMode ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditMode(true)}
                >
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleDeleteBrand}
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
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {issues.map((issue) => (
            <div key={issue.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <input
                  type="checkbox"
                  checked={isEditMode && editedIssues.length > 0 ? (editedIssues.find(e => e.id === issue.id)?.isSelected ?? issue.isSelected) : issue.isSelected}
                  onChange={(e) => handleIssueToggle(issue.id, e.target.checked)}
                  disabled={!isEditMode}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="font-medium text-gray-900 truncate">
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
              
              <div className="flex items-center gap-2">
                {isEditMode ? (
                  <>
                    <div className="text-center">
                      <label className="text-xs text-gray-500 mb-1 block">Basic</label>
                      <Input
                        type="number"
                        value={(() => {
                          if (!isEditMode || editedIssues.length === 0) {
                            return issue.basicPrice || '';
                          }
                          const editedIssue = editedIssues.find(e => e.id === issue.id);
                          const value = editedIssue ? editedIssue.basicPrice : issue.basicPrice;
                          return value || '';
                        })()}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = e.target.value;
                          // Only allow positive numbers
                          if (value === '' || /^\d+$/.test(value)) {
                            handlePriceChange(issue.id, 'basic', value);
                          }
                        }}
                        className="w-20 h-8 text-center"
                        min="100"
                        step="1"
                      />
                    </div>
                    
                    <div className="text-center">
                      <label className="text-xs text-gray-500 mb-1 block">Standard</label>
                      <Input
                        type="number"
                        value={(() => {
                          if (!isEditMode || editedIssues.length === 0) {
                            return issue.standardPrice || '';
                          }
                          const editedIssue = editedIssues.find(e => e.id === issue.id);
                          const value = editedIssue ? editedIssue.standardPrice : issue.standardPrice;
                          return value || '';
                        })()}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = e.target.value;
                          // Only allow positive numbers
                          if (value === '' || /^\d+$/.test(value)) {
                            handlePriceChange(issue.id, 'standard', value);
                          }
                        }}
                        className="w-20 h-8 text-center"
                        min="100"
                        step="1"
                      />
                    </div>
                    
                    <div className="text-center">
                      <label className="text-xs text-gray-500 mb-1 block">Premium</label>
                      <Input
                        type="number"
                        value={(() => {
                          if (!isEditMode || editedIssues.length === 0) {
                            return issue.premiumPrice || '';
                          }
                          const editedIssue = editedIssues.find(e => e.id === issue.id);
                          const value = editedIssue ? editedIssue.premiumPrice : issue.premiumPrice;
                          return value || '';
                        })()}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = e.target.value;
                          // Only allow positive numbers
                          if (value === '' || /^\d+$/.test(value)) {
                            handlePriceChange(issue.id, 'premium', value);
                          }
                        }}
                        className="w-20 h-8 text-center"
                        min="100"
                        step="1"
                      />
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteService(issue.name)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={isSaving}
                    >
                      Remove
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Basic</div>
                      <div className="font-semibold text-gray-900">₹{issue.basicPrice || 0}</div>
                    </div>
                    
                                         <div className="text-center">
                       <div className="text-xs text-gray-500">Standard</div>
                       <div className="font-semibold text-gray-900">₹{issue.standardPrice || 0}</div>
                     </div>
                    
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Premium</div>
                      <div className="font-semibold text-gray-900">₹{issue.premiumPrice || 0}</div>
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
              className="w-full"
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Service</h3>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Set Basic, Standard, and Premium prices for all your services at once</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto w-[95vw] max-w-none mx-4">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Setup Service</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Device Type Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <h4 className="text-lg font-semibold">Select Issues & Set Pricing</h4>
                    {totalCount > 0 && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <span className="text-sm text-gray-600">
                          {selectedCount} of {totalCount} selected
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSelectAll(selectedCount < totalCount)}
                          className="w-full sm:w-auto"
                        >
                          {selectedCount < totalCount ? 'Select All' : 'Deselect All'}
                        </Button>
                      </div>
                    )}
                  </div>

                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">Loading issues...</span>
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
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
                      Save Service ({selectedCount} issues)
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

                {/* Current Service Display */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Current Service</h4>
        
        {existingPricings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <DollarSign className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No service set up yet</h3>
              <p className="text-gray-600 text-center mb-4">
                Start by adding service for your devices. You can set Basic, Standard, and Premium prices for multiple issues at once.
              </p>
              <Button 
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Service
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
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
                  basicPrice: Number(item.basic) || 0,
                  standardPrice: Number(item.standard) || 0,
                  premiumPrice: Number(item.premium) || 0
                };
                
                console.log(`🔧 Converting issue:`, { 
                  original: { 
                    id: item.id || item.$id, 
                    issue: item.issue, 
                    basic: item.basic, 
                    standard: item.standard, 
                    premium: item.premium,
                    basicType: typeof item.basic,
                    basicValue: item.basic,
                    standardValue: item.standard,
                    premiumValue: item.premium
                  }, 
                  converted: { 
                    id: issueData.id,
                    name: issueData.name,
                    basicPrice: issueData.basicPrice,
                    standardPrice: issueData.standardPrice,
                    premiumPrice: issueData.premiumPrice
                  },
                  conversion: {
                    basicConversion: `${item.basic} -> Number(${item.basic}) -> ${Number(item.basic) || 0}`,
                    standardConversion: `${item.standard} -> Number(${item.standard}) -> ${Number(item.standard) || 0}`,
                    premiumConversion: `${item.premium} -> Number(${item.premium}) -> ${Number(item.premium) || 0}`
                  }
                });
                return issueData;
              });
              
              console.log(`📦 BrandCard ${group.brand} data:`, { 
                deviceType: group.device_type, 
                brand: group.brand, 
                issuesCount: issues.length,
                issues: issues.map(i => ({ 
                  id: i.id, 
                  name: i.name, 
                  isSelected: i.isSelected, 
                  prices: { basic: i.basicPrice, standard: i.standardPrice, premium: i.premiumPrice } 
                }))
              });
              
              return (
                <BrandCard
                  key={`${key}-${group.items.length}`}
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

