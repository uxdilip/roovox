"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  findProviderServicesWithSeries, 
  findProviderServicesWithCustomSeries,
  updateServiceOfferedWithSeries,
  createServiceOfferedWithSeries,
  findExistingService,
  getCustomSeriesServices,
  updateCustomSeriesService,
  createCustomSeriesService
} from "@/lib/appwrite-services";

interface SeriesBulkUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string;
  seriesId: string;
  seriesData: any;
  onSuccess: () => void;
}

interface PricingRule {
  issue: string;
  partType: string;
  price: number;
  warranty: number;
}

export default function SeriesBulkUpdateModal({
  open,
  onOpenChange,
  providerId,
  seriesId,
  seriesData,
  onSuccess
}: SeriesBulkUpdateModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentServices, setCurrentServices] = useState<any[]>([]);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [issues, setIssues] = useState<any[]>([]);

  const isCustomSeries = seriesId.startsWith('custom_') || seriesData?.isCustom;
  const isIndividualServices = seriesId === 'individual';

  // Load current services and issues when modal opens
  useEffect(() => {
    if (open && seriesId) {
      loadCurrentServices();
      loadIssues();
    }
  }, [open, seriesId]);

  const loadCurrentServices = async () => {
    try {
      let services;
      if (isIndividualServices) {
        // For individual services, fetch services without series_id
        const { databases, DATABASE_ID } = await import('@/lib/appwrite');
        const { Query } = await import('appwrite');
        
        const response = await databases.listDocuments(
          DATABASE_ID,
          'services_offered',
          [
            Query.equal('providerId', providerId),
            Query.isNull('series_id')
          ]
        );
        services = response.documents;
      } else if (isCustomSeries) {
        // For custom series, services are stored in custom_series_services collection
        const { databases, DATABASE_ID } = await import('@/lib/appwrite');
        const { Query } = await import('appwrite');
        
        const response = await databases.listDocuments(
          DATABASE_ID,
          'custom_series_services',
          [
            Query.equal('providerId', providerId),
            Query.equal('customSeriesId', seriesId)
          ]
        );
        services = response.documents;
      } else {
        // For platform series, we need to get services by series_id
        const { databases, DATABASE_ID } = await import('@/lib/appwrite');
        const { Query } = await import('appwrite');
        
        const response = await databases.listDocuments(
          DATABASE_ID,
          'services_offered',
          [
            Query.equal('providerId', providerId),
            Query.equal('series_id', seriesId)
          ]
        );
        services = response.documents;
      }
      
      console.log('Loaded services:', services);
      setCurrentServices(services);
      
      // Initialize pricing rules from current services
      const rules: PricingRule[] = [];
      const seenIssues = new Set<string>();
      
      services.forEach(service => {
        const key = `${service.issue}-${service.partType}`;
        if (!seenIssues.has(key)) {
          seenIssues.add(key);
          rules.push({
            issue: service.issue,
            partType: service.partType,
            price: service.price || 0,
            warranty: parseInt(service.warranty?.replace(' months', '') || '0')
          });
        }
      });
      
      console.log('Generated pricing rules:', rules);
      setPricingRules(rules);
    } catch (error) {
      console.error('Error loading current services:', error);
      toast({
        title: "Error",
        description: "Failed to load current services",
        variant: "destructive",
      });
    }
  };

  const loadIssues = async () => {
    try {
      const { databases, DATABASE_ID } = await import('@/lib/appwrite');
      const { Query } = await import('appwrite');
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        'issues',
        [Query.limit(100)]
      );
      setIssues(response.documents);
    } catch (error) {
      console.error('Error loading issues:', error);
    }
  };

  const updatePricingRule = (index: number, field: keyof PricingRule, value: number | string) => {
    const newRules = [...pricingRules];
    newRules[index] = { ...newRules[index], [field]: value };
    setPricingRules(newRules);
  };

  const addPricingRule = () => {
    if (issues.length > 0) {
      setPricingRules([
        ...pricingRules,
        {
          issue: issues[0].name,
          partType: 'OEM',
          price: 0,
          warranty: 6
        }
      ]);
    }
  };

  const removePricingRule = (index: number) => {
    setPricingRules(pricingRules.filter((_, i) => i !== index));
  };

  const applyBulkUpdate = async () => {
    if (pricingRules.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one pricing rule",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (isIndividualServices) {
        // For individual services, update each service directly
        for (const rule of pricingRules) {
          // Find all services that match this issue and partType
          const matchingServices = currentServices.filter(service => 
            service.issue === rule.issue && service.partType === rule.partType
          );
          
          // Update each matching service
          for (const service of matchingServices) {
            const { databases, DATABASE_ID } = await import('@/lib/appwrite');
            
            await databases.updateDocument(
              DATABASE_ID,
              'services_offered',
              service.$id,
              {
                price: rule.price,
                warranty: rule.warranty > 0 ? `${rule.warranty} months` : null
              }
            );
          }
        }
      } else {
        // Get all models in this series
        let models: string[] = [];
        if (isCustomSeries && seriesData.models) {
          // For custom series, models are stored as "brand:model" strings
          models = seriesData.models;
        } else if (seriesData.models) {
          // For platform series, we need to get the actual model names
          // This is a simplified approach - in reality you might need to fetch from phones/laptops collection
          models = seriesData.models;
        }

        // Apply each pricing rule to all models in the series
        for (const rule of pricingRules) {
          for (const modelString of models) {
            let brand, model;
            
            if (isCustomSeries) {
              [brand, model] = modelString.split(':');
            } else {
              // For platform series, we need to extract brand and model
              // This is simplified - you might need to fetch from database
              brand = seriesData.brand || 'Unknown';
              model = modelString;
            }

          if (isCustomSeries) {
            // For custom series, use the custom series service functions
            const existingServices = await getCustomSeriesServices(seriesId);
            const existingService = existingServices.find(service => 
              service.issue === rule.issue && service.partType === rule.partType
            );

            if (existingService) {
              await updateCustomSeriesService(existingService.$id, {
                price: rule.price,
                warranty: rule.warranty > 0 ? `${rule.warranty} months` : null
              });
            } else {
              await createCustomSeriesService({
                customSeriesId: seriesId,
                providerId: providerId,
                issue: rule.issue,
                partType: rule.partType,
                price: rule.price,
                warranty: rule.warranty > 0 ? `${rule.warranty} months` : null
              });
            }
          } else {
            // For platform series, use the series-based functions
            const existingService = await findExistingService(
              providerId,
              seriesId,
              rule.issue,
              rule.partType
            );

            const serviceData = {
              providerId,
              deviceType: seriesData.deviceType || 'phone',
              brand,
              model,
              issue: rule.issue,
              partType: rule.partType,
              price: rule.price,
              warranty: rule.warranty > 0 ? `${rule.warranty} months` : null,
              seriesId: seriesId,
              created_at: new Date().toISOString()
            };

            if (existingService) {
              await updateServiceOfferedWithSeries(existingService.$id, {
                price: rule.price,
                warranty: rule.warranty > 0 ? `${rule.warranty} months` : null
              });
            } else {
              await createServiceOfferedWithSeries(serviceData);
            }
          }
        }
      }
      }

      toast({
        title: "Success",
        description: `Updated pricing for ${isIndividualServices ? 'individual services' : seriesData.name} series`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error applying bulk update:', error);
      toast({
        title: "Error",
        description: "Failed to apply bulk update",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!seriesData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Update: {isIndividualServices ? 'Individual Services' : seriesData.name}
          </DialogTitle>
          <p className="text-sm text-gray-600">
            {isIndividualServices 
              ? 'Change prices for individual services'
              : 'Change prices for all models in this series'
            }
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Series Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {isIndividualServices ? 'Services Information' : 'Series Information'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">
                    {isIndividualServices ? 'Services Type' : 'Series Name'}
                  </Label>
                  <p className="text-sm text-gray-600">
                    {isIndividualServices ? 'Individual Services' : seriesData.name}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <Badge variant={isIndividualServices ? "outline" : isCustomSeries ? "outline" : "secondary"}>
                    {isIndividualServices ? "Individual" : isCustomSeries ? "Custom Series" : "Platform Series"}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium">
                    {isIndividualServices ? 'Services Count' : 'Models'}
                  </Label>
                  <p className="text-sm text-gray-600">
                    {isIndividualServices 
                      ? `${currentServices.length} individual services`
                      : isCustomSeries && seriesData.models 
                        ? seriesData.models.map((m: string) => {
                            const [brand, model] = m.split(':');
                            return `${brand} ${model}`;
                          }).join(', ')
                        : seriesData.models?.join(', ') || 'No models'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

                    {/* Services Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Services Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              {pricingRules.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No pricing set for this series yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {pricingRules.map((rule, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{rule.issue}</div>
                        <div className="text-xs text-gray-500">{rule.partType === 'OEM' ? 'Original Parts' : rule.partType === 'HQ' ? 'High Quality' : 'All Parts'}</div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div>
                          <Label className="text-xs text-gray-600">Price (₹)</Label>
                          <Input
                            type="number"
                            value={rule.price}
                            onChange={(e) => updatePricingRule(index, 'price', Number(e.target.value))}
                            className="w-20 h-8 text-sm"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-xs text-gray-600">Warranty</Label>
                          <Input
                            type="number"
                            value={rule.warranty}
                            onChange={(e) => updatePricingRule(index, 'warranty', Number(e.target.value))}
                            className="w-16 h-8 text-sm"
                            placeholder="0"
                          />
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removePricingRule(index)}
                          className="h-8 w-8 p-0"
                        >
                          ×
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>


        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={applyBulkUpdate} disabled={loading}>
            {loading ? 'Updating...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 