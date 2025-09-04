import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Edit, Trash2, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getModelSeries, createServiceOfferedWithSeries } from '@/lib/appwrite-services';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { useAuth } from '@/contexts/AuthContext';

interface SeriesManagementProps {
  providerId: string;
}

interface SeriesData {
  $id: string;
  name: string;
  brand: string;
  device_type: 'phone' | 'laptop';
  description: string;
  models: string[];
}

interface SeriesService {
  $id: string;
  series_id: string;
  issue: string;
  partType: string | null;
  price: number;
  warranty: string | null;
  pricingType: 'series';
}

const SeriesManagement: React.FC<SeriesManagementProps> = ({ providerId }) => {
  const [selectedDevice, setSelectedDevice] = useState<'phone' | 'laptop'>('phone');
  const [brands, setBrands] = useState<string[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [series, setSeries] = useState<SeriesData[]>([]);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<SeriesData | null>(null);
  const [seriesServices, setSeriesServices] = useState<SeriesService[]>([]);
  const [issues, setIssues] = useState<{ $id: string; name: string; type?: string }[]>([]);
  const [tempPricing, setTempPricing] = useState<Record<string, any>>({});
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch available brands
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const allSeries = await getModelSeries();
        const uniqueBrands = Array.from(new Set(allSeries.map(s => s.brand)))
          .filter(Boolean)
          .sort();
        setBrands(uniqueBrands);
        if (uniqueBrands.length > 0 && !selectedBrand) {
          setSelectedBrand(uniqueBrands[0]);
        }
      } catch (error) {
        console.error('Error fetching brands:', error);
      }
    };
    fetchBrands();
  }, []);

  // Fetch series for selected brand and device
  useEffect(() => {
    const fetchSeries = async () => {
      if (!selectedBrand) return;
      try {
        const brandSeries = await getModelSeries(selectedBrand, selectedDevice);
        setSeries(brandSeries);
      } catch (error) {
        console.error('Error fetching series:', error);
        setSeries([]);
      }
    };
    fetchSeries();
  }, [selectedBrand, selectedDevice]);

  // Fetch issues for the selected device
  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const categoriesRes = await databases.listDocuments(
          DATABASE_ID,
          'categories',
          []
        );
        
        const category = categoriesRes.documents.find((c: any) => c.name.toLowerCase() === selectedDevice);
        
        if (!category) {
          setIssues([]);
          return;
        }

        const issuesRes = await databases.listDocuments(
          DATABASE_ID,
          'issues',
          [Query.equal('category_id', category.$id)]
        );
        setIssues(issuesRes.documents.map((i: any) => ({ $id: i.$id, name: i.name, type: i.type })));
      } catch (error) {
        console.error('❌ Error fetching issues:', error);
        setIssues([]);
      }
    };
    fetchIssues();
  }, [selectedDevice]);

  // Fetch existing series services for the provider
  const fetchSeriesServices = async (seriesId: string) => {
    try {
      const servicesRes = await databases.listDocuments(
        DATABASE_ID,
        'services_offered',
        [
          Query.equal('providerId', providerId),
          Query.equal('series_id', seriesId),
          Query.isNull('model')
        ]
      );
      setSeriesServices(servicesRes.documents.map((s: any) => ({
        $id: s.$id,
        series_id: s.series_id,
        issue: s.issue,
        partType: s.partType,
        price: s.price,
        warranty: s.warranty,
        pricingType: 'series' as const
      })));
    } catch (error) {
      console.error('Error fetching series services:', error);
      setSeriesServices([]);
    }
  };

  const handleEditSeries = async (seriesData: SeriesData) => {
    setSelectedSeries(seriesData);
    
    // Fetch issues if not already loaded
    if (issues.length === 0) {
      try {
        const categoriesRes = await databases.listDocuments(
          DATABASE_ID,
          'categories',
          []
        );
        
        const category = categoriesRes.documents.find((c: any) => c.name.toLowerCase() === selectedDevice);
        
        if (category) {
          const issuesRes = await databases.listDocuments(
            DATABASE_ID,
            'issues',
            [Query.equal('category_id', category.$id)]
          );
          setIssues(issuesRes.documents.map((i: any) => ({ $id: i.$id, name: i.name, type: i.type })));
        }
      } catch (error) {
        console.error('❌ Error fetching issues:', error);
      }
    }
    
    await fetchSeriesServices(seriesData.$id);
    
    // Initialize temp pricing with existing services
    const existingPricing: Record<string, any> = {};
    seriesServices.forEach(service => {
      const key = `${service.issue}-${service.partType || 'single'}`;
      existingPricing[key] = {
        price: service.price,
        warranty: service.warranty,
        partType: service.partType
      };
    });
    setTempPricing(existingPricing);
    setEditModalOpen(true);
  };

  const handlePriceChange = (issueId: string, partType: string | null, field: string, value: string) => {
    const key = `${issueId}-${partType || 'single'}`;
    setTempPricing(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  const handleSaveSeriesPricing = async () => {
    if (!selectedSeries || !user) return;

    try {
      const now = new Date().toISOString();
      let savedCount = 0;

      // Save pricing for each issue
      for (const issue of issues) {
        const issueKey = `${issue.$id}-single`;
        const oemKey = `${issue.$id}-OEM`;
        const hqKey = `${issue.$id}-HQ`;

        // Handle screen replacement (OEM and HQ)
        if (issue.type === 'screen') {
          // Save OEM pricing
          if (tempPricing[oemKey]?.price) {
            await createServiceOfferedWithSeries({
              providerId: user.id,
              deviceType: selectedDevice,
              brand: selectedSeries.brand,
              model: null,
              series_id: selectedSeries.$id,
              issue: issue.name,
              partType: 'OEM',
              price: Number(tempPricing[oemKey].price),
              warranty: tempPricing[oemKey].warranty ? `${tempPricing[oemKey].warranty} months` : null,
              created_at: now,
            });
            savedCount++;
          }

          // Save HQ pricing
          if (tempPricing[hqKey]?.price) {
            await createServiceOfferedWithSeries({
              providerId: user.id,
              deviceType: selectedDevice,
              brand: selectedSeries.brand,
              model: null,
              series_id: selectedSeries.$id,
              issue: issue.name,
              partType: 'HQ',
              price: Number(tempPricing[hqKey].price),
              warranty: tempPricing[hqKey].warranty ? `${tempPricing[hqKey].warranty} months` : null,
              created_at: now,
            });
            savedCount++;
          }
        } else {
          // Handle other issues (single price)
          if (tempPricing[issueKey]?.price) {
            await createServiceOfferedWithSeries({
              providerId: user.id,
              deviceType: selectedDevice,
              brand: selectedSeries.brand,
              model: null,
              series_id: selectedSeries.$id,
              issue: issue.name,
              partType: null,
              price: Number(tempPricing[issueKey].price),
              warranty: null,
              created_at: now,
            });
            savedCount++;
          }
        }
      }

      toast({
        title: 'Series Pricing Saved',
        description: `${savedCount} pricing entries saved for ${selectedSeries.name}`,
      });

      setEditModalOpen(false);
      setSelectedSeries(null);
      setTempPricing({});
    } catch (error) {
      console.error('Error saving series pricing:', error);
      toast({
        title: 'Error',
        description: 'Failed to save series pricing. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getExistingPrice = (issueId: string, partType: string | null) => {
    const service = seriesServices.find(s => s.issue === issueId && s.partType === partType);
    return service?.price || 0;
  };

  const getExistingWarranty = (issueId: string, partType: string | null) => {
    const service = seriesServices.find(s => s.issue === issueId && s.partType === partType);
    return service?.warranty ? service.warranty.replace(' months', '') : '';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Series-Based Pricing Management</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-blue-500 cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent>
                  Manage pricing for entire model series instead of individual models.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Device Type Selection */}
            <div>
              <Label>Device Type</Label>
              <Tabs value={selectedDevice} onValueChange={(value) => setSelectedDevice(value as 'phone' | 'laptop')}>
                <TabsList className="w-full">
                  <TabsTrigger value="phone" className="flex-1">Phone</TabsTrigger>
                  <TabsTrigger value="laptop" className="flex-1">Laptop</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Brand Selection */}
            <div>
              <Label>Brand</Label>
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map(brand => (
                    <SelectItem key={brand} value={brand}>
                      {brand.charAt(0).toUpperCase() + brand.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Series List */}
            <div>
              <Label>Available Series</Label>
              {series.length === 0 ? (
                <div className="text-gray-500">No series found. Please select a brand.</div>
              ) : (
                <div className="space-y-2">
                  {series.map(seriesItem => (
                    <Card key={seriesItem.$id} className="border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{seriesItem.name}</h4>
                            <p className="text-sm text-gray-600">
                              {seriesItem.models.length} models • {seriesItem.description}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleEditSeries(seriesItem)}
                            className="ml-4"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Set Pricing
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {series.length === 0 && (
                    <div className="text-gray-500 text-center py-4">
                      No series found for {selectedBrand} {selectedDevice}s
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

            {/* Edit Series Pricing Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Set Pricing for {selectedSeries?.name} Series ({selectedSeries?.models.length} models)
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
                        {/* Series Overview */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Series Models:</h3>
              <div className="flex flex-wrap gap-2">
                {selectedSeries?.models.map((model, index) => (
                  <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-700">
                    {model}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {issues.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No issues found for {selectedDevice} devices.</p>
                  <p className="text-sm mt-2">Please check if issues are configured in the database.</p>
                </div>
              ) : (
                issues.map(issue => (
                  <Collapsible key={issue.$id}>
                    <div className="border rounded-lg p-4">
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between cursor-pointer">
                          <div className="flex items-center gap-2">
                            <ChevronRight className="h-4 w-4" />
                            <span className="font-medium">{issue.name}</span>
                          </div>
                          <Badge variant="outline">
                            {issue.type === 'screen' ? 'Screen Replacement' : 'Other Issue'}
                          </Badge>
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent className="mt-4 space-y-4">
                        {issue.type === 'screen' ? (
                          // Screen replacement with OEM and HQ options
                          <div className="space-y-4 pl-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* OEM Part */}
                              <div className="space-y-2">
                                <Label className="font-medium text-blue-600">OEM Part</Label>
                                <div className="flex gap-2">
                                  <Input
                                    type="number"
                                    placeholder="Price (₹)"
                                    value={tempPricing[`${issue.$id}-OEM`]?.price || getExistingPrice(issue.name, 'OEM') || ''}
                                    onChange={(e) => handlePriceChange(issue.$id, 'OEM', 'price', e.target.value)}
                                    className="flex-1"
                                  />
                                  <Input
                                    type="number"
                                    placeholder="Warranty (months)"
                                    value={tempPricing[`${issue.$id}-OEM`]?.warranty || getExistingWarranty(issue.name, 'OEM') || ''}
                                    onChange={(e) => handlePriceChange(issue.$id, 'OEM', 'warranty', e.target.value)}
                                    className="w-24"
                                  />
                                </div>
                              </div>

                              {/* HQ Part */}
                              <div className="space-y-2">
                                <Label className="font-medium text-green-600">HQ Part</Label>
                                <div className="flex gap-2">
                                  <Input
                                    type="number"
                                    placeholder="Price (₹)"
                                    value={tempPricing[`${issue.$id}-HQ`]?.price || getExistingPrice(issue.name, 'HQ') || ''}
                                    onChange={(e) => handlePriceChange(issue.$id, 'HQ', 'price', e.target.value)}
                                    className="flex-1"
                                  />
                                  <Input
                                    type="number"
                                    placeholder="Warranty (months)"
                                    value={tempPricing[`${issue.$id}-HQ`]?.warranty || getExistingWarranty(issue.name, 'HQ') || ''}
                                    onChange={(e) => handlePriceChange(issue.$id, 'HQ', 'warranty', e.target.value)}
                                    className="w-24"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Other issues with single price
                          <div className="pl-6">
                            <div className="space-y-2">
                              <Label>Price</Label>
                              <Input
                                type="number"
                                placeholder="Price (₹)"
                                value={tempPricing[`${issue.$id}-single`]?.price || getExistingPrice(issue.name, null) || ''}
                                onChange={(e) => handlePriceChange(issue.$id, null, 'price', e.target.value)}
                              />
                            </div>
                          </div>
                        )}
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSeriesPricing}>
              Save Pricing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SeriesManagement; 