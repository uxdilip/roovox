'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Trash2, Minus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createPlatformSeriesCustomization, getBrandsByCategory, getPhones, getLaptops, getIssuesByCategory, createCustomSeriesService } from '@/lib/appwrite-services';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PlatformSeriesCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  platformSeries: any;
  onSuccess: () => void;
}

interface DeviceModel {
  brand: string;
  model: string;
}

interface PricingData {
  issue: string;
  oem: number | null;
  hq: number | null;
  oemWarranty: number | null;
  hqWarranty: number | null;
}

export default function PlatformSeriesCustomizationModal({
  isOpen,
  onClose,
  platformSeries,
  onSuccess
}: PlatformSeriesCustomizationModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'setup' | 'models' | 'pricing'>('setup');
  
  // Series setup
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deviceType, setDeviceType] = useState<'phone' | 'laptop'>('phone');
  
  // Brand and model selection (same as CustomSeriesCreator)
  const [brands, setBrands] = useState<{ key: string; label: string }[]>([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [availableModels, setAvailableModels] = useState<DeviceModel[]>([]);
  const [selectedModels, setSelectedModels] = useState<DeviceModel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingModels, setLoadingModels] = useState(false);
  
  // Pricing
  const [issues, setIssues] = useState<any[]>([]);
  const [pricing, setPricing] = useState<PricingData[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load brands when component mounts
  useEffect(() => {
    if (isOpen) {
      loadBrands();
      loadIssues();
    }
  }, [isOpen, deviceType]);

  // Auto-load models when brand changes
  useEffect(() => {
    if (selectedBrand) {
      loadModels(selectedBrand);
    } else {
      setAvailableModels([]);
    }
  }, [selectedBrand, deviceType]);

  const loadBrands = async () => {
    try {
      console.log('Loading brands for device type:', deviceType);
      const brandsData = await getBrandsByCategory(deviceType);
      console.log('Brands loaded:', brandsData);
      setBrands(brandsData);
    } catch (error) {
      console.error('Error loading brands:', error);
      // Fallback to some common brands if the function fails
      const fallbackBrands = [
        { key: 'Apple', label: 'Apple' },
        { key: 'Samsung', label: 'Samsung' },
        { key: 'OnePlus', label: 'OnePlus' },
        { key: 'Xiaomi', label: 'Xiaomi' },
        { key: 'Realme', label: 'Realme' },
        { key: 'Oppo', label: 'Oppo' },
        { key: 'Vivo', label: 'Vivo' },
        { key: 'Nothing', label: 'Nothing' },
      ];
      setBrands(fallbackBrands);
    }
  };

  const loadIssues = async () => {
    try {
      console.log('Loading issues for device type:', deviceType);
      
      // First get the category ID for the device type
      const { databases, DATABASE_ID } = await import('@/lib/appwrite');
      const { Query } = await import('appwrite');
      
      const categoryResponse = await databases.listDocuments(
        DATABASE_ID,
        'categories',
        [Query.equal('name', deviceType)]
      );
      
      if (categoryResponse.documents.length > 0) {
        const categoryId = categoryResponse.documents[0].$id;
        
        const issuesResponse = await databases.listDocuments(
          DATABASE_ID,
          'issues',
          [Query.equal('category_id', categoryId)]
        );
        
        setIssues(issuesResponse.documents);
        
        // Initialize pricing for each issue
        const initialPricing = issuesResponse.documents.map((issue: any) => ({
          issue: issue.name,
          oem: null,
          hq: null,
          oemWarranty: null,
          hqWarranty: null,
        }));
        setPricing(initialPricing);
      } else {
        // Fallback to common issues if no category found
        const fallbackIssues = [
          { name: 'Screen Replacement' },
          { name: 'Battery Replacement' },
          { name: 'Charging Port Repair' },
          { name: 'Camera Repair' },
          { name: 'Speaker Repair' },
        ];
        setIssues(fallbackIssues);
        
        const initialPricing = fallbackIssues.map(issue => ({
          issue: issue.name,
          oem: null,
          hq: null,
          oemWarranty: null,
          hqWarranty: null,
        }));
        setPricing(initialPricing);
      }
    } catch (error) {
      console.error('Error loading issues:', error);
      // Fallback to common issues
      const fallbackIssues = [
        { name: 'Screen Replacement' },
        { name: 'Battery Replacement' },
        { name: 'Charging Port Repair' },
        { name: 'Camera Repair' },
        { name: 'Speaker Repair' },
      ];
      setIssues(fallbackIssues);
      
      const initialPricing = fallbackIssues.map(issue => ({
        issue: issue.name,
        oem: null,
        hq: null,
        oemWarranty: null,
        hqWarranty: null,
      }));
      setPricing(initialPricing);
    }
  };

  const loadModels = async (brand: string) => {
    if (!brand) return;
    
    setLoadingModels(true);
    setAvailableModels([]); // Clear previous models immediately
    
    try {
      // Try to get actual models from the database
      let allDevices;
      if (deviceType === 'phone') {
        allDevices = await getPhones();
      } else {
        allDevices = await getLaptops();
      }
      
      // Filter devices by the selected brand
      const brandDevices = allDevices.filter((device: any) => 
        device.brand.toLowerCase() === brand.toLowerCase()
      );
      
      // Convert to DeviceModel format
      const models = brandDevices.map((device: any) => ({
        brand: device.brand,
        model: device.model
      }));
      
      setAvailableModels(models);
    } catch (error) {
      console.error('Error loading models:', error);
      setAvailableModels([]);
    } finally {
      setLoadingModels(false);
    }
  };

  // Filter models based on search term
  const filteredModels = availableModels.filter(model =>
    model.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addModel = (model: DeviceModel) => {
    if (!selectedModels.some(m => m.brand === model.brand && m.model === model.model)) {
      setSelectedModels([...selectedModels, model]);
    }
  };

  const removeModel = (model: DeviceModel) => {
    setSelectedModels(selectedModels.filter(m => 
      !(m.brand === model.brand && m.model === model.model)
    ));
  };

  const addAllModels = () => {
    const newModels = filteredModels.filter(model => 
      !selectedModels.some(m => m.brand === model.brand && m.model === model.model)
    );
    setSelectedModels([...selectedModels, ...newModels]);
  };

  const updatePricing = (index: number, field: keyof PricingData, value: number | null) => {
    const newPricing = [...pricing];
    newPricing[index] = { ...newPricing[index], [field]: value };
    setPricing(newPricing);
  };

  useEffect(() => {
    if (platformSeries && isOpen) {
      // Initialize with platform series data
      setName(`${platformSeries.name} - Platform`);
      setDescription(platformSeries.description || '');
      setDeviceType(platformSeries.device_type || 'phone');
      
      // Initialize with all models from platform series
      const initialModels = platformSeries.models.map((modelString: string): DeviceModel => {
        // Handle different possible formats
        if (modelString.includes(':')) {
          const [brand, model] = modelString.split(':');
          return { brand: brand || 'Unknown', model: model || modelString };
        } else {
          // Try to extract brand from space-separated format
          const words = modelString.split(' ');
          const commonBrands = ['Samsung', 'Xiaomi', 'Redmi', 'Vivo', 'Realme', 'OPPO', 'OnePlus', 'Apple', 'iPhone', 'Honor', 'Nothing', 'POCO', 'Motorola', 'Lenovo', 'Nokia', 'Asus', 'Dell', 'HP', 'MSI', 'Razer', 'Alienware'];
          
          for (const brand of commonBrands) {
            if (modelString.toLowerCase().startsWith(brand.toLowerCase())) {
              const model = modelString.substring(brand.length).trim();
              return { brand, model: model || modelString };
            }
          }
          
          // If no common brand found, use first word as brand
          return { brand: words[0] || 'Unknown', model: words.slice(1).join(' ') || modelString };
        }
      });
      
      setSelectedModels(initialModels);
      
              // Reset other states
        setSelectedBrand('');
        setSearchTerm('');
        setAvailableModels([]);
        setLoadingModels(false);
        setError(null);
    }
  }, [platformSeries, isOpen]);

  const handleSubmit = async () => {
    if (!user?.id || !name.trim() || selectedModels.length === 0) {
      return;
    }

    setIsLoading(true);
    try {
      // Create the platform series customization
      const series = await createPlatformSeriesCustomization({
        providerId: user.id,
        baseSeriesId: platformSeries.$id,
        name: name.trim(),
        description: description.trim(),
        deviceType: deviceType,
        models: selectedModels
      });

      // Create pricing for each issue (only if prices are set)
      for (const priceData of pricing) {
        if (priceData.oem && priceData.oem > 0) {
          await createCustomSeriesService({
            customSeriesId: series.$id,
            providerId: user.id,
            issue: priceData.issue,
            partType: 'OEM',
            price: priceData.oem,
            warranty: priceData.oemWarranty ? `${priceData.oemWarranty} months` : null,
          });
        }
        
        if (priceData.hq && priceData.hq > 0) {
          await createCustomSeriesService({
            customSeriesId: series.$id,
            providerId: user.id,
            issue: priceData.issue,
            partType: 'HQ',
            price: priceData.hq,
            warranty: priceData.hqWarranty ? `${priceData.hqWarranty} months` : null,
          });
        }
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating platform series customization:', error);
      setError('Failed to create platform series. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep('setup');
    setName('');
    setDescription('');
    setSelectedModels([]);
    setSelectedBrand('');
    setSearchTerm('');
    setAvailableModels([]);
    setLoadingModels(false);
    setIsLoading(false);
    setError(null);
    setPricing([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!platformSeries) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Customize Platform Series</span>
            <Badge variant="secondary" className="text-xs">
              {platformSeries.name}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Basic Setup */}
          {step === 'setup' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Series Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter platform series name"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your platform series"
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={() => setStep('models')} disabled={!name.trim()}>
                  Next: Select Models
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Model Selection */}
          {step === 'models' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Customize Models</h3>
                  <p className="text-sm text-muted-foreground">
                    Select which models to include in your platform series
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedModels.length} models selected
                </div>
              </div>

              {/* Brand Selection */}
              <div>
                <Label htmlFor="brand">Select Brand</Label>
                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.key} value={brand.key}>
                        {brand.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Model Selection */}
              {selectedBrand && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="search">Search Models</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search models..."
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Available Models */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label>Available Models ({loadingModels ? '...' : filteredModels.length})</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addAllModels}
                          disabled={loadingModels || filteredModels.length === 0}
                        >
                          Add All
                        </Button>
                      </div>
                      <div className="border rounded-md p-2 max-h-60 overflow-y-auto space-y-2">
                        {loadingModels ? (
                          <div className="flex items-center justify-center py-8">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                              <span className="text-sm">Loading models...</span>
                            </div>
                          </div>
                        ) : availableModels.length > 0 ? (
                          filteredModels.map((model, index) => {
                            const isSelected = selectedModels.some(m => m.brand === model.brand && m.model === model.model);
                            return (
                              <div
                                key={index}
                                className={`flex items-center justify-between p-2 rounded cursor-pointer ${
                                  isSelected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted'
                                }`}
                                onClick={() => {
                                  if (isSelected) {
                                    removeModel(model);
                                  } else {
                                    addModel(model);
                                  }
                                }}
                              >
                                <span className="text-sm">{model.model}</span>
                                {isSelected ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700 p-1 h-6 w-6"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeModel(model);
                                    }}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Plus className="h-4 w-4" />
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <p>No models found for {selectedBrand}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Selected Models */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label>Selected Models ({selectedModels.length})</Label>
                        {selectedModels.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedModels([])}
                          >
                            Clear All
                          </Button>
                        )}
                      </div>
                      <div className="border rounded-md p-2 max-h-60 overflow-y-auto space-y-2">
                        {selectedModels.map((model, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 hover:bg-muted rounded"
                          >
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {model.brand}
                              </Badge>
                              <span className="text-sm">{model.model}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeModel(model)}
                              className="text-red-500 hover:text-red-700 p-1 h-6 w-6"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Show message when no brand is selected */}
              {!selectedBrand && step === 'models' && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Please select a brand to view available models</p>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => {
                  setStep('setup');
                  setError(null);
                }}>
                  Back
                </Button>
                <Button 
                  onClick={() => setStep('pricing')} 
                  disabled={selectedModels.length === 0}
                >
                  Next: Pricing
                </Button>
              </div>
            </div>
          )}

                     {/* Step 3: Pricing */}
           {step === 'pricing' && (
             <div className="space-y-6">
               <div>
                 <h3 className="text-lg font-medium mb-4">Set Pricing for "{name}"</h3>
                 <p className="text-sm text-muted-foreground mb-4">
                   Set pricing for each issue (optional). This will apply to all {selectedModels.length} selected models. You can leave prices empty and set them later.
                 </p>
               </div>

               {pricing.length > 0 ? (
                 <div className="space-y-4">
                   {pricing.map((priceData, index) => (
                     <Card key={index}>
                       <CardHeader>
                         <CardTitle className="text-base">{priceData.issue}</CardTitle>
                       </CardHeader>
                       <CardContent>
                         {priceData.issue === 'Screen Replacement' ? (
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {/* OEM Parts */}
                             <div>
                               <Label>OEM Parts</Label>
                               <div className="space-y-2">
                                 <div>
                                   <Label className="text-sm text-muted-foreground">Price (₹)</Label>
                                   <Input
                                     type="number"
                                     value={priceData.oem || ''}
                                     onChange={(e) => updatePricing(index, 'oem', e.target.value ? Number(e.target.value) : null)}
                                     placeholder="Enter price"
                                   />
                                 </div>
                                 <div>
                                   <Label className="text-sm text-muted-foreground">Warranty (months)</Label>
                                   <Input
                                     type="number"
                                     value={priceData.oemWarranty || ''}
                                     onChange={(e) => updatePricing(index, 'oemWarranty', e.target.value ? Number(e.target.value) : null)}
                                     placeholder="Enter warranty"
                                   />
                                 </div>
                               </div>
                             </div>

                             {/* High Quality Parts */}
                             <div>
                               <Label>High Quality Parts</Label>
                               <div className="space-y-2">
                                 <div>
                                   <Label className="text-sm text-muted-foreground">Price (₹)</Label>
                                   <Input
                                     type="number"
                                     value={priceData.hq || ''}
                                     onChange={(e) => updatePricing(index, 'hq', e.target.value ? Number(e.target.value) : null)}
                                     placeholder="Enter price"
                                   />
                                 </div>
                                 <div>
                                   <Label className="text-sm text-muted-foreground">Warranty (months)</Label>
                                   <Input
                                     type="number"
                                     value={priceData.hqWarranty || ''}
                                     onChange={(e) => updatePricing(index, 'hqWarranty', e.target.value ? Number(e.target.value) : null)}
                                     placeholder="Enter warranty"
                                   />
                                 </div>
                               </div>
                             </div>
                           </div>
                         ) : (
                           <div>
                             <Label>Price (₹)</Label>
                             <Input
                               type="number"
                               value={priceData.oem || ''}
                               onChange={(e) => updatePricing(index, 'oem', e.target.value ? Number(e.target.value) : null)}
                               placeholder="Enter price"
                             />
                           </div>
                         )}
                       </CardContent>
                     </Card>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-8">
                   <p className="text-muted-foreground">No issues available for this device type.</p>
                 </div>
               )}

               {/* Error Display */}
               {error && (
                 <div className="bg-red-50 border border-red-200 rounded-md p-3">
                   <p className="text-sm text-red-600">{error}</p>
                 </div>
               )}

               <div className="flex justify-between pt-4">
                 <Button variant="outline" onClick={() => {
                   setStep('models');
                   setError(null);
                 }}>
                   Back
                 </Button>
                 <Button 
                   onClick={handleSubmit} 
                   disabled={isLoading}
                 >
                   {isLoading ? 'Creating...' : 'Create Platform Series'}
                 </Button>
               </div>
             </div>
           )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 