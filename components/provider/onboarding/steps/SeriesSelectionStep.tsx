import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { getModelSeries } from '@/lib/appwrite-services';
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

interface SeriesSelectionStepProps {
  data: any;
  setData: (d: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

const SeriesSelectionStep: React.FC<SeriesSelectionStepProps> = ({ data, setData, onNext, onPrev }) => {
  const [selectedDevice, setSelectedDevice] = useState<string>(data.selectedDevice || 'phone');
  const [deviceBrands, setDeviceBrands] = useState<{ [key: string]: string[] }>(data.deviceBrands || { phone: [], laptop: [] });
  const [brands, setBrands] = useState<{ key: string; label: string }[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [seriesModalBrand, setSeriesModalBrand] = useState<string | null>(null);
  const [series, setSeries] = useState<any[]>([]);
  const [loadingSeries, setLoadingSeries] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<Record<string, any>>(data.selectedSeries || { phone: {}, laptop: {} });

  // Add state for fetched issues
  const [issues, setIssues] = useState<{ key: string; label: string; type?: string }[]>([]);

  // Open modal and fetch series for brand
  const openSeriesModal = useCallback(async (brandKey: string) => {
    setSeriesModalBrand(brandKey);
    setLoadingSeries(true);
    try {
      const brandSeries = await getModelSeries(brandKey, selectedDevice as 'phone' | 'laptop');
      setSeries(brandSeries);
    } catch (error) {
      console.error('Error fetching series:', error);
      setSeries([]);
    }
    setLoadingSeries(false);
  }, [selectedDevice]);

  // Temp state for modal selection
  const [tempSeriesIssue, setTempSeriesIssue] = useState<any>({});
  useEffect(() => {
    if (seriesModalBrand) {
      setTempSeriesIssue(selectedSeries[selectedDevice]?.[seriesModalBrand] || {});
    }
  }, [seriesModalBrand, selectedSeries, selectedDevice]);

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

  // Series selection handlers
  const handleSeriesCheck = (seriesId: string, checked: boolean) => {
    setTempSeriesIssue((prev: any) => ({
      ...prev,
      [seriesId]: checked
        ? { selected: true, issues: prev[seriesId]?.issues || {} }
        : undefined,
    }));
  };

  const handleIssueCheck = (seriesId: string, issue: string, checked: boolean) => {
    setTempSeriesIssue((prev: any) => ({
      ...prev,
      [seriesId]: {
        ...prev[seriesId],
        issues: {
          ...prev[seriesId]?.issues,
          [issue]: {
            ...prev[seriesId]?.issues?.[issue],
            selected: checked,
          },
        },
      },
    }));
  };

  const handlePriceChange = (seriesId: string, issue: string, type: 'oem' | 'hq' | 'single' | 'oemWarranty' | 'hqWarranty', value: string) => {
    setTempSeriesIssue((prev: any) => ({
      ...prev,
      [seriesId]: {
        ...prev[seriesId],
        issues: {
          ...prev[seriesId]?.issues,
          [issue]: {
            ...prev[seriesId]?.issues?.[issue],
            pricing: {
              ...prev[seriesId]?.issues?.[issue]?.pricing,
              [type]: value,
            },
          },
        },
      },
    }));
  };

  // Select all/clear all series
  const handleSelectAllSeries = () => {
    const all = Object.fromEntries(series.map(s => [s.$id, { selected: true, issues: tempSeriesIssue[s.$id]?.issues || {} }]));
    setTempSeriesIssue(all);
  };

  const handleClearAllSeries = () => setTempSeriesIssue({});

  // Select all/clear all issues for a series
  const handleSelectAllIssues = (seriesId: string) => {
    setTempSeriesIssue((prev: any) => ({
      ...prev,
      [seriesId]: {
        ...prev[seriesId],
        issues: Object.fromEntries(issues.map(issue => [issue.key, { selected: true, pricing: prev[seriesId]?.issues?.[issue.key]?.pricing || {} }]))
      },
    }));
  };

  const handleClearAllIssues = (seriesId: string) => {
    setTempSeriesIssue((prev: any) => ({
      ...prev,
      [seriesId]: {
        ...prev[seriesId],
        issues: {},
      },
    }));
  };

  // Confirm/save selection
  const handleConfirmSeries = () => {
    setSelectedSeries((prev: any) => ({
      ...prev,
      [selectedDevice]: {
        ...prev[selectedDevice],
        [seriesModalBrand!]: tempSeriesIssue
      }
    }));
    setSeriesModalBrand(null);
  };

  // Validation: require price for every selected issue
  const isSeriesIssueValid = Object.values(tempSeriesIssue).every((s: any) =>
    !s.selected || Object.entries(s.issues || {}).every(([issue, val]: any) => {
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

  useEffect(() => {
    setData({ ...data, selectedDevice, deviceBrands, selectedSeries });
    // eslint-disable-next-line
  }, [selectedDevice, deviceBrands, selectedSeries]);

  useEffect(() => {
    let isMounted = true;
    setLoadingBrands(true);
    const fetchBrands = async () => {
      try {
        const allSeries = await getModelSeries();
        if (!isMounted) return;
        const uniqueBrands = Array.from(new Set(allSeries.map((s: any) => s.brand)))
          .filter(Boolean)
          .map((b: string) => ({ key: b, label: b.charAt(0).toUpperCase() + b.slice(1) }));
        setBrands(uniqueBrands);
      } catch (error) {
        console.error('Error fetching brands:', error);
        setBrands([]);
      }
      setLoadingBrands(false);
    };
    fetchBrands();
    return () => { isMounted = false; };
  }, []);

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
      // Store series selection data
      onboarding_data = {
        ...onboarding_data,
        seriesSelection: {
          phone: {
            brands: deviceBrands.phone || [],
            selectedSeries: selectedSeries.phone || {},
          },
          laptop: {
            brands: deviceBrands.laptop || [],
            selectedSeries: selectedSeries.laptop || {},
          },
        },
      };
      await upsertBusinessSetup({
        user_id: user.id,
        onboarding_data,
      });
      
      toast({ title: 'Series selection saved', description: 'Your series selection has been saved successfully.' });
      onNext();
    } catch (err: any) {
      toast({ title: 'Error', description: 'Failed to save series selection. Please try again.', variant: 'destructive' });
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
                  <Button type="button" size="sm" variant="outline" className="mt-1 w-full" onClick={() => openSeriesModal(brand.key)}>
                    Edit Series
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Series Selection Modal */}
      <Dialog open={!!seriesModalBrand} onOpenChange={open => { if (!open) setSeriesModalBrand(null); }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Select Series & Set Pricing — {seriesModalBrand && brands.find(b => b.key === seriesModalBrand)?.label}</DialogTitle>
          </DialogHeader>
          {loadingSeries ? (
            <div className="flex items-center gap-2 text-gray-500"><Loader2 className="animate-spin h-5 w-5" /> Loading series...</div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="flex gap-2 mb-4">
                <Button type="button" size="sm" variant="outline" onClick={handleSelectAllSeries} disabled={series.length === 0}>Select All Series</Button>
                <Button type="button" size="sm" variant="outline" onClick={handleClearAllSeries} disabled={series.length === 0}>Clear All</Button>
              </div>
              {series.map(seriesItem => {
                const seriesState = tempSeriesIssue[seriesItem.$id] || {};
                return (
                  <Collapsible key={seriesItem.$id} open={!!seriesState.open} onOpenChange={open => setTempSeriesIssue((prev: any) => ({ ...prev, [seriesItem.$id]: { ...prev[seriesItem.$id], open } }))}>
                    <div className="border rounded-lg p-3 bg-gray-50 hover:bg-primary/10 transition flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={!!seriesState.selected}
                          onCheckedChange={checked => handleSeriesCheck(seriesItem.$id, !!checked)}
                        />
                        <span className="font-medium text-base flex-1">{seriesItem.name}</span>
                        <span className="text-sm text-gray-500">({seriesItem.models.length} models)</span>
                        <CollapsibleTrigger asChild>
                          <Button type="button" size="sm" variant="ghost">{seriesState.open ? 'Hide Issues' : 'Show Issues'}</Button>
                        </CollapsibleTrigger>
                      </div>
                      <CollapsibleContent>
                        <div className="pl-6 pt-2">
                          <div className="flex gap-2 mb-2">
                            <Button type="button" size="sm" variant="outline" onClick={() => handleSelectAllIssues(seriesItem.$id)}>Select All Issues</Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => handleClearAllIssues(seriesItem.$id)}>Clear All</Button>
                          </div>
                          <div className="space-y-3">
                            {issues.map(issue => {
                              const issueState = seriesState.issues?.[issue.key] || {};
                              return (
                                <div key={issue.key} className="flex flex-col md:flex-row md:items-center gap-4 border-b pb-2 last:border-b-0">
                                  <label className="flex items-center gap-2 min-w-[180px]">
                                    <Checkbox
                                      checked={!!issueState.selected}
                                      onCheckedChange={checked => handleIssueCheck(seriesItem.$id, issue.key, !!checked)}
                                    />
                                    <span>{issue.label}</span>
                                    {issue.type === 'screen' && (
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Info className="h-4 w-4 text-blue-500 cursor-pointer" />
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            Only screen replacement allows OEM/HQ part selection and warranty.
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
                                              onChange={e => handlePriceChange(seriesItem.$id, issue.key, 'oem', e.target.value)}
                                              className="input w-20 text-sm px-2 py-1 border rounded"
                                            />
                                            <input
                                              type="number"
                                              min={1}
                                              placeholder="Warranty (months)"
                                              value={issueState.pricing?.oemWarranty || ''}
                                              onChange={e => handlePriceChange(seriesItem.$id, issue.key, 'oemWarranty', e.target.value)}
                                              className="input w-20 text-xs px-2 py-1 border rounded"
                                            />
                                          </div>
                                          <div className="flex flex-wrap items-center gap-2 w-full">
                                            <span className="font-medium text-sm min-w-[110px]">HQ Part</span>
                                            <input
                                              type="number"
                                              min={0}
                                              placeholder="Price (₹)"
                                              value={issueState.pricing?.hq || ''}
                                              onChange={e => handlePriceChange(seriesItem.$id, issue.key, 'hq', e.target.value)}
                                              className="input w-20 text-sm px-2 py-1 border rounded"
                                            />
                                            <input
                                              type="number"
                                              min={1}
                                              placeholder="Warranty (months)"
                                              value={issueState.pricing?.hqWarranty || ''}
                                              onChange={e => handlePriceChange(seriesItem.$id, issue.key, 'hqWarranty', e.target.value)}
                                              className="input w-20 text-xs px-2 py-1 border rounded"
                                            />
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
                                            onChange={e => handlePriceChange(seriesItem.$id, issue.key, 'single', e.target.value)}
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
            <Button type="button" variant="outline" onClick={() => setSeriesModalBrand(null)}>Cancel</Button>
            <Button type="button" onClick={handleConfirmSeries} disabled={!isSeriesIssueValid}>Save Selection</Button>
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

export default SeriesSelectionStep; 