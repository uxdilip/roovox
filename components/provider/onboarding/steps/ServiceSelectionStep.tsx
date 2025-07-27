import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { getPhones, getLaptops, getDevicesByBrand } from '@/lib/appwrite-services';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useCallback } from 'react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/contexts/AuthContext';
import { upsertBusinessSetup } from '@/lib/appwrite-services';
import { useToast } from '@/hooks/use-toast';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

const DEVICES = [
  { key: 'phone', label: 'Phone' },
  { key: 'laptop', label: 'Laptop' },
];

const BRANDS = {
  mobile: [
    { key: 'apple', label: 'Apple' },
    { key: 'samsung', label: 'Samsung' },
    { key: 'xiaomi', label: 'Xiaomi' },
    { key: 'oneplus', label: 'OnePlus' },
  ],
  laptop: [
    { key: 'apple', label: 'Apple' },
    { key: 'dell', label: 'Dell' },
    { key: 'hp', label: 'HP' },
    { key: 'lenovo', label: 'Lenovo' },
  ],
};

// Predefined issues per device type
export const ISSUES: Record<string, { key: string; label: string }[]> = {
  mobile: [
    { key: 'screen', label: 'Screen Replacement' },
    { key: 'battery', label: 'Battery' },
    { key: 'charging', label: 'Charging Port' },
    { key: 'camera', label: 'Camera' },
    { key: 'software', label: 'Software' },
  ],
  laptop: [
    { key: 'screen', label: 'Screen Replacement' },
    { key: 'battery', label: 'Battery' },
    { key: 'charging', label: 'Charging Port' },
    { key: 'camera', label: 'Camera' },
    { key: 'os', label: 'OS' },
    { key: 'keyboard', label: 'Keyboard' },
    { key: 'motherboard', label: 'Motherboard' },
  ],
};

interface ServiceSelectionStepProps {
  data: any;
  setData: (d: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

const ServiceSelectionStep: React.FC<ServiceSelectionStepProps> = ({ data, setData, onNext, onPrev }) => {
  const [selectedDevice, setSelectedDevice] = useState<string>(data.selectedDevice || 'phone');
  const [deviceBrands, setDeviceBrands] = useState<{ [key: string]: string[] }>(data.deviceBrands || { phone: [], laptop: [] });
  const [brands, setBrands] = useState<{ key: string; label: string }[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [modelModalBrand, setModelModalBrand] = useState<string | null>(null);
  const [modelSearch, setModelSearch] = useState('');
  const [models, setModels] = useState<any[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [selectedModels, setSelectedModels] = useState<Record<string, string[]>>(data.models || {}); // { brandKey: [modelName, ...] }

  // Merged model+issue+pricing state: { brand: { model: { selected: bool, issues: { [issue]: { selected: bool, pricing: ... } } } } }
  const [brandModelIssue, setBrandModelIssue] = useState<any>(data.brandModelIssue || { phone: {}, laptop: {} });

  // Add state for fetched issues
  const [issues, setIssues] = useState<{ key: string; label: string; type?: string }[]>([]);

  // Open modal and fetch models for brand
  const openModelModal = useCallback(async (brandKey: string) => {
    setModelModalBrand(brandKey);
    setModelSearch('');
    setLoadingModels(true);
    let devices: any[] = [];
    if (selectedDevice === 'phone') {
      devices = (await getPhones()).filter((d: any) => d.brand === brandKey);
    } else {
      devices = (await getLaptops()).filter((d: any) => d.brand === brandKey);
    }
    setModels(devices);
    setLoadingModels(false);
  }, [selectedDevice]);

  // Temp state for modal selection
  const [tempModelIssue, setTempModelIssue] = useState<any>({});
  useEffect(() => {
    if (modelModalBrand) {
      setTempModelIssue(brandModelIssue[selectedDevice]?.[modelModalBrand] || {});
    }
  }, [modelModalBrand, brandModelIssue, selectedDevice]);

  // Fetch issues from DB when selectedDevice changes
  useEffect(() => {
    async function fetchIssues() {
      setIssues([]);
      if (!selectedDevice) return;
      setLoadingBrands(true);
      try {
        // Fetch categories to get categoryId for selectedDevice
        const categoriesRes = await databases.listDocuments(
          DATABASE_ID,
          'categories',
          []
        );
        const category = categoriesRes.documents.find((c: any) => c.name.toLowerCase() === selectedDevice);
        if (!category) {
          setLoadingBrands(false);
          return;
        }
        // Fetch issues for this category
        const issuesRes = await databases.listDocuments(
          DATABASE_ID,
          'issues',
          [Query.equal('category_id', category.$id)]
        );
        setIssues(issuesRes.documents.map((i: any) => ({ key: i.$id, label: i.name, type: i.type })));
      } catch (e) {
        setIssues([]);
      }
      setLoadingBrands(false);
    }
    fetchIssues();
  }, [selectedDevice]);

  // Model selection handlers
  const handleModelCheck = (model: string, checked: boolean) => {
    setTempModelIssue((prev: any) => ({
      ...prev,
      [model]: checked
        ? { selected: true, issues: prev[model]?.issues || {} }
        : undefined,
    }));
  };
  const handleIssueCheck = (model: string, issue: string, checked: boolean) => {
    setTempModelIssue((prev: any) => ({
      ...prev,
      [model]: {
        ...prev[model],
        issues: {
          ...prev[model]?.issues,
          [issue]: {
            ...prev[model]?.issues?.[issue],
            selected: checked,
          },
        },
      },
    }));
  };
  const handlePriceChange = (model: string, issue: string, type: 'oem' | 'hq' | 'single' | 'oemWarranty' | 'hqWarranty', value: string) => {
    setTempModelIssue((prev: any) => ({
      ...prev,
      [model]: {
        ...prev[model],
        issues: {
          ...prev[model]?.issues,
          [issue]: {
            ...prev[model]?.issues?.[issue],
            pricing: {
              ...prev[model]?.issues?.[issue]?.pricing,
              [type]: value,
            },
          },
        },
      },
    }));
  };
  // Select all/clear all models
  const handleSelectAllModels = () => {
    const all = Object.fromEntries(filteredModels.map(m => [m.model, { selected: true, issues: tempModelIssue[m.model]?.issues || {} }]));
    setTempModelIssue(all);
  };
  const handleClearAllModels = () => setTempModelIssue({});
  // Select all/clear all issues for a model
  const handleSelectAllIssues = (model: string) => {
    setTempModelIssue((prev: any) => ({
      ...prev,
      [model]: {
        ...prev[model],
        issues: Object.fromEntries(issues.map(issue => [issue.key, { selected: true, pricing: prev[model]?.issues?.[issue.key]?.pricing || {} }]))
      },
    }));
  };
  const handleClearAllIssues = (model: string) => {
    setTempModelIssue((prev: any) => ({
      ...prev,
      [model]: {
        ...prev[model],
        issues: {},
      },
    }));
  };
  // Confirm/save selection
  const handleConfirmModels = () => {
    setBrandModelIssue((prev: any) => ({
      ...prev,
      [selectedDevice]: {
        ...prev[selectedDevice],
        [modelModalBrand!]: tempModelIssue
      }
    }));
    setModelModalBrand(null);
  };
  // Validation: require price for every selected issue
  const isModelIssueValid = Object.values(tempModelIssue).every((m: any) =>
    !m.selected || Object.entries(m.issues || {}).every(([issue, val]: any) => {
      if (!val || !val.selected) return true;
      if (!val.pricing) return false;
      // For issues with screen replacement UI, require all four fields
      if (
        val.pricing.oem !== '' &&
        val.pricing.oemWarranty !== '' &&
        val.pricing.hq !== '' &&
        val.pricing.hqWarranty !== ''
      ) {
        return true;
      }
      // Fallback for other issues
      return !!val.pricing.single;
    })
  );

  // Filtered models
  const filteredModels = models.filter(m =>
    m.model.toLowerCase().includes(modelSearch.toLowerCase())
  );

  useEffect(() => {
    setData({ ...data, selectedDevice, deviceBrands, brandModelIssue });
    // eslint-disable-next-line
  }, [selectedDevice, deviceBrands, brandModelIssue]);

  useEffect(() => {
    let isMounted = true;
    setLoadingBrands(true);
    const fetchBrands = async () => {
      const devices = selectedDevice === 'phone' ? await getPhones() : await getLaptops();
      if (!isMounted) return;
      const uniqueBrands = Array.from(new Set(devices.map((d: any) => d.brand)))
        .filter(Boolean)
        .map((b: string) => ({ key: b, label: b.charAt(0).toUpperCase() + b.slice(1) }));
      setBrands(uniqueBrands);
      setLoadingBrands(false);
    };
    fetchBrands();
    return () => { isMounted = false; };
  }, [selectedDevice]);

  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      // Fetch latest onboarding_data from DB
      let onboarding_data = {};
      const res = await databases.listDocuments(
        DATABASE_ID,
        'business_setup',
        [Query.equal('user_id', user.id), Query.limit(1)]
      );
      if (res.documents.length > 0) {
        try {
          onboarding_data = JSON.parse(res.documents[0].onboarding_data || '{}');
        } catch {
          onboarding_data = {};
        }
      }
      // Store both device types, their brands, and brandModelIssue in onboarding_data
      onboarding_data = {
        ...onboarding_data,
        serviceSelection: {
          phone: {
            brands: deviceBrands.phone || [],
            brandModelIssue: brandModelIssue.phone || {},
          },
          laptop: {
            brands: deviceBrands.laptop || [],
            brandModelIssue: brandModelIssue.laptop || {},
          },
        },
      };
      await upsertBusinessSetup({
        user_id: user.id,
        onboarding_data,
      });
      
      // Also update the local form state so it's available in FinishStep
      const serviceSelectionData = {
        phone: {
          brands: deviceBrands.phone || [],
          brandModelIssue: brandModelIssue.phone || {},
        },
        laptop: {
          brands: deviceBrands.laptop || [],
          brandModelIssue: brandModelIssue.laptop || {},
        },
      };
      
      setData({ ...data, serviceSelection: serviceSelectionData });
      
      toast({ title: 'Service selection saved', description: 'Your service selection has been saved successfully.' });
      onNext();
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to save service selection. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Update selected brands for the current device
  const handleBrandChange = (brandKey: string, checked: boolean) => {
    setDeviceBrands(prev => {
      const updated = { ...prev };
      if (checked) {
        updated[selectedDevice] = [...(updated[selectedDevice] || []), brandKey];
      } else {
        updated[selectedDevice] = (updated[selectedDevice] || []).filter(b => b !== brandKey);
      }
      return updated;
    });
  };

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      <div>
        <Label className="block text-lg font-semibold mb-4">Device Selection</Label>
        <Tabs value={selectedDevice} onValueChange={setSelectedDevice} className="w-full">
          <TabsList className="w-full flex gap-4 bg-gray-100 rounded-lg p-1">
            {DEVICES.map(device => (
              <TabsTrigger
                key={device.key}
                value={device.key}
                className="flex-1 text-base"
              >
                {device.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      <div>
        <Label className="block text-lg font-semibold mb-2 mt-8">Brand Selection</Label>
        {loadingBrands ? (
          <div className="flex items-center gap-2 text-gray-500"><Loader2 className="animate-spin h-5 w-5" /> Loading brands...</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {brands.map((brand: { key: string; label: string }) => (
              <div key={brand.key} className="flex flex-col gap-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={deviceBrands[selectedDevice]?.includes(brand.key) || false}
                    onCheckedChange={checked => handleBrandChange(brand.key, !!checked)}
                    id={`brand-${brand.key}`}
                  />
                  <span>{brand.label}</span>
                </label>
                {deviceBrands[selectedDevice]?.includes(brand.key) && (
                  <Button type="button" size="sm" variant="outline" className="mt-1 w-full" onClick={() => openModelModal(brand.key)}>
                    Edit Models
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Model + Issue Selection Modal */}
      <Dialog open={!!modelModalBrand} onOpenChange={open => { if (!open) setModelModalBrand(null); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Select Supported Models & Issues — {modelModalBrand && brands.find(b => b.key === modelModalBrand)?.label}</DialogTitle>
          </DialogHeader>
          <div className="sticky top-0 z-10 bg-white pb-2">
            <Input
              placeholder="Search models..."
              value={modelSearch}
              onChange={e => setModelSearch(e.target.value)}
              className="mb-2"
            />
            <div className="flex gap-2 mb-2">
              <Button type="button" size="sm" variant="outline" onClick={handleSelectAllModels} disabled={filteredModels.length === 0}>Select All Models</Button>
              <Button type="button" size="sm" variant="outline" onClick={handleClearAllModels} disabled={filteredModels.length === 0}>Clear All</Button>
            </div>
          </div>
          {loadingModels ? (
            <div className="flex items-center gap-2 text-gray-500"><Loader2 className="animate-spin h-5 w-5" /> Loading models...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
              {filteredModels.map(m => {
                const modelState = tempModelIssue[m.model] || {};
                return (
                  <Collapsible key={m.model} open={!!modelState.open} onOpenChange={open => setTempModelIssue((prev: any) => ({ ...prev, [m.model]: { ...prev[m.model], open } }))}>
                    <div className="border rounded-lg p-3 bg-gray-50 hover:bg-primary/10 transition flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={!!modelState.selected}
                          onCheckedChange={checked => handleModelCheck(m.model, !!checked)}
                        />
                        {m.image_url && <img src={m.image_url} alt={m.model} className="w-10 h-10 object-contain" />}
                        <span className="font-medium text-base flex-1">{m.model}</span>
                        <CollapsibleTrigger asChild>
                          <Button type="button" size="sm" variant="ghost">{modelState.open ? 'Hide Issues' : 'Show Issues'}</Button>
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent>
                        <div className="pl-6 pt-2">
                          <div className="flex gap-2 mb-2">
                            <Button type="button" size="sm" variant="outline" onClick={() => handleSelectAllIssues(m.model)}>Select All Issues</Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => handleClearAllIssues(m.model)}>Clear All</Button>
                          </div>
                          <div className="space-y-3">
                            {issues.map(issue => {
                              const issueState = modelState.issues?.[issue.key] || {};
                              return (
                                <div key={issue.key} className="flex flex-col md:flex-row md:items-center gap-4 border-b pb-2 last:border-b-0">
                                  <label className="flex items-center gap-2 min-w-[180px]">
                                    <Checkbox
                                      checked={!!issueState.selected}
                                      onCheckedChange={checked => handleIssueCheck(m.model, issue.key, !!checked)}
                                    />
                                    <span>{issue.label}</span>
                                    {issue.type === 'screen' && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Info className="h-4 w-4 text-blue-500 cursor-pointer" />
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            Only screen replacement allows OEM/High Quality part selection and warranty.
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    )}
                                  </label>
                                  {issueState.selected && (
                                    <div className="flex flex-col md:flex-row gap-4 w-full">
                                      {issue.type === 'screen' ? (
                                        <div className="flex flex-col gap-3 w-full">
                                          <div className="flex flex-wrap items-center gap-2 w-full">
                                            <span className="font-medium text-sm min-w-[110px]">OEM Part</span>
                                            <input
                                              type="number"
                                              min={0}
                                              placeholder="Price (₹)"
                                              value={issueState.pricing?.oem || ''}
                                              onChange={e => handlePriceChange(m.model, issue.key, 'oem', e.target.value)}
                                              className="input w-20 text-sm px-2 py-1 border rounded"
                                            />
                                            <input
                                              type="number"
                                              min={1}
                                              placeholder="Warranty (months)"
                                              value={issueState.pricing?.oemWarranty || ''}
                                              onChange={e => handlePriceChange(m.model, issue.key, 'oemWarranty', e.target.value)}
                                              className="input w-20 text-xs px-2 py-1 border rounded"
                                            />
                                            <div className="w-full">
                                              <span className="text-xs text-gray-400 mt-1 block">Enter warranty in months</span>
                                            </div>
                                          </div>
                                          <div className="flex flex-wrap items-center gap-2 w-full">
                                            <span className="font-medium text-sm min-w-[110px]">High Quality Part</span>
                                            <input
                                              type="number"
                                              min={0}
                                              placeholder="Price (₹)"
                                              value={issueState.pricing?.hq || ''}
                                              onChange={e => handlePriceChange(m.model, issue.key, 'hq', e.target.value)}
                                              className="input w-20 text-sm px-2 py-1 border rounded"
                                            />
                                            <input
                                              type="number"
                                              min={1}
                                              placeholder="Warranty (months)"
                                              value={issueState.pricing?.hqWarranty || ''}
                                              onChange={e => handlePriceChange(m.model, issue.key, 'hqWarranty', e.target.value)}
                                              className="input w-20 text-xs px-2 py-1 border rounded"
                                            />
                                            <div className="w-full">
                                              <span className="text-xs text-gray-400 mt-1 block">Enter warranty in months</span>
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex flex-col gap-1 w-full max-w-[180px]">
                                          <span className="font-medium text-sm">Price</span>
                                          <input
                                            type="number"
                                            min={0}
                                            placeholder="Price (₹)"
                                            value={issueState.pricing?.single || ''}
                                            onChange={e => handlePriceChange(m.model, issue.key, 'single', e.target.value)}
                                            className="input w-full text-sm px-2 py-1 border rounded"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          )}
          <DialogFooter className="mt-4 flex justify-between">
            <Button type="button" variant="outline" onClick={() => setModelModalBrand(null)}>Cancel</Button>
            <Button type="button" onClick={handleConfirmModels} disabled={!isModelIssueValid}>Save Selection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex justify-between mt-8">
        <Button type="button" variant="outline" onClick={onPrev}>Previous</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save & Continue'}
        </Button>
      </div>
    </form>
  );
};

export default ServiceSelectionStep; 