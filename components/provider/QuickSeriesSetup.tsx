'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { createServiceOfferedWithSeries } from '@/lib/appwrite-services';
import { getModelSeries } from '@/lib/appwrite-services';
import { databases, DATABASE_ID } from '@/lib/appwrite';
import { Query } from 'appwrite';

interface QuickSeriesSetupProps {
  providerId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface SeriesData {
  $id: string;
  name: string;
  brand: string;
  device_type: 'phone' | 'laptop';
  description: string;
  models: string[];
}

interface IssueData {
  $id: string;
  name: string;
  type?: string;
}

export default function QuickSeriesSetup({ providerId, onSuccess, onCancel }: QuickSeriesSetupProps) {
  const { toast } = useToast();
  const [selectedSeries, setSelectedSeries] = useState<SeriesData | null>(null);
  const [issues, setIssues] = useState<IssueData[]>([]);
  const [pricing, setPricing] = useState<Record<string, { price: number; warranty: string }>>({});
  const [loading, setLoading] = useState(false);
  const [loadingIssues, setLoadingIssues] = useState(false);

  // Popular series data
  const popularSeries = [
    { name: 'iPhone 14 Series', brand: 'Apple', deviceType: 'phone' as const, emoji: '📱' },
    { name: 'iPhone 15 Series', brand: 'Apple', deviceType: 'phone' as const, emoji: '📱' },
    { name: 'Samsung Galaxy S23 Series', brand: 'Samsung', deviceType: 'phone' as const, emoji: '📱' },
    { name: 'Samsung Galaxy S24 Series', brand: 'Samsung', deviceType: 'phone' as const, emoji: '📱' },
    { name: 'MacBook Air Series', brand: 'Apple', deviceType: 'laptop' as const, emoji: '💻' },
    { name: 'MacBook Pro Series', brand: 'Apple', deviceType: 'laptop' as const, emoji: '💻' },
  ];

  const handleSeriesSelect = async (seriesName: string, brand: string, deviceType: 'phone' | 'laptop') => {
    setLoadingIssues(true);
    try {
      // Find the actual series data
      const allSeries = await getModelSeries();
      const series = allSeries.find(s => s.name === seriesName && s.brand === brand && s.device_type === deviceType);
      
      if (!series) {
        toast({
          title: "Series not found",
          description: "This series is not available in the database.",
          variant: "destructive",
        });
        return;
      }

      setSelectedSeries(series);

      // Load issues for the device type
      const categoriesRes = await databases.listDocuments(
        DATABASE_ID,
        'categories',
        []
      );
      
      const category = categoriesRes.documents.find((c: any) => c.name.toLowerCase() === deviceType);
      if (!category) {
        setIssues([]);
        setLoadingIssues(false);
        return;
      }

      const issuesRes = await databases.listDocuments(
        DATABASE_ID,
        'issues',
        [Query.equal("category_id", category.$id)]
      );

      const mappedIssues = issuesRes.documents.map(doc => ({
        $id: doc.$id,
        name: doc.name || '',
        type: doc.type || ''
      }));
      
      setIssues(mappedIssues);
      
      // Initialize pricing for all issues
      const initialPricing: Record<string, { price: number; warranty: string }> = {};
      mappedIssues.forEach((issue: IssueData) => {
        initialPricing[issue.$id] = { price: 0, warranty: '6 months' };
      });
      setPricing(initialPricing);

    } catch (error) {
      console.error('Error loading series data:', error);
      toast({
        title: "Error",
        description: "Failed to load series data.",
        variant: "destructive",
      });
    } finally {
      setLoadingIssues(false);
    }
  };

  const handlePriceChange = (issueId: string, field: 'price' | 'warranty', value: string | number) => {
    setPricing(prev => ({
      ...prev,
      [issueId]: {
        ...prev[issueId],
        [field]: field === 'price' ? Number(value) : value
      }
    }));
  };

  const handleCreateSeriesPricing = async () => {
    if (!selectedSeries) return;

    setLoading(true);
    try {
      const promises = issues.map(async (issue) => {
        const issuePricing = pricing[issue.$id];
        if (!issuePricing || issuePricing.price <= 0) return;

        const isScreen = issue.type === 'screen';
        
        if (isScreen) {
          // Create both OEM and HQ pricing for screen issues
          await createServiceOfferedWithSeries({
            providerId,
            series_id: selectedSeries.$id,
            issue: issue.$id,
            partType: 'OEM',
            price: issuePricing.price,
            warranty: issuePricing.warranty
          });

          await createServiceOfferedWithSeries({
            providerId,
            series_id: selectedSeries.$id,
            issue: issue.$id,
            partType: 'HQ',
            price: Math.round(issuePricing.price * 0.8), // 20% less for HQ
            warranty: '3 months'
          });
        } else {
          // Create single pricing for non-screen issues
          await createServiceOfferedWithSeries({
            providerId,
            series_id: selectedSeries.$id,
            issue: issue.$id,
            partType: null,
            price: issuePricing.price,
            warranty: issuePricing.warranty
          });
        }
      });

      await Promise.all(promises);

      toast({
        title: "Success!",
        description: `Pricing set up for ${selectedSeries.name}`,
      });

      onSuccess?.();
    } catch (error) {
      console.error('Error creating series pricing:', error);
      toast({
        title: "Error",
        description: "Failed to create series pricing.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (selectedSeries) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{selectedSeries.name}</h2>
            <p className="text-sm text-muted-foreground">
              {selectedSeries.models.length} models • {selectedSeries.description}
            </p>
          </div>
          <Button variant="outline" onClick={() => setSelectedSeries(null)}>
            Back to Series Selection
          </Button>
        </div>

        {loadingIssues ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground">Loading issues...</div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Set Pricing for Issues</h3>
            <div className="grid gap-4">
              {issues.map((issue) => {
                const issuePricing = pricing[issue.$id];
                const isScreen = issue.type === 'screen';
                
                return (
                  <Card key={issue.$id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{issue.name}</h4>
                        {isScreen && (
                          <Badge variant="secondary" className="text-xs">
                            Screen Replacement (OEM + HQ)
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`price-${issue.$id}`}>Price (₹)</Label>
                        <Input
                          id={`price-${issue.$id}`}
                          type="number"
                          value={issuePricing?.price || 0}
                          onChange={(e) => handlePriceChange(issue.$id, 'price', e.target.value)}
                          placeholder="Enter price"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`warranty-${issue.$id}`}>Warranty</Label>
                        <Select
                          value={issuePricing?.warranty || '6 months'}
                          onValueChange={(value) => handlePriceChange(issue.$id, 'warranty', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3 months">3 months</SelectItem>
                            <SelectItem value="6 months">6 months</SelectItem>
                            <SelectItem value="12 months">12 months</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {isScreen && issuePricing?.price && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700">
                          <strong>Auto-generated HQ pricing:</strong> ₹{Math.round(issuePricing.price * 0.8)} (3 months warranty)
                        </p>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleCreateSeriesPricing}
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Creating..." : `Create Pricing for ${selectedSeries.name}`}
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Quick Series Setup</h2>
        <p className="text-muted-foreground">Select a popular series to quickly set up pricing</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {popularSeries.map((series) => (
          <Card 
            key={series.name}
            className="p-4 border-2 border-dashed border-blue-200 hover:border-blue-300 cursor-pointer transition-colors"
            onClick={() => handleSeriesSelect(series.name, series.brand, series.deviceType)}
          >
            <div className="text-center space-y-2">
              <div className="text-2xl">{series.emoji}</div>
              <h3 className="font-semibold text-blue-600">{series.name}</h3>
              <p className="text-sm text-gray-600">{series.brand} • {series.deviceType}</p>
              <Button size="sm" variant="outline" className="mt-2">
                Setup {series.name}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">More series coming soon...</p>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
} 