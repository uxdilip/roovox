import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Plus, Minus, DollarSign, Percent } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getModelSeries, createServiceOfferedWithSeries, updateServiceOfferedWithSeries, findExistingService } from '@/lib/appwrite-services';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';
import { useAuth } from '@/contexts/AuthContext';

interface BulkSeriesEditProps {
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

interface BulkEditRule {
  id: string;
  type: 'fixed' | 'percentage';
  value: number;
  operation: 'add' | 'subtract' | 'set';
  issue: string;
  partType: string | null;
}

const BulkSeriesEdit: React.FC<BulkSeriesEditProps> = ({ providerId }) => {
  const [selectedDevice, setSelectedDevice] = useState<'phone' | 'laptop'>('phone');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [brands, setBrands] = useState<string[]>([]);
  const [series, setSeries] = useState<SeriesData[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<string[]>([]);
  const [issues, setIssues] = useState<{ $id: string; name: string; type?: string }[]>([]);
  const [bulkRules, setBulkRules] = useState<BulkEditRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
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
      setLoading(true);
      try {
        const brandSeries = await getModelSeries(selectedBrand, selectedDevice);
        setSeries(brandSeries);
        setSelectedSeries([]); // Reset selection when brand/device changes
      } catch (error) {
        console.error('Error fetching series:', error);
        setSeries([]);
      }
      setLoading(false);
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
        if (!category) return;

        const issuesRes = await databases.listDocuments(
          DATABASE_ID,
          'issues',
          [Query.equal('category_id', category.$id)]
        );
        setIssues(issuesRes.documents.map((i: any) => ({ $id: i.$id, name: i.name, type: i.type })));
      } catch (error) {
        console.error('Error fetching issues:', error);
        setIssues([]);
      }
    };
    fetchIssues();
  }, [selectedDevice]);

  const handleSeriesToggle = (seriesId: string) => {
    setSelectedSeries(prev => 
      prev.includes(seriesId) 
        ? prev.filter(id => id !== seriesId)
        : [...prev, seriesId]
    );
  };

  const handleSelectAllSeries = () => {
    setSelectedSeries(series.map(s => s.$id));
  };

  const handleClearAllSeries = () => {
    setSelectedSeries([]);
  };

  const addBulkRule = () => {
    if (issues.length === 0) {
      toast({
        title: 'No Issues Available',
        description: 'Please wait for issues to load or select a different device type.',
        variant: 'destructive',
      });
      return;
    }
    
    const newRule: BulkEditRule = {
      id: Date.now().toString(),
      type: 'fixed',
      value: 0,
      operation: 'add',
      issue: issues[0].name,
      partType: null,
    };
    setBulkRules([...bulkRules, newRule]);
  };

  const removeBulkRule = (ruleId: string) => {
    setBulkRules(bulkRules.filter(rule => rule.id !== ruleId));
  };

  const updateBulkRule = (ruleId: string, field: keyof BulkEditRule, value: any) => {
    setBulkRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, [field]: value } : rule
    ));
  };

  const calculateNewPrice = (currentPrice: number, rule: BulkEditRule): number => {
    switch (rule.operation) {
      case 'add':
        return rule.type === 'fixed' ? currentPrice + rule.value : currentPrice * (1 + rule.value / 100);
      case 'subtract':
        return rule.type === 'fixed' ? currentPrice - rule.value : currentPrice * (1 - rule.value / 100);
      case 'set':
        return rule.type === 'fixed' ? rule.value : currentPrice * (rule.value / 100);
      default:
        return currentPrice;
    }
  };

  const generatePreview = async () => {
    if (selectedSeries.length === 0 || bulkRules.length === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select series and add bulk edit rules.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const preview: any[] = [];

      for (const seriesId of selectedSeries) {
        const seriesData = series.find(s => s.$id === seriesId);
        if (!seriesData) continue;

        // Fetch existing services for this series
        const servicesRes = await databases.listDocuments(
          DATABASE_ID,
          'services_offered',
          [
            Query.equal('providerId', providerId),
            Query.equal('series_id', seriesId),
            Query.isNull('model')
          ]
        );

        const existingServices = servicesRes.documents;

        for (const rule of bulkRules) {
          if (!rule.issue) continue;

          const existingService = existingServices.find(s => 
            s.issue === rule.issue && s.partType === rule.partType
          );

          const currentPrice = existingService?.price || 0;
          const newPrice = calculateNewPrice(currentPrice, rule);

          preview.push({
            seriesName: seriesData.name,
            seriesId: seriesData.$id,
            issue: rule.issue,
            partType: rule.partType,
            currentPrice,
            newPrice,
            change: newPrice - currentPrice,
            changePercent: currentPrice > 0 ? ((newPrice - currentPrice) / currentPrice) * 100 : 0,
            rule
          });
        }
      }

      setPreviewData(preview);
      setPreviewModalOpen(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate preview. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const applyBulkEdit = async () => {
    if (previewData.length === 0 || !user) return;

    setLoading(true);
    try {
      const now = new Date().toISOString();
      let appliedCount = 0;
      let updatedCount = 0;
      let createdCount = 0;

      for (const item of previewData) {
        if (item.newPrice <= 0) continue; // Skip invalid prices

        // Check if service already exists
        const existingService = await findExistingService(
          user.id,
          item.seriesId,
          item.issue,
          item.partType
        );

        if (existingService) {
          // Update existing service
          await updateServiceOfferedWithSeries(existingService.$id, {
            price: item.newPrice,
          });
          updatedCount++;
        } else {
          // Create new service
          await createServiceOfferedWithSeries({
            providerId: user.id,
            deviceType: selectedDevice,
            brand: selectedBrand,
            model: null,
            series_id: item.seriesId,
            issue: item.issue,
            partType: item.partType,
            price: item.newPrice,
            warranty: null,
            created_at: now,
          });
          createdCount++;
        }
        appliedCount++;
      }

      toast({
        title: 'Bulk Edit Applied',
        description: `${appliedCount} pricing entries processed (${updatedCount} updated, ${createdCount} created) across ${selectedSeries.length} series.`,
      });

      setPreviewModalOpen(false);
      setPreviewData([]);
      setBulkRules([]);
      setSelectedSeries([]);
    } catch (error) {
      console.error('Error applying bulk edit:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply bulk edit. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Bulk Series Pricing Edit</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-blue-500 cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent>
                  Apply pricing changes across multiple series at once.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Device and Brand Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Device Type</Label>
              <Select value={selectedDevice} onValueChange={(value) => setSelectedDevice(value as 'phone' | 'laptop')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="laptop">Laptop</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
          </div>

          {/* Series Selection */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label>Select Series ({selectedSeries.length} selected)</Label>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleSelectAllSeries}>
                  Select All
                </Button>
                <Button size="sm" variant="outline" onClick={handleClearAllSeries}>
                  Clear All
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {series.map(seriesItem => (
                <div key={seriesItem.$id} className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedSeries.includes(seriesItem.$id)}
                    onCheckedChange={() => handleSeriesToggle(seriesItem.$id)}
                  />
                  <Label className="text-sm cursor-pointer">
                    {seriesItem.name} ({seriesItem.models.length} models)
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Bulk Edit Rules */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <Label>Bulk Edit Rules</Label>
              <Button size="sm" onClick={addBulkRule}>
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </div>
            <div className="space-y-4">
              {bulkRules.map(rule => (
                <Card key={rule.id} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label>Issue</Label>
                      <Select value={rule.issue} onValueChange={(value) => updateBulkRule(rule.id, 'issue', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select issue" />
                        </SelectTrigger>
                        <SelectContent>
                          {issues.map(issue => (
                            <SelectItem key={issue.$id} value={issue.name}>
                              {issue.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Part Type</Label>
                      <Select value={rule.partType || 'all'} onValueChange={(value) => updateBulkRule(rule.id, 'partType', value === 'all' ? null : value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="All parts" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All parts</SelectItem>
                          <SelectItem value="OEM">OEM</SelectItem>
                          <SelectItem value="HQ">HQ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Operation</Label>
                      <Select value={rule.operation} onValueChange={(value) => updateBulkRule(rule.id, 'operation', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="add">Add</SelectItem>
                          <SelectItem value="subtract">Subtract</SelectItem>
                          <SelectItem value="set">Set to</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Value</Label>
                      <div className="flex gap-2">
                        <Select value={rule.type} onValueChange={(value) => updateBulkRule(rule.id, 'type', value)}>
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed">₹</SelectItem>
                            <SelectItem value="percentage">%</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          value={rule.value}
                          onChange={(e) => updateBulkRule(rule.id, 'value', Number(e.target.value))}
                          placeholder="0"
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeBulkRule(rule.id)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Preview and Apply */}
          <div className="flex justify-end">
            <Button onClick={generatePreview} disabled={loading || selectedSeries.length === 0 || bulkRules.length === 0}>
              {loading ? 'Generating Preview...' : 'Preview Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview Bulk Changes</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              {previewData.length} changes will be applied across {selectedSeries.length} series.
            </div>
            
            <div className="space-y-2">
              {previewData.map((item, index) => (
                <Card key={index} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{item.seriesName}</div>
                      <div className="text-sm text-gray-600">
                        {item.issue} {item.partType && `(${item.partType})`}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">₹{item.currentPrice}</span>
                        <span className="text-gray-400">→</span>
                        <span className={`font-semibold ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{item.newPrice}
                        </span>
                      </div>
                      <div className={`text-xs ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.change >= 0 ? '+' : ''}₹{item.change} ({item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyBulkEdit} disabled={loading}>
              {loading ? 'Applying Changes...' : 'Apply Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BulkSeriesEdit; 