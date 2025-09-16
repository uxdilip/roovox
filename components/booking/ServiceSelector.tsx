"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { Device, Service, PartQuality } from '@/types';
import { getIssuesByCategory } from '@/lib/appwrite-services';
import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface ServiceSelectorProps {
  device: Device;
  onServiceSelect: (services: Service[], partQualities: PartQuality[], selectedIssues: { id: string; partType?: string }[]) => void;
  onBack: () => void;
}

export function ServiceSelector({ device, onServiceSelect, onBack }: ServiceSelectorProps) {
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [selectedQuality, setSelectedQuality] = useState<string>('oem');
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPartDialog, setShowPartDialog] = useState(false);
  const [pendingQualityIssue, setPendingQualityIssue] = useState<string | null>(null);
  const [issueQualities, setIssueQualities] = useState<Record<string, 'oem' | 'hq'>>({});

  useEffect(() => {
    let categoryName = device.category === 'phone' ? 'Phone' : 'Laptop';
    const fetchIssues = async () => {
      setLoading(true);
      try {
        console.log('🔍 Fetching issues for category:', categoryName);
        const res = await databases.listDocuments(
          DATABASE_ID,
          'categories',
          []
        );
        console.log('🔍 Categories found:', res.documents.length);
        const categories = res.documents;
        const category = categories.find((c: any) => c.name.toLowerCase() === categoryName.toLowerCase());
        console.log('🔍 Found category:', category);
        if (!category) {
          console.log('❌ No category found for:', categoryName);
          setIssues([]);
          setLoading(false);
          return;
        }
        console.log('🔍 Fetching issues for category ID:', category.$id);
        const fetchedIssues = await getIssuesByCategory(category.$id);
        console.log('🔍 Issues fetched:', fetchedIssues.length, fetchedIssues);
        setIssues(fetchedIssues);
      } catch (error) {
        console.error('❌ Error fetching issues:', error);
        setIssues([]);
      } finally {
        setLoading(false);
      }
    };
    fetchIssues();
  }, [device.category]);

  const services: Service[] = issues.map((issue: any) => {
    const quality = issueQualities[issue.id];
    return {
    id: issue.id,
    device_id: device.id,
      name: issue.name + (quality && issue.name.toLowerCase().includes('screen replacement') ? ` – ${quality === 'oem' ? 'OEM' : 'HQ'}` : ''),
    description: issue.description,
      base_price: 200, // You may want to fetch/set this dynamically
    part_qualities: [
        { tier: 'oem', price_multiplier: 1, warranty_days: 180 },
        { tier: 'hq', price_multiplier: 0.8, warranty_days: 90 }
    ]
    };
  });

  const handleIssueToggle = (issueId: string) => {
    const issue = issues.find((i: any) => i.id === issueId);
    if (!issue) return;
    if (selectedIssues.includes(issueId)) {
      setSelectedIssues(selectedIssues.filter(id => id !== issueId));
      setIssueQualities(prev => {
        const copy = { ...prev };
        delete copy[issueId];
        return copy;
      });
    } else {
      if (issue.name.toLowerCase().includes('screen replacement')) {
        setPendingQualityIssue(issueId);
        setShowPartDialog(true);
      } else {
        setSelectedIssues([...selectedIssues, issueId]);
      }
    }
  };

  const handlePartQualitySelect = (quality: 'oem' | 'hq') => {
    if (pendingQualityIssue) {
      setIssueQualities(prev => ({ ...prev, [pendingQualityIssue]: quality }));
      setSelectedIssues(prev => [...prev, pendingQualityIssue]);
      setPendingQualityIssue(null);
      setShowPartDialog(false);
    }
  };

  const handleContinue = () => {
    if (selectedIssues.length > 0) {
      // Build selectedIssues as array of { id, name, partType? }
      const selectedIssuesWithPartType = selectedIssues.map(issueId => {
        const issue = issues.find((i: any) => i.id === issueId);
        if (issue && issue.name.toLowerCase().includes('screen replacement')) {
          return { id: issueId, name: issue.name, partType: issueQualities[issueId] === 'oem' ? 'OEM' : 'HQ' };
        }
        return { id: issueId, name: issue ? issue.name : '' };
      });
      const selectedServices = services.filter((s) => selectedIssues.includes(s.id));
      // For screen replacement, pass the selected part quality
      const selectedPartQualities = selectedServices.map((s) => {
        if (s.name.toLowerCase().includes('screen replacement')) {
          const q = issueQualities[s.id];
          return s.part_qualities.find((pq) => pq.tier === q);
        }
        return s.part_qualities[0];
      }).filter((q): q is PartQuality => q !== undefined);
      onServiceSelect(selectedServices, selectedPartQualities, selectedIssuesWithPartType);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Select Service</h2>
              <p className="text-sm text-gray-600">
                {device.brand} {device.model}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-500">Loading services...</p>
            </div>
          </div>
        ) : issues.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No services found for this device category.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {services.map((service, idx) => {
              const isSelected = selectedIssues.includes(service.id);
              
              return (
                <Card 
                  key={service.id}
                  className={`cursor-pointer transition-all border-l-4 hover:shadow-sm ${
                    isSelected 
                      ? 'border-l-primary bg-primary/5 shadow-sm' 
                      : 'border-l-transparent hover:border-l-gray-300'
                  }`}
                  onClick={() => handleIssueToggle(service.id)}
                >
                  <CardContent className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      {/* Selection Icon */}
                      {isSelected ? (
                        <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      )}
                      
                      {/* Service Info */}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 text-sm lg:text-base">
                          {service.name}
                        </h3>
                        <p className="text-xs lg:text-sm text-gray-600 break-words">
                          {service.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Selected indicator */}
                    {isSelected && (
                      <div className="mt-2 pt-2 border-t border-primary/20">
                        <Badge variant="outline" className="text-xs text-primary bg-primary/10 border-primary/30">
                          Selected
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky Bottom Summary Bar */}
      {selectedIssues.length > 0 && !loading && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t z-20">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900">
                  {selectedIssues.length} service{selectedIssues.length === 1 ? '' : 's'} selected
                </div>
                <div className="text-sm text-gray-600">
                  Get quotes from verified providers
                </div>
              </div>
              <Button onClick={handleContinue} size="lg" className="px-6">
                Continue to Providers
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Part Quality Dialog for Screen Replacement */}
      <Dialog open={showPartDialog} onOpenChange={setShowPartDialog}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Select Part Quality for Screen Replacement</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-4">
            <Button className="w-full" type="button" onClick={() => handlePartQualitySelect('oem')}>OEM</Button>
            <Button className="w-full" type="button" onClick={() => handlePartQualitySelect('hq')}>HQ</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}