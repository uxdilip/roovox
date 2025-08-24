'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Search, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createCustomSeries, createCustomSeriesService } from '@/lib/appwrite-services';
import { getBrandsByCategory, getIssuesByCategory } from '@/lib/appwrite-services';

interface CustomSeriesCreatorProps {
  providerId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
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

export default function CustomSeriesCreator({ providerId, onSuccess, onCancel }: CustomSeriesCreatorProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'setup' | 'models' | 'pricing'>('setup');
  
  // Series setup
  const [seriesName, setSeriesName] = useState('');
  const [description, setDescription] = useState('');
  const [deviceType, setDeviceType] = useState<'phone' | 'laptop'>('phone');
  
  // Simplified model selection
  const [brands, setBrands] = useState<{ key: string; label: string }[]>([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [availableModels, setAvailableModels] = useState<DeviceModel[]>([]);
  const [selectedModels, setSelectedModels] = useState<DeviceModel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  // Pricing
  const [issues, setIssues] = useState<any[]>([]);
  const [pricing, setPricing] = useState<PricingData[]>([]);

  useEffect(() => {
    loadBrands();
    loadIssues();
  }, [deviceType]);

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
        const initialPricing = issuesResponse.documents.map(issue => ({
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
    
    try {
      // Try to get actual models from the database
      const { getPhones, getLaptops } = await import('@/lib/appwrite-services');
      
      let allDevices;
      if (deviceType === 'phone') {
        allDevices = await getPhones();
      } else {
        allDevices = await getLaptops();
      }
      
      // Filter devices by the selected brand
      const brandDevices = allDevices.filter(device => 
        device.brand.toLowerCase() === brand.toLowerCase()
      );
      
      // Convert to the format we need
      const models = brandDevices.map(device => ({
        brand: device.brand,
        model: device.model
      }));
      
      // If no models found, create some dummy models for the brand
      if (models.length === 0) {
        const dummyModels = [
          { brand: brand, model: `${brand} Model 1` },
          { brand: brand, model: `${brand} Model 2` },
          { brand: brand, model: `${brand} Model 3` },
          { brand: brand, model: `${brand} Model 4` },
          { brand: brand, model: `${brand} Model 5` },
        ];
        setAvailableModels(dummyModels);
      } else {
        setAvailableModels(models);
      }
      
      console.log(`Loaded ${models.length} models for ${brand}`);
    } catch (error) {
      console.error('Error loading models:', error);
      // Fallback to dummy models
      const fallbackModels = [
        { brand: brand, model: `${brand} Model 1` },
        { brand: brand, model: `${brand} Model 2` },
        { brand: brand, model: `${brand} Model 3` },
        { brand: brand, model: `${brand} Model 4` },
        { brand: brand, model: `${brand} Model 5` },
      ];
      setAvailableModels(fallbackModels);
    }
  };

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
    const newModels = availableModels.filter(model => 
      !selectedModels.some(selected => 
        selected.brand === model.brand && selected.model === model.model
      )
    );
    setSelectedModels([...selectedModels, ...newModels]);
  };

  const updatePricing = (index: number, field: keyof PricingData, value: number | null) => {
    const newPricing = [...pricing];
    newPricing[index] = { ...newPricing[index], [field]: value };
    setPricing(newPricing);
  };

  const handleNext = () => {
    if (step === 'setup') {
      if (!seriesName.trim()) {
        toast({
          title: "Error",
          description: "Please enter a series name",
          variant: "destructive",
        });
        return;
      }
      setStep('models');
    } else if (step === 'models') {
      if (selectedModels.length === 0) {
        toast({
          title: "Error",
          description: "Please select at least one model",
          variant: "destructive",
        });
        return;
      }
      setStep('pricing');
    }
  };

  const handleBack = () => {
    if (step === 'models') {
      setStep('setup');
    } else if (step === 'pricing') {
      setStep('models');
    }
  };

  const handleCreate = async () => {
    try {
      // Create the custom series
      const seriesData = {
        providerId,
        name: seriesName,
        description,
        deviceType,
        models: selectedModels,
      };

      const series = await createCustomSeries(seriesData);

      // Create pricing for each issue (only if prices are set)
      for (const priceData of pricing) {
        if (priceData.oem && priceData.oem > 0) {
          await createCustomSeriesService({
            customSeriesId: series.$id,
            providerId: providerId,
            issue: priceData.issue,
            partType: 'OEM',
            price: priceData.oem,
            warranty: priceData.oemWarranty ? `${priceData.oemWarranty} months` : null,
          });
        }
        
        if (priceData.hq && priceData.hq > 0) {
          await createCustomSeriesService({
            customSeriesId: series.$id,
            providerId: providerId,
            issue: priceData.issue,
            partType: 'HQ',
            price: priceData.hq,
            warranty: priceData.hqWarranty ? `${priceData.hqWarranty} months` : null,
          });
        }
      }

      toast({
        title: "Success",
        description: `Custom series "${seriesName}" created successfully!`,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error creating custom series:', error);
      toast({
        title: "Error",
        description: "Failed to create custom series",
        variant: "destructive",
      });
    }
  };

  // Filter models based on search term
  const filteredModels = availableModels.filter(model =>
    model.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.brand.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Create Custom Series</h2>
        <p className="text-muted-foreground">
          Create your own series with models from multiple brands
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 ${step === 'setup' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 'setup' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>
              1
            </div>
            <span className="font-medium">Setup</span>
          </div>
          <div className={`flex items-center space-x-2 ${step === 'models' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 'models' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>
              2
            </div>
            <span className="font-medium">Models</span>
          </div>
          <div className={`flex items-center space-x-2 ${step === 'pricing' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === 'pricing' ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>
              3
            </div>
            <span className="font-medium">Pricing</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Step 1: Series Setup */}
        {step === 'setup' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="seriesName">Series Name *</Label>
              <Input
                id="seriesName"
                value={seriesName}
                onChange={(e) => setSeriesName(e.target.value)}
                placeholder="e.g., Premium Phones, Budget Series"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your series (optional)"
              />
            </div>
            
            <div>
              <Label htmlFor="deviceType">Device Type *</Label>
              <Select value={deviceType} onValueChange={(value: 'phone' | 'laptop') => setDeviceType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="laptop">Laptop</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 2: Simplified Model Selection */}
        {step === 'models' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Select Models from Multiple Brands</h3>
                <p className="text-sm text-muted-foreground">
                  Choose models from different brands to create your custom series
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
            {availableModels.length > 0 && (
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
                      <Label>Available Models ({filteredModels.length})</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addAllModels}
                        disabled={filteredModels.length === 0}
                      >
                        Add All
                      </Button>
                    </div>
                    <div className="border rounded-md p-2 max-h-60 overflow-y-auto space-y-2">
                      {filteredModels.map((model, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                          onClick={() => addModel(model)}
                        >
                          <span className="text-sm">{model.model}</span>
                          <Plus className="h-4 w-4" />
                        </div>
                      ))}
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
                      {selectedModels.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <p className="text-sm">No models selected</p>
                          <p className="text-xs">Select a brand and add models</p>
                        </div>
                      ) : (
                        selectedModels.map((model, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-muted rounded"
                          >
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary" className="text-xs">{model.brand}</Badge>
                              <span className="text-sm">{model.model}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeModel(model)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            {availableModels.length === 0 && selectedBrand && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No models found for {selectedBrand}</p>
              </div>
            )}

            {!selectedBrand && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Select a brand to see available models</p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Pricing */}
        {step === 'pricing' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Set Pricing for "{seriesName}"</h3>
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
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-8">
        <Button variant="outline" onClick={handleBack} disabled={step === 'setup'}>
          Back
        </Button>
        
        <div className="flex items-center space-x-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          
          {step === 'pricing' ? (
            <Button onClick={handleCreate}>
              Create Series
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 