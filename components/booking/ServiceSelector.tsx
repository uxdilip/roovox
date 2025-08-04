"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronRight } from 'lucide-react';
import { Device, Service, PartQuality } from '@/types';
import { getIssuesByCategory } from '@/lib/appwrite-services';
import { databases, DATABASE_ID, COLLECTIONS } from '@/lib/appwrite';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
      const res = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.CATEGORIES,
        []
      );
      const categories = res.documents;
      const category = categories.find((c: any) => c.name.toLowerCase() === categoryName.toLowerCase());
      if (!category) {
        setIssues([]);
        setLoading(false);
        return;
      }
      const fetchedIssues = await getIssuesByCategory(category.$id);
      setIssues(fetchedIssues);
      setLoading(false);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Select Service</h2>
          <p className="text-muted-foreground">
            {device.brand} {device.model}
          </p>
        </div>
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
      </div>

      {loading ? (
        <div>Loading issues...</div>
      ) : (
      <div className="grid grid-cols-1 gap-4">
          {services.map((service, idx) => (
          <Card 
            key={service.id}
            className={`cursor-pointer transition-all ${
              selectedIssues.includes(service.id) ? 'ring-2 ring-primary' : 'hover:shadow-md'
            }`}
            onClick={() => handleIssueToggle(service.id)}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{service.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <Checkbox checked={selectedIssues.includes(service.id)} onCheckedChange={() => handleIssueToggle(service.id)} />
                <span>{service.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
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

      {selectedIssues.length > 0 && !loading && (
        <Button onClick={handleContinue} className="w-full mt-4" disabled={selectedIssues.length === 0}>
          Continue to Providers <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
      )}
    </div>
  );
}